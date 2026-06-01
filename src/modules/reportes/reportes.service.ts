import type { ReporteSqlFiltros } from "../../shared/reportes/buildReporteSqlWhere.js";
import { resolveEstadoCuentaFiltros } from "../../shared/reportes/resolveEstadoCuentaFiltros.js";
import type { RangoFechasReporte } from "../../shared/reportes/resolveRangoFechasReporte.js";
import type {
  ReportePrestadoresResponseDto,
  ReporteServiciosResponseDto,
  ReporteVisitasResponseDto,
} from "./reportes.dto.js";
import {
  mapReportePrestadores,
  mapReporteServicios,
  mapReporteVisitas,
} from "./reportes.mapper.js";
import type { ReportesRepository } from "./reportes.repository.js";
import type { ReportesQuery, ReportesVisitasQuery } from "./reportes.validation.js";

export class ReportesService {
  constructor(private readonly reportesRepository: ReportesRepository) {}

  async reportePorPrestadores(query: ReportesQuery): Promise<ReportePrestadoresResponseDto> {
    const { filtros, rango } = this.resolveFiltros(query);
    const [rows, resumen] = await Promise.all([
      this.reportesRepository.aggregatePorPrestador(filtros),
      this.reportesRepository.aggregateResumenGlobal(filtros),
    ]);
    return mapReportePrestadores(rows, resumen, query, rango);
  }

  async reportePorServicios(query: ReportesQuery): Promise<ReporteServiciosResponseDto> {
    const { filtros, rango } = this.resolveFiltros(query);
    const [rows, resumen] = await Promise.all([
      this.reportesRepository.aggregatePorServicio(filtros),
      this.reportesRepository.aggregateResumenGlobal(filtros),
    ]);
    return mapReporteServicios(rows, resumen, query, rango);
  }

  async reporteVisitas(query: ReportesVisitasQuery): Promise<ReporteVisitasResponseDto> {
    const { filtros, rango } = this.resolveFiltros(query);
    const [paginated, resumen] = await Promise.all([
      this.reportesRepository.findVisitasPaginated(query.page, query.pageSize, filtros),
      this.reportesRepository.aggregateResumenGlobal(filtros),
    ]);
    return mapReporteVisitas(paginated, resumen, query, rango);
  }

  private resolveFiltros(query: ReportesQuery): {
    filtros: ReporteSqlFiltros;
    rango: RangoFechasReporte;
  } {
    const { filtros: baseFiltros, rango } = resolveEstadoCuentaFiltros(query);

    const filtros: ReporteSqlFiltros = {
      ...baseFiltros,
      prestadorId: query.prestadorId,
      servicioId: query.servicioId,
      facturado: query.facturado,
      pagado: query.pagado,
    };

    return { filtros, rango };
  }
}
