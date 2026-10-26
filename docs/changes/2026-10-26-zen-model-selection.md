# Selección de modelos por agente (OpenCode Go / Zen)

## ¿Qué cambia?
El asistente de instalación (`npm run setup`) incluye ahora un paso interactivo para asignar modelos de OpenCode Go a cada agente que tenga un campo `model` configurado. Los modelos se muestran ordenados por coste, con recomendaciones inteligentes, y el provider `opencode-go` se configura automáticamente.

## Escenarios de uso
- **Instalación interactiva**: `npm run setup` → paso 5 "Selecting agent models" muestra la lista de modelos con precios y pide seleccionar uno por agente.
- **Modo no interactivo**: `npm run setup -- --dry-run` → usa los modelos recomendados sin preguntar.
- **Provider existente**: Si ya existe un provider `opencode-go`, solo se actualiza el campo `model`.
- **Fallback**: Si no se puede obtener la página HTML de precios, se usa una lista embebida de modelos con un aviso.

## Detalles técnicos
- Los precios se obtienen scraping HTML de `https://opencode.ai/v2/docs/console/go/` (sección `<div slot="go">`).
- Se parsean dos tablas: pricing y endpoint mapping (model → SDK package).
- El provider se configura en `~/.config/opencode/opencode.json` con el SDK package correcto (`@ai-sdk/openai`, `@ai-sdk/anthropic`, `@ai-sdk/google`, o `@ai-sdk/openai-compatible`).
- Se instalan automáticamente los paquetes SDK necesarios vía npm.

## Notas
- Los modelos recomendados: `gpt-6-luna` para architect (mejor ratio reasoning/precio), `mimo-v2.6-flash` para todos los demás (más barato).
- El API key de OpenCode Go se almacena en el config file (no en variables de entorno).
- Si el config file es JSONC, se lanza un error con instrucciones para añadir el provider manualmente.
