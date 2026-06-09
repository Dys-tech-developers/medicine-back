import { AppError } from "../../core/errors/AppError.js";
import { hashPassword } from "../../shared/password.js";
import { resolveEstadoCuentaFiltros } from "../../shared/reportes/resolveEstadoCuentaFiltros.js";
import type { AuthRepository } from "../auth/auth.repository.js";
import type { ReportesRepository } from "../reportes/reportes.repository.js";
import type { PaginatedPrestadoresDto, PrestadorListItemDto } from "./prestadores.dto.js";
import {
  mapPaginatedPrestadores,
  mapPaginatedPrestadoresConEstadoCuenta,
  mapPrestadorToDto,
} from "./prestadores.mapper.js";
import type { PrestadoresRepository } from "./prestadores.repository.js";
import type {
  CreatePrestadorInput,
  ListPrestadoresQuery,
  UpdatePrestadorServiciosInput,
} from "./prestadores.validation.js";
import { listPrestadoresIncluyeEstadoCuenta } from "./prestadores.validation.js";

export class PrestadoresService {
  constructor(
    private readonly prestadoresRepository: PrestadoresRepository,
    private readonly authRepository: AuthRepository,
    private readonly reportesRepository: ReportesRepository,
  ) {}

  async list(query: ListPrestadoresQuery): Promise<PaginatedPrestadoresDto> {
    const result = await this.prestadoresRepository.findPaginated(query.page, query.pageSize, {
      servicioId: query.servicioId,
      estado: query.estado,
    });

    if (!listPrestadoresIncluyeEstadoCuenta(query)) {
      return mapPaginatedPrestadores(result);
    }

    const { filtros, rango } = resolveEstadoCuentaFiltros(query);
    const prestadorIds = result.items.map((p) => p.id);

    const aggregateRows =
      prestadorIds.length > 0
        ? await this.reportesRepository.aggregatePorPrestador({
            ...filtros,
            prestadorIds,
          })
        : [];

    const aggregatesByPrestadorId = new Map(
      aggregateRows.map((row) => [row.prestador_id, row] as const),
    );

    return mapPaginatedPrestadoresConEstadoCuenta(
      result,
      aggregatesByPrestadorId,
      rango,
      query.periodo,
    );
  }

  async getById(id: number): Promise<PrestadorListItemDto> {
    const prestador = await this.prestadoresRepository.findById(id);
    if (!prestador) {
      throw AppError.notFound("Prestador no encontrado");
    }
    return mapPrestadorToDto(prestador);
  }

  async getMe(userId: number): Promise<PrestadorListItemDto> {
    const prestador = await this.prestadoresRepository.findByUserId(userId);
    if (!prestador) {
      throw AppError.notFound("Prestador no encontrado");
    }
    return mapPrestadorToDto(prestador);
  }

  async create(input: CreatePrestadorInput): Promise<PrestadorListItemDto> {
    const email = input.email.toLowerCase();

    const existingUser = await this.authRepository.findUserWithRolesByEmail(email);
    if (existingUser) {
      throw AppError.conflict("El email ya está registrado");
    }

    const existingPrestador = await this.prestadoresRepository.findByUserEmail(email);
    if (existingPrestador) {
      throw AppError.conflict("Ya existe un prestador con ese email");
    }

    const passwordHash = await hashPassword(input.password);
    await this.validateServicioIds(input.servicioIds);

    const prestador = await this.prestadoresRepository.createWithUser({
      nombre: input.nombre,
      email,
      passwordHash,
      telefono: input.telefono,
      lugarResidencia: input.lugarResidencia,
      documento: input.documento,
      matricula: input.matricula,
      cuit: input.cuit,
      cbu: input.cbu,
      regimenIva: input.regimenIva,
      estado: input.estado ?? true,
      servicioIds: input.servicioIds,
    });

    return mapPrestadorToDto(prestador);
  }

  async updateServicios(
    id: number,
    input: UpdatePrestadorServiciosInput,
  ): Promise<PrestadorListItemDto> {
    const existing = await this.prestadoresRepository.findById(id);
    if (!existing) {
      throw AppError.notFound("Prestador no encontrado");
    }

    await this.validateServicioIds(input.servicioIds);

    const prestador = await this.prestadoresRepository.syncServicios(id, input.servicioIds);
    return mapPrestadorToDto(prestador);
  }

  private async validateServicioIds(servicioIds: number[]): Promise<void> {
    if (servicioIds.length === 0) {
      return;
    }

    const uniqueIds = [...new Set(servicioIds)];
    const servicios = await this.prestadoresRepository.findServiciosByIds(uniqueIds);

    if (servicios.length !== uniqueIds.length) {
      const found = new Set(servicios.map((s) => s.id));
      const missing = uniqueIds.filter((id) => !found.has(id));
      throw AppError.notFound(`Servicios no encontrados: ${missing.join(", ")}`);
    }

    const inactivos = servicios.filter((s) => !s.estado).map((s) => s.nombre);
    if (inactivos.length > 0) {
      throw AppError.conflict(`Servicios inactivos: ${inactivos.join(", ")}`);
    }
  }
}
