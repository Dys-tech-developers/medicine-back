import { AppError } from "../../core/errors/AppError.js";
import type { UserRepository } from "./users.repository.js";
import type { UpdateUserProfileInput } from "./users.validation.js";

export async function assertEmailAvailable(
  userRepository: UserRepository,
  email: string,
  excludeUserId: number,
): Promise<void> {
  const existing = await userRepository.findByEmail(email);
  if (existing && existing.id !== excludeUserId) {
    throw AppError.conflict("El email ya está registrado");
  }
}

export function normalizeProfileUpdate(input: UpdateUserProfileInput): {
  nombre?: string;
  email?: string;
} {
  return {
    ...(input.nombre !== undefined ? { nombre: input.nombre } : {}),
    ...(input.email !== undefined ? { email: input.email.toLowerCase() } : {}),
  };
}
