# Design

## Context

Ver `proposal.md` — Why. Restricciones que condicionan el diseño:

- El `architect` no puede escribir `docs/`: su `edit` está limitado a `openspec/**`, `AGENTS.md` y `opencode/agents/*`. La documentación de producto tiene que producirla otro rol.
- `developer.md` hoy declara la documentación como opcional ("only when it materially helps correctness/maintainability").
- Los changes archivados conservan `proposal.md` y `design.md` con el *por qué* y las alternativas descartadas: es la materia prima de un changelog que hoy no existe.
- Las specs están en inglés y el `README.md` también; el consumidor humano de este repo es hispanohablante.
- No hay generador ni comando de OpenSpec que produzca documentación para humanos.

## Goals / Non-Goals

**Goals:**
- Que exista un changelog legible y una guía de uso por capacidad.
- Que la documentación sea parte del cambio, no una tarea posterior que nadie hace.
- Que se pueda verificar que la doc coincide con el código.

**Non-Goals:**
- Sitio web, wiki alojada o generador estático.
- Documentación de API generada desde código.
- Traducción automática ni multi-idioma.
- Documentar cambios internos invisibles para el usuario.
- Sustituir las specs: siguen siendo el contrato normativo.

## Decisions

### D1. `@developer` es el autor, no un agente nuevo

La documentación es una task del change, ejecutada por el `@developer` y revisada en el mismo diff.

- **Por qué:** el developer ya tiene el contexto del diff y del diseño; añadir un sexto agente para transcribir lo que otro acaba de escribir es coste sin beneficio mientras el volumen sea bajo.
- **Alternativa descartada:** agente `@documenter` — separación de responsabilidades más limpia, pero añade un paso al loop y un riesgo nuevo (inventar detalles que no están en el diff) para un problema que aún no duele.

### D2. Tres artefactos, no una wiki

`docs/CHANGELOG.md` (índice), `docs/changes/<fecha>-<change>.md` (por cambio) y `docs/guides/<capability>.md` (por capacidad).

- **Por qué:** el changelog responde "¿qué cambió y cuándo?"; la guía responde "¿cómo lo uso?". Son preguntas distintas y se degradan juntas si se mezclan en un solo documento.
- **Alternativa descartada:** un único `docs/README.md` que crezca — barato al principio, ilegible a los diez cambios.

### D3. Derivación obligatoria desde los artefactos del change

La entrada se escribe desde `proposal.md` (por qué), `design.md` (decisiones), `tasks.md` (qué se tocó), el diff (qué existe) y el reporte del `@verifier` (evidencia).

- **Por qué:** evita el fallo típico de la documentación generada a mano: describir la intención en lugar del comportamiento real.
- **Alternativa descartada:** escribir la doc antes de implementar — se convierte en otra spec, con el mismo riesgo de divergencia que ya cubre OpenSpec.

### D4. Review de exactitud, no de estilo

El `@code-reviewer` compara nombres de ficheros, comandos, rutas y comportamiento descrito contra el diff. Un desajuste que rompe el uso es `CRITICAL`; una imprecisión menor es `WARNING`.

- **Por qué:** el estilo es subjetivo y no bloquea; la exactitud sí. Un comando mal documentado inutiliza la guía.
- **Alternativa descartada:** revisión editorial separada — no hay editor y no hace falta.

### D5. Gate condicional al cambio visible

Solo los cambios que alteran comportamiento, configuración o uso exigen entrada. Un refactor interno no.

- **Por qué:** exigir documentación a todo produce ruido y entrena a ignorar el gate.
- **Coste aceptado:** la frontera es un juicio. Se resuelve dejando la decisión escrita en `tasks.md` ("sin entrada: refactor interno sin efecto observable"), no en la cabeza del agente.

### D6. Español en `docs/`, inglés en specs y README

- **Por qué:** `docs/` lo lee el equipo que usa el workflow; las specs las leen los agentes y el `README.md` lo lee quien instala el paquete, ya en inglés.
- **Alternativa descartada:** todo en inglés — coherente, pero empeora la lectura del consumidor real de la documentación.

### D7. El `architect` no escribe `docs/`

Se mantiene su permiso de edición limitado a `openspec/**`, `AGENTS.md` y `opencode/agents/*`.

- **Por qué:** el arquitecto no debe redactar documentación de producto desde su propia interpretación; la escribe quien tocó el código y la revisa quien lo revisa. El permiso lo hace cumplir sin depender de la disciplina del modelo.
- **Alternativa descartada:** añadir `docs/**` a su allowlist — cómodo, pero rompe la separación y convierte al arquitecto en autor y corrector de lo mismo.

## Risks / Trade-offs

- **Documentación superficial** (el developer la ve como trámite) → Mitigación: la entrada se deriva de artefactos concretos y el reviewer compara contra el diff.
- **Deriva entre doc y código** cuando el código cambia en un cambio posterior → Mitigación: la guía de la capacidad se actualiza en el mismo change que la toca; el gate lo exige.
- **Duplicación con las specs** → Mitigación: la spec dice qué es obligatorio; la guía dice cómo se usa. Si una sección de la guía repite una spec, se enlaza en vez de copiar.
- **Crecimiento desordenado de `docs/changes/`** → Mitigación: nombre con fecha ISO y un fichero por change; el changelog es el índice.
- **Idioma mixto** → Mitigación: la regla es explícita por carpeta y se verifica en el cambio que la incumpla.
- **El gate bloquea cambios legítimos sin doc** → Mitigación: el gate es condicional (D5) y la omisión se justifica por escrito en `tasks.md`.
