# verifier-conflict-resolution Specification

## Purpose
Agrega una regla de resolución de conflictos al @verifier para desacuerdos con @architect sobre el estado de implementación de requerimientos, aclarando que @architect tiene la última palabra y @verifier solo reporta.

## Requirements

### Requirement: Resolución de desacuerdos sobre estado de requerimiento

El `verifier` y el `@architect` SHALL resolver desacuerdos sobre si un requerimiento está `implementado`, `parcialmente implementado` o `no implementado` según la regla de escalación.

#### Scenario: @architect tiene la última palabra
- **WHEN** hay un desacuerdo entre @verifier y @architect sobre el estado de un requerimiento
- **THEN** @architect decide si se corrige el código o se ajusta la spec

#### Scenario: @verifier solo reporta
- **WHEN** hay un desacuerdo sobre el estado de un requerimiento
- **THEN** @verifier reporta el estado observado pero no decide ni modifica código

#### Scenario: Terminología en español
- **WHEN** se describe el estado de un requerimiento en la regla de conflicto
- **THEN** se usa `implementado`, `parcialmente implementado` o `no implementado`
