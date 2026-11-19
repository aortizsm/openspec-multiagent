# rebase-multiagent-workflow

## Contexto

La spec `multiagent-workflow` contenía 12 requisitos que describían un "modo automático" de orquestación que nunca se implementó. Además, el requisito "Single correction attempt for future changes" contradijo el cambio `correction-round-governance` que estableció un allowance de correcciones por change (default 3 rondas) consumido solo por hallazgos que bloquean la aceptación.

Este change sincroniza el spec con la realidad del código: elimina los 12 requisitos fantasma, actualiza `Correction allowance is declared per change` al texto del change `correction-round-governance`, y promueve los 3 requisitos ya implementados de ese cambio (ronda de corrección consume solo hallazgos obligatorios, paro por no-convergencia, verificación proporcional).

## Qué cambió

- Se eliminaron 12 requisitos de `multiagent-workflow` que describían un modo automático de orquestación que nunca existió (7 requisitos "Automatic ...", "Single correction attempt for future changes", "Structured outcomes gate automatic orchestration", "Orchestration integration audit before approval", "Review content is treated as untrusted data", "Review ledger input is bounded").
- Se actualizó `Correction allowance is declared per change` para que coincida con el change `correction-round-governance`: allowance declarado por change en `.openspec.yaml`, default 3 rondas, falla cerrado si el valor no es entero positivo.
- Se añadieron 3 requisitos del change `correction-round-governance` al spec principal: "Round consumption follows acceptance", "Correction cycle stops on non-convergence", "Re-verification is proportional to the correction".

## Por qué

La especificación `multiagent-workflow` describía un modo de orquestación automática que nunca se implementó. El ciclo real es liderado por el `@architect`, con un allowance de correcciones por change declarado en `.openspec.yaml`. Mantener requisitos que no se implementan generaba confusión y era inconsistente con el comportamiento real del toolkit.

## Cómo se usa

No hay cambio de comportamiento para el usuario. El arquitecto sigue operando igual: una aprobación de diseño, desarrollo, pruebas, revisiones paralelas, verificación independiente y archivo. La diferencia es que la especificación ahora describe exactamente lo que el sistema hace.

## Impacto / Migración

- Impacto observable: ninguno. Es una corrección de documentación de specs.
- No hay migración de datos ni de runtime. Los permisos y el prompt ya estaban actualizados desde cambios anteriores.
- La entrada de documentación y el cambio de spec son necesarios para mantener la consistencia entre lo que el toolkit hace y lo que la especificación dice.

## Evidencia

- `openspec validate rebase-multiagent-workflow --strict` pasa
- `npm test` pasa (107 + 39 + 49, 0 failed)
- `npm run check` pasa (status: READY)
- `git diff --check` pasa

## Referencias

- `openspec/changes/correction-round-governance/proposal.md` — intención y alcance del change de gobernanza de rondas.
- `openspec/changes/correction-round-governance/specs/multiagent-workflow/spec.md` — spec delta con los 3 requisitos nuevos.
- `docs/CHANGELOG.md` — entrada de cambio anterior con los detalles de `correction-round-governance`.