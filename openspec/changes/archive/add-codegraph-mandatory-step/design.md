## Status

Draft

## Executive Summary

Add a mandatory CodeGraph MCP server installation and wiring step to `scripts/init.mjs`, making it obligatory like GitHub and Engram. The step does not prompt the user; it installs the binary if missing and wires it to OpenCode, failing the wizard on error.

## Artifacts

- `openspec/changes/add-codegraph-mandatory-step/proposal.md`
- `openspec/changes/add-codegraph-mandatory-step/design.md`
- `openspec/changes/add-codegraph-mandatory-step/tasks.md`
- `scripts/init.mjs` (modified)

## Risks

- `npm install -g @colbymchenry/codegraph` may fail if the user lacks global install permissions.
- `codegraph install` may fail if OpenCode configuration is not writable.
- Both failures must abort the wizard with a clear error message (mandatory step, no fallback).

## Next Recommended

Implement the tasks in tasks.md after user approval.
