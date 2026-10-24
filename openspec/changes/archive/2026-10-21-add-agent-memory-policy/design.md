# Design

## Context

Ver `proposal.md` — Why. Restricciones que condicionan el diseño:

- Los prompts viven en `opencode/agents/*.md` y `scripts/install-agents.mjs` los copia tal cual al directorio de agentes del usuario. Cualquier política en los prompts viaja en la instalación sin lógica adicional.
- El bloque `instructions` del MCP de Engram ya inyecta una regla genérica de guardado cuando el servidor está conectado. La política nueva no puede contradecirla; debe acotarla.
- `repo-scout.md:39` establece el contrato read-only del agente ("Do NOT persist any file").
- `developer.md:76` prohíbe tests que aserten wording exacto de prompts.
- Los tools MCP se alcanzan vía `execute` bajo el namespace del servidor salvo que se configure `codemode: false`; los permisos se declaran como `<server>_<tool>` y los subagentes usan los suyos propios, no los del padre.

## Goals / Non-Goals

**Goals:**
- Que la política de memoria sea explícita, versionada y revisable en el repo, no dependiente del texto de un servidor externo.
- Que la conversación larga no pierda el hilo (compactaciones, varias sesiones) sin convertir Engram en un registro paralelo de decisiones.
- Que el workflow funcione igual con y sin Engram.

**Non-Goals:**
- Cambiar `init.mjs`, `install-engram.mjs`, `check.mjs` o el esquema de configuración.
- Añadir memoria (lectura o escritura) a `diff-summarizer` o `repo-scout`: solo se les prohíbe escribir de forma explícita.
- Definir formato de memorias, retención, búsqueda semántica o limpieza: es responsabilidad de Engram.
- Sincronizar automáticamente OpenSpec y Engram.
- Backend de memoria alojado o sincronización de Engram entre máquinas (el backend sigue siendo local).

## Decisions

### D1. Sección por agente en lugar de `AGENTS.md` generado

Se añade una sección `Memory (Engram)` a `architect.md`, `developer.md` y `code-reviewer.md`.

- **Por qué:** los prompts son la configuración que este repo distribuye y versiona; el cambio es visible en review y no requiere estado de instalador. `AGENTS.md` del usuario es global y afecta a proyectos ajenos.
- **Alternativa descartada:** bloque delimitado escrito por `init.mjs` en `AGENTS.md` — fuente única, pero exige lógica de marcadores, migración y limpieza, y no cubre instalaciones ya existentes sin re-ejecutar el setup. Complejidad no justificada para 3 ficheros.

### D2. Estructura fija: `Read` / `Save` / `Never save`

Cada sección usa los mismos tres subapartados, con bullets específicos del rol. Facilita comparar agentes, evita prosa divergente y permite que un futuro cambio los trate en bloque.

Alternativa descartada: prosa libre por agente (mejor tono, peor consistencia y revisión).

### D3. Dueño único por tipo de recuerdo

| Tipo | Dueño |
|---|---|
| Estado de conversación (hilos abiertos, preguntas pendientes) | `architect` |
| Decisión, tradeoffs, convenciones adoptadas | `architect` |
| Gotchas de implementación y bloqueos resueltos | `developer` |
| Patrones de defecto recurrentes | `code-reviewer` |

`repo-scout` y `diff-summarizer` no escriben. Mantiene intacto el contrato read-only del scout y elimina la duplicación que produce la regla genérica del MCP ("save after ANY decision") cuando varios agentes ven el mismo hecho. Para que la prohibición no dependa de la omisión —el MCP inyecta esa regla a todos— ambos prompts reciben una línea explícita de "no escribir memoria".

### D4. Precedencia explícita sobre OpenSpec y `AGENTS.md`

La sección declara que specs y `AGENTS.md` mandan y que Engram no es fuente de requisitos. Sin esta regla, un recuerdo viejo puede competir con una spec recién archivada. Su consecuencia operativa es D9.

### D5. Lectura mínima y asimétrica

`architect` lee una vez (`mem_context`) porque abre el trabajo, fija el diseño y retoma hilos abiertos; `developer` y `code-reviewer` buscan por tema (`mem_search`) porque reciben un alcance acotado. Antes de re-preguntar algo ya tratado, se busca en memoria. Evita cargas masivas por subagente, que además arrancan con contexto limpio.

### D6. Degradación explícita y nota de Code Mode

La sección indica: si los tools `mem_*` no están disponibles, continuar sin memoria y no bloquear; si el servidor está configurado pero los tools no se listan, intentar `execute` en el namespace `engram`. Alternativa descartada: activar `codemode: false` para el servidor Engram — expone los tools directamente, pero cambia la configuración global del usuario y va más allá de este repo.

