# Spec Delta

## REMOVED Requirements

### Requirement: Campo de modo de ejecución en el change
**Reason**: The per-change `execution-mode` field is no longer part of the implemented standard workflow.
**Migration**: Remove `execution-mode` from proposals. Use the standard `@architect` workflow for all changes.

### Requirement: Modo asistido = comportamiento actual con consulta de dudas
**Reason**: The assisted mode and its repeated approval prompts have been superseded by the standard one-approval `@architect` workflow.
**Migration**: Approve the completed design once, then allow the standard workflow to continue automatically without intermediate approval prompts.

### Requirement: Modo automático = decisión interna y delegación automática
**Reason**: Automatic execution is now the standard `@architect` behavior, not a selectable per-change mode.
**Migration**: Use the standard `@architect` workflow after the single design approval; all changes retain the complete review and verification gates.

### Requirement: Elección solo por change
**Reason**: Workflow selection is no longer stored on an individual change.
**Migration**: Use `@architect` for change execution; do not add an `execution-mode` field to `proposal.md`.

### Requirement: El architect tiene la última palabra en modo automático
**Reason**: The automatic-mode distinction and its completion-report field are obsolete.
**Migration**: Follow the current review, verification, and escalation rules in `multiagent-workflow`; stop and report evidence when a required gate fails.
