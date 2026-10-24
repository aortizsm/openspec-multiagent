# Design

## Context

Ver `proposal.md` — Why. Restricciones que condicionan el diseño:

- Los agentes son ficheros markdown en `opencode/agents/`; `scripts/install-agents.mjs` copia cualquier `*.md` al directorio global, sin registro ni lista explícita.
- Los permisos se declaran por agente en el frontmatter y se evalúan por segmento de comando (ver `harden-multiagent-workflow`).
- `code-reviewer.md` ya declara una allowlist larga de comandos de test para varios stacks, pero no de build, lint ni arranque.
- `code-reviewer.md` no consulta Engram; `repo-scout` y `diff-summarizer` tampoco. Los roles de revisión leen spec, diseño y diff.
- El `architect` es el único que archiva y el único que puede devolver trabajo al `developer`.

## Goals / Non-Goals

**Goals:**
- Que exista evidencia ejecutada e independiente antes de archivar.
- Que cada escenario de la spec tenga un veredicto explícito.
- Que el `verifier` funcione en cualquier stack sin código específico del proyecto.

**Non-Goals:**
- Sustituir al `code-reviewer`: la revisión de calidad y la verificación de ejecución son responsabilidades distintas.
- Ejecutar migraciones, despliegues o cualquier comando que mute estado compartido.
- Escribir tests nuevos: si falta cobertura, se reporta `UNVERIFIABLE` y decide el `architect`.
- Medir cobertura numérica ni imponer umbrales.
- Verificar rendimiento o accesibilidad.

## Decisions

### D1. Agente nuevo en lugar de un modo del `code-reviewer`

Se crea `opencode/agents/verifier.md` como subagente independiente.

- **Por qué:** mezclar juicio de revisión con ejecución de comandos diluye ambos. El reviewer debe poder decir "esto está mal aunque los tests pasen"; el verifier debe poder decir "esto pasa aunque no me guste el diseño". Además la allowlist del reviewer es solo de tests y no cubre build ni arranque.
- **Alternativa descartada:** extender `code-reviewer` con un modo `verify` — menos ficheros, pero obliga a ampliar sus permisos a build/arranque, que es exactamente la superficie que hoy mantiene acotada, y hace que un fallo de verificación parezca un juicio de calidad.

### D2. El verifier va después de la aprobación del reviewer

Orden del loop: `developer` → `code-reviewer` → `verifier` → `architect` archiva.

- **Por qué:** la verificación es la comprobación más cara (ejecuta tests, build y arranque). Colocarla al final evita repetirla en cada ronda de cambios solicitados por el reviewer.
- **Coste aceptado:** el reviewer puede aprobar código que no compila. Se mitiga haciendo obligatoria su verificación (D7) y porque el gate de archivo ya no depende de su criterio.
- **Alternativa descartada:** verificar antes de revisar — detecta antes los fallos baratos, pero multiplica ejecuciones si el reviewer pide cambios.

### D3. Allowlist explícita, denegación por defecto

El `verifier` hereda el patrón de `code-reviewer`: `shell: *` denegado, y una lista de comandos de test, build, lint, typecheck y arranque para los stacks habituales (`npm`, `pnpm`, `yarn`, `bun`, `composer`, `phpunit`, `pytest`, `go test`, `cargo`, `dotnet`, `mvn`, `gradle`, `make`, `tsc`, `eslint`, `ruff`, `mypy`).

- **Por qué:** un rol de verificación con `shell: *` puede borrar el repositorio. La lista explícita mantiene la garantía de "solo lectura" que promete la spec.
- **Coste aceptado:** cada stack nuevo exige añadir entradas. Es el mismo coste que ya paga `code-reviewer`.
- **Alternativa descartada:** `shell: *` con la regla "no ejecutes comandos destructivos" en el prompt — confía la seguridad al criterio del modelo, que es justo lo que no queremos.

### D4. Contrato de salida con tres veredictos

`PASS`, `FAIL`, `UNVERIFIABLE`, por escenario, con evidencia y comando.

- **Por qué:** un binario aprobado/rechazado oculta la diferencia entre "no funciona" y "no se pudo comprobar". El `architect` necesita distinguirlas para decidir entre devolver al `developer` o aceptar el riesgo.
- **Alternativa descartada:** solo PASS/FAIL — fuerza a etiquetar como fallo lo que es incertidumbre, o como éxito lo no comprobado.

### D5. Sin acceso a Engram

El `verifier` no lee ni escribe memoria, igual que `code-reviewer`.

- **Por qué:** verifica contra la spec y el código, no contra el hilo de la conversación. Una memoria desactualizada no debe influir en un veredicto.
- **Alternativa descartada:** permitir `mem_search` para conocer "qué se intentó antes" — abre la puerta a justificar fallos con contexto no registrado.

### D6. Sin escritura ni commits

`edit: *` denegado, sin excepciones.

- **Por qué:** si el verifier pudiera corregir, dejaría de ser independiente y el fallo se convertiría en un cambio no revisado.
- **Alternativa descartada:** permitir parches menores — rompe la separación autor/verificador que motiva el change.

### D7. La verificación del `code-reviewer` pasa a obligatoria

Se cambia "optional but recommended" por obligatorio antes de aprobar.

- **Por qué:** mientras el `verifier` no exista o no pueda ejecutar, el reviewer no debe aprobar a ciegas. Es una red de seguridad barata.
- **Alternativa descartada:** dejar el reviewer como está y confiar solo en el verifier — un solo punto de control para todo el flujo.

### D8. Descubrimiento de comandos, no invención

El `verifier` lee `AGENTS.md`, el manifiesto del proyecto o el reporte de `repo-scout` para obtener los comandos.

- **Por qué:** un comando inventado produce falsos negativos y ruido. Si el proyecto no declara cómo se verifica, eso es un hallazgo, no un problema del verifier.
- **Alternativa descartada:** heurísticas por stack ("si hay `pyproject.toml`, asume pytest") — cómodo, pero adivina y falla en proyectos con runners propios.

## Risks / Trade-offs

- **Inflación de `UNVERIFIABLE`** (proyectos sin tests, o spec con escenarios no automatizables) → Mitigación: el veredicto exige justificación y el `architect` decide; no se convierte en bloqueo automático.
- **Coste de ejecución** (tests + build + arranque en cada cierre) → Mitigación: se ejecuta una vez, tras la aprobación del reviewer.
- **Mantenimiento de la allowlist** → Mitigación: mismo patrón que `code-reviewer`; una entrada por stack, no por proyecto.
- **Escenarios ambiguos**: un escenario mal redactado no se puede verificar → Mitigación: `UNVERIFIABLE` señala el escenario concreto y obliga a mejorarlo antes de archivar.
- **Falsa confianza**: un test que pasa no prueba que el escenario se cumpla si está mal escrito → Mitigación: el reporte cita el test concreto y su salida; el reviewer puede impugnar la cobertura.
- **El verifier se salta comandos por comodidad** → Mitigación: la spec exige que un comando no ejecutado se reporte como `UNVERIFIABLE`, nunca como `PASS`.
