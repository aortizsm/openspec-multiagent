# add-security-criteria

**Fecha:** 2026-10-25
**Estado:** pendiente de archivar

## Contexto

El workflow multiagente no tiene un gate de revisión de seguridad. El `code-reviewer` evalúa solo criterios de código limpio (nombres, SRP, DRY, longitud, etc.), pero no verifica vulnerabilidades como inyección SQL, XSS, credenciales hardcodeadas o ejecución insegura de funciones. Esto deja vulnerabilidades sin detectar hasta producción.

## Qué cambió

- **Nueva spec `security-criteria`:** 12 criterios objetivos y verificables sin interpretar intención, derivados de patrones OWASP.
- **Nuevo agente `@security-reviewer`:** subagente que evalúa código contra los 12 criterios y devuelve hallazgos etiquetados como CRITICAL, WARNING o SUGGESTION.
- **Loop ampliado:** `@developer → @code-reviewer → @security-reviewer → @verifier → @architect archiva`. El `security-reviewer` es un gate obligatorio antes del `verifier`.
- **`AGENTS.md` actualizado:** tabla de 12 criterios de seguridad junto a la tabla de código limpio.
- **`@developer` y `@code-reviewer` actualizados:** referencias a los criterios de seguridad en sus prompts.
- **`@architect` actualizado:** instrucciones para invocar al `security-reviewer` en el loop.
- **README.md actualizado:** tabla de agentes, diagrama de flujo y orden del loop con el nuevo agente.

## Criterios de seguridad

| # | Criterio | Severidad |
|---|---------|-----------|
| 1 | Sin secretos hardcodeados | CRITICAL |
| 2 | Prevención de inyección SQL | CRITICAL |
| 3 | Prevención de XSS | CRITICAL |
| 4 | Validación de entrada | WARNING |
| 5 | Auth en rutas protegidas | CRITICAL |
| 6 | Sin funciones de ejecución inseguras | CRITICAL |
| 7 | Prevención de path traversal | WARNING |
| 8 | Manejo seguro de errores | WARNING |
| 9 | Protección CSRF | WARNING |
| 10 | Almacenamiento seguro de contraseñas | CRITICAL |
| 11 | Configuración segura de sesiones | WARNING |
| 12 | Headers de seguridad | SUGGESTION |

## Impacto en el workflow

Se inserta un nuevo gate en el loop de implementación:

```
@developer → @code-reviewer → @security-reviewer → @verifier → @architect archiva
```

El `@security-reviewer` evalúa código contra los 12 criterios. Si encuentra hallazgos CRITICAL, el cambio no puede proceder hasta que se corrijan. El `@architect` no archiva sin la aprobación del `@security-reviewer` (check 4 del cierre).

## Migración

No se requiere migración. Es un nuevo agente que se añade al workflow existente. Para usarlo:

1. Ejecutar `npm run install-agents` para instalar `security-reviewer.md` en `~/.config/opencode/agents/`.
2. Reiniciar OpenCode.

El cambio es retrocompatible: si no se instala el agente, el architect seguirá el loop anterior.

## Referencias

- Spec: `openspec/changes/add-security-criteria/specs/security-criteria/spec.md`
- Agente: `opencode/agents/security-reviewer.md`
- Proposal: `openspec/changes/add-security-criteria/proposal.md`
- Design: `openspec/changes/add-security-criteria/design.md`
- Tasks: `openspec/changes/add-security-criteria/tasks.md`
