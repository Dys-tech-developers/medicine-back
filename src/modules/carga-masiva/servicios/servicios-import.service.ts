import { AppError } from "../../../core/errors/AppError.js";
import type { ServiciosService } from "../../servicios/servicios.service.js";
import type { ServiciosImportErrorDto, ServiciosImportResultDto } from "./servicios-import.dto.js";
import { servicioImportRowSchema } from "./servicios-import.validation.js";
import { SERVICIOS_PLANTILLA_DATA_ROW_COUNT } from "./servicios-plantilla.constants.js";
import { parseServiciosPlantilla, type ServicioPlantillaParsedRow } from "./parseServiciosPlantilla.js";
import { mapImportZodErrors } from "../shared/mapImportZodErrors.js";
import type { ServicioImportRowInput } from "./servicios-import.validation.js";

const CAMPO_POR_PATH: Record<string, string> = {
  nombre: "nombre",
  descripcion: "descripcion",
  estado: "estado",
  controlHorario: "control_horario",
  modoRelevo: "modo_relevo",
  modalidadCobro: "modalidad_cobro",
  tipoJornada: "tipo_jornada",
  tipoDia: "tipo_dia",
  valor: "valor",
};

interface ServicioImportGroup {
  nombre: string;
  filas: ServicioPlantillaParsedRow[];
}

function groupRowsByNombre(rows: ServicioPlantillaParsedRow[]): ServicioImportGroup[] {
  const groups = new Map<string, ServicioImportGroup>();

  for (const row of rows) {
    const nombre = row.values.nombre.trim();
    const existing = groups.get(nombre);

    if (existing) {
      existing.filas.push(row);
      continue;
    }

    groups.set(nombre, { nombre, filas: [row] });
  }

  return [...groups.values()];
}

export class ServiciosImportService {
  constructor(private readonly serviciosService: ServiciosService) {}

  async importFromExcel(buffer: Buffer): Promise<ServiciosImportResultDto> {
    const parsedRows = await parseServiciosPlantilla(buffer);

    if (parsedRows.length === 0) {
      throw AppError.badRequest("El archivo no contiene filas de datos para importar");
    }

    if (parsedRows.length > SERVICIOS_PLANTILLA_DATA_ROW_COUNT) {
      throw AppError.badRequest(
        `El archivo supera el máximo de ${SERVICIOS_PLANTILLA_DATA_ROW_COUNT} filas por importación`,
      );
    }

    const errores: ServiciosImportErrorDto[] = [];
    const groups = groupRowsByNombre(parsedRows);
    let creados = 0;

    for (const group of groups) {
      const validatedRows: { fila: number; data: ServicioImportRowInput }[] = [];
      let hasRowErrors = false;

      for (const row of group.filas) {
        const validation = servicioImportRowSchema.safeParse(row.values);

        if (!validation.success) {
          errores.push(...mapImportZodErrors(validation.error.issues, row.fila, CAMPO_POR_PATH));
          hasRowErrors = true;
          continue;
        }

        validatedRows.push({ fila: row.fila, data: validation.data });
      }

      if (hasRowErrors || validatedRows.length === 0) {
        continue;
      }

      const metadata = validatedRows[0]!.data;

      for (const row of validatedRows.slice(1)) {
        const data = row.data;

        if (data.descripcion !== metadata.descripcion) {
          errores.push({
            fila: row.fila,
            campo: "descripcion",
            mensaje: "La descripción debe coincidir con la primera fila del mismo servicio",
          });
          hasRowErrors = true;
        }

        if (data.estado !== metadata.estado) {
          errores.push({
            fila: row.fila,
            campo: "estado",
            mensaje: "El estado debe coincidir con la primera fila del mismo servicio",
          });
          hasRowErrors = true;
        }

        if (data.controlHorario !== metadata.controlHorario) {
          errores.push({
            fila: row.fila,
            campo: "control_horario",
            mensaje: "control_horario debe coincidir con la primera fila del mismo servicio",
          });
          hasRowErrors = true;
        }

        if (data.modoRelevo !== metadata.modoRelevo) {
          errores.push({
            fila: row.fila,
            campo: "modo_relevo",
            mensaje: "modo_relevo debe coincidir con la primera fila del mismo servicio",
          });
          hasRowErrors = true;
        }
      }

      if (hasRowErrors) {
        continue;
      }

      const tarifasVistas = new Set<string>();
      for (const row of validatedRows) {
        const key = `${row.data.modalidadCobro}|${row.data.tipoJornada}|${row.data.tipoDia}`;
        if (tarifasVistas.has(key)) {
          errores.push({
            fila: row.fila,
            campo: "modalidad_cobro",
            mensaje: "Ya existe una tarifa con la misma modalidad, jornada y tipo de día en este servicio",
          });
          hasRowErrors = true;
          continue;
        }
        tarifasVistas.add(key);
      }

      if (hasRowErrors) {
        continue;
      }

      try {
        await this.serviciosService.create({
          nombre: metadata.nombre,
          descripcion: metadata.descripcion,
          estado: metadata.estado,
          controlHorario: metadata.controlHorario,
          modoRelevo: metadata.modoRelevo,
          tarifas: validatedRows.map((row) => ({
            modalidadCobro: row.data.modalidadCobro,
            tipoJornada: row.data.tipoJornada,
            tipoDia: row.data.tipoDia,
            valor: row.data.valor,
          })),
        });
        creados += 1;
      } catch (error) {
        if (error instanceof AppError) {
          errores.push({
            fila: validatedRows[0]!.fila,
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
