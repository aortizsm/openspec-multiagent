# Spec Delta

## Purpose

Define el rol de verificación independiente del workflow: un agente que ejecuta los comandos reales del proyecto, comprueba cada escenario de la spec contra evidencia observable y devuelve un veredicto, sin escribir código y sin aceptar el auto-reporte del implementador.

## ADDED Requirements

### Requirement: Verificación independiente del autor

El `verifier` MUST ejecutar los comandos del proyecto por sí mismo. MUST NOT aceptar como evidencia el reporte de finalización del `developer` ni asumir que un comando pasó porque el implementador lo afirma. Cuando no pueda ejecutar un comando, MUST reportarlo como `UNVERIFIABLE` con la razón, en lugar de asumir éxito.

#### Scenario: Reporte del developer no es prueba
- **WHEN** el `developer` informa que los tests pasan
- **THEN** el `verifier` ejecuta los tests y usa su propia salida como evidencia

#### Scenario: Comando no ejecutable
- **WHEN** el comando de test del proyecto falla por falta de dependencias, permisos o servicio externo
- **THEN** el `verifier` reporta `UNVERIFIABLE` con la causa y no lo cuenta como aprobado

### Requirement: Reporte por escenario con veredicto

El `verifier` MUST devolver un reporte que, para cada escenario de la spec del change, indique el veredicto (`PASS`, `FAIL` o `UNVERIFIABLE`), la evidencia que lo sustenta (salida de comando, fichero y línea, o ausencia explícita de cobertura) y el comando ejecutado. MUST NOT emitir un veredicto global sin el desglose por escenario.

#### Scenario: Escenario cubierto
- **WHEN** existe un test que ejercita el comportamiento descrito por un escenario y pasa
- **THEN** el reporte marca ese escenario como `PASS` y cita el test y su salida

#### Scenario: Escenario sin cobertura
- **WHEN** ningún test ni comprobación cubre un escenario
- **THEN** el reporte lo marca como `UNVERIFIABLE` e indica qué evidencia faltaría

#### Scenario: Escenario incumplido
- **WHEN** un test o una comprobación contradice el escenario
- **THEN** el reporte lo marca como `FAIL` e incluye la salida que lo demuestra

### Requirement: Descubrimiento de comandos sin invención

El `verifier` MUST obtener los comandos de test, build, lint y arranque desde `AGENTS.md`, el manifiesto del proyecto (`package.json`, `composer.json`, `pyproject.toml`, `Makefile` u equivalente) o el reporte de `repo-scout`. MUST NOT inventar comandos ni asumir un stack.

#### Scenario: Comando declarado en el proyecto
- **WHEN** el proyecto declara su comando de test en `AGENTS.md` o en el manifiesto
- **THEN** el `verifier` ejecuta exactamente ese comando

#### Scenario: Comando no declarado
- **WHEN** el proyecto no declara ningún comando de verificación
- **THEN** el `verifier` reporta `UNVERIFIABLE` para los escenarios afectados y señala que falta declarar el comando, en lugar de adivinarlo

### Requirement: Alcance de ejecución acotado

El `verifier` MUST limitarse a comandos de solo lectura sobre el repositorio: tests, build o compilación, linters y typecheck, y comprobación de arranque en seco. MUST NOT ejecutar migraciones de base de datos, despliegues ni comandos que muten estado compartido; esos casos MUST escalarse al `architect`.

#### Scenario: Migraciones pendientes
- **WHEN** la verificación requeriría aplicar migraciones de base de datos
- **THEN** el `verifier` no las ejecuta y escala la decisión al `architect`

#### Scenario: Arranque en seco
- **WHEN** el proyecto permite comprobar que la aplicación arranca sin servicios externos
- **THEN** el `verifier` ejecuta esa comprobación y la reporta como evidencia adicional

### Requirement: El verifier no modifica el proyecto

El `verifier` MUST NOT crear, editar ni borrar ficheros del proyecto, ni hacer commits. Su única salida es el reporte de verificación.

#### Scenario: Fallo detectado
- **WHEN** el `verifier` encuentra un escenario en `FAIL`
- **THEN** reporta el fallo y devuelve el control; no corrige el código por su cuenta

### Requirement: Posición del verifier en el loop

El `architect` MUST invocar al `verifier` después de que el `code-reviewer` apruebe y antes de archivar el change. Si el reporte contiene algún `FAIL`, el `architect` MUST devolver el trabajo al `developer` con la evidencia y MUST NOT archivar. Un `UNVERIFIABLE` MUST justificarse antes de archivar o resolverse añadiendo la evidencia que falte.

#### Scenario: Verificación limpia
- **WHEN** el reporte no contiene ningún `FAIL` y los `UNVERIFIABLE` están justificados
- **THEN** el `architect` puede archivar el change

#### Scenario: Verificación con fallo
- **WHEN** el reporte contiene un `FAIL`
- **THEN** el `architect` no archiva y reenvía el trabajo al `developer` con la salida que demuestra el fallo

#### Scenario: Cambios tras la verificación
- **WHEN** el `developer` modifica código después de un reporte limpio
- **THEN** el `architect` MUST solicitar una nueva verificación antes de archivar
