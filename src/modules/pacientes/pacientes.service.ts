import { Prisma } from "@prisma/client";
import { AppError } from "../../core/errors/AppError.js";
import { ROLE } from "../../shared/constants/roles.js";
import { normalizeNumeroDocumento } from "../../shared/paciente/normalizeNumeroDocumento.js";
import {
  PACIENTE_OBRA_SOCIAL_SIN_DATO_CODIGO,
  PACIENTE_OBRA_SOCIAL_SIN_DATO_CODIGO_FALLBACK,
  resolvePacienteCampos,
} from "../../shared/paciente/pacienteDefaults.js";
import { generatePacienteQrDataUrl } from "../../shared/qr/generatePacienteQr.js";
import type { LocalidadesRepository } from "../localidades/localidades.repository.js";
import type { PacientesRepository } from "./pacientes.repository.js";
import type { PacienteServiciosService } from "../paciente-servicios/paciente-servicios.service.js";
import type { VisitasService } from "../visitas/visitas.service.js";
import type { VisitasRepository } from "../visitas/visitas.repository.js";
import type {
  CreatePacienteInput,
  ListPacientesQuery,
  UpdatePacienteInput,
} from "./pacientes.validation.js";
import type { PaginatedPacientesDto, PacienteDto } from "./pacientes.dto.js";
import { mapPaginatedPacientes, mapPacienteToDto } from "./pacientes.mapper.js";
import { assertLocalidadValida } from "./pacientes-localidad.util.js";
import { calcularFechaLimiteVisitaOpcional } from "../../shared/visita/visitaLimite.js";

const MODALIDAD_COBRO_POR_HORA = "por_hora" as const;

export interface PacienteAuthContext {
  userId: number;
  roles: string[];
}

export class PacientesService {
  constructor(
    private readonly pacientesRepository: PacientesRepository,
    private readonly localidadesRepository: LocalidadesRepository,
    private readonly pacienteServiciosService: PacienteServiciosService,
    private readonly visitasRepository: VisitasRepository,
    private readonly visitasService: VisitasService,
  ) {}

  /** Enriquece asignaciones con cupo del período actual (no aplica en `por_hora`). */
  private async aplicarDisponibilidadAsignaciones(
    dto: PacienteDto,
    referencia: Date = new Date(),
    auth?: PacienteAuthContext,
  ): Promise<PacienteDto> {
    const prestadorId = auth ? await this.resolvePrestadorIdOpcional(auth) : null;

    const asignacionesConControlHorario = dto.servicios.filter(
      (s) => s.controlHorario && !s.modoRelevo,
    );
    const asignacionesModoRelevo = dto.servicios.filter((s) => s.modoRelevo);

    if (prestadorId !== null && asignacionesConControlHorario.length > 0) {
      await this.visitasService.cerrarVisitasVencidas({
        prestadorId,
        referencia,
      });
    }

    const visitasIniciadas =
      prestadorId !== null
        ? await this.visitasRepository.findVisitasIniciadasByPacienteServicioIds(
            asignacionesConControlHorario.map((s) => s.pacienteServicioId),
            prestadorId,
          )
        : [];

    const tramosActivos =
      asignacionesModoRelevo.length > 0
        ? await this.visitasRepository.findTramosActivosByPacienteServicioIds(
            asignacionesModoRelevo.map((s) => s.pacienteServicioId),
          )
        : [];

    const visitaPorAsignacion = new Map(
      visitasIniciadas.map((v) => [v.pacienteServicioId, v]),
    );
    const tramoPorAsignacion = new Map(
      tramosActivos.map((v) => [v.pacienteServicioId, v]),
    );

    const servicios = await Promise.all(
      dto.servicios.map(async (s) => {
        if (s.modoRelevo) {
          const tramo = tramoPorAsignacion.get(s.pacienteServicioId);
          const conCobertura =
            tramo !== undefined
              ? {
                  ...s,
                  coberturaActiva: {
                    visitaId: tramo.id,
                    prestadorId: tramo.prestadorId,
                    prestadorNombre: tramo.prestador.user.nombre,
                    fechaInicio: tramo.fechaInicio.toISOString(),
                  },
                }
              : { ...s, coberturaActiva: null };

          return conCobertura;
        }

        const visitaIniciada = visitaPorAsignacion.get(s.pacienteServicioId);
        const conPendiente =
          visitaIniciada !== undefined
            ? {
                ...s,
                visitaPendiente: {
                  id: visitaIniciada.id,
                  fechaInicio: visitaIniciada.fechaInicio.toISOString(),
                  fechaLimite:
                    calcularFechaLimiteVisitaOpcional(
                      visitaIniciada.fechaInicio,
                      s.cantidadHoras,
                    )?.toISOString() ?? null,
                },
              }
            : s;

        if (conPendiente.modalidadCobro === MODALIDAD_COBRO_POR_HORA) {
          return conPendiente;
        }
        const disponibilidad = await this.pacienteServiciosService.getDisponibilidad(
          conPendiente.pacienteServicioId,
          referencia,
        );
        return { ...conPendiente, disponibilidad };
      }),
    );
    return { ...dto, servicios };
  }

