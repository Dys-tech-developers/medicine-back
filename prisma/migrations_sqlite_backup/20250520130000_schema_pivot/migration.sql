-- Pivot de esquema: obras sociales, tarifas, paciente_servicios, visitas por paciente_servicio

CREATE TABLE IF NOT EXISTS "obras_sociales" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO "obras_sociales" ("nombre", "codigo", "estado")
SELECT 'Sin obra social', 'SIN-OS', true
WHERE NOT EXISTS (SELECT 1 FROM "obras_sociales");

ALTER TABLE "prestadores" ADD COLUMN "cbu" TEXT NOT NULL DEFAULT '';
ALTER TABLE "prestadores" ADD COLUMN "regimen_iva" TEXT NOT NULL DEFAULT 'monotributo';

ALTER TABLE "servicios" ADD COLUMN "descripcion" TEXT;
ALTER TABLE "servicios" ADD COLUMN "created_at" DATETIME;
UPDATE "servicios" SET "created_at" = CURRENT_TIMESTAMP WHERE "created_at" IS NULL;

CREATE TABLE IF NOT EXISTS "servicio_tarifas" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "servicio_id" INTEGER NOT NULL,
    "modalidad_cobro" TEXT NOT NULL,
    "tipo_jornada" TEXT NOT NULL,
    "tipo_dia" TEXT NOT NULL,
    "valor" DECIMAL NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "servicio_tarifas_servicio_id_fkey" FOREIGN KEY ("servicio_id") REFERENCES "servicios" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "servicio_tarifas_servicio_id_idx" ON "servicio_tarifas"("servicio_id");

ALTER TABLE "pacientes" ADD COLUMN "obra_social_id" INTEGER;
UPDATE "pacientes" SET "obra_social_id" = (SELECT MIN("id") FROM "obras_sociales") WHERE "obra_social_id" IS NULL;
CREATE INDEX IF NOT EXISTS "pacientes_obra_social_id_idx" ON "pacientes"("obra_social_id");

CREATE TABLE IF NOT EXISTS "paciente_servicios" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "paciente_id" INTEGER NOT NULL,
    "servicio_id" INTEGER NOT NULL,
    "fecha_inicio" DATETIME NOT NULL,
    "fecha_fin" DATETIME,
    "frecuencia_tipo" TEXT NOT NULL,
    "frecuencia_valor" INTEGER NOT NULL,
    "modalidad_cobro" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "paciente_servicios_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "pacientes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "paciente_servicios_servicio_id_fkey" FOREIGN KEY ("servicio_id") REFERENCES "servicios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "paciente_servicios_paciente_id_idx" ON "paciente_servicios"("paciente_id");
CREATE INDEX IF NOT EXISTS "paciente_servicios_servicio_id_idx" ON "paciente_servicios"("servicio_id");

INSERT INTO "paciente_servicios" (
    "paciente_id",
    "servicio_id",
    "fecha_inicio",
    "fecha_fin",
    "frecuencia_tipo",
    "frecuencia_valor",
    "modalidad_cobro",
    "estado",
    "created_at",
    "updated_at"
)
SELECT
    p."paciente_id",
    ps."servicio_id",
    p."fecha_inicio",
    p."fecha_fin",
    'mensual',
    p."frecuencia_mensual",
    'por_servicio',
    lower(p."estado"),
    p."created_at",
    p."updated_at"
FROM "prestaciones_servicios" ps
INNER JOIN "prestaciones" p ON p."id" = ps."prestacion_id"
WHERE NOT EXISTS (SELECT 1 FROM "paciente_servicios" LIMIT 1);

CREATE TABLE "visita_insumos_backup" AS SELECT * FROM "visita_insumos";
DROP TABLE "visita_insumos";

CREATE TABLE "visitas_new" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "paciente_servicio_id" INTEGER NOT NULL,
    "prestador_id" INTEGER NOT NULL,
    "fecha" DATETIME NOT NULL,
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
    "fecha",
    "tiempo_minutos",
    "observaciones",
    "created_at",
    "updated_at"
)
SELECT
    v."id",
    (
        SELECT ps2."id"
        FROM "paciente_servicios" ps2
        INNER JOIN "prestaciones_servicios" old_ps ON old_ps."servicio_id" = ps2."servicio_id"
        WHERE old_ps."prestacion_id" = v."prestacion_id"
          AND ps2."paciente_id" = (SELECT p."paciente_id" FROM "prestaciones" p WHERE p."id" = v."prestacion_id")
        LIMIT 1
    ),
    v."prestador_id",
    v."fecha",
    v."tiempo_minutos",
    v."observaciones",
    v."created_at",
    v."updated_at"
FROM "visitas" v
WHERE EXISTS (
    SELECT 1
    FROM "paciente_servicios" ps2
    INNER JOIN "prestaciones_servicios" old_ps ON old_ps."servicio_id" = ps2."servicio_id"
    WHERE old_ps."prestacion_id" = v."prestacion_id"
);

DROP TABLE "visitas";
ALTER TABLE "visitas_new" RENAME TO "visitas";

CREATE INDEX IF NOT EXISTS "visitas_paciente_servicio_id_idx" ON "visitas"("paciente_servicio_id");
CREATE INDEX IF NOT EXISTS "visitas_prestador_id_idx" ON "visitas"("prestador_id");

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

DROP TABLE IF EXISTS "prestaciones_servicios";
DROP TABLE IF EXISTS "prestaciones";

DROP INDEX IF EXISTS "roles_nombre_key";
