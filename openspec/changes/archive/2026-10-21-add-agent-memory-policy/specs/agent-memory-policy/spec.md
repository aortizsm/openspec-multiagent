# Spec Delta

## Purpose

Define cómo los agentes del workflow usan Engram como memoria de trabajo para mantener el hilo en conversaciones largas, y cómo las decisiones finales y la memoria del proyecto quedan registradas en las specs de OpenSpec y en `AGENTS.md`.

## ADDED Requirements

### Requirement: Lectura acotada antes de decidir

Los agentes MUST consultar la memoria antes de decidir o preguntar algo que pudo tratarse antes. `architect` MUST ejecutar `mem_context` una vez al inicio de la sesión, antes de explorar el problema. `developer` y `code-reviewer` MUST ejecutar `mem_search` dirigido (nombre del change, capacidad o stack afectado), y MUST NOT hacer una carga masiva de memoria.

#### Scenario: Architect recupera contexto previo
- **WHEN** `architect` inicia una sesión en un proyecto con Engram disponible
- **THEN** ejecuta `mem_context` antes de proponer y usa los recuerdos relevantes como entrada del diseño

#### Scenario: Desarrollador busca solo lo relevante
- **WHEN** `developer` recibe un change para implementar
- **THEN** ejecuta `mem_search` acotado al change, capacidad o stack afectado, y no vuelca toda la memoria del proyecto

#### Scenario: La lectura no altera el resultado
- **WHEN** la memoria no contiene nada relevante para la tarea
- **THEN** el agente continúa con el flujo normal sin tratar la ausencia de recuerdos como bloqueo

### Requirement: Continuidad en conversaciones largas

Engram MUST almacenar el estado necesario para retomar el trabajo tras una compactación o una sesión larga: intención actual, hilos abiertos, preguntas sin resolver y restricciones expresadas por el usuario. Al retomar, `architect` MUST recuperar ese estado antes de volver a preguntar algo ya tratado.

#### Scenario: Sesión retomada tras compactación
- **WHEN** `architect` retoma una conversación compactada o de varias sesiones
- **THEN** recupera el estado guardado y continúa desde los hilos abiertos, sin re-preguntar lo ya resuelto

#### Scenario: Duda sobre algo ya hablado
- **WHEN** surge una duda sobre un tema que pudo tratarse antes en la conversación
- **THEN** el agente busca primero en Engram y solo pregunta al usuario si la memoria no lo resuelve

#### Scenario: Cierre de una sesión larga sin archivar
- **WHEN** una sesión termina sin archivar un change y quedan hilos abiertos
- **THEN** `architect` guarda un digest del estado actual (intención, hilos abiertos, preguntas pendientes) para la siguiente sesión

### Requirement: Taxonomía mínima de guardado

Los agentes MUST guardar en Engram solo lo que ayuda a continuar el trabajo: estado de conversación, decisiones con su rationale y alternativas descartadas, convenciones no obvias, gotchas, hallazgos recurrentes de review y bloqueos resueltos. Cada guardado MUST incluir contexto suficiente para ser útil sin el historial de la sesión actual.

#### Scenario: Digest de conversación
- **WHEN** la conversación avanza sobre un tema con hilos abiertos
- **THEN** `architect` guarda un digest estructurado (intención, lo acordado, lo pendiente), no una transcripción

#### Scenario: Gotcha de implementación
- **WHEN** `developer` descubre una restricción no documentada que costó tiempo resolver
- **THEN** guarda una memoria con la restricción y la solución aplicada

#### Scenario: Hallazgo recurrente de review
- **WHEN** `code-reviewer` detecta un defecto que ya apareció en revisiones anteriores del proyecto
- **THEN** guarda una memoria con el patrón defectuoso y cómo evitarlo

### Requirement: Lista explícita de no guardado

Los agentes MUST NOT guardar en Engram: transcripciones literales de la conversación, ediciones rutinarias sin decisión asociada, listas de ficheros modificados, el texto de requisitos que ya vive en una spec o en `AGENTS.md`, ni secretos, credenciales o datos personales.

#### Scenario: Cambio rutinario
- **WHEN** `developer` completa una tarea sin decisiones ni descubrimientos nuevos
- **THEN** no escribe ninguna memoria

#### Scenario: Texto de requisito ya especificado
- **WHEN** el contenido a guardar es el enunciado de un requisito que ya está en `openspec/specs/`
- **THEN** el agente no lo duplica y, si aporta contexto de conversación, guarda solo ese contexto

#### Scenario: Intento de guardar un secreto
- **WHEN** el contenido candidato incluye credenciales, tokens o datos personales
- **THEN** el agente no lo guarda y continúa sin registrar el valor

### Requirement: La spec es el registro final

