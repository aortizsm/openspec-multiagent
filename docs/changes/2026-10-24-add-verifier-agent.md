# add-verifier-agent

**Fecha:** 2026-10-24  
**Estado:** archivado

## Contexto

En el loop del workflow, el `developer` es el autor del cambio y también quien ejecuta los tests. El `code-reviewer` puede *pedirle* que los corra, pero su prompt lo declara opcional. El resultado: la evidencia de que el trabajo funciona depende del auto-reporte del implementador.

Además, `openspec validate` valida la sintaxis de la spec, no el comportamiento. No existe ningún agente que mapee `escenario de la spec → evidencia observable`.

## Qué cambió

- **Nuevo agente `@verifier`:** subagente independiente que ejecuta los comandos reales del proyecto y devuelve un reporte por escenario con veredicto `PASS` / `FAIL` / `UNVERIFIABLE`.
- **Verificación independiente:** el `verifier` no acepta el auto-reporte del `developer`; ejecuta los tests y build por sí mismo.
- **Loop ampliado:** `developer → code-reviewer → verifier → architect archiva`.
- **Verificación del reviewer obligatoria:** deja de ser "optional but recommended".
- **Check 3 del cierre:** el `architect` exige un reporte del `verifier` sin `FAIL` ni `UNVERIFIABLE` injustificados.
- **§E de `architect.md` corregido:** archivar solo con aprobación del reviewer + reporte del verifier limpio + `openspec validate --strict` + diff acotado.

## Por qué

| Mejora | Fallo observado |
|--------|----------------|
| Verificador independiente | Nadie confirma que los tests pasan de verdad |
| Build y arranque | El reviewer solo tiene permisos de test, no de build |
| Mapeo escenario→evidencia | `openspec validate` no prueba comportamiento |
| Loop con verifier | El architect archivaba con solo la aprobación del reviewer |

## Cómo se usa

El `@verifier` se instala automáticamente con `npm run install-agents` (copia cualquier `*.md` de `opencode/agents/`).

**Qué ejecuta:**

| Stack | Comandos permitidos |
|-------|-------------------|
| Node.js | `npm test`, `pnpm test`, `yarn test`, `bun test`, `npm run build`, `npm run lint`, `npm run typecheck`, `tsc`, `eslint` |
| PHP | `composer test`, `vendor/bin/phpunit`, `php artisan test` |
| Python | `pytest`, `python -m pytest`, `ruff check`, `mypy` |
| Go | `go test`, `go build`, `go vet` |
| Rust | `cargo test`, `cargo build`, `cargo clippy`, `cargo check` |
| Java | `mvn test`, `mvn verify`, `./mvnw test`, `./gradlew test`, `./gradlew build` |
| .NET | `dotnet test`, `dotnet build` |
| Make | `make test`, `make build`, `make lint`, `make check` |

**Qué NO ejecuta:** migraciones de base de datos, seeders, despliegues, `docker compose up`, instalar dependencias.

**Cómo se lee su reporte:**

```
## Verification Report: <change-name>

Commands run:
- npm test -> exit 0

| Scenario | Verdict | Evidence |
|----------|---------|----------|
| ... :: ... | PASS | npm test passed (24 tests) |

Summary: 5 PASS, 0 FAIL, 0 UNVERIFIABLE
Blocking: none
```

- `PASS`: el escenario está cubierto por evidencia.
- `FAIL`: un test o comprobación contradice el escenario (incluye la salida).
- `UNVERIFIABLE`: no se pudo comprobar (falta cobertura, dependencia ausente, etc.). Incluye la causa.

## Impacto / Migración

- **Nuevo agente en el loop:** si se usa un proyecto sin `@verifier`, el `architect` seguirá el loop anterior. No es un breaking change.
- **Requiere reinstalación:** `npm run install-agents` + reinicio de OpenCode.
- **Sin dependencias nuevas:** el `verifier` es un fichero markdown.

## Evidencia

- `openspec validate add-verifier-agent --strict`: válido.
- `npm test`: 24/24 pasan.
- Diff acotado a `opencode/agents/verifier.md`, `opencode/agents/architect.md`, `opencode/agents/code-reviewer.md` y `AGENTS.md`.
