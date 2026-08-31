import { env } from "../../config/env.js";
import type { VisitaDetail } from "../prisma-includes/visita.include.js";
import { isMailConfigured, sendMail } from "./mailer.js";

const TIME_ZONE = "America/Argentina/Buenos_Aires";

function formatFecha(date: Date | null): string {
  if (!date) {
    return "-";
  }
  return date.toLocaleString("es-AR", {
    timeZone: TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuracion(tiempoMinutos: number | null): string {
  if (tiempoMinutos === null || tiempoMinutos <= 0) {
    return "-";
  }
  const horas = Math.floor(tiempoMinutos / 60);
  const minutos = tiempoMinutos % 60;
  if (horas === 0) {
    return `${minutos} min`;
  }
  if (minutos === 0) {
    return `${horas} h`;
  }
  return `${horas} h ${minutos} min`;
}

function buildText(visita: VisitaDetail): string {
  const { prestador, pacienteServicio } = visita;
  const paciente = pacienteServicio.paciente;

  return [
    `Hola ${prestador.user.nombre},`,
    "",
    "Registramos la finalización de tu visita. Este es el detalle:",
    "",
    `Paciente: ${paciente.nombre} ${paciente.apellido} (DNI ${paciente.numeroDocumento})`,
    `Servicio: ${pacienteServicio.servicio.nombre}`,
    `Dirección: ${paciente.direccion}, ${paciente.localidad}`,
    `Inicio: ${formatFecha(visita.fechaInicio)}`,
    `Fin: ${formatFecha(visita.fechaFin)}`,
    `Duración: ${formatDuracion(visita.tiempoMinutos)}`,
    `Observaciones: ${visita.observaciones ?? "-"}`,
    "",
    "Si algo no coincide, comunicate con administración.",
    "",
    "DYS Medicine",
  ].join("\n");
}

function buildHtml(visita: VisitaDetail): string {
  const { prestador, pacienteServicio } = visita;
  const paciente = pacienteServicio.paciente;

  const row = (label: string, value: string): string => `
    <tr>
      <td style="padding: 8px 12px; color: #6b7280; font-size: 14px; white-space: nowrap; vertical-align: top;">${label}</td>
      <td style="padding: 8px 12px; color: #1f2937; font-size: 14px; font-weight: 600;">${value}</td>
    </tr>`;

  return `
  <div style="font-family: Arial, Helvetica, sans-serif; max-width: 560px; margin: 0 auto; color: #1f2937;">
    <h2 style="color: #0f766e; margin-bottom: 4px;">Visita finalizada</h2>
    <p style="color: #6b7280; margin-top: 0;">Comprobante de la visita realizada</p>
    <p>Hola <strong>${prestador.user.nombre}</strong>, registramos la finalización de tu visita. Este es el detalle:</p>
    <table style="width: 100%; border-collapse: collapse; background: #f9fafb; border-radius: 8px; overflow: hidden; margin: 16px 0;">
      ${row("Paciente", `${paciente.nombre} ${paciente.apellido}`)}
      ${row("DNI", paciente.numeroDocumento)}
      ${row("Servicio", pacienteServicio.servicio.nombre)}
      ${row("Dirección", `${paciente.direccion}, ${paciente.localidad}`)}
      ${row("Inicio", formatFecha(visita.fechaInicio))}
      ${row("Fin", formatFecha(visita.fechaFin))}
      ${row("Duración", formatDuracion(visita.tiempoMinutos))}
      ${row("Observaciones", visita.observaciones ?? "-")}
    </table>
    <p style="color: #6b7280; font-size: 13px;">Si algo no coincide, comunicate con administración.</p>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
    <p style="color: #9ca3af; font-size: 12px;">DYS Medicine</p>
  </div>`;
}

/**
 * Envía al prestador el comprobante de una visita finalizada.
 * Best-effort: nunca lanza; loguea el error para no interrumpir el cierre de la visita.
 */
export async function sendVisitaFinalizadaEmail(visita: VisitaDetail): Promise<void> {
  const to = visita.prestador.user.email;
  const paciente = visita.pacienteServicio.paciente;

  console.info(
    `[mail] sendVisitaFinalizadaEmail invocado para visita ${visita.id}. Datos:`,
    JSON.stringify({
      visitaId: visita.id,
      estado: visita.estado,
      destinatario: to || "(sin email)",
      prestador: { id: visita.prestador.id, nombre: visita.prestador.user.nombre },
      paciente: `${paciente.nombre} ${paciente.apellido} (DNI ${paciente.numeroDocumento})`,
      servicio: visita.pacienteServicio.servicio.nombre,
      fechaInicio: visita.fechaInicio.toISOString(),
      fechaFin: visita.fechaFin?.toISOString() ?? null,
      tiempoMinutos: visita.tiempoMinutos,
      smtpConfigurado: isMailConfigured(),
    }),
  );

  if (!to) {
    console.warn(`[mail] Visita ${visita.id} sin email de prestador; no se envía comprobante.`);
    return;
  }

  if (!isMailConfigured()) {
    if (env.NODE_ENV !== "production") {
      console.info(
        `[mail] (dev) Comprobante de visita ${visita.id} para ${to} (SMTP no configurado).`,
      );
    } else {
      console.warn(
        `[mail] SMTP no configurado: no se envió el comprobante de la visita ${visita.id}.`,
      );
    }
    return;
  }

  try {
    await sendMail({
      to,
      subject: "Comprobante de visita finalizada - DYS Medicine",
      text: buildText(visita),
      html: buildHtml(visita),
    });
    console.info(`[mail] Comprobante de visita ${visita.id} enviado correctamente a ${to}.`);
  } catch (error) {
    console.error(
      `[mail] Falló el envío del comprobante de la visita ${visita.id} a ${to}:`,
      error,
    );
  }
}
