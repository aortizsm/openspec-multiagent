# Design

## Context

El flujo actual del @architect es secuencial: developer → code-reviewer → security-reviewer → verifier → archivo. Code-reviewer y security-reviewer son independientes: uno revisa criterios de código limpio y tests, el otro revisa criterios de seguridad. No hay dependencia entre ellos.

## Goals / Non-Goals

**Goals:**
- Reducir el tiempo de espera entre revisiones ejecutando code-reviewer y security-reviewer en paralelo.
- Mantener la misma cobertura de revisión: ambos criterios (clean code + seguridad) siguen aplicándose completamente.
- Mantener @verifier como paso independiente después de que ambas revisiones aprueben.

**Non-Goals:**
- Eliminar cualquier revisión. Todos los criterios siguen aplicándose.
- Cambiar el rol de @verifier.
- Cambiar el rol de @developer.

## Decisions

### D1. Ejecutar code-reviewer y security-reviewer en paralelo

Después de que @developer completa, el architect invoca a ambos agentes simultáneamente. Espera a que ambos reporten aprobación o change requests antes de continuar.

### D2. Si alguno solicita cambios

Si cualquiera de los dos (code-reviewer o security-reviewer) solicita cambios, el architect los envía a @developer y repite el ciclo. Ambos deben aprobar antes de continuar al verifier.

### D3. @verifier después de ambas aprobaciones

@verifier se invoca solo después de que code-reviewer y security-reviewer hayan aprobado.

### D4. Especificación en español

La documentación del change está en español, como convención del proyecto.

## Risks / Trade-offs

- **Conflictos entre revisiones**: es posible que code-reviewer y security-reviewer pidan cambios contradictorios. Mitigación: el architect evalúa ambos y toma la decisión final.
- **Carga doble al developer**: si ambos piden cambios diferentes, el developer debe atender ambos. Mitigación: es el mismo esfuerzo que secuencial, solo que en una ronda en lugar de dos.
