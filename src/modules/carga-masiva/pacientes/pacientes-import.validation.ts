import { z } from "zod";
import { PACIENTES_PLANTILLA_SEXOS } from "./pacientes-plantilla.constants.js";

export const pacienteImportRowSchema = z.object({
  obraSocial: z
    .string()
    .trim()
    .min(1, "Elegí una obra social de la lista desplegable"),
  nombre: z
    .string()
    .trim()
    .min(1, "El nombre es obligatorio")
    .max(100, "El nombre no puede superar 100 caracteres"),
  apellido: z
    .string()
    .trim()
    .min(1, "El apellido es obligatorio")
    .max(100, "El apellido no puede superar 100 caracteres"),
  numeroDocumento: z
    .string()
    .trim()
    .min(1, "El número de documento es obligatorio")
    .max(20, "El número de documento no puede superar 20 caracteres"),
  fechaNacimiento: z.coerce.date({
    invalid_type_error: "La fecha de nacimiento no es válida. Usá el formato AAAA-MM-DD",
    required_error: "La fecha de nacimiento es obligatoria",
  }),
  sexo: z.enum(PACIENTES_PLANTILLA_SEXOS, {
    errorMap: () => ({
      message: "Elegí el sexo de la lista desplegable (M, F o X)",
    }),
  }),
  telefono: z
    .string()
    .trim()
    .min(1, "El teléfono es obligatorio")
    .max(20, "El teléfono no puede superar 20 caracteres"),
  direccion: z
    .string()
    .trim()
    .min(1, "La dirección es obligatoria")
    .max(255, "La dirección no puede superar 255 caracteres"),
  localidad: z
    .string()
    .trim()
    .min(1, "Elegí una localidad de la lista desplegable"),
  numeroAfiliado: z
    .string()
    .trim()
    .min(1, "El número de afiliado es obligatorio")
    .max(50, "El número de afiliado no puede superar 50 caracteres"),
});

export type PacienteImportRowInput = z.infer<typeof pacienteImportRowSchema>;
