## Why
El loop de revisión actual es secuencial: `@developer` → `@code-reviewer` → `@security-reviewer` → `@verifier` → `@architect` archiva. Si `@security-reviewer` encuentra un hallazgo, vuelve al `@developer`, luego `@code-reviewer` debe revisar de nuevo, luego `@verifier`, creando ciclos largos ("bloop") que retrasan el archivado.

`@code-reviewer` (código limpio) y `@security-reviewer` (seguridad) son independientes entre sí: uno no depende del resultado del otro. No hay razón para esperar a que uno termine para empezar el otro.

## What Changes
- Modificar `AGENTS.md` para que `@code-reviewer` y `@security-reviewer` se ejecuten en paralelo después de `@developer`
- Mantener `@verifier` y `@architect` (archive) al final del loop
- Documentar la nueva orden del loop

## Scope
- `AGENTS.md` (modificar sección "Orden del loop")

## Success Criteria
- `@code-reviewer` y `@security-reviewer` se ejecutan en paralelo después de `@developer`
- `@verifier` ejecuta después de que ambos revisores aprueben
- `@architect` archiva después de que `@verifier` apruebe
