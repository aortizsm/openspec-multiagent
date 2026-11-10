# Tasks: loop-performance

## Phase 1: Parallel Execution (3 agents after developer)

- [ ] 1.1 Modificar `isReviewerGroupStart` → `isParallelGroupStart` para detectar `test-engineer`, `code-reviewer`, `security-reviewer` como grupo de 3.
- [ ] 1.2 Modificar `runParallelReviewers` → `runParallelGroup` para ejecutar 3 agentes con `Promise.all`.
- [ ] 1.3 Actualizar `runAgents` para saltar 3 índices cuando detecta el grupo paralelo.
- [ ] 1.4 Actualizar `printUsage` y `AGENTS` array si es necesario para reflejar el nuevo orden.
- [ ] 1.5 Ejecutar `node scripts/orchestrate.mjs --dry-run <cambio-test>` para verificar el plan de ejecución.

## Phase 2: Pre-flight Validation

- [ ] 2.1 Crear función `preFlightValidation(changeName)` en `scripts/orchestrate.mjs`.
- [ ] 2.2 Validar existencia de directorio `openspec/changes/<changeName>/`.
- [ ] 2.3 Validar existencia de `proposal.md`, `design.md`, `tasks.md`.
- [ ] 2.4 Validar existencia de al menos un spec en `specs/*/spec.md`.
- [ ] 2.5 Validar que `design.md` contiene `status`, `executive_summary`, `artifacts`, `risks`, `next_recommended`.
- [ ] 2.6 Llamar `preFlightValidation` al inicio de `main()` antes de ejecutar agentes.
- [ ] 2.7 Probar con un change incompleto para verificar que se detiene con mensaje claro.

## Phase 3: Circuit Breaker

- [ ] 3.1 Agregar contador de reintentos por agente (máximo 3).
- [ ] 3.2 Modificar `runAgent` y `runAgentAsync` para incrementar contador en cada fallo.
- [ ] 3.3 Si contador llega a 3, detener orquestrador con mensaje de escalada al `architect`.
- [ ] 3.4 Resetear contador para cada cambio nuevo.
- [ ] 3.5 Probar con un agente que falle 3 veces para verificar escalada.

## Phase 4: Context Bundle Injection

- [ ] 4.1 Crear función `injectContextBundle(changeName, agent)` en `scripts/orchestrate.mjs`.
- [ ] 4.2 Leer `proposal.md`, `design.md`, `tasks.md`, specs y `git diff` del change.
- [ ] 4.3 Inyectar el contenido como contexto al comando `npx opencode run -a <agent> -- <changeName>` (variable de entorno o archivo temporal).
- [ ] 4.4 Llamar `injectContextBundle` antes de ejecutar cada agente.
- [ ] 4.5 Verificar que cada agente recibe el contexto sin intervención manual del `architect`.

## Phase 5: AGENTS.md Documentation

- [ ] 5.1 Actualizar sección "Orden del loop" en `AGENTS.md` para reflejar `[test-engineer + code-reviewer + security-reviewer]` en paralelo.
- [ ] 5.2 Documentar pre-flight validation, circuit breaker y context bundle en `AGENTS.md`.
- [ ] 5.3 Actualizar checklist de pre-review si es necesario.

## Phase 6: Validation and Archive

- [ ] 6.1 Ejecutar `openspec validate loop-performance --strict`.
- [ ] 6.2 Ejecutar `npm test` para verificar que no hay regresiones.
- [ ] 6.3 Ejecutar `openspec archive loop-performance --yes` (requiere autorización del usuario).
- [ ] 6.4 Verificar `git diff` solo afecta archivos del change.
