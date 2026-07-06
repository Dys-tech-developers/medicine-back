import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const docsDir = path.join(__dirname, "..", "docs");
const pdfPath = path.join(docsDir, "caso-cuidadoras-24x7-jose-martinez.pdf");

const pdfDoc = await PDFDocument.create();
const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

const margin = 48;
const pageWidth = 595.28;
const pageHeight = 841.89;
const contentWidth = pageWidth - margin * 2;
const lineH = 13;

let page = pdfDoc.addPage([pageWidth, pageHeight]);
let y = pageHeight - margin;

function newPageIf(needed = 80) {
  if (y < margin + needed) {
    page = pdfDoc.addPage([pageWidth, pageHeight]);
    y = pageHeight - margin;
  }
}

function text(str, opts = {}) {
  const size = opts.size ?? 10;
  const f = opts.bold ? fontBold : font;
  newPageIf(lineH * 2);
  page.drawText(str, {
    x: margin,
    y,
    size,
    font: f,
    color: rgb(0.1, 0.1, 0.1),
    maxWidth: contentWidth,
  });
  y -= opts.gap ?? size + 6;
}

function paragraph(str, size = 9.5) {
  const maxChars = Math.floor(contentWidth / (size * 0.5));
  const words = str.split(" ");
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) {
      newPageIf();
      page.drawText(line, { x: margin, y, size, font, maxWidth: contentWidth });
      y -= lineH;
      line = word;
    } else {
      line = next;
    }
  }
  if (line) {
    newPageIf();
    page.drawText(line, { x: margin, y, size, font, maxWidth: contentWidth });
    y -= lineH + 4;
  }
}

function section(title) {
  y -= 6;
  newPageIf(40);
  text(title, { size: 11, bold: true, gap: 14 });
}

function tableRow(cols, widths, bold = false) {
  newPageIf();
  let x = margin;
  const size = 8.5;
  const f = bold ? fontBold : font;
  let rowHeight = lineH;
  const linesPerCol = cols.map((col, i) => {
    const w = widths[i];
    const maxChars = Math.max(8, Math.floor(w / (size * 0.48)));
    const words = col.split(" ");
    const lines = [];
    let line = "";
    for (const word of words) {
      const next = line ? `${line} ${word}` : word;
      if (next.length > maxChars && line) {
        lines.push(line);
        line = word;
      } else {
        line = next;
      }
    }
    if (line) lines.push(line);
    return lines;
  });
  rowHeight = Math.max(...linesPerCol.map((l) => l.length)) * (lineH - 1) + 4;
  newPageIf(rowHeight + 10);
  for (let row = 0; row < Math.max(...linesPerCol.map((l) => l.length)); row++) {
    x = margin;
    for (let i = 0; i < cols.length; i++) {
      const line = linesPerCol[i][row] ?? "";
      page.drawText(line, { x, y, size, font: f, maxWidth: widths[i] });
      x += widths[i];
    }
    y -= lineH - 1;
  }
  y -= 4;
}

// --- Content ---
text("Caso practico: cuidadoras 24/7", { size: 16, bold: true, gap: 18 });
text("Paciente: Jose Martinez  |  Medicine - reunion de negocio", { size: 9, gap: 16 });

section("1. Situacion");
paragraph(
  "El paciente necesita cobertura de cuidadoras las 24 horas. En un mismo dia pueden ir 3 cuidadoras en turnos distintos. El formulario actual asigna servicio y autorizacion, pero NO define jornadas (quien va de 6 a 14, etc.).",
);

section("2. Tres capas (separar conceptos)");
tableRow(
  ["Capa", "Que es", "Donde hoy"],
  [70, 200, contentWidth - 270],
  true,
);
tableRow(
  ["Autorizacion", "Jose tiene derecho a cuidadoras todo el dia", "Formulario Asignar servicio"],
  [70, 200, contentWidth - 270],
);
tableRow(
  ["Turno / jornada", "Maria 6-14, Matilde 14-22, Ana 22-6", "Planilla operaciones (fuera del sistema)"],
  [70, 200, contentWidth - 270],
);
tableRow(["Visita real", "QR al entrar y salir", "App prestador"], [70, 200, contentWidth - 270]);

