# Proposal

## Why

Los agentes de este repo no tienen ninguna instrucción de memoria. `opencode/agents/*.md` no menciona Engram en ningún punto, y la única regla de guardado proviene del bloque `instructions` del servidor MCP de Engram, que (a) solo existe si el usuario aceptó el paso opcional —`init.mjs` pregunta con `defaultYes: false`— y (b) es genérica: no sabe qué es una decisión de spec, un rechazo de review ni una convención de repo. Resultado: el conocimiento que produce el loop de multiagente (decisiones y tradeoffs, gotchas de implementación, defectos recurrentes, convenciones detectadas) se pierde al cerrar la sesión, y una regla "guarda todo inmediatamente" sin taxonomía genera ruido o duplicación.

## What Changes

- Añadir una sección `Memory (Engram)` a los prompts de `architect`, `developer` y `code-reviewer`, con la misma estructura (leer / guardar / no guardar) y bullets específicos por rol.
- Establecer el reparto: Engram es memoria de trabajo para no perder el hilo en conversaciones largas (estado, hilos abiertos, hallazgos); las decisiones finales y la memoria del proyecto viven en las specs de OpenSpec y en `AGENTS.md`.
- Fijar la regla "conversación no es decisión": si una decisión no está en la spec, en el diseño del change o en `AGENTS.md`, se trata como no resuelta y se lleva allí antes de implementarla.
- Definir una taxonomía mínima de guardado (estado de conversación, decisiones con rationale, convenciones no obvias, gotchas, hallazgos recurrentes, bloqueos resueltos) y una lista explícita de no-guardado (transcripciones literales, ediciones rutinarias, listas de ficheros, texto de requisitos ya especificados, secretos).
- Añadir un paso de lectura acotado: `mem_context` al inicio para `architect`, `mem_search` dirigido para `developer` y `code-reviewer`, y búsqueda en memoria antes de volver a preguntar algo ya tratado.
- Hacer la política condicional: si los tools `mem_*` no están disponibles en la sesión, el agente continúa sin memoria y nunca bloquea el workflow.
- Mantener la política agnóstica al proveedor: aplica igual con modelos locales y en la nube, con la memoria siempre local, sin caché de prompt ni ventanas de contexto grandes como supuesto.
- Sin cambios en el instalador, en `init.mjs`, en el schema de configuración ni en las capacidades existentes (`install-engram`, `configure-mcp-servers`).
- `diff-summarizer` y `repo-scout` no reciben sección completa: el primero no produce conocimiento durable y el segundo tiene contrato read-only ("do NOT persist"). Ambos reciben una sola línea explícita de "no escribir memoria", porque la instrucción genérica del MCP les pide guardar; lo que merece conservarse lo guarda `architect`.

## Capabilities

### New Capabilities

- `agent-memory-policy`: comportamiento de memoria de trabajo (Engram) de los agentes del workflow — continuidad de conversación, qué guardar y qué no, propiedad por rol, y la regla de que las decisiones finales viven en la spec.

### Modified Capabilities

<!-- Ninguna: install-engram y configure-mcp-servers describen instalación y cableado del MCP, no el comportamiento de memoria de los agentes. -->

## Impact

- `opencode/agents/architect.md`, `opencode/agents/developer.md`, `opencode/agents/code-reviewer.md` (contenido de prompts, sin cambios de frontmatter ni de permisos).
- `opencode/agents/repo-scout.md` y `opencode/agents/diff-summarizer.md`: una sola línea de "no escribir memoria" cada uno, sin sección completa.
- `README.md`: nota breve de que la política de memoria vive en los prompts y solo aplica si Engram está configurado.
- Sin código ejecutable, sin dependencias nuevas, sin cambios de CLI. `node scripts/check.mjs` sigue reportando Engram como opcional.
