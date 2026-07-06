-- CreateTable
CREATE TABLE "evoluciones_clinicas" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "historia_clinica_id" INTEGER NOT NULL,
    "prestador_id" INTEGER NOT NULL,
    "fecha" DATETIME NOT NULL,
    "observaciones" TEXT,
    "medicacion" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "evoluciones_clinicas_historia_clinica_id_fkey" FOREIGN KEY ("historia_clinica_id") REFERENCES "historias_clinicas" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "evoluciones_clinicas_prestador_id_fkey" FOREIGN KEY ("prestador_id") REFERENCES "prestadores" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "evoluciones_clinicas_historia_clinica_id_idx" ON "evoluciones_clinicas"("historia_clinica_id");

-- CreateIndex
CREATE INDEX "evoluciones_clinicas_prestador_id_idx" ON "evoluciones_clinicas"("prestador_id");
