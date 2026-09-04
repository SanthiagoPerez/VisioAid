import type { ComponentProps } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { DictationButton } from './DictationButton';

type Props = ComponentProps<typeof TextInput> & {
  label: string;
  error?: string;
  dictation?: {
    isListening: boolean;
    disabled: boolean;
    disabledHint?: string;
    onPress: () => void;
  };
};

export function AuthField({ label, error, dictation, value, onChangeText, ...inputProps }: Props) {
  return (
    <View style={styles.group}>
      <Text nativeID={`${inputProps.testID}-label`} style={styles.label}>
        {label}
      </Text>
      <View style={styles.inputRow}>
        <TextInput
          {...inputProps}
          value={value}
          onChangeText={onChangeText}
          style={[styles.input, error && styles.inputError]}
          accessibilityLabel={label}
          accessibilityHint={
            inputProps.accessibilityHint ??
            (error
              ? `Error: ${error}`
              : inputProps.secureTextEntry
                ? 'Campo obligatorio. Tu contraseña no se leerá en voz alta.'
                : 'Campo obligatorio.')
          }
          placeholderTextColor="#BDBDBD"
        />
        {dictation ? (
          <DictationButton
            fieldLabel={label}
            isListening={dictation.isListening}
            disabled={dictation.disabled}
            disabledHint={dictation.disabledHint}
            onPress={dictation.onPress}
          />
        ) : null}
      </View>
      {error ? (
        <Text
          nativeID={`${inputProps.testID}-error`}
          accessibilityRole="alert"
          style={styles.error}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: 8 },
  label: { color: '#FFFFFF', fontSize: 21, fontWeight: '700' },
  inputRow: { flexDirection: 'row', gap: 8, alignItems: 'stretch' },
  input: {
    flex: 1,
    minHeight: 56,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    color: '#FFFFFF',
    fontSize: 20,
    backgroundColor: '#000000',
  },
  inputError: { borderColor: '#FFFF00' },
  error: { color: '#FFFF00', fontSize: 18, fontWeight: '700' },
});
