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

function formatHoras(cantidadHoras: number): string {
  return cantidadHoras === 1 ? "1 hora" : `${cantidadHoras} horas`;
}

function buildText(visita: VisitaDetail, cantidadHoras: number): string {
  const { prestador, pacienteServicio } = visita;
  const paciente = pacienteServicio.paciente;

  return [
    `Hola ${prestador.user.nombre},`,
    "",
    `Tu visita fue cerrada automáticamente porque alcanzó el límite autorizado de ${formatHoras(cantidadHoras)}.`,
    "",
    `Paciente: ${paciente.nombre} ${paciente.apellido} (DNI ${paciente.numeroDocumento})`,
    `Servicio: ${pacienteServicio.servicio.nombre}`,
    `Inicio: ${formatFecha(visita.fechaInicio)}`,
    `Cierre automático: ${formatFecha(visita.fechaFin)}`,
    `Duración registrada: ${formatHoras(cantidadHoras)}`,
    "",
    "Si continuaste realizando la prestación después de este horario o detectás alguna diferencia, comunicate con administración.",
    "",
    "DYS Medicine",
  ].join("\n");
}

function buildHtml(visita: VisitaDetail, cantidadHoras: number): string {
  const { prestador, pacienteServicio } = visita;
  const paciente = pacienteServicio.paciente;

  const row = (label: string, value: string): string => `
    <tr>
      <td style="padding: 8px 12px; color: #6b7280; font-size: 14px; white-space: nowrap; vertical-align: top;">${label}</td>
      <td style="padding: 8px 12px; color: #1f2937; font-size: 14px; font-weight: 600;">${value}</td>
    </tr>`;

  return `
  <div style="font-family: Arial, Helvetica, sans-serif; max-width: 560px; margin: 0 auto; color: #1f2937;">
    <h2 style="color: #b45309; margin-bottom: 4px;">Visita cerrada automáticamente</h2>
    <p style="color: #6b7280; margin-top: 0;">Se alcanzó el límite de horas autorizadas</p>
    <p>Hola <strong>${prestador.user.nombre}</strong>,</p>
    <p>Tu visita fue cerrada automáticamente porque alcanzó el límite autorizado de <strong>${formatHoras(cantidadHoras)}</strong>. No fue una acción manual.</p>
    <table style="width: 100%; border-collapse: collapse; background: #fffbeb; border-radius: 8px; overflow: hidden; margin: 16px 0;">
      ${row("Paciente", `${paciente.nombre} ${paciente.apellido}`)}
      ${row("DNI", paciente.numeroDocumento)}
      ${row("Servicio", pacienteServicio.servicio.nombre)}
      ${row("Inicio", formatFecha(visita.fechaInicio))}
      ${row("Cierre automático", formatFecha(visita.fechaFin))}
      ${row("Duración registrada", formatHoras(cantidadHoras))}
    </table>
    <p style="color: #6b7280; font-size: 13px;">Si continuaste realizando la prestación después de este horario o detectás alguna diferencia, comunicate con administración.</p>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
    <p style="color: #9ca3af; font-size: 12px;">DYS Medicine</p>
  </div>`;
}

/**
 * Notifica al prestador que su visita se cerró automáticamente por superar el límite de horas.
 * Best-effort: nunca lanza; loguea el error para no interrumpir el cierre.
 */
export async function sendVisitaCerradaAutomaticamenteEmail(
  visita: VisitaDetail,
  cantidadHoras: number,
): Promise<void> {
  const to = visita.prestador.user.email;
  const paciente = visita.pacienteServicio.paciente;

  console.info(
    `[mail] sendVisitaCerradaAutomaticamenteEmail invocado para visita ${visita.id}. Datos:`,
    JSON.stringify({
      visitaId: visita.id,
      destinatario: to || "(sin email)",
      prestador: { id: visita.prestador.id, nombre: visita.prestador.user.nombre },
      paciente: `${paciente.nombre} ${paciente.apellido}`,
      cantidadHoras,
      fechaInicio: visita.fechaInicio.toISOString(),
      fechaFin: visita.fechaFin?.toISOString() ?? null,
      smtpConfigurado: isMailConfigured(),
    }),
  );

  if (!to) {
    console.warn(`[mail] Visita ${visita.id} sin email de prestador; no se envía notificación.`);
    return;
  }

  if (!isMailConfigured()) {
    if (env.NODE_ENV !== "production") {
      console.info(
        `[mail] (dev) Notificación de cierre automático de visita ${visita.id} para ${to} (SMTP no configurado).`,
      );
    } else {
      console.warn(
        `[mail] SMTP no configurado: no se envió la notificación de cierre automático de la visita ${visita.id}.`,
      );
    }
    return;
  }

  try {
    await sendMail({
      to,
      subject: "Visita cerrada automáticamente - DYS Medicine",
      text: buildText(visita, cantidadHoras),
      html: buildHtml(visita, cantidadHoras),
    });
    console.info(
      `[mail] Notificación de cierre automático de visita ${visita.id} enviada correctamente a ${to}.`,
    );
  } catch (error) {
    console.error(
      `[mail] Falló el envío de la notificación de cierre automático de la visita ${visita.id} a ${to}:`,
      error,
    );
  }
}
