# Tasks

## 1. Prompts

- [x] 1.1 En `opencode/agents/code-reviewer.md`, eliminar la sección `Memory (Engram)` completa y sustituirla por una sola línea: no consultar ni escribir Engram, revisar con la spec, el diseño y el diff, y reportar patrones de defecto en el feedback. Verificar que no queda ningún `mem_search`/`mem_save` en el fichero y que no rompe `Feedback rules (strict)`.
- [x] 1.2 En `opencode/agents/developer.md`, verificar que conserva la sección `Memory (Engram)` y añadir una frase: lo durable se escala a `architect` en vez de guardarse como memoria. Verificar que aparece junto a "conversación no es decisión".
- [x] 1.3 En `opencode/agents/architect.md`, verificar que la sección `Memory (Engram)` no menciona `code-reviewer` como lector/escritor; si lo hace, corregirlo. No añadir requisitos nuevos.
- [x] 1.4 Verificar con grep que `developer.md` y `architect.md` contienen `mem_`, y que `code-reviewer.md`, `repo-scout.md` y `diff-summarizer.md` solo lo mencionan en su línea de prohibición.

## 2. Documentación

- [x] 2.1 Actualizar la nota de Engram en `README.md`: la usan `@architect` y `@developer` como memoria de trabajo; `@code-reviewer` no la consulta. Verificar que no queda ninguna frase que atribuya memoria a `@code-reviewer`.
- [x] 2.2 Añadir al README que la recuperación de contexto al compactar la aporta el plugin oficial de Engram (`engram setup opencode`), que no forma parte de este repo.
- [x] 2.3 Añadir al README, en la sección de Engram, la nota operativa: si `mem_save` falla por desajuste de nombre de proyecto, ejecutar `engram init <proyecto>` en la raíz del repo.

## 3. Verificación

- [x] 3.1 Ejecutar `npm test` y `node scripts/check.mjs` sin pipe y confirmar que pasan.
- [x] 3.2 Ejecutar `openspec validate allow-memory-for-developer --strict` y confirmar que la delta es válida (tres `MODIFIED` con todos sus escenarios previos).
- [ ] 3.3 Checklist manual: en una sesión real, `developer` guarda un gotcha y lo recupera con `mem_search`; `code-reviewer` no consulta memoria; `architect` archiva un change y deja resumen de sesión.
