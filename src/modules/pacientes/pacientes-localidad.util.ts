import { AppError } from "../../core/errors/AppError.js";
import {
  isPacienteValorSinDato,
  PACIENTE_VALOR_SIN_DATO,
} from "../../shared/paciente/pacienteDefaults.js";
import type { LocalidadesRepository } from "../localidades/localidades.repository.js";

const LOCALIDAD_INVALIDA_MESSAGE =
  "La localidad elegida no es válida. Elegí una del catálogo.";

/**
 * Valida que el nombre de localidad exista en el catálogo (match exacto tras trim).
 * Devuelve el nombre recortado para persistir.
 */
export async function assertLocalidadValida(
  localidadesRepository: LocalidadesRepository,
  nombre: string,
): Promise<string> {
  const trimmed = nombre.trim();
  if (isPacienteValorSinDato(trimmed)) {
    return PACIENTE_VALOR_SIN_DATO;
  }
  const exists = await localidadesRepository.existsByNombre(trimmed);
  if (!exists) {
    throw AppError.badRequest(LOCALIDAD_INVALIDA_MESSAGE);
  }
  return trimmed;
}
