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

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1).max(500),
});

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

export const logoutSchema = z.object({
  refreshToken: z.string().min(1).max(500).optional(),
});

export type LogoutInput = z.infer<typeof logoutSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email().max(150),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  email: z.string().email().max(150),
  code: z.string().regex(/^\d{6}$/, "El código debe tener 6 dígitos"),
  newPassword: z
    .string()
    .min(10)
    .max(72, "La contraseña no puede superar los 72 caracteres (límite de bcrypt)"),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
