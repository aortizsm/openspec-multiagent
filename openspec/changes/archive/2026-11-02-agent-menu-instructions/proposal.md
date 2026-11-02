# Proposal

## Why

Los subagentes (developer, code-reviewer, security-reviewer, verifier, test-engineer, ux-designer, repo-scout, diff-summarizer) no tienen acceso a la herramienta `question` de OpenCode para mostrar menús de selección al usuario. Solo el `@architect` puede invocar `question`. Cuando un subagente necesita una decisión del usuario, debe reportarlo al architect quien usará el menú de selección.

## What Changes

- Agregar instrucción en todos los archivos de agente de `opencode/agents/` para que, cuando necesiten una decisión o aprobación del usuario, la reporten al `@architect` quien usará el menú de selección de OpenCode (`question` tool con opciones).
- No cambiar permisos ni capacidades de los agentes.

## Scope

- `opencode/agents/developer.md`
- `opencode/agents/code-reviewer.md`
- `opencode/agents/security-reviewer.md`
- `opencode/agents/verifier.md`
- `opencode/agents/test-engineer.md`
- `opencode/agents/ux-designer.md`
- `opencode/agents/repo-scout.md`
- `opencode/agents/diff-summarizer.md`
- `opencode/agents/fast-architect.md`

## Success Criteria

- Cada archivo de agente incluye una nota sobre delegar decisiones de usuario al architect vía menú de selección.
- No se modifican permisos ni comportamientos de los agentes.
