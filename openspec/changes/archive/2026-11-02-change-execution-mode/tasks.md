# Tasks

## 1. Modificar `opencode/agents/architect.md`

- [ ] 1.1 Agregar sección "Change Execution Mode" con los dos modos disponibles: asistido y automático.
- [ ] 1.2 Especificar que en modo asistido el architect pregunta al usuario antes de cada agente (comportamiento actual).
- [ ] 1.3 Especificar que en modo automático el architect decide internamente y delega automáticamente a developer → code-reviewer → security-reviewer → verifier.
- [ ] 1.4 Especificar que la elección se registra en el `proposal.md` del change como campo `execution-mode`.
- [ ] 1.5 Especificar que el valor por defecto es `asistido`.
- [ ] 1.6 Especificar que la elección es solo por change, nunca global.

## 2. Revisión y verificación

- [ ] 2.1 @code-reviewer revisa el cambio y aprueba.
- [ ] 2.2 @security-reviewer revisa el cambio y aprueba.
- [ ] 2.3 @verifier verifica el cambio.

## 3. Archivo OpenSpec

- [ ] 3.1 `openspec sync` para sincronizar specs main.
- [ ] 3.2 `openspec archive change-execution-mode` para mover a archive.
- [ ] 3.3 `openspec validate --strict` pasa en el spec resultante.
- [ ] 3.4 Entrada en `docs/changes/` y `docs/CHANGELOG.md`.
- [ ] 3.5 Actualizar `README.md` con el nuevo campo de ejecución de cambios.
