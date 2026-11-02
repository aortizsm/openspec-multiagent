# readme-agent-documentation Specification

## Purpose
Agrega al README.md una sección que documente cada agente existente en opencode/agents/ con sus responsabilidades, acceso permitido y acceso denegado.

## Requirements

### Requirement: Lista de agentes en README

El `README.md` MUST incluir una sección que liste cada agente en `opencode/agents/`.

#### Scenario: Sección de agentes presente
- **WHEN** el usuario lee `README.md`
- **THEN** existe una sección que documenta a los agentes del proyecto

### Requirement: Información por agente

Cada agente documentado MUST incluir: nombre, responsabilidades, acceso permitido, acceso denegado, modo de operación.

#### Scenario: Campos por agente
- **WHEN** el usuario consulta un agente en el README
- **THEN** ve el nombre del agente
- **THEN** ve sus responsabilidades
- **THEN** ve qué tiene acceso (puede hacer)
- **THEN** ve qué no tiene acceso (no puede hacer)
- **THEN** ve su modo de operación (subagent / primary)

### Requirement: Todos los agentes documentados

El README MUST documentar todos los agentes existentes en `opencode/agents/`.

#### Scenario: Cobertura completa de agentes
- **WHEN** el usuario revisa el README
- **THEN** cada archivo en `opencode/agents/` tiene una entrada correspondiente

### Requirement: No modificación de archivos de agente

El change MUST NO modificar los archivos en `opencode/agents/*.md`.

#### Scenario: Archivos de agente sin cambios
- **WHEN** se compara el diff del change
- **THEN** ningún archivo en `opencode/agents/` está modificado
