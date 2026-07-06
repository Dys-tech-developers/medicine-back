-- CreateTable
CREATE TABLE "users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "roles" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "user_roles" (
    "user_id" INTEGER NOT NULL,
    "rol_id" INTEGER NOT NULL,

    PRIMARY KEY ("user_id", "rol_id"),
    CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_roles_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "roles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "prestadores" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "telefono" TEXT NOT NULL,
    "lugar_residencia" TEXT NOT NULL,
    "documento" TEXT NOT NULL,
    "matricula" TEXT NOT NULL,
    "cuit" TEXT NOT NULL,
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "prestadores_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "servicios" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "prestador_servicios" (
    "prestador_id" INTEGER NOT NULL,
    "servicio_id" INTEGER NOT NULL,

    PRIMARY KEY ("prestador_id", "servicio_id"),
    CONSTRAINT "prestador_servicios_prestador_id_fkey" FOREIGN KEY ("prestador_id") REFERENCES "prestadores" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "prestador_servicios_servicio_id_fkey" FOREIGN KEY ("servicio_id") REFERENCES "servicios" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "pacientes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "numero_documento" TEXT NOT NULL,
    "fecha_nacimiento" DATETIME NOT NULL,
    "sexo" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "numero_afiliado" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "historias_clinicas" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "paciente_id" INTEGER NOT NULL,
    "fecha_creacion" DATETIME NOT NULL,
    "antecedentes" TEXT,
    "diagnostico_inicial" TEXT,
    "medicacion" TEXT,
    "alergias" TEXT,
    "observaciones" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "historias_clinicas_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "pacientes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "prestaciones" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "paciente_id" INTEGER NOT NULL,
    "fecha_inicio" DATETIME NOT NULL,
    "fecha_fin" DATETIME,
    "frecuencia_mensual" INTEGER NOT NULL,
    "estado" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "prestaciones_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "pacientes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "prestaciones_servicios" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "prestacion_id" INTEGER NOT NULL,
    "servicio_id" INTEGER NOT NULL,
    CONSTRAINT "prestaciones_servicios_prestacion_id_fkey" FOREIGN KEY ("prestacion_id") REFERENCES "prestaciones" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "prestaciones_servicios_servicio_id_fkey" FOREIGN KEY ("servicio_id") REFERENCES "servicios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "visitas" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "prestacion_id" INTEGER NOT NULL,
    "prestador_id" INTEGER NOT NULL,
    "fecha" DATETIME NOT NULL,
    "tiempo_minutos" INTEGER NOT NULL,
    "observaciones" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "visitas_prestacion_id_fkey" FOREIGN KEY ("prestacion_id") REFERENCES "prestaciones" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "visitas_prestador_id_fkey" FOREIGN KEY ("prestador_id") REFERENCES "prestadores" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "roles_nombre_key" ON "roles"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "prestadores_user_id_key" ON "prestadores"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "historias_clinicas_paciente_id_key" ON "historias_clinicas"("paciente_id");

-- CreateIndex
CREATE INDEX "prestaciones_paciente_id_idx" ON "prestaciones"("paciente_id");

-- CreateIndex
CREATE INDEX "prestaciones_servicios_prestacion_id_idx" ON "prestaciones_servicios"("prestacion_id");

-- CreateIndex
CREATE UNIQUE INDEX "prestaciones_servicios_prestacion_id_servicio_id_key" ON "prestaciones_servicios"("prestacion_id", "servicio_id");

-- CreateIndex
CREATE INDEX "visitas_prestacion_id_idx" ON "visitas"("prestacion_id");

-- CreateIndex
CREATE INDEX "visitas_prestador_id_idx" ON "visitas"("prestador_id");

