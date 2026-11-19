# architect-prompt-dedupe

## Contexto

`opencode/agents/architect.md` tenía 714 líneas y era la concatenación de dos versiones del mismo prompt. Seis aparecían dos veces (`A) Preflight`, `B) Project awareness`, `C) Discovery and alignment`, `## Aprobación del diseño y ejecución del change`, `## Memory (Engram)` y `## OpenSpec Guidance`), además de una copia muerta del bloque `permissions:` del frontmatter en el cuerpo y un delimitador `---` suelto que partía el fichero. Cada copia también guardaba secciones únicas que la otra no tenía.

## Qué cambió

- Se consolidó `opencode/agents/architect.md` en una sola definición: frontmatter → `## Read-only Database Reviews` → `A) Preflight` → `B) Project awareness` → `## Aprobación del diseño y ejecución del change` → `C) Discovery and alignment` → `## Memory (Engram)` → `## OpenSpec Guidance` → `D) Subagent delegation — pass full context` → `E) Implementation and review loop` → `F) Close the spec (archive)`, cada encabezado exactamente una vez.
- Se borró el bloque muerto de `permissions:` en el cuerpo y el `---` suelto, dejando exactamente dos delimitadores (los del frontmatter).
- Se renumeraron las dos secciones `D)` de la segunda copia: `D) Implementation and review loop` → `E) Implementation and review loop` y `E) Close the spec (archive)` → `F) Close the spec (archive)`. `D) Subagent delegation` se mantiene como `D)`.
- No se reescribió ninguna frase de instrucción: el diff son borrados más las dos renumeraciones, nada más.
- `.opencode/agents/architect.md` quedó byte-idéntico a la fuente (lo exige un test).
- Se actualizó `tests/run.mjs`: las aserciones que exigían exactamente dos ocurrencias (`edit grant` por recurso, la frase de recursos escribibles y `Never use shell commands to edit files`) exigen ahora una, y se añadió un grupo de inventario de "una definición por agente" (dos `---`, cada encabezado una vez, sin `permissions:` fuera del frontmatter, las cuatro secciones únicas presentes).
- Se añadió la capacidad `agent-definition-integrity` con su spec (`openspec/specs/agent-definition-integrity/spec.md`): dos requisitos y cinco escenarios que hacen comprobable la propiedad de una definición por agente.

## Por qué

El agente leía las mismas instrucciones dos veces, el bloque `permissions:` muerto era una tercera fuente de verdad que ya había obligado a mantener dos copias de la allowlist sincronizadas, y cualquier edición futura tenía que aplicarse en dos sitios o el fichero derivaba. La consolidación elimina duplicados, no contenido.

## Cómo se usa

El prompt consolidado entra en vigor inmediatamente en este repo porque OpenCode lee la definición local de `opencode/agents/architect.md`. En los demás proyectos del usuario aplica cuando se reinstalan los agentes con `node scripts/install-agents.mjs --force` (o `npm run reinstall`); sin `--force`, `install-agents.mjs` salta los ficheros existentes y el cambio no llega a otros proyectos.

## Impacto / Migración

- `opencode/agents/architect.md`: consolidado (714 → 482 líneas, ~232 borradas, sin pérdida de contenido único).
- `.opencode/agents/architect.md`: sincronizado byte-idéntico a la fuente.
- `tests/run.mjs`: conteos de duplicación de dos a uno, grupo de inventario nuevo.
- `openspec/specs/agent-definition-integrity/spec.md`: nueva capacidad `agent-definition-integrity`.
- `docs/changes/2026-11-19-architect-prompt-dedupe.md`, `docs/CHANGELOG.md`.
- No hay código de runtime, no hay nuevas dependencias, no hay cambios de permiso.

## Evidencia

- `diff opencode/agents/architect.md .opencode/agents/architect.md` no reporta diferencias (byte-idénticos).
- `git diff --check` sin errores.
- `npm test`, `npm run check` y `openspec validate architect-prompt-dedupe --strict` finalizan correctamente.
- `diff` del prompt muestra solo borrados más las dos renumeraciones de encabezado.
- La preservación de contenido (escenarios 4 y 5 del spec) se verificó comparando el fichero consolidado con `git show HEAD:opencode/agents/architect.md` (714 → 482 líneas: 2 líneas añadidas, solo las dos renumeraciones de encabezado, y 234 borradas; secciones idénticas byte a byte), no con un test permanente, porque la operación de consolidación es única y no un invariante de regresión.
