# test-first-for-observable-behavior

## Contexto

Las instrucciones de `@developer` pedían pruebas de alto valor sin indicar que debían preceder a la implementación. La fase posterior de `@test-engineer` también podía duplicar cobertura ya escrita por el developer. La documentación existente resumía los roles, pero no describía el flujo completo ni los límites de los nueve agentes mantenidos en el repositorio.

## Qué cambió

- `@developer` escribe o actualiza primero una prueba determinista, de caja negra y de alto valor para comportamiento observable cuando sea práctica, observa el fallo esperado e implementa hasta que pase. Si no aplica una prueba significativa, explica por qué en el informe de finalización y ejecuta las comprobaciones pertinentes.
- `@test-engineer` inspecciona y reutiliza la cobertura adecuada después de la implementación, y añade solo pruebas útiles para escenarios o casos límite que falten; su posición antes de las revisiones paralelas no cambia.
- Se añadió `docs/guides/agent-workflow.md` en inglés, a solicitud explícita del usuario, con las fases, activadores, responsabilidades, salidas y límites de los nueve agentes.
- Las specs principales `openspec/specs/multiagent-workflow/spec.md` y `openspec/specs/project-documentation/spec.md` se tradujeron completamente al inglés en sus rutas existentes, preservando sus requisitos y escenarios; la delta de idioma usa los encabezados ingleses correspondientes.
- README y las guías enlazan el nuevo documento; `docs/README.md` aclara que el español sigue siendo el idioma predeterminado y que puede solicitarse otro idioma para un documento individual.

## Por qué

Una prueba de comportamiento previa hace visible la ausencia del comportamiento antes de implementarlo, sin forzar pruebas deterministas donde no exista una expectativa comprobable. La inspección previa de cobertura evita duplicar pruebas y mantiene intacto el pipeline aprobado.

## Cómo se usa

Para cambios de comportamiento observables, `@developer` determina si existe una prueba de caja negra práctica y de alto valor; cuando existe, sigue el ciclo RED/GREEN antes de completar la implementación. Para documentación, prompts u otros cambios sin una prueba determinista significativa, registra el motivo en su informe y ejecuta los checks aplicables. Después, `@test-engineer` completa únicamente los huecos de cobertura antes de las revisiones paralelas. La secuencia completa y los límites por agente se describen en [`docs/guides/agent-workflow.md`](../guides/agent-workflow.md).

## Impacto / Migración

No hay cambios de runtime, orquestador, dependencias ni harness de pruebas. No se requiere migración. Las dos specs principales ahora están en inglés en sus mismas rutas. La única excepción de idioma en `docs/` es la guía individual solicitada en inglés; el resto de `docs/` continúa en español por defecto.

## Evidencia

- `npm test`: pasó; `tests/run.mjs` reportó 60 pruebas y `tests/lib.test.mjs` reportó 38, sin fallos. El aviso del fixture temporal que comprueba la falta de `specs/` y el error esperado de configuración JSONC aparecieron en sus pruebas y no causaron fallos.
- `openspec validate test-first-for-observable-behavior --strict`: válido; `openspec validate --specs`: 22 elementos válidos, 0 fallos; `openspec validate --all`: 23 elementos válidos, 0 fallos.
- Las specs traducidas mantienen 15 requisitos y 35 escenarios para `multiagent-workflow`, y 6 requisitos para `project-documentation`; esta última incluye sus 12 escenarios preexistentes y el escenario aprobado de idioma alternativo. Los cuatro encabezados de idioma de su delta coinciden exactamente con los de la spec principal.
- `git diff --check`: sin errores.
- No se añadieron pruebas automatizadas de texto de prompts: no verificarían comportamiento de runtime y crearían una dependencia frágil del wording. En la verificación independiente del candidato previo a esta corrección documental, `@verifier` reportó 8 PASS, 0 FAIL y 0 UNVERIFIABLE.
