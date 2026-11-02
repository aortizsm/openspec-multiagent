# Proposal

## Why

El `README.md` del proyecto no explica claramente qué agentes existen en `opencode/agents/`, cuáles son sus responsabilidades, qué pueden hacer y qué no tienen acceso. Esto dificulta que los usuarios sepan a qué agente pedir ayuda o qué esperar de cada uno.

## What Changes

- **Agregar sección de agentes al `README.md`**: una tabla o lista que documente cada agente en `opencode/agents/` con:
  - Nombre del agente
  - Descripción / responsabilidades
  - Qué tiene acceso (puede hacer)
  - Qué no tiene acceso (no puede hacer)
  - Modo de operación (subagent / primary)
- **Mantener el README en inglés** (convención existente para archivos en la raíz del repo)
- **No agregar diagramas Mermaid** (convención de simplicidad)
- **Sin cambios en los archivos de agente** (`opencode/agents/*.md`) — solo documentación en README

## Scope

- `README.md` (agregar sección de agentes)

## Success Criteria

- README incluye una sección clara que lista todos los agentes de `opencode/agents/`
- Cada agente tiene: nombre, responsabilidades, acceso permitido, acceso denegado, modo
- No se modifican archivos de agente existentes
- El README sigue en inglés
