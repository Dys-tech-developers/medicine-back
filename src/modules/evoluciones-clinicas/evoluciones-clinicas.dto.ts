export interface EvolucionClinicaDto {
  id: number;
  historiaClinicaId: number;
  fecha: string;
  observaciones: string | null;
  medicacion: string | null;
  createdAt: string;
}

export interface PaginatedEvolucionesClinicasDto {
  items: EvolucionClinicaDto[];
  total: number;
  page: number;
  pageSize: number;
}
