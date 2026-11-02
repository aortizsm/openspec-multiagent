# architect-shell-editing Specification

## Purpose
Documentar en `architect.md` que el architect puede editar cualquier archivo del proyecto vía shell, aclarando la distinción entre la herramienta `edit` (rutas restringidas) y `shell` (alcance `*`).

## Requirements

### Requirement: Nota de edición vía shell en architect.md

El `architect.md` MUST incluir una nota aclarando que archivos fuera de `openspec/**`, `AGENTS.md` y `opencode/agents/*` se editan vía shell (comandos como `sed`, `echo`, redirección), dado que `shell` tiene alcance `*`.

#### Scenario: Nota de shell presente
- **WHEN** el usuario lee `architect.md`
- **THEN** existe una nota que explica la edición vía shell para archivos no cubiertos por `edit`.

### Requirement: Permisos de shell documentados

El `architect.md` MUST documentar que `shell *` permite editar cualquier archivo del proyecto.

#### Scenario: Shell alcance documentado
- **WHEN** el usuario revisa los permisos de `architect.md`
- **THEN** ve que `shell *` tiene efecto allow.