Las decisiones finales y la memoria del proyecto MUST vivir en `openspec/specs/` o en `AGENTS.md`; mientras un change está en curso, su `design.md` cuenta como registro. Un recuerdo de Engram MUST NOT considerarse una decisión tomada: si no está en la spec, en el diseño del change o en `AGENTS.md`, el agente MUST tratarlo como no resuelto y llevarlo allí antes de implementarlo.

#### Scenario: Decisión que solo existe en memoria
- **WHEN** un recuerdo describe una decisión que ninguna spec recoge
- **THEN** el agente no implementa esa decisión; `architect` la lleva a la spec o al diseño del change, confirmándola con el usuario si no está clara

#### Scenario: Conversación no es decisión
- **WHEN** la memoria muestra que un tema se discutió pero no se cerró
- **THEN** el agente lo trata como no decidido y no lo presenta como acordado

#### Scenario: Decisión aprobada
- **WHEN** el usuario aprueba una decisión
- **THEN** `architect` la registra en la spec; Engram puede conservar el rastro de la conversación, pero la spec es la referencia

### Requirement: Precedencia frente a OpenSpec y AGENTS.md

Las specs de OpenSpec y `AGENTS.md` MUST ser la fuente de verdad de requisitos y convenciones. Un recuerdo de Engram MUST NOT prevalecer sobre ellos; si hay conflicto, el agente MUST seguir el artefacto del repo y MUST NOT persistir el recuerdo en conflicto como si fuera vigente.

#### Scenario: Recuerdo obsoleto
- **WHEN** un recuerdo contradice una spec o `AGENTS.md` vigente
- **THEN** el agente sigue la spec o `AGENTS.md` y no persiste la versión obsoleta

#### Scenario: Recuerdo desactualizado detectado
- **WHEN** un recuerdo refleja una decisión que el repo ya revirtió
- **THEN** el agente lo señala al usuario y no lo reutiliza como base de una nueva decisión

### Requirement: Degradación cuando Engram no está disponible

Engram es opcional. Si los tools de memoria (`mem_*`) no están disponibles en la sesión, los agentes MUST continuar el workflow con normalidad, MUST NOT bloquear ni pedir instalar Engram, y como máximo MUST informar una vez que la memoria persistente no está activa.

#### Scenario: Engram no configurado
- **WHEN** un agente se ejecuta en una sesión sin el servidor MCP de Engram
- **THEN** completa su tarea normalmente sin intentar guardar ni leer memoria

#### Scenario: Tools no visibles pero servidor configurado
- **WHEN** el servidor Engram está configurado pero los tools no aparecen directamente en el catálogo del agente
- **THEN** el agente intenta acceder a ellos mediante `execute` en el namespace `engram` y, si falla, continúa sin memoria

### Requirement: Independencia de proveedor, local primero

La política MUST aplicarse igual con modelos locales y con proveedores en la nube: la memoria vive en el cliente OpenCode y en el servidor MCP local de Engram, no en el proveedor del modelo. MUST NOT depender de caché de prompt, ventanas de contexto grandes ni tool calling propietario.

#### Scenario: Sesión larga con modelo local
- **WHEN** se trabaja con un modelo local de ventana de contexto limitada
- **THEN** la sesión continúa recuperando de Engram solo lo necesario, sin intentar mantener todo el historial en la ventana

#### Scenario: Cambio de proveedor a mitad de proyecto
- **WHEN** se pasa de un modelo local a uno en la nube, o al contrario
- **THEN** la memoria y las specs siguen vigentes sin migración ni reconfiguración de la política

#### Scenario: Modelo sin uso fiable de tools
- **WHEN** el modelo no invoca los tools MCP de forma fiable
- **THEN** aplica la degradación, el workflow continúa sin memoria y se informa una vez, sin bloquear

### Requirement: Propiedad por rol

Cada tipo de recuerdo MUST tener un único dueño: `architect` guarda el estado de conversación, las decisiones y las convenciones que adopta de `repo-scout`; `developer` guarda gotchas de implementación; `code-reviewer` guarda patrones de defecto recurrentes. `diff-summarizer` y `repo-scout` MUST NOT escribir memoria.

#### Scenario: Convenciones detectadas por repo-scout
- **WHEN** `repo-scout` reporta convenciones y `architect` las adopta para el diseño
- **THEN** `architect` es quien las guarda; `repo-scout` no escribe nada

#### Scenario: Agentes de solo lectura con Engram configurado
- **WHEN** `repo-scout` o `diff-summarizer` se ejecutan en una sesión con Engram y la instrucción genérica del MCP invita a guardar
- **THEN** no escriben memoria: solo reportan, y `architect` decide qué se guarda

#### Scenario: Cierre de spec
- **WHEN** `architect` archiva un change aprobado
- **THEN** registra un resumen de sesión con lo implementado, los criterios cumplidos y los tradeoffs relevantes
