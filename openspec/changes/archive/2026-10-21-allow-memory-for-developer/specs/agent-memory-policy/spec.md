# Spec Delta

## MODIFIED Requirements

### Requirement: Lectura acotada antes de decidir

`architect` MUST ejecutar `mem_context` al inicio de la sesión y `developer` MUST ejecutar `mem_search` dirigido (nombre del change, capacidad o stack afectado); ninguno MUST hacer cargas masivas de memoria. `code-reviewer`, `repo-scout` y `diff-summarizer` MUST NOT consultar Engram durante su trabajo: usan la spec, el diseño y el diff.

#### Scenario: Architect recupera contexto previo
- **WHEN** `architect` inicia una sesión en un proyecto con Engram disponible
- **THEN** ejecuta `mem_context` antes de proponer y usa los recuerdos relevantes como entrada del diseño

#### Scenario: Desarrollador busca solo lo relevante
- **WHEN** `developer` recibe un change para implementar
- **THEN** ejecuta `mem_search` acotado al change, capacidad o stack afectado, y no vuelca toda la memoria del proyecto

#### Scenario: La lectura no altera el resultado
- **WHEN** la memoria no contiene nada relevante para la tarea
- **THEN** el agente continúa con el flujo normal sin tratar la ausencia de recuerdos como bloqueo

#### Scenario: Revisor no consulta memoria
- **WHEN** `code-reviewer` recibe un change para revisar
- **THEN** trabaja con la spec, el diseño y el diff, y no consulta Engram

### Requirement: Taxonomía mínima de guardado

`architect` y `developer` escriben en Engram. `architect` guarda el estado de conversación, las decisiones con rationale y las convenciones que adopta; `developer` guarda gotchas de implementación y bloqueos resueltos. Cada guardado MUST incluir contexto suficiente para ser útil sin el historial de la sesión actual.

#### Scenario: Digest de conversación
- **WHEN** la conversación avanza sobre un tema con hilos abiertos
- **THEN** `architect` guarda un digest estructurado (intención, lo acordado, lo pendiente), no una transcripción

#### Scenario: Gotcha de implementación
- **WHEN** `developer` descubre una restricción no documentada que costó tiempo resolver
- **THEN** guarda una memoria con la restricción y la solución aplicada

#### Scenario: Hallazgo recurrente de review
- **WHEN** `code-reviewer` detecta un defecto que ya apareció en revisiones anteriores del proyecto
- **THEN** lo reporta en su feedback y `architect` lo guarda con el patrón y cómo evitarlo

### Requirement: Propiedad por rol

Cada tipo de recuerdo MUST tener un único dueño: `architect` guarda el estado de conversación y las decisiones; `developer` guarda gotchas de implementación y bloqueos resueltos. `code-reviewer`, `repo-scout` y `diff-summarizer` MUST NOT escribir memoria: reportan en su respuesta y `architect` decide qué se conserva.

#### Scenario: Convenciones detectadas por repo-scout
- **WHEN** `repo-scout` reporta convenciones y `architect` las adopta para el diseño
- **THEN** `architect` es quien las guarda; `repo-scout` no escribe nada

#### Scenario: Agentes de solo lectura con Engram configurado
- **WHEN** `code-reviewer`, `repo-scout` o `diff-summarizer` se ejecutan en una sesión con Engram y la instrucción genérica del MCP invita a guardar
- **THEN** no escriben memoria: reportan, y `architect` decide qué se guarda

#### Scenario: Cierre de spec
- **WHEN** `architect` archiva un change aprobado
- **THEN** registra un resumen de sesión con lo implementado, los criterios cumplidos y los tradeoffs relevantes
