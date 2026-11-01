# add-codegraph-mandatory-step

## Por qué

El wizard `npx openspec-multiagent init` (`scripts/init.mjs`) no incluía CodeGraph como paso de setup. Context7 y Engram sí se instalaban y configuraban, pero CodeGraph —referenciado en `package.json` como devDependency y ya cableado en `setup.mjs`— faltaba en el wizard que los usuarios ejecutan en sus propios proyectos. Los usuarios que querían CodeGraph debían instalarlo y cablearlo manualmente, lo que rompía la experiencia guiada.

## Decisiones tomadas

- **Paso obligatorio**: CodeGraph es paso 3 del wizard, sin prompt al usuario (al igual que GitHub y Engram en su nivel de obligatoriedad).
- **Instalación automática**: Si `codegraph` no está en PATH, se instala globalmente vía `npm install -g @colbymchenry/codegraph`.
- **Cableado automático**: Se ejecuta `codegraph install --target=opencode --location=global --yes`.
- **Falla rápida**: Si la instalación o el cableado fallan, el wizard sale con `process.exit(1)`.
- **Dry-run seguro**: En modo `--dry-run`, el paso solo informa qué haría, sin ejecutar instalaciones reales (respeta el contrato "nothing will be written").
- **Separación de niveles de abstracción**: Helpers de bajo nivel (`resolveBinary`, `spawnCommand`, `abortWithError`, `failOnError`) encapsulan `which`, `spawnSync` y `process.exit`; las funciones de dominio (`installCodegraphGlobally`, `verifyCodegraphInstalled`, `wireCodegraphToOpencode`) solo contienen lógica de dominio.

## Qué cambió

**`scripts/init.mjs`** (único archivo modificado):
- `TOTAL_STEPS`: 5 → 6
- Nuevo paso 3 obligatorio: "CodeGraph MCP server"
- Context7 pasó de paso 3 a paso 4 (opcional, sin cambios de comportamiento)
- Engram pasó de paso 4 a paso 5 (opcional, sin cambios de comportamiento)
- Verificación pasó de paso 5 a paso 6
- Bloque `--help` documenta los 6 pasos
- Funciones nuevas: `resolveBinary`, `spawnCommand`, `abortWithError`, `failOnError`, `isCodegraphOnPath`, `installCodegraphGlobally`, `verifyCodegraphInstalled`, `ensureCodegraphInstalled`, `wireCodegraphToOpencode`, `installCodeGraph`
- Constante: `CODEGRAPH_BIN = "codegraph"`

**`tests/init-codegraph.test.mjs`** (nuevo): 12 tests (10 de unidad sobre fuente, 2 de integración) que cubren `TOTAL_STEPS`, numeración de pasos, existencia de `installCodeGraph`, instalación global, cableado, manejo de errores y documentación en `--help`.

**`openspec/changes/archive/add-codegraph-mandatory-step/`**: carpeta del change movida a `archive/` tras aprobación.

## Cómo se usa

Ejecutar el wizard en un proyecto:

```bash
npx openspec-multiagent init
```

El paso 3 instalará y cableará CodeGraph automáticamente. Para ejecutar sin cambios (solo informe):

```bash
npx openspec-multiagent init --dry-run
```

## Criterios de éxito

- `init.mjs` tiene 6 pasos; CodeGraph es paso 3 (obligatorio, sin prompt)
- Si `codegraph` no está en PATH, se instala globalmente antes del cableado
- Si el cableado falla, el wizard sale con `process.exit(1)`
- Context7 y Engram siguen siendo opcionales (comportamiento sin cambios)
- `--dry-run` no ejecuta instalaciones reales para el paso CodeGraph
- `--help` documenta los 6 pasos del wizard

## Verificación

- `@test-engineer`: 12 tests creados en `tests/init-codegraph.test.mjs` (10 unitarios sobre fuente, 2 de integración)
- `@code-reviewer`: APROBADO — 0 CRITICAL, 0 WARNING, 1 SUGGESTION aplicada (constante `CODEGRAPH_BIN`)
- `@security-reviewer`: APROBADO — 0 CRITICAL, 0 WARNING, 0 SUGGESTION
- `@verifier`: APROBADO — 6 PASS, 0 FAIL, 2 UNVERIFIABLE (justificados por falta de entorno Node.js en el entorno de verificación)
- Sintaxis verificada con `node --check scripts/init.mjs` → OK
