# Proposal

## Why

En el loop actual, la única persona que ejecuta los comandos del proyecto es el `developer`, que es además el autor del cambio. El `code-reviewer` puede *pedirle* que corra los tests, pero su prompt lo declara explícitamente opcional:

> "You may ask @developer to run tests, linters, and other checks... This is optional but recommended when..."

El resultado es que la evidencia de que el trabajo funciona depende del auto-reporte del implementador. Y aunque el `architect` ejecuta el gate de validación (`openspec validate`, tests del proyecto), su verificación es de una sola pasada: no recorre los escenarios de la spec ni deja constancia de qué se comprobó.

En proyectos reales esto deja cuatro huecos:

1. Nadie confirma de forma independiente que los tests pasan de verdad.
2. Nadie comprueba que el proyecto **compila y arranca** (los permisos del `code-reviewer` solo cubren comandos de test).
3. Nadie mapea `escenario de la spec → evidencia`; `openspec validate` valida la sintaxis de la spec, no el comportamiento.
4. Nadie detecta regresiones comparando el comportamiento previo con el nuevo.

Falta un rol de verificación independiente. Gentle AI lo resuelve con la fase `sdd-verify`; aquí no existe equivalente.

## What Changes

- **Nuevo agente `verifier`** (subagente, sin permiso de escritura) que ejecuta los comandos reales del proyecto y devuelve un reporte por escenario con veredicto `PASS` / `FAIL` / `UNVERIFIABLE` y la salida como evidencia.
- **Verificación independiente**: el `verifier` MUST NOT confiar en el reporte del `developer`; MUST ejecutar los comandos por sí mismo.
- **Orden del loop**: el `architect` invoca al `verifier` después de que el `code-reviewer` apruebe y antes de archivar. Si algún escenario falla, devuelve el trabajo al `developer` con la evidencia.
- **Descubrimiento de comandos**: el `verifier` obtiene los comandos del proyecto desde `AGENTS.md`, `package.json` o `repo-scout`; MUST NOT inventarlos.
- **Alcance de ejecución**: tests, build/compilación, linters/typecheck y arranque en seco. Las migraciones de base de datos quedan fuera: mutan estado y se escalan al `architect`.
- **Checklist de cierre actualizado**: el gate de archivo exige un reporte del `verifier` sin `FAIL` y sin `UNVERIFIABLE` sin justificar.
- **Verificación del `code-reviewer` deja de ser opcional**: pasa de "optional but recommended" a obligatoria antes de aprobar.

## Capabilities

### New Capabilities

- `independent-verification`: rol, permisos y contrato de salida del agente `verifier`; qué ejecuta, qué no ejecuta, cómo mapea escenarios de la spec a evidencia y cómo escala lo que no puede verificar.

### Modified Capabilities

<!-- Ninguna: `multiagent-workflow` todavía no está sincronizada en openspec/specs/ (su change
     harden-multiagent-workflow sigue abierto). Cuando ambos se archiven, el gate de archivo
     del verifier se documentará en AGENTS.md y quedará cubierto por esta capability. -->

## Impact

- `opencode/agents/verifier.md`: fichero nuevo.
- `opencode/agents/architect.md`: el loop incorpora el paso de verificación entre la aprobación del reviewer y el archivo.
- `opencode/agents/code-reviewer.md`: la verificación deja de ser opcional.
- `AGENTS.md`: checklist de cierre con el reporte del `verifier`.
- `scripts/install-agents.mjs`: sin cambios; copia cualquier `*.md` de `opencode/agents/`, así que el agente nuevo se instala automáticamente.
- Sin dependencias nuevas. El `verifier` no escribe código ni ficheros del proyecto.
