# add-reinstall-and-reset-commands

**Fecha:** 2026-11-04  
**Estado:** implementado

## Contexto

Los scripts `scripts/reinstall.mjs` y `scripts/reset.mjs` contenían bloques duplicados (casi idénticos) para eliminar archivos de agente y entradas MCP. Además usaban la variable prohibida `data` (criterio de código limpio #1). Al compartir la misma lógica en dos archivos, cualquier corrección debía aplicarse dos veces y el nombre `data` infringe la convención de nombres.

## Qué cambió

- **`scripts/lib.mjs`:** se añaden dos helpers reutilizables:
  - `removeAgentFiles(dir, { dryRun })`: elimina los archivos `.md` de un directorio de agentes, respetando modo previo (`--dry-run`).
  - `removeMcpEntries(configPath, mcpNames, { dryRun })`: elimina las entradas MCP de un config OpenCode, respetando JSONC (sale con error si hay comentarios) y modo previo.
- **`scripts/reinstall.mjs`:** los bloques duplicados de eliminación de agentes y MCP se reemplazan por llamadas a los helpers de `lib.mjs`. Se renombra `data` → `configData` (líneas donde se leía el config). Se conserva `--dry-run` y `mcpNames = ["openspec", "context7", "engram", "codegraph"]`.
- **`scripts/reset.mjs`:** mismo reemplazo de bloques duplicados por los helpers. Se renombra `data` → `configData`. Se conserva el guardia `--confirm` (operación destructiva), `--dry-run` y `mcpNames`.
- **`README.md`:** ya documentaba `npm run reinstall` y `npm run reset` en la tabla de scripts npm; no requiere cambios.

## Por qué

| Decisión | Motivo |
|----------|--------|
| Extraer a `lib.mjs` | Elimina ~15-20 líneas duplicadas entre `reinstall.mjs` y `reset.mjs` (DRY, criterio #4). |
| Renombrar `data` → `configData` | Elimina el nombre de variable prohibido `data` (criterio #1) por un sustantivo descriptivo. |
| No tocar OpenSpec setup | Los scripts ya respetan `openspec init` / proyecto config; se preserva. |
| Mantener `--confirm` en reset | Es una operación destructiva; el guardia de seguridad se conserva. |
| Mantener `--dry-run` | Modo de previo sin efectos secundarios, para inspección segura. |

## Cómo se usa

- `npm run reinstall` — sobrescribe todos los agentes y reconfigura los MCP servers.
- `npm run reinstall --dry-run` — muestra lo que se haría sin modificar nada.
- `npm run reset --confirm` — elimina todo el setup multi-agente (destructivo).
- `npm run reset --dry-run` — muestra lo que se eliminaría sin ejecutar.

Los nombres de MCP son fijos: `openspec`, `context7`, `engram`, `codegraph`.

## Impacto / Migración

- No es breaking change: la interfaz de usuario (`npm run reinstall` / `npm run reset`) no cambia.
- Los comandos existentes (`setup`, `install-agents`, etc.) siguen funcionando.
- No hay migración de datos requerida.

## Evidencia

- `node --check` pasa en `scripts/lib.mjs`, `scripts/reinstall.mjs`, `scripts/reset.mjs`.
- `npm test`: 33 tests pasando, 0 fallando.
- `npm run check`: estado READY (Node 22.23.4, OpenSpec 1.14.3).
- `openspec validate`: exit 0.
- Dry-run de `reinstall` y `reset` ejecutados sin errores; ambos reportan los mismos conteos de agentes y entradas MCP.
