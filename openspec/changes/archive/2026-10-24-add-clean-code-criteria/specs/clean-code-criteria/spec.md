# Spec Delta

## Purpose

Define los criterios de código limpio del libro "Clean Code" de Robert C. Martin que el `@code-reviewer` debe revisar y el `@developer` debe aplicar. No son sugerencias: son criterios verificables que el reviewer etiqueta con severidad y el developer sigue como parte de la implementación.

## ADDED Requirements

### Requirement: Nombres significativos

Todo símbolo (variable, función, clase, módulo, fichero) MUST tener un nombre que revele su intención.

#### Scenario: Nombre que revela intención
- **WHEN** el `@code-reviewer` revisa una variable, función o clase
- **THEN** verifica que su nombre dice qué representa o qué hace sin necesidad de leer el cuerpo

#### Scenario: Nombre ambiguo o vago
- **WHEN** un símbolo se llama `data`, `info`, `handle`, `process`, `util`, `temp` o similar
- **THEN** el `@code-reviewer` lo marca como `WARNING` y pide un nombre que revele intención

### Requirement: Funciones pequeñas y de responsabilidad única

Las funciones deben ser pequeñas (típicamente menos de 20 líneas de lógica) y hacer una sola cosa. El `@code-reviewer` MUST verificar este criterio y marcarlo como `WARNING` si una función hace más de una cosa o tiene más de 40 líneas de código.

#### Scenario: Función con múltiples responsabilidades
- **WHEN** una función hace más de una cosa (p. ej. valida, transforma y persiste)
- **THEN** el `@code-reviewer` lo marca como `WARNING` y sugiere extraer responsabilidades

#### Scenario: Función excesivamente larga
- **WHEN** una función tiene más de 40 líneas de código (excluyendo comentarios y blank lines)
- **THEN** el `@code-reviewer` lo marca como `WARNING` y pide dividirla

### Requirement: Principio DRY

Cada pieza de conocimiento debe tener una sola representación autoritativa en el código. El `@code-reviewer` MUST verificar este criterio: si la misma lógica aparece en dos sitios, hay que extraerla.

#### Scenario: Lógica duplicada
- **WHEN** el diff contiene dos bloques de código con la misma lógica o semántica
- **THEN** el `@code-reviewer` lo marca como `WARNING` y pide extraer a una función o constante

#### Scenario: Constantes repetidas
- **WHEN** un string mágico, número o regex aparece en múltiples sitios
- **THEN** el `@code-reviewer` lo marca como `SUGGESTION` y pide definir una constante con nombre

### Requirement: Manejo de errores explícito

Los errores se manejan donde ocurren o se propagan con semántica clara. No se usan `try/catch` vacíos, ni se ignoran errores, ni se lanza `Exception` genérica. El `@code-reviewer` MUST marcar errores silenciosos como `CRITICAL`.

#### Scenario: Error silencioso
- **WHEN** un `catch` vacío, un `.catch()` sin argumento, o un `return null/undefined` sin contexto
- **THEN** el `@code-reviewer` lo marca como `CRITICAL`

#### Scenario: Excepción genérica
- **WHEN** se lanza `Exception`, `Error` sin mensaje, o se captura `Exception` genérica
- **THEN** el `@code-reviewer` lo marca como `WARNING`

### Requirement: Comentarios que explican el por qué, no el qué

Los comentarios deben explicar *por qué* se hace algo (la intención, la restricción, la decisión), no *qué* hace el código. El `@code-reviewer` MUST marcar comentarios redundantes como `SUGGESTION`.

#### Scenario: Comentario redundante
- **WHEN** un comentario dice lo mismo que el código ("incrementa el contador" junto a `count++`)
- **THEN** el `@code-reviewer` lo marca como `SUGGESTION` y pide eliminar o reescribir como explicación de intención

#### Scenario: Comentario útil
- **WHEN** un comentario explica una decisión no obvia, una restricción externa o un workaround
- **THEN** el `@code-reviewer` lo considera positivo

### Requirement: Cohesión alta y acoplamiento bajo

Las funciones y módulos deben agrupar lógica relacionada (cohesión alta) y depender de lo mínimo posible de otras partes (acoplamiento bajo). El `@code-reviewer` MUST verificar este criterio.

#### Scenario: Módulo con responsabilidades no relacionadas
- **WHEN** un fichero o módulo contiene lógica de dominios distintos sin separación clara
- **THEN** el `@code-reviewer` lo marca como `WARNING` y sugiere separar

### Requirement: Nivel de abstracción correcto

El código dentro de una función debe estar al mismo nivel de abstracción. El `@code-reviewer` MUST verificar que no se mezclen niveles de abstracción.

#### Scenario: Mezcla de niveles de abstracción
- **WHEN** una función llama a funciones de nivel alto y bajo sin coherencia
- **THEN** el `@code-reviewer` lo marca como `WARNING` y sugiere extraer detalles a funciones auxiliares

### Requirement: El developer aplica código limpio al implementar

El `@developer` MUST escribir código que cumpla los criterios de código limpio definidos en este spec. No basta con que el código funcione: debe ser legible, mantenible y seguir los principios de Clean Code.

#### Scenario: Implementación funcional pero sucia
- **WHEN** el `@developer` entrega código que funciona pero tiene nombres vagos, funciones largas o lógica duplicada
- **THEN** el `@code-reviewer` lo rechaza con los criterios específicos incumplidos

### Requirement: Criterios de código limpio en la revisión

El `@code-reviewer` MUST evaluar los 8 criterios de código limpio en cada revisión.

| Criterio | Severidad por defecto |
|----------|----------------------|
| Nombres significativos | WARNING |
| Funciones pequeñas y SRP | WARNING |
| DRY | WARNING (lógica duplicada), SUGGESTION (constantes) |
| Manejo de errores | CRITICAL (silencioso), WARNING (genérico) |
| Comentarios útiles | SUGGESTION |
| Cohesión/acoplamiento | WARNING |
| Nivel de abstracción | WARNING |

#### Scenario: Review con criterios de código limpio
- **WHEN** el `@code-reviewer` revisa un cambio
- **THEN** evalúa los 8 criterios de código limpio y etiqueta cada hallazgo con la severidad correspondiente
