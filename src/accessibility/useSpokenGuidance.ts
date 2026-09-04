import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import * as Speech from 'expo-speech';

type Options = {
  instructions: string;
  status?: string;
  suspendStatus?: boolean;
};

export function useSpokenGuidance({ instructions, status = '', suspendStatus = false }: Options) {
  const [screenReaderEnabled, setScreenReaderEnabled] = useState<boolean | null>(null);
  const speechRequest = useRef(0);
  const lastStatus = useRef('');

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isScreenReaderEnabled().then((enabled) => {
      if (mounted) setScreenReaderEnabled(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener('screenReaderChanged', (enabled) => {
      setScreenReaderEnabled(enabled);
    });
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  const stop = useCallback(() => {
    speechRequest.current += 1;
    void Speech.stop();
  }, []);

  const speak = useCallback(
    (message: string) => {
      if (!message.trim()) return;
      if (screenReaderEnabled) {
        AccessibilityInfo.announceForAccessibility(message);
        return;
      }
      if (screenReaderEnabled === null) return;

      const request = ++speechRequest.current;
      void Speech.stop().then(() => {
        if (speechRequest.current !== request) return;
        Speech.speak(message, {
          language: 'es-CO',
          rate: 0.82,
          pitch: 1,
          volume: 1,
          useApplicationAudioSession: false,
        });
      });
    },
    [screenReaderEnabled],
  );

  useEffect(() => {
    if (screenReaderEnabled === null) return;
    const timer = setTimeout(() => speak(instructions), 650);
    return () => clearTimeout(timer);
  }, [instructions, screenReaderEnabled, speak]);

  useEffect(() => {
    if (!status || suspendStatus || status === lastStatus.current) return;
    lastStatus.current = status;
    speak(status);
  }, [speak, status, suspendStatus]);

  useEffect(() => stop, [stop]);

  return { speak, stop };
}
