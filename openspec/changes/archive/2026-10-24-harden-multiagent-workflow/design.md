# Design

## Context

Ver `proposal.md` — Why. Restricciones que condicionan el diseño:

- El control de calidad vive en los prompts (`opencode/agents/*.md`) y en `AGENTS.md`; no hay código ejecutable que lo imponga. `scripts/install-agents.mjs` copia los prompts tal cual al directorio global del usuario.
- La sesión viva de OpenCode carga los prompts al arrancar: cualquier cambio de permisos o instrucciones exige reinstalar (`npm run install-agents`) y reiniciar.
- OpenCode evalúa los permisos de shell **por segmento**: `a && b` se descompone y cada nodo debe estar permitido. Un solo segmento denegado rechaza el comando completo.
- Los skills de OpenSpec instalados usan el CLI (`allowed-tools: Bash(openspec:*)`), mientras el servidor MCP `openspec-mcp` expone `openspec_create_change`. La convivencia de ambos nombres induce al modelo a inventar `openspec_new_change`.
- El servidor MCP de Engram inyecta instrucciones genéricas de guardado que empujan a usar `type=session_summary`, un argumento que `mem_save` no acepta.

## Goals / Non-Goals

**Goals:**
- Que las decisiones de calidad del flujo queden versionadas y revisables, no en la memoria del usuario.
- Que el `architect` no pueda delegar un diseño incompleto ni archivar sin verificar.
- Que el feedback del `code-reviewer` sea priorizable por el `developer`.
- Que los errores de plataforma (comandos compuestos, nombres de tools) queden documentados donde el agente los lee.

**Non-Goals:**
- Añadir gates automáticos en código (hooks, scripts de validación del loop): no hay punto de enganche y no se ha necesitado.
- Reimplementar el flujo sobre otro cliente (Codex u otros): se evaluó por separado y se descartó como change.
- Cambiar `install-agents.mjs`, `check.mjs` o el esquema de configuración.
- Sincronizar Engram con OpenSpec.
- Añadir tests que aserten el texto de los prompts: es el test frágil que `developer.md` prohíbe.

## Decisions

### D1. Puerta de aprobación con `question` en lugar de palabra clave

El `architect` usa el tool `question` con tres opciones (aprobar, revisar, rechazar) y acepta cualquier respuesta natural.

- **Por qué:** la aprobación es una decisión del usuario, no un ritual textual. El menú elimina el fallo de usabilidad que motivó el change.
- **Alternativa descartada:** mantener "approved" como única señal — simple de implementar en el prompt, pero traslada la carga al usuario y ya falló en uso real.

### D2. Contrato de resultado de cinco campos

`status`, `executive_summary`, `artifacts`, `risks` y `next_recommended` son obligatorios antes de delegar.

- **Por qué:** un diseño sin riesgos declarados es un diseño no pensado; delegar sin resumen ejecutivo obliga al `developer` a reconstruir la intención.
- **Alternativa descartada:** checklist libre en prosa — no verificable y ya existía de facto sin efecto.
- **Origen:** patrón *Result Contract* de Gentle AI.

### D3. Gate de validación con comandos de solo lectura

El `architect` verifica `openspec validate`, los tests del proyecto y el alcance del diff. Para poder hacerlo, sus permisos de shell incluyen `openspec *`, `npm test*`, `npm run test*`, `npm run check*`, `node tests/*` y los comandos git de inspección.

- **Por qué:** el gate sin permiso de ejecución es decorativo. La verificación es de solo lectura; no muta el repositorio.
- **Alternativa descartada:** delegar la verificación al `developer` y creer su reporte — elimina el punto de control independiente.
- **Consecuencia:** se reconcilió la frase del prompt que prohibía "run build/test commands" para distinguir verificación (permitida) de build/install (prohibido).

### D4. Severidades de review con formato fijo

`CRITICAL`, `WARNING` y `SUGGESTION`, con plantillas separadas para aprobación y para cambios solicitados.

