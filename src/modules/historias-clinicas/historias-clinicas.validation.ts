import { z } from "zod";
import {
  hasClinicalData,
  HISTORIA_CLINICA_SIN_DATOS_MESSAGE,
} from "../../shared/historia-clinica/hasClinicalData.js";

export const listHistoriasClinicasQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  pacienteId: z.coerce.number().int().positive().optional(),
});

export type ListHistoriasClinicasQuery = z.output<typeof listHistoriasClinicasQuerySchema>;

export const historiaClinicaIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type HistoriaClinicaIdParam = z.infer<typeof historiaClinicaIdParamSchema>;

export const historiaClinicaPacienteIdParamSchema = z.object({
  pacienteId: z.coerce.number().int().positive(),
});

export type HistoriaClinicaPacienteIdParam = z.infer<typeof historiaClinicaPacienteIdParamSchema>;

const historiaClinicaFieldsSchema = {
  fechaCreacion: z.coerce.date(),
  antecedentes: z.string().max(10000).optional().nullable(),
  diagnosticoInicial: z.string().max(10000).optional().nullable(),
  medicacion: z.string().max(10000).optional().nullable(),
  alergias: z.string().max(10000).optional().nullable(),
  observaciones: z.string().max(10000).optional().nullable(),
};

export const createHistoriaClinicaSchema = z
  .object({
    pacienteId: z.coerce.number().int().positive(),
    ...historiaClinicaFieldsSchema,
  })
  .superRefine((data, ctx) => {
    if (!hasClinicalData(data)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: HISTORIA_CLINICA_SIN_DATOS_MESSAGE,
        path: ["diagnosticoInicial"],
      });
    }
  });

export type CreateHistoriaClinicaInput = z.infer<typeof createHistoriaClinicaSchema>;

export const updateHistoriaClinicaSchema = z
  .object({
    fechaCreacion: z.coerce.date().optional(),
    antecedentes: z.string().max(10000).optional().nullable(),
    diagnosticoInicial: z.string().max(10000).optional().nullable(),
    medicacion: z.string().max(10000).optional().nullable(),
    alergias: z.string().max(10000).optional().nullable(),
    observaciones: z.string().max(10000).optional().nullable(),
  })
  .superRefine((data, ctx) => {
    const clinicalFieldsProvided =
      data.antecedentes !== undefined ||
      data.diagnosticoInicial !== undefined ||
      data.medicacion !== undefined ||
      data.alergias !== undefined ||
      data.observaciones !== undefined;

    if (!clinicalFieldsProvided) {
      return;
    }

    if (!hasClinicalData(data)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: HISTORIA_CLINICA_SIN_DATOS_MESSAGE,
        path: ["diagnosticoInicial"],
      });
    }
  });

export type UpdateHistoriaClinicaInput = z.infer<typeof updateHistoriaClinicaSchema>;
