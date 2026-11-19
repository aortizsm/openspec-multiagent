# Spec Delta

## ADDED Requirements

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
