import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'VisioAid',
  slug: 'visioaid',
  version: '1.0.0',
  platforms: ['ios', 'android'],
  orientation: 'portrait',
  scheme: 'visioaid',
  userInterfaceStyle: 'dark',
  icon: './assets/images/icon.png',
  ios: {
    ...config.ios,
    supportsTablet: true,
    bundleIdentifier: 'com.visioaid.app',
    icon: './assets/expo.icon',
    infoPlist: {
      ...config.ios?.infoPlist,
      NSMicrophoneUsageDescription:
        'VisioAid necesita acceso al micrófono para convertir tu voz en texto en los formularios.',
    },
  },
  android: {
    ...config.android,
    package: 'com.visioaid.app',
    predictiveBackGestureEnabled: true,
    adaptiveIcon: {
      backgroundColor: '#000000',
      foregroundImage: './assets/images/android-icon-foreground.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
  },
  plugins: [
    'expo-router',
    [
      'expo-camera',
      {
        cameraPermission:
          'VisioAid necesita usar la cámara para capturar y reconocer el texto de tu entorno.',
        microphonePermission:
          'VisioAid necesita acceso al micrófono para convertir tu voz en texto en los formularios.',
        recordAudioAndroid: false,
        barcodeScannerEnabled: false,
      },
    ],
    'expo-secure-store',
    [
      'expo-speech-recognition',
      {
        microphonePermission:
          'VisioAid necesita acceso al micrófono para convertir tu voz en texto en los formularios.',
        speechRecognitionPermission:
          'VisioAid necesita usar el reconocimiento de voz para completar los formularios mediante dictado.',
        androidSpeechServicePackages: ['com.google.android.googlequicksearchbox'],
      },
    ],
    [
      'expo-splash-screen',
      {
        backgroundColor: '#000000',
        image: './assets/images/splash-icon.png',
        imageWidth: 96,
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
});
