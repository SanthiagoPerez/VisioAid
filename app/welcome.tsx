import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { BackButton, SpokenGuideButton } from '@/accessibility/ScreenActions';
import { useSpokenGuidance } from '@/accessibility/useSpokenGuidance';

export default function WelcomeRoute() {
  const instructions =
    'Pantalla de bienvenida. Bienvenido a VisioAid. Toca Volver para regresar al inicio de sesión.';
  const guidance = useSpokenGuidance({ instructions });

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.actions}>
        <BackButton onPress={() => router.replace('/')} />
        <SpokenGuideButton onPress={() => guidance.speak(instructions)} />
      </View>
      <View style={styles.content}>
        <Text accessibilityRole="header" style={styles.title}>
          Bienvenido a VisioAid
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#000000' },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { color: '#FFFFFF', fontSize: 36, fontWeight: '800', textAlign: 'center' },
});
