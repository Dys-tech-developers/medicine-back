# Caso práctico: cuidadoras 24/7 — José Martínez

**Para reunión de negocio · Medicine**

---

## 1. Situación

- **Paciente:** José Martínez  
- **Servicio:** Cuidadoras / enfermería domiciliaria  
- **Necesidad:** cobertura **24 horas por día** (24/7 en la práctica diaria)  
- **Realidad operativa:** en un mismo día pueden ir **3 cuidadoras distintas**, en **turnos distintos**  
- **Hoy en el formulario:** período diario, cantidad permitida 24, prestador María Giménez  

**Problema:** el formulario actual **no define jornadas**. Solo define una **autorización general**. Hay que separar:

| Capa | Qué es | ¿Dónde vive hoy? |
|------|--------|------------------|
| **Autorización** | “José tiene derecho a cuidadoras todo el día” | Formulario *Asignar servicio* |
| **Turno / jornada** | “María 06–14, Matilde 14–22, Ana 22–06” | **No está en el sistema** (planilla / operaciones) |
| **Visita real** | Escaneo QR al entrar y al salir | App prestador |

---

## 2. Error frecuente a evitar

| Campo en pantalla | Lo que **no** significa | Lo que **sí** significa en el sistema |
|-------------------|-------------------------|--------------------------------------|
| Cantidad permitida **24** + período **diario** | 24 **horas** de cobertura | Hasta **24 visitas** en el día (casi nunca es lo que queremos) |
| Prestador **María** fijada | “María cubre las 24 h” | Solo **María** puede iniciar visitas en esa asignación (salvo que operador cambie) |
| Modalidad **por servicio** | Cobro por hora trabajada | **Monto fijo por visita**, sin `cantidadHoras` por turno |

Para 24/7 con turnos, lo habitual es pensar en **3 visitas por día** (una por turno), no “24” en cantidad permitida.

---

## 3. Propuesta A — Una asignación + planilla de turnos (recomendada para empezar)

### Qué cargar en *Asignar servicio*

| Campo | Valor sugerido | Motivo |
|-------|----------------|--------|
| Servicio | Cuidadoras / Enfermería | — |
| Prestador | **Vacío** (sin titular) | Cualquier cuidadora habilitada puede tomar su turno |
| Fecha inicio / fin | Vigencia del paciente | — |
| Período de control | **Diario** | Se controla día a día |
| Cantidad permitida | **3** | Tres turnos = tres visitas por día |
| Modalidad de cobro | **Por hora** | Cada turno se cobra según tiempo real |
| Cantidad de horas | **8** (o duración máxima del turno) | Tope por visita + cierre automático |
| Estado | Activa | — |

### Dónde se definen las jornadas

**Fuera del sistema** (por ahora), en una planilla de operaciones:

| Día | Turno | Horario pactado | Cuidadora | Notas |
|-----|-------|-----------------|-----------|-------|
| Lunes | Mañana | 06:00 – 14:00 | María Giménez | — |
| Lunes | Tarde | 14:00 – 22:00 | Matilde López | — |
| Lunes | Noche | 22:00 – 06:00 (+1) | Ana Ruiz | Cruza medianoche |

La app **no sabe** el horario pactado; solo registra cuando cada una **escanea al entrar y al salir**.

### Ventajas y límites

- **Ventajas:** poco cambio en producto; flexible si un día son 2 o 4 turnos (ajustando cupo).  
- **Límites:** no hay roster en pantalla; no alerta huecos entre turnos; operaciones coordina por fuera.

---

## 4. Propuesta B — Tres asignaciones (un turno = un registro)

Mismo paciente, **tres filas** en el sistema:

| Nombre lógico | Prestador | Cant./día | Horas turno | Franja (referencia en papel) |
|---------------|-----------|-----------|-------------|------------------------------|
| José – Turno mañana | María Giménez | 1 | 8 | 06–14 |
| José – Turno tarde | Matilde López | 1 | 8 | 14–22 |
| José – Turno noche | Ana Ruiz | 1 | 8 | 22–06 |

Al escanear QR, la cuidadora elige **su** asignación (o el front la muestra según prestador logueado).

### Ventajas y límites

- **Ventajas:** queda claro quién puede ir en cada franja; cupo 1 evita doble visita en el mismo turno.  
- **Límites:** más registros; si cambia la cuidadora del turno noche hay que editar asignación.

---

## 5. Ejemplo: lunes con 3 cuidadoras (Propuesta A)

```
00:00 ───────────────────────────────────────────── 24:00
        [── María ──][── Matilde ──][──── Ana ────]
        06:00      14:00          22:00
```

| Hora | Quién | Acción en la app |
|------|-------|------------------|
| 05:55 | María | Escanea QR → **Iniciar visita** |
| 14:02 | María | Escanea QR → **Finalizar visita** (~8 h) |
| 14:05 | Matilde | Escanea QR → **Iniciar visita** |
| 22:00 | Matilde | **Finalizar** (manual o auto a las 8 h desde inicio) |
| 22:10 | Ana | **Iniciar visita** |
| 06:00 (martes) | Ana | **Finalizar** |

**Cobro del día:** 3 visitas, cada una con sus horas (con tope de 8 h por turno si así está la asignación).

---

## 6. Quién hace qué

| Rol | Responsabilidad |
|-----|-----------------|
| **Operaciones / admin** | Alta de asignación; planilla de turnos; cambios de suplente; suspender paciente |
| **Cuidadora** | Escanear al entrar y salir; no dejar visita abierta al irse |
| **Sistema** | Registrar visita; limitar horas; cerrar sola si olvidó; cupo 3/día; cobro según tarifa |

---

## 7. Casos que hay que decidir en la reunión

Marque la opción acordada:

| # | Pregunta | Opción 1 | Opción 2 |
|---|----------|----------|----------|
| 1 | ¿Cuántas visitas por día? | 3 fijas | Variable (4 con refuerzo) |
| 2 | ¿Modelo en sistema? | **A** Una asignación + planilla | **B** Tres asignaciones |
| 3 | ¿Prestador fijo por paciente? | No (rotativo) | Sí en algunos turnos |
| 4 | ¿Duración turno? | 8 h fijas | Variable según día |
| 5 | ¿Dos cuidadoras con visita abierta a la vez? | **No** (regla deseada) | Permitido (no recomendado) |
| 6 | ¿Planilla de turnos en app más adelante? | Sí, fase 2 | No, siempre en Excel |

---

## 8. Comparación rápida

| Criterio | Propuesta A | Propuesta B |
|----------|-------------|-------------|
| Simplicidad de carga | Alta | Media |
| Claridad por cuidadora | Media (planilla externa) | Alta |
| Cambio de suplente | Fácil (misma asignación) | Editar asignación del turno |
| Desarrollo nuevo | Mínimo | Mínimo |
| Roster en app | No | No (igual hace falta fase 2 para horarios) |

---

## 9. Decisión de la reunión

**Modelo elegido:** ☐ A   ☐ B   ☐ Otro: _______________

**Visitas por día autorizadas:** _______________

**Horas máximas por turno:** _______________

**Responsable planilla de turnos:** _______________

**Notas:**

_______________________________________________________________________________

_______________________________________________________________________________

_______________________________________________________________________________

---

*Documento interno — Medicine · Borrador para alinear negocio y sistema*
