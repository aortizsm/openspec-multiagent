# Tasks

## 1. Modificar `opencode/agents/verifier.md`

- [x] 1.1 Agregar a Inputs: leer `proposal.md`, `design.md` y `specs/*/spec.md` para extraer cada funcional requirement (scenarios `WHEN`/`THEN` y design decisions).
- [x] 1.2 Agregar a How to verify: paso para mapear cada requerimiento a código evidencia (git diff si hay git, revisión estática si no), marcando `implementado` / `parcialmente implementado` / `no implementado` con evidencia (`file:line` o `"no encontrado"`).
- [x] 1.3 Agregar a Output contract: sección `## Spec Compliance` con tabla `Requirement | Status | Evidence` entre la tabla de escenarios y el `Summary`.
- [x] 1.4 Agregar a Output contract: línea `Blocking compliance` listando items `no implementado`.
- [x] 1.5 Agregar a Rules: missing/partial implementation reported as finding, never fixed by verifier.

## 2. Revisión y verificación

- [x] 2.1 @code-reviewer revisa el cambio y aprueba.
- [x] 2.2 @security-reviewer revisa el cambio y aprueba.
- [x] 2.3 @verifier verifica el cambio: 4 PASS, 0 FAIL, 0 UNVERIFIABLE.
- [x] 2.4 Commit y push a `main`.

## 3. Archivo OpenSpec

- [ ] 3.1 `openspec sync` para sincronizar specs main.
- [ ] 3.2 `openspec archive verifier-spec-compliance` para mover a archive.
- [ ] 3.3 `openspec validate --strict` pasa en el spec resultante.
- [ ] 3.4 Entrada en `docs/changes/` y `docs/CHANGELOG.md`.
- [ ] 3.5 Actualizar `README.md` con la nueva responsabilidad del verifier.
