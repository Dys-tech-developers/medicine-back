import QRCode from "qrcode";

export async function generatePacienteQrDataUrl(codigoQr: string): Promise<string> {
  return QRCode.toDataURL(codigoQr, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 280,
  });
}
