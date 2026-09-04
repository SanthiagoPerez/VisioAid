import { useCallback, useEffect, useRef, useState } from 'react';
import { type NativeModule, requireOptionalNativeModule } from 'expo';
import type {
  ExpoSpeechRecognitionErrorCode,
  ExpoSpeechRecognitionNativeEventMap,
  ExpoSpeechRecognitionOptions,
} from 'expo-speech-recognition';

type SpeechRecognitionEvents = {
  [EventName in keyof ExpoSpeechRecognitionNativeEventMap]: (
    event: ExpoSpeechRecognitionNativeEventMap[EventName],
  ) => void;
};

type SpeechRecognitionModule = NativeModule<SpeechRecognitionEvents> & {
  addListener: <EventName extends keyof SpeechRecognitionEvents>(
    eventName: EventName,
    listener: SpeechRecognitionEvents[EventName],
  ) => { remove: () => void };
  start: (options: ExpoSpeechRecognitionOptions) => void;
  stop: () => void;
  abort: () => void;
  isRecognitionAvailable: () => boolean;
  requestPermissionsAsync: () => Promise<{ granted: boolean }>;
};

const nativeSpeechRecognition =
  requireOptionalNativeModule<SpeechRecognitionModule>('ExpoSpeechRecognition');

function useOptionalSpeechRecognitionEvent<EventName extends keyof SpeechRecognitionEvents>(
  eventName: EventName,
  listener: SpeechRecognitionEvents[EventName],
) {
  useEffect(() => {
    if (!nativeSpeechRecognition) return;
    const subscription = nativeSpeechRecognition.addListener(eventName, listener);
    return () => subscription.remove();
  }, [eventName, listener]);
}

type DictationTarget = {
  id: string;
  label: string;
  currentValue: string;
  onResult: (value: string) => void;
  normalizeResult?: (value: string) => string;
};

const errorMessages: Partial<Record<ExpoSpeechRecognitionErrorCode, string>> = {
  'not-allowed':
    'El permiso de micrófono o reconocimiento de voz está desactivado. Actívalo en los ajustes del dispositivo.',
  'no-speech': 'No se detectó voz. Acércate al micrófono e inténtalo de nuevo.',
  'speech-timeout': 'No se detectó voz a tiempo. Inténtalo de nuevo.',
  network: 'El servicio de reconocimiento necesita conexión. Revisa tu red e inténtalo de nuevo.',
  'audio-capture':
    'No fue posible acceder al micrófono. Revisa que otra aplicación no lo esté usando.',
  'language-not-supported':
    'El reconocimiento de voz en español no está disponible en este dispositivo.',
  'service-not-allowed':
    'El servicio de reconocimiento de voz no está disponible o está desactivado.',
  busy: 'El reconocimiento de voz está ocupado. Espera un momento e inténtalo de nuevo.',
  interrupted: 'El dictado fue interrumpido por otra función de audio del dispositivo.',
};

export function useNativeDictation() {
  const targetRef = useRef<DictationTarget | null>(null);
  const receivedResultRef = useRef(false);
  const [activeField, setActiveField] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState('');

  useOptionalSpeechRecognitionEvent('start', () => {
    setIsListening(true);
    setStatus(`Escuchando ${targetRef.current?.label ?? 'el campo'}. Habla ahora.`);
  });

  useOptionalSpeechRecognitionEvent('result', (event) => {
    const target = targetRef.current;
    const transcript = event.results[0]?.transcript.trim();
    if (!target || !event.isFinal || !transcript || receivedResultRef.current) return;

    receivedResultRef.current = true;
    const separator = target.currentValue.trim() ? ' ' : '';
    const dictatedValue = `${target.currentValue}${separator}${transcript}`;
    target.onResult(target.normalizeResult?.(dictatedValue) ?? dictatedValue);
    setStatus(`Texto dictado añadido a ${target.label}.`);
  });

  useOptionalSpeechRecognitionEvent('nomatch', () => {
    setStatus('No se pudo reconocer lo que dijiste. Inténtalo de nuevo.');
  });

  useOptionalSpeechRecognitionEvent('error', (event) => {
    if (event.error === 'aborted') return;
    setStatus(
      errorMessages[event.error] ?? 'Ocurrió un error durante el dictado. Inténtalo de nuevo.',
    );
    setIsListening(false);
    setActiveField(null);
  });

  useOptionalSpeechRecognitionEvent('end', () => {
    if (!receivedResultRef.current) {
      setStatus((current) => current || 'Dictado finalizado.');
    }
    setIsListening(false);
    setActiveField(null);
    targetRef.current = null;
  });

  useEffect(
    () => () => {
      nativeSpeechRecognition?.abort();
    },
    [],
  );

  const toggle = useCallback(
    async (target: DictationTarget) => {
      if (!nativeSpeechRecognition) {
        setStatus('El dictado está disponible al abrir la aplicación con un development build.');
        return;
      }

      if (isListening && activeField === target.id) {
        nativeSpeechRecognition.stop();
        return;
      }
      if (isListening) return;

      setActiveField(target.id);
      targetRef.current = target;
      receivedResultRef.current = false;
      setStatus('Preparando el dictado.');
      if (!nativeSpeechRecognition.isRecognitionAvailable()) {
        setStatus('El reconocimiento de voz no está disponible en este dispositivo.');
        setActiveField(null);
        targetRef.current = null;
        return;
      }

      try {
        const permission = await nativeSpeechRecognition.requestPermissionsAsync();
        if (!permission.granted) {
          setStatus(errorMessages['not-allowed'] ?? 'No se concedieron los permisos necesarios.');
          setActiveField(null);
          targetRef.current = null;
          return;
        }

        nativeSpeechRecognition.start({
          lang: 'es-CO',
          interimResults: false,
          continuous: false,
          maxAlternatives: 1,
          addsPunctuation: true,
          iosTaskHint: 'dictation',
        });
      } catch {
        setStatus('No fue posible iniciar el dictado. Inténtalo de nuevo.');
        setActiveField(null);
        targetRef.current = null;
      }
    },
    [activeField, isListening],
  );

  return {
    isAvailable: nativeSpeechRecognition !== null,
    activeField,
    isListening,
    status,
    clearStatus: () => setStatus(''),
    toggle,
  };
}
