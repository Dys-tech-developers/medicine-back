export interface StockImportErrorDto {
  fila: number;
  campo?: string;
  mensaje: string;
}

export interface StockImportResultDto {
  totalFilas: number;
  creados: number;
  errores: StockImportErrorDto[];
}
