import { z } from "zod";
import {
  STOCK_PLANTILLA_BOOLEANOS,
  STOCK_PLANTILLA_UNIDADES_MEDIDA,
} from "./stock-plantilla.constants.js";

function importBooleanSchema(defaultValue: "si" | "no") {
  return z
    .string()
    .trim()
    .transform((value) => (value.length === 0 ? defaultValue : value.toLowerCase()))
    .refine(
      (value) =>
        STOCK_PLANTILLA_BOOLEANOS.includes(value as (typeof STOCK_PLANTILLA_BOOLEANOS)[number]),
      { message: "Usá 'si' o 'no'" },
    )
    .transform((value) => value === "si");
}

function importEnteroSchema(defaultValue: number) {
  return z
    .union([z.string(), z.number()])
    .transform((value) => {
      if (typeof value === "string" && value.trim().length === 0) {
        return defaultValue;
      }
      return value;
    })
    .pipe(z.coerce.number().int().min(0, "El valor no puede ser negativo"));
}

function parseFechaVencimiento(value: string | Date | undefined): Date | null {
  if (value === undefined) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

export const stockImportRowSchema = z
  .object({
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
    codigo: z
      .string()
      .trim()
      .min(1, "El código es obligatorio")
      .max(50, "El código no puede superar 50 caracteres"),
    stockActual: importEnteroSchema(0),
    stockMinimo: importEnteroSchema(0),
    unidadMedida: z
      .string()
      .trim()
      .toLowerCase()
      .pipe(
        z.enum(STOCK_PLANTILLA_UNIDADES_MEDIDA, {
          errorMap: () => ({
            message: "Elegí una unidad de medida de la lista desplegable",
          }),
        }),
      ),
    requiereVencimiento: importBooleanSchema("no"),
    fechaVencimiento: z
      .union([z.string(), z.date()])
      .optional()
      .transform((value) => parseFechaVencimiento(value)),
    estado: importBooleanSchema("si"),
  })
  .superRefine((data, ctx) => {
    if (data.requiereVencimiento && data.fechaVencimiento === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "fecha_vencimiento es obligatoria cuando requiere_vencimiento es 'si'",
        path: ["fechaVencimiento"],
      });
    }
  });

export type StockImportRowInput = z.infer<typeof stockImportRowSchema>;
