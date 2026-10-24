# harden-multiagent-workflow

**Fecha:** 2026-10-24  
**Estado:** archivado

## Contexto

El flujo multiagente funcionaba, pero sus controles de calidad vivían solo en la cabeza del usuario y en prosa dispersa. Tres síntomas en uso real:

1. El `architect` exigía la palabra exacta "approved" como única forma de aprobación, ignorando el menú de selección de OpenCode.
2. No existía ningún gate entre fases: el `architect` podía delegar un diseño incompleto y archivar sin verificar nada.
3. El `code-reviewer` emitía feedback sin niveles de severidad, así que el `developer` no sabía qué era bloqueante.

Además, dos defectos de plataforma rompían el flujo: los comandos compuestos de shell (`git status && echo ...`) se rechazaban porque OpenCode evalúa cada segmento; y el modelo inventaba un tool MCP llamado `openspec_new_change` que no existe.

## Qué cambió

- **Puerta de aprobación con menú:** el `architect` usa `question` con opciones seleccionables (aprobar, revisar, rechazar). Acepta cualquier respuesta natural; nunca exige una palabra mágica.
- **Contrato de resultado por fase:** antes de delegar al `developer`, el diseño debe contener `status`, `executive_summary`, `artifacts`, `risks` y `next_recommended`.
- **Gate de validación antes de archivar:** el `architect` verifica `openspec validate`, los tests del proyecto y que el diff no salga del alcance.
- **Severidades de review:** `CRITICAL`, `WARNING`, `SUGGESTION` con formatos de salida fijos para aprobación y cambios solicitados.
- **Checklists en `AGENTS.md`:** pre-review gate (3 checks) y pre-archive gate (5 checks).
- **Permisos de shell por segmento:** se permiten `echo`, `ls`, `pwd`, `cat` como auxiliares para comandos compuestos.
- **Nombres canónicos de OpenSpec:** tabla CLI vs MCP en `AGENTS.md`; `openspec_new_change` no existe.
- **Firmas de Engram:** `mem_save({title, content})` sin `type=session_summary`.

## Por qué

Cada mejora responde a un fallo observado, no a una especulación:

| Mejora | Fallo observado |
|--------|----------------|
| Menú de aprobación | El usuario escribió "approved" manualmente porque el prompt lo exigía |
| Contrato de resultado | El `developer` recibía diseños sin riesgos declarados ni resumen ejecutivo |
| Gate de validación | Se archivaba sin verificar `openspec validate` ni tests |
| Severidades | El `developer` corrige nimiedades antes que bugs |
| Shell por segmento | Comandos compuestos fallaban por un segmento auxiliar denegado |
| Nombres CLI/MCP | El modelo inventaba `openspec_new_change` |
| Firmas Engram | `type=session_summary` provocaba error de validación |

## Cómo se usa

Los cambios son prompts en `opencode/agents/` y reglas en `AGENTS.md`. Se instalan con:

```bash
npm run install-agents
```

Y requieren reiniciar OpenCode para que se carguen.

**Aprobación:** el `architect` presentará un menú con tres opciones. Responde con "sí", "adelante", "aprobar" o selecciona la opción.

**Revisión:** el `code-reviewer` etiquetará cada petición como `CRITICAL` (bloqueante), `WARNING` (debería arreglarse) o `SUGGESTION` (opcional).

**Cierre:** el `architect` ejecutará los cinco checks del pre-archive gate antes de archivar.

## Impacto / Migración

- **Retroactivo:** la implementación ya existía en uso real; este change la formaliza.
- **Requiere reinstalación:** los cambios de permisos y prompts solo aplican tras `npm run install-agents` + reinicio de OpenCode.
- **Sin código nuevo:** solo ficheros de configuración de agentes.

## Evidencia

- `openspec validate harden-multiagent-workflow --strict`: válido.
- `npm test`: 24/24 pasan.
- Diff acotado a `opencode/agents/architect.md`, `opencode/agents/code-reviewer.md` y `AGENTS.md`.
