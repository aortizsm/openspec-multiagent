# Design

## Context

Ver `proposal.md` — Why. Hechos verificados en el código actual:

- `setup.mjs:203-214` ofrece exactamente dos servidores: `filesystem` y `github`. No hay entrada `git` en ningún script.
- `check.mjs:203` espera `["filesystem", "git", "github"]`.
- `README.md:179-203` documenta tres servidores, el orden filesystem → git → github y un ejemplo de configuración con la entrada `git`.
- `setup.mjs:222-225` pasa `defaultYes: true` a `askYesNo`; `lib.mjs:254` devuelve el default cuando no hay TTY.
- Spec y `README` dicen "default: no" y "en CI se salta el paso".
- `tests/run.mjs` ya cubre `--dry-run` sin escritura de configuración.

## Goals / Non-Goals

**Goals:**
- Que exista una sola verdad sobre qué servidores ofrece el instalador.
- Que un entorno no interactivo no escriba configuración MCP.

**Non-Goals:**
- Añadir el servidor `git` (decisión del usuario: retirarlo).
- Traducir los mensajes de la CLI (siguen en español; tema aparte).
- Cambiar el formato de las entradas, el token de GitHub o la regla de no sobrescribir.

## Decisions

### D1. Retirar `git` en vez de implementarlo

Se elimina de la spec, del `README` y de `check.mjs`. El instalador queda con dos servidores.

- **Por qué:** el usuario prefiere menos superficie. Implementarlo habría costado cuatro líneas en `setup.mjs`, pero añade un servidor más que mantener y que el usuario no usa.
- **Alternativa descartada:** añadirlo para igualar la documentación. Coherente, pero amplía el producto sin necesidad.
- **Efecto:** `check.mjs` deja de reportar un `none` permanente que parecía un fallo de instalación.

### D2. El default "no" se arregla en el código, no en la spec

La spec ya exige default "no" y salto en CI; el código no lo cumplía. No hay cambio de requisito: es un bug.

- **Por qué:** cambiar la spec para legalizar `defaultYes: true` habría empeorado el comportamiento en CI (escribir configuración sin que nadie lo pida).
- **Efecto secundario:** al devolver `false` sin TTY, el paso se salta solo. No hace falta una rama explícita de CI.

### D3. Un test fija la retirada de `git`

`tests/run.mjs` ejecuta `check.mjs --json` y comprueba que no aparece ningún resultado llamado `git`.

- **Por qué:** es el único punto donde `git` podía reaparecer por copia desde otra rama o desde la documentación antigua.
- **Alternativa descartada:** no testear y confiar en el grep. El nombre del servidor es un literal que ya se coló una vez.

## Risks / Trade-offs

- **Usuarios que ya tengan `git` configurado** → `check.mjs` deja de reportarlo. No se borra ninguna entrada existente: la configuración del usuario no se toca.
- **El README es la única fuente para quien lea la versión publicada anterior** → Mitigación: la retirada queda registrada en el change archivado.
- **Mensajes de CLI en español** → Fuera de alcance; se anota como deuda.

## Migration Plan

1. Editar `setup.mjs` (default), `check.mjs` (lista), `README.md` (texto y ejemplo), `tests/run.mjs` (test).
2. `npm test`, `node scripts/check.mjs`, `openspec validate --strict`.
3. Rollback: revertir el commit; no hay estado persistido.
