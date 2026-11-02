# Proposal

## Why

Cuando se crea un nuevo change OpenSpec, no hay forma de elegir cómo se ejecutará el desarrollo tras la aprobación del spec. El flujo actual es siempre asistido: el architect pregunta al usuario ante cada duda y espera aprobación antes de delegar a cada agente (developer, code-reviewer, security-reviewer, verifier). No existe un modo automático donde el architect decida por sí mismo y envíe a cada agente sin interrupciones.

## What Changes

- **Nueva opción al crear un change**: al definir el spec, el usuario elige entre dos modos de ejecución:
  - **Asistido** (comportamiento actual): el architect consulta al usuario sus dudas antes de pasar a cada agente (developer, code-reviewer, security-reviewer, verifier), con el objetivo de mejorar la calidad del producto y reducir errores. Espera aprobación explícita del usuario en cada transición.
  - **Automático**: el architect decide internamente la mejor opción cuando hay duda, y envía automáticamente a cada agente en secuencia (developer → code-reviewer → security-reviewer → verifier) sin pedir aprobación intermedia al usuario.
  - **Campo `execution-mode`**: el `proposal.md` del change declara el campo `execution-mode` con valores `asistido` o `automatico`. Valor por defecto: `asistido`. Aplica solo al change actual, nunca globalmente.
- **Alcance por change**: la decisión se registra en el `proposal.md` o `design.md` del change específico. Nunca es una configuración global.
- **Archivo afectado**: `opencode/agents/architect.md` se extiende con la lógica de decisión de modo de ejecución.

## Capabilities

### New Capabilities

- `change-execution-mode`: rol del architect para decidir el modo de ejecución (asistido / automatico) de un change OpenSpec.

### Modified Capabilities

- Ninguna.

## Impact

- `opencode/agents/architect.md`: se agregan secciones sobre modo de ejecución del change, los dos modos disponibles, y que el architect decide internamente en modo automático.
- `openspec/changes/<change>/proposal.md`: se agrega campo `execution-mode` (asistido / automatico).
- Sin cambios en otros agentes.
- Sin dependencias nuevas.
