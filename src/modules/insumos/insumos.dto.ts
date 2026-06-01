export interface InsumoDto {
  id: number;
  nombre: string;
  descripcion: string | null;
  codigo: string;
  stockActual: number;
  stockMinimo: number;
  unidadMedida: string;
  requiereVencimiento: boolean;
  fechaVencimiento: string | null;
  estado: boolean;
  bajoStock: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedInsumosDto {
  items: InsumoDto[];
  total: number;
  page: number;
  pageSize: number;
}
