# change-execution-mode Specification

## Purpose
Agrega al architect la capacidad de elegir el modo de ejecución de un change OpenSpec: asistido (comportamiento actual, con consultas de dudas al usuario antes de cada agente para mejorar calidad y reducir errores) o automático (el architect decide internamente y delega automáticamente a cada agente).

## Requirements

### Requirement: Campo de modo de ejecución en el change

El `proposal.md` de cada change OpenSpec MUST incluir un campo `execution-mode` con valor `asistido` o `automatico`.

#### Scenario: Campo execution-mode presente
- **WHEN** se crea un change OpenSpec
- **THEN** el `proposal.md` incluye el campo `execution-mode`
- **THEN** el valor es `asistido` o `automatico`
- **THEN** el valor por defecto es `asistido`

### Requirement: Modo asistido = comportamiento actual con consulta de dudas

El architect MUST consultar al usuario sus dudas antes de delegar al developer, y antes de pasar a code-reviewer, security-reviewer y verifier, cuando el modo es `asistido`, con el objetivo de mejorar la calidad del producto y reducir errores.

#### Scenario: Consulta de dudas en modo asistido antes del developer
- **WHEN** el change está en modo `asistido`
- **THEN** el architect consulta al usuario sus dudas antes de delegar al developer
- **THEN** el architect espera aprobación explícita del usuario

#### Scenario: Consulta de dudas en modo asistido antes del code-reviewer
- **WHEN** el change está en modo `asistido`
- **THEN** el architect consulta al usuario sus dudas antes de pasar a code-reviewer
- **THEN** el architect espera aprobación explícita del usuario

#### Scenario: Consulta de dudas en modo asistido antes del security-reviewer
- **WHEN** el change está en modo `asistido`
- **THEN** el architect consulta al usuario sus dudas antes de pasar a security-reviewer
- **THEN** el architect espera aprobación explícita del usuario

#### Scenario: Consulta de dudas en modo asistido antes del verifier
- **WHEN** el change está en modo `asistido`
- **THEN** el architect consulta al usuario sus dudas antes de pasar a verifier
- **THEN** el architect espera aprobación explícita del usuario

### Requirement: Modo automático = decisión interna y delegación automática

El architect MUST decidir internamente la mejor opción cuando hay duda o ambigüedad, y delegar automáticamente a cada agente en secuencia, cuando el modo es `automatico`.

#### Scenario: Decisión interna en modo automático
- **WHEN** el change está en modo `automatico`
- **THEN** el architect decide internamente ante dudas o ambigüedades sin preguntar al usuario
- **THEN** el architect delega automáticamente al developer
- **THEN** el architect delega automáticamente al code-reviewer
- **THEN** el architect delega automáticamente al security-reviewer
- **THEN** el architect delega automáticamente al verifier

### Requirement: Elección solo por change

El modo de ejecución MUST aplicarse solo al change específico, nunca como configuración global.

#### Scenario: Alcance por change
- **WHEN** se define el `execution-mode` de un change
- **THEN** aplica solo a ese change
- **THEN** no afecta a otros changes existentes o futuros
- **THEN** no es una configuración global persistente

### Requirement: El architect tiene la última palabra en modo automático

El architect MUST resolver desacuerdos entre agentes o dudas sobre el camino a seguir en modo `automatico`.

#### Scenario: Resolución de dudas del architect
- **WHEN** hay duda o desacuerdo entre agentes en modo `automatico`
- **THEN** el architect resuelve y continúa el flujo
- **THEN** el architect documenta la decisión en el completion report
