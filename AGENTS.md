# OpenSpec Multiagent — Convenios de Flujo

## Aprobación del Architect (solo para `@architect`)

Cuando el architect necesita aprobación del usuario para avanzar a implementación o archivar un cambio:

1. **Usar `question` tool con opciones**, NUNCA pedir que el usuario escriba una palabra específica.
   ```
   question(questions: [{
     question: "¿Aprobado para implementar/archivar?",
     header: "Decision",
     options: [
       { label: "✅ Aprobado", description: "Seguir adelante con la implementación" },
       { label: "🔄 Revisar cambios", description: "Modificar aspectos antes de continuar" },
       { label: "❌ Rechazar", description: "No proceder con este cambio" }
     ]
   }])
   ```
2. **Aceptar cualquier respuesta natural** de aprobación: "sí", "approved", "adelante", "hazlo", la opción del menú, etc. La restricción de "solo la palabra 'approved'" es rigidez innecesaria — el punto es que el usuario decida explícitamente.
3. **Nunca** decir "escribe approved" o pedir palabras mágicas.

## Idioma

- Conversación con el usuario: **español**
- Specs de OpenSpec: **inglés** (convención existente del proyecto)

## Código limpio

El `@code-reviewer` evalúa 12 criterios objetivos (spec `clean-code-criteria`) en cada revisión. El `@developer` los aplica al implementar. Los criterios son verificables sin interpretar intención.

| # | Criterio | Regla objetiva | Severidad |
|---|---------|----------------|-----------|
| 1 | Nombres prohibidos | Prohibido: `data`, `info`, `result`, `temp`, `item`, `value`, `obj`, `val`, `res`, `arr`, `list`, `handle`, `process`, `util`, `helper`, `doSomething`, `thing`, `stuff`. Debe contener sustantivo descriptivo. | WARNING |
| 2 | Límite de líneas | Máx 30 líneas/función. Si > 15 → dividir en helpers de máx 15. | WARNING |
| 3 | SRP | No combinar validación + transformación + persistencia en una función. | WARNING |
| 4 | DRY | > 5 líneas de misma lógica en 2+ sitios → extraer. Literal en 3+ sitios → constante. | WARNING / SUGGESTION |
| 5 | Anti-patrones de error | Prohibido: `catch {}`, `.catch()` sin arg, `return null` sin explicación, `throw new Error()` sin mensaje. | CRITICAL / WARNING |
| 6 | Comentarios | Prohibido: `// incrementa`, `// decrementa`, `// asigna`, `// devuelve`, `// verifica`, `// procesa`, `// filtra`, `// mapea`, `// cuenta`, `// compara`, `// guarda`, `// carga`. Explican WHY, no WHAT. | SUGGESTION |
| 7 | Un dominio por fichero | No mezclar auth + UI + DB en un fichero. | WARNING |
| 8 | Un nivel de abstracción | No mezclar operaciones de dominio (`getUser`, `saveOrder`, `sendEmail`) con bajo nivel (`json.parse`, `JSON.stringify`, `fs.readFileSync`, `new Date`, `Math.floor`, `Array.prototype.*`, `Object.*`, `String.prototype.*`). | WARNING |
| 9 | Máx 3 parámetros | Máx 3 parámetros/función. Si > 3 → agrupar en objeto/DTO. | WARNING |
| 10 | Sin booleanos como flags | Si un booleano cambia el comportamiento → dividir en dos funciones. | WARNING |
| 11 | Extraer condicionales | > 2 condiciones en `if`/`while`/`&&`/`||` → extraer a función con nombre. | WARNING |
| 12 | Nombres positivos booleanos | Prohibido prefijos negativos: `not`, `no`, `un`, `in`, `isNot`, `hasNo`, `doNot`, `dont`. Usar `is`, `has`, `can`, `should`, `was`. | WARNING |

- No basta con que el código funcione: debe ser legible, mantenible y seguir los criterios objetivos del spec.
- DRY aplica a duplicación real, no a posibilidades futuras (YAGNI sigue vigente).

