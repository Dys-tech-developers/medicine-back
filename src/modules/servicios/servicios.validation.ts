import { z } from "zod";
import { createServicioTarifaSchema } from "../servicio-tarifas/servicio-tarifas.validation.js";

export const listServiciosQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().min(1).max(150).optional(),
  estado: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
});

export type ListServiciosQuery = z.output<typeof listServiciosQuerySchema>;

export const servicioIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type ServicioIdParam = z.infer<typeof servicioIdParamSchema>;

export const createServicioSchema = z.object({
  nombre: z.string().trim().min(1).max(150),
  descripcion: z.string().trim().max(5000).optional().nullable(),
  estado: z.boolean().default(true),
  controlHorario: z.boolean().default(false),
  tarifas: z
    .array(createServicioTarifaSchema)
    .min(1, "Debe incluir al menos una tarifa"),
});

export type CreateServicioInput = z.infer<typeof createServicioSchema>;

export const updateServicioSchema = z.object({
  nombre: z.string().trim().min(1).max(150).optional(),
  descripcion: z.string().trim().max(5000).optional().nullable(),
  controlHorario: z.boolean().optional(),
});

export type UpdateServicioInput = z.infer<typeof updateServicioSchema>;

export const updateServicioEstadoSchema = z.object({
  estado: z.boolean(),
});

export type UpdateServicioEstadoInput = z.infer<typeof updateServicioEstadoSchema>;
