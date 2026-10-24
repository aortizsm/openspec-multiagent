# Design: Corregir paquete MCP git inexistente

## Cambio

En `scripts/setup.mjs`, eliminar el objeto "git" del array `mcpServers` (líneas 209-213 actualmente). Quedar solo filesystem y github.

## Razón

El paquete `@modelcontextprotocol/server-git` no está publicado en npm. El servidor Git de MCP oficial está en el repositorio modelcontextprotocol/servers/src/git pero no como paquete npm con ese nombre scoped.

## No afecta

- filesystem: `@modelcontextprotocol/server-filesystem` sí existe en npm
- github: se pregunta con su propio token (pendiente de verificar paquete, pero el error reportado es solo de git)

## Orden después del cambio

filesystem → github
