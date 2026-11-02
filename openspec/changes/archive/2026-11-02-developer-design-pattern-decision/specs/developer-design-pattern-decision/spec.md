# developer-design-pattern-decision Specification

## Purpose

Agrega al @developer la responsabilidad de decidir cuándo aplicar un patrón de diseño existente al implementar cambios OpenSpec, documentando la decisión de forma transparente solo si se usa uno. No es obligatorio usar un patrón en cada cambio.

## ADDED Requirements

### Requirement: Developer decide si usar un patrón de diseño existente

El `developer` MUST evaluar si existe un patrón de diseño existente que resuelva bien el problema del cambio. Si lo hay, decide usarlo; si no, no implementa ningún patrón. Es a su decisión, no es obligatorio en cada cambio.

#### Scenario: Decisión interna sin obligatoriedad
- **WHEN** el `developer` implementa un cambio OpenSpec
- **THEN** evalúa si existe un patrón de diseño existente que resuelva el problema
- **THEN** si existe uno adecuado, decide usarlo
- **THEN** si no existe uno adecuado, no implementa ningún patrón
- **THEN** no recomienda el patrón al usuario
- **THEN** no pide aprobación previa al usuario ni al architect

### Requirement: Documentación transparente solo si se usa un patrón

El `developer` MUST documentar el patrón elegido, el motivo y dónde se aplica, solo cuando use un patrón.

#### Scenario: Documentación en completion report cuando se usa un patrón
- **WHEN** el `developer` usa un patrón de diseño en un cambio
- **THEN** incluye en el completion report: nombre del patrón, por qué lo eligió, dónde se aplica (archivo:líneas)

#### Scenario: Sin documentación cuando no se usa ningún patrón
- **WHEN** el `developer` no usa ningún patrón de diseño en un cambio
- **THEN** no hay requisito de documentar un patrón

#### Scenario: Comentario opcional en código fuente
- **WHEN** el `developer` aplica un patrón de diseño en el código
- **THEN** puede añadir un comentario en el código fuente indicando el patrón usado
- **THEN** el comentario explica WHY (por qué ese patrón), no WHAT (qué hace el patrón)

### Requirement: El architect no interviene en decisiones tácticas de patrón

El `architect` MUST NO dictar qué patrón de diseño usar ni obligar a usar uno cuando el `design.md` no especifica uno concreto.

#### Scenario: No intervención del architect
- **WHEN** el `design.md` no especifica un patrón de diseño
- **THEN** el `architect` no impone un patrón específico al `developer`
- **THEN** el `developer` tiene autonomía para decidir si usar uno o no

### Requirement: El verifier confirma la documentación del patrón si se usó uno

El `verifier` MUST confirmar que, si se usó un patrón de diseño, la decisión esté documentada en el completion report o en el código fuente.

#### Scenario: Verificación de documentación de patrón cuando se usó uno
- **WHEN** el `verifier` revisa un cambio implementado donde se usó un patrón
- **THEN** verifica que exista documentación del patrón de diseño usado (completion report o comentario en código)
- **THEN** marca el requerimiento como `implementado` si está documentado, `no implementado` si falta

#### Scenario: Sin patrón usado, no hay requisito de documentación
- **WHEN** el `verifier` revisa un cambio implementado donde no se usó ningún patrón
- **THEN** no reporta hallazgo por falta de documentación de patrón
