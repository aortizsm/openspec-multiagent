# Feature: Instalar Engram automáticamente desde el instalador del proyecto

## Why

Quien quiera usar Engram debe instalar manualmente el binario antes de ejecutar `install-engram.mjs`. Esto crea fricción y pasos extra en el onboarding. Que el instalador del proyecto se encargue de descargar e instalar Engram reduce pasos y mejora la experiencia del usuario.

## What Changes

El instalador del proyecto (`setup.mjs`) ahora puede descargar e instalar el binario de Engram (solo Linux) desde sus releases de GitHub como un paso opcional. Los cambios por archivo son:

- **`scripts/lib.mjs`**: helpers `isEngramInstalled()`, `downloadEngram()`, `engramBinDir()`, `engramBinPath()`, `engramAssetName()`.
- **`scripts/install-engram.mjs`**: descarga e instala el binario si no está presente, luego escribe la entrada MCP V2 en OpenCode.
- **`scripts/setup.mjs`**: nuevo paso opcional "Engram" entre agentes y preflight; bandera `--no-engram`.
- **`scripts/check.mjs`**: chequeo opcional y no bloqueante del estado de Engram.
- **`README.md`**: documentación del paso opcional de Engram.
- **`tests/run.mjs`**: pruebas de helpers sin red.

## Alternatives Considered

- **Estado actual (no instalar nunca):** el usuario instala manualmente el binario. Más pasos, más fricción.
- **Instalar siempre sin preguntar:** innecesario para quien no usa Engram.
- **Pedir la URL del binario al usuario:** demasiado complejo y propenso a errores.

## Impact

- [x] Breaking changes — no
- [x] Database migrations — no
- [x] API changes — no

## Delta

## ADDED
- `scripts/lib.mjs`: helpers `isEngramInstalled`, `downloadEngram`, `engramBinDir`, `engramBinPath`, `engramAssetName`
- `scripts/install-engram.mjs`: descarga e instala binario de Engram + escribe entrada MCP V2
- `scripts/setup.mjs`: paso opcional "Engram" entre agentes y preflight; bandera `--no-engram`
- `scripts/check.mjs`: chequeo opcional no bloqueante del estado de Engram
- `README.md`: documentación del paso opcional de Engram
- `tests/run.mjs`: pruebas de helpers sin red

## MODIFIED
- `scripts/install-engram.mjs`: de "solo escribir config MCP" a "descargar binario + escribir config MCP"
- `scripts/setup.mjs`: se agrega paso 5 opcional de Engram

## REMOVED
(none)

## RENAMED
(none)
