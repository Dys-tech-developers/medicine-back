import { z } from "zod";
import { REGIMENES_IVA } from "../../../shared/constants/regimen-iva.js";

export const prestadorImportRowSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, "El nombre es obligatorio")
    .max(100, "El nombre no puede superar 100 caracteres"),
  email: z
    .string()
    .trim()
    .min(1, "El email es obligatorio")
    .email("El email no tiene un formato válido")
    .max(150, "El email no puede superar 150 caracteres"),
  password: z
    .string()
    .min(1, "La contraseña es obligatoria")
    .min(10, "La contraseña debe tener al menos 10 caracteres")
    .max(72, "La contraseña no puede superar 72 caracteres"),
  telefono: z
    .string()
    .trim()
    .min(1, "El teléfono es obligatorio")
    .max(20, "El teléfono no puede superar 20 caracteres"),
  lugarResidencia: z
    .string()
    .trim()
    .min(1, "El lugar de residencia es obligatorio")
    .max(255, "El lugar de residencia no puede superar 255 caracteres"),
  documento: z
    .string()
    .trim()
    .min(1, "El documento es obligatorio")
    .max(20, "El documento no puede superar 20 caracteres"),
  matricula: z
    .string()
    .trim()
    .min(1, "La matrícula es obligatoria")
    .max(50, "La matrícula no puede superar 50 caracteres"),
  cuit: z
    .string()
    .trim()
    .min(1, "El CUIT es obligatorio")
    .max(20, "El CUIT no puede superar 20 caracteres"),
  cbu: z
    .string()
    .trim()
    .min(1, "El CBU es obligatorio")
    .max(150, "El CBU no puede superar 150 caracteres"),
  regimenIva: z.enum(REGIMENES_IVA, {
    errorMap: () => ({
      message: "Elegí un régimen de IVA de la lista desplegable",
    }),
  }),
  servicioHabilitado: z
    .string()
    .trim()
    .min(1, "Elegí un servicio de la lista o 'sin asignar'"),
});

export type PrestadorImportRowInput = z.infer<typeof prestadorImportRowSchema>;
