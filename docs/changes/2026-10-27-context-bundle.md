# Bundle de contexto de un cambio OpenSpec (context-bundle)

**Fecha:** 2026-10-27  
**Estado:** pendiente de archivo

## ¿Qué cambia?

Añade `scripts/context-bundle.mjs`, un script que lee todos los artefactos de
un cambio OpenSpec (proposal.md, design.md, tasks.md, spec.md) junto con el
`git diff` del working tree y los emite como un único documento Markdown en
stdout, listo para pegar en el prompt del siguiente agente.

El cambio:

- Crea `scripts/context-bundle.mjs` que exporta `contextBundle(changeName)` y,
  al invocarse directamente, lee el nombre del cambio de `process.argv[2]`.
- Emite las secciones en orden: Proposal, Design, Tasks, Spec, Git Diff.
- Falla rápido: si el directorio del cambio no existe, imprime
  `ERROR: change '<name>' not found` y sale con código 1.
- No añade dependencias: solo built-ins de Node (fs, path, child_process, url).
- Añade los comandos npm `context-bundle` y `context` a `package.json`.

## Escenarios de uso / Impacto

- `node scripts/context-bundle.mjs infra-stability` genera el bundle completo
  del cambio `infra-stability` con las cinco secciones.
- `npm run context-bundle <cambio>` y `npm run context <cambio>` hacen lo
  mismo a través de los scripts de package.json.
- `node scripts/context-bundle.mjs nonexistent` sale con código 1 y mensaje de
  error, impidiendo que un agente trabaje con contexto incompleto en silencio.
- No se modifican agentes existentes, ni el flujo de OpenSpec, ni otros
  scripts del repositorio.

## Detalles técnicos

**Archivos modificados:**

- `scripts/context-bundle.mjs` (nuevo): implementa `contextBundle(changeName)`
  y la guardia de ejecución directa
  (`fileURLToPath(import.meta.url) === resolve(process.argv[1])`).
- `package.json`: añade los scripts `context-bundle` y `context`.

**Orden de los artefactos:** proposal → design → tasks → spec → diff. El spec
se busca como el primer `.md` bajo `specs/**` del directorio del cambio.

**Lo que se conserva:**

- API de `contextBundle`: función pura que devuelve string; los efectos de
  lado (salida, exit) ocurren solo en la ruta de ejecución directa.
- No hay cambios rompedores: ningún flujo ni agente existente depende de este
  script.

## Notas

- El guard `import.meta.url === process.argv[1]` del spec no se cumple en
  Node (argv[1] es una ruta de archivo, no una file: URL), por eso la guardia
  compara `fileURLToPath(import.meta.url)` con `resolve(process.argv[1])`.
- `process.exit(1)` se llama solo ante cambio inexistente, como exige el spec;
  los artefactos faltantes dentro del cambio lanzan `Error` con mensaje.

## Migración

No se requiere migración: es un script nuevo y autónomo sin usuarios previos.
