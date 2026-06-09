import { z } from "zod";

export const registerSchema = z.object({
  nombre: z.string().min(1).max(100),
  email: z.string().email().max(150),
  password: z
    .string()
    .min(10)
    .max(72, "La contraseña no puede superar los 72 caracteres (límite de bcrypt)"),
});

export const loginSchema = z.object({
  email: z.string().email().max(150),
  password: z.string().min(1).max(200),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: z
    .string()
    .min(10)
    .max(72, "La contraseña no puede superar los 72 caracteres (límite de bcrypt)"),
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
