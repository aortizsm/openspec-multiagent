# Design: MCP servers con default sí

## Cambio

En `scripts/setup.mjs`, sección "Configurando MCP servers (optional)" (líneas 227-230), cambiar:

```js
{ defaultYes: false }
```

por:

```js
{ defaultYes: true }
```

para cada uno de los 3 servidores (filesystem, git, github).

## No afecta

- Engram: se mantiene `defaultYes: false` (solo Linux, no tocado)
- Flag `--no-mcp`: sigue omitiendo todo el paso MCP
- Detección de existentes: si un MCP ya está en opencode.json, se salta sin preguntar
- check.mjs: sigue detectando y reportando MCP configurados

## Orden

filesystem → git → github (mantenido)
