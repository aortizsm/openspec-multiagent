# Proposal

## Why

La sección `Requirements` del `README.md` debe quedar clara sobre qué componentes son obligatorios y cuáles opcionales. Engram y CodeGraph son componentes opcionales del proyecto y no deben aparecer como requerimientos obligatorios en `Requirements`.

## What Changes

- Aclarar en la sección `Requirements` del `README.md` que Engram y CodeGraph son opcionales (no requerimientos obligatorios).
- Mantener el resto de la tabla `Requirements` sin cambios.
- No modificar otros archivos del proyecto.

## Scope

- `README.md` (sección `Requirements`)

## Success Criteria

- La sección `Requirements` no lista a Engram ni a CodeGraph como componentes obligatorios.
- Si se mencionan, están claramente marcados como opcionales.
- La tabla `Requirements` conserva todos los componentes obligatorios actuales (Node.js, openspec, openspec-mcp, Context7, OpenCode).
