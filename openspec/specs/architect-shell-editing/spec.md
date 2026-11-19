# architect-shell-editing Specification

## Purpose
Definir cómo `architect.md` delimita la ejecución de comandos y la edición de archivos del architect: ejecuta por sí mismo los comandos propios del proyecto donde trabaja, y sus recursos editables se limitan a `openspec/**`, `AGENTS.md` y `opencode/agents/*`.

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

### Requirement: El architect ejecuta los comandos propios del proyecto

El prompt de `architect.md` MUST indicar que el architect ejecuta por sí mismo los comandos propios del proyecto donde trabaja, y MUST NOT delegar en el usuario un comando que puede ejecutar, afirmar una incapacidad general para ejecutarlo ni restringirse a una allowlist cerrada de comandos de solo lectura. Ejecutar los comandos del proyecto no es editar el repositorio.

#### Scenario: Comando del proyecto disponible

- **WHEN** el architect necesita un comando que su entorno proporciona, como un script del proyecto (`npm run <script>`), un cliente de base de datos o una herramienta de análisis
- **THEN** lo ejecuta él mismo, reporta la salida y no pide al usuario que lo ejecute

#### Scenario: El prompt no cierra el conjunto de comandos

- **WHEN** un mantenedor inspecciona `architect.md`
- **THEN** no encuentra una restricción que limite al architect a una lista enumerada de comandos de solo lectura excluyendo los comandos propios del proyecto

#### Scenario: Comando no disponible

- **WHEN** un comando falla o la herramienta no está instalada en el entorno
- **THEN** reporta el bloqueo concreto y el siguiente paso mínimo, sin afirmar una incapacidad general para ejecutar comandos

#### Scenario: La ejecución de inspección no muta el repositorio

- **WHEN** el architect ejecuta un comando de inspección o verificación
- **THEN** usa el modo no mutante del comando (`--dry-run` o flags de solo lectura) y no deja el repositorio modificado.

#### Scenario: El architect no muta sin petición del usuario

- **WHEN** un comando solo puede ejecutarse mutando el proyecto y el usuario no lo ha pedido
- **THEN** el architect reporta qué cambiaría antes de ejecutarlo y no lo ejecuta

#### Scenario: La frontera de edición se mantiene

- **WHEN** el architect necesita un cambio de comportamiento en el código fuente del proyecto
- **THEN** lo delega a `@developer` mediante una fila en el `tasks.md` del change en lugar de editar el fichero por sí mismo
