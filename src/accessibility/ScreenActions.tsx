import FontAwesome from '@expo/vector-icons/FontAwesome';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

type ActionProps = {
  onPress: () => void;
  disabled?: boolean;
};

export function BackButton({ onPress }: ActionProps) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel="Volver al inicio de sesión"
      accessibilityHint="Regresa a la pantalla de inicio de sesión."
      activeOpacity={0.72}
      onPress={onPress}
      style={styles.button}
    >
      <FontAwesome name="arrow-left" size={21} color="#000000" accessible={false} />
      <Text style={styles.label}>Volver</Text>
    </TouchableOpacity>
  );
}

export function SpokenGuideButton({ onPress, disabled = false }: ActionProps) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel="Escuchar instrucciones de esta pantalla"
      accessibilityHint="Lee nuevamente las acciones y campos disponibles."
      accessibilityState={{ disabled }}
      activeOpacity={0.72}
      disabled={disabled}
      onPress={onPress}
      style={[styles.button, disabled && styles.disabled]}
    >
      <FontAwesome name="volume-up" size={23} color="#000000" accessible={false} />
      <Text style={styles.label}>Escuchar guía</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    paddingHorizontal: 14,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  disabled: { borderStyle: 'dashed', opacity: 0.65 },
  label: { color: '#000000', fontSize: 17, fontWeight: '800' },
});
