# Proposal

## Why

El `@developer` implementa cambios OpenSpec pero no tiene una responsabilidad formal para decidir cuándo aplicar un patrón de diseño existente ni para documentar esa decisión. Esto deja ambigüedad sobre quién toma decisiones de diseño táctico y cuándo está justificado usar un patrón.

## What Changes

- **Developer decide cuándo usar un patrón de diseño**: `@developer` evalúa si existe un patrón de diseño existente que resuelva bien el problema del cambio. Si lo hay, decide usarlo; si no, no implementa ningún patrón. Es a su decisión, no es obligatorio en cada cambio.
- **Transparencia de la decisión**: si `@developer` usa un patrón, documenta cuál, por qué lo eligió y dónde se aplica, en su completion report y/o como comentario en el código fuente.
- **El architect no interviene**: `@architect` no dicta qué patrón usar ni obliga a usar uno en cambios donde el diseño táctico quede a criterio del developer.
- **Archivo afectado**: `opencode/agents/developer.md` se extiende con esta responsabilidad.

## Capabilities

### New Capabilities

- `design-pattern-decision`: rol del developer para decidir cuándo aplicar un patrón de diseño existente y documentar la decisión de forma transparente.

### Modified Capabilities

- Ninguna.

## Impact

- `opencode/agents/developer.md`: se agregan secciones sobre decisión de patrones de diseño, qué documentar y que el architect no interviene en esta decisión táctica.
- Sin cambios en otros agentes.
- Sin dependencias nuevas.
