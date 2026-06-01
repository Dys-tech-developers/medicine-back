import type { UserPublicDto } from "./auth.dto.js";
import type { UserWithRoles } from "../../shared/prisma-includes/user.include.js";

export function mapUserToPublicDto(user: UserWithRoles): UserPublicDto {
  return {
    id: user.id,
    nombre: user.nombre,
    email: user.email,
    estado: user.estado,
    createdAt: user.createdAt.toISOString(),
    roles: user.roles.map((ur) => ur.role.nombre),
  };
}
