# Tasks

## 1. Modificar `opencode/agents/architect.md`

- [ ] 1.1 Cambiar paso 2: invocar solo a @security-reviewer después de @developer (no a ambos en paralelo).
- [ ] 1.2 Cambiar paso 3-4: repetir hasta que solo @security-reviewer apruebe.
- [ ] 1.3 Cambiar paso 5: @verifier después de que @security-reviewer apruebe.
- [ ] 1.4 Cambiar sección E: requerir solo aprobación de @security-reviewer (no de ambos revisores).

## 2. Validación y archivo

- [ ] 2.1 `openspec validate --strict` pasa en el change.
- [ ] 2.2 `openspec archive remove-code-reviewer` para mover a archive.
- [ ] 2.3 Commit y push.
- [ ] 2.4 Sincronizar agentes globales (`node scripts/install-agents.mjs --force`).