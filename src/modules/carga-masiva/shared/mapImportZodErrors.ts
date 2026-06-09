import type { ZodIssue } from "zod";

export interface ImportZodErrorItem {
  fila: number;
  campo: string;
  mensaje: string;
}

const ETIQUETAS_CAMPO: Record<string, string> = {
  nombre: "Nombre",
  apellido: "Apellido",
  email: "Email",
  password: "Contraseña",
  telefono: "Teléfono",
  lugar_residencia: "Lugar de residencia",
  documento: "Documento",
  matricula: "Matrícula",
  cuit: "CUIT",
  cbu: "CBU",
  regimen_iva: "Régimen de IVA",
  servicio_habilitado: "Servicio habilitado",
  obra_social: "Obra social",
  numero_documento: "Número de documento",
  fecha_nacimiento: "Fecha de nacimiento",
  sexo: "Sexo",
  direccion: "Dirección",
  localidad: "Localidad",
  numero_afiliado: "Número de afiliado",
};

function etiquetaCampo(campo: string): string {
  return ETIQUETAS_CAMPO[campo] ?? campo;
}

function esMensajeZodPorDefecto(mensaje: string): boolean {
  return (
    mensaje.startsWith("Invalid ") ||
    mensaje.startsWith("String must") ||
    mensaje.startsWith("Expected ") ||
    mensaje.includes("Invalid enum value") ||
    mensaje.includes("invalid_type_error") ||
    mensaje === "Required"
  );
}

function mensajePorCodigoZod(issue: ZodIssue, campo: string): string {
  const etiqueta = etiquetaCampo(campo);

  switch (issue.code) {
    case "too_small":
      if (issue.type === "string" && issue.minimum === 1) {
        return `${etiqueta} es obligatorio`;
      }
      if (issue.type === "string") {
        return `${etiqueta} debe tener al menos ${String(issue.minimum)} caracteres`;
      }
      return `${etiqueta} no cumple el valor mínimo permitido`;

    case "too_big":
      if (issue.type === "string") {
        return `${etiqueta} no puede superar ${String(issue.maximum)} caracteres`;
      }
      return `${etiqueta} supera el valor máximo permitido`;

    case "invalid_string":
      if (issue.validation === "email") {
        return "El email no tiene un formato válido";
      }
      return `${etiqueta} no tiene un formato válido`;

    case "invalid_enum_value":
      return `Elegí un valor de la lista desplegable en ${etiqueta}`;

    case "invalid_type":
      return `${etiqueta} es obligatorio`;

    case "invalid_date":
      return "La fecha de nacimiento no es válida. Usá el formato AAAA-MM-DD";

    default:
      return `${etiqueta} no es válido`;
  }
}

function normalizarMensaje(issue: ZodIssue, campo: string): string {
  if (!esMensajeZodPorDefecto(issue.message)) {
    return issue.message;
  }
  return mensajePorCodigoZod(issue, campo);
}

export function mapImportZodErrors(
  issues: ZodIssue[],
  fila: number,
  campoPorPath: Record<string, string>,
): ImportZodErrorItem[] {
  return issues.map((issue) => {
    const path = issue.path[0]?.toString() ?? "";
    const campo = campoPorPath[path] ?? path;

    return {
      fila,
      campo,
      mensaje: normalizarMensaje(issue, campo),
    };
  });
}
