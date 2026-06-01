-- SQLite: recrear tabla sin prestador_id conservando filas existentes
PRAGMA foreign_keys=OFF;

CREATE TABLE "evoluciones_clinicas_new" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "historia_clinica_id" INTEGER NOT NULL,
    "fecha" DATETIME NOT NULL,
    "observaciones" TEXT,
    "medicacion" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "evoluciones_clinicas_historia_clinica_id_fkey" FOREIGN KEY ("historia_clinica_id") REFERENCES "historias_clinicas" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "evoluciones_clinicas_new" ("id", "historia_clinica_id", "fecha", "observaciones", "medicacion", "created_at")
SELECT "id", "historia_clinica_id", "fecha", "observaciones", "medicacion", "created_at"
FROM "evoluciones_clinicas";

DROP TABLE "evoluciones_clinicas";
ALTER TABLE "evoluciones_clinicas_new" RENAME TO "evoluciones_clinicas";

CREATE INDEX "evoluciones_clinicas_historia_clinica_id_idx" ON "evoluciones_clinicas"("historia_clinica_id");

PRAGMA foreign_keys=ON;
