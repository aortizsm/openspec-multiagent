# Design

## Context

El `@verifier` ya existe como agente de verificación independiente. Su reporte actual incluye una tabla de escenarios con `PASS` / `FAIL` / `UNVERIFIABLE` y evidencia de ejecución. No incluye revisión de cumplimiento de la spec contra el código fuente.

## Goals / Non-Goals

**Goals:**
- Que cada requerimiento funcional de la spec tenga un estado de implementación explícito.
- Que el verifier funcione con o sin git en el proyecto.
- Que el verifier nunca modifique código; solo reporte.

**Non-Goals:**
- Sustituir al code-reviewer ni al developer.
- Decidir si un requerimiento faltante es bloqueante (eso decide el architect).
- Arreglar código faltante.

## Decisions

### D1. Leer proposal.md y design.md además de specs/*/spec.md

Los requerimientos funcionales pueden vivir en cualquiera de los tres documentos. Extraer de todos tres garantiza cobertura completa.

### D2. Usar git diff cuando esté disponible

Permite mapear cada requerimiento a los archivos y líneas realmente modificados por el change, no al estado completo del proyecto.

### D3. Revisión estática sin git

Cuando no hay git, se revisan los archivos finales del proyecto. Limitación conocida: no se distingue código nuevo de preexistente, pero sí se confirma si cada requerimiento está presente.

### D4. Tres estados de implementación

`implementado`, `parcialmente implementado`, `no implementado`. Ofrece más granularidad que un simple sí/no.

### D5. Especificación en español

Los estados y evidencias usan terminología en español (`implementado`, `parcialmente implementado`, `no implementado`, `no encontrado`) para consistencia con el resto de la documentación del proyecto.

## Risks / Trade-offs

- **Subjetividad de "parcialmente implementado"**: mitigación: el architect tiene la última palabra en desacuerdos (ver change verifier-conflict-resolution).
- **Carga extra al verifier**: leer múltiples specs y hacer mapeo manual es más lento que solo correr tests. Mitigación: se hace una vez, tras la aprobación del reviewer.
