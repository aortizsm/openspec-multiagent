# Design: Instalar Engram automáticamente desde el instalador del proyecto

## Alcance

Solo Linux (x64 y ARM64). Fuente: releases de https://github.com/Gentleman-Programming/engram.

## Arquitectura

El instalador de Engram se integra como un paso adicional en `setup.mjs`, opcional y controlado por el usuario. No forma parte del flujo obligatorio.

## Flujo de instalación

```
┌─────────────────────────────────────────────────────────┐
│  setup.mjs                                                │
│  ├─ Paso 1: Check Node.js                                 │
│  ├─ Paso 2: Instalar OpenSpec CLI                         │
│  ├─ Paso 3: Configurar Context7                           │
│  ├─ Paso 4: Instalar agentes                              │
│  ├─ Paso 5: Engram (opcional) ◄── NUEVO                  │
│  │    └─ Preguntar: "¿Instalar Engram?" (default: no)     │
│  │    └─ Si sí:                                           │
│  │        ├─ ¿Ya instalado? → mostrar y saltar             │
│  │        ├─ Descargar desde GitHub releases               │
│  │        ├─ Instalar en ~/.local/bin/engram               │
│  │        └─ Escribir entrada MCP en opencode.json         │
│  └─ Paso 6: Preflight check                               │
└─────────────────────────────────────────────────────────┘
```

## Cambios por archivo

### scripts/lib.mjs

Agregar dos helpers:

- `isEngramInstalled()`: verifica si `engram` está en `PATH` o si `ENGRAM_BIN` apunta a un ejecutable existente.
- `downloadEngram(version, destDir)`: descarga el asset de Linux desde GitHub releases, extrae el tar.gz y coloca el binario en `destDir`. Usa solo módulos built-in de Node (`https`, `fs`, `child_process` para `tar`).

### scripts/install-engram.mjs

Extender el script actual:

- Si `isEngramInstalled()` → mostrar mensaje "Engram ya está instalado", escribir la entrada MCP y salir.
- Si no está instalado → descargar e instalar el binario, luego escribir la entrada MCP.

### scripts/setup.mjs

Agregar paso opcional entre agentes y preflight:

- Preguntar al usuario si quiere instalar Engram (solo en modo interactivo; en CI/default no se instala).
- Si acepta, ejecutar la lógica de instalación de Engram.

### scripts/init.mjs

No se requieren cambios. La bandera `--engram` no es necesaria en el wizard; el paso opcional ya se maneja en `setup.mjs`.

### README.md

Documentar la nueva opción opcional de Engram en la sección de uso del instalador.

## Detalles técnicos

- URL de releases: `https://api.github.com/repos/Gentleman-Programming/engram/releases/latest` para obtener la URL del asset de Linux.
- Asset esperado: `engram-linux-amd64.tar.gz` o `engram-linux-arm64.tar.gz` (según arquitectura).
- Destino por defecto: `~/.local/bin/engram`.
- Si `~/.local/bin` no está en `PATH`, se informa al usuario al finalizar.

## Suposiciones

- El usuario tiene `curl` o `wget` disponible (o se usa `https` de Node built-in).
- GitHub releases tiene assets publicados con nombres predecibles por plataforma.
- No se requiere autenticación para descargar releases públicos.
