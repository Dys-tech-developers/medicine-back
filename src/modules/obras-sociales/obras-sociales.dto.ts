export interface ObraSocialDto {
  id: number;
  nombre: string;
  codigo: string;
  estado: boolean;
  createdAt: string;
}

export interface PaginatedObrasSocialesDto {
  items: ObraSocialDto[];
  total: number;
  page: number;
  pageSize: number;
}
