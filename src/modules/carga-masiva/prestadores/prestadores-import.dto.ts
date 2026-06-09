export interface PrestadoresImportErrorDto {
  fila: number;
  campo?: string;
  mensaje: string;
}

export interface PrestadoresImportResultDto {
  totalFilas: number;
  creados: number;
  errores: PrestadoresImportErrorDto[];
}
