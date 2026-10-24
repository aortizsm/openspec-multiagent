# Spec: MCP servers con default sí

## Purpose

Cambiar el default de las preguntas de MCP servers en `setup.mjs` de "no" a "sí" para que no pasen desapercibidos.

## Requirements

### R1 — Default sí para filesystem
La pregunta de configurar filesystem MCP debe tener `defaultYes: true`.

### R2 — Default sí para git
La pregunta de configurar git MCP debe tener `defaultYes: true`.

### R3 — Default sí para github
La pregunta de configurar github MCP debe tener `defaultYes: true`.

### R4 — Flag --no-mcp preservada
El flag `--no-mcp` debe seguir omitiendo todo el paso de MCP servers.

### R5 — No sobrescribir existentes
Si un MCP ya está configurado, se salta sin preguntar (cambio no afectado).

## Acceptance Criteria

- [x] setup.mjs pregunta por filesystem con default "sí"
- [x] setup.mjs pregunta por git con default "sí"
- [x] setup.mjs pregunta por github con default "sí"
- [x] --no-mcp sigue omitiendo el paso completo
- [x] check.mjs sigue detectando MCP configurados

## Delta Spec

## ADDED
(none)

## MODIFIED
- `scripts/setup.mjs`: línea 229, `defaultYes: false` → `defaultYes: true` para las 3 preguntas de MCP servers (filesystem, git, github)

## REMOVED
(none)

## RENAMED
(none)
