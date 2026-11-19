# architect-question-menu

## Contexto

El prompt de `opencode/agents/architect.md` (ambas ocurrencias del fichero mal fusionado) obliga a las preguntas de discovery a hacerse en conversación natural con listas numeradas y reserva el `question` tool solo para aprobaciones. Eso contradice `AGENTS.md` y la capacidad `agent-menu-instructions`, que ya establecen el menú de selección como canal de decisión del usuario. Los subagentes ya reportan las preguntas al `@architect`, pero el prompt del architect no los ampara para preguntar por menú.

El usuario decidió: cualquier pregunta al usuario, de cualquier agente, se hace con el menú de preguntas de OpenCode, con opciones y con alternativa de respuesta libre, sin excepción por tipo de pregunta.

## Qué cambió

- Se sustituyó el bullet `**Discovery questions**` de `opencode/agents/architect.md` (ambas ocurrencias) por la regla del menú: cada pregunta al usuario, incluida la abierta, se pregunta con el `question` tool en una sola llamada, nunca como lista numerada en el chat, y el menú nunca limita la respuesta. La regla aclara que no añade aprobaciones intermedias al loop.
- `.opencode/agents/architect.md` quedó byte-idéntico a la fuente (lo exige un test).
- Se añadió la sección `## Preguntas al usuario` en `AGENTS.md`: toda pregunta se hace con el menú, los subagentes la reportan al architect, y no cambia la frecuencia (una aprobación del diseño, sin aprobaciones intermedias).
- No se tocó ninguno de los ocho ficheros de subagente (ya llevan la nota de delegación ni se puede modificar su capacidad). No se borró ni reescribió la segunda copia parcial del prompt ni el bloque YAML muerto de `architect.md` (el dedupe es otro change).
- Se añadió un grupo de contrato en `tests/run.mjs` que lee ambos prompts y verifica: la regla del menú está presente, la instrucción antigua desapareció (`NOT the `question` tool`, `List questions with numbered items`), y la regla no añade aprobaciones intermedias.
- Se alineó `docs/guides/agent-workflow.md` (fila del `@architect`).
- Se enviaron los dos deltas de capability: `multiagent-workflow` (las preguntas materiales del discovery se preguntan por el menú en una sola llamada, con dos escenarios nuevos) y `agent-menu-instructions` (requisito "Toda pregunta al usuario usa el menú de selección", con cinco escenarios).
- Se actualizó `docs/CHANGELOG.md`.

## Por qué

El menú siempre ofrece respuesta libre junto a las opciones, así que no restringe lo que el usuario puede responder; unificar el canal elimina las listas numeradas que el prompt anterior obligaba y evita que cada agente elija su propia vía de preguntar.

## Cómo se usa

Cuando un agente necesite una decisión, aclaración o confirmación del usuario, usa `question` con opciones, preguntas de una ronda en una sola llamada, y acepta también la respuesta libre del menú. Los subagentes no invocan la herramienta: se la reportan al `@architect`. Esto aplica a la aprobación final del diseño y a cualquier otra pregunta; no añade aprobaciones intermedias al loop.

## Impacto / Migración

- `opencode/agents/architect.md`: bullet de preguntas reemplazado en ambas ocurrencias.
- `.opencode/agents/architect.md`: sincronizado byte-idéntico a la fuente.
- `AGENTS.md`: sección `## Preguntas al usuario` nueva.
- `docs/guides/agent-workflow.md`, `docs/changes/2026-11-19-architect-question-menu.md`, `docs/CHANGELOG.md`.
- `tests/run.mjs`: regresión de contrato sobre ambos prompts.
- No hay código de runtime, no hay nuevas dependencias, no hay cambios de permiso. La regla entra en vigor inmediatamente en este repo (OpenCode lee la definición local). En los demás proyectos del usuario aplica cuando se reinstalan los agentes con `node scripts/install-agents.mjs --force` (o `npm run reinstall`); sin `--force`, `install-agents.mjs` salta los ficheros existentes y el cambio no llega a otros proyectos.

## Evidencia

- `grep` de `NOT the \`question\` tool` y de `List questions with numbered items` da 0 en ambos prompts.
- `diff opencode/agents/architect.md .opencode/agents/architect.md` no reporta diferencias (byte-idénticos).
- La nueva regresión de `tests/run.mjs` falla con el prompt previo y pasa tras el cambio.
- `npm test`, `npm run check`, `openspec validate architect-question-menu --strict` y `git diff --check` finalizan correctamente.
