import { AppError } from "../../../core/errors/AppError.js";
import type { LocalidadesRepository } from "../../localidades/localidades.repository.js";
import type { ObrasSocialesRepository } from "../../obras-sociales/obras-sociales.repository.js";
import type { CreatePacienteData, PacientesRepository } from "../../pacientes/pacientes.repository.js";
import {
  PACIENTE_OBRA_SOCIAL_SIN_DATO_CODIGO,
  PACIENTE_OBRA_SOCIAL_SIN_DATO_CODIGO_FALLBACK,
  resolvePacienteCampos,
} from "../../../shared/paciente/pacienteDefaults.js";
import type { PacientesImportErrorDto, PacientesImportResultDto } from "./pacientes-import.dto.js";
import { pacienteImportRowSchema } from "./pacientes-import.validation.js";
import { PACIENTES_PLANTILLA_DATA_ROW_COUNT } from "./pacientes-plantilla.constants.js";
import { parsePacientesPlantilla } from "./parsePacientesPlantilla.js";
import { mapImportZodErrors } from "../shared/mapImportZodErrors.js";

const CAMPO_POR_PATH: Record<string, string> = {
  obraSocial: "obra_social",
  nombre: "nombre",
  apellido: "apellido",
  numeroDocumento: "numero_documento",
  fechaNacimiento: "fecha_nacimiento",
  sexo: "sexo",
  telefono: "telefono",
  direccion: "direccion",
  localidad: "localidad",
  numeroAfiliado: "numero_afiliado",
};

export class PacientesImportService {
  constructor(
    private readonly pacientesRepository: PacientesRepository,
    private readonly obrasSocialesRepository: ObrasSocialesRepository,
    private readonly localidadesRepository: LocalidadesRepository,
  ) {}

  async importFromExcel(buffer: Buffer): Promise<PacientesImportResultDto> {
    const parsedRows = await parsePacientesPlantilla(buffer);

    if (parsedRows.length === 0) {
      throw AppError.badRequest("El archivo no contiene filas de datos para importar");
    }

    if (parsedRows.length > PACIENTES_PLANTILLA_DATA_ROW_COUNT) {
      throw AppError.badRequest(
        `El archivo supera el máximo de ${PACIENTES_PLANTILLA_DATA_ROW_COUNT} filas por importación`,
      );
    }

    const [obrasSociales, localidades, defaultObraSocialId] = await Promise.all([
      this.obrasSocialesRepository.findAllActivasOrderedByNombre(),
      this.localidadesRepository.findAllOrderedByNombre(),
      this.resolveDefaultObraSocialId(),
    ]);

    const obraSocialByNombre = new Map(obrasSociales.map((obraSocial) => [obraSocial.nombre, obraSocial]));
    const localidadNombres = new Set(localidades.map((localidad) => localidad.nombre));

    const errores: PacientesImportErrorDto[] = [];
    const validItems: CreatePacienteData[] = [];

    for (const row of parsedRows) {
      const validation = pacienteImportRowSchema.safeParse(row.values);

      if (!validation.success) {
        errores.push(...mapImportZodErrors(validation.error.issues, row.fila, CAMPO_POR_PATH));
        continue;
      }

      const data = validation.data;
      const obraSocialNombre = data.obraSocial.trim();
      const obraSocial =
        obraSocialNombre.length > 0 ? obraSocialByNombre.get(obraSocialNombre) : undefined;

      if (obraSocialNombre.length > 0 && !obraSocial) {
        errores.push({
          fila: row.fila,
          campo: "obra_social",
          mensaje: "La obra social elegida no existe o está inactiva. Elegí una de la lista desplegable",
        });
        continue;
      }

      const localidad = data.localidad.trim();
      if (localidad.length > 0 && !localidadNombres.has(localidad)) {
        errores.push({
          fila: row.fila,
          campo: "localidad",
          mensaje: "La localidad elegida no es válida. Elegí una de la lista desplegable",
        });
        continue;
      }

      const campos = resolvePacienteCampos({
        nombre: data.nombre,
        apellido: data.apellido,
        numeroDocumento: data.numeroDocumento,
        fechaNacimiento: data.fechaNacimiento,
        sexo: data.sexo,
        telefono: data.telefono,
        direccion: data.direccion,
        localidad: data.localidad,
        numeroAfiliado: data.numeroAfiliado,
        uniqueDocumentKey: `fila-${row.fila}`,
      });

      validItems.push({
        obraSocialId: obraSocial?.id ?? defaultObraSocialId,
        ...campos,
      });
    }

    const creados =
      validItems.length > 0
        ? await this.pacientesRepository.createManyWithCodigoQr(validItems)
        : 0;

    return {
      totalFilas: parsedRows.length,
      creados,
      errores,
    };
  }

  private async resolveDefaultObraSocialId(): Promise<number> {
    const obraSocialId =
      (await this.obrasSocialesRepository.findActivaIdByCodigo(
        PACIENTE_OBRA_SOCIAL_SIN_DATO_CODIGO,
      )) ??
      (await this.obrasSocialesRepository.findActivaIdByCodigo(
        PACIENTE_OBRA_SOCIAL_SIN_DATO_CODIGO_FALLBACK,
      ));

    if (obraSocialId === null) {
      throw AppError.badRequest(
        "No hay una obra social por defecto configurada para importar pacientes sin obra social",
      );
    }

    return obraSocialId;
  }
}
