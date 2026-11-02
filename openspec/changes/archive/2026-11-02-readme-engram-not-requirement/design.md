# Design

## Context

El `README.md` tiene una sección `Requirements` con una tabla de componentes obligatorios. Engram (memoria persistente) y CodeGraph (grafo de símbolos de código) son componentes opcionales y no deben confundirse con requerimientos obligatorios.

## Goals / Non-Goals

**Goals:**
- Aclarar que Engram y CodeGraph no son requerimientos obligatorios en `Requirements`.
- Mantener la tabla `Requirements` intacta en cuanto a componentes obligatorios.

**Non-Goals:**
- Eliminar las secciones `Memory (Engram)` o `CodeGraph` del README (son documentación aparte).
- Cambiar cualquier otro archivo del proyecto.

## Decisions

### D1. Nota aclaratoria en Requirements

Agregar una nota después de la tabla `Requirements` indicando que Engram y CodeGraph son opcionales, o no mencionarlos en la tabla en absoluto.

### D2. Especificación en español

Los documentos de OpenSpec (proposal, design, tasks, spec) están en español, como convención del proyecto.

## Risks / Trade-offs

- Ningún riesgo de código; es solo documentación.
