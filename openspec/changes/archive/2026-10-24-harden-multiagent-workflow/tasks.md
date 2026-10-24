# Tasks

## 1. Puerta de aprobación

- [x] 1.1 Reemplazar en `opencode/agents/architect.md` la regla "Treat ONLY THE WORD approved as signoff" por la sección `Approval gate` con el tool `question` y opciones seleccionables, aceptando respuesta natural. Verificado: la cadena "ONLY THE WORD" ya no aparece en el fichero.
- [x] 1.2 Documentar la misma convención en `AGENTS.md` (sección `Aprobación del Architect`) para que aplique a futuras sesiones y a los demás agentes del proyecto. Verificado por lectura del fichero.
- [x] 1.3 Verificar en sesión real que el menú aparece y que una respuesta natural ("sí", "adelante") se acepta como aprobación.

## 2. Gates entre fases

- [x] 2.1 Añadir en `architect.md` la sección `Phase gate — Result Contract` con los campos `status`, `executive_summary`, `artifacts`, `risks` y `next_recommended`, y la regla de que un campo vacío bloquea la delegación. Verificado por lectura.
- [x] 2.2 Añadir en `architect.md` el `Validation gate` previo al archivo (`openspec validate`, tests del proyecto, alcance del diff) con la regla de devolver el trabajo al `developer` si falla.
- [x] 2.3 Reconciliar la frase "You do not ... run build/test commands" con el nuevo gate: se permite verificación de solo lectura y se prohíbe build/install. Verificado por lectura del párrafo inicial.

## 3. Criterios de revisión

- [x] 3.1 Añadir a `opencode/agents/code-reviewer.md` la tabla de severidades `CRITICAL` / `WARNING` / `SUGGESTION` con su significado y acción esperada.
- [x] 3.2 Añadir el formato estructurado de cambio solicitado (bloques por severidad, con qué/por qué/dónde) y el formato de aprobación con desglose de severidades en cero.
- [x] 3.3 Verificar que el `code-reviewer` no puede emitir peticiones sin severidad y que sigue sin poder archivar ni editar código.

## 4. Checklists y documentación

- [x] 4.1 Añadir a `AGENTS.md` el `Checklist de cierre (Pre-archive gate)` con los cinco checks obligatorios.
- [x] 4.2 Añadir a `AGENTS.md` el `Pre-review gate` con los tres checks previos a la revisión.
- [x] 4.3 Añadir a `AGENTS.md` la tabla `OpenSpec tooling — nombres correctos` (CLI frente a MCP, y la declaración de que `openspec_new_change` no existe).

## 5. Correcciones de plataforma

- [x] 5.1 Ampliar los permisos `shell` de `architect.md` con `echo`, `ls`, `pwd`, `git show*`, `git rev-parse*`, `npx openspec *`, `npm test*`, `npm run test*` y `npm run check*`, para que los comandos compuestos no se rechacen por un segmento auxiliar. Verificado en sesión: `git status --porcelain && echo "---" && git diff --stat` se ejecuta.
- [x] 5.2 Ampliar los permisos `shell` de `code-reviewer.md` con `echo`, `ls`, `pwd`, `cat` y `git show*`.
- [x] 5.3 Documentar en `architect.md` las firmas correctas de Engram (`mem_save` solo con `title` y `content`; `mem_session_end` con `id` y `summary`) y prohibir `type=session_summary`.
- [x] 5.4 Reinstalar los agentes en el directorio global (`npm run install-agents`) y verificar que la copia de `~/.config/opencode/agents/` contiene los cambios.

## 6. Validación del change

- [x] 6.1 Ejecutar `openspec validate harden-multiagent-workflow --strict` y confirmar que pasa. Resultado: `Change 'harden-multiagent-workflow' is valid`.
- [x] 6.2 Ejecutar `npm test` y confirmar que pasa. Resultado: 24 pasan, 0 fallan.
- [x] 6.3 Confirmar que las ediciones de este change se limitan a `opencode/agents/architect.md`, `opencode/agents/code-reviewer.md` y `AGENTS.md`. Verificado con `git diff --stat` acotado a esos paths y `git status` para el fichero no trackeado.
- [x] 6.4 Registrar el estado del árbol de trabajo: existen modificaciones previas ajenas a este change en `README.md`, `opencode/agents/developer.md`, `opencode/agents/diff-summarizer.md`, `opencode/agents/repo-scout.md`, `scripts/*` y `tests/run.mjs`. No se tocan en este change y no deben atribuirse a él al commitear.

