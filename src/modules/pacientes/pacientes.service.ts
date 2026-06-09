import { AppError } from "../../core/errors/AppError.js";
import { ROLE } from "../../shared/constants/roles.js";
import { generatePacienteQrDataUrl } from "../../shared/qr/generatePacienteQr.js";
import type { PacientesRepository } from "./pacientes.repository.js";
import type { PacienteServiciosService } from "../paciente-servicios/paciente-servicios.service.js";
import type { VisitasRepository } from "../visitas/visitas.repository.js";
import type {
  CreatePacienteInput,
  ListPacientesQuery,
  UpdatePacienteInput,
} from "./pacientes.validation.js";
import type { PaginatedPacientesDto, PacienteDto } from "./pacientes.dto.js";
import { mapPaginatedPacientes, mapPacienteToDto } from "./pacientes.mapper.js";

const MODALIDAD_COBRO_POR_HORA = "por_hora" as const;

export interface PacienteAuthContext {
  userId: number;
  roles: string[];
}

export class PacientesService {
  constructor(
    private readonly pacientesRepository: PacientesRepository,
    private readonly pacienteServiciosService: PacienteServiciosService,
    private readonly visitasRepository: VisitasRepository,
  ) {}

  /** Enriquece asignaciones con cupo del período actual (no aplica en `por_hora`). */
  private async aplicarDisponibilidadAsignaciones(
    dto: PacienteDto,
    referencia: Date = new Date(),
    auth?: PacienteAuthContext,
  ): Promise<PacienteDto> {
    const prestadorId = auth ? await this.resolvePrestadorIdOpcional(auth) : null;

    const visitasIniciadas =
      prestadorId !== null
        ? await this.visitasRepository.findVisitasIniciadasByPacienteServicioIds(
            dto.servicios
              .filter((s) => s.controlHorario)
              .map((s) => s.pacienteServicioId),
            prestadorId,
          )
        : [];

    const visitaPorAsignacion = new Map(
      visitasIniciadas.map((v) => [v.pacienteServicioId, v]),
    );

    const servicios = await Promise.all(
      dto.servicios.map(async (s) => {
        const visitaIniciada = visitaPorAsignacion.get(s.pacienteServicioId);
        const conPendiente =
          visitaIniciada !== undefined
            ? {
                ...s,
                visitaPendiente: {
                  id: visitaIniciada.id,
                  fechaInicio: visitaIniciada.fechaInicio.toISOString(),
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
    await this.validateObraSocial(input.obraSocialId);

    const paciente = await this.pacientesRepository.createWithCodigoQr({
      obraSocialId: input.obraSocialId,
      nombre: input.nombre.trim(),
      apellido: input.apellido.trim(),
      numeroDocumento: input.numeroDocumento.trim(),
      fechaNacimiento: input.fechaNacimiento,
      sexo: input.sexo,
      telefono: input.telefono.trim(),
      direccion: input.direccion.trim(),
      localidad: input.localidad.trim(),
      numeroAfiliado: input.numeroAfiliado.trim(),
    });

    const qrDataUrl = await generatePacienteQrDataUrl(paciente.codigoQr);
    const dto = mapPacienteToDto(paciente, qrDataUrl);
    return this.aplicarDisponibilidadAsignaciones(dto);
  }

  async update(id: number, input: UpdatePacienteInput): Promise<PacienteDto> {
    const existing = await this.pacientesRepository.findById(id);
    if (!existing) {
      throw AppError.notFound("Paciente no encontrado");
    }

    if (input.obraSocialId !== undefined) {
      await this.validateObraSocial(input.obraSocialId);
    }

    const paciente = await this.pacientesRepository.update(id, {
      ...(input.obraSocialId !== undefined ? { obraSocialId: input.obraSocialId } : {}),
      ...(input.nombre !== undefined ? { nombre: input.nombre.trim() } : {}),
      ...(input.apellido !== undefined ? { apellido: input.apellido.trim() } : {}),
      ...(input.numeroDocumento !== undefined
        ? { numeroDocumento: input.numeroDocumento.trim() }
        : {}),
      ...(input.fechaNacimiento !== undefined ? { fechaNacimiento: input.fechaNacimiento } : {}),
      ...(input.sexo !== undefined ? { sexo: input.sexo } : {}),
      ...(input.telefono !== undefined ? { telefono: input.telefono.trim() } : {}),
      ...(input.direccion !== undefined ? { direccion: input.direccion.trim() } : {}),
      ...(input.localidad !== undefined ? { localidad: input.localidad.trim() } : {}),
      ...(input.numeroAfiliado !== undefined
        ? { numeroAfiliado: input.numeroAfiliado.trim() }
        : {}),
    });

    const qrDataUrl = await generatePacienteQrDataUrl(paciente.codigoQr);
    const dto = mapPacienteToDto(paciente, qrDataUrl);
    return this.aplicarDisponibilidadAsignaciones(dto);
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

  private async validateObraSocial(obraSocialId: number): Promise<void> {
    const obraSocialExists = await this.pacientesRepository.obraSocialExists(obraSocialId);
    if (!obraSocialExists) {
      throw AppError.notFound("Obra social no encontrada");
    }
    const obraSocialActiva = await this.pacientesRepository.findObraSocialEstado(obraSocialId);
    if (obraSocialActiva === false) {
      throw AppError.conflict("La obra social está inactiva");
    }
  }
}
