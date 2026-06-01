-- Visitas: fecha -> fecha_inicio / fecha_fin; nueva tabla visita_finanzas

DROP TABLE IF EXISTS "visitas_new";
DROP TABLE IF EXISTS "visita_finanzas";

CREATE TABLE IF NOT EXISTS "visita_insumos_backup" AS SELECT * FROM "visita_insumos" WHERE 0;
DELETE FROM "visita_insumos_backup";
INSERT INTO "visita_insumos_backup" SELECT * FROM "visita_insumos";
DROP TABLE IF EXISTS "visita_insumos";

CREATE TABLE "visitas_new" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "paciente_servicio_id" INTEGER NOT NULL,
    "prestador_id" INTEGER NOT NULL,
    "fecha_inicio" DATETIME NOT NULL,
    "fecha_fin" DATETIME NOT NULL,
    "tiempo_minutos" INTEGER NOT NULL,
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
    "fecha_inicio",
    "fecha_fin",
    "tiempo_minutos",
    "observaciones",
    "created_at",
    "updated_at"
)
SELECT
    v."id",
    v."paciente_servicio_id",
    v."prestador_id",
    datetime(CAST(v."fecha" AS INTEGER) / 1000, 'unixepoch'),
    datetime(
        CAST(v."fecha" AS INTEGER) / 1000 + COALESCE(v."tiempo_minutos", 0) * 60,
        'unixepoch'
    ),
    v."tiempo_minutos",
    v."observaciones",
    v."created_at",
    v."updated_at"
FROM "visitas" v;

DROP TABLE "visitas";
ALTER TABLE "visitas_new" RENAME TO "visitas";

CREATE INDEX IF NOT EXISTS "visitas_paciente_servicio_id_idx" ON "visitas"("paciente_servicio_id");
CREATE INDEX IF NOT EXISTS "visitas_prestador_id_idx" ON "visitas"("prestador_id");

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

CREATE UNIQUE INDEX "visita_finanzas_visita_id_key" ON "visita_finanzas"("visita_id");

INSERT INTO "visita_finanzas" (
    "visita_id",
    "modalidad_cobro",
    "tipo_jornada",
    "tipo_dia",
    "valor_unitario",
    "valor_aplicado",
    "facturado",
    "pagado",
    "created_at",
    "updated_at"
)
SELECT
    v."id",
    ps."modalidad_cobro",
    st."tipo_jornada",
    st."tipo_dia",
    st."valor",
    st."valor",
    0,
    0,
    v."created_at",
    v."updated_at"
FROM "visitas" v
INNER JOIN "paciente_servicios" ps ON ps."id" = v."paciente_servicio_id"
INNER JOIN "servicio_tarifas" st ON st."servicio_id" = ps."servicio_id"
    AND st."modalidad_cobro" = ps."modalidad_cobro"
WHERE st."id" = (
    SELECT MIN(st2."id")
    FROM "servicio_tarifas" st2
    WHERE st2."servicio_id" = ps."servicio_id"
      AND st2."modalidad_cobro" = ps."modalidad_cobro"
);

CREATE TABLE "visita_insumos" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "visita_id" INTEGER NOT NULL,
    "insumo_id" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "visita_insumos_visita_id_fkey" FOREIGN KEY ("visita_id") REFERENCES "visitas" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "visita_insumos_insumo_id_fkey" FOREIGN KEY ("insumo_id") REFERENCES "insumos" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO "visita_insumos" ("id", "visita_id", "insumo_id", "cantidad", "created_at")
SELECT b."id", b."visita_id", b."insumo_id", b."cantidad", b."created_at"
FROM "visita_insumos_backup" b
WHERE EXISTS (SELECT 1 FROM "visitas" v WHERE v."id" = b."visita_id");

DROP TABLE "visita_insumos_backup";

CREATE INDEX IF NOT EXISTS "visita_insumos_visita_id_idx" ON "visita_insumos"("visita_id");
CREATE INDEX IF NOT EXISTS "visita_insumos_insumo_id_idx" ON "visita_insumos"("insumo_id");
