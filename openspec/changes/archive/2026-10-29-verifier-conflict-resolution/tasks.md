# Tasks

## 1. Modificar `opencode/agents/verifier.md`

- [x] 1.1 Agregar regla de conflicto en Escalation: desacuerdo entre @verifier y @architect sobre estado de requerimiento se resuelve por @architect con la última palabra.
- [x] 1.2 Especificar que @verifier solo reporta, no decide.

## 2. Revisión y verificación

- [x] 2.1 @code-reviewer revisa el cambio y aprueba.
- [x] 2.2 @security-reviewer revisa el cambio y aprueba.
- [x] 2.3 @verifier verifica el cambio: 4 PASS, 0 FAIL, 0 UNVERIFIABLE.
- [x] 2.4 Commit y push a `main`.

## 3. Archivo OpenSpec

- [ ] 3.1 `openspec sync` para sincronizar specs main.
- [ ] 3.2 `openspec archive verifier-conflict-resolution` para mover a archive.
- [ ] 3.3 `openspec validate --strict` pasa en el spec resultante.
- [ ] 3.4 Entrada en `docs/changes/` y `docs/CHANGELOG.md`.
