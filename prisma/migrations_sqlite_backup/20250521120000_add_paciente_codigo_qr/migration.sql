-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_pacientes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "obra_social_id" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "numero_documento" TEXT NOT NULL,
    "codigo_qr" TEXT NOT NULL,
    "fecha_nacimiento" DATETIME NOT NULL,
    "sexo" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "numero_afiliado" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "pacientes_obra_social_id_fkey" FOREIGN KEY ("obra_social_id") REFERENCES "obras_sociales" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_pacientes" (
    "id", "obra_social_id", "nombre", "apellido", "numero_documento", "codigo_qr",
    "fecha_nacimiento", "sexo", "telefono", "direccion", "numero_afiliado",
    "created_at", "updated_at"
)
SELECT
    "id",
    "obra_social_id",
    "nombre", "apellido", "numero_documento",
    'PAC-' || printf('%06d', "id"),
    "fecha_nacimiento", "sexo", "telefono", "direccion", "numero_afiliado",
    "created_at", "updated_at"
FROM "pacientes";
DROP TABLE "pacientes";
ALTER TABLE "new_pacientes" RENAME TO "pacientes";
CREATE UNIQUE INDEX "pacientes_codigo_qr_key" ON "pacientes"("codigo_qr");
CREATE INDEX "pacientes_obra_social_id_idx" ON "pacientes"("obra_social_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
