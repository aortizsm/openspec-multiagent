# Guía de verificación independiente

## Qué es

El agente `@verifier` es el cuarto rol del loop del workflow. Ejecuta los comandos reales del proyecto (tests, build, lint, typecheck, arranque en seco) y devuelve un reporte por escenario de la spec con veredicto `PASS`, `FAIL` o `UNVERIFIABLE`.

## Cuándo se invoca

Después de que `@code-reviewer` apruebe y antes de que `@architect` archive. El orden del loop es:

```
@developer → @code-reviewer → @verifier → @architect archiva
```

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

- **`FAIL`:** el `@architect` NO archiva. Reenvía la evidencia al `@developer` y se repite el loop desde `@code-reviewer`.
- **`UNVERIFIABLE`:** debe justificarse (el escenario no es automatizable, el proyecto no tiene tests, etc.) o resolverse añadiendo la evidencia que falte.
- **Código cambiado tras verificación limpia:** el reporte caduca. El `@architect` exige nueva verificación.

## Instalación

El `@verifier` se instala automáticamente con `npm run install-agents` (copia cualquier `*.md` de `opencode/agents/` al directorio global). Requiere reiniciar OpenCode.
