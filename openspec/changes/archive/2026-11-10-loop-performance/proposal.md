# Proposal: loop-performance

## Intent
Acelerar el loop multiagente general de OpenSpec para que los cambios fluyan más rápido del developer al archivo, sin sacrificar calidad ni seguridad.

## Why
El flujo actual ejecuta `developer → test-engineer → [code-reviewer + security-reviewer] → verifier → validate → archive` casi todo en serie. `test-engineer` no depende del código del `developer` para escribir tests a partir del spec, pero espera a que termine `developer`. Además, no hay validación temprana del diseño antes de delegar, no hay límite de reintentos por agente, y el contexto de cada agente debe pasarse manualmente. Esto genera idas y vueltas innecesarias y tiempos de ciclo largos.

## What Changes
1. **Paralelismo de 3 agentes después de `developer`:** `test-engineer`, `code-reviewer` y `security-reviewer` ejecutan en paralelo con `Promise.all`.
2. **Pre-flight validation automática:** antes de lanzar cualquier agente, validar que el change existe y que `proposal.md`, `design.md`, `tasks.md` y `specs/` están presentes, y que el diseño contiene los 5 campos obligatorios (`status`, `executive_summary`, `artifacts`, `risks`, `next_recommended`).
3. **Circuit breaker por agente:** máximo 3 reintentos por agente antes de detener y escalar al `architect`.
4. **Context bundle automático:** el orquestrador inyecta automáticamente los archivos relevantes del change (proposal, design, tasks, specs, git diff) al contexto de cada agente.

## Scope
- `scripts/orchestrate.mjs` — modificar `runAgents`, agregar `preFlightValidation`, `circuitBreaker`, `injectContextBundle`.
- `AGENTS.md` — documentar el nuevo orden del loop y los checks previos.
- `openspec/specs/` — no se crean specs nuevos (este cambio afecta al flujo, no a capacidades de producto).

## Out of Scope
- Fast-track para cambios triviales (se trata como cambio separado).
- Cambios a los agentes individuales (`developer`, `code-reviewer`, etc.).
- Cambios a `openspec validate` o `openspec archive` como comandos CLI.

## Success Criteria
- `developer → [test-engineer + code-reviewer + security-reviewer] → verifier → validate → archive` funciona correctamente.
- `preFlightValidation` bloquea la delegación si falta algún campo obligatorio del diseño.
- Cada agente tiene máximo 3 reintentos antes de escalar.
- Cada agente recibe el context bundle automáticamente sin intervención manual del `architect`.
- `openspec validate <change>` y `openspec archive <change>` siguen funcionando al final.

## Dependencies
- Ninguno. Este cambio no depende de otros cambios abiertos.

## Risks
- `test-engineer` y `code-reviewer` ejecutan en paralelo; si ambos intentan escribir en los mismos archivos, podría haber conflictos. Mitigación: `test-engineer` solo escribe archivos de test (`.test.*`), `code-reviewer` solo lee y revisa, no escribe.
- `verifier` depende de que tanto `test-engineer` como los revisores completen antes de ejecutar; si uno falla, `verifier` no se ejecuta.

## Rollback Considerations
- Revertir `scripts/orchestrate.mjs` a la versión secuencial anterior si el paralelismo causa fallos.
- `AGENTS.md` se restaura a la versión previa si el nuevo orden del loop causa confusión.
