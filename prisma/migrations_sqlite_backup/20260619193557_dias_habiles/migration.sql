-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_pacientes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "obra_social_id" INTEGER NOT NULL,
    "codigo_qr" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "numero_documento" TEXT NOT NULL,
    "fecha_nacimiento" DATETIME NOT NULL,
    "sexo" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "localidad" TEXT NOT NULL,
    "numero_afiliado" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "pacientes_obra_social_id_fkey" FOREIGN KEY ("obra_social_id") REFERENCES "obras_sociales" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_pacientes" ("apellido", "codigo_qr", "created_at", "direccion", "fecha_nacimiento", "id", "localidad", "nombre", "numero_afiliado", "numero_documento", "obra_social_id", "sexo", "telefono", "updated_at") SELECT "apellido", "codigo_qr", "created_at", "direccion", "fecha_nacimiento", "id", "localidad", "nombre", "numero_afiliado", "numero_documento", "obra_social_id", "sexo", "telefono", "updated_at" FROM "pacientes";
DROP TABLE "pacientes";
ALTER TABLE "new_pacientes" RENAME TO "pacientes";
CREATE UNIQUE INDEX "pacientes_codigo_qr_key" ON "pacientes"("codigo_qr");
CREATE UNIQUE INDEX "pacientes_numero_documento_key" ON "pacientes"("numero_documento");
CREATE INDEX "pacientes_obra_social_id_idx" ON "pacientes"("obra_social_id");
CREATE TABLE "new_prestadores" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "telefono" TEXT NOT NULL,
    "lugar_residencia" TEXT NOT NULL,
    "documento" TEXT NOT NULL,
    "matricula" TEXT NOT NULL,
    "cuit" TEXT NOT NULL,
    "cbu" TEXT NOT NULL,
    "regimen_iva" TEXT NOT NULL,
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "prestadores_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_prestadores" ("cbu", "created_at", "cuit", "documento", "estado", "id", "lugar_residencia", "matricula", "regimen_iva", "telefono", "updated_at", "user_id") SELECT "cbu", "created_at", "cuit", "documento", "estado", "id", "lugar_residencia", "matricula", "regimen_iva", "telefono", "updated_at", "user_id" FROM "prestadores";
DROP TABLE "prestadores";
ALTER TABLE "new_prestadores" RENAME TO "prestadores";
CREATE UNIQUE INDEX "prestadores_user_id_key" ON "prestadores"("user_id");
CREATE TABLE "new_servicios" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "control_horario" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_servicios" ("control_horario", "created_at", "descripcion", "estado", "id", "nombre") SELECT "control_horario", coalesce("created_at", CURRENT_TIMESTAMP) AS "created_at", "descripcion", "estado", "id", "nombre" FROM "servicios";
DROP TABLE "servicios";
ALTER TABLE "new_servicios" RENAME TO "servicios";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