- **Por qué:** el `developer` necesita saber qué es bloqueante. Sin niveles, todo el feedback compite por igual y se corrigen primero las nimiedades.
- **Alternativa descartada:** severidad inferida por el `architect` al reenviar el feedback — añade un juicio intermedio y diluye la responsabilidad del revisor.
- **Origen:** niveles de severidad de `sdd-verify` (Gentle AI).

### D5. Checklists en `AGENTS.md`, no en los prompts

Los checks de cierre y pre-review viven en `AGENTS.md`, que OpenCode carga en todos los agentes del proyecto.

- **Por qué:** una sola fuente para un procedimiento que involucra a tres agentes; los prompts individuales ya son largos.
- **Alternativa descartada:** duplicar los checks en cada prompt — divergencia garantizada.

### D6. Permisos de shell que incluyen comandos auxiliares

Se añaden `echo`, `ls`, `pwd` y `cat` (solo lectura) a las listas de `architect` y `code-reviewer`.

- **Por qué:** OpenCode evalúa por segmento; sin los auxiliares, cualquier comando compuesto con separador visible falla aunque los comandos reales estén permitidos.
- **Alternativa descartada:** prohibir comandos compuestos y forzar comandos separados — posible, pero traslada al modelo una restricción no obvia y multiplica llamadas.
- **Riesgo aceptado:** `cat` puede exponer ficheros; ambos agentes ya tienen `read: *`, así que no amplía la superficie real.

### D7. Tabla de nombres CLI/MCP en `AGENTS.md`

Se documentan ambos vocabularios y se declara inexistente `openspec_new_change`.

- **Por qué:** el error observado fue un nombre inventado a partir del skill; una tabla corta elimina la ambigüedad en el punto donde el agente la lee.
- **Alternativa descartada:** eliminar el servidor MCP de OpenSpec de la configuración global — quita la ambigüedad, pero rompe los tools que sí se usan (`openspec_list_specs`) y cambia configuración del usuario fuera de este repo.

### D8. Firmas de Engram documentadas en el prompt del `architect`

Se añade la firma correcta de `mem_save`, `mem_session_end`, `mem_context` y `mem_search`, con la prohibición explícita de `type=session_summary`.

- **Por qué:** el error de validación vino de una instrucción del MCP incompatible con el tool; el prompt es el único punto donde se puede corregir sin tocar el servidor.
- **Alternativa descartada:** desactivar `codemode` para Engram — expone los tools con su esquema real, pero cambia configuración global y no está en el alcance de este repo.

### D9. Formalización retroactiva

El change documenta trabajo ya implementado; las tasks quedan marcadas como completadas con la verificación que se hizo.

- **Por qué:** el valor está en que el comportamiento quede como registro revisable; reimplementarlo no añade nada.
- **Alternativa descartada:** re-ejecutar la implementación vía `@developer` — coste sin beneficio, y riesgo de perder ajustes ya validados en uso real.

## Risks / Trade-offs

- **Prompts más largos** → Mitigación: secciones cortas y tablas; coste aceptado frente a la pérdida de criterio de calidad.
- **Cumplimiento no verificable automáticamente** (el modelo puede ignorar el gate) → Mitigación: los gates son instrucciones explícitas con disparadores claros; si en uso real no se cumplen, el siguiente paso es un mecanismo externo, no más prosa.
- **Permisos ampliados** (`cat`, `ls`) → Mitigación: ambos agentes ya tenían `read: *`; la ampliación no otorga acceso nuevo, solo permite encadenar.
- **Duplicación de la tabla CLI/MCP con la documentación upstream** → Mitigación: tabla mínima, solo con los comandos que el flujo usa.
- **Cambios no aplicados hasta reinstalar** → Mitigación: documentado en `proposal.md` (Impact) y verificado en uso real tras `npm run install-agents`.
- **Sin tests automáticos** → Mitigación: la verificación es `openspec validate` sobre la spec y una checklist manual; asertar texto de prompt sería un test frágil.
