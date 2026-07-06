import type { ModalidadCobro } from "../constants/modalidad-cobro.js";
import type { PeriodoControl } from "../constants/periodo-control.js";

export type ModoAsignacionServicio = "relevo" | "control_horario" | "visita_unica";

export type CampoAsignacionServicio =
  | "prestadorId"
  | "prestadorIds"
  | "fechaInicio"
  | "fechaFin"
  | "coberturaDiariaInicio"
  | "coberturaDiariaFin"
  | "periodoControl"
  | "cantidadPermitida"
  | "cantidadHoras"
  | "modalidadCobro"
  | "estado";

export interface CoberturaDiariaReglasDto {
  /** Si inicio y fin van vacíos, la cobertura es las 24 h de cada día (dentro de la vigencia). */
  todoElDiaPorDefecto: boolean;
  formato: "HH:mm";
  etiquetaInicio: string;
  etiquetaFin: string;
  ayuda: string;
}

export interface ReglasAsignacionDefaultsDto {
  periodoControl: PeriodoControl;
  cantidadPermitida: number;
  modalidadCobro: ModalidadCobro;
  cantidadHoras: number | null;
}

export interface ReglasAsignacionServicioDto {
  modo: ModoAsignacionServicio;
  camposVisibles: CampoAsignacionServicio[];
  /** Valores aplicados por el backend cuando `modo === "relevo"` (el front puede omitirlos). */
  defaults: Partial<ReglasAsignacionDefaultsDto>;
  minPrestadores: number;
  ayudaFormulario: string;
  ayudaFlujoVisita: string;
  /** Solo en modo relevo: ventana horaria opcional por día. */
  coberturaDiaria?: CoberturaDiariaReglasDto;
}

const CAMPOS_BASE: CampoAsignacionServicio[] = [
  "fechaInicio",
  "fechaFin",
  "periodoControl",
  "cantidadPermitida",
  "modalidadCobro",
  "estado",
];

const DEFAULTS_RELEVO: ReglasAsignacionDefaultsDto = {
  periodoControl: "diario",
  cantidadPermitida: 1,
  modalidadCobro: "por_hora",
  cantidadHoras: null,
};

export function buildReglasAsignacion(servicio: {
  controlHorario: boolean;
  modoRelevo: boolean;
}): ReglasAsignacionServicioDto {
  if (servicio.modoRelevo) {
    return {
      modo: "relevo",
      camposVisibles: [
        "prestadorIds",
        "fechaInicio",
        "fechaFin",
        "coberturaDiariaInicio",
        "coberturaDiariaFin",
        "estado",
      ],
      defaults: DEFAULTS_RELEVO,
      minPrestadores: 1,
      ayudaFormulario:
        "Cobertura por relevo al escanear el QR. Definí qué prestadores pueden cubrir, la vigencia (fechas) y, si corresponde, el horario diario autorizado. Si no indicás horario, se asume cobertura las 24 horas de cada día.",
      ayudaFlujoVisita:
        "Al escanear el QR el prestador toma o releva cobertura (POST /visitas/relevar). No puede finalizar sola. Solo se puede relevar dentro del horario diario configurado, si lo hay.",
      coberturaDiaria: {
        todoElDiaPorDefecto: true,
        formato: "HH:mm",
        etiquetaInicio: "Hora inicio cobertura diaria",
        etiquetaFin: "Hora fin cobertura diaria",
        ayuda:
          "Opcional. Dejá ambas vacías si el paciente requiere cobertura las 24 horas. Completalas si la autorización es solo por un tramo del día (ej. 08:00 a 20:00). Puede cruzar medianoche (ej. 22:00 a 06:00).",
      },
    };
  }

  if (servicio.controlHorario) {
    return {
      modo: "control_horario",
      camposVisibles: [
        "prestadorId",
        "prestadorIds",
        ...CAMPOS_BASE,
        "cantidadHoras",
      ],
      defaults: {},
      minPrestadores: 0,
      ayudaFormulario:
        "Visita con doble escaneo: el prestador inicia y finaliza su turno. Configurá cupo del período y cantidad de horas por visita.",
      ayudaFlujoVisita:
        "Al escanear el QR: iniciar visita y luego finalizarla. Si supera las horas configuradas puede cerrarse automáticamente.",
    };
  }

  return {
    modo: "visita_unica",
    camposVisibles: ["prestadorId", "prestadorIds", ...CAMPOS_BASE, "cantidadHoras"],
    defaults: {},
    minPrestadores: 0,
    ayudaFormulario:
      "Visita registrada en un solo paso al escanear o cargar manualmente. Configurá cupo del período según la autorización.",
    ayudaFlujoVisita: "Al escanear el QR se registra la visita completa (POST /visitas).",
  };
}

export function resolveAsignacionCamposParaRelevo(
  modoRelevo: boolean,
): ReglasAsignacionDefaultsDto | null {
  if (!modoRelevo) {
    return null;
  }
  return {
    periodoControl: DEFAULTS_RELEVO.periodoControl,
    cantidadPermitida: DEFAULTS_RELEVO.cantidadPermitida,
    modalidadCobro: DEFAULTS_RELEVO.modalidadCobro,
    cantidadHoras: DEFAULTS_RELEVO.cantidadHoras,
  };
}

export function camposAsignacionFaltantes(
  servicio: { controlHorario: boolean; modoRelevo: boolean },
  input: {
    periodoControl?: string | undefined;
    cantidadPermitida?: number | undefined;
    modalidadCobro?: string | undefined;
  },
): string[] {
  if (servicio.modoRelevo) {
    return [];
  }

  const faltantes: string[] = [];
  if (input.periodoControl === undefined) {
    faltantes.push("periodoControl");
  }
  if (input.cantidadPermitida === undefined) {
    faltantes.push("cantidadPermitida");
  }
  if (input.modalidadCobro === undefined) {
    faltantes.push("modalidadCobro");
  }
  return faltantes;
}
