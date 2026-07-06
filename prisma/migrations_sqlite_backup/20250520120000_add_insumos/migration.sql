-- CreateTable
CREATE TABLE "insumos" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "codigo" TEXT NOT NULL,
    "stock_actual" INTEGER NOT NULL DEFAULT 0,
    "stock_minimo" INTEGER NOT NULL DEFAULT 0,
    "unidad_medida" TEXT NOT NULL,
    "requiere_vencimiento" BOOLEAN NOT NULL DEFAULT false,
    "fecha_vencimiento" DATETIME,
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "visita_insumos" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "visita_id" INTEGER NOT NULL,
    "insumo_id" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "visita_insumos_visita_id_fkey" FOREIGN KEY ("visita_id") REFERENCES "visitas" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "visita_insumos_insumo_id_fkey" FOREIGN KEY ("insumo_id") REFERENCES "insumos" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "insumos_codigo_key" ON "insumos"("codigo");

-- CreateIndex
CREATE INDEX "visita_insumos_visita_id_idx" ON "visita_insumos"("visita_id");

-- CreateIndex
CREATE INDEX "visita_insumos_insumo_id_idx" ON "visita_insumos"("insumo_id");
