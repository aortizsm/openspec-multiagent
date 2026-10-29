# Proposal

## Why

El `@verifier` verifica que los tests pasen (comportamiento), pero no comprueba que el código fuente implemente cada requerimiento de la spec. Esto deja un hueco: un cambio puede tener todos los tests verdes y aún así faltar funcionalidad que la spec exige.

## What Changes

- **Espec-compliance review en `@verifier`**: antes de ejecutar comandos, el verifier lee `proposal.md`, `design.md` y `specs/*/spec.md`, extrae cada requerimiento funcional y lo mapea contra el código fuente (usando `git diff` si hay git, revisión estática de archivos finales si no).
- **Estado por requerimiento**: `implementado`, `parcialmente implementado` o `no implementado`, con evidencia (`archivo:línea` o `"no encontrado"`).
- **Nueva sección en el reporte**: `## Spec Compliance` con tabla `Requirement | Status | Evidence` y línea `Blocking compliance` que lista los items `no implementado`.
- **Regla de no-fix**: el verifier nunca arregla nada; solo reporta hallazgos.

## Capabilities

### New Capabilities

- `spec-compliance-review`: rol del verifier para mapear requerimientos de la spec contra código fuente y reportar estado de implementación.

### Modified Capabilities

- `independent-verification` (capa existente): ahora incluye verificación de código fuente contra la spec, no solo ejecución de pruebas.

## Impact

- `opencode/agents/verifier.md`: se agregan las secciones Inputs, How to verify, Output contract y Rules para spec-compliance review.
- Sin cambios en otros agentes.
- Sin dependencias nuevas.
