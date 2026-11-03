# Proposal

## Why

El `code-reviewer` es redundante porque el `developer` ya es responsable de aplicar los 12 criterios de código limpio y patrones de diseño (AGENTS.md). Tener un revisor separado para código limpio duplica trabajo y aumenta el tiempo de espera sin agregar valor.

## What Changes

- **Quitar `@code-reviewer` del flujo normal de revisión en `opencode/agents/architect.md`**: después de `@developer`, solo se invoca a `@security-reviewer` (no a ambos en paralelo).
- **Mantener `@verifier`** después de que `@security-reviewer` apruebe.
- **Sección E de archivo**: actualizar referencias para que solo requiera aprobación de `@security-reviewer`, no de ambos.

## Scope

- `opencode/agents/architect.md` (pasos 2-4 y sección E del loop)

## Success Criteria

- El loop del architect invoca solo a `@security-reviewer` después de `@developer`.
- `@verifier` se invoca solo después de que `@security-reviewer` apruebe.
- La sección E de archivo requiere solo la aprobación de `@security-reviewer`.
- `openspec validate` pasa en el change.