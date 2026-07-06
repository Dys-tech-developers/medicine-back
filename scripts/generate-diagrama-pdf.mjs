import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const docsDir = path.join(__dirname, "..", "docs");
const pdfPath = path.join(docsDir, "diagrama-flujo-visitas.pdf");
const pngPath = path.join(docsDir, "diagrama-flujo-visitas.png");

const pdfDoc = await PDFDocument.create();
const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

const margin = 50;
const pageWidth = 595.28;
const pageHeight = 841.89;
const contentWidth = pageWidth - margin * 2;

function addPage() {
  return pdfDoc.addPage([pageWidth, pageHeight]);
}

function drawText(page, text, x, y, options = {}) {
  const size = options.size ?? 11;
  const usedFont = options.bold ? fontBold : font;
  page.drawText(text, {
    x,
    y,
    size,
    font: usedFont,
    color: rgb(0.1, 0.1, 0.1),
    maxWidth: options.maxWidth,
    lineHeight: options.lineHeight ?? size * 1.35,
  });
}

function wrapLines(text, maxChars) {
  const words = text.split(" ");
  const lines = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawParagraph(page, text, x, y, maxWidth, size = 10) {
  const maxChars = Math.floor(maxWidth / (size * 0.52));
  const lines = wrapLines(text, maxChars);
  let cursorY = y;
  for (const line of lines) {
    page.drawText(line, { x, y: cursorY, size, font, color: rgb(0.15, 0.15, 0.15) });
    cursorY -= size * 1.4;
  }
  return cursorY - 6;
}

// --- Página 1: título + diagrama ---
let page = addPage();
let y = pageHeight - margin;

drawText(page, "Flujo de visitas domiciliarias", margin, y, { size: 18, bold: true });
y -= 22;
drawText(page, "Medicine — resumen operativo (asignacion, QR, visita, cobro)", margin, y, {
  size: 10,
});
y -= 24;
drawText(page, "Diagrama principal", margin, y, { size: 12, bold: true });
y -= 12;

const pngBytes = fs.readFileSync(pngPath);
const pngImage = await pdfDoc.embedPng(pngBytes);
const pngDims = pngImage.scale(1);
const scale = Math.min(contentWidth / pngDims.width, (y - margin - 20) / pngDims.height);
const imgWidth = pngDims.width * scale;
const imgHeight = pngDims.height * scale;
const imgX = margin + (contentWidth - imgWidth) / 2;

page.drawImage(pngImage, {
  x: imgX,
  y: y - imgHeight,
  width: imgWidth,
  height: imgHeight,
});

// --- Página 2: tablas y notas ---
page = addPage();
y = pageHeight - margin;

drawText(page, "Piezas del sistema", margin, y, { size: 12, bold: true });
y -= 18;

const piezas = [
  ["Paciente", "Persona atendida en domicilio. Tiene codigo QR."],
  [
    "Asignacion",
    "Autorizacion: servicio, horas (cantidadHoras), cupo, cuidadora titular (opcional), vigencia.",
  ],
  ["Visita", "Turno concreto: quien fue, cuando, cuanto duro, cuanto se cobra."],
  ["Control horario", "Doble escaneo QR: iniciar al llegar, finalizar al irse."],
];

for (const [concepto, desc] of piezas) {
  drawText(page, concepto, margin, y, { size: 10, bold: true });
  y = drawParagraph(page, desc, margin + 110, y, contentWidth - 110, 10);
  y -= 4;
  if (y < margin + 40) {
    page = addPage();
    y = pageHeight - margin;
  }
}

y -= 8;
drawText(page, "Casos frecuentes", margin, y, { size: 12, bold: true });
y -= 16;

const casos = [
  ["Turno normal (8 h)", "Inicio, fin manual y cobro segun tarifa."],
  [
    "Olvido de cierre",
    "Cierre automatico al llegar cantidadHoras; respaldo al escanear QR o cron externo.",
  ],
  [
    "Cierra tarde",
    "Factura como maximo las horas de la asignacion.",
  ],
  [
    "Suplencia (Maria / Matilde)",
    "Si la asignacion fija titular, la suplente no puede iniciar. Operador debe cambiar prestador o usar asignacion sin titular fijo.",
  ],
  ["Cupo agotado", "No permite otra visita en ese periodo (excepto modalidad por hora)."],
];

for (const [situacion, accion] of casos) {
  drawText(page, situacion, margin, y, { size: 10, bold: true });
  y = drawParagraph(page, accion, margin + 130, y, contentWidth - 130, 10);
  y -= 6;
  if (y < margin + 60) {
    page = addPage();
    y = pageHeight - margin;
  }
}

y -= 6;
drawText(page, "Idea clave para reuniones", margin, y, { size: 12, bold: true });
y -= 16;

const ideas = [
  "Una visita es quien fue + bajo que asignacion (horas y reglas de cobro).",
  "Las horas del cierre automatico salen de la asignacion usada, no de otra cuidadora que suplante.",
  "Cambios de persona: definir si los resuelve operaciones (hoy) o modulo de suplencias (futuro).",
];

for (const idea of ideas) {
  y = drawParagraph(page, `- ${idea}`, margin, y, contentWidth, 10);
}

y -= 10;
drawText(page, "Documento interno - Medicine Back", margin, Math.max(y, margin), { size: 9 });

const pdfBytes = await pdfDoc.save();
fs.writeFileSync(pdfPath, pdfBytes);
console.log(`PDF generado: ${pdfPath}`);
