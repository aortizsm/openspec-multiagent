# Tasks

## 1. Modificar `opencode/agents/developer.md`

- [ ] 1.1 Agregar sección "Design Pattern Decision" con la responsabilidad de decidir el patrón de diseño al implementar.
- [ ] 1.2 Especificar qué debe documentar: nombre del patrón, por qué, dónde se aplica (archivo:líneas).
- [ ] 1.3 Especificar que la decisión se reporta en el completion report y/o como comentario en el código.
- [ ] 1.4 Especificar que el architect no interviene en esta decisión táctica.
- [ ] 1.5 Especificar que no se recomienda el patrón al usuario.

## 2. Revisión y verificación

- [ ] 2.1 @code-reviewer revisa el cambio y aprueba.
- [ ] 2.2 @security-reviewer revisa el cambio y aprueba.
- [ ] 2.3 @verifier verifica el cambio.

## 3. Archivo OpenSpec

- [ ] 3.1 `openspec sync` para sincronizar specs main.
- [ ] 3.2 `openspec archive developer-design-pattern-decision` para mover a archive.
- [ ] 3.3 `openspec validate --strict` pasa en el spec resultante.
- [ ] 3.4 Entrada en `docs/changes/` y `docs/CHANGELOG.md`.
- [ ] 3.5 Actualizar `README.md` con la nueva responsabilidad del developer.
