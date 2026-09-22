import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions, type CameraView as CameraViewType } from 'expo-camera';
import { File } from 'expo-file-system';
import { router } from 'expo-router';
import * as Speech from 'expo-speech';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSpokenGuidance } from '@/accessibility/useSpokenGuidance';
import { recognizeText } from '@/infrastructure/ocr/text-recognition.service';
import {
  getReadingHistory,
  saveReading,
  type ReadingHistoryEntry,
} from '@/infrastructure/storage/reading-history.service';

type ReaderState = 'camera' | 'processing' | 'result' | 'error';
type PlaybackState = 'idle' | 'playing' | 'paused';

const INITIAL_RATE = 0.82;
const MIN_RATE = 0.55;
const MAX_RATE = 1;
const RATE_STEP = 0.1;

function splitIntoSpeechChunks(text: string) {
  const sentences = text
    .match(/[^.!?\n]+[.!?\n]*/g)
    ?.map((item) => item.trim())
    .filter(Boolean);
  return sentences?.length ? sentences : [text];
}

export default function ReaderRoute() {
  const cameraRef = useRef<CameraViewType>(null);
  const speechRequestRef = useRef(0);
  const [permission, requestPermission] = useCameraPermissions();
  const [state, setState] = useState<ReaderState>('camera');
  const [recognizedText, setRecognizedText] = useState('');
  const [capturedImageUri, setCapturedImageUri] = useState<string>();
  const [status, setStatus] = useState('');
  const [history, setHistory] = useState<ReadingHistoryEntry[]>([]);
  const [playbackState, setPlaybackState] = useState<PlaybackState>('idle');
  const [speechRate, setSpeechRate] = useState(INITIAL_RATE);
  const [speechChunkIndex, setSpeechChunkIndex] = useState(0);
  const speechChunks = useMemo(() => splitIntoSpeechChunks(recognizedText), [recognizedText]);
  const previousReading = history.find((entry) => entry.text !== recognizedText);

  const guidance = useSpokenGuidance({
    instructions:
      state === 'result'
        ? 'Resultado de lectura. Usa los controles para leer, pausar, retroceder o cambiar la velocidad. Tus últimas lecturas se guardan solo en este dispositivo.'
        : 'Cámara de VisioAid. Apunta al texto y toca Tomar fotografía. La imagen se congela mientras se reconoce el texto.',
    status,
    suspendStatus: state === 'processing',
  });

  useEffect(() => {
    void getReadingHistory()
      .then(setHistory)
      .catch(() => undefined);
  }, []);

  useEffect(
    () => () => {
      speechRequestRef.current += 1;
      void Speech.stop();
    },
    [],
  );

  const stopReading = useCallback(() => {
    speechRequestRef.current += 1;
    void Speech.stop();
    setPlaybackState('idle');
  }, []);

  function readFrom(index: number, rate = speechRate) {
    if (!speechChunks.length || !recognizedText) return;
    const nextIndex = Math.max(0, Math.min(index, speechChunks.length - 1));
    const chunk = speechChunks[nextIndex];
    if (!chunk) return;
    const requestId = speechRequestRef.current + 1;
    speechRequestRef.current = requestId;
    void Speech.stop();
    setSpeechChunkIndex(nextIndex);
    setPlaybackState('playing');
    Speech.speak(chunk, {
      language: 'es-CO',
      rate,
      onDone: () => {
        if (speechRequestRef.current !== requestId) return;
        if (nextIndex + 1 < speechChunks.length) readFrom(nextIndex + 1, rate);
        else setPlaybackState('idle');
      },
      onError: () => {
        if (speechRequestRef.current === requestId) setPlaybackState('idle');
      },
    });
  }

  function togglePause() {
    if (playbackState === 'playing') {
      if (Platform.OS === 'android') {
        // Android no ofrece pausa nativa: se reanuda desde la frase actual.
        speechRequestRef.current += 1;
        void Speech.stop();
      } else {
        void Speech.pause();
      }
      setPlaybackState('paused');
      return;
    }
    if (playbackState === 'paused') {
      if (Platform.OS === 'android') readFrom(speechChunkIndex);
      else {
        void Speech.resume();
        setPlaybackState('playing');
      }
    }
  }

  function changeRate(change: number) {
    const nextRate = Math.max(
      MIN_RATE,
      Math.min(MAX_RATE, Number((speechRate + change).toFixed(2))),
    );
    if (nextRate === speechRate) return;
    setSpeechRate(nextRate);
    if (playbackState === 'playing') readFrom(speechChunkIndex, nextRate);
  }

  const captureAndRecognize = async () => {
    if (!cameraRef.current || state === 'processing') return;
    guidance.stop();
    stopReading();
    setState('processing');
    setStatus('Fotografía tomada. Reconociendo texto.');
    try {
      const picture = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      if (!picture?.uri) throw new Error('La cámara no devolvió una imagen.');
      // La cámara se desmonta y esta imagen fija queda visible durante todo el OCR.
      setCapturedImageUri(picture.uri);
      const text = await recognizeText(picture.uri);
      if (!text) {
        setState('error');
        setStatus(
          'No se encontró texto. Acerca la cámara, mejora la iluminación e inténtalo de nuevo.',
        );
        return;
      }
      setRecognizedText(text);
      setSpeechChunkIndex(0);
      setState('result');
      setStatus('Texto reconocido correctamente.');
      try {
        setHistory(await saveReading(text));
      } catch {
        // El texto ya fue reconocido; no impedimos leerlo si el almacenamiento local falla.
      }
    } catch (error) {
      setState('error');
      const message = error instanceof Error ? error.message : '';
      console.warn('OCR failed:', message);
      setStatus(
        message.includes('NativeModule') || message.includes('native module')
          ? 'El reconocimiento de texto no está disponible en Expo Go. Instala el development build de VisioAid para probar el OCR.'
          : 'No se pudo reconocer la fotografía. Comprueba el texto e inténtalo de nuevo.',
      );
    }
  };

  const discardCapturedImage = () => {
    if (!capturedImageUri) return;
    try {
      const temporaryFile = new File(capturedImageUri);
      if (temporaryFile.exists) temporaryFile.delete();
    } catch {
      // La foto es temporal; no bloqueamos el flujo si el sistema ya la eliminó.
    }
    setCapturedImageUri(undefined);
  };

  const resetReader = () => {
    stopReading();
    discardCapturedImage();
    setRecognizedText('');
    setStatus('');
    setState('camera');
  };

  const openHistoryReading = (entry: ReadingHistoryEntry) => {
    stopReading();
    discardCapturedImage();
    setRecognizedText(entry.text);
    setSpeechChunkIndex(0);
    setState('result');
    setStatus('Lectura recuperada del historial local.');
  };

  if (!permission) return <SafeAreaView style={styles.safe} />;
  if (!permission.granted)
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerContent}>
          <Text accessibilityRole="header" style={styles.title}>
            Permiso de cámara
          </Text>
          <Text style={styles.body}>
            VisioAid necesita la cámara para fotografiar y reconocer texto del entorno.
          </Text>
          <Button label="Permitir cámara" onPress={() => void requestPermission()} primary />
          <Button label="Volver" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );

  if (state === 'result')
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.resultContent}>
          <Text accessibilityRole="header" style={styles.title}>
            Texto reconocido
          </Text>
          <Text accessibilityRole="text" style={styles.resultText}>
            {recognizedText}
          </Text>
          <View accessibilityLabel="Controles de lectura" style={styles.player}>
            <Text style={styles.playerStatus}>
              {playbackState === 'playing'
                ? `Leyendo parte ${speechChunkIndex + 1} de ${speechChunks.length}`
                : playbackState === 'paused'
                  ? 'Lectura en pausa'
                  : 'Lectura detenida'}{' '}
              · Velocidad {speechRate.toFixed(2)}x
            </Text>
            <View style={styles.controlRow}>
              <SmallButton
                label="− velocidad"
                onPress={() => changeRate(-RATE_STEP)}
                disabled={speechRate <= MIN_RATE}
              />
              <SmallButton
                label="Retroceder"
                onPress={() => readFrom(Math.max(0, speechChunkIndex - 1))}
              />
              <SmallButton
                label={
                  playbackState === 'playing'
                    ? 'Pausar'
                    : playbackState === 'paused'
                      ? 'Reanudar'
                      : 'Leer'
                }
                onPress={playbackState === 'idle' ? () => readFrom(0) : togglePause}
                primary
              />
              <SmallButton
                label="+ velocidad"
                onPress={() => changeRate(RATE_STEP)}
                disabled={speechRate >= MAX_RATE}
              />
            </View>
            {playbackState !== 'idle' ? (
              <SmallButton label="Detener lectura" onPress={stopReading} />
            ) : null}
          </View>
          {previousReading ? (
            <Button
              label="Leer imagen anterior"
              accessibilityLabel="Abrir y leer la captura anterior guardada en este dispositivo"
              onPress={() => openHistoryReading(previousReading)}
            />
          ) : null}
          <Button label="Nueva captura" onPress={resetReader} />
        </ScrollView>
      </SafeAreaView>
    );

  if (state === 'error')
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerContent}>
          <Text accessibilityRole="header" style={styles.title}>
            No se pudo reconocer
          </Text>
          <Text accessibilityLiveRegion="polite" style={styles.body}>
            {status}
          </Text>
          <Button label="Intentar otra vez" onPress={resetReader} primary />
          {previousReading ? (
            <Button
              label="Leer imagen anterior"
              onPress={() => openHistoryReading(previousReading)}
            />
          ) : null}
          <Button label="Volver" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );

  return (
    <SafeAreaView style={styles.cameraSafe}>
      {state === 'processing' && capturedImageUri ? (
        <Image
          accessibilityLabel="Fotografía fija en procesamiento"
          source={{ uri: capturedImageUri }}
          style={styles.camera}
          resizeMode="contain"
        />
      ) : (
        <CameraView ref={cameraRef} style={styles.camera} facing="back" autofocus="on" />
      )}
      <View style={styles.cameraOverlay}>
        <Text accessibilityRole="header" style={styles.cameraTitle}>
          {state === 'processing' ? 'Leyendo la fotografía' : 'Apunta al texto'}
        </Text>
        {state === 'processing' ? (
          <ActivityIndicator
            accessibilityLabel="Procesando fotografía"
            color="#FFFFFF"
            size="large"
          />
        ) : null}
        {state === 'processing' ? (
          <Text style={styles.cameraHint}>Ya puedes mover el teléfono.</Text>
        ) : (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Tomar fotografía"
            onPress={() => void captureAndRecognize()}
            style={styles.captureButton}
          >
            <Text style={styles.captureText}>Tomar fotografía</Text>
          </TouchableOpacity>
        )}
        {state === 'camera' && previousReading ? (
          <Button
            label="Leer imagen anterior"
            onPress={() => openHistoryReading(previousReading)}
          />
        ) : null}
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Volver"
          onPress={() => router.back()}
          style={styles.cameraBackButton}
        >
          <Text style={styles.secondaryButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function Button({
  label,
  onPress,
  primary = false,
  accessibilityLabel,
}: {
  label: string;
  onPress: () => void;
  primary?: boolean;
  accessibilityLabel?: string;
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress}
      style={primary ? styles.primaryButton : styles.secondaryButton}
    >
      <Text style={primary ? styles.buttonText : styles.secondaryButtonText}>{label}</Text>
    </TouchableOpacity>
  );
}

function SmallButton({
  label,
  onPress,
  primary = false,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  primary?: boolean;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.smallButton,
        primary && styles.smallButtonPrimary,
        disabled && styles.disabledButton,
      ]}
    >
      <Text style={primary ? styles.smallButtonPrimaryText : styles.smallButtonText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#000000' },
  cameraSafe: { flex: 1, backgroundColor: '#000000' },
  camera: { flex: 1, width: '100%' },
  cameraOverlay: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    gap: 16,
    padding: 24,
    backgroundColor: '#000000',
  },
  cameraTitle: { color: '#FFFFFF', fontSize: 24, fontWeight: '800', textAlign: 'center' },
  cameraHint: { color: '#FFFFFF', fontSize: 18, textAlign: 'center' },
  captureButton: {
    minHeight: 56,
    justifyContent: 'center',
    paddingHorizontal: 24,
    borderWidth: 3,
    borderColor: '#000000',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  captureText: { color: '#000000', fontSize: 19, fontWeight: '800' },
  cameraBackButton: {
    minHeight: 52,
    justifyContent: 'center',
    paddingHorizontal: 24,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    borderRadius: 8,
    backgroundColor: '#000000',
  },
  centerContent: { flex: 1, justifyContent: 'center', gap: 22, padding: 24 },
  resultContent: { gap: 18, padding: 24, paddingBottom: 40 },
  title: { color: '#FFFFFF', fontSize: 30, fontWeight: '800' },
  body: { color: '#FFFFFF', fontSize: 19, lineHeight: 28 },
  resultText: {
    minHeight: 180,
    color: '#FFFFFF',
    fontSize: 21,
    lineHeight: 30,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    padding: 16,
  },
  player: { gap: 12, padding: 16, borderWidth: 2, borderColor: '#FFFFFF', borderRadius: 8 },
  playerStatus: { color: '#FFFFFF', fontSize: 16, lineHeight: 23, textAlign: 'center' },
  controlRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  primaryButton: {
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
  },
  secondaryButton: {
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  buttonText: { color: '#000000', fontSize: 18, fontWeight: '800' },
  secondaryButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  smallButton: {
    minHeight: 46,
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 6,
    paddingHorizontal: 12,
  },
  smallButtonPrimary: { backgroundColor: '#FFFFFF' },
  smallButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', textAlign: 'center' },
  smallButtonPrimaryText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  disabledButton: { opacity: 0.4 },
});
