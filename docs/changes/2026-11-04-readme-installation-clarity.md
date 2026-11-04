# readme-installation-clarity

**Fecha:** 2026-11-04  
**Estado:** implementado

## Contexto

Un usuario no podía instalar el workflow en otro PC. El README.md solo decía `npx openspec-multiagent init` sin explicar cómo poner `openspec-multiagent` disponible en una máquina limpia, por lo que los usuarios terminaban entrando en `scripts/` y ejecutando archivos manualmente, lo que era confuso y propenso a error. La sección "Quick start" era un único comando sin contexto ni distinción entre "este repo" y el "proyecto de destino".

## Qué cambió

Se reescribe la sección "Quick start" de `README.md` como una guía de instalación numerada y copy-pasteable desde cero:

- **`README.md`:** sección "Quick start" reescrita con cuatro pasos:
  1. Paso 1: Instala Node.js (>= 20.19.0).
  2. Paso 2: Clona o descarga este repositorio.
  3. Paso 3: Verifica prerrequisitos (`node scripts/setup.mjs` o `npm run setup`).
  4. Paso 4: Inicializa tu proyecto de destino (`npx openspec-multiagent init`).
- Se aclara la diferencia entre "este repo" (fuente del workflow) y "el proyecto de destino" (donde se ejecuta `init`).
- Se añade un puntero a los comandos diarios listados en la sección "npm scripts".
- El resto del contenido del README (agentes, servidores MCP, modos, requisitos, npm scripts, licencia) se conserva intacto.

## Por qué

| Decisión | Razonamiento |
|----------|--------------|
| Pasos numerados y copy-pasteables | Criterio de éxito del change: un usuario nuevo debe instalar desde cero en otro PC sin entrar en `scripts/`. |
| Separar "este repo" del "proyecto de destino" | Esa diferencia no estaba clara y generaba confusión sobre dónde ejecutar cada comando. |
| Mantener el resto del README intacto | El scope del change abarca solo la sección de instalación; se preservan agentes, MCP, modos, requisitos y licencia. |

## Cómo se usa

```
1. Instala Node.js >= 20.19.0:  node --version   # debe ser >= 20.19.0
2. Clona el repositorio:        git clone https://github.com/aortizsm/openspec-multiagent.git
                                cd openspec-multiagent
3. Verifica prerrequisitos:     npm run setup   (o: node scripts/setup.mjs)
4. En tu proyecto de destino:   npx openspec-multiagent init   (no en este repo)
```

Luego inicia OpenCode en ese directorio y describe tu cambio a `@architect`. `@architect` lo convierte en un spec de OpenSpec y comienza el loop de cambios.

## Impacto / Migración

- **No es breaking change:** solo se reescribe documentación del "Quick start"; no cambia el comportamiento ni los comandos.
- Los comandos existentes (`npm run setup`, `npx openspec-multiagent init`) se mantienen sin cambios.
- **Sin migración requerida:** ningún archivo de configuración ni flujo de trabajo existente se ve afectado.

## Evidencia

- `README.md` renderiza correctamente: markdown válido, secciones numeradas y enlaces formateados.
- Enlaces válidos: https://nodejs.org y https://github.com/aortizsm/openspec-multiagent.git.
- `tasks.md` ("Verify file renders correctly (no broken markdown)") se cumple.
- `git diff` afecta solo los archivos del change: `README.md` (sección "Quick start"), `docs/changes/2026-11-04-readme-installation-clarity.md` (nueva entrada) y `docs/CHANGELOG.md` (+1 línea enlazando la entrada). Sin cambios en código ejecutable ni en configuración.
