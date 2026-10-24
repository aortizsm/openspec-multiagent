# Design

## Context

Ver `proposal.md` — Why. Restricciones que condicionan el diseño:

- El `@code-reviewer` revisa correctness, security, tests, simplicity y docs accuracy. No tiene criterios de código limpio.
- El `@developer` tiene YAGNI ("no implementes features futuras") pero no tiene criterios de calidad de código.
- "Clean Code" de Robert C. Martin es un libro de referencia; los agentes no lo tienen disponible como contexto.
- Los criterios deben ser explícitos y verificables, no "sigue Clean Code" (demasiado vago).

## Goals / Non-Goals

**Goals:**
- Que el `@code-reviewer` evalúe código limpio con criterios concretos y severidades definidas.
- Que el `@developer` aplique código limpio como parte de la implementación, no como extra.
- Que los criterios sean verificables sin necesidad de leer el libro.

**Non-Goals:**
- Reemplazar linters: el formateo y estilo básico los deja al linter (ESLint, Prettier, etc.).
- Imponer umbrales de cobertura numérica.
- Revisar rendimiento, escalabilidad o arquitectura.
- TDD: eso lo cubre la sección de tests del reviewer.
- F.I.R.S.T. (Fast, Independent, Repeatable, Self-validating, Timely): eso es para tests.

## Decisions

### D1. Criterios explícitos, no referencia al libro

Los 8 criterios están descritos en el spec, no solo "sigue Clean Code".

- **Por qué:** "sigue Clean Code" es demasiado vago para un agente. Los criterios explícitos son verificables.
- **Alternativa descartada:** solo referenciar el libro — el modelo no lo tiene como contexto y "Clean Code" cubre 400 páginas.

### D2. Severidades por defecto, no absolutas

Cada criterio tiene una severidad por defecto (CRITICAL, WARNING, SUGGESTION), pero el reviewer puede ajustar según el contexto.

- **Por qué:** un error silencioso en un servicio crítico es más grave que en un script interno. La severidad por defecto es un punto de partida, no una ley.
- **Alternativa descartada:** severidad fija por criterio — no permite ajustar al contexto.

### D3. Límites de líneas como guía, no como ley

Funciones: típicamente < 20 líneas, máximo 40 líneas (excluyendo comentarios y blank lines).

- **Por qué:** los agentes pueden generar código extenso. Un límite blando es mejor que ninguno.
- **Coste aceptado:** el reviewer debe juzgar cuándo extender el límite (p. ej. código de mapeo de datos).
- **Alternativa descartada:** solo "haz una cosa" sin límite numérico — difícil de verificar para un agente.

### D4. Código limpio como criterio del reviewer, no como fase separada

El reviewer evalúa código limpio en su revisión normal, no en una fase adicional.

- **Por qué:** el reviewer ya revisa correctness, security, tests, simplicity y docs. Añadir código limpio como criterio más es una extensión natural, no un paso nuevo.
- **Alternativa descartada:** agente `@clean-code-reviewer` separado — añade un paso al loop y duplica trabajo.

### D5. Developer aplica código limpio, no lo mejora después

El developer escribe código limpio desde el primer commit, no como refactor posterior.

- **Por qué:** si el developer entrega código sucio y el reviewer lo rechaza, se pierde tiempo en ciclos extra. Escribir limpio desde el inicio es más barato.
- **Alternativa descartada:** "mejora el código limpio después de la implementación" — el developer optimiza código, no calidad.

### D6. Comentarios: intención sobre mecánica

Los comentarios explican *por qué*, no *qué*. Un comentario que repite el código es ruido.

- **Por qué:** los comentarios redundantes se desactualizan con el código y generan confianza falsa. Los comentarios de intención sobreviven a los refactorings.
- **Alternativa descartada:** "no uses comentarios" — hay decisiones no obvias que necesitan explicación.

### D7. Sin criterios de naming convention específica

Los criterios dicen "nombre que revele intención", no "usa camelCase" o "usa snake_case".

- **Por qué:** la convención de naming es del proyecto, no del libro. El reviewer ya verifica "follow existing repository conventions".
- **Alternativa descartada:** imponer camelCase o snake_case — conflicto con la convención del proyecto.

## Risks / Trade-offs

- **Reviewer demasiado estricto** (p. ej. rechaza funciones de 25 líneas en código de mapeo) → Mitigación: la severidad es por defecto, el reviewer ajusta al contexto.
- **Developer bloqueado por criterios** (no sabe cómo aplicar SRP a un problema concreto) → Mitigación: el reviewer sugiere, no impone; el architect decide si el warning es bloqueante.
- **Criterios vs. YAGNI** (el developer añade abstracciones para cumplir DRY) → Mitigación: DRY solo cuando la duplicación es real, no cuando es una posibilidad futura.
- **Límites de líneas artificiales** → Mitigación: los límites son guía, no ley; el reviewer juzga el contexto.
- **Código "limpio" pero sobre-ingenierizado** → Mitigación: YAGNI sigue vigente; la simplicidad y el código limpio se refuerzan mutuamente.
