# Refinamiento de código limpio en dos fases

## Contexto

Aplicar sistemáticamente todos los criterios de código limpio mientras se redacta la primera implementación podía impulsar cambios estructurales antes de comprobar el comportamiento solicitado.

## Qué cambió

El prompt de `@developer` define una fase funcional seguida de una pasada focalizada de refinamiento con los 12 criterios. La corrección y la seguridad siguen siendo obligatorias en ambas fases, y las pruebas y comprobaciones aplicables se vuelven a ejecutar tras el refinamiento. La guía del workflow describe este proceso y mantiene la secuencia externa de agentes existente. Se añadieron aserciones semánticas del contrato del prompt.

## Por qué

Separar la validación del comportamiento de la revisión sistemática de código limpio permite posponer únicamente esa revisión sistemática, sin reducir los requisitos de calidad o seguridad. El refinamiento no incluye optimización especulativa de rendimiento: requiere un requisito explícito o un cuello de botella medido.

## Cómo se usa

En cambios implementados por `@developer`, primero se completa el comportamiento y se dejan en verde las pruebas y comprobaciones aplicables. Después se revisa el cambio acotado contra los 12 criterios, se corrigen las infracciones y se repiten las pruebas y comprobaciones aplicables antes de entregar. Si no hay una prueba determinista significativa, se explica el motivo y se ejecutan las comprobaciones aplicables.

## Impacto / Migración

No hay migración de runtime, cambios de dependencias ni modificaciones al orden externo del pipeline. El cambio ajusta la guía de implementación y su documentación.

## Evidencia

`npm test`: 66 pruebas de `tests/run.mjs`, 39 de `tests/lib.test.mjs` y 36 de `tests/agent-model-plugin.test.mjs` pasaron; no hubo fallos. `npm run check` y `openspec validate two-phase-clean-code-refinement --strict` también pasaron. No hay todavía un informe independiente de `@verifier` para este cambio.
