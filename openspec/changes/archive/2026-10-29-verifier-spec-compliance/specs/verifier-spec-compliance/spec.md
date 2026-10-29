# verifier-spec-compliance Specification

## Purpose
Agrega al @verifier la capacidad de revisar que cada requerimiento funcional de la spec esté implementado en el código fuente, no solo que los tests pasen.

## ADDED Requirements

### Requirement: Lectura de todos los documentos de spec

El `verifier` MUST leer `proposal.md`, `design.md` y `specs/*/spec.md` para extraer cada requerimiento funcional (scenarios `WHEN`/`THEN` y decisiones de diseño), además de `tasks.md` para saber lo que se intended.

#### Scenario: Requisitos de la proposal
- **WHEN** el `verifier` lee `proposal.md`
- **THEN** extrae cada requerimiento funcional descrito allí

#### Scenario: Requisitos del design
- **WHEN** el `verifier` lee `design.md`
- **THEN** extrae cada decisión de diseño y requerimiento asociado

#### Scenario: Requisitos de la spec principal
- **WHEN** el `verifier` lee `specs/*/spec.md`
- **THEN** extrae cada escenario con su `WHEN` y `THEN`

### Requirement: Mapeo de requerimientos a código fuente

El `verifier` MUST mapear cada requerimiento extraído contra el código fuente implementado.

#### Scenario: Mapeo con git
- **WHEN** el proyecto tiene historial de git
- **THEN** el `verifier` usa `git diff` para identificar los archivos y líneas modificados
- **THEN** mapea cada requerimiento a los archivos y líneas relevantes

#### Scenario: Mapeo sin git
- **WHEN** el proyecto no tiene historial de git
- **THEN** el `verifier` realiza una revisión estática de los archivos finales del proyecto
- **THEN** confirma si cada requerimiento está presente, sin distinguir código nuevo de preexistente

### Requirement: Estado de implementación por requerimiento

El `verifier` MUST marcar cada requerimiento con un estado de implementación.

#### Scenario: Estados válidos
- **WHEN** el `verifier` evalúa un requerimiento
- **THEN** lo marca como `implementado`, `parcialmente implementado` o `no implementado`
- **THEN** registra evidencia como `archivo:línea` o `"no encontrado"`

### Requirement: Reporte de Spec Compliance

El `verifier` MUST incluir una sección `## Spec Compliance` en su reporte de verificación.

#### Scenario: Tabla de cumplimiento
- **WHEN** el `verifier` genera el reporte
- **THEN** incluye una tabla con columnas `Requirement | Status | Evidence`
- **THEN** cada fila corresponde a un requerimiento de la spec

#### Scenario: Línea de bloqueo de cumplimiento
- **WHEN** existen requisitos marcados como `no implementado`
- **THEN** el reporte incluye una línea `Blocking compliance` listando esos items

### Requirement: El verifier nunca arregla hallazgos

El `verifier` MUST reportar faltantes o cumplimiento parcial, pero nunca modificar código para corregirlos.

#### Scenario: Reporte sin corrección
- **WHEN** un requerimiento está `no implementado` o `parcialmente implementado`
- **THEN** el `verifier` lo reporta como hallazgo en Spec Compliance
- **THEN** el `verifier` NO modifica ningún archivo del proyecto para corregirlo
