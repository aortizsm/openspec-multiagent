# Refactor: MCP servers con default sí en el instalador

## Why

Los MCP servers de filesystem, git y github son útiles para desarrollo agentizado pero con default "no" pasan desapercibidos. El usuario pidió que no pasen desapercibidos solo por ser opcionales, por lo que el default cambia a "sí" para que se instalen a menos que el usuario diga explícitamente que no.

## What Changes

Cambiar `defaultYes: false` a `defaultYes: true` en las tres preguntas de MCP servers en `scripts/setup.mjs`:
- filesystem: lectura/escritura de archivos del proyecto
- git: diffs, log, blame, ramas
- github: PRs, issues, releases (con solicitud de GITHUB_TOKEN si se acepta)

El flag `--no-mcp` sigue omitiendo todo el paso. Si un MCP ya está configurado, se salta sin preguntar.

## Impact

- [x] Breaking changes — no (cambia solo el default de una pregunta interactiva)
- [x] Database migrations — no
- [x] API changes — no

## Delta

## ADDED
(none)

## MODIFIED
- `scripts/setup.mjs`: línea 229, `defaultYes: false` → `defaultYes: true` para las 3 preguntas de MCP servers (filesystem, git, github)

## REMOVED
(none)

## RENAMED
(none)
