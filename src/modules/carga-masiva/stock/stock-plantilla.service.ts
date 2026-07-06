import { STOCK_PLANTILLA_FILENAME } from "./stock-plantilla.constants.js";
import { buildStockPlantillaWorkbook } from "./buildStockPlantillaWorkbook.js";

export interface StockPlantillaDownload {
  filename: string;
  buffer: Buffer;
}

export class StockPlantillaService {
  async generatePlantilla(): Promise<StockPlantillaDownload> {
    const buffer = await buildStockPlantillaWorkbook();

    return {
      filename: STOCK_PLANTILLA_FILENAME,
      buffer,
    };
  }
}
