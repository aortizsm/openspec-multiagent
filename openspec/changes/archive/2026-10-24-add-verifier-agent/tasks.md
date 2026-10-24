# Tasks

## 1. Agente `verifier`

- [x] 1.1 Crear `opencode/agents/verifier.md` con frontmatter `mode: subagent`, permisos `edit: deny`, `read/glob/grep: allow`, `subagent: repo-scout` y una allowlist de `shell` con comandos de test, build, lint, typecheck y arranque por stack. Verificado: el fichero existe, `edit` es `deny` y la allowlist cubre npm, pnpm, yarn, bun, composer, phpunit, artisan, pytest, go, cargo, dotnet, maven, gradle, make, tsc, eslint, ruff y mypy.
- [x] 1.2 Redactar el rol: verificar de forma independiente, no confiar en el reporte del `developer`, no inventar comandos, no ejecutar migraciones ni comandos que muten estado, no escribir ni commitear. Verificado por lectura del fichero.
- [x] 1.3 Documentar el contrato de salida: una fila por escenario con `PASS` / `FAIL` / `UNVERIFIABLE`, evidencia (salida de comando o test citado) y el comando ejecutado. Incluye plantilla de reporte y la regla de que un veredicto global sin desglose no es aceptable.
- [x] 1.4 Añadir la política de memoria: no lee ni escribe Engram, igual que `code-reviewer`. Verificado.

## 2. Integración en el loop

- [x] 2.1 En `opencode/agents/architect.md`, insertar el paso del `verifier` entre la aprobación del `code-reviewer` y el archivo, con la regla de que un `FAIL` devuelve el trabajo al `developer` y un `UNVERIFIABLE` debe justificarse o resolverse. Verificado: el loop pasa a 7 pasos con la verificación como paso 5.
- [x] 2.2 En `architect.md`, exigir nueva verificación si el `developer` cambia código después de un reporte limpio. Incluido en el paso 5 ("A stale report is not evidence").
- [x] 2.3 En `opencode/agents/code-reviewer.md`, cambiar la verificación de "optional but recommended" a obligatoria antes de aprobar. Verificado: la sección pasa a llamarse `Verification (mandatory)` y cita al `@verifier` como el paso independiente posterior.
- [x] 2.4 En `architect.md` §E, alinear el cierre con el nuevo loop: archivar solo con aprobación del reviewer, reporte del verifier limpio, `openspec validate --strict` y diff acotado. Corregido el texto previo que archivaba solo con la aprobación del reviewer.

## 3. Checklists

- [x] 3.1 En `AGENTS.md`, añadir al `Checklist de cierre` la exigencia de un reporte del `verifier` sin `FAIL` y sin `UNVERIFIABLE` injustificados. Ocupa el check 3.
- [x] 3.2 En `AGENTS.md`, documentar el orden del loop (`developer → code-reviewer → verifier → archivo`) para que no se invoque al verifier en el momento equivocado. Añadida la sección `Orden del loop`.

## 4. Verificación del cambio

- [x] 4.1 Ejecutar `openspec validate add-verifier-agent --strict` y confirmar que pasa. Resultado: `Change 'add-verifier-agent' is valid`.
- [x] 4.2 Ejecutar `npm test` y confirmar que pasa. Resultado: 24 pasan, 0 fallan.
- [ ] 4.3 Reinstalar los agentes (`npm run install-agents`) y confirmar que `verifier.md` aparece en `~/.config/opencode/agents/`. Pendiente: el `architect` no tiene permiso para ejecutar el instalador; lo lanza el usuario.
- [ ] 4.4 Checklist manual en un proyecto de prueba: el `architect` invoca al `verifier`, el reporte lista los escenarios de la spec con veredicto y evidencia, y un `FAIL` devuelve el trabajo al `developer`. Pendiente: requiere la instalación del paso 4.3.
