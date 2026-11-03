# Design

## Context

El flujo actual es: developer → code-reviewer + security-reviewer (paralelo) → verifier → archivo. El code-reviewer valida los 12 criterios de código limpio (AGENTS.md), pero esos mismos criterios ya son responsabilidad del developer al entregar el código.

## Goals / Non-Goals

**Goals:**
- Reducir el tiempo de espera eliminando un revisor del loop normal.
- Mantener la cobertura de seguridad mediante @security-reviewer.
- Mantener @verifier para ejecución real de comandos.
- El developer sigue responsable de código limpio y patrones.

**Non-Goals:**
- Eliminar @security-reviewer ni @verifier.
- Cambiar la responsabilidad del developer sobre código limpio.
- Eliminar fast-architect para cambios triviales.

## Decisions

### D1. Quitar @code-reviewer del flujo normal

Después de @developer, solo se invoca a @security-reviewer. Si solicita cambios, se envía a @developer y se repite hasta que apruebe. Luego se invoca a @verifier.

### D2. Actualizar sección E (archivo)

La sección E requiere solo aprobación de @security-reviewer (y verifier, y openspec validate).

## Risks / Trade-offs

- **Menos especialización en código limpio**: solo el developer aplica los 12 criterios, sin una segunda revisión dedicada. Mitigación: el developer ya es responsable de esto y el spec lo requiere.
- **Un solo punto de revisión de seguridad**: @security-reviewer es el único gate de seguridad. Mitigación: sus 12 criterios son objetivos y verificables.