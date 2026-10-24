# Tasks

## 1. Política de memoria en los prompts

- [x] 1.1 Añadir la sección `Memory (Engram)` a `opencode/agents/architect.md`, inmediatamente antes de `## OpenSpec Guidance`, con `Read` (`mem_context` al inicio y antes de re-preguntar), `Save` (digest de estado con intención, lo acordado, hilos abiertos, preguntas pendientes y **restricciones expresadas por el usuario**, con disparador explícito al cerrar una sesión sin archivar o antes de una compactación; decisiones con rationale; convenciones adoptadas de repo-scout; resumen al archivar), `Never save`, la precedencia sobre specs/`AGENTS.md` y la regla "conversación no es decisión" (lo que no está en la spec, en el diseño del change o en `AGENTS.md` se trata como no resuelto y se lleva allí). Verificar que las tres subsecciones existen, que el disparador y las restricciones aparecen, y que la sección no se solapa con `## OpenSpec Guidance`.
- [x] 1.2 Añadir la misma sección a `opencode/agents/developer.md`, inmediatamente después de `Operating model`, con `mem_search` acotado y guardado de gotchas/bloqueos resueltos; la regla de no-implementar-lo-no-registrado debe citar spec, diseño del change o `AGENTS.md`; sin duplicar la responsabilidad de decisiones de spec. Verificar por lectura del fichero que el orden de secciones se mantiene y que no hay contradicción con `Ambiguity handling` ni `Validation`.
- [x] 1.3 Añadir la misma sección a `opencode/agents/code-reviewer.md`, inmediatamente después de `Skill awareness`, con `mem_search` acotado, guardado de patrones de defecto recurrentes y el mismo alcance de registro (spec, diseño del change o `AGENTS.md`) para no bloquear decisiones ya documentadas en el diseño. Verificar que no entra en conflicto con `Feedback rules (strict)` ni con el rol de solo aprobar/rechazar.
- [x] 1.4 Añadir en `opencode/agents/repo-scout.md` y `opencode/agents/diff-summarizer.md` una sola línea explícita de "no escribir memoria en Engram" (sin sección completa), porque la instrucción genérica del MCP les pide guardar. Verificar que el contrato read-only de `repo-scout.md:39` y las reglas de `diff-summarizer.md` siguen intactas y que ninguno recibe una sección `Memory`.

## 2. Degradación y acceso a tools

- [x] 2.1 Incluir en las tres secciones la regla de degradación: si los tools `mem_*` no están disponibles, continuar sin memoria sin bloquear y sin pedir instalar Engram; si el servidor está configurado pero los tools no se listan, intentar `execute` en el namespace `engram`. Verificar que la frase aparece en los tres ficheros y que ningún prompt exige Engram como precondición.
- [x] 2.2 Verificar que ningún prompt nuevo promete persistencia incondicional: buscar en los tres ficheros cualquier formulación absoluta ("siempre guarda", "debes guardar todo") y corregirla a la taxonomía de la spec.
- [x] 2.3 Verificar que la sección no asume funciones de proveedor: buscar en los tres ficheros menciones a caché de prompt, ventanas de contexto grandes o tool calling propietario, y eliminarlas. La política debe leerse igual para un modelo local que para uno en la nube.

## 3. Documentación

- [x] 3.1 Actualizar la sección de Engram del `README.md` con una nota breve: la política de memoria vive en los prompts de los agentes, aplica solo cuando Engram está configurado, funciona igual con modelos locales y en la nube, y las specs de OpenSpec siguen siendo la fuente de verdad. Verificar que la afirmación "optional", el carácter local del backend y el comportamiento de `check.mjs` descritos en el README siguen siendo correctos.

## 4. Verificación de integración

- [x] 4.1 Ejecutar `npm test` y `node scripts/check.mjs` y confirmar que ambos pasan (el check debe seguir reportando Engram como opcional, no como fallo).
- [x] 4.2 Ejecutar `openspec validate add-agent-memory-policy --strict` y confirmar que pasa sin warnings de requisitos.
- [ ] 4.3 Checklist manual en sesión real con Engram configurado: `architect` ejecuta `mem_context` al inicio; tras aprobar una spec guarda una memoria recuperable con `mem_search` por el nombre del change; `developer` y `code-reviewer` pueden invocar `mem_save`/`mem_search` desde su propia sesión (si no pueden, reportarlo como hallazgo para un cambio separado de permisos `engram_*`).
- [ ] 4.4 Checklist manual en sesión sin Engram: ejecutar un ciclo corto architect→developer y confirmar que no aparece ningún error, bloqueo ni intento repetido de usar memoria.
- [ ] 4.5 Checklist manual del corte conversación/decisión: introducir en memoria un requisito que ninguna spec recoge y confirmar que `architect` lo trata como no resuelto y lo lleva a la spec o al diseño del change antes de implementar.
- [ ] 4.6 Checklist manual de continuidad: compactar o reabrir la sesión y confirmar que `architect` recupera el estado guardado (hilos abiertos, preguntas pendientes) y no vuelve a preguntar lo ya tratado.
- [ ] 4.7 Checklist manual de independencia de proveedor: ejecutar el mismo ciclo corto con un modelo local y con uno en la nube y confirmar que la memoria y las specs se comportan igual, sin cambios de configuración ni supuestos de caché o ventana grande.
