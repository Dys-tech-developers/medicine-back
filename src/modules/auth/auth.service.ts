import { AppError } from "../../core/errors/AppError.js";
import { hashPassword, verifyPassword } from "../../shared/password.js";
import { signAccessToken, verifyAccessToken } from "../../shared/jwt.js";
import type { AuthRepository } from "./auth.repository.js";
import type { LoginInput, RegisterInput } from "./auth.validation.js";
import type { AuthResponseDto, UserPublicDto } from "./auth.dto.js";
import { mapUserToPublicDto } from "./auth.mapper.js";

export class AuthService {
  constructor(private readonly authRepository: AuthRepository) {}

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
