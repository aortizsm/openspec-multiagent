# verifier-spec-compliance

**Fecha:** 2026-10-29  
**Estado:** archivado

## Contexto

El `@verifier` verificaba que los tests pasen (comportamiento), pero no comprobaba que el código fuente implemente cada requerimiento de la spec. Esto deja un hueco: un cambio puede tener todos los tests verdes y aún así faltar funcionalidad que la spec exige.

## Qué cambió

- **Espec-compliance review en `@verifier`:** antes de ejecutar comandos, el verifier lee `proposal.md`, `design.md` y `specs/*/spec.md`, extrae cada requerimiento funcional y lo mapea contra el código fuente (usando `git diff` si hay git, revisión estática de archivos finales si no).
- **Estado por requerimiento:** `implementado`, `parcialmente implementado` o `no implementado`, con evidencia (`archivo:línea` o `"no encontrado"`).
- **Nueva sección en el reporte:** `## Spec Compliance` con tabla `Requirement | Status | Evidence` y línea `Blocking compliance` que lista los items `no implementado`.
- **Regla de no-fix:** el verifier nunca arregla nada; solo reporta hallazgos.

## Por qué

| Mejora | Fallo observado |
|--------|----------------|
| Verificación de cumplimiento de spec | Nadie confirmaba que el código implemente cada requerimiento de la spec |
| Mapeo requerimiento→código | Solo se verificaba comportamiento (tests), no cobertura de requerimientos |
| Soporte sin git | El verifier asume que siempre hay git disponible |

## Cómo se usa

El `@verifier` se instala automáticamente con `npm run install-agents`.

**Nueva sección en el reporte de verificación:**

```
## Spec Compliance

| Requirement | Status | Evidence |
|-------------|--------|----------|
| Verificación independiente del autor | implementado | verifier.md:259 |

Summary: X PASS, Y FAIL, Z UNVERIFIABLE
Blocking: none
Blocking compliance: none
```

- `implementado`: el requerimiento está cubierto por código fuente con evidencia.
- `parcialmente implementado`: el requerimiento está parcialmente cubierto.
- `no implementado`: el requerimiento no tiene evidencia en el código fuente.

## Impacto / Migración

- **El verifier ahora hace más:** además de ejecutar tests, revisa que cada requerimiento de la spec tenga implementación en el código.
- **Requiere reinstalación:** `npm run install-agents` + reinicio de OpenCode.
- **No es breaking change:** el reporte anterior sigue funcionando; solo se agrega una sección nueva.

## Evidencia

- `openspec validate verifier-spec-compliance --strict`: válido.
- `openspec archive verifier-spec-compliance --yes`: archivado como `2026-10-29-verifier-spec-compliance`.
- Diff acotado a `opencode/agents/verifier.md`.
