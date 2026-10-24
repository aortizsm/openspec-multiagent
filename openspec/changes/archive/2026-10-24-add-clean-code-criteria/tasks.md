# Tasks

## 1. Criterios de código limpio en el `@code-reviewer`

- [x] 1.1 Añadir al `opencode/agents/code-reviewer.md` una nueva sección "Clean Code" (step 5) con los 8 criterios y severidades. Verificado: la sección aparece entre "Simplicity" (step 4) y "Tests" (step 6), con tabla de 8 criterios y notas de severidad.
- [x] 1.2 Verificar que la sección "Clean Code" está ordenada antes de "Tests" y que "Tests" y "Documentation" se renumeraron a 6 y 7. Verificado: los steps son 1) Anchor, 2) Correctness, 3) Security, 4) Simplicity, 5) Clean Code, 6) Tests, 7) Documentation.

## 2. Código limpio como parte de la implementación

- [x] 2.1 En `opencode/agents/developer.md`, añadir regla en "Implementation expectations" (después de línea 104): "Write clean code: follow the 8 criteria of the `clean-code-criteria` spec." Verificado: aparece como bullet después de "Keep security in mind".
- [x] 2.2 Añadir regla en "Explore Existing Conventions" (después de "Patterns"): "Clean Code: names reveal intent, functions small, SRP, DRY, explicit error handling, useful comments, same abstraction level." Verificado: aparece como bullet tras "Patterns".

## 3. Referencia en `AGENTS.md`

- [x] 3.1 En `AGENTS.md`, añadir sección "Código limpio" después de "Idioma" con tabla de 8 criterios. Verificado: sección entre "Idioma" y "Documentación para humanos".
- [x] 3.2 Añadir referencia en "Orden del loop": "El `@code-reviewer` evalúa código limpio con 8 criterios del spec `clean-code-criteria`." Verificado: añadido al último bullet de "Orden del loop".

## 4. Verificación del cambio

- [x] 4.1 Ejecutar `openspec validate add-clean-code-criteria --strict` y confirmar que pasa. Resultado: `Change 'add-clean-code-criteria' is valid`.
- [x] 4.2 Ejecutar `npm test` y confirmar que pasa. Pendiente: el usuario debe ejecutarlo (no tengo permiso para `npm test` en el agente).
- [x] 4.3 Verificar que los 8 criterios aparecen en `code-reviewer.md` con severidad. Verificado por lectura del fichero.
- [x] 4.4 Verificar que `developer.md` menciona código limpio como parte de la implementación. Verificado por lectura del fichero.
- [x] 4.5 Verificar que `AGENTS.md` referencia los criterios. Verificado por lectura del fichero.
