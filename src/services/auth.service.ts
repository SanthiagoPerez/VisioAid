export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegistrationData extends LoginCredentials {
  name: string;
  age: number;
}

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
}

export interface AuthResponse {
  user: AuthenticatedUser;
  accessToken: string;
}

export type SocialProvider = 'apple' | 'google';

export interface AuthService {
  signIn(credentials: LoginCredentials): Promise<AuthResponse>;
  signInWithProvider(provider: SocialProvider): Promise<AuthResponse>;
  register(data: RegistrationData): Promise<AuthResponse>;
}

const mockDelay = () => new Promise<void>((resolve) => setTimeout(resolve, 450));

const toUser = (email: string, name = 'Persona usuaria'): AuthenticatedUser => ({
  id: 'mock-user-001',
  name,
  email,
});

/**
 * Temporary API adapter. Swap its methods for HTTP calls when the backend is ready;
 * screens depend only on the AuthService contract above.
 */
export const authService: AuthService = {
  async signIn({ email, password }) {
    await mockDelay();
    if (!email.includes('@') || password.length < 6) {
      throw new Error(
        'Revisa el correo y la contraseña. La contraseña debe tener al menos 6 caracteres.',
      );
    }
    return { user: toUser(email), accessToken: 'mock-access-token' };
  },

  async signInWithProvider(provider) {
    await mockDelay();
    return {
      user: toUser(`${provider}.user@visioaid.example`, `Usuario de ${provider}`),
      accessToken: 'mock-access-token',
    };
  },

  async register({ name, age, email, password }) {
    await mockDelay();
    if (
      !name.trim() ||
      !Number.isInteger(age) ||
      age <= 10 ||
      !email.includes('@') ||
      password.length < 6
    ) {
      throw new Error(
        'Completa todos los campos. La edad debe ser mayor a 10 años y la contraseña debe tener al menos 6 caracteres.',
      );
    }
    return { user: toUser(email, name.trim()), accessToken: 'mock-access-token' };
  },
};
