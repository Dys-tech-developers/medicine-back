-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `estado` BOOLEAN NOT NULL DEFAULT true,
    `reset_code_hash` VARCHAR(255) NULL,
    `reset_code_expires_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `refresh_tokens` (
    `token_hash` VARCHAR(191) NOT NULL,
    `user_id` INTEGER NOT NULL,
    `family_id` VARCHAR(191) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `revoked_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `refresh_tokens_user_id_idx`(`user_id`),
    INDEX `refresh_tokens_family_id_idx`(`family_id`),
    INDEX `refresh_tokens_expires_at_idx`(`expires_at`),
    PRIMARY KEY (`token_hash`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `roles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_roles` (
    `user_id` INTEGER NOT NULL,
    `rol_id` INTEGER NOT NULL,

    PRIMARY KEY (`user_id`, `rol_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `prestadores` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `telefono` VARCHAR(50) NOT NULL,
    `lugar_residencia` VARCHAR(255) NOT NULL,
    `documento` VARCHAR(50) NOT NULL,
    `matricula` VARCHAR(50) NOT NULL,
    `cuit` VARCHAR(20) NOT NULL,
    `cbu` VARCHAR(30) NOT NULL,
    `regimen_iva` VARCHAR(100) NOT NULL,
    `estado` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `prestadores_user_id_key`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `obras_sociales` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `codigo` VARCHAR(191) NOT NULL,
    `estado` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `servicios` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `descripcion` TEXT NULL,
    `estado` BOOLEAN NOT NULL DEFAULT true,
    `control_horario` BOOLEAN NOT NULL DEFAULT false,
    `modo_relevo` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `servicio_tarifas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `servicio_id` INTEGER NOT NULL,
    `modalidad_cobro` VARCHAR(191) NOT NULL,
    `tipo_jornada` VARCHAR(191) NOT NULL,
    `tipo_dia` VARCHAR(191) NOT NULL,
    `valor` DECIMAL(65, 30) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `servicio_tarifas_servicio_id_idx`(`servicio_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `prestador_servicios` (
    `prestador_id` INTEGER NOT NULL,
    `servicio_id` INTEGER NOT NULL,

    PRIMARY KEY (`prestador_id`, `servicio_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pacientes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `obra_social_id` INTEGER NOT NULL,
    `codigo_qr` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `apellido` VARCHAR(191) NOT NULL,
    `numero_documento` VARCHAR(191) NOT NULL,
    `fecha_nacimiento` DATETIME(3) NOT NULL,
    `sexo` ENUM('M', 'F', 'X') NOT NULL,
    `telefono` VARCHAR(50) NOT NULL,
    `direccion` VARCHAR(255) NOT NULL,
    `localidad` VARCHAR(255) NOT NULL,
    `numero_afiliado` VARCHAR(100) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `pacientes_codigo_qr_key`(`codigo_qr`),
    UNIQUE INDEX `pacientes_numero_documento_key`(`numero_documento`),
    INDEX `pacientes_obra_social_id_idx`(`obra_social_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `historias_clinicas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `paciente_id` INTEGER NOT NULL,
    `fecha_creacion` DATETIME(3) NOT NULL,
    `antecedentes` TEXT NULL,
    `diagnostico_inicial` TEXT NULL,
    `medicacion` TEXT NULL,
    `alergias` TEXT NULL,
    `observaciones` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `historias_clinicas_paciente_id_key`(`paciente_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `evoluciones_clinicas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `historia_clinica_id` INTEGER NOT NULL,
    `fecha` DATETIME(3) NOT NULL,
    `observaciones` TEXT NULL,
    `medicacion` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `evoluciones_clinicas_historia_clinica_id_idx`(`historia_clinica_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `paciente_servicios` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `paciente_id` INTEGER NOT NULL,
    `servicio_id` INTEGER NOT NULL,
    `prestador_id` INTEGER NULL,
    `fecha_inicio` DATETIME(3) NOT NULL,
    `fecha_fin` DATETIME(3) NULL,
    `periodo_control` VARCHAR(191) NOT NULL,
    `cantidad_permitida` INTEGER NOT NULL,
    `cantidad_horas` INTEGER NULL,
    `modalidad_cobro` VARCHAR(191) NOT NULL,
    `estado` VARCHAR(191) NOT NULL,
    `cobertura_diaria_inicio` VARCHAR(191) NULL,
    `cobertura_diaria_fin` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `paciente_servicios_paciente_id_idx`(`paciente_id`),
    INDEX `paciente_servicios_servicio_id_idx`(`servicio_id`),
    INDEX `paciente_servicios_prestador_id_idx`(`prestador_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `paciente_servicio_prestadores` (
    `paciente_servicio_id` INTEGER NOT NULL,
    `prestador_id` INTEGER NOT NULL,

    INDEX `paciente_servicio_prestadores_prestador_id_idx`(`prestador_id`),
    PRIMARY KEY (`paciente_servicio_id`, `prestador_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `visitas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `paciente_servicio_id` INTEGER NOT NULL,
    `prestador_id` INTEGER NOT NULL,
    `estado` VARCHAR(191) NOT NULL DEFAULT 'finalizada',
    `fecha_inicio` DATETIME(3) NOT NULL,
    `fecha_fin` DATETIME(3) NULL,
    `tiempo_minutos` INTEGER NULL,
    `observaciones` TEXT NULL,
    `cierre_automatico` BOOLEAN NOT NULL DEFAULT false,
    `cierre_por_relevo` BOOLEAN NOT NULL DEFAULT false,
    `prestador_relevo_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `visitas_paciente_servicio_id_idx`(`paciente_servicio_id`),
    INDEX `visitas_prestador_id_idx`(`prestador_id`),
    INDEX `visitas_estado_idx`(`estado`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `visita_finanzas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `visita_id` INTEGER NOT NULL,
    `modalidad_cobro` VARCHAR(191) NOT NULL,
    `tipo_jornada` VARCHAR(191) NOT NULL,
    `tipo_dia` VARCHAR(191) NOT NULL,
    `valor_unitario` DECIMAL(65, 30) NOT NULL,
    `valor_aplicado` DECIMAL(65, 30) NOT NULL,
    `facturado` BOOLEAN NOT NULL DEFAULT false,
    `pagado` BOOLEAN NOT NULL DEFAULT false,
    `fecha_facturacion` DATETIME(3) NULL,
    `fecha_pago` DATETIME(3) NULL,
    `observaciones` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `visita_finanzas_visita_id_key`(`visita_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `insumos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `descripcion` TEXT NULL,
    `codigo` VARCHAR(100) NOT NULL,
    `stock_actual` INTEGER NOT NULL DEFAULT 0,
    `stock_minimo` INTEGER NOT NULL DEFAULT 0,
    `unidad_medida` VARCHAR(50) NOT NULL,
    `requiere_vencimiento` BOOLEAN NOT NULL DEFAULT false,
    `fecha_vencimiento` DATETIME(3) NULL,
    `estado` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `insumos_codigo_key`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `visita_insumos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `visita_id` INTEGER NOT NULL,
    `insumo_id` INTEGER NOT NULL,
    `cantidad` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `visita_insumos_visita_id_idx`(`visita_id`),
    INDEX `visita_insumos_insumo_id_idx`(`insumo_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `revoked_tokens` (
    `jti` VARCHAR(191) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `revoked_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `revoked_tokens_expires_at_idx`(`expires_at`),
    PRIMARY KEY (`jti`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `localidades` (
    `id` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `latitud` DOUBLE NULL,
    `longitud` DOUBLE NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `localidades_nombre_key`(`nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `refresh_tokens_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_rol_id_fkey` FOREIGN KEY (`rol_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prestadores` ADD CONSTRAINT `prestadores_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `servicio_tarifas` ADD CONSTRAINT `servicio_tarifas_servicio_id_fkey` FOREIGN KEY (`servicio_id`) REFERENCES `servicios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prestador_servicios` ADD CONSTRAINT `prestador_servicios_prestador_id_fkey` FOREIGN KEY (`prestador_id`) REFERENCES `prestadores`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prestador_servicios` ADD CONSTRAINT `prestador_servicios_servicio_id_fkey` FOREIGN KEY (`servicio_id`) REFERENCES `servicios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pacientes` ADD CONSTRAINT `pacientes_obra_social_id_fkey` FOREIGN KEY (`obra_social_id`) REFERENCES `obras_sociales`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `historias_clinicas` ADD CONSTRAINT `historias_clinicas_paciente_id_fkey` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `evoluciones_clinicas` ADD CONSTRAINT `evoluciones_clinicas_historia_clinica_id_fkey` FOREIGN KEY (`historia_clinica_id`) REFERENCES `historias_clinicas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `paciente_servicios` ADD CONSTRAINT `paciente_servicios_paciente_id_fkey` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `paciente_servicios` ADD CONSTRAINT `paciente_servicios_servicio_id_fkey` FOREIGN KEY (`servicio_id`) REFERENCES `servicios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `paciente_servicios` ADD CONSTRAINT `paciente_servicios_prestador_id_fkey` FOREIGN KEY (`prestador_id`) REFERENCES `prestadores`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `paciente_servicio_prestadores` ADD CONSTRAINT `paciente_servicio_prestadores_paciente_servicio_id_fkey` FOREIGN KEY (`paciente_servicio_id`) REFERENCES `paciente_servicios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `paciente_servicio_prestadores` ADD CONSTRAINT `paciente_servicio_prestadores_prestador_id_fkey` FOREIGN KEY (`prestador_id`) REFERENCES `prestadores`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visitas` ADD CONSTRAINT `visitas_paciente_servicio_id_fkey` FOREIGN KEY (`paciente_servicio_id`) REFERENCES `paciente_servicios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visitas` ADD CONSTRAINT `visitas_prestador_id_fkey` FOREIGN KEY (`prestador_id`) REFERENCES `prestadores`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visitas` ADD CONSTRAINT `visitas_prestador_relevo_id_fkey` FOREIGN KEY (`prestador_relevo_id`) REFERENCES `prestadores`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visita_finanzas` ADD CONSTRAINT `visita_finanzas_visita_id_fkey` FOREIGN KEY (`visita_id`) REFERENCES `visitas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visita_insumos` ADD CONSTRAINT `visita_insumos_visita_id_fkey` FOREIGN KEY (`visita_id`) REFERENCES `visitas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visita_insumos` ADD CONSTRAINT `visita_insumos_insumo_id_fkey` FOREIGN KEY (`insumo_id`) REFERENCES `insumos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

