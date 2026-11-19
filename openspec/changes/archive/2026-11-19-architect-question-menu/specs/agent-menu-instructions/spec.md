# Spec Delta

## ADDED Requirements

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
