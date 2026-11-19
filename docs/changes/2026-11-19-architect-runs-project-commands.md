# architect-runs-project-commands

## Contexto

El prompt de `opencode/agents/architect.md` contiene, dos veces, un párrafo restrictivo que limita al architect a una allowlist cerrada de comandos de solo lectura y le prohíbe ejecutar comandos de construcción o instalación. Ese texto gobierna al architect en todos los proyectos del usuario porque `.opencode/agents/architect.md` (y la instalación global del usuario) son copias del mismo origen. Como consecuencia, un architect se negó a ejecutar `npm run scope:sync --dry-run` y aceptó la afirmación errónea de que un architect no puede ejecutar comandos. El texto corregido solo existía en la copia local de este repo y nunca llegó a la fuente.

## Qué cambió

- Se reemplazaron las dos ocurrencias del párrafo restrictivo de `opencode/agents/architect.md` por el mandato de ejecución: el architect ejecuta por sí mismo los comandos propios del proyecto donde trabaja —sus scripts (`npm run <script>`, `make`, `composer`), clientes de base de datos y herramientas de análisis, build y verificación— y reporta la salida.
- Se añadió la regla anti-delegación: nunca pedir al usuario que ejecute un comando que el architect puede ejecutar, y nunca afirmar una incapacidad general para ejecutar comandos. Si un comando falla o falta una herramienta, se reporta el bloqueo concreto y el siguiente paso mínimo.
- Se mantiene la frontera de edición: cambiar el comportamiento del código fuente del proyecto es trabajo de `@developer`, delegado a través de una fila en `tasks.md`; ejecutar comandos del proyecto no es implementar.
- Se añadió la regla de mutación sin petición del usuario: si un comando no puede ejecutarse sin mutar el proyecto y el usuario no lo ha pedido, el architect reporta qué cambiaría y no lo ejecuta salvo que el usuario lo pida después; para inspección propia usa el modo no mutante de la herramienta (por ejemplo `--dry-run` o flags de solo lectura).
- Se hizo byte-idéntica la copia `.opencode/agents/architect.md` a `opencode/agents/architect.md`, incluyendo la sección `## Read-only Database Reviews`, y se eliminó el over-grant (`You may also edit source code`) de la copia local.
- Se añadió el requisito y los seis escenarios de la spec delta `architect-shell-editing`.
- Se añadió un test de regresión de contrato en `tests/run.mjs` que lee ambos prompts y verifica el mandato de ejecución, la regla anti-delegación, la desaparición de la allowlist cerrada y la frontera de edición.
- Se actualizaron `README.md` y `docs/guides/agent-workflow.md` para dejar explícito que el architect ejecuta los comandos del proyecto y no los delega en el usuario.

## Por qué

Ejecutar un comando no es implementar. El inspector del proyecto necesita las propias herramientas del proyecto para analizarlo y verificarlo. La herramienta ya permite `shell: "*"` a nivel de herramienta, por lo que el defecto era narrativo, no de permisos: el prompt se lo prohibía en la práctica.

## Cómo se usa

El architect corre directamente los comandos del proyecto donde trabaja, usa modos no mutantes cuando la herramienta los ofrezca (por ejemplo `--dry-run` o flags de solo lectura) para inspección sin modificar el repositorio, y informa el resultado. Si un comando solo puede ejecutarse mutando el repositorio y el usuario no lo ha pedido, el architect reporta qué cambiaría y no lo ejecuta salvo que el usuario lo pida después. Nunca delega en el usuario un comando que puede ejecutar él mismo, ni afirma que no puede ejecutar comandos. Los cambios de comportamiento del código fuente siguen yendo a `@developer` mediante `tasks.md`.

## Impacto / Migración

- `opencode/agents/architect.md`: ambas ocurrencias del párrafo restrictivo.
- `.opencode/agents/architect.md`: byte-idéntico a la fuente.
- `openspec/changes/architect-runs-project-commands/specs/architect-shell-editing/spec.md`: requisito ADDED y seis escenarios.
- `README.md`, `docs/guides/agent-workflow.md`, `docs/changes/2026-11-19-architect-runs-project-commands.md`, `docs/CHANGELOG.md`.
- `tests/run.mjs`: test de regresión de contrato sobre ambos prompts.

La corrección entra en vigor en este repo inmediatamente (OpenCode lee la definición local). En los demás proyectos del usuario aplica cuando se reinstalan los agentes de usuario con `node scripts/install-agents.mjs --force` (o `npm run reinstall`, que sobrescribe los ficheros existentes según `README.md:193`); sin `--force`, `install-agents.mjs` salta los ficheros que ya existen y el arreglo no llega a los demás proyectos. Hasta entonces sus architects siguen obedeciendo el texto antiguo. Este repo no reinstala automáticamente agentes de otros proyectos.

## Evidencia

- No queda ocurrencia de `You MAY run read-only verification commands` ni de `You NEVER implement anything yourself` en `opencode/agents/architect.md`.
- `diff opencode/agents/architect.md .opencode/agents/architect.md` no reporta diferencias.
- `npm test`, `npm run check`, `openspec validate architect-runs-project-commands --strict` y `git diff --check` finalizan correctamente.
- El test de regresión falla con el prompt previo (falta el mandato de ejecución y persiste la allowlist cerrada) y pasa tras el cambio.
