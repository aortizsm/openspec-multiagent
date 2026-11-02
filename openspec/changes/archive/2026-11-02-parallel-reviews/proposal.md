# Proposal

## Why

El flujo actual del @architect ejecuta code-reviewer y security-reviewer de forma secuencial: primero espera a que code-reviewer apruebe, luego invoca a security-reviewer. Ambos son independientes (uno revisa clean code/tests, el otro revisa seguridad), así que se puede ahorrar un paso completo de espera ejecutándolos en paralelo.

## What Changes

- **Paralelizar code-reviewer y security-reviewer**: después de que @developer completa, invocar a ambos agentes en paralelo. Esperar a que ambos aprueben antes de continuar.
- **Mantener @verifier después**: la verificación independiente de escenarios de la spec sigue ocurriendo después de que ambas revisiones aprueben.
- **Archivo afectado**: `opencode/agents/architect.md` — sección D) Implementation and review loop, paso de security review.

## Capabilities

### New Capabilities

- Ninguna.

### Modified Capabilities

- `parallel-reviews`: el architect ejecuta code-reviewer y security-reviewer en paralelo en lugar de secuencialmente.

## Impact

- `opencode/agents/architect.md`: modificar el paso de security review para ejecutar code-reviewer y security-reviewer en paralelo.
- Sin cambios en otros agentes.
- Sin dependencias nuevas.
