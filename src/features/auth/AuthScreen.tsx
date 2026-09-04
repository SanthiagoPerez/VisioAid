import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, router, type Href } from 'expo-router';
import type { ZodError } from 'zod';

import { BackButton, SpokenGuideButton } from '@/accessibility/ScreenActions';
import { useSpokenGuidance } from '@/accessibility/useSpokenGuidance';
import { authService, type SocialProvider } from '@/services/auth.service';
import { AuthField } from './AuthField';
import { loginSchema, registrationSchema } from './auth.schemas';
import { useNativeDictation } from './useNativeDictation';

type Mode = 'login' | 'register';
type FormValues = {
  name: string;
  age: string;
  email: string;
  password: string;
};
type FormErrors = Partial<Record<keyof FormValues, string>>;

const initialValues: FormValues = {
  name: '',
  age: '',
  email: '',
  password: '',
};

function normalizeDictatedEmail(value: string) {
  return value
    .toLocaleLowerCase('es-CO')
    .replace(/\bguion bajo\b/giu, '_')
    .replace(/\bguion\b/giu, '-')
    .replace(/\b(?:arroba|at)\b/giu, '@')
    .replace(/\b(?:punto|dot)\b/giu, '.')
    .replace(/\s+/g, '');
}

function normalizeDictatedPassword(value: string) {
  return value
    .replace(/\bguion bajo\b/giu, '_')
    .replace(/\bguion\b/giu, '-')
    .replace(/\b(?:arroba|at)\b/giu, '@')
    .replace(/\b(?:punto|dot)\b/giu, '.')
    .replace(/\s+/g, '');
}

function getFieldErrors(error: ZodError): FormErrors {
  let fieldErrors: FormErrors = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field !== 'string' || !(field in initialValues)) continue;
    const fieldName = field as keyof FormValues;
    if (!fieldErrors[fieldName]) {
      fieldErrors = { ...fieldErrors, [fieldName]: issue.message };
    }
  }
  return fieldErrors;
}

