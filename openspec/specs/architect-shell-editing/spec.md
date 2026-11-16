# architect-shell-editing Specification

## Purpose
Documentar en `architect.md` que el architect puede editar cualquier archivo del proyecto vía shell, aclarando la distinción entre la herramienta `edit` (rutas restringidas) y `shell` (alcance `*`).

## Requirements

### Requirement: Nota de edición vía shell en architect.md

El `architect.md` MUST incluir una nota aclarando que archivos fuera de `openspec/**`, `AGENTS.md` y `opencode/agents/*` se editan vía shell (comandos como `sed`, `echo`, redirección), dado que `shell` tiene alcance `*`.

#### Scenario: Nota de shell presente
- **WHEN** el usuario lee `architect.md`
- **THEN** existe una nota que explica la edición vía shell para archivos no cubiertos por `edit`.

### Requirement: Frontera de edición del architect

El `architect.md` MUST documentar que `openspec/**`, `AGENTS.md` y `opencode/agents/*` son sus únicos recursos editables, que cualquier otro archivo del proyecto lo cambia `@developer` mediante una fila en el `tasks.md` del change, y que `shell *` es una vía de ejecución de comandos y no una vía de edición de archivos.

#### Scenario: Frontera de edición documentada
- **WHEN** el usuario lee `architect.md`
- **THEN** encuentra una nota que remite los archivos fuera de los recursos permitidos a `@developer` por una fila de `tasks.md`, y no una instrucción de edición vía shell

#### Scenario: Alcance de shell como ejecución, no edición
- **WHEN** el usuario revisa los permisos descritos en `architect.md`
- **THEN** ve que `shell *` tiene efecto allow para ejecutar comandos y que no se presenta como vía de edición de archivos

#### Scenario: Sin instrucción de edición por shell
- **WHEN** se revisa `architect.md` buscando una vía de edición alternativa a la herramienta `edit`
- **THEN** no existe ninguna instrucción que use `sed`, `echo` o redirección para modificar esos archivos
