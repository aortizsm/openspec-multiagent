# Robustez de entrada stdin en el asistente de setup (infra-stability)

**Fecha:** 2026-10-27  
**Estado:** archivado

## ¿Qué cambia?

Hace que los prompts de entrada del asistente de instalación (`GITHUB_TOKEN`, selección de modelos) no se cuelguen en entornos no-TTY, con stdin pipeado o tras reinicios del servidor OpenCode.

El cambio:

- Añade `readInput()` en `scripts/lib.mjs`: una única función primitiva que lee stdin detectando si es TTY, pipe o está cerrado, con timeout para evitar bloqueos indefinidos.
- `ask()`, `askText()` y `askYesNo()` delegan a `readInput()` en lugar de implementar su propia lógica de lectura (eliminando código duplicado y caminos divergentes TTY/pipe).
- `ask()`, `askText()`, `askYesNo()` aceptan parámetros opcionales `stdin`/`stdout` para pruebas unitarias con mocks, sin necesidad de reemplazar `process.stdin` (read-only).
- `askChoice()` corrige un error latente: referenciaba variables indefinidas `agentName` y `recommendedId` en su plantilla de prompt.
- `run()` renombra la variable prohibida `result` a `spawnResult` (criterio de código limpio #1).

## Escenarios de uso / Impacto

- `npm run setup --dry-run` no se cuelga si stdin no es TTY.
- `echo "token" | npm run setup` lee el token del pipe y continúa la instalación.
- En entornos CI o tras reinicios del servidor, los prompts devuelven el valor por defecto inmediatamente en lugar de bloquearse esperando input que nunca llega.
- `askChoice` muestra un prompt correcto en lugar de "undefined" para las variables que no existían.

## Detalles técnicos

**Archivos modificados:**

- `scripts/lib.mjs` — añade `readInput()` (exportado para pruebas); `ask()` delega a `readInput()`; `askText()` y `askYesNo()` llaman a `ask()` (cambio transitivo); `io()` y `closePrompts()` se conservan por compatibilidad; elimina código duplicado de raw-mode/readline/pipe.
- `tests/lib.test.mjs` (nuevo) — 25 pruebas para `readInput`, `ask`, `askText`, `askYesNo`, `closePrompts`, `isInteractive`.
- `package.json` — el comando `test` ejecuta también `tests/lib.test.mjs`.
- `scripts/setup.mjs` — sin cambios de código; se beneficia de `askText` más robusto para el prompt de `GITHUB_TOKEN`.

**Lo que se conserva:**

- API pública inalterada: `ask(question)`, `askText(question, {fallback})`, `askYesNo(question, {defaultYes})` mantienen sus firmas.
- `selectModelFromList` no existe en el código activo (se eliminó en el change previo `remove-zen-model-selection`); no se añade detección DECSC/DECRC.

## Notas

- No es un cambio rompedor: las firmas públicas no cambian y el comportamiento en entornos TTY interactivos es idéntico al anterior.
- El único cambio observable es que los prompts ya no se cuelgan en entornos no-TTY o pipeados.

## Migración

No se requiere migración. Los usuarios actuales de `npm run setup` notarán que el prompt de `GITHUB_TOKEN` responde correctamente cuando se ejecuta con stdin pipeado.
