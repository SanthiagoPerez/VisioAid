import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

type Props = {
  fieldLabel: string;
  isListening: boolean;
  disabled: boolean;
  disabledHint?: string;
  onPress: () => void;
};

export function DictationButton({
  fieldLabel,
  isListening,
  disabled,
  disabledHint,
  onPress,
}: Props) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`${isListening ? 'Detener dictado' : 'Dictar'} ${fieldLabel}`}
      accessibilityHint={
        disabled
          ? (disabledHint ?? 'Finaliza el dictado del otro campo antes de continuar.')
          : 'El texto reconocido se añadirá al campo.'
      }
      accessibilityState={{ disabled, busy: isListening }}
      activeOpacity={0.72}
      disabled={disabled}
      onPress={onPress}
      style={[styles.button, isListening && styles.listening, disabled && styles.disabled]}
    >
      <FontAwesome
        name={isListening ? 'stop' : 'microphone'}
        size={22}
        color="#000000"
        accessible={false}
      />
      <Text style={styles.label}>{isListening ? 'Detener dictado' : 'Dictar'}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    paddingHorizontal: 16,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  listening: { borderColor: '#FFFF00', backgroundColor: '#FFFFFF' },
  disabled: { borderStyle: 'dashed' },
  label: { color: '#000000', fontSize: 18, fontWeight: '700' },
});
