import { z } from "zod";
import { MODALIDADES_COBRO } from "../../../shared/constants/modalidad-cobro.js";
import { TIPOS_DIA, TIPOS_JORNADA } from "../../../shared/constants/tarifa.js";
import { SERVICIOS_PLANTILLA_BOOLEANOS } from "./servicios-plantilla.constants.js";

function importBooleanSchema(defaultValue: "si" | "no") {
  return z
    .string()
    .trim()
    .transform((value) => (value.length === 0 ? defaultValue : value.toLowerCase()))
    .refine(
      (value) =>
        SERVICIOS_PLANTILLA_BOOLEANOS.includes(value as (typeof SERVICIOS_PLANTILLA_BOOLEANOS)[number]),
      { message: "Usá 'si' o 'no'" },
    )
    .transform((value) => value === "si");
}

export const servicioImportRowSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, "El nombre es obligatorio")
    .max(150, "El nombre no puede superar 150 caracteres"),
  descripcion: z
    .string()
    .trim()
    .max(5000, "La descripción no puede superar 5000 caracteres")
    .transform((value) => (value.length === 0 ? null : value)),
  estado: importBooleanSchema("si"),
  controlHorario: importBooleanSchema("no"),
  modoRelevo: importBooleanSchema("no"),
  modalidadCobro: z.enum(MODALIDADES_COBRO, {
    errorMap: () => ({
      message: "Elegí una modalidad de cobro de la lista desplegable",
    }),
  }),
  tipoJornada: z.enum(TIPOS_JORNADA, {
    errorMap: () => ({
      message: "Elegí un tipo de jornada de la lista desplegable",
    }),
  }),
  tipoDia: z.enum(TIPOS_DIA, {
    errorMap: () => ({
      message: "Elegí un tipo de día de la lista desplegable",
    }),
  }),
  valor: z.coerce.number().positive("El valor debe ser mayor a cero"),
});

export type ServicioImportRowInput = z.infer<typeof servicioImportRowSchema>;
