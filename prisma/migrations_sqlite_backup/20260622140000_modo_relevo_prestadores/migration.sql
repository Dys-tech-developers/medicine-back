-- AlterTable
ALTER TABLE "servicios" ADD COLUMN "modo_relevo" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "paciente_servicio_prestadores" (
    "paciente_servicio_id" INTEGER NOT NULL,
    "prestador_id" INTEGER NOT NULL,

    PRIMARY KEY ("paciente_servicio_id", "prestador_id"),
    CONSTRAINT "paciente_servicio_prestadores_paciente_servicio_id_fkey" FOREIGN KEY ("paciente_servicio_id") REFERENCES "paciente_servicios" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "paciente_servicio_prestadores_prestador_id_fkey" FOREIGN KEY ("prestador_id") REFERENCES "prestadores" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "paciente_servicio_prestadores_prestador_id_idx" ON "paciente_servicio_prestadores"("prestador_id");

-- AlterTable
ALTER TABLE "visitas" ADD COLUMN "cierre_por_relevo" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "visitas" ADD COLUMN "prestador_relevo_id" INTEGER;
