-- Paciente servicios: frecuencia -> periodo_control + cantidades

DROP TABLE IF EXISTS "paciente_servicios_new";

CREATE TABLE "paciente_servicios_new" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "paciente_id" INTEGER NOT NULL,
    "servicio_id" INTEGER NOT NULL,
    "fecha_inicio" DATETIME NOT NULL,
    "fecha_fin" DATETIME,
    "periodo_control" TEXT NOT NULL,
    "cantidad_permitida" INTEGER NOT NULL,
    "cantidad_horas" INTEGER,
    "modalidad_cobro" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "paciente_servicios_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "pacientes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "paciente_servicios_servicio_id_fkey" FOREIGN KEY ("servicio_id") REFERENCES "servicios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO "paciente_servicios_new" (
    "id",
    "paciente_id",
    "servicio_id",
    "fecha_inicio",
    "fecha_fin",
    "periodo_control",
    "cantidad_permitida",
    "cantidad_horas",
    "modalidad_cobro",
    "estado",
    "created_at",
    "updated_at"
)
SELECT
    "id",
    "paciente_id",
    "servicio_id",
    "fecha_inicio",
    "fecha_fin",
    CASE "frecuencia_tipo"
        WHEN 'diaria' THEN 'diario'
        WHEN 'semanal' THEN 'semanal'
        WHEN 'mensual' THEN 'mensual'
        WHEN 'por_horas' THEN 'diario'
        ELSE 'mensual'
    END,
    COALESCE("frecuencia_valor", 1),
    NULL,
    "modalidad_cobro",
    "estado",
    "created_at",
    "updated_at"
FROM "paciente_servicios";

DROP TABLE "paciente_servicios";
ALTER TABLE "paciente_servicios_new" RENAME TO "paciente_servicios";

CREATE INDEX IF NOT EXISTS "paciente_servicios_paciente_id_idx" ON "paciente_servicios"("paciente_id");
CREATE INDEX IF NOT EXISTS "paciente_servicios_servicio_id_idx" ON "paciente_servicios"("servicio_id");
