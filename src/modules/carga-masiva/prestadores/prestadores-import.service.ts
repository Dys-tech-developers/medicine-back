import { AppError } from "../../../core/errors/AppError.js";
import type { PrestadoresService } from "../../prestadores/prestadores.service.js";
import type { ServiciosRepository } from "../../servicios/servicios.repository.js";
import type { PrestadoresImportErrorDto, PrestadoresImportResultDto } from "./prestadores-import.dto.js";
import { prestadorImportRowSchema } from "./prestadores-import.validation.js";
import {
  PRESTADORES_PLANTILLA_DATA_ROW_COUNT,
  PRESTADORES_SERVICIO_SIN_ASIGNAR,
} from "./prestadores-plantilla.constants.js";
import { parsePrestadoresPlantilla } from "./parsePrestadoresPlantilla.js";
import { mapImportZodErrors } from "../shared/mapImportZodErrors.js";

const CAMPO_POR_PATH: Record<string, string> = {
  nombre: "nombre",
  email: "email",
  password: "password",
  telefono: "telefono",
  lugarResidencia: "lugar_residencia",
  documento: "documento",
  matricula: "matricula",
  cuit: "cuit",
  cbu: "cbu",
  regimenIva: "regimen_iva",
  servicioHabilitado: "servicio_habilitado",
};

export class PrestadoresImportService {
  constructor(
    private readonly prestadoresService: PrestadoresService,
    private readonly serviciosRepository: ServiciosRepository,
  ) {}

  async importFromExcel(buffer: Buffer): Promise<PrestadoresImportResultDto> {
    const parsedRows = await parsePrestadoresPlantilla(buffer);

    if (parsedRows.length === 0) {
      throw AppError.badRequest("El archivo no contiene filas de datos para importar");
    }

    if (parsedRows.length > PRESTADORES_PLANTILLA_DATA_ROW_COUNT) {
      throw AppError.badRequest(
        `El archivo supera el máximo de ${PRESTADORES_PLANTILLA_DATA_ROW_COUNT} filas por importación`,
      );
    }

    const servicios = await this.serviciosRepository.findAllActivosOrderedByNombre();
    const servicioByNombre = new Map(servicios.map((servicio) => [servicio.nombre, servicio]));

    const errores: PrestadoresImportErrorDto[] = [];
    const emailsEnArchivo = new Set<string>();
    let creados = 0;

    for (const row of parsedRows) {
      const validation = prestadorImportRowSchema.safeParse(row.values);

      if (!validation.success) {
        errores.push(...mapImportZodErrors(validation.error.issues, row.fila, CAMPO_POR_PATH));
        continue;
      }

      const data = validation.data;
      const email = data.email.toLowerCase();

      if (emailsEnArchivo.has(email)) {
        errores.push({
          fila: row.fila,
          campo: "email",
          mensaje: "Ese email ya aparece en otra fila del archivo",
        });
        continue;
      }
      emailsEnArchivo.add(email);

      let servicioIds: number[] = [];
      if (data.servicioHabilitado !== PRESTADORES_SERVICIO_SIN_ASIGNAR) {
        const servicio = servicioByNombre.get(data.servicioHabilitado);
        if (!servicio) {
          errores.push({
            fila: row.fila,
            campo: "servicio_habilitado",
            mensaje: "El servicio elegido no existe o está inactivo. Elegí uno de la lista desplegable",
          });
          continue;
        }
        servicioIds = [servicio.id];
      }

      try {
        await this.prestadoresService.create({
          nombre: data.nombre,
          email,
          password: data.password,
          telefono: data.telefono,
          lugarResidencia: data.lugarResidencia,
          documento: data.documento,
          matricula: data.matricula,
          cuit: data.cuit,
          cbu: data.cbu,
          regimenIva: data.regimenIva,
          estado: true,
          servicioIds,
        });
        creados += 1;
      } catch (error) {
        if (error instanceof AppError) {
          errores.push({
            fila: row.fila,
            mensaje: error.message,
          });
          continue;
        }
        throw error;
      }
    }

    return {
      totalFilas: parsedRows.length,
      creados,
      errores,
    };
  }
}
