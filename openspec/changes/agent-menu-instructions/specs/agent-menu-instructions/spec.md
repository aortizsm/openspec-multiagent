# agent-menu-instructions Specification

## Purpose

Documentar en cada archivo de agente que las decisiones de usuario deben delegarse al @architect, quien usará el menú de selección de OpenCode (question tool con opciones) para obtener respuestas.

## ADDED Requirements

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
