-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Sexo" AS ENUM ('M', 'F', 'X');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "reset_code_hash" TEXT,
    "reset_code_expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "token_hash" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "family_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("token_hash")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "user_id" INTEGER NOT NULL,
    "rol_id" INTEGER NOT NULL,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id","rol_id")
);

-- CreateTable
CREATE TABLE "prestadores" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "telefono" TEXT NOT NULL,
    "lugar_residencia" TEXT NOT NULL,
    "documento" TEXT NOT NULL,
    "matricula" TEXT NOT NULL,
    "cuit" TEXT NOT NULL,
    "cbu" TEXT NOT NULL,
    "regimen_iva" TEXT NOT NULL,
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prestadores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "obras_sociales" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "obras_sociales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "servicios" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "control_horario" BOOLEAN NOT NULL DEFAULT false,
    "modo_relevo" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "servicios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "servicio_tarifas" (
    "id" SERIAL NOT NULL,
    "servicio_id" INTEGER NOT NULL,
    "modalidad_cobro" TEXT NOT NULL,
    "tipo_jornada" TEXT NOT NULL,
    "tipo_dia" TEXT NOT NULL,
    "valor" DECIMAL(65,30) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "servicio_tarifas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prestador_servicios" (
    "prestador_id" INTEGER NOT NULL,
    "servicio_id" INTEGER NOT NULL,

    CONSTRAINT "prestador_servicios_pkey" PRIMARY KEY ("prestador_id","servicio_id")
);

