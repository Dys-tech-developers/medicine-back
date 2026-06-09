import { z } from "zod";

export const listPacientesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListPacientesQuery = z.output<typeof listPacientesQuerySchema>;

export const pacienteIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type PacienteIdParam = z.infer<typeof pacienteIdParamSchema>;

export const pacienteCodigoQrParamSchema = z.object({
  codigoQr: z
    .string()
    .min(1)
    .max(50)
    .regex(/^PAC-\d{6}$/, "Formato esperado: PAC-000001"),
});

export type PacienteCodigoQrParam = z.infer<typeof pacienteCodigoQrParamSchema>;

export const createPacienteSchema = z.object({
  obraSocialId: z.coerce.number().int().positive(),
  nombre: z.string().min(1).max(100),
  apellido: z.string().min(1).max(100),
  numeroDocumento: z.string().min(1).max(20),
  fechaNacimiento: z.coerce.date(),
  sexo: z.enum(["M", "F", "X"]),
  telefono: z.string().min(1).max(20),
  direccion: z.string().min(1).max(255),
  localidad: z.string().min(1).max(100),
  numeroAfiliado: z.string().min(1).max(50),
});

export type CreatePacienteInput = z.infer<typeof createPacienteSchema>;

export const updatePacienteSchema = z.object({
  obraSocialId: z.coerce.number().int().positive().optional(),
  nombre: z.string().min(1).max(100).optional(),
  apellido: z.string().min(1).max(100).optional(),
  numeroDocumento: z.string().min(1).max(20).optional(),
  fechaNacimiento: z.coerce.date().optional(),
  sexo: z.enum(["M", "F", "X"]).optional(),
  telefono: z.string().min(1).max(20).optional(),
  direccion: z.string().min(1).max(255).optional(),
  localidad: z.string().min(1).max(100).optional(),
  numeroAfiliado: z.string().min(1).max(50).optional(),
});

export type UpdatePacienteInput = z.infer<typeof updatePacienteSchema>;
