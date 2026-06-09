import { PrismaClient } from "@prisma/client";
import { formatLocalidadNombre, normalizeLocalidadKey } from "./localidad-nombre.util.js";

const GEOREF_LOCALIDADES_URL =
  "https://apis.datos.gob.ar/georef/api/localidades?provincia=06&max=5000";

interface GeorefCentroide {
  lat: number;
  lon: number;
}

interface GeorefLocalidad {
  id: string;
  nombre: string;
  centroide?: GeorefCentroide;
}

interface GeorefLocalidadesResponse {
  localidades: GeorefLocalidad[];
}

export interface LocalidadSeedRow {
  id: string;
  nombre: string;
  latitud: number | null;
  longitud: number | null;
}

async function fetchGeorefLocalidades(): Promise<GeorefLocalidad[]> {
  const response = await fetch(GEOREF_LOCALIDADES_URL);
  if (!response.ok) {
    throw new Error(`Georef API respondió ${String(response.status)} ${response.statusText}`);
  }

  const body = (await response.json()) as GeorefLocalidadesResponse;
  if (!Array.isArray(body.localidades)) {
    throw new Error("Respuesta de Georef inválida: falta el arreglo localidades");
  }

  return body.localidades;
}

/** Deduplica por nombre normalizado; conserva la primera ocurrencia de la API. */
export function dedupeGeorefLocalidades(items: GeorefLocalidad[]): LocalidadSeedRow[] {
  const byNormalizedName = new Map<string, LocalidadSeedRow>();

  for (const item of items) {
    const rawNombre = item.nombre;
    if (rawNombre.trim() === "") {
      continue;
    }

    const key = normalizeLocalidadKey(rawNombre);
    if (byNormalizedName.has(key)) {
      continue;
    }

    byNormalizedName.set(key, {
      id: item.id,
      nombre: formatLocalidadNombre(rawNombre),
      latitud: item.centroide?.lat ?? null,
      longitud: item.centroide?.lon ?? null,
    });
  }

  return [...byNormalizedName.values()];
}

export async function seedLocalidades(prisma: PrismaClient): Promise<void> {
  const fromApi = await fetchGeorefLocalidades();
  console.log(`[seed:localidades] Cantidad recibida desde Georef: ${String(fromApi.length)}`);

  const uniqueRows = dedupeGeorefLocalidades(fromApi);
  console.log(
    `[seed:localidades] Cantidad luego de eliminar duplicados: ${String(uniqueRows.length)}`,
  );

  if (uniqueRows.length === 0) {
    console.log("[seed:localidades] Cantidad insertada: 0");
    return;
  }

  const existing = await prisma.localidad.findMany({
    select: { id: true, nombre: true },
  });
  const existingIds = new Set(existing.map((row) => row.id));
  const existingNombreKeys = new Set(existing.map((row) => normalizeLocalidadKey(row.nombre)));

  const rowsToInsert = uniqueRows.filter(
    (row) =>
      !existingIds.has(row.id) && !existingNombreKeys.has(normalizeLocalidadKey(row.nombre)),
  );

  if (rowsToInsert.length === 0) {
    console.log("[seed:localidades] Cantidad insertada: 0");
    return;
  }

  const result = await prisma.localidad.createMany({
    data: rowsToInsert,
  });

  console.log(`[seed:localidades] Cantidad insertada: ${String(result.count)}`);
}

const prisma = new PrismaClient();

seedLocalidades(prisma)
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
