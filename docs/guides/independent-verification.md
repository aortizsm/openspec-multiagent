# Guía de verificación independiente

Para ver el flujo completo y los límites de los nueve agentes del repositorio, consulta la [guía del workflow de agentes](agent-workflow.md).

## Qué es

El agente `@verifier` ejecuta la verificación independiente después de la fase de calidad. Ejecuta los comandos reales del proyecto (tests, build, lint, typecheck, arranque en seco) y devuelve un reporte por escenario de la spec con veredicto `PASS`, `FAIL` o `UNVERIFIABLE`.

## Cuándo se invoca

En el flujo estándar de `@architect`, después de que `@developer` complete la implementación, `@test-engineer` genere las pruebas y los dos revisores terminen correctamente en paralelo, antes de que `@architect` archive. El orden del loop es:

```
@developer → @test-engineer → [@code-reviewer + @security-reviewer] → @verifier → @architect archiva
```

`@test-engineer` termina antes de que empiecen los dos revisores, que se ejecutan concurrentemente. `@verifier` no se inicia hasta que la fase secuencial de pruebas y ambos revisores hayan terminado con éxito. Si alguna fase falla, no se ejecutan las siguientes.

Cada ejecución del orquestador comienza en `@developer`. La opción `--from` fue retirada y ambos formatos (`--from <agent>` y `--from=<agent>`) se rechazan. Tras corregir una falla, volver a ejecutar `node scripts/orchestrate.mjs <change-name>` para pasar otra vez por el pipeline completo.

## Consolidación de hallazgos y rondas de corrección

Cuando termina la secuencia de calidad (`@test-engineer` primero; los revisores paralelos se ejecutan cuando su predecesor tuvo éxito), `@architect` reúne todos los hallazgos accionables reportados por los agentes que se ejecutaron en un único bundle ordenado para `@developer`. Registra cada hallazgo en `## Review Findings` del `tasks.md` del change con ID estable, origen, severidad, criterio/escenario, fichero y ubicación, corrección solicitada, estado (`open`, `resolved` o `not adopted`) y evidencia de cierre o justificación.

Solo se fusionan hallazgos con la misma causa raíz; la entrada combinada enumera todos los orígenes y conserva la severidad más alta. Causas distintas permanecen separadas. Tras la respuesta del developer, `@architect` actualiza el estado y la evidencia. Un hallazgo resuelto no se reabre sin evidencia nueva; una `SUGGESTION` declinada requiere justificación y no bloquea el archivo. Los hallazgos `CRITICAL` y `WARNING` requeridos sí lo bloquean hasta su resolución.

Cada bundle seguido de una corrección inicia una ronda. Se repite toda la secuencia de calidad (`@test-engineer`, luego `@code-reviewer` y `@security-reviewer` en paralelo); `@verifier` corre después solo cuando todos los agentes de calidad tienen éxito. Un `FAIL` del verifier, con el escenario y su evidencia, se incorpora al siguiente bundle solo si aún se permite otra ronda. Se permiten como máximo tres rondas; si siguen abiertos hallazgos obligatorios después de la tercera, `@architect` se detiene, presenta el ledger al usuario y no archiva. Si `@verifier` informa `FAIL` después de la tercera ronda, `@architect` registra y reporta el escenario fallido y su evidencia, no inicia una cuarta ronda y no archiva. La secuencia completa de calidad, el verifier y los demás gates de validación y archivo siguen siendo obligatorios.

## Qué ejecuta

El `verifier` descubre los comandos del proyecto desde `AGENTS.md`, el manifiesto (`package.json`, `composer.json`, `pyproject.toml`, `Makefile`, etc.) o `@repo-scout`. **No inventa comandos.**

### Stack soportados

| Stack | Comandos |
|-------|----------|
| Node.js | `npm test`, `pnpm test`, `yarn test`, `bun test`, `npm run build`, `npm run lint`, `npm run typecheck`, `npm run check`, `tsc`, `eslint`, `npx tsc`, `npx eslint` |
| PHP | `composer test`, `composer run-script test`, `vendor/bin/phpunit`, `php artisan test` |
| Python | `pytest`, `python -m pytest`, `python3 -m pytest`, `ruff check`, `mypy`, `python -m mypy` |
| Go | `go test`, `go build`, `go vet` |
| Rust | `cargo test`, `cargo build`, `cargo check`, `cargo clippy` |
| Java (Maven) | `mvn test`, `mvn verify`, `./mvnw test`, `./mvnw verify` |
| Java (Gradle) | `./gradlew test`, `./gradlew build`, `./gradlew check` |
| .NET | `dotnet test`, `dotnet build` |
| Make | `make test`, `make build`, `make lint`, `make check`, `make smoke` |

### Qué NO ejecuta

- Migraciones de base de datos, seeders.
- Despliegues, `docker compose up`.
- Instalar dependencias (`npm install`, `composer install`, etc.).
- Cualquier comando que escriba o muten estado compartido.

Si un escenario requiere algo fuera de alcance, el `verifier` reporta `UNVERIFIABLE` y escala al `@architect`.

## Cómo se lee su reporte

```
## Verification Report: add-verifier-agent

Commands run:
- openspec validate add-verifier-agent --strict -> exit 0
- npm test -> exit 0

| Scenario | Verdict | Evidence |
|----------|---------|----------|
| independent-verification :: Reporte del developer no es prueba | PASS | npm test passed (24 tests, 0 failed) |
| ... | ... | ... |

Summary: 5 PASS, 0 FAIL, 0 UNVERIFIABLE
Blocking: none
Notes: ...
```

### Interpretar los veredictos

| Veredicto | Significado | Acción |
|-----------|-------------|--------|
| **PASS** | El escenario está cubierto por evidencia observable | Continuar |
| **FAIL** | Un test o comprobación contradice el escenario | El `@architect` devuelve el trabajo al `@developer` |
| **UNVERIFIABLE** | No se pudo comprobar (falta cobertura, dependencia ausente, etc.) | El `@architect` exige justificación o resolución antes de archivar |

## Qué hacer con un fallo

- **`FAIL`:** el `@architect` NO archiva. Antes de completar tres rondas, reenvía la evidencia al `@developer`; después de corregir, reinicia el flujo desde `@developer`, ejecuta `@test-engineer` y luego los dos revisores en paralelo; si todos tienen éxito, ejecuta de nuevo `@verifier`. Si el `FAIL` ocurre después de la tercera ronda, registra y reporta el escenario y la evidencia, no inicia una cuarta ronda y no archiva.
- **`UNVERIFIABLE`:** debe justificarse (el escenario no es automatizable, el proyecto no tiene tests, etc.) o resolverse añadiendo la evidencia que falte.
- **Código cambiado tras verificación limpia:** el reporte caduca. El `@architect` exige nueva verificación.

## Instalación

El `@verifier` se instala automáticamente con `npm run install-agents` (copia cualquier `*.md` de `opencode/agents/` al directorio global). Requiere reiniciar OpenCode.
