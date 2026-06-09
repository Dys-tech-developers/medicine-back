import { AppError } from "../../core/errors/AppError.js";
import { ROLE } from "../../shared/constants/roles.js";
import type { UserPublicDto } from "../auth/auth.dto.js";
import type { UserRepository } from "./users.repository.js";
import { assertEmailAvailable, normalizeProfileUpdate } from "./users.profile.js";
import type {
  ListUsersQuery,
  UpdateUserEstadoInput,
  UpdateUserProfileInput,
} from "./users.validation.js";
import type { PaginatedUsersDto } from "./users.dto.js";
import { mapPaginatedUsers, mapUserToPublicDto } from "./users.mapper.js";

export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async list(query: ListUsersQuery): Promise<PaginatedUsersDto> {
    const result = await this.userRepository.findPaginated(query.page, query.pageSize);
    return mapPaginatedUsers(result);
  }

  async getById(requesterUserId: number, requesterRoles: string[], id: number): Promise<UserPublicDto> {
    const isAdmin = requesterRoles.includes(ROLE.ADMIN);
    if (!isAdmin && requesterUserId !== id) {
      throw AppError.forbidden("No podés consultar otros usuarios");
    }

    const user = await this.userRepository.findByIdWithRoles(id);
    if (!user) {
      throw AppError.notFound("Usuario no encontrado");
    }

    return mapUserToPublicDto(user);
  }

  async updateEstado(id: number, input: UpdateUserEstadoInput): Promise<UserPublicDto> {
    const existing = await this.userRepository.findByIdWithRoles(id);
    if (!existing) {
      throw AppError.notFound("Usuario no encontrado");
    }

    const updated = await this.userRepository.updateEstado(id, input.estado);
    return mapUserToPublicDto(updated);
  }

  async updateProfile(id: number, input: UpdateUserProfileInput): Promise<UserPublicDto> {
    const existing = await this.userRepository.findByIdWithRoles(id);
    if (!existing) {
      throw AppError.notFound("Usuario no encontrado");
    }

    const data = normalizeProfileUpdate(input);
    if (data.email !== undefined) {
      await assertEmailAvailable(this.userRepository, data.email, id);
    }

    const updated = await this.userRepository.updateProfile(id, data);
    return mapUserToPublicDto(updated);
  }
}
