# Spec Delta

## REMOVED Requirements

### Requirement: Nota de edición vía shell en architect.md
**Reason**: Shell is not an editing route for the architect. The writable resources are declared in the prompt and enforced by the `edit` allowlist, so an instruction to edit other files with `sed`, `echo` or redirection contradicted the editing boundary and made this capability contradict itself.
**Migration**: Remove the shell-editing note from `architect.md`. The architect edits only its declared writable resources; everything else is delegated to `@developer` through a `tasks.md` row.

## MODIFIED Requirements

### Requirement: Frontera de edición del architect

El `architect.md` MUST declarar como recursos escribibles del architect `openspec/**`, `AGENTS.md`, `opencode/agents/*`, `.opencode/agents/*`, `README.md` y `docs/**`, que son el registro del proceso y la guía de agentes, y MUST delegar en `@developer` mediante una fila del `tasks.md` del change cualquier cambio en tests, código fuente o `scripts/**`, porque alteran comportamiento verificable. El prompt MUST NOT presentar `shell` como vía de edición de archivos.

#### Scenario: Frontera de edición documentada

- **WHEN** el usuario lee `architect.md`
- **THEN** encuentra la lista de recursos escribibles y la regla de que el resto de archivos los cambia `@developer` mediante una fila de `tasks.md`

#### Scenario: Alcance de shell como ejecución, no edición

- **WHEN** el usuario revisa los permisos descritos en `architect.md`
- **THEN** ve que `shell *` sirve para ejecutar comandos y que no se presenta como vía de edición de archivos

#### Scenario: Sin instrucción de edición por shell

- **WHEN** se revisa `architect.md` buscando una vía de edición alternativa a la herramienta `edit`
- **THEN** no existe ninguna instrucción que use `sed`, `echo` o redirección para modificar archivos

#### Scenario: El espejo local de agentes es un recurso escribible

- **WHEN** el architect necesita sincronizar `.opencode/agents/<name>.md` con su fuente en `opencode/agents/<name>.md`
- **THEN** lo edita directamente con la herramienta `edit`, porque es uno de sus recursos escribibles

#### Scenario: Los archivos que cambian comportamiento no son recursos escribibles

- **WHEN** el architect necesita cambiar un test, código fuente o un `script`
- **THEN** lo delega a `@developer` mediante una fila del `tasks.md` del change, en lugar de editarlo por sí mismo
