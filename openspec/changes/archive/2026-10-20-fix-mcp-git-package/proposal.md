# Bugfix: Corregir paquete MCP git inexistente en npm

## Why

El servidor MCP de git se configuraba con `@modelcontextprotocol/server-git`, pero ese paquete **no existe en npm** (error E404). Esto hace que la instalación falle cuando el usuario acepta configurar el MCP de git.

## What Changes

Eliminar el servidor "git" del array de MCP servers en `scripts/setup.mjs`. Se mantienen filesystem y github.

## Alternatives Considered

- **Buscar un paquete alternativo de git MCP en npm:** no se encontró un nombre oficial de @modelcontextprotocol para git server. Los servidores oficiales de MCP (incluyendo Git) están en el repositorio modelcontextprotocol/servers pero no todos están publicados como paquetes @modelcontextprotocol/server-*.
- **Dejar git con un nombre incorrecto:** causaría error E404 en cada instalación.
- **Eliminar git del instalador:** opción más segura; el usuario puede agregarlo manualmente más tarde si encuentra el paquete correcto.

## Impact

- [x] Breaking changes — no (git era opcional y fallaba)
- [x] Database migrations — no
- [x] API changes — no

## Delta

## ADDED
(none)

## MODIFIED
- `scripts/setup.mjs`: eliminar entrada "git" del array mcpServers

## REMOVED
- `scripts/setup.mjs`: entrada "git" de mcpServers (paquete @modelcontextprotocol/server-git inexistente en npm)

## RENAMED
(none)
