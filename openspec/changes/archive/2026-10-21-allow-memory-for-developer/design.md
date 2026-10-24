# Design

## Context

Ver `proposal.md` — Why. Hechos que condicionan el diseño:

- `developer` tiene acceso real a Engram, verificado en sesión: `tools.engram.mem_current_project` vía `execute`, sin error de permisos.
- `code-reviewer` trabaja contra la spec y el diff; su valor es no arrastrar estado.
- `architect` habla con el usuario y decide alcance, pero no ve lo que pasa dentro de la sesión de `developer`.
- `developer.md:76` prohíbe tests que aserten wording de prompts; la verificación es manual.
- La recuperación al compactar la resuelve el plugin oficial de Engram, que el usuario instala con `engram setup opencode`. Fuera del alcance de este repo.

## Goals / Non-Goals

**Goals:**
- Que el gotcha se guarde donde se descubre, sin viaje de ida y vuelta.
- Que lo durable siga pasando por `architect` y acabe en spec o `AGENTS.md`.
- Que `code-reviewer` no consulte memoria al revisar.

**Non-Goals:**
- Construir plugins, hooks o índices automáticos de decisiones.
- Sincronizar OpenSpec con Engram.
- Cambiar permisos o configuración de OpenCode.
- Dar memoria a `repo-scout` o `diff-summarizer`.

## Decisions

### D1. `developer` lee y escribe; `code-reviewer` no

`developer` conserva `mem_search` acotado y guarda gotchas y bloqueos resueltos. `code-reviewer` no consulta ni guarda: revisa con la spec, el diseño y el diff.

- **Por qué `developer`:** es donde aparece el conocimiento operativo (restricciones no documentadas, comandos que fallan). Guardarlo ahí evita perder el detalle al resumirlo para `architect`.
- **Por qué no `code-reviewer`:** revisar exige independencia; un revisor que recuerda discusiones previas tiende a justificarlas. Sus hallazgos son valiosos, pero se reportan.
- **Alternativa descartada:** ambos con acceso (diseño archivado). Vuelve la duplicación: el mismo defecto puede quedar guardado por el revisor y por el arquitecto.

### D2. `architect` conserva lo durable

`architect` sigue leyendo al inicio y sigue siendo el único que decide qué se convierte en requisito. `developer` escala lo durable en lugar de guardarlo.

- **Por qué:** el corte "conversación no es decisión" solo funciona si un agente con visión completa clasifica. `developer` no ve el change entero ni el histórico con el usuario.
- **Coste:** una conversación más por hallazgo durable. Aceptable: son pocos y son los que importan.

### D3. Sin automatismos nuevos

No se indexan decisiones, no se engancha la compactación y no hay sync con OpenSpec. La spec ya es el registro de lo durable y el plugin oficial cubre la continuidad.

- **Por qué:** cada automatismo añadido duplica el registro que la spec ya mantiene y hay que mantenerlo. Tres reglas se siguen; nueve no.
- **Alternativa descartada:** hook sobre escrituras de spec (índice en Engram). Requiere plugin propio, contrato HTTP de Engram y una excepción a "sin sync", para un beneficio que la spec y git ya cubren.

## Risks / Trade-offs

- **Duplicación de guardados entre `developer` y `architect`** → Mitigación: reparto por tipo (operativo vs durable) y la regla de escalado.
- **`developer` guarda ruido** → Mitigación: se mantiene la lista de no-guardado del diseño archivado (sin transcripciones, sin listas de ficheros, sin texto de requisitos).
- **El revisor pierde contexto útil entre reviews** → Mitigación: recibe la spec, el diseño y el diff, que es lo que necesita para juzgar.
- **`mem_save` falla si el proyecto no está registrado** → Observado en sesión real (`opencode-openspec-multiagent` vs `openspec-multiagent`). Mitigación: documentar `engram init <proyecto>` en el README.

## Migration Plan

1. Editar `code-reviewer.md`, `developer.md` y `README.md`.
2. Checks + validación del change.
3. Rollback: revertir el commit; no hay estado persistido.
