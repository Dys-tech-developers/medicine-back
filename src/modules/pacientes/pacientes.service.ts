import { AppError } from "../../core/errors/AppError.js";
import { generatePacienteQrDataUrl } from "../../shared/qr/generatePacienteQr.js";
import type { PacientesRepository } from "./pacientes.repository.js";
import type { PacienteServiciosService } from "../paciente-servicios/paciente-servicios.service.js";
import type {
  CreatePacienteInput,
  ListPacientesQuery,
  UpdatePacienteInput,
} from "./pacientes.validation.js";
import type { PaginatedPacientesDto, PacienteDto } from "./pacientes.dto.js";
import { mapPaginatedPacientes, mapPacienteToDto } from "./pacientes.mapper.js";

const MODALIDAD_COBRO_POR_HORA = "por_hora" as const;

export class PacientesService {
  constructor(
    private readonly pacientesRepository: PacientesRepository,
    private readonly pacienteServiciosService: PacienteServiciosService,
  ) {}

  /** Enriquece asignaciones con cupo del período actual (no aplica en `por_hora`). */
  private async aplicarDisponibilidadAsignaciones(
    dto: PacienteDto,
    referencia: Date = new Date(),
  ): Promise<PacienteDto> {
    const servicios = await Promise.all(
      dto.servicios.map(async (s) => {
        if (s.modalidadCobro === MODALIDAD_COBRO_POR_HORA) {
          return s;
        }
        const disponibilidad = await this.pacienteServiciosService.getDisponibilidad(
          s.pacienteServicioId,
          referencia,
        );
        return { ...s, disponibilidad };
      }),
    );
    return { ...dto, servicios };
  }

  async list(query: ListPacientesQuery): Promise<PaginatedPacientesDto> {
    const result = await this.pacientesRepository.findPaginated(query.page, query.pageSize);
    return mapPaginatedPacientes(result);
  }

  async getById(id: number): Promise<PacienteDto> {
    const paciente = await this.pacientesRepository.findById(id);
    if (!paciente) {
      throw AppError.notFound("Paciente no encontrado");
    }

    const qrDataUrl = await generatePacienteQrDataUrl(paciente.codigoQr);
    const dto = mapPacienteToDto(paciente, qrDataUrl);
    return this.aplicarDisponibilidadAsignaciones(dto);
  }

  async getByCodigoQr(codigoQr: string): Promise<PacienteDto> {
    const paciente = await this.pacientesRepository.findByCodigoQr(codigoQr);
    if (!paciente) {
      throw AppError.notFound("Paciente no encontrado para ese código QR");
    }

    const qrDataUrl = await generatePacienteQrDataUrl(paciente.codigoQr);
    const dto = mapPacienteToDto(paciente, qrDataUrl);
    return this.aplicarDisponibilidadAsignaciones(dto);
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
