# Design

## Context

La herramienta `question` (menú de selección de OpenCode) solo está disponible para el agent principal (`@architect`). Los subagentes no pueden invocarla. Cuando un subagente necesita una decisión del usuario (aprobación, cambio de dirección, etc.), debe informar al architect quien usará `question` con opciones seleccionables.

## Goals / Non-Goals

**Goals:**
- Documentar en cada archivo de agente que las decisiones de usuario deben delegarse al architect.
- El architect usará el menú de selección (`question` con opciones) para obtener respuestas del usuario.

**Non-Goals:**
- Conceder acceso a `question` a los subagentes (no es posible técnicamente).
- Cambiar permisos o capacidades de ningún agente.

## Decisions

### D1. Nota en cada archivo de agente

Agregar una sección breve en cada archivo de agente explicando que para decisiones de usuario deben reportar al architect.

### D2. Especificación en inglés

Los archivos de agente están en inglés, por lo que la nota estará en inglés.

## Risks / Trade-offs

- Ningún riesgo. Es solo documentación de un flujo existente (architect usa question para aprobaciones).