section("3. Error frecuente");
paragraph(
  'Cantidad permitida 24 + periodo diario NO son 24 horas: son hasta 24 VISITAS por dia. Prestador fijo Maria implica que solo Maria inicia en esa asignacion. Para 3 turnos usar cantidad permitida 3, no 24.',
);

section("4. Propuesta A (recomendada para empezar)");
paragraph("Una asignacion + planilla de turnos externa.");
tableRow(["Campo", "Valor"], [140, contentWidth - 140], true);
tableRow(["Servicio", "Cuidadoras / Enfermeria"], [140, contentWidth - 140]);
tableRow(["Prestador", "Vacio (rotativo)"], [140, contentWidth - 140]);
tableRow(["Periodo", "Diario"], [140, contentWidth - 140]);
tableRow(["Cantidad permitida", "3 (tres turnos = tres visitas)"], [140, contentWidth - 140]);
tableRow(["Modalidad", "Por hora"], [140, contentWidth - 140]);
tableRow(["Cantidad horas", "8 por turno (tope + auto-cierre)"], [140, contentWidth - 140]);

section("5. Planilla de turnos (ejemplo lunes)");
tableRow(["Turno", "Horario", "Cuidadora"], [80, 120, contentWidth - 200], true);
tableRow(["Manana", "06:00 - 14:00", "Maria Gimenez"], [80, 120, contentWidth - 200]);
tableRow(["Tarde", "14:00 - 22:00", "Matilde Lopez"], [80, 120, contentWidth - 200]);
tableRow(["Noche", "22:00 - 06:00", "Ana Ruiz"], [80, 120, contentWidth - 200]);

section("6. Flujo del dia en la app");
tableRow(["Hora", "Accion"], [80, contentWidth - 80], true);
tableRow(["~06:00", "Maria escanea QR - Iniciar visita"], [80, contentWidth - 80]);
tableRow(["~14:00", "Maria escanea - Finalizar"], [80, contentWidth - 80]);
tableRow(["~14:05", "Matilde escanea - Iniciar"], [80, contentWidth - 80]);
tableRow(["~22:00", "Matilde - Finalizar"], [80, contentWidth - 80]);
tableRow(["~22:10", "Ana escanea - Iniciar"], [80, contentWidth - 80]);
tableRow(["~06:00+1", "Ana - Finalizar"], [80, contentWidth - 80]);

section("7. Propuesta B (alternativa)");
paragraph(
  "Tres asignaciones para el mismo paciente: turno manana (Maria, 1 visita/dia, 8h), turno tarde (Matilde), turno noche (Ana). Mas claro por cuidadora; mas registros al cargar.",
);

section("8. Preguntas para decidir en la reunion");
paragraph("1. Cuantas visitas por dia: 3 fijas o variable con refuerzo?");
paragraph("2. Modelo: A (una asignacion) o B (tres asignaciones)?");
paragraph("3. Duracion turno: 8h fijas o variable?");
paragraph("4. Dos visitas abiertas a la vez en el mismo paciente: permitir o bloquear?");
paragraph("5. Planilla de turnos en la app: fase 2 si o no?");

section("9. Decision");
text("Modelo elegido:  [ ] A   [ ] B   [ ] Otro", { size: 10, gap: 14 });
text("Visitas/dia autorizadas: _______________", { size: 10, gap: 14 });
text("Horas max por turno: _______________", { size: 10, gap: 14 });
text("Responsable planilla: _______________", { size: 10, gap: 14 });
y -= 20;
text("Notas:", { size: 10, bold: true, gap: 12 });
for (let i = 0; i < 4; i++) {
  page.drawLine({
    start: { x: margin, y },
    end: { x: pageWidth - margin, y },
    thickness: 0.5,
    color: rgb(0.7, 0.7, 0.7),
  });
  y -= 22;
}

text("Documento interno - Medicine", { size: 8, gap: 8 });

const pdfBytes = await pdfDoc.save();
fs.writeFileSync(pdfPath, pdfBytes);
console.log(`PDF generado: ${pdfPath}`);
