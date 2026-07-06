import { z } from "zod";
import { TELEFONO_MAX_LENGTH, TELEFONO_MAX_LENGTH_MESSAGE } from "../../../shared/constants/telefono.js";
import { PACIENTES_PLANTILLA_SEXOS } from "./pacientes-plantilla.constants.js";

const textoOpcional = (max: number, maxMessage: string) =>
  z.string().trim().max(max, maxMessage).default("");

export const pacienteImportRowSchema = z.object({
  obraSocial: z.string().trim().default(""),
  nombre: textoOpcional(100, "El nombre no puede superar 100 caracteres"),
  apellido: textoOpcional(100, "El apellido no puede superar 100 caracteres"),
  numeroDocumento: textoOpcional(20, "El número de documento no puede superar 20 caracteres"),
  fechaNacimiento: z.union([z.string(), z.date()]).optional(),
  sexo: z.string().trim().default(""),
  telefono: textoOpcional(TELEFONO_MAX_LENGTH, TELEFONO_MAX_LENGTH_MESSAGE),
  direccion: textoOpcional(255, "La dirección no puede superar 255 caracteres"),
  localidad: z.string().trim().default(""),
  numeroAfiliado: textoOpcional(50, "El número de afiliado no puede superar 50 caracteres"),
});

export type PacienteImportRowInput = z.infer<typeof pacienteImportRowSchema>;

export function isPacienteImportSexoValido(sexo: string): boolean {
  return PACIENTES_PLANTILLA_SEXOS.includes(sexo as (typeof PACIENTES_PLANTILLA_SEXOS)[number]);
}
