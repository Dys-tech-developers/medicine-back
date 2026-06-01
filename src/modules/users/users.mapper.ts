import { mapUserToPublicDto } from "../auth/auth.mapper.js";
import type { PaginatedUsersDto, UserListItemDto } from "./users.dto.js";
import type { UserListRecord } from "./users.repository.js";

function mapListItem(user: UserListRecord): UserListItemDto {
  return {
    id: user.id,
    nombre: user.nombre,
    email: user.email,
    estado: user.estado,
    createdAt: user.createdAt.toISOString(),
    roles: user.roles.map((ur) => ur.role.nombre),
  };
}

export function mapPaginatedUsers(result: {
  items: UserListRecord[];
  total: number;
  page: number;
  pageSize: number;
}): PaginatedUsersDto {
  return {
    items: result.items.map(mapListItem),
    total: result.total,
    page: result.page,
    pageSize: result.pageSize,
  };
}

export { mapUserToPublicDto };
