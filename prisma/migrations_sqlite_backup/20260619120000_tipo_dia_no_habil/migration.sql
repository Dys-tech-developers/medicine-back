-- Unificar sábado, domingo y feriado bajo un solo tipo de día: no_habil.

UPDATE "visita_finanzas"
SET "tipo_dia" = 'no_habil'
WHERE "tipo_dia" IN ('sabado', 'domingo', 'feriado');

UPDATE "servicio_tarifas"
SET "tipo_dia" = 'no_habil'
WHERE "tipo_dia" IN ('sabado', 'domingo', 'feriado');

-- Eliminar tarifas duplicadas que quedaron con la misma clave lógica.
DELETE FROM "servicio_tarifas"
WHERE "id" NOT IN (
  SELECT MAX("id")
  FROM "servicio_tarifas"
  GROUP BY "servicio_id", "modalidad_cobro", "tipo_jornada", "tipo_dia"
);
