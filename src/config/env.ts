import { z } from "zod";
import { parseDurationToMs } from "../shared/duration.js";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL es obligatoria"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET debe tener al menos 32 caracteres"),
  JWT_EXPIRES_IN: z.string().min(1).default("15m"),
  REFRESH_TOKEN_EXPIRES_IN: z.string().min(1).default("7d"),
  RESET_CODE_EXPIRES_IN: z.string().min(1).default("30m"),
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),
  /** Orígenes del front separados por coma. Ej: http://localhost:5173,https://app.tudominio.com */
  CORS_ORIGINS: z.string().optional(),
  /** Activar detrás de ngrok/nginx (1 hop). En development ya se activa solo. */
  TRUST_PROXY: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
  /** Secreto para endpoints internos de cron (Bearer). Mín. 32 caracteres en producción. */
  CRON_SECRET: z.string().min(32).optional(),
  /** Configuración SMTP para el envío de correos (recuperación de contraseña, etc.). */
  SMTP_HOST: z.string().min(1).optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: z.string().min(1).optional(),
  SMTP_PASS: z.string().min(1).optional(),
  /** Remitente que verá el usuario. Ej: "DYS Medicine <no-reply@dysassistance.com>" */
  MAIL_FROM: z.string().min(1).optional(),
});

type EnvConfig = z.infer<typeof envSchema>;

export type Env = EnvConfig & {
  REFRESH_TOKEN_EXPIRES_MS: number;
  RESET_CODE_EXPIRES_MS: number;
};

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("Variables de entorno inválidas:", parsed.error.flatten().fieldErrors);
    process.exit(1);
  }

  return {
    ...parsed.data,
    REFRESH_TOKEN_EXPIRES_MS: parseDurationToMs(parsed.data.REFRESH_TOKEN_EXPIRES_IN),
    RESET_CODE_EXPIRES_MS: parseDurationToMs(parsed.data.RESET_CODE_EXPIRES_IN),
  };
}

export const env = loadEnv();
