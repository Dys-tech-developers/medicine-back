-- ONE-OFF: crear roles de la app (correr una sola vez en producción)
-- npx prisma db execute --file prisma/one-off/seed-roles.sql --schema prisma/schema.prisma

INSERT INTO `roles` (`nombre`)
SELECT 'ADMIN'
WHERE NOT EXISTS (
  SELECT 1 FROM `roles` WHERE `nombre` = 'ADMIN'
);

INSERT INTO `roles` (`nombre`)
SELECT 'OPERADOR'
WHERE NOT EXISTS (
  SELECT 1 FROM `roles` WHERE `nombre` = 'OPERADOR'
);

INSERT INTO `roles` (`nombre`)
SELECT 'PRESTADOR'
WHERE NOT EXISTS (
  SELECT 1 FROM `roles` WHERE `nombre` = 'PRESTADOR'
);
