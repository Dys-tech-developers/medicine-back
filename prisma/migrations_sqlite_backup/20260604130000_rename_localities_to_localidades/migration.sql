-- RenameTable
ALTER TABLE "localities" RENAME TO "localidades";

-- RenameColumns (SQLite 3.25+)
ALTER TABLE "localidades" RENAME COLUMN "name" TO "nombre";
ALTER TABLE "localidades" RENAME COLUMN "latitude" TO "latitud";
ALTER TABLE "localidades" RENAME COLUMN "longitude" TO "longitud";
ALTER TABLE "localidades" RENAME COLUMN "createdAt" TO "created_at";

-- RenameIndex
DROP INDEX "localities_name_key";
CREATE UNIQUE INDEX "localidades_nombre_key" ON "localidades"("nombre");
