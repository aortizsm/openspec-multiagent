# agent-menu-instructions Specification

## Purpose
Definir que toda pregunta al usuario, de cualquier agente, se hace con el menú de selección de OpenCode: el `@architect` la presenta directamente y los subagentes la reportan al `@architect`, que la pregunta. La regla cubre el canal y la cadencia de las preguntas —una sola llamada por ronda— y prevalece sobre cualquier guía de skill o comando acerca de cómo o cuándo preguntar.

## Requirements

### Requirement: Nota de delegación de decisiones en cada agente

Cada archivo de agente en `opencode/agents/` MUST incluir una nota explicando que cuando necesiten una decisión o aprobación del usuario, deben reportarla al `@architect`, quien usará el menú de selección de OpenCode.

#### Scenario: Nota presente en cada agente
- **WHEN** el usuario lee cualquier archivo en `opencode/agents/*.md`
- **THEN** existe una nota que indica que las decisiones de usuario se delegan al architect
- **THEN** la nota menciona que el architect usará el menú de selección de OpenCode

### Requirement: No cambio de permisos

El change MUST NO modificar los permisos ni capacidades de ningún agente.

#### Scenario: Permisos sin cambios
- **WHEN** se compara el diff del change
- **THEN** ningún archivo de agente tiene cambios en su sección de permissions

### Requirement: Toda pregunta al usuario usa el menú de selección

Cuando un agente necesita una decisión, aclaración o confirmación del usuario, MUST usar el menú de selección de OpenCode (`question` tool con opciones). El `@architect` lo pregunta directamente y los subagentes lo reportan al `@architect` para que este lo pregunte. Ningún agente MUST presentar una pregunta al usuario como texto numerado en el chat.

#### Scenario: El architect pregunta por el menú

- **WHEN** el architect necesita una decisión, una aclaración o una confirmación del usuario
- **THEN** la presenta con el menú de selección, con opciones cuando existan y con la posibilidad de respuesta libre que el menú ofrece siempre

#### Scenario: Un subagente necesita preguntar

- **WHEN** un subagente necesita una decisión del usuario
- **THEN** la reporta al `@architect`, que la presenta en el menú de selección, porque el subagente no puede invocar la herramienta

#### Scenario: El menú no limita la respuesta

- **WHEN** el usuario quiere responder algo que no figura entre las opciones ofrecidas
- **THEN** escribe su propia respuesta desde el mismo menú

#### Scenario: Sin preguntas como texto numerado

- **WHEN** un agente necesita una aclaración abierta para la que no puede proponer opciones
- **THEN** la pide igualmente por el menú de selección y no la sustituye por una lista numerada en el chat

#### Scenario: Los informes no son preguntas

- **WHEN** el architect presenta un diseño, un resumen o un informe de estado
- **THEN** puede hacerlo en prosa, porque la regla cubre las preguntas al usuario y no la información