## Criterios de seguridad

El `@security-reviewer` evalúa 12 criterios objetivos (spec `security-criteria`) en cada revisión. Los criterios son verificables sin interpretar intención.

| # | Criterio | Regla objetiva | Severidad |
|---|---------|----------------|-----------|
| 1 | Sin secretos hardcodeados | Prohibido: claves de proveedor cloud (`AKIA...`, `AIza...`, `00...`), API keys genéricas (`sk-...`, `Bearer ...`), contraseñas hardcodeadas (`password = '...'`, `secret = '...'`). | CRITICAL |
| 2 | Prevención de inyección SQL | Prohibido: palabras clave SQL (`SELECT`, `INSERT`, `UPDATE`, `DELETE`, `DROP`) combinadas con concatenación (`+`, `.`, `.`) o interpolación (`${`, `%s`, `%d`). Usar binding (`?`, `:name`, `$1`) u ORM. | CRITICAL |
| 3 | Prevención de XSS | Prohibido: `.innerHTML`, `.outerHTML`, `.insertAdjacentHTML`, `document.write` con datos controlados por usuario. Variables en templates HTML deben pasar por función de escape (`esc()`, `escape()`, `htmlEncode()`). | CRITICAL |
| 4 | Validación de entrada | Todo endpoint que acepte entrada de usuario (params, upload, headers, body) debe tener reglas de validación explícitas (tipo, longitud, formato, rango). Uploads deben validar tipo, tamaño y nombre. | WARNING |
| 5 | Auth en rutas protegidas | Todo POST/PUT/DELETE/PATCH y toda ruta que acceda a datos sensibles debe tener guard/auth middleware. Sin session/token → 401 o 302. | CRITICAL |
| 6 | Sin funciones de ejecución inseguras | Prohibido: `eval(`, `assert(`, `exec(`, `system(`, `passthru(`, `shell_exec(`, `proc_open(`, `spawn(`, `execSync(` con entrada de usuario. | CRITICAL |
| 7 | Prevención de path traversal | Operaciones de archivo con entrada de usuario deben validar: sin `..` o resueltas contra directorio base (`realpath`, `path.resolve`, `normalize`). Downloads deben whitelistear extensiones. | WARNING |
| 8 | Manejo seguro de errores | Prohibido: `var_dump(`, `print_r(`, `debug_print_backtrace(`, `console.log(` con variables sensibles fuera de tests. Respuestas de error sin stack traces ni SQL queries. | WARNING |
| 9 | Protección CSRF | Todo POST/PUT/DELETE/PATCH debe tener validación CSRF (token, origin/referrer, o SameSite cookie). GET no debe modificar estado. | WARNING |
| 10 | Almacenamiento seguro de contraseñas | Passwords deben usar `password_hash`, `bcrypt.hash`, `argon2`, `scrypt`, `pbkdf2`. Prohibido: almacenamiento en texto plano, MD5/SHA1/SHA256 solo. | CRITICAL |
| 11 | Configuración segura de sesiones | Cookies de sesión deben tener `HttpOnly = true`, `Secure = true` (producción), `SameSite = Lax` o `Strict`. | WARNING |
| 12 | Headers de seguridad | Respuestas HTTP deben incluir mínimo `X-Content-Type-Options: nosniff` y `X-Frame-Options: DENY` o `SAMEORIGIN`. | SUGGESTION |

- No basta con que el código sea seguro: debe seguir los criterios objetivos del spec.

## Documentación para humanos

- `docs/` contiene la documentación para humanos, en español: `docs/CHANGELOG.md` (índice), `docs/changes/YYYY-MM-DD-<change>.md` (una entrada por change) y `docs/guides/<capability>.md` (uso por capacidad). La estructura y las fuentes están en `docs/README.md`.
- Un change que altera comportamiento, configuración o uso incluye una task de documentación ejecutada por `@developer`: la entrada de `docs/changes/` y la actualización de `docs/guides/` van en el mismo diff que el código.
- La entrada se deriva de `proposal.md`, `design.md`, `tasks.md`, el diff y el reporte del `@verifier`. No se inventa comportamiento.
- Un change sin efecto observable (refactor interno, errata en un prompt) no exige entrada; la decisión se registra en `tasks.md`. Si es visible para el usuario, se añade una línea a `docs/CHANGELOG.md`.
- `@code-reviewer` comprueba la exactitud contra el diff; no evalúa estilo, tono ni redacción.
- `docs/` se escribe en español; `openspec/specs/` y `README.md` siguen en inglés.

