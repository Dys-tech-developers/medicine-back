/** Datos de demo compartidos entre `seed.ts` y scripts opcionales. */

export const DEV_SEED_PASSWORD = "MedicineTest1!";

export const DEV_OBRAS_SOCIALES = [
  { codigo: "N/A", nombre: "N/A" },
  { codigo: "SIN-OS", nombre: "Sin obra social" },
  { codigo: "OSDE", nombre: "OSDE" },
  { codigo: "SWISS", nombre: "Swiss Medical" },
] as const;

export const DEV_SERVICIOS = [
  {
    nombre: "Enfermería",
    descripcion: "Cuidados de enfermería domiciliaria",
    valorBase: 15_000,
  },
  {
    nombre: "Kinesiología",
    descripcion: "Rehabilitación y kinesiología",
    valorBase: 18_000,
  },
  {
    nombre: "Medicina general",
    descripcion: "Atención médica domiciliaria",
    valorBase: 25_000,
  },
] as const;

/** Combinaciones habituales para registrar visitas en distintos horarios. */
export const DEV_TARIFA_VARIANTES = [
  { modalidadCobro: "por_servicio", tipoJornada: "diurno", tipoDia: "habil" },
  { modalidadCobro: "por_servicio", tipoJornada: "diurno", tipoDia: "no_habil" },
  { modalidadCobro: "por_servicio", tipoJornada: "nocturno", tipoDia: "habil" },
] as const;

export const DEV_PRESTADORES = [
  {
    email: "prestador@medicine.local",
    nombre: "María Fernández",
    telefono: "1122334455",
    documento: "30123456",
    matricula: "MP-00001",
    cuit: "20-30123456-9",
    cbu: "0000003100012345678901",
    servicios: ["Enfermería", "Medicina general"],
  },
  {
    email: "prestador2@medicine.local",
    nombre: "José López",
    telefono: "1144556677",
    documento: "28456789",
    matricula: "MP-00002",
    cuit: "20-28456789-3",
    cbu: "0000003100098765432109",
    servicios: ["Kinesiología"],
  },
  {
    email: "prestador3@medicine.local",
    nombre: "Lucía Martínez",
    telefono: "1155667788",
    documento: "31234567",
    matricula: "MP-00003",
    cuit: "27-31234567-4",
    cbu: "0000003100055555555555",
    servicios: ["Enfermería", "Kinesiología", "Medicina general"],
  },
] as const;

export const DEV_PACIENTES = [
  {
    codigoQr: "PAC-000001",
    nombre: "Ana",
    apellido: "García",
    numeroDocumento: "39999888",
    numeroAfiliado: "AFI-10001",
    localidad: "Ciudad Autónoma de Buenos Aires",
    sexo: "F" as const,
    servicioNombre: "Enfermería",
    obraSocialCodigo: "OSDE",
  },
  {
    codigoQr: "PAC-000002",
    nombre: "Carlos",
    apellido: "Ruiz",
    numeroDocumento: "28444555",
    numeroAfiliado: "AFI-10002",
    localidad: "San Isidro",
    sexo: "M" as const,
    servicioNombre: "Kinesiología",
    obraSocialCodigo: "SWISS",
  },
  {
    codigoQr: "PAC-000003",
    nombre: "Laura",
    apellido: "Suárez",
    numeroDocumento: "32777888",
    numeroAfiliado: "AFI-10003",
    localidad: "La Plata",
    sexo: "F" as const,
    servicioNombre: "Medicina general",
    obraSocialCodigo: "SIN-OS",
  },
  {
    codigoQr: "PAC-000004",
    nombre: "Pedro",
    apellido: "Sánchez",
    numeroDocumento: "35123456",
    numeroAfiliado: "AFI-10004",
    localidad: "Vicente López",
    sexo: "M" as const,
    servicioNombre: "Kinesiología",
    obraSocialCodigo: "OSDE",
  },
  {
    codigoQr: "PAC-000005",
    nombre: "Sofía",
    apellido: "Díaz",
    numeroDocumento: "36111222",
    numeroAfiliado: "AFI-10005",
    localidad: "Morón",
    sexo: "F" as const,
    servicioNombre: "Enfermería",
    obraSocialCodigo: "SWISS",
  },
] as const;

export const DEV_INSUMOS = [
  {
    codigo: "INS-GUANTES-M",
    nombre: "Guantes descartables M",
    descripcion: "Caja x 100 unidades",
    stockActual: 50,
    stockMinimo: 10,
    unidadMedida: "caja",
  },
  {
    codigo: "INS-JABON",
    nombre: "Jabón antiséptico",
    descripcion: "Frasco 500 ml",
    stockActual: 8,
    stockMinimo: 15,
    unidadMedida: "frasco",
  },
] as const;
