import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'VisioAid',
  slug: 'visioaid',
  version: '1.0.0',
  orientation: 'portrait',
  scheme: 'visioaid',
  userInterfaceStyle: 'dark',
  icon: './assets/images/icon.png',
  ios: {
    ...config.ios,
    supportsTablet: true,
    bundleIdentifier: 'com.visioaid.app',
    usesAppleSignIn: true,
    icon: './assets/expo.icon',
  },
  android: {
    ...config.android,
    package: 'com.visioaid.app',
    blockedPermissions: ['android.permission.RECORD_AUDIO'],
    predictiveBackGestureEnabled: true,
    adaptiveIcon: {
      backgroundColor: '#000000',
      foregroundImage: './assets/images/android-icon-foreground.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
  },
  web: {
    ...config.web,
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    [
      'expo-camera',
      {
        cameraPermission:
          'VisioAid necesita usar la cámara para capturar y reconocer el texto de tu entorno.',
        microphonePermission: false,
        recordAudioAndroid: false,
        barcodeScannerEnabled: false,
      },
    ],
    'expo-secure-store',
    'expo-web-browser',
    'expo-apple-authentication',
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