  private async resolvePrestadorIdOpcional(auth: PacienteAuthContext): Promise<number | null> {
    const isPrestador = auth.roles.includes(ROLE.PRESTADOR);
    if (!isPrestador) {
      return null;
    }

    const prestador = await this.visitasRepository.findPrestadorByUserId(auth.userId);
    if (!prestador?.estado) {
      return null;
    }
    return prestador.id;
  }

  async list(query: ListPacientesQuery): Promise<PaginatedPacientesDto> {
    const result = await this.pacientesRepository.findPaginated(query.page, query.pageSize);
    return mapPaginatedPacientes(result);
  }

  async getById(id: number, auth?: PacienteAuthContext): Promise<PacienteDto> {
    const paciente = await this.pacientesRepository.findById(id);
    if (!paciente) {
      throw AppError.notFound("Paciente no encontrado");
    }

    const qrDataUrl = await generatePacienteQrDataUrl(paciente.codigoQr);
    const dto = mapPacienteToDto(paciente, qrDataUrl);
    return this.aplicarDisponibilidadAsignaciones(dto, new Date(), auth);
  }

  async getByCodigoQr(codigoQr: string, auth?: PacienteAuthContext): Promise<PacienteDto> {
    const paciente = await this.pacientesRepository.findByCodigoQr(codigoQr);
    if (!paciente) {
      throw AppError.notFound("Paciente no encontrado para ese código QR");
    }

    const qrDataUrl = await generatePacienteQrDataUrl(paciente.codigoQr);
    const dto = mapPacienteToDto(paciente, qrDataUrl);
    return this.aplicarDisponibilidadAsignaciones(dto, new Date(), auth);
  }

  async create(input: CreatePacienteInput): Promise<PacienteDto> {
    const obraSocialId = await this.resolveObraSocialId(input.obraSocialId);
    await this.validateObraSocial(obraSocialId);

    const campos = resolvePacienteCampos({
      nombre: input.nombre,
      apellido: input.apellido,
      numeroDocumento: input.numeroDocumento,
      fechaNacimiento: input.fechaNacimiento,
      sexo: input.sexo,
      telefono: input.telefono,
      direccion: input.direccion,
      localidad: input.localidad,
      numeroAfiliado: input.numeroAfiliado,
      uniqueDocumentKey: `api-${Date.now()}`,
    });

    const localidad = await assertLocalidadValida(this.localidadesRepository, campos.localidad);
    await this.assertNumeroDocumentoUnico(campos.numeroDocumento);

    try {
      const paciente = await this.pacientesRepository.createWithCodigoQr({
        obraSocialId,
        nombre: campos.nombre,
        apellido: campos.apellido,
        numeroDocumento: campos.numeroDocumento,
        fechaNacimiento: campos.fechaNacimiento,
        sexo: campos.sexo,
        telefono: campos.telefono,
        direccion: campos.direccion,
        localidad,
        numeroAfiliado: campos.numeroAfiliado,
      });

      const qrDataUrl = await generatePacienteQrDataUrl(paciente.codigoQr);
      const dto = mapPacienteToDto(paciente, qrDataUrl);
      return await this.aplicarDisponibilidadAsignaciones(dto);
    } catch (error) {
      this.rethrowNumeroDocumentoDuplicado(error);
      throw error;
    }
  }

