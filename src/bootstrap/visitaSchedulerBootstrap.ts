import { prisma } from "../shared/prisma.js";
import { VisitasRepository } from "../modules/visitas/visitas.repository.js";
import { VisitasService } from "../modules/visitas/visitas.service.js";
import { calcularFechaLimiteVisita } from "../shared/visita/visitaLimite.js";
import { visitaScheduler } from "../shared/visita/visitaScheduler.js";

export async function bootstrapVisitaScheduler(): Promise<void> {
  const visitasRepository = new VisitasRepository(prisma);
  const visitasService = new VisitasService(visitasRepository);

  visitaScheduler.registerCloseHandler(async (visitaId) => {
    await visitasService.cerrarVisitasVencidas({ visitaId, referencia: new Date() });
  });

  const visitasIniciadas = await visitasRepository.findVisitasIniciadasParaCierre({});
  const programables = visitasIniciadas.flatMap((visita) => {
    const { cantidadHoras } = visita.pacienteServicio;
    if (cantidadHoras == null || !visita.pacienteServicio.servicio.controlHorario) {
      return [];
    }
    if (visita.pacienteServicio.servicio.modoRelevo) {
      return [];
    }
    return [
      {
        id: visita.id,
        fechaLimite: calcularFechaLimiteVisita(visita.fechaInicio, cantidadHoras),
      },
    ];
  });

  visitaScheduler.bootstrap(programables);

  console.info(
    `[visitaScheduler] ${programables.length} cierre(s) programado(s) (${visitasIniciadas.length} visita(s) iniciada(s) al arranque)`,
  );
}
