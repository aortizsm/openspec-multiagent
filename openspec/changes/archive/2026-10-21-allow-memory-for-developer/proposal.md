# Proposal

## Why

El change anterior (`restrict-memory-to-architect`) partía de un supuesto falso: que los subagentes no tenían acceso a Engram. Se verificó en sesión real que `developer` **sí** lo tiene. Con el supuesto caído, centralizar toda la memoria en `architect` solo añade un viaje de ida y vuelta: los gotchas se descubren en la sesión de `developer` y al resumirlos para `architect` se degradan o se pierden.

La política se queda en tres reglas: Engram es memoria de trabajo (`architect` y `developer`), `code-reviewer` no la consulta al revisar, y la spec manda. Nada más.

## What Changes

- `restrict-memory-to-architect` se abandona (0/8 tareas, nunca implementado) y su carpeta ya se eliminó; este change lo sustituye.
- `developer` conserva la sección `Memory (Engram)` de `add-agent-memory-policy`: `mem_search` acotado y guardado de gotchas y bloqueos resueltos. Lo durable lo escala a `architect`.
- `code-reviewer` pierde su sección `Memory (Engram)`: una línea que le dice no consultar Engram ni guardar, y revisar con la spec, el diseño y el diff.
- `architect` conserva su sección sin cambios de fondo: lee al inicio, guarda estado y decisiones, y sigue siendo el único que decide lo durable.
- `README.md`: la nota de Engram menciona a `@architect` y `@developer`; añade que la recuperación al compactar la da el plugin oficial de Engram (`engram setup opencode`), fuera del alcance de este repo.

## Capabilities

### New Capabilities

<!-- Ninguna. -->

### Modified Capabilities

- `agent-memory-policy`: `developer` vuelve a ser lector y escritor de memoria de trabajo; `code-reviewer` deja de consultarla y de guardarla. Cambian "Lectura acotada antes de decidir", "Taxonomía mínima de guardado" y "Propiedad por rol". No se añaden requisitos.

## Impact

- `opencode/agents/code-reviewer.md`: sección `Memory (Engram)` sustituida por una línea.
- `opencode/agents/developer.md`: sección conservada; se añade que lo durable se escala a `architect`.
- `opencode/agents/architect.md`: sin cambios de fondo.
- `README.md`: nota de Engram y comando del plugin de compactación.
- Sin cambios en instaladores, configuración ni permisos. No se construye ningún plugin: el oficial de Engram se instala con un comando y queda fuera del repo.
