# Eliminación de la selección de modelos Zen (OpenCode Go)

**Fecha:** 2026-10-26  
**Estado:** archivado

## ¿Qué cambia?

Elimina por completo la función de selección de modelos OpenCode Go (Zen) del asistente de instalación `npm run setup`. Este change se deriva de la decisión del equipo de que la selección interactiva de modelos no es central para el flujo multiagente y añade complejidad innecesaria a la instalación: scraping de red, obtención de precios en vivo y prompts interactivos.

El cambio:

- Elimina el Paso 6 "Selecting models for OpenCode Go" de `scripts/setup.mjs` junto con sus funciones de ayuda (`runModelSelection`, `discoverAgentsWithModel`, `selectModelForAgent`, `selectModelsForAgents`, `selectProviderModel`).
- Elimina toda la sección de selección de modelos Zen de `scripts/lib.mjs`, incluidas las exportaciones `ZEN_EMBEDDED_PRICING`, `ZEN_PROVIDER_FALLBACK`, `fetchZen*`, `parseZen*`, `getZenModelDisplay`, `selectModelFromList`, `configureZenProvider` y helpers relacionados.
- Elimina las specs activas `openspec/specs/model-selector/spec.md`, `openspec/specs/setup-wizard/spec.md` y `openspec/specs/zen-provider/spec.md`.
- Elimina `docs/changes/2026-10-26-zen-model-selection.md` y actualiza `docs/CHANGELOG.md` para quitar la entrada correspondiente.

## Escenarios de uso / Impacto

- `npm run setup` ahora ejecuta 9 pasos en lugar de 10. El paso de selección de modelos (antes Paso 6) desaparece; los pasos siguientes (CodeGraph, Engram, MCP servers, Preflight) conservan su orden relativo.
- Ya no hay selector interactivo de modelos durante la instalación.
- Ya no se realiza scraping de red ni obtención de precios en vivo como parte del setup.
- El proveedor `opencode-go` ya no se configura automáticamente durante el setup.

## Detalles técnicos

**Archivos eliminados:**

- `openspec/specs/model-selector/spec.md`
- `openspec/specs/setup-wizard/spec.md`
- `openspec/specs/zen-provider/spec.md`
- `docs/changes/2026-10-26-zen-model-selection.md`

**Archivos modificados:**

- `scripts/setup.mjs` — se quita el Paso 6 y las funciones de ayuda de selección de modelos; `TOTAL_STEPS` pasa de 10 a 9; se eliminan las importaciones de símbolos Zen (`ZEN_EMBEDDED_PRICING`, `configureZenProvider`, `fetchZenData`, `getZenModelDisplay`, `parseZenEndpointTable`, `selectModelFromList`).
- `scripts/lib.mjs` — se quita la sección completa de selección de modelos Zen (aprox. líneas 498-1205 del archivo previo).
- `docs/CHANGELOG.md` — se elimina la entrada `zen-model-selection`.

**Lo que se conserva:**

- `httpsRequest` y `fetchJson` permanecen en `lib.mjs` porque son de propósito general y los usa código no Zen (por ejemplo, la comprobación de versiones de Engram).
- Los cambios archivados `2026-10-26-zen-model-selection` y `2026-10-26-zen-model-selection-v2` en `openspec/changes/archive/` no se tocan; registran el trabajo histórico.

## Notas

- Cambio rompedor: los usuarios que dependían de la selección de modelos Zen durante el setup ya no reciben un selector interactivo ni la configuración automática del proveedor `opencode-go`.
- La instalación se completa en 9 pasos en lugar de 10.
- No quedan referencias a la selección de modelos Zen en código activo (`scripts/`, `openspec/specs/`, `docs/`).

## Migración

Los usuarios que antes confiaban en la selección de modelos Zen deben configurar el proveedor `opencode-go` manualmente en su fichero de configuración de OpenCode (JSONC), por ejemplo:

```jsonc
providers: {
  "opencode-go": {
    name: "OpenCode Go (Zen)",
    package: "@ai-sdk/openai-compatible",
    settings: {
      baseURL: "https://opencode.ai/inference/go/openai/v1/chat/completions",
    },
  },
},
```

El modelo y la clave de API se añaden a mano según el proveedor deseado.
