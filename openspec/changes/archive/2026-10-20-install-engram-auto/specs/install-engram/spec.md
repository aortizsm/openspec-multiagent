# Spec: Instalar Engram automáticamente

## Purpose

Permitir que el instalador del proyecto (`setup.mjs`) descargue e instale el binario de Engram como un paso opcional, escribiendo además la entrada MCP en la configuración de OpenCode.

## Requirements

### R1 — Paso opcional en setup.mjs
El instalador `setup.mjs` DEBE incluir un paso opcional para instalar Engram. Este paso NO se ejecuta por defecto; el usuario debe aceptarlo explícitamente. En entornos no interactivos (CI), el paso se salta.

### R2 — Detección de instalación previa
El instalador DEBE verificar si `engram` ya está disponible (en `PATH` o vía `ENGRAM_BIN`) antes de intentar descargarlo. Si ya está instalado, DEBE mostrar un mensaje informando que ya existe y NO reinstalar.

### R3 — Descarga desde GitHub releases
Cuando el usuario acepta instalar Engram, el instalador DEBE descargar el binario desde los releases de https://github.com/Gentleman-Programming/engram. Solo se soporta Linux.

### R4 — Instalación del binario
El binario descargado DEBE extraerse e instalarse en `~/.local/bin/engram` por defecto. El instalador DEBE hacer el binario ejecutable.

### R5 — Entrada MCP en OpenCode
Después de instalar (o si ya estaba instalado), el instalador DEBE escribir la entrada `engram` bajo `mcp.servers` en la configuración de OpenCode (`~/.config/opencode/opencode.json`), con forma V2 (`type: local`, `command: [engram, mcp]`).

### R6 — Plataforma soportada
Esta funcionalidad SOLO se implementa para Linux. En otros sistemas operativos, el paso se omite o se informa que no está soportado.

## Acceptance Criteria

- [x] `setup.mjs` incluye un paso opcional de Engram que pregunta al usuario.
- [x] Si el usuario acepta en Linux, se descarga e instala el binario de Engram.
- [x] Si `engram` ya está en PATH, se muestra mensaje y no se reinstala.
- [x] Se escribe la entrada MCP en `opencode.json` después de instalar.
- [x] `check.mjs` puede verificar que Engram está configurado.
- [x] No se rompen los pasos existentes del instalador.

## Delta

ADDED:
- scripts/lib.mjs: helpers isEngramInstalled, downloadEngram, engramBinDir, engramBinPath, engramAssetName
- scripts/install-engram.mjs: download and install Engram binary + write MCP V2 config entry
- scripts/setup.mjs: optional Engram step between agents and preflight; --no-engram flag
- scripts/check.mjs: optional non-blocking Engram status check
- README.md: documentation for optional Engram step
- tests/run.mjs: helper tests without network

MODIFIED:
- scripts/install-engram.mjs: from "only write MCP config" to "download binary + write MCP config"
- scripts/setup.mjs: add step 5 optional Engram

REMOVED:
(none)

RENAMED:
(none)
