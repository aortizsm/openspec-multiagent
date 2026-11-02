# Tasks

## 1. Modificar `opencode/agents/architect.md`

- [ ] 1.1 Cambiar el paso de security review para ejecutar code-reviewer y security-reviewer en paralelo después de @developer.
- [ ] 1.2 Mantener @verifier después de que ambos aprueben.
- [ ] 1.3 Documentar que si cualquiera solicita cambios, ambos deben aprobar antes de continuar.

## 2. Revisión y verificación

- [ ] 2.1 @code-reviewer revisa el cambio y aprueba.
- [ ] 2.2 @security-reviewer revisa el cambio y aprueba.

## 3. Archivo OpenSpec

- [ ] 3.1 `openspec sync` para sincronizar specs main.
- [ ] 3.2 `openspec archive parallel-reviews` para mover a archive.
- [ ] 3.3 `openspec validate --strict` pasa en el spec resultante.
