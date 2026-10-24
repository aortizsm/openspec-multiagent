# Proposal

## Why

El flujo multiagente de este repo funcionaba, pero sus controles de calidad vivían solo en la cabeza del usuario y en prosa dispersa. Tres síntomas concretos lo evidenciaron en uso real:

1. El prompt del `architect` exigía literalmente la palabra "approved" como única forma de aprobación, ignorando que OpenCode ofrece un menú de selección. El usuario tuvo que escribir la palabra mágica en vez de elegir una opción.
2. No existía ningún gate entre fases: el `architect` podía delegar al `developer` un diseño incompleto, y podía archivar un change sin que nada verificara `openspec validate`, los tests del proyecto ni el alcance del diff.
3. El `code-reviewer` emitía feedback en prosa libre, sin niveles de severidad, así que el `developer` no podía distinguir un bug crítico de una preferencia de estilo.

Al mismo tiempo, dos defectos de plataforma rompían el flujo: los comandos compuestos de shell (`git status && echo ...`) se rechazaban porque OpenCode evalúa cada segmento y `echo` no estaba permitido; y el modelo inventaba un tool MCP llamado `openspec_new_change` que no existe, mezclando el nombre del skill con el del CLI.

Las mejoras se implementaron de forma ad-hoc. Este change las formaliza para que queden registradas como comportamiento esperado y sobrevivan a futuras ediciones de los prompts.

## What Changes

- **Puerta de aprobación con menú**: el `architect` MUST pedir aprobación con el tool `question` y opciones seleccionables; MUST aceptar cualquier respuesta natural de aprobación y MUST NOT exigir una palabra concreta.
- **Contrato de resultado por fase**: antes de delegar al `developer`, el diseño del change MUST contener `status`, `executive_summary`, `artifacts`, `risks` y `next_recommended`. Si falta uno, el gate falla.
- **Gate de validación antes de archivar**: el `architect` MUST verificar `openspec validate`, los tests del proyecto y que el diff no salga del alcance del change. Si falla, devuelve el trabajo al `developer`.
- **Severidades de review**: el `code-reviewer` MUST etiquetar cada petición de cambio como `CRITICAL`, `WARNING` o `SUGGESTION`, con formatos de salida fijos para aprobación y para cambios solicitados.
- **Checklist de cierre y pre-review**: `AGENTS.md` documenta los checks obligatorios antes de revisar y antes de archivar.
- **Permisos de shell por segmento**: los agentes con shell restringido (`architect`, `code-reviewer`) MUST tener permitidos los comandos auxiliares que aparecen en cadenas (`echo`, `ls`, `pwd`, `cat`) además de los comandos reales, porque OpenCode evalúa cada nodo del comando compuesto.
- **Nombres correctos de OpenSpec**: `AGENTS.md` documenta el CLI (`openspec new change <name>`, `openspec list`, `openspec show`, `openspec validate`, `openspec archive`) frente a los tools MCP (`openspec_create_change`, `openspec_list_specs`) y deja explícito que `openspec_new_change` no existe.
- **Firmas correctas de Engram**: el `architect` documenta `mem_save({title, content})` y prohíbe el argumento `type=session_summary`, que provoca un error de validación.

## Capabilities

### New Capabilities

- `multiagent-workflow`: comportamiento de control de calidad del loop `architect → developer → code-reviewer`: aprobación explícita del usuario, gates entre fases, severidades de review, verificación previa al archivo y nombres canónicos de las herramientas que el flujo invoca.

### Modified Capabilities

<!-- Ninguna: agent-memory-policy, install-engram y configure-mcp-servers no cambian.
     Las firmas de Engram documentadas aquí son una corrección de uso, no un cambio
     de la política de memoria. -->

## Impact

- `opencode/agents/architect.md`: puerta de aprobación, contrato de resultado, gate de validación, permisos de shell ampliados, firmas de Engram, reconciliación de "no ejecutar tests" con el gate.
- `opencode/agents/code-reviewer.md`: niveles de severidad y formatos de salida; comandos auxiliares de shell.
- `AGENTS.md`: convención de aprobación, checklist de cierre, pre-review gate y tabla de nombres CLI/MCP.
- Sin código ejecutable, sin dependencias nuevas, sin cambios en `scripts/`.
- Riesgo de despliegue: los prompts viven en el repo y `install-agents.mjs` los copia al directorio global; los cambios no aplican hasta reinstalar y reiniciar OpenCode.