-- CreateTable
CREATE TABLE "pacientes" (
    "id" SERIAL NOT NULL,
    "obra_social_id" INTEGER NOT NULL,
    "codigo_qr" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "numero_documento" TEXT NOT NULL,
    "fecha_nacimiento" TIMESTAMP(3) NOT NULL,
    "sexo" "Sexo" NOT NULL,
    "telefono" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "localidad" TEXT NOT NULL,
    "numero_afiliado" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pacientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historias_clinicas" (
    "id" SERIAL NOT NULL,
    "paciente_id" INTEGER NOT NULL,
    "fecha_creacion" TIMESTAMP(3) NOT NULL,
    "antecedentes" TEXT,
    "diagnostico_inicial" TEXT,
    "medicacion" TEXT,
    "alergias" TEXT,
    "observaciones" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "historias_clinicas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evoluciones_clinicas" (
    "id" SERIAL NOT NULL,
    "historia_clinica_id" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "observaciones" TEXT,
    "medicacion" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evoluciones_clinicas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paciente_servicios" (
    "id" SERIAL NOT NULL,
    "paciente_id" INTEGER NOT NULL,
    "servicio_id" INTEGER NOT NULL,
    "prestador_id" INTEGER,
    "fecha_inicio" TIMESTAMP(3) NOT NULL,
    "fecha_fin" TIMESTAMP(3),
    "periodo_control" TEXT NOT NULL,
    "cantidad_permitida" INTEGER NOT NULL,
    "cantidad_horas" INTEGER,
    "modalidad_cobro" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "cobertura_diaria_inicio" TEXT,
    "cobertura_diaria_fin" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "paciente_servicios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paciente_servicio_prestadores" (
    "paciente_servicio_id" INTEGER NOT NULL,
    "prestador_id" INTEGER NOT NULL,

    CONSTRAINT "paciente_servicio_prestadores_pkey" PRIMARY KEY ("paciente_servicio_id","prestador_id")
);

-- CreateTable
CREATE TABLE "visitas" (
    "id" SERIAL NOT NULL,
    "paciente_servicio_id" INTEGER NOT NULL,
    "prestador_id" INTEGER NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'finalizada',
    "fecha_inicio" TIMESTAMP(3) NOT NULL,
    "fecha_fin" TIMESTAMP(3),
    "tiempo_minutos" INTEGER,
    "observaciones" TEXT,
    "cierre_automatico" BOOLEAN NOT NULL DEFAULT false,
    "cierre_por_relevo" BOOLEAN NOT NULL DEFAULT false,
    "prestador_relevo_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "visitas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visita_finanzas" (
    "id" SERIAL NOT NULL,
    "visita_id" INTEGER NOT NULL,
    "modalidad_cobro" TEXT NOT NULL,
    "tipo_jornada" TEXT NOT NULL,
    "tipo_dia" TEXT NOT NULL,
    "valor_unitario" DECIMAL(65,30) NOT NULL,
    "valor_aplicado" DECIMAL(65,30) NOT NULL,
    "facturado" BOOLEAN NOT NULL DEFAULT false,
    "pagado" BOOLEAN NOT NULL DEFAULT false,
    "fecha_facturacion" TIMESTAMP(3),
    "fecha_pago" TIMESTAMP(3),
    "observaciones" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "visita_finanzas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insumos" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "codigo" TEXT NOT NULL,
    "stock_actual" INTEGER NOT NULL DEFAULT 0,
    "stock_minimo" INTEGER NOT NULL DEFAULT 0,
    "unidad_medida" TEXT NOT NULL,
    "requiere_vencimiento" BOOLEAN NOT NULL DEFAULT false,
    "fecha_vencimiento" TIMESTAMP(3),
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "insumos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visita_insumos" (
    "id" SERIAL NOT NULL,
    "visita_id" INTEGER NOT NULL,
    "insumo_id" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visita_insumos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "revoked_tokens" (
    "jti" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "revoked_tokens_pkey" PRIMARY KEY ("jti")
);

-- CreateTable
CREATE TABLE "localidades" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "latitud" DOUBLE PRECISION,
    "longitud" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "localidades_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_family_id_idx" ON "refresh_tokens"("family_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_expires_at_idx" ON "refresh_tokens"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "prestadores_user_id_key" ON "prestadores"("user_id");

-- CreateIndex
CREATE INDEX "servicio_tarifas_servicio_id_idx" ON "servicio_tarifas"("servicio_id");

-- CreateIndex
CREATE UNIQUE INDEX "pacientes_codigo_qr_key" ON "pacientes"("codigo_qr");

-- CreateIndex
CREATE UNIQUE INDEX "pacientes_numero_documento_key" ON "pacientes"("numero_documento");

-- CreateIndex
CREATE INDEX "pacientes_obra_social_id_idx" ON "pacientes"("obra_social_id");

-- CreateIndex
CREATE UNIQUE INDEX "historias_clinicas_paciente_id_key" ON "historias_clinicas"("paciente_id");

-- CreateIndex
CREATE INDEX "evoluciones_clinicas_historia_clinica_id_idx" ON "evoluciones_clinicas"("historia_clinica_id");

-- CreateIndex
CREATE INDEX "paciente_servicios_paciente_id_idx" ON "paciente_servicios"("paciente_id");

-- CreateIndex
CREATE INDEX "paciente_servicios_servicio_id_idx" ON "paciente_servicios"("servicio_id");

-- CreateIndex
CREATE INDEX "paciente_servicios_prestador_id_idx" ON "paciente_servicios"("prestador_id");

-- CreateIndex
CREATE INDEX "paciente_servicio_prestadores_prestador_id_idx" ON "paciente_servicio_prestadores"("prestador_id");

-- CreateIndex
CREATE INDEX "visitas_paciente_servicio_id_idx" ON "visitas"("paciente_servicio_id");

-- CreateIndex
CREATE INDEX "visitas_prestador_id_idx" ON "visitas"("prestador_id");

-- CreateIndex
CREATE INDEX "visitas_estado_idx" ON "visitas"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "visita_finanzas_visita_id_key" ON "visita_finanzas"("visita_id");

-- CreateIndex
CREATE UNIQUE INDEX "insumos_codigo_key" ON "insumos"("codigo");

-- CreateIndex
CREATE INDEX "visita_insumos_visita_id_idx" ON "visita_insumos"("visita_id");

-- CreateIndex
CREATE INDEX "visita_insumos_insumo_id_idx" ON "visita_insumos"("insumo_id");

-- CreateIndex
CREATE INDEX "revoked_tokens_expires_at_idx" ON "revoked_tokens"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "localidades_nombre_key" ON "localidades"("nombre");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prestadores" ADD CONSTRAINT "prestadores_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servicio_tarifas" ADD CONSTRAINT "servicio_tarifas_servicio_id_fkey" FOREIGN KEY ("servicio_id") REFERENCES "servicios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prestador_servicios" ADD CONSTRAINT "prestador_servicios_prestador_id_fkey" FOREIGN KEY ("prestador_id") REFERENCES "prestadores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prestador_servicios" ADD CONSTRAINT "prestador_servicios_servicio_id_fkey" FOREIGN KEY ("servicio_id") REFERENCES "servicios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pacientes" ADD CONSTRAINT "pacientes_obra_social_id_fkey" FOREIGN KEY ("obra_social_id") REFERENCES "obras_sociales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historias_clinicas" ADD CONSTRAINT "historias_clinicas_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "pacientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evoluciones_clinicas" ADD CONSTRAINT "evoluciones_clinicas_historia_clinica_id_fkey" FOREIGN KEY ("historia_clinica_id") REFERENCES "historias_clinicas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paciente_servicios" ADD CONSTRAINT "paciente_servicios_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "pacientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paciente_servicios" ADD CONSTRAINT "paciente_servicios_servicio_id_fkey" FOREIGN KEY ("servicio_id") REFERENCES "servicios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paciente_servicios" ADD CONSTRAINT "paciente_servicios_prestador_id_fkey" FOREIGN KEY ("prestador_id") REFERENCES "prestadores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paciente_servicio_prestadores" ADD CONSTRAINT "paciente_servicio_prestadores_paciente_servicio_id_fkey" FOREIGN KEY ("paciente_servicio_id") REFERENCES "paciente_servicios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paciente_servicio_prestadores" ADD CONSTRAINT "paciente_servicio_prestadores_prestador_id_fkey" FOREIGN KEY ("prestador_id") REFERENCES "prestadores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitas" ADD CONSTRAINT "visitas_paciente_servicio_id_fkey" FOREIGN KEY ("paciente_servicio_id") REFERENCES "paciente_servicios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitas" ADD CONSTRAINT "visitas_prestador_id_fkey" FOREIGN KEY ("prestador_id") REFERENCES "prestadores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitas" ADD CONSTRAINT "visitas_prestador_relevo_id_fkey" FOREIGN KEY ("prestador_relevo_id") REFERENCES "prestadores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visita_finanzas" ADD CONSTRAINT "visita_finanzas_visita_id_fkey" FOREIGN KEY ("visita_id") REFERENCES "visitas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visita_insumos" ADD CONSTRAINT "visita_insumos_visita_id_fkey" FOREIGN KEY ("visita_id") REFERENCES "visitas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visita_insumos" ADD CONSTRAINT "visita_insumos_insumo_id_fkey" FOREIGN KEY ("insumo_id") REFERENCES "insumos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
