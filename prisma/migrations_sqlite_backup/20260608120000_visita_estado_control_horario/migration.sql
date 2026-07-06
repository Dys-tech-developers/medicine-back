-- Servicio: control horario (doble escaneo)
ALTER TABLE "servicios" ADD COLUMN "control_horario" BOOLEAN NOT NULL DEFAULT false;

-- Visita: estado y campos opcionales mientras está iniciada
-- SQLite no soporta ALTER COLUMN; recreamos la tabla (patrón del proyecto).

PRAGMA foreign_keys=OFF;

CREATE TABLE "visita_finanzas_backup" AS SELECT * FROM "visita_finanzas";
DROP TABLE "visita_finanzas";

CREATE TABLE "visita_insumos_backup" AS SELECT * FROM "visita_insumos";
DROP TABLE "visita_insumos";

CREATE TABLE "visitas_new" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "paciente_servicio_id" INTEGER NOT NULL,
    "prestador_id" INTEGER NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'finalizada',
    "fecha_inicio" DATETIME NOT NULL,
    "fecha_fin" DATETIME,
    "tiempo_minutos" INTEGER,
    "observaciones" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "visitas_paciente_servicio_id_fkey" FOREIGN KEY ("paciente_servicio_id") REFERENCES "paciente_servicios" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "visitas_prestador_id_fkey" FOREIGN KEY ("prestador_id") REFERENCES "prestadores" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO "visitas_new" (
    "id",
    "paciente_servicio_id",
    "prestador_id",
    "estado",
    "fecha_inicio",
    "fecha_fin",
    "tiempo_minutos",
    "observaciones",
    "created_at",
    "updated_at"
)
SELECT
    "id",
    "paciente_servicio_id",
    "prestador_id",
    'finalizada',
    "fecha_inicio",
    "fecha_fin",
    "tiempo_minutos",
    "observaciones",
    "created_at",
    "updated_at"
FROM "visitas";

DROP TABLE "visitas";
ALTER TABLE "visitas_new" RENAME TO "visitas";

CREATE INDEX IF NOT EXISTS "visitas_paciente_servicio_id_idx" ON "visitas"("paciente_servicio_id");
CREATE INDEX IF NOT EXISTS "visitas_prestador_id_idx" ON "visitas"("prestador_id");
CREATE INDEX IF NOT EXISTS "visitas_estado_idx" ON "visitas"("estado");

CREATE TABLE "visita_finanzas" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "visita_id" INTEGER NOT NULL,
    "modalidad_cobro" TEXT NOT NULL,
    "tipo_jornada" TEXT NOT NULL,
    "tipo_dia" TEXT NOT NULL,
    "valor_unitario" DECIMAL NOT NULL,
    "valor_aplicado" DECIMAL NOT NULL,
    "facturado" BOOLEAN NOT NULL DEFAULT false,
    "pagado" BOOLEAN NOT NULL DEFAULT false,
    "fecha_facturacion" DATETIME,
    "fecha_pago" DATETIME,
    "observaciones" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "visita_finanzas_visita_id_fkey" FOREIGN KEY ("visita_id") REFERENCES "visitas" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "visita_finanzas" SELECT * FROM "visita_finanzas_backup";
DROP TABLE "visita_finanzas_backup";

CREATE UNIQUE INDEX "visita_finanzas_visita_id_key" ON "visita_finanzas"("visita_id");

CREATE TABLE "visita_insumos" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "visita_id" INTEGER NOT NULL,
    "insumo_id" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "visita_insumos_visita_id_fkey" FOREIGN KEY ("visita_id") REFERENCES "visitas" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "visita_insumos_insumo_id_fkey" FOREIGN KEY ("insumo_id") REFERENCES "insumos" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO "visita_insumos" SELECT * FROM "visita_insumos_backup";
DROP TABLE "visita_insumos_backup";

CREATE INDEX IF NOT EXISTS "visita_insumos_visita_id_idx" ON "visita_insumos"("visita_id");
CREATE INDEX IF NOT EXISTS "visita_insumos_insumo_id_idx" ON "visita_insumos"("insumo_id");

PRAGMA foreign_keys=ON;