export function AuthScreen({ mode }: { mode: Mode }) {
  const isRegister = mode === 'register';
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const dictation = useNativeDictation();
  // `/register` is a route created in this change; casting keeps builds working
  // until Expo regenerates typed routes on the next dev-server start.
  const alternateRoute = (isRegister ? '/' : '/register') as Href;
  const update = (key: keyof FormValues) => (value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };
  const announcedStatus = isLoading ? 'Procesando, espera un momento.' : dictation.status || status;
  const instructions = isRegister
    ? 'Pantalla Crear cuenta. Hay cuatro campos: nombre, edad, correo electrónico y contraseña. Cada campo tiene un botón Dictar. Toca el campo para escribir o toca su botón Dictar para usar la voz. Por privacidad, dicta la contraseña solamente en un lugar seguro. Después toca Registrarse. Para regresar, toca Volver.'
    : 'Pantalla Inicio de sesión. Puedes continuar con Apple o Google. También puedes usar correo electrónico y contraseña. Toca el campo para escribir o toca Dictar junto a cada campo para usar la voz. Por privacidad, dicta la contraseña solamente en un lugar seguro. Después toca Iniciar sesión. Para registrarte, toca Crear una cuenta nueva.';
  const guidance = useSpokenGuidance({
    instructions,
    status: announcedStatus,
    suspendStatus: dictation.activeField !== null || dictation.isListening,
  });

  const dictate = (target: Parameters<typeof dictation.toggle>[0]) => {
    guidance.stop();
    void dictation.toggle(target);
  };

  const submit = async () => {
    dictation.clearStatus();
    setStatus('');
    setErrors({});

    const validation = isRegister
      ? registrationSchema.safeParse(values)
      : loginSchema.safeParse(values);
    if (!validation.success) {
      setErrors(getFieldErrors(validation.error));
      setStatus('Revisa los campos indicados antes de continuar.');
      return;
    }

    setIsLoading(true);
    try {
      if (isRegister) {
        const registration = registrationSchema.parse(values);
        await authService.register(registration);
      } else {
        const credentials = loginSchema.parse(values);
        await authService.signIn(credentials);
      }
      router.replace('/welcome' as Href);
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : 'No fue posible continuar. Inténtalo de nuevo.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const signInSocial = async (provider: SocialProvider) => {
    dictation.clearStatus();
    setStatus('');
    setIsLoading(true);
    try {
      await authService.signInWithProvider(provider);
      router.replace('/welcome' as Href);
    } catch {
      setStatus('No fue posible iniciar sesión. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={[styles.topActions, !isRegister && styles.topActionsEnd]}>
            {isRegister ? <BackButton onPress={() => router.replace('/' as Href)} /> : null}
            <SpokenGuideButton
              disabled={dictation.isListening}
              onPress={() => guidance.speak(instructions)}
            />
          </View>
          <Text accessibilityRole="header" style={styles.title}>
            {isRegister ? 'Crear cuenta' : 'Bienvenido a VisioAid'}
          </Text>
          <Text style={styles.intro}>
            {isRegister
              ? 'Completa estos datos para comenzar.'
              : 'Inicia sesión de la manera que te resulte más cómoda.'}
          </Text>
          <View accessibilityLiveRegion="polite" style={styles.status}>
            {isLoading ? (
              <View style={styles.loading}>
                <ActivityIndicator color="#FFFF00" />
                <Text style={styles.statusText}>Procesando, espera un momento.</Text>
              </View>
            ) : announcedStatus ? (
              <Text style={styles.statusText}>{announcedStatus}</Text>
            ) : null}
          </View>
          {!isRegister ? (
            <View style={styles.socialButtons}>
              <SocialButton
                provider="apple"
                disabled={isLoading}
                onPress={() => signInSocial('apple')}
              />
              <SocialButton
                provider="google"
                disabled={isLoading}
                onPress={() => signInSocial('google')}
              />
            </View>
          ) : null}
          {!isRegister ? (
            <Text accessibilityRole="header" style={styles.divider}>
              O usa tu correo electrónico
            </Text>
          ) : null}
          <View style={styles.form}>
            {isRegister ? (
              <>
                <AuthField
                  label="Nombre"
                  testID="name"
                  value={values.name}
                  onChangeText={update('name')}
                  error={errors.name}
                  autoComplete="name"
                  dictation={{
                    isListening: dictation.isListening && dictation.activeField === 'name',
                    disabled:
                      !dictation.isAvailable ||
                      (dictation.isListening && dictation.activeField !== 'name'),
                    disabledHint: !dictation.isAvailable
                      ? 'El dictado requiere abrir la aplicación con un development build.'
                      : undefined,
                    onPress: () =>
                      dictate({
                        id: 'name',
                        label: 'el nombre',
                        currentValue: values.name,
                        onResult: update('name'),
                      }),
                  }}
                />
                <AuthField
                  label="Edad"
                  testID="age"
                  value={values.age}
                  onChangeText={update('age')}
                  error={errors.age}
                  placeholder="Ejemplo: 65"
                  keyboardType="number-pad"
                  maxLength={3}
                  dictation={{
                    isListening: dictation.isListening && dictation.activeField === 'age',
                    disabled:
                      !dictation.isAvailable ||
                      (dictation.isListening && dictation.activeField !== 'age'),
                    disabledHint: !dictation.isAvailable
                      ? 'El dictado requiere abrir la aplicación con un development build.'
                      : undefined,
                    onPress: () =>
                      dictate({
                        id: 'age',
                        label: 'la edad',
                        currentValue: values.age,
                        onResult: update('age'),
                      }),
                  }}
                />
              </>
            ) : null}
            <AuthField
              label="Correo electrónico"
              testID="email"
              value={values.email}
              onChangeText={update('email')}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              dictation={{
                isListening: dictation.isListening && dictation.activeField === 'email',
                disabled:
                  !dictation.isAvailable ||
                  (dictation.isListening && dictation.activeField !== 'email'),
                disabledHint: !dictation.isAvailable
                  ? 'El dictado requiere abrir la aplicación con un development build.'
                  : undefined,
                onPress: () =>
                  dictate({
                    id: 'email',
                    label: 'el correo electrónico',
                    currentValue: values.email,
                    onResult: update('email'),
                    normalizeResult: normalizeDictatedEmail,
                  }),
              }}
            />
            <AuthField
              label="Contraseña"
              testID="password"
              value={values.password}
              onChangeText={update('password')}
              error={errors.password}
              secureTextEntry
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              accessibilityHint="Campo obligatorio. Puedes escribir la contraseña o dictarla en un lugar privado. Su contenido no se leerá en voz alta."
              dictation={{
                isListening: dictation.isListening && dictation.activeField === 'password',
                disabled:
                  !dictation.isAvailable ||
                  (dictation.isListening && dictation.activeField !== 'password'),
                disabledHint: !dictation.isAvailable
                  ? 'El dictado requiere abrir la aplicación con un development build.'
                  : undefined,
                onPress: () =>
                  dictate({
                    id: 'password',
                    label: 'la contraseña',
                    currentValue: values.password,
                    onResult: update('password'),
                    normalizeResult: normalizeDictatedPassword,
                  }),
              }}
            />
          </View>
          <Link href={alternateRoute} asChild>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={
                isRegister ? 'Ya tengo una cuenta, iniciar sesión' : 'Crear una cuenta nueva'
              }
              activeOpacity={0.72}
              style={styles.link}
            >
              <Text style={styles.linkText}>
                {isRegister ? 'Ya tengo una cuenta: iniciar sesión' : 'Crear una cuenta nueva'}
              </Text>
            </TouchableOpacity>
          </Link>
          <PrimaryButton
            label={isRegister ? 'Registrarse' : 'Iniciar sesión'}
            disabled={isLoading}
            onPress={submit}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function SocialButton({
  provider,
  disabled,
  onPress,
}: {
  provider: SocialProvider;
  disabled: boolean;
  onPress: () => void;
}) {
  const name = provider === 'apple' ? 'Apple' : 'Google';
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`Iniciar sesión con ${name}`}
      accessibilityState={{ disabled, busy: disabled }}
      activeOpacity={0.72}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.socialButton,
        provider === 'apple' ? styles.appleButton : styles.googleButton,
        disabled && styles.disabledButton,
      ]}
    >
      <FontAwesome name={provider} size={30} color="#000000" accessible={false} />
      <Text style={provider === 'apple' ? styles.appleButtonText : styles.googleButtonText}>
        Iniciar sesión con {name}
      </Text>
    </TouchableOpacity>
  );
}
function PrimaryButton({
  label,
  disabled,
  onPress,
}: {
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled, busy: disabled }}
      activeOpacity={0.72}
      disabled={disabled}
      onPress={onPress}
      style={[styles.button, styles.primaryButton, disabled && styles.disabledButton]}
    >
      <Text style={styles.primaryButtonText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#000000' },
  flex: { flex: 1 },
  content: { flexGrow: 1, gap: 18, padding: 24, paddingBottom: 40 },
  topActions: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  topActionsEnd: { justifyContent: 'flex-end' },
  title: { color: '#FFFFFF', fontSize: 34, fontWeight: '800', lineHeight: 42 },
  intro: { color: '#FFFFFF', fontSize: 21, lineHeight: 30 },
  status: { minHeight: 28 },
  loading: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  statusText: { color: '#FFFF00', fontSize: 18, fontWeight: '700', lineHeight: 25 },
  divider: { color: '#FFFFFF', fontSize: 20, fontWeight: '700', marginTop: 8 },
  form: { gap: 20 },
  socialButtons: { width: '100%', alignItems: 'center', gap: 14 },
  socialButton: {
    width: '100%',
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    borderRadius: 10,
    borderWidth: 3,
    paddingHorizontal: 18,
  },
  appleButton: { backgroundColor: '#FFFFFF', borderColor: '#FFFFFF' },
  googleButton: { backgroundColor: '#FFFFFF', borderColor: '#FFFFFF' },
  appleButtonText: {
    flexShrink: 1,
    color: '#000000',
    fontSize: 21,
    fontWeight: '800',
    textAlign: 'center',
  },
  googleButtonText: {
    flexShrink: 1,
    color: '#000000',
    fontSize: 21,
    fontWeight: '800',
    textAlign: 'center',
  },
  button: {
    width: '100%',
    minHeight: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 3,
    paddingHorizontal: 16,
  },
  primaryButton: { borderColor: '#FFFFFF', backgroundColor: '#FFFFFF' },
  primaryButtonText: { color: '#000000', fontSize: 24, fontWeight: '900', textAlign: 'center' },
  disabledButton: { borderStyle: 'dashed' },
  link: {
    width: '100%',
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 10,
  },
  linkText: {
    color: '#000000',
    fontSize: 19,
    fontWeight: '700',
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
});
