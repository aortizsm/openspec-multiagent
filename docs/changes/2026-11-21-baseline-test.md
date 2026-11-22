# Utilidad de métricas de baseline (baseline-test)

**Fecha:** 2026-11-21  
**Estado:** pendiente de archivo

## ¿Qué cambia?

Añade `scripts/baseline-util.mjs` con la función `formatTimestamp()` y su test
`tests/baseline-util.test.mjs`. `formatTimestamp(date = new Date())` devuelve la
marca de tiempo en formato ISO 8601; sin argumentos usa la fecha actual y con un
objeto `Date` devuelve ese instante.

## Por qué

El change necesita un cambio mínimo para medir tokens y tiempo de pared
(wall-time) como referencia de baseline.

## Cómo se usa

```js
import { formatTimestamp } from "../scripts/baseline-util.mjs";

const ahora = formatTimestamp();                 // fecha actual, ISO 8601
const instante = formatTimestamp(new Date("2024-01-15T10:30:00.000Z"));
```

## Impacto / migración

Es un script nuevo y autónomo sin dependencias (solo built-ins de Node). No
modifica flujos ni agentes existentes, ni introduce cambios rompedores, por lo
que no se requiere migración.

## Notas

- La implementación cubre ambos escenarios del spec (`specs/baseline-util/spec.md`):
  llamada sin argumentos y llamada con `Date`.
- `tests/baseline-util.test.mjs`: 6 pruebas, 6 pasadas.
- `npm test` (suite del proyecto): 106 pasadas; la única falla (`orchestrate:
  dry-run shows sequential tests before parallel reviews`) es preexistente en
  `tests/run.mjs` y no está relacionada con este change.
- No se actualiza ninguna `docs/guides/<capacidad>.md`: no existe guía de
  capacidad para esta utilidad interna y crear una excedería el alcance (YAGNI).

## Migración

No se requiere migración: es un script nuevo y autónomo sin usuarios previos.
