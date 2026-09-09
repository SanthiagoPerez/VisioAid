import { useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CameraView, useCameraPermissions, type CameraView as CameraViewType } from 'expo-camera';
import { File } from 'expo-file-system';
import { router } from 'expo-router';
import * as Speech from 'expo-speech';
import { SafeAreaView } from 'react-native-safe-area-context';
import { recognizeText } from '@/infrastructure/ocr/text-recognition.service';

import { useSpokenGuidance } from '@/accessibility/useSpokenGuidance';

type ReaderState = 'camera' | 'processing' | 'result' | 'error';

export default function ReaderRoute() {
  const cameraRef = useRef<CameraViewType>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [state, setState] = useState<ReaderState>('camera');
  const [recognizedText, setRecognizedText] = useState('');
  const [status, setStatus] = useState('');
  const guidance = useSpokenGuidance({
    instructions:
      state === 'result'
        ? 'Resultado de lectura. El texto reconocido aparece en pantalla. Toca Leer texto para escucharlo o Nueva captura para intentarlo otra vez.'
        : 'Cámara de VisioAid. Apunta al texto y toca Tomar fotografía para reconocerlo. También puedes volver a la pantalla anterior.',
    status,
    suspendStatus: state === 'processing',
  });

  const captureAndRecognize = async () => {
    if (!cameraRef.current || state === 'processing') return;

    guidance.stop();
    setState('processing');
    setStatus('Procesando la fotografía.');
    let imageUri: string | undefined;
    try {
      const picture = await cameraRef.current.takePictureAsync({ quality: 1 });
      imageUri = picture?.uri;
      if (!imageUri) throw new Error('La cámara no devolvió una imagen.');

      const text = await recognizeText(imageUri);
      if (!text) {
        setState('error');
        setStatus(
          'No se encontró texto. Acerca la cámara, mejora la iluminación e inténtalo de nuevo.',
        );
        return;
      }

      setRecognizedText(text);
      setState('result');
      setStatus('Texto reconocido correctamente.');
    } catch (error) {
      setState('error');
      const message = error instanceof Error ? error.message : '';
      console.warn('OCR failed:', message);
      setStatus(
        message.includes('NativeModule') || message.includes('native module')
          ? 'El reconocimiento de texto no está disponible en Expo Go. Instala el development build de VisioAid para probar el OCR.'
          : 'No se pudo reconocer la fotografía. Comprueba el texto e inténtalo de nuevo.',
      );
    } finally {
      if (imageUri) {
        try {
          const temporaryFile = new File(imageUri);
          if (temporaryFile.exists) temporaryFile.delete();
        } catch {
          // La captura es temporal; no bloqueamos el resultado si ya fue eliminada.
        }
      }
    }
  };

  const resetReader = () => {
    Speech.stop();
    setRecognizedText('');
    setStatus('');
    setState('camera');
  };

  if (!permission) return <SafeAreaView style={styles.safe} />;

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.permissionContent}>
          <Text accessibilityRole="header" style={styles.title}>
            Permiso de cámara
          </Text>
          <Text style={styles.body}>
            VisioAid necesita la cámara para fotografiar y reconocer texto del entorno.
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Permitir acceso a la cámara"
            onPress={() => void requestPermission()}
            style={styles.primaryButton}
          >
            <Text style={styles.buttonText}>Permitir cámara</Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Volver"
            onPress={() => router.back()}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (state === 'result') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.resultContent}>
          <Text accessibilityRole="header" style={styles.title}>
            Texto reconocido
          </Text>
          <Text accessibilityRole="text" style={styles.resultText}>
            {recognizedText}
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Leer texto en voz alta"
            onPress={() => void Speech.speak(recognizedText, { language: 'es-CO', rate: 0.82 })}
            style={styles.primaryButton}
          >
            <Text style={styles.buttonText}>Leer texto</Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Tomar nueva fotografía"
            onPress={resetReader}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>Nueva captura</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (state === 'error') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.permissionContent}>
          <Text accessibilityRole="header" style={styles.title}>
            No se pudo reconocer
          </Text>
          <Text accessibilityLiveRegion="polite" style={styles.body}>
            {status}
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Intentar otra vez"
            onPress={resetReader}
            style={styles.primaryButton}
          >
            <Text style={styles.buttonText}>Intentar otra vez</Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Volver"
            onPress={() => router.back()}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.cameraSafe}>
      <CameraView ref={cameraRef} style={styles.camera} facing="back" autofocus="on" />
      <View style={styles.cameraOverlay}>
        <Text accessibilityRole="header" style={styles.cameraTitle}>
          {state === 'processing' ? 'Reconociendo texto' : 'Apunta al texto'}
        </Text>
        {state === 'processing' ? (
          <ActivityIndicator
            accessibilityLabel="Procesando fotografía"
            color="#FFFFFF"
            size="large"
          />
        ) : null}
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Tomar fotografía"
          accessibilityState={{ busy: state === 'processing', disabled: state === 'processing' }}
          disabled={state === 'processing'}
          onPress={() => void captureAndRecognize()}
          style={styles.captureButton}
        >
          <Text style={styles.captureText}>Tomar fotografía</Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Volver"
          onPress={() => router.back()}
          style={styles.cameraBackButton}
        >
          <Text style={styles.buttonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#000000' },
  cameraSafe: { flex: 1, backgroundColor: '#000000' },
  camera: { flex: 1 },
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
  permissionContent: { flex: 1, justifyContent: 'center', gap: 22, padding: 24 },
  resultContent: { flex: 1, gap: 22, padding: 24 },
  title: { color: '#FFFFFF', fontSize: 30, fontWeight: '800' },
  body: { color: '#FFFFFF', fontSize: 19, lineHeight: 28 },
  resultText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 21,
    lineHeight: 30,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    padding: 16,
  },
  primaryButton: {
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  secondaryButton: {
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    borderRadius: 8,
  },
  buttonText: { color: '#000000', fontSize: 18, fontWeight: '800' },
  secondaryButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
});
