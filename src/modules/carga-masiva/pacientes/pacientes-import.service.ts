import { AppError } from "../../../core/errors/AppError.js";
import type { LocalidadesRepository } from "../../localidades/localidades.repository.js";
import type { ObrasSocialesRepository } from "../../obras-sociales/obras-sociales.repository.js";
import type { CreatePacienteData, PacientesRepository } from "../../pacientes/pacientes.repository.js";
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

    const [obrasSociales, localidades] = await Promise.all([
      this.obrasSocialesRepository.findAllActivasOrderedByNombre(),
      this.localidadesRepository.findAllOrderedByNombre(),
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
      const obraSocial = obraSocialByNombre.get(data.obraSocial);

      if (!obraSocial) {
        errores.push({
          fila: row.fila,
          campo: "obra_social",
          mensaje: "La obra social elegida no existe o está inactiva. Elegí una de la lista desplegable",
        });
        continue;
      }

      if (!localidadNombres.has(data.localidad)) {
        errores.push({
          fila: row.fila,
          campo: "localidad",
          mensaje: "La localidad elegida no es válida. Elegí una de la lista desplegable",
        });
        continue;
      }

      validItems.push({
        obraSocialId: obraSocial.id,
        nombre: data.nombre,
        apellido: data.apellido,
        numeroDocumento: data.numeroDocumento,
        fechaNacimiento: data.fechaNacimiento,
        sexo: data.sexo,
        telefono: data.telefono,
        direccion: data.direccion,
        localidad: data.localidad,
        numeroAfiliado: data.numeroAfiliado,
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
}
