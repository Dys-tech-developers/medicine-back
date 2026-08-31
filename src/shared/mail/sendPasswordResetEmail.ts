import { env } from "../../config/env.js";
import { isMailConfigured, sendMail } from "./mailer.js";

interface PasswordResetEmailInput {
  to: string;
  nombre: string;
  code: string;
}

function getExpiresMinutes(): number {
  return Math.max(1, Math.round(env.RESET_CODE_EXPIRES_MS / 60000));
}

function buildText(input: PasswordResetEmailInput, minutes: number): string {
  return [
    `Hola ${input.nombre},`,
    "",
    "Recibimos una solicitud para restablecer tu contraseña.",
    `Tu código de verificación es: ${input.code}`,
    `El código vence en ${minutes} minutos.`,
    "",
    "Si no solicitaste este cambio, podés ignorar este correo.",
    "",
    "DYS Medicine",
  ].join("\n");
}

function buildHtml(input: PasswordResetEmailInput, minutes: number): string {
  return `
  <div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto; color: #1f2937;">
    <h2 style="color: #0f766e; margin-bottom: 8px;">Restablecer contraseña</h2>
    <p>Hola <strong>${input.nombre}</strong>,</p>
    <p>Recibimos una solicitud para restablecer tu contraseña. Usá el siguiente código:</p>
    <div style="text-align: center; margin: 24px 0;">
      <span style="display: inline-block; font-size: 32px; letter-spacing: 8px; font-weight: bold; background: #f0fdfa; color: #0f766e; padding: 16px 24px; border-radius: 8px;">
        ${input.code}
      </span>
    </div>
    <p style="color: #6b7280; font-size: 14px;">El código vence en ${minutes} minutos.</p>
    <p style="color: #6b7280; font-size: 14px;">Si no solicitaste este cambio, podés ignorar este correo de forma segura.</p>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
    <p style="color: #9ca3af; font-size: 12px;">DYS Medicine</p>
  </div>`;
}

export async function sendPasswordResetEmail(input: PasswordResetEmailInput): Promise<void> {
  const minutes = getExpiresMinutes();

  if (!isMailConfigured()) {
    if (env.NODE_ENV === "production") {
      throw new Error("SMTP no configurado: no se puede enviar el email de recuperación.");
    }
    console.info(
      `[mail] Código de restablecimiento para ${input.to} (${input.nombre}): ${input.code}`,
    );
    return;
  }

  await sendMail({
    to: input.to,
    subject: "Restablecer tu contraseña - DYS Medicine",
    text: buildText(input, minutes),
    html: buildHtml(input, minutes),
  });
}
