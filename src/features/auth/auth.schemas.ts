import { z } from 'zod';

const emailSchema = z
  .string()
  .trim()
  .min(1, 'Ingresa tu correo electrónico.')
  .email('Ingresa un correo electrónico válido.');

const passwordSchema = z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.');

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const registrationSchema = z.object({
  name: z.string().trim().min(1, 'Ingresa tu nombre.'),
  age: z
    .string()
    .trim()
    .min(1, 'Ingresa tu edad.')
    .refine(
      (value) => Number.isInteger(Number(value)) && Number(value) > 10,
      'La edad debe ser mayor a 10 años.',
    )
    .transform(Number),
  email: emailSchema,
  password: passwordSchema,
});
