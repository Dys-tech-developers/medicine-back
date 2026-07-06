INSERT INTO "obras_sociales" ("nombre", "codigo", "estado")
SELECT 'N/A', 'N/A', true
WHERE NOT EXISTS (SELECT 1 FROM "obras_sociales" WHERE "codigo" = 'N/A');
