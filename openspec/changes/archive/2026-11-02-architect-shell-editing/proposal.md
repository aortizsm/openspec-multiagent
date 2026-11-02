# Proposal

## Why

El `architect.md` tiene permisos de shell en `*` (allow), lo que permite editar cualquier archivo del proyecto vía comandos de shell (sed, echo, redirección). Sin embargo, no queda claro en la documentación del agente que esta capacidad existe, lo que genera confusión sobre qué archivos puede modificar el architect.

## What Changes

- Agregar nota en `opencode/agents/architect.md` aclarando que la edición de archivos fuera de `openspec/**`, `AGENTS.md` y `opencode/agents/*` se realiza vía shell (comandos como `sed`, `echo`, redirección), ya que la herramienta `edit` tiene restricciones de ruta pero `shell` tiene alcance `*`.

## Scope

- `opencode/agents/architect.md` (sección de permisos o notas)

## Success Criteria

- `architect.md` incluye una nota clara sobre edición vía shell para archivos fuera del alcance de `edit`.
- Los permisos de shell `*` quedan documentados como medio de edición de cualquier archivo.
