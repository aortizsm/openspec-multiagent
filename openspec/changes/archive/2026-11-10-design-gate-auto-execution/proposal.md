# Proposal: design-gate-auto-execution

## Intent
Eliminar vueltas infinitas entre developer y revisores, y reducir aprobaciones manuales del usuario, estableciendo que el diseño debe estar completo y aprobado antes de que el developer escriba código, y que el architect ejecute el resto del loop automáticamente sin preguntas intermedias.

## Why
El flujo actual permite que el developer empiece a escribir código con un diseño incompleto o sin aprobación explícita del usuario. Luego code-reviewer y security-reviewer encuentran problemas en el código escrito, piden cambios, el developer corrige, y el ciclo se repite. Esto genera "vueltas" que frustran al usuario y ralentizan el cierre de cambios. Además, el usuario debe aprobar explícitamente (con `question`) antes de delegar al developer y antes de archivar, lo cual es fricción innecesaria cuando el diseño ya fue revisado.

## What Changes
1. **Design gate en `scripts/orchestrate.mjs`**: Antes de ejecutar `developer`, validar que `proposal.md`, `design.md` y `tasks.md` existen y contienen los campos obligatorios. Si no, detener con mensaje claro.
2. **Modo automático en `AGENTS.md`**: Eliminar el requisito de `question` antes de delegar al developer y antes de archivar. El architect ejecuta el loop completo automáticamente tras una única aprobación del usuario sobre el diseño.
3. **Revisores verifican conformidad al diseño**: `code-reviewer` y `security-reviewer` reciben el diseño aprobado como referencia y solo marcan como CRITICAL lo que se desvíe del diseño aprobado, no problemas nuevos inventados.
4. **Un solo punto de aprobación del usuario**: El usuario aprueba el diseño una sola vez, antes de que cualquier agente escriba código. Después, el architect ejecuta todo automáticamente.

## Scope
- `scripts/orchestrate.mjs` — agregar `designGate()` al inicio de `main()`, modificar lógica de ejecución para modo automático.
- `AGENTS.md` — eliminar requerimiento de `question` antes de implementar y archivar; documentar modo automático y design gate.

## Out of Scope
- Cambios a los agentes individuales (`developer`, `code-reviewer`, etc.) más allá de lo necesario para recibir el diseño como referencia.
- Cambios a `openspec validate` o `openspec archive` como comandos CLI.
- Fast-track para cambios triviales (se trata como cambio separado).

## Success Criteria
- `developer` no se ejecuta hasta que `designGate()` valide que el diseño está completo.
- El usuario aprueba el diseño una sola vez, antes de cualquier ejecución de agente.
- Después de la aprobación del diseño, el architect ejecuta todos los pasos automáticamente sin `question` intermedios.
- `code-reviewer` y `security-reviewer` marcan como CRITICAL solo desviaciones del diseño aprobado.
- `openspec validate <change> --strict` pasa.
- `openspec archive <change> --yes` se ejecuta automáticamente sin aprobación intermedia.

## Dependencies
- Ninguno.

## Risks
- Si el diseño aprobado es incompleto o incorrecto, el developer implementará algo incorrecto. Mitigación: el design gate valida estructura mínima, y el usuario revisa el diseño antes de aprobar.
- Los revisores podrían seguir encontrando problemas de calidad que no son desviaciones del diseño. Mitigación: documentar en AGENTS.md que los revisores se enfocan en conformidad al diseño aprobado.

## Rollback Considerations
- Revertir `scripts/orchestrate.mjs` a la versión previa si el modo automático causa problemas.
- `AGENTS.md` se restaura si el usuario prefiere aprobaciones intermedias.
