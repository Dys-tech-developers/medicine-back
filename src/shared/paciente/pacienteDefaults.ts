import { randomUUID } from "node:crypto";
import { TELEFONO_MAX_LENGTH } from "../constants/telefono.js";
import { normalizeNumeroDocumento } from "./normalizeNumeroDocumento.js";

export const PACIENTE_VALOR_SIN_DATO = "N/A";
export const PACIENTE_OBRA_SOCIAL_SIN_DATO_CODIGO = "N/A";
export const PACIENTE_OBRA_SOCIAL_SIN_DATO_CODIGO_FALLBACK = "SIN-OS";
export const PACIENTE_SEXO_SIN_DATO = "X" as const;
/** Fecha centinela para pacientes sin fecha de nacimiento informada. */
export const PACIENTE_FECHA_NACIMIENTO_SIN_DATO = new Date("1900-01-01T12:00:00.000Z");

export function isPacienteValorSinDato(value: string): boolean {
  return value.trim() === PACIENTE_VALOR_SIN_DATO;
}

export function resolvePacienteTexto(
  value: string | undefined | null,
  maxLength?: number,
): string {
  const trimmed = (value ?? "").trim();
  const resolved = trimmed.length > 0 ? trimmed : PACIENTE_VALOR_SIN_DATO;
  if (maxLength !== undefined && resolved.length > maxLength) {
    return resolved.slice(0, maxLength);
  }
  return resolved;
}

export function resolvePacienteSexo(value: string | undefined | null): "M" | "F" | "X" {
  const normalized = (value ?? "").trim().toUpperCase();
  if (normalized === "M" || normalized === "F" || normalized === "X") {
    return normalized;
  }
  return PACIENTE_SEXO_SIN_DATO;
}

export function resolvePacienteFechaNacimiento(value: unknown): Date {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  const raw = String(value ?? "").trim();
  if (raw.length === 0) {
    return PACIENTE_FECHA_NACIMIENTO_SIN_DATO;
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return PACIENTE_FECHA_NACIMIENTO_SIN_DATO;
  }

  return parsed;
}

export function resolvePacienteNumeroDocumento(
  value: string | undefined | null,
  uniqueKey?: string,
): string {
  const normalized = normalizeNumeroDocumento(value ?? "");
  if (normalized.length > 0) {
    return normalized;
  }

  const suffix = (uniqueKey ?? randomUUID()).replace(/[^a-zA-Z0-9-]/g, "").slice(0, 12);
  return `${PACIENTE_VALOR_SIN_DATO}-${suffix || randomUUID().slice(0, 8)}`;
}

export interface PacienteCamposResueltos {
  nombre: string;
  apellido: string;
  numeroDocumento: string;
  fechaNacimiento: Date;
  sexo: "M" | "F" | "X";
  telefono: string;
  direccion: string;
  localidad: string;
  numeroAfiliado: string;
}

export function resolvePacienteCampos(input: {
  nombre?: string | undefined;
  apellido?: string | undefined;
  numeroDocumento?: string | undefined;
  fechaNacimiento?: unknown;
  sexo?: string | undefined;
  telefono?: string | undefined;
  direccion?: string | undefined;
  localidad?: string | undefined;
  numeroAfiliado?: string | undefined;
  uniqueDocumentKey?: string | undefined;
}): PacienteCamposResueltos {
  return {
    nombre: resolvePacienteTexto(input.nombre, 100),
    apellido: resolvePacienteTexto(input.apellido, 100),
    numeroDocumento: resolvePacienteNumeroDocumento(
      input.numeroDocumento,
      input.uniqueDocumentKey,
    ),
    fechaNacimiento: resolvePacienteFechaNacimiento(input.fechaNacimiento),
    sexo: resolvePacienteSexo(input.sexo),
    telefono: resolvePacienteTexto(input.telefono, TELEFONO_MAX_LENGTH),
    direccion: resolvePacienteTexto(input.direccion, 255),
    localidad: resolvePacienteTexto(input.localidad, 100),
    numeroAfiliado: resolvePacienteTexto(input.numeroAfiliado, 50),
  };
}
