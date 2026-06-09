export interface PacientesImportErrorDto {
  fila: number;
  campo?: string;
  mensaje: string;
}

export interface PacientesImportResultDto {
  totalFilas: number;
  creados: number;
  errores: PacientesImportErrorDto[];
}
