# Design

## Context

El architect actualmente opera siempre en modo asistido: antes de delegar al developer, espera aprobación del usuario. Antes de code-reviewer, security-reviewer y verifier, también espera validación. Esto frena el flujo cuando el usuario confía en el architect para tomar decisiones tácticas.

## Goals / Non-Goals

**Goals:**
- Que al crear un change OpenSpec el usuario pueda elegir modo de ejecución: asistido o automático.
- Que en modo asistido el architect consulte al usuario sus dudas antes de pasar a cada agente, para mejorar la calidad del producto y reducir errores.
- Que en modo automático el architect decida internamente ante dudas y delegue automáticamente a cada agente en secuencia.
- Que la elección quede registrada por change, no como configuración global.

**Non-Goals:**
- Configuración global persistente entre changes.
- Crear un agente nuevo.
- Saltarse las validaciones de seguridad o clean code en modo automático (solo se elimina la espera de aprobación del usuario entre agentes).

## Decisions

### D1. Campo `execution-mode` en proposal.md

Al crear un change, el `proposal.md` incluye un campo `execution-mode` con valores `asistido` o `automatico`. Valor por defecto: `asistido`.

### D2. Modo asistido = comportamiento actual con consulta de dudas

El architect consulta al usuario sus dudas antes de delegar al developer, y antes de pasar a code-reviewer, security-reviewer y verifier. Espera aprobación explícita en cada transición. El objetivo es mejorar la calidad del producto y reducir errores.

### D3. Modo automático = decisión interna del architect

El architect decide internamente la mejor opción cuando un agente reporta duda o ambigüedad. Delegue automáticamente a developer, luego code-reviewer, luego security-reviewer, luego verifier, sin interrupciones para aprobación del usuario.

### D4. El architect tiene la última palabra

En modo automático, si hay desacuerdo entre agentes o duda sobre el camino a seguir, el architect resuelve y continúa.

### D5. Especificación en español

Los valores del campo y la documentación usan español, consistente con el resto del proyecto.

## Risks / Trade-offs

- **Pérdida de control intermedio**: en modo automático el usuario no ve ni aprueba el trabajo de cada agente hasta el final. Mitigación: el usuario puede revisar el diff completo antes de archivar.
- **Decisiones subjetivas del architect**: el architect elige la "mejor opción" sin consultar al usuario. Mitigación: el architect documenta sus decisiones en el completion report.
- **Solo por change**: no afecta otros changes ni es global, limitando el blast radius.
