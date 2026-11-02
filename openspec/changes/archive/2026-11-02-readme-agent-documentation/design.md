# Design

## Context

El `README.md` actual tiene badges, logo, características generales y un enlace a la documentación de agentes, pero no detalla individualmente qué hace cada agente, qué responsabilidades tiene ni qué permisos de acceso posee. Los usuarios no saben a qué agente recurrir para cada tipo de tarea.

## Goals / Non-Goals

**Goals:**
- Documentar en `README.md` cada agente existente en `opencode/agents/`
- Para cada agente: nombre, responsabilidades, acceso permitido, acceso denegado, modo de operación
- Mantener el README en inglés, sin diagramas Mermaid
- No modificar los archivos de agente (`opencode/agents/*.md`)

**Non-Goals:**
- Crear nuevos agentes
- Modificar permisos o responsabilidades de agentes existentes
- Agregar diagramas Mermaid o secciones en español al README

## Decisions

### D1. Tabla de agentes en README.md

Se agregará una tabla (o lista estructurada) con una fila por agente, conteniendo: nombre, descripción/responsabilidades, acceso permitido, acceso denegado, modo.

### D2. Información basada en los archivos de agente existentes

La documentación se deriva directamente de los archivos `opencode/agents/*.md` actuales (sección YAML de permissions y descripción del agente).

### D3. Especificación en español

Los documentos de OpenSpec (proposal, design, tasks, spec) están en inglés, como convención del proyecto.

## Risks / Trade-offs

- **Información puede quedar desactualizada**: si un agente cambia sus permisos, el README no se actualiza automáticamente. Mitigación: documentar basado en el estado actual de los archivos de agente.
- **README más largo**: agregar una tabla de 9 agentes aumenta la longitud del README. Mitigación: mantener entradas concisas.