## Checklist de cierre (Pre-archive gate)

Antes de archivar un cambio, @architect debe verificar estos items. Si alguno falla, no archivar:

| # | Check | Comando / Verificacion |
|---|-------|----------------------|
| 1 | `openspec validate` pasa | `openspec validate` (exit 0) |
| 2 | No hay diff inesperado | `git diff` solo afecta archivos del change |
| 3 | Reporte del `@verifier` limpio | Sin `FAIL` y sin `UNVERIFIABLE` injustificados |
| 4 | `@security-reviewer` aprobó | Sin hallazgos CRITICAL pendientes |
| 5 | Spec sync sin conflictos | Los deltas del change no chocan con spec main |
| 6 | `## Purpose` completo | No queda "TBD" ni placeholder en el spec archivado |
| 7 | Documentación del change visible | Existe `docs/changes/<fecha>-<change>.md` con las seis secciones, está enlazada en `docs/CHANGELOG.md` y `docs/guides/<capability>.md` está al día (`git diff -- docs/`) |

Si algun check falla, el architect envia al developer a corregir antes de reintentar el archive.

## Orden del loop

```
@developer  →  @test-engineer  →  @code-reviewer  →  @security-reviewer  →  @verifier  →  @architect archiva
```

Si el cambio incluye UI/UX, se inserta `@ux-designer` antes de `@developer`:

```
@ux-designer  →  @developer  →  @test-engineer  →  @code-reviewer  →  @security-reviewer  →  @verifier  →  @architect archiva
```

`@ux-designer` genera wireframes (ASCII), especifica tokens de diseño y revisa requisitos de UX en el spec. Solo actúa cuando el cambio incluye UI.

`@test-engineer` es **automático**: siempre corre después de `@developer` para escribir tests unitarios e integración desde los scenarios del spec. Complementa los tests de `@developer` cubriendo edge cases y scenarios que el developer podría haber pasado por alto.

- `@code-reviewer` aprueba o pide cambios. Su verificacion de tests es obligatoria, pero **no** sustituye al `@verifier`.
- `@security-reviewer` evalúa los 12 criterios de seguridad. Si encuentra hallazgos CRITICAL, el cambio no puede proceder hasta que se corrijan.
- `@verifier` ejecuta los comandos reales y devuelve un veredicto por escenario de la spec. Un `FAIL` devuelve el trabajo al `@developer`.
- Si el `@developer` cambia codigo despues de un reporte limpio, el reporte caduca: hace falta verificacion nueva.
- Nadie mas archiva.

## Pre-review gate

Antes de enviar al @code-reviewer, el architect verifica:

- [ ] El @developer reporto que todos los checks pasaron
- [ ] Hay un diff concreto para revisar (`git diff`)
- [ ] El change tiene tasks.md con items completados

## OpenSpec tooling — nombres correctos

Los skills de OpenSpec usan el **CLI** (`Bash(openspec:*)`). No inventar tools MCP.

| Acción | CLI (usar esto) | Tool MCP (solo si el skill lo pide) |
|--------|-----------------|-------------------------------------|
| Crear change | `openspec new change <name>` | `openspec_create_change` |
| Listar | `openspec list` / `openspec list --specs` | `openspec_list_specs` |
| Ver | `openspec show <name>` | — |
| Validar | `openspec validate [<name>]` | — |
| Archivar | `openspec archive <name>` | — |

**No existe** `openspec_new_change` ni `openspec_change_new`. Si una llamada falla con "Unknown tool", usar el CLI en vez del MCP.
