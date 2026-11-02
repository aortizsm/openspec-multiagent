# Design

## Context

El archivo `architect.md` define permisos de edición vía herramienta `edit` limitados a `openspec/**`, `AGENTS.md` y `opencode/agents/*`, pero define permisos de shell en `*` (allow). Esta distinción no está documentada, lo que genera incertidumbre sobre si el architect puede editar archivos como `README.md`, `docs/changes/`, etc.

## Goals / Non-Goals

**Goals:**
- Documentar explícitamente que el architect puede editar cualquier archivo del proyecto vía shell.
- Dejar claro que la herramienta `edit` tiene restricciones de ruta pero `shell` no.

**Non-Goals:**
- Cambiar permisos reales (ya están correctos).
- Modificar otros archivos de agente.

## Decisions

### D1. Nota en architect.md

Agregar una sección o nota en `architect.md` explicando que archivos fuera del alcance de `edit` se editan vía shell.

## Risks / Trade-offs

- Ninguno. Es solo documentación de una capacidad que ya existe.
