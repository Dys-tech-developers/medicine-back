import { AppError } from "../../../core/errors/AppError.js";
import type { InsumosService } from "../../insumos/insumos.service.js";
import type { StockImportErrorDto, StockImportResultDto } from "./stock-import.dto.js";
import { stockImportRowSchema } from "./stock-import.validation.js";
import { STOCK_PLANTILLA_DATA_ROW_COUNT } from "./stock-plantilla.constants.js";
import { parseStockPlantilla } from "./parseStockPlantilla.js";
import { mapImportZodErrors } from "../shared/mapImportZodErrors.js";

const CAMPO_POR_PATH: Record<string, string> = {
  nombre: "nombre",
  descripcion: "descripcion",
  codigo: "codigo",
  stockActual: "stock_actual",
  stockMinimo: "stock_minimo",
  unidadMedida: "unidad_medida",
  requiereVencimiento: "requiere_vencimiento",
  fechaVencimiento: "fecha_vencimiento",
  estado: "estado",
};

export class StockImportService {
  constructor(private readonly insumosService: InsumosService) {}

  async importFromExcel(buffer: Buffer): Promise<StockImportResultDto> {
    const parsedRows = await parseStockPlantilla(buffer);

    if (parsedRows.length === 0) {
      throw AppError.badRequest("El archivo no contiene filas de datos para importar");
    }

    if (parsedRows.length > STOCK_PLANTILLA_DATA_ROW_COUNT) {
      throw AppError.badRequest(
        `El archivo supera el máximo de ${STOCK_PLANTILLA_DATA_ROW_COUNT} filas por importación`,
      );
    }

    const errores: StockImportErrorDto[] = [];
    const codigosEnArchivo = new Set<string>();
    let creados = 0;

    for (const row of parsedRows) {
      const validation = stockImportRowSchema.safeParse(row.values);

      if (!validation.success) {
        errores.push(...mapImportZodErrors(validation.error.issues, row.fila, CAMPO_POR_PATH));
        continue;
      }

      const data = validation.data;
      const codigo = data.codigo.trim();

      if (codigosEnArchivo.has(codigo)) {
        errores.push({
          fila: row.fila,
          campo: "codigo",
          mensaje: "Ese código ya aparece en otra fila del archivo",
        });
        continue;
      }
      codigosEnArchivo.add(codigo);

      try {
        await this.insumosService.create({
          nombre: data.nombre,
          descripcion: data.descripcion,
          codigo,
          stockActual: data.stockActual,
          stockMinimo: data.stockMinimo,
          unidadMedida: data.unidadMedida,
          requiereVencimiento: data.requiereVencimiento,
          fechaVencimiento: data.requiereVencimiento ? data.fechaVencimiento : null,
          estado: data.estado,
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
