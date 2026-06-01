import { z } from "zod";
import { MODALIDADES_COBRO } from "../../shared/constants/modalidad-cobro.js";
import { TIPOS_DIA, TIPOS_JORNADA } from "../../shared/constants/tarifa.js";

export const servicioIdParamSchema = z.object({
  servicioId: z.coerce.number().int().positive(),
});

export const servicioTarifaIdParamSchema = z.object({
  servicioId: z.coerce.number().int().positive(),
  id: z.coerce.number().int().positive(),
});

export const createServicioTarifaSchema = z.object({
  modalidadCobro: z.enum(MODALIDADES_COBRO),
  tipoJornada: z.enum(TIPOS_JORNADA),
  tipoDia: z.enum(TIPOS_DIA),
  valor: z.coerce.number().positive(),
});

export type CreateServicioTarifaInput = z.infer<typeof createServicioTarifaSchema>;

export const updateServicioTarifaSchema = z.object({
  modalidadCobro: z.enum(MODALIDADES_COBRO).optional(),
  tipoJornada: z.enum(TIPOS_JORNADA).optional(),
  tipoDia: z.enum(TIPOS_DIA).optional(),
  valor: z.coerce.number().positive().optional(),
});

export type UpdateServicioTarifaInput = z.infer<typeof updateServicioTarifaSchema>;
