# Design

## Context

El `@developer` ya implementa cambios OpenSpec siguiendo el `design.md` definido por `@architect`. Sin embargo, cuando el `design.md` no especifica un patrón de diseño concreto, no hay claridad sobre cuándo aplicar un patrón existente, quién decide ni cómo se documenta.

## Goals / Non-Goals

**Goals:**
- Que `@developer` decida internamente si existe un patrón de diseño existente que resuelva el problema del cambio, y si es así, lo use.
- Que `@developer` documente la decisión solo cuando use un patrón (patrón, motivo, ubicación).
- Que `@architect` no intervenga en esta decisión táctica.
- Que no sea obligatorio usar un patrón en cada cambio.

**Non-Goals:**
- Sustituir al `@architect` en decisiones de diseño estratégico definidas en `design.md`.
- Crear un agente nuevo dedicado a patrones de diseño.
- Exigir un patrón específico en todos los cambios.
- Obligar al developer a usar un patrón cuando no exista uno adecuado.

## Decisions

### D1. El developer decide si usar un patrón existente

`@developer` evalúa si existe un patrón de diseño existente que resuelva bien el problema del cambio. Si lo hay, decide usarlo; si no, no implementa ningún patrón. Es a su decisión, no es obligatorio.

### D2. Documentación obligatoria solo si se usa un patrón

Si `@developer` usa un patrón, debe documentar en su completion report: nombre del patrón, por qué lo eligió y dónde se aplica (archivo y líneas). Opcionalmente puede añadir un comentario en el código fuente. Si no usa ningún patrón, no hay nada que documentar.

### D3. El architect no interviene en decisiones tácticas

`@architect` no dicta qué patrón usar ni obliga a usar uno cuando el `design.md` no lo especifica. Solo revisa que la decisión esté documentada si se usó un patrón.

### D4. Especificación en español

Los nombres de patrones y la documentación usan terminología en inglés para los patrones (Strategy, Factory, etc.) y español para el resto, consistente con el resto del proyecto.

## Risks / Trade-offs

- **Inconsistencia entre cambios**: diferentes developers podrían elegir patrones distintos para problemas similares. Mitigación: seguir convenciones del repo y documentar el motivo.
- **Falta de revisión de adecuación**: nadie valida si el patrón elegido es el mejor. Mitigación: el `code-reviewer` puede señalarlo como observación, no como requisito bloqueante.
- **Overengineering**: riesgo de aplicar un patrón innecesario. Mitigación: seguir YAGNI y priorizar simplicidad; no es obligatorio usar patrón.
