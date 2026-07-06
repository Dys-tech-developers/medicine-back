import { z } from "zod";
import { TELEFONO_MAX_LENGTH, TELEFONO_MAX_LENGTH_MESSAGE } from "../../shared/constants/telefono.js";
import { isBirthDateInFuture } from "../../shared/date/calendarDate.js";

function refineFechaNacimientoNoFutura(
  data: { fechaNacimiento?: Date },
  ctx: z.RefinementCtx,
  optional: boolean,
): void {
  if (optional && data.fechaNacimiento === undefined) {
    return;
  }
  const fecha = data.fechaNacimiento;
  if (fecha === undefined) {
    return;
  }
  if (isBirthDateInFuture(fecha)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "La fecha de nacimiento no puede ser futura.",
      path: ["fechaNacimiento"],
    });
  }
}

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

const fechaNacimientoSchema = z.coerce.date({
  invalid_type_error: "La fecha de nacimiento no es válida. Usá el formato AAAA-MM-DD",
});

const textoOpcionalPaciente = (max: number, maxMessage?: string) =>
  z.string().trim().max(max, maxMessage).optional().default("");

export const createPacienteSchema = z
  .object({
    obraSocialId: z.coerce.number().int().positive("La obra social no es válida").optional(),
    nombre: textoOpcionalPaciente(100, "El nombre no puede superar 100 caracteres"),
    apellido: textoOpcionalPaciente(100, "El apellido no puede superar 100 caracteres"),
    numeroDocumento: textoOpcionalPaciente(
      20,
      "El número de documento no puede superar 20 caracteres",
    ),
    fechaNacimiento: fechaNacimientoSchema.optional(),
    sexo: z
      .enum(["M", "F", "X"], {
        errorMap: () => ({ message: "El sexo debe ser M, F o X" }),
      })
      .optional(),
    telefono: textoOpcionalPaciente(TELEFONO_MAX_LENGTH, TELEFONO_MAX_LENGTH_MESSAGE),
    direccion: textoOpcionalPaciente(255, "La dirección no puede superar 255 caracteres"),
    localidad: textoOpcionalPaciente(100),
    numeroAfiliado: textoOpcionalPaciente(50, "El número de afiliado no puede superar 50 caracteres"),
  })
  .superRefine((data, ctx) => {
    if (data.fechaNacimiento === undefined) {
      return;
    }
    refineFechaNacimientoNoFutura({ fechaNacimiento: data.fechaNacimiento }, ctx, false);
  });

export type CreatePacienteInput = z.infer<typeof createPacienteSchema>;

export const updatePacienteSchema = z
  .object({
    obraSocialId: z.coerce.number().int().positive("La obra social no es válida").optional(),
    nombre: z.string().min(1, "El nombre es obligatorio").max(100).optional(),
    apellido: z.string().min(1, "El apellido es obligatorio").max(100).optional(),
    numeroDocumento: z
      .string()
      .min(1, "El número de documento es obligatorio")
      .max(20, "El número de documento no puede superar 20 caracteres")
      .optional(),
    fechaNacimiento: fechaNacimientoSchema.optional(),
    sexo: z.enum(["M", "F", "X"], {
      errorMap: () => ({ message: "El sexo debe ser M, F o X" }),
    }).optional(),
    telefono: z
      .string()
      .min(1, "El teléfono es obligatorio")
      .max(TELEFONO_MAX_LENGTH, TELEFONO_MAX_LENGTH_MESSAGE)
      .optional(),
    direccion: z.string().min(1, "La dirección es obligatoria").max(255).optional(),
    localidad: z.string().min(1, "La localidad es obligatoria").max(100).optional(),
    numeroAfiliado: z.string().min(1, "El número de afiliado es obligatorio").max(50).optional(),
  })
  .superRefine((data, ctx) => {
    refineFechaNacimientoNoFutura(data, ctx, true);
  });

export type UpdatePacienteInput = z.infer<typeof updatePacienteSchema>;
