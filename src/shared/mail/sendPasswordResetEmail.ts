import { env } from "../../config/env.js";

interface PasswordResetEmailInput {
  to: string;
  nombre: string;
  code: string;
}

export async function sendPasswordResetEmail(input: PasswordResetEmailInput): Promise<void> {
  if (env.NODE_ENV === "development") {
    console.info(
      `[mail] Código de restablecimiento para ${input.to} (${input.nombre}): ${input.code}`,
    );
    return;
  }

  // TODO: integrar proveedor de email (SMTP, Resend, SendGrid, etc.) en producción.
  console.warn(
    `[mail] Envío de email no configurado. Código de restablecimiento generado para ${input.to}`,
  );
}
