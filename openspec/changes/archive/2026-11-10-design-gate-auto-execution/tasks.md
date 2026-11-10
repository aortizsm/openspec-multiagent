# Tasks: design-gate-auto-execution

## Phase 1: Design Gate

- [ ] 1.1 Crear función `designGate(changeName)` en `scripts/orchestrate.mjs`.
- [ ] 1.2 Validar existencia de directorio `openspec/changes/<changeName>/`.
- [ ] 1.3 Validar existencia de `proposal.md`, `design.md`, `tasks.md`.
- [ ] 1.4 Validar existencia de al menos un spec en `specs/*/spec.md` (salvo `skip_specs: true`).
- [ ] 1.5 Validar que `design.md` contiene `status`, `executive_summary`, `artifacts`, `risks`, `next_recommended`.
- [ ] 1.6 Validar que `proposal.md` contiene `## Intent`, `## Why`, `## What Changes`.
- [ ] 1.7 Llamar `designGate()` al inicio de `main()` antes de ejecutar cualquier agente.
- [ ] 1.8 Probar con un change incompleto para verificar que se detiene con mensaje claro.

## Phase 2: Modo Automático en AGENTS.md

- [ ] 2.1 Eliminar requisito de `question` antes de delegar al developer en `AGENTS.md`.
- [ ] 2.2 Eliminar requisito de `question` antes de archivar en `AGENTS.md`.
- [ ] 2.3 Documentar que el architect ejecuta el loop completo automáticamente tras una sola aprobación del usuario sobre el diseño.
- [ ] 2.4 Documentar que si algo falla, el architect detiene y notifica con evidencia, sin pedir aprobación para reintentar.

## Phase 3: Revisores verifican conformidad al diseño

- [ ] 3.1 Documentar en `AGENTS.md` que `code-reviewer` recibe `design.md` y `proposal.md` como referencia.
- [ ] 3.2 Documentar que `code-reviewer` marca como CRITICAL solo desviaciones del diseño aprobado o bugs claros.
- [ ] 3.3 Documentar que problemas de calidad no cubiertos por el diseño son SUGGESTION, no CRITICAL.

## Phase 4: Validación y Archive

- [ ] 4.1 Ejecutar `openspec validate design-gate-auto-execution --strict`.
- [ ] 4.2 Ejecutar `npm test` para verificar que no hay regresiones.
- [ ] 4.3 Ejecutar `openspec archive design-gate-auto-execution --yes` (requiere autorización del usuario).
- [ ] 4.4 Verificar `git diff` solo afecta archivos del change (`scripts/orchestrate.mjs`, `AGENTS.md`).
