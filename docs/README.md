# Documentación del proyecto

## Estructura

```
docs/
├── CHANGELOG.md              ← índice cronológico
├── changes/                  ← una entrada por change archivado
│   └── YYYY-MM-DD-<change>.md
└── guides/                   ← manual de uso por capacidad
    └── <capability>.md
```

## Cómo escribir una entrada de changelog

Cada entrada de `docs/changes/YYYY-MM-DD-<change>.md` se deriva de los artefactos del change, **no se inventa**. Fuentes:

1. `openspec/changes/<change>/proposal.md` — el *por qué*.
2. `openspec/changes/<change>/design.md` — decisiones y alternativas descartadas.
3. `openspec/changes/<change>/tasks.md` — qué se tocó.
4. El diff real — qué existe.
5. El reporte del `@verifier` (si existe) — evidencia.

### Secciones obligatorias

| Sección | Qué contiene |
|---------|-------------|
| **Contexto** | Qué problema o necesidad motivó el cambio |
| **Qué cambió** | Resumen de los cambios observables |
| **Por qué** | Decisiones clave y alternativas descartadas |
| **Cómo se usa** | Instrucciones concretas (comandos, ficheros, permisos) |
| **Impacto / Migración** | Qué afecta, cómo migrar, breaking changes |
| **Evidencia** | Veredicto del verifier, tests, validación |

Si una sección no aplica (p. ej. sin migración), dilo explícitamente:

> **Impacto / Migración:** ninguno. Este change es un refactor interno sin efecto observable.

### Idioma

`docs/` en **español**. Nombres de ficheros, rutas y comandos en su forma literal.

### Reglas

- Un change que no altera comportamiento, configuración ni uso no exige entrada; la decisión se registra en `tasks.md`.
- Si es visible para el usuario, se añade una línea a `docs/CHANGELOG.md`.
- `@code-reviewer` verifica que la doc coincide con el diff (exactitud, no estilo).
