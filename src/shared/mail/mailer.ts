import nodemailer, { type Transporter } from "nodemailer";
import { env } from "../../config/env.js";

let transporter: Transporter | null = null;

export function isMailConfigured(): boolean {
  return Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS && env.MAIL_FROM);
}

function getTransporter(): Transporter {
  if (!isMailConfigured()) {
    throw new Error(
      "SMTP no configurado: definí SMTP_HOST, SMTP_USER, SMTP_PASS y MAIL_FROM en el entorno.",
    );
  }

  transporter ??= nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    // 465 => TLS implícito; 587/otros => STARTTLS.
    secure: env.SMTP_PORT === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });

  return transporter;
}

interface SendMailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export async function sendMail(input: SendMailInput): Promise<void> {
  const transport = getTransporter();
  console.info(
    `[mail] Enviando via ${env.SMTP_HOST}:${env.SMTP_PORT} | from: ${env.MAIL_FROM} | to: ${input.to} | asunto: "${input.subject}"`,
  );
  await transport.sendMail({
    from: env.MAIL_FROM,
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
  });
}
