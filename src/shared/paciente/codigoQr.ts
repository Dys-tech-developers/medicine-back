const CODIGO_QR_PREFIX = "PAC-";
const CODIGO_QR_PAD_LENGTH = 6;

export function formatPacienteCodigoQr(sequence: number): string {
  return `${CODIGO_QR_PREFIX}${String(sequence).padStart(CODIGO_QR_PAD_LENGTH, "0")}`;
}

export function parsePacienteCodigoQrSequence(codigoQr: string): number | null {
  if (!codigoQr.startsWith(CODIGO_QR_PREFIX)) {
    return null;
  }
  const numericPart = codigoQr.slice(CODIGO_QR_PREFIX.length);
  const parsed = Number.parseInt(numericPart, 10);
  if (Number.isNaN(parsed) || parsed < 1) {
    return null;
  }
  return parsed;
}
