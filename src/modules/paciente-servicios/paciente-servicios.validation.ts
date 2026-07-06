import { z } from "zod";
import { PACIENTE_SERVICIO_ESTADOS } from "../../shared/constants/paciente-servicio-estado.js";
import { MODALIDADES_COBRO } from "../../shared/constants/modalidad-cobro.js";
import { PERIODOS_CONTROL } from "../../shared/constants/periodo-control.js";

export const listPacienteServiciosQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  pacienteId: z.coerce.number().int().positive().optional(),
  servicioId: z.coerce.number().int().positive().optional(),
  estado: z.enum(PACIENTE_SERVICIO_ESTADOS).optional(),
});

export type ListPacienteServiciosQuery = z.output<typeof listPacienteServiciosQuerySchema>;

export const pacienteServicioIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const pacienteServicioBaseFields = {
  pacienteId: z.coerce.number().int().positive(),
  servicioId: z.coerce.number().int().positive(),
  prestadorId: z.coerce.number().int().positive().optional().nullable(),
  prestadorIds: z.array(z.coerce.number().int().positive()).optional(),
  fechaInicio: z.coerce.date(),
  fechaFin: z.coerce.date().optional().nullable(),
  coberturaDiariaInicio: z.string().trim().optional().nullable(),
  coberturaDiariaFin: z.string().trim().optional().nullable(),
  periodoControl: z.enum(PERIODOS_CONTROL).optional(),
  cantidadPermitida: z.coerce.number().int().min(1).optional(),
  cantidadHoras: z.coerce.number().int().min(1).optional().nullable(),
  modalidadCobro: z.enum(MODALIDADES_COBRO).optional(),
  estado: z.enum(PACIENTE_SERVICIO_ESTADOS),
};

export const createPacienteServicioSchema = z
  .object({
    ...pacienteServicioBaseFields,
    estado: z.enum(PACIENTE_SERVICIO_ESTADOS).default("activa"),
  })
  .superRefine((data, ctx) => {
    if (data.fechaFin && data.fechaFin < data.fechaInicio) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La fecha de fin no puede ser anterior al inicio.",
        path: ["fechaFin"],
      });
    }
  });

export type CreatePacienteServicioInput = z.infer<typeof createPacienteServicioSchema>;

export const updatePacienteServicioSchema = z
  .object({
    pacienteId: z.coerce.number().int().positive().optional(),
    servicioId: z.coerce.number().int().positive().optional(),
    prestadorId: z.coerce.number().int().positive().optional().nullable(),
    prestadorIds: z.array(z.coerce.number().int().positive()).optional(),
    fechaInicio: z.coerce.date().optional(),
    fechaFin: z.coerce.date().optional().nullable(),
    coberturaDiariaInicio: z.string().trim().optional().nullable(),
    coberturaDiariaFin: z.string().trim().optional().nullable(),
    periodoControl: z.enum(PERIODOS_CONTROL).optional(),
    cantidadPermitida: z.coerce.number().int().min(1, "La cantidad permitida debe ser al menos 1").optional(),
    cantidadHoras: z.coerce.number().int().min(1, "La cantidad de horas debe ser al menos 1").optional().nullable(),
    modalidadCobro: z.enum(MODALIDADES_COBRO).optional(),
    estado: z.enum(PACIENTE_SERVICIO_ESTADOS).optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.fechaInicio !== undefined &&
      data.fechaFin !== undefined &&
      data.fechaFin !== null &&
      data.fechaFin < data.fechaInicio
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La fecha de fin no puede ser anterior al inicio.",
        path: ["fechaFin"],
      });
    }
  });

export type UpdatePacienteServicioInput = z.infer<typeof updatePacienteServicioSchema>;
