-- ONE-OFF: crear admin Simec (correr una sola vez en producción)
-- npx prisma db execute --file prisma/one-off/create-admin-simec.sql

INSERT INTO `roles` (`nombre`)
SELECT 'ADMIN'
WHERE NOT EXISTS (
  SELECT 1 FROM `roles` WHERE `nombre` = 'ADMIN'
);

INSERT INTO `users` (`nombre`, `email`, `password_hash`, `estado`, `created_at`)
SELECT
  'Administrador Simec',
  'simec.internaciondomiciliaria@gmail.com',
  '$2b$12$J5fpny8OHNhptkm7S8CLve.NgW159JGNCywy.dztiL9zK1iS624vy',
  true,
  CURRENT_TIMESTAMP(3)
WHERE NOT EXISTS (
  SELECT 1 FROM `users` WHERE `email` = 'simec.internaciondomiciliaria@gmail.com'
);

INSERT INTO `user_roles` (`user_id`, `rol_id`)
SELECT u.`id`, r.`id`
FROM `users` u
INNER JOIN `roles` r ON r.`nombre` = 'ADMIN'
WHERE u.`email` = 'simec.internaciondomiciliaria@gmail.com'
  AND NOT EXISTS (
    SELECT 1
    FROM `user_roles` ur
    WHERE ur.`user_id` = u.`id`
      AND ur.`rol_id` = r.`id`
  );
