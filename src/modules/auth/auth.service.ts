import { AppError } from "../../core/errors/AppError.js";
import { hashPassword, verifyPassword } from "../../shared/password.js";
import { signAccessToken, verifyAccessToken } from "../../shared/jwt.js";
import type { AuthRepository } from "./auth.repository.js";
import type { UserRepository } from "../users/users.repository.js";
import { assertEmailAvailable, normalizeProfileUpdate } from "../users/users.profile.js";
import type { UpdateUserProfileInput } from "../users/users.validation.js";
import type { ChangePasswordInput, LoginInput, RegisterInput } from "./auth.validation.js";
import type { AuthResponseDto, UserPublicDto } from "./auth.dto.js";
import { mapUserToPublicDto } from "./auth.mapper.js";

export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async register(input: RegisterInput): Promise<AuthResponseDto> {
    const email = input.email.toLowerCase();
    const existing = await this.authRepository.findUserWithRolesByEmail(email);
    if (existing) {
      throw AppError.conflict("El email ya está registrado");
    }

    const passwordHash = await hashPassword(input.password);
    const user = await this.authRepository.createUserWithRole({
      nombre: input.nombre,
      email,
      passwordHash,
      roleName: "OPERADOR",
    });

    const token = signAccessToken({ sub: user.id, email: user.email });
    return {
      accessToken: token,
      user: mapUserToPublicDto(user),
    };
  }

  async login(input: LoginInput): Promise<AuthResponseDto> {
    const user = await this.authRepository.findUserWithRolesByEmail(input.email.toLowerCase());
    if (!user) {
      throw AppError.unauthorized("Credenciales inválidas");
    }

    if (!user.estado) {
      throw AppError.unauthorized("Usuario inactivo");
    }

    const passwordOk = await verifyPassword(input.password, user.passwordHash);
    if (!passwordOk) {
      throw AppError.unauthorized("Credenciales inválidas");
    }

    const token = signAccessToken({ sub: user.id, email: user.email });
    return {
      accessToken: token,
      user: mapUserToPublicDto(user),
    };
  }

  async getProfile(userId: number): Promise<UserPublicDto> {
    const user = await this.authRepository.findUserWithRolesById(userId);
    if (!user) {
      throw AppError.notFound("Usuario no encontrado");
    }
    return mapUserToPublicDto(user);
  }

  async updateMe(userId: number, input: UpdateUserProfileInput): Promise<UserPublicDto> {
    const existing = await this.authRepository.findUserWithRolesById(userId);
    if (!existing) {
      throw AppError.notFound("Usuario no encontrado");
    }

    const data = normalizeProfileUpdate(input);
    if (data.email !== undefined) {
      await assertEmailAvailable(this.userRepository, data.email, userId);
    }

    const updated = await this.userRepository.updateProfile(userId, data);
    return mapUserToPublicDto(updated);
  }

  async changePassword(userId: number, input: ChangePasswordInput): Promise<{ message: string }> {
    const passwordHash = await this.userRepository.findPasswordHashById(userId);
    if (!passwordHash) {
      throw AppError.notFound("Usuario no encontrado");
    }

    const currentOk = await verifyPassword(input.currentPassword, passwordHash);
    if (!currentOk) {
      throw AppError.unauthorized("La contraseña actual es incorrecta");
    }

    if (input.currentPassword === input.newPassword) {
      throw AppError.badRequest("La nueva contraseña debe ser distinta a la actual");
    }

    const newHash = await hashPassword(input.newPassword);
    await this.userRepository.updatePasswordHash(userId, newHash);

    return { message: "Contraseña actualizada correctamente" };
  }

  async logout(accessToken: string): Promise<{ message: string }> {
    let verified;
    try {
      verified = verifyAccessToken(accessToken);
    } catch {
      throw AppError.unauthorized("Token inválido o expirado");
    }

    const alreadyRevoked = await this.authRepository.isTokenRevoked(verified.jti);
    if (!alreadyRevoked) {
      await this.authRepository.revokeToken(verified.jti, new Date(verified.exp * 1000));
    }

    await this.authRepository.deleteExpiredRevokedTokens();

    return { message: "Sesión cerrada correctamente" };
  }
}
