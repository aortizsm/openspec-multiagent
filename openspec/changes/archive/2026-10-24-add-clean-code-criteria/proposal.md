# Proposal

## Why

El `@code-reviewer` revisa corrección, seguridad, tests, simplicidad y documentación. No revisa **cómo se escribe el código**. El resultado es que el reviewer puede aprobar código que funciona pero que es difícil de leer, mantener o modificar.

El libro "Clean Code" de Robert C. Martin define principios concretos: nombres significativos, funciones pequeñas, SRP, DRY, manejo explícito de errores, comentarios útiles, cohesión y nivel de abstracción correcto. Sin estos criterios en el prompt del reviewer, la calidad del código depende de la sensibilidad subjetiva del modelo, no de un estándar verificable.

## What Changes

- **8 criterios de código limpio** en el spec: nombres significativos, funciones pequeñas y SRP, DRY, manejo explícito de errores, comentarios útiles, cohesión/acoplamiento, nivel de abstracción, y developer aplica código limpio.
- **`@code-reviewer` actualizado**: añade una sección "Código limpio" a sus criterios de revisión con los 8 criterios y severidades por defecto.
- **`@developer` actualizado**: añade la regla de que el código limpio es parte de la implementación, no un extra opcional.
- **`AGENTS.md` actualizado**: añade los criterios de código limpio como referencia para todos los agentes.

## Capabilities

### New Capabilities

- `clean-code-criteria`: los 8 criterios de código limpio que el `@code-reviewer` evalúa y el `@developer` aplica.

### Modified Capabilities

<!-- Ninguna: los cambios son aditivos a los agentes existentes. -->

## Impact

- `opencode/agents/code-reviewer.md`: nueva sección "Código limpio" con 8 criterios.
- `opencode/agents/developer.md`: regla de que código limpio es parte de la implementación.
- `AGENTS.md`: referencia a los criterios de código limpio.
- `docs/changes/` y `docs/guides/`: entradas y guía del change (escritas por `@developer` en un change posterior o integrado).
- Sin código ejecutable ni dependencias nuevas.
