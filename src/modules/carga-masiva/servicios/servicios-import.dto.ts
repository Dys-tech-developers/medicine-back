export interface ServiciosImportErrorDto {
  fila: number;
  campo?: string;
  mensaje: string;
}

export interface ServiciosImportResultDto {
  totalFilas: number;
  creados: number;
  errores: ServiciosImportErrorDto[];
}
