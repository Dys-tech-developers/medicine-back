export type VisitaCierreProgramadoHandler = (visitaId: number) => Promise<void>;

const MAX_DELAY_MS = 2_147_483_647;

/**
 * Programa un cierre por visita al llegar `fechaLimite`.
 * Al reiniciar el servidor, `bootstrap` reprograma las visitas iniciadas.
 * El endpoint de cron y el cierre al consultar QR siguen como respaldo si la máquina estuvo apagada.
 */
class VisitaScheduler {
  private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();
  private closeHandler: VisitaCierreProgramadoHandler | null = null;

  registerCloseHandler(handler: VisitaCierreProgramadoHandler): void {
    this.closeHandler = handler;
  }

  schedule(visitaId: number, fechaLimite: Date): void {
    this.clear(visitaId);

    const delayMs = fechaLimite.getTime() - Date.now();
    if (delayMs <= 0) {
      void this.fire(visitaId);
      return;
    }

    const safeDelay = Math.min(delayMs, MAX_DELAY_MS);
    const timer = setTimeout(() => {
      void this.fire(visitaId);
    }, safeDelay);

    this.timers.set(visitaId, timer);
  }

  clear(visitaId: number): void {
    const timer = this.timers.get(visitaId);
    if (timer === undefined) {
      return;
    }
    clearTimeout(timer);
    this.timers.delete(visitaId);
  }

  bootstrap(visitas: Array<{ id: number; fechaLimite: Date }>): void {
    for (const visita of visitas) {
      this.schedule(visita.id, visita.fechaLimite);
    }
  }

  private async fire(visitaId: number): Promise<void> {
    this.timers.delete(visitaId);

    if (!this.closeHandler) {
      console.warn(
        `[visitaScheduler] Sin handler registrado; visita ${visitaId} no se cerró automáticamente`,
      );
      return;
    }

    try {
      await this.closeHandler(visitaId);
    } catch (error) {
      console.error(`[visitaScheduler] Error al cerrar visita ${visitaId}:`, error);
    }
  }
}

export const visitaScheduler = new VisitaScheduler();
