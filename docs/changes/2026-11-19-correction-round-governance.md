# correction-round-governance

## Contexto

El tope de rondas de corrección estaba escrito como tres reglas contradictorias, ninguna implementada: la prosa del architect y `AGENTS.md` decían "como máximo tres rondas"; la spec decía que el allowance se resuelve por change con default **una** intento; y otra regla decía "**at most one** attempt". `correction_rounds` no aparecía en `scripts/` ni en `tests/`. Dos cambios de este lote se bloquearon con hallazgos cosméticos abiertos, y el ciclo real era el del architect con un número que venía solo de la prosa.

## Qué cambió

- Solo consumen ronda y bloquean el archivo los hallazgos que bloquean la aceptación: `CRITICAL`, o un `WARNING` ligado a un criterio o escenario. Un `SUGGESTION`, una corrección de documentación o del ledger, o un asunto preexistente fuera de alcance se registra con su disposición y **no** consume ronda ni bloquea.
- No-convergencia para y escala: un hallazgo resuelto reabierto sin evidencia nueva, o un desacuerdo developer/revisor sobre el mismo hallazgo, detiene el ciclo y presenta el ledger al usuario, tenga o no rondas disponibles. `@verifier` reportando `FAIL` es un hallazgo bloqueante: no se archiva.
- Re-verificación proporcional: una corrección que no cambia comportamiento (comentarios, documentación, evidencia del ledger) la confirma el agente origen y se re-ejecuten las comprobaciones afectadas, sin repetir la secuencia completa. Una corrección que cambia comportamiento, pruebas o specs reinicia la secuencia completa.
- Un allowance declarado por change en `.openspec.yaml` (`correction_rounds`, también `x-correction_rounds`), consumido por el ciclo del architect, default **tres**, y falla cerrado si no es un entero positivo.
- Alineados todos los sitios que citaban el tope antiguo: `opencode/agents/architect.md` y su espejo `.opencode/agents/architect.md` (byte-idéntico), `AGENTS.md`, `docs/guides/agent-workflow.md` (dos sitios) y `docs/guides/independent-verification.md` (dos sitios).
- Añadida regresión de contrato en `tests/run.mjs` que lee las cuatro fuentes y afirma la regla nueva, la salida del wording retirado y la distinción con el límite de reintentos del orquestador (`MAX_RETRIES = 3`, reintentos por caída de agente, que no se toca).

## Por qué

Había tres números en vigor a la vez: tres rondas en la prosa, una intento por allowance del orchestrator y un único intento en la spec. Ninguno se aplicaba en código y la contabilidad de rondas no diferenciaba riesgo, por lo que hallazgos cosméticos bloqueaban cambios y obligaban al usuario a autorizar rondas a mano. La nueva regla hace que el allowance sea una contabilidad de correcciones de aceptación, no un contador ciego, y añade una parada temprana por no-convergencia que es más protectora que un tope fijo.

## Cómo se usa

El allowance se declara en `openspec/changes/<nombre>/.openspec.yaml` con la clave `correction_rounds` (o `x-correction_rounds`). Si falta, se aplica el default de tres. Un valor que no sea un entero positivo falla cerrado antes de que ejecute cualquier agente. La corrección se instala en este repo inmediatamente porque OpenCode lee la definición local; para los demás proyectos del usuario aplica al reinstalar los agentes con `node scripts/install-agents.mjs --force`.

## Impacto / Migración

- `opencode/agents/architect.md`: párrafo de aprobación (1.1) y dos frases del bucle de revisión (1.2) reescritas con la regla nueva.
- `.opencode/agents/architect.md`: sincronizado byte-idéntico a la fuente (verificado con `diff`).
- `AGENTS.md`: párrafo de rondas reescrito en español, conservando "No se omite ni debilita ningún gate".
- `docs/guides/agent-workflow.md`: dos sitios alineados (línea ~15 y ~47).
- `docs/guides/independent-verification.md`: dos sitios alineados (línea ~27 y ~85).
- `tests/run.mjs`: seis pruebas de contrato nuevas sobre las cuatro fuentes.
- `docs/changes/2026-11-19-correction-round-governance.md` y `docs/CHANGELOG.md`.
- No hay código de runtime, no hay nuevas dependencias, no se toca `MAX_RETRIES` ni `.opencode/opencode.jsonc`, ni los 8 ficheros de subagente.

## Evidencia

- `diff opencode/agents/architect.md .opencode/agents/architect.md` vacío (byte-idénticos).
- `git diff --check` sin errores.
- `npm test`: 104 passed, 0 failed (suite principal).
- `npm run check`: exit 0.
- `openspec validate correction-round-governance --strict`: exit 0.
- Los términos retirados (`maximum of three`, `after three correction rounds`, `at most one correction attempt`, `como máximo tres`, `at most three correction rounds`) dan 0 coincidencias en los ficheros tocados.
- `MAX_RETRIES = 3` intacto; distinción consignada en el prompt y en la prueba de contrato.
