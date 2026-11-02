# change-execution-mode

**Fecha:** 2026-11-02  
**Estado:** implementado

## Contexto

El architect solo operaba en modo asistido: antes de delegar al @developer, y antes de pasar a @code-reviewer, @security-reviewer y @verifier, esperaba la aprobación del usuario en cada transición. No existía un modo automático donde el architect decida internamente y delegue sin interrupciones, lo que frena el flujo cuando el usuario confía en el architect para tomar decisiones tácticas.

## Qué cambió

- **`openspec/changes/change-execution-mode/proposal.md`:** se agrega el campo `execution-mode` con valores `asistido` o `automatico`. Valor por defecto: `asistido`. La elección aplica solo al change actual, nunca como configuración global.
- **`opencode/agents/architect.md`:** los valores pasan de inglés (`assisted` / `automatic`) a español (`asistido` / `automatico`) en ambos bloques duplicados de la sección "Modo de Ejecución del Cambio". Se documenta que, en modo automático, el architect tiene la última palabra y registra la decisión en el completion report.
- **`docs/changes/2026-11-02-change-execution-mode.md`:** nueva entrada de documentación con las seis secciones requeridas.
- **`docs/CHANGELOG.md`:** se añade una línea de entrada para este change.

## Por qué

| Mejora | Fallo observado |
|--------|-----------------|
| Valores del campo en español | `proposal.md`, `design.md` y `spec.md` ya usaban `asistido` / `automatico`, pero `architect.md` y la propuesta usaban inglés, rompiendo la consistencia del proyecto. |
| Campo `execution-mode` declarado | La propuesta mencionaba el campo en Impact, pero no lo declaraba como campo del `proposal.md` del change. |
| Registro de decisión en modo automático | El diseño (D5) y el spec indican que el architect documenta la decisión en el completion report, pero `architect.md` no lo reflejaba. |

## Cómo se usa

Al crear un change OpenSpec, en el `proposal.md` se incluye el campo `execution-mode` con valor `asistido` (por defecto) o `automatico`:

```
execution-mode: asistido
```

- **Asistido:** el architect consulta al usuario sus dudas antes de delegar al @developer y antes de pasar a @code-reviewer, @security-reviewer y @verifier.
- **Automático:** el architect decide internamente ante dudas y delega automáticamente a @developer → @code-reviewer → @security-reviewer → @verifier, registrando la decisión en el completion report.

## Impacto / Migración

- **No es breaking change:** el modo por defecto sigue siendo `asistido` (comportamiento actual).
- **Alcance por change:** la elección solo afecta al change donde se declara; no es una configuración global ni persistente entre changes.
- **Sin dependencias nuevas ni código ejecutable:** solo se actualizan archivos de especificación y el prompt del agent architect.

## Evidencia

- `openspec validate change-execution-mode --strict`: pasa.
- `git diff`: acotado a `openspec/changes/change-execution-mode/proposal.md`, `opencode/agents/architect.md`, `docs/changes/2026-11-02-change-execution-mode.md` y `docs/CHANGELOG.md`.
