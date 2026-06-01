import { z } from "zod";

export const listEvolucionesClinicasQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  historiaClinicaId: z.coerce.number().int().positive().optional(),
});

export type ListEvolucionesClinicasQuery = z.output<typeof listEvolucionesClinicasQuerySchema>;

export const evolucionClinicaIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type EvolucionClinicaIdParam = z.infer<typeof evolucionClinicaIdParamSchema>;

export const createEvolucionClinicaSchema = z.object({
  historiaClinicaId: z.coerce.number().int().positive(),
  fecha: z.coerce.date(),
  observaciones: z.string().max(10000).optional().nullable(),
  medicacion: z.string().max(10000).optional().nullable(),
});

export type CreateEvolucionClinicaInput = z.infer<typeof createEvolucionClinicaSchema>;

export const updateEvolucionClinicaSchema = z.object({
  fecha: z.coerce.date().optional(),
  observaciones: z.string().max(10000).optional().nullable(),
  medicacion: z.string().max(10000).optional().nullable(),
});

export type UpdateEvolucionClinicaInput = z.infer<typeof updateEvolucionClinicaSchema>;
