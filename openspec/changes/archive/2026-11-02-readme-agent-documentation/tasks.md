# Tasks

## 1. Modificar `README.md`

- [ ] 1.1 Leer todos los archivos en `opencode/agents/` para extraer nombre, descripción, responsabilidades, permisos y modo de cada agente
- [ ] 1.2 Agregar sección "Agents" al `README.md` con tabla o lista estructurada
- [ ] 1.3 Para cada agente incluir: nombre, responsabilidades, acceso permitido, acceso denegado, modo de operación
- [ ] 1.4 Mantener el README en inglés, sin diagramas Mermaid
- [ ] 1.5 Verificar que el README renderice correctamente (markdown válido)

## 2. Revisión y verificación

- [ ] 2.1 @code-reviewer revisa el cambio y aprueba.
- [ ] 2.2 @security-reviewer revisa el cambio y aprueba.
- [ ] 2.3 @verifier verifica el cambio.

## 3. Archivo OpenSpec

- [ ] 3.1 `opensync sync` para sincronizar specs main.
- [ ] 3.2 `openspec archive readme-agent-documentation` para mover a archive.
- [ ] 3.3 `openspec validate --strict` pasa en el spec resultante.
- [ ] 3.4 Entrada en `docs/changes/` y `docs/CHANGELOG.md`.
- [ ] 3.5 Actualizar `README.md` (ya incluido en la tarea 1).