### D7. Verificación manual, sin tests de wording

No se añaden tests a `tests/run.mjs`: asertar frases de prompt es exactamente el test frágil que `developer.md:76` prohíbe. La verificación es una checklist ejecutada en sesión real (ver `tasks.md`).

### D8. Anclaje de inserción

- `architect.md`: sección nueva inmediatamente antes de `## OpenSpec Guidance`.
- `developer.md`: inmediatamente después de `Operating model`.
- `code-reviewer.md`: inmediatamente después de `Skill awareness`.
- `repo-scout.md` y `diff-summarizer.md`: una línea, en la sección de reglas de salida o contrato existente (no una sección nueva).

Reduce el riesgo de que el implementador la coloque en un sitio arbitrario y rompa la lectura del prompt.

### D9. Engram es contexto, la spec es el registro

Engram existe para que una conversación larga o compactada no pierda el hilo: intención actual, hilos abiertos, preguntas sin resolver, hallazgos. Las decisiones finales y la memoria del proyecto viven en `openspec/specs/` y `AGENTS.md`.

- **Regla operativa:** conversación ≠ decisión. Si una decisión no está en la spec, en el diseño del change o en `AGENTS.md`, se trata como no resuelta y `architect` la lleva allí (confirmando con el usuario si hace falta) antes de implementarla. El diseño cuenta mientras el change está en curso; al archivar, la spec queda como registro.
- **Por qué:** sin ese corte, un recuerdo se convierte en una decisión de facto que nadie revisó y que el siguiente agente no puede distinguir de una aprobada.
- **Alternativa descartada:** tratar Engram como bandeja de decisiones pendientes con estados — añade máquina de estados y mantenimiento sin mejorar la continuidad, que es el único problema a resolver aquí.
- **Coherencia:** se mantiene el non-goal de sincronización automática. Nada se replica: la spec tiene la decisión, Engram tiene el hilo de la conversación.

### D10. Proveedor intercambiable, memoria local

La política se escribe para el cliente, no para un modelo: no asume caché de prompt, ni ventanas de contexto grandes, ni tool calling propietario. El backend de memoria (Engram local, SQLite) tampoco se mueve: es lo que permite una jornada larga con modelos locales sin suscripción.

- **Por qué:** el objetivo principal es trabajar muchas horas con modelos locales sin perder contexto; si la política dependiera de funciones de proveedor, el caso local —el prioritario— se degradaría primero.
- **Lecturas compactas:** con ventanas pequeñas, la búsqueda acotada (D5) es lo que mantiene la sesión viva; volcar memoria sería contraproducente.
- **Non-goal explícito:** Engram alojado o sincronización de memoria entre máquinas. Cambiar de proveedor no requiere migrar nada; cambiar de backend sí, y no está en este change.

## Risks / Trade-offs

- **Cumplimiento no verificable automáticamente** (el modelo puede ignorar la regla) → Mitigación: triggers concretos y verificables ("cuando el usuario aprueba…"), más checklist manual; si en uso real no se cumple, el siguiente paso es un gate en el loop del arquitecto, no más prosa.
- **Ruido por sobre-guardado**: la regla del MCP empuja a guardar todo → Mitigación: lista de no-guardado explícita y dueño único por tipo.
- **Prompts más largos** (≈10-15 líneas por agente) → Mitigación: estructura fija y bullets; coste aceptado frente a perder conocimiento entre sesiones.
- **Subagente sin tools de memoria**: los permisos son propios y `engram_*` no está declarado → Mitigación: la política degrada sin bloquear; si la checklist muestra que `developer`/`code-reviewer` no pueden escribir, se añade el permiso `engram_*` como cambio separado.
- **Doble fuente de verdad percibida** → Mitigación: D4 hace explícita la precedencia y la spec de capacidad lo convierte en requisito.
- **Conocimiento declarado como decidido sin estarlo** → Mitigación: el requisito "La spec es el registro final" obliga a tratar como no resuelto todo lo que no esté en la spec, en el diseño del change o en `AGENTS.md`, con verificación manual en la tarea 4.5.
- **Modelos locales con tool calling débil**: puede que no invoquen `mem_*` de forma fiable → Mitigación: la degradación es explícita y no bloqueante; si en la práctica falla, el siguiente paso es un fallback de lectura/escritura fuera del modelo, no más prosa en el prompt.
- **Engram se llena de ruido conversacional** → Mitigación: digests estructurados en vez de transcripciones, prohibición de duplicar texto de requisitos y dueño único por tipo.