  async update(id: number, input: UpdatePacienteInput): Promise<PacienteDto> {
    const existing = await this.pacientesRepository.findById(id);
    if (!existing) {
      throw AppError.notFound("Paciente no encontrado");
    }

    if (input.obraSocialId !== undefined) {
      await this.validateObraSocial(input.obraSocialId);
    }

    let localidad: string | undefined;
    if (input.localidad !== undefined) {
      localidad = await assertLocalidadValida(this.localidadesRepository, input.localidad);
    }

    let numeroDocumento: string | undefined;
    if (input.numeroDocumento !== undefined) {
      numeroDocumento = normalizeNumeroDocumento(input.numeroDocumento);
      await this.assertNumeroDocumentoUnico(numeroDocumento, id);
    }

    try {
      const paciente = await this.pacientesRepository.update(id, {
        ...(input.obraSocialId !== undefined ? { obraSocialId: input.obraSocialId } : {}),
        ...(input.nombre !== undefined ? { nombre: input.nombre.trim() } : {}),
        ...(input.apellido !== undefined ? { apellido: input.apellido.trim() } : {}),
        ...(numeroDocumento !== undefined ? { numeroDocumento } : {}),
        ...(input.fechaNacimiento !== undefined ? { fechaNacimiento: input.fechaNacimiento } : {}),
        ...(input.sexo !== undefined ? { sexo: input.sexo } : {}),
        ...(input.telefono !== undefined ? { telefono: input.telefono.trim() } : {}),
        ...(input.direccion !== undefined ? { direccion: input.direccion.trim() } : {}),
        ...(localidad !== undefined ? { localidad } : {}),
        ...(input.numeroAfiliado !== undefined
          ? { numeroAfiliado: input.numeroAfiliado.trim() }
          : {}),
      });

      const qrDataUrl = await generatePacienteQrDataUrl(paciente.codigoQr);
      const dto = mapPacienteToDto(paciente, qrDataUrl);
      return await this.aplicarDisponibilidadAsignaciones(dto);
    } catch (error) {
      this.rethrowNumeroDocumentoDuplicado(error);
      throw error;
    }
  }

  async delete(id: number): Promise<void> {
    const existing = await this.pacientesRepository.findById(id);
    if (!existing) {
      throw AppError.notFound("Paciente no encontrado");
    }

    const visitas = await this.pacientesRepository.countVisitas(id);
    if (visitas > 0) {
      throw AppError.conflict("No se puede eliminar porque tiene visitas registradas");
    }

    const asignaciones = await this.pacientesRepository.countPacienteServicios(id);
    if (asignaciones > 0) {
      throw AppError.conflict(
        "No se puede eliminar porque tiene asignaciones de servicio; elimínelas primero",
      );
    }

    await this.pacientesRepository.delete(id);
  }

  private async resolveObraSocialId(obraSocialId?: number): Promise<number> {
    if (obraSocialId !== undefined) {
      return obraSocialId;
    }

    const defaultObraSocial =
      (await this.pacientesRepository.findObraSocialActivaByCodigo(
        PACIENTE_OBRA_SOCIAL_SIN_DATO_CODIGO,
      )) ??
      (await this.pacientesRepository.findObraSocialActivaByCodigo(
        PACIENTE_OBRA_SOCIAL_SIN_DATO_CODIGO_FALLBACK,
      ));

    if (!defaultObraSocial) {
      throw AppError.badRequest(
        "No hay una obra social por defecto configurada para crear pacientes sin obra social",
      );
    }

    return defaultObraSocial.id;
  }

  private async validateObraSocial(obraSocialId: number): Promise<void> {
    const obraSocial = await this.pacientesRepository.findObraSocialById(obraSocialId);
    if (!obraSocial?.estado) {
      throw AppError.badRequest("La obra social no existe o está inactiva.");
    }
  }

  private async assertNumeroDocumentoUnico(
    numeroDocumento: string,
    excludePacienteId?: number,
  ): Promise<void> {
    const existing = await this.pacientesRepository.findByNumeroDocumento(numeroDocumento);
    if (existing && existing.id !== excludePacienteId) {
      throw AppError.conflict("Ya existe un paciente con ese número de documento.");
    }
  }

  private rethrowNumeroDocumentoDuplicado(error: unknown): void {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002" &&
      Array.isArray(error.meta?.target) &&
      error.meta.target.includes("numero_documento")
    ) {
      throw AppError.conflict("Ya existe un paciente con ese número de documento.");
    }
  }
}
