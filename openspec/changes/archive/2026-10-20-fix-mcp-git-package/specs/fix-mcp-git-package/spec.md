# Spec: Corregir paquete MCP git inexistente

## Purpose

Eliminar el servidor MCP de git del instalador porque su paquete npm (@modelcontextprotocol/server-git) no existe y causa error E404.

## Requirements

### R1 — Eliminar git del array de MCP servers
setup.mjs NO DEBE incluir al servidor "git" en el array mcpServers.

### R2 — Mantener filesystem y github
setup.mjs DEBE seguir preguntando por filesystem y github MCP servers.

### R3 — No romper el instalador
El instalador DEBE completar sin error E404 al configurar MCP servers.

## Acceptance Criteria

- [x] setup.mjs no incluye servidor git en mcpServers
- [x] setup.mjs incluye servidor filesystem en mcpServers
- [x] setup.mjs incluye servidor github en mcpServers
- [x] No hay error E404 al ejecutar setup.mjs para configurar MCP

## Delta Spec

## ADDED
(none)

## MODIFIED
- `scripts/setup.mjs`: eliminar entrada "git" del array mcpServers

## REMOVED
- `scripts/setup.mjs`: entrada "git" de mcpServers (paquete @modelcontextprotocol/server-git inexistente en npm)

## RENAMED
(none)
