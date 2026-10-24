# clean-code-criteria Specification

## Purpose

Define los criterios de código limpio que el `@code-reviewer` debe revisar y el `@developer` debe aplicar. Los criterios son objetivos y verificables: no requieren interpretar intención, solo comparar el código contra reglas concretas.

## Requirements

### Requirement: Nombres prohibidos

Todo símbolo (variable, función, clase, módulo, fichero) MUST evitar estos nombres: `data`, `info`, `result`, `temp`, `item`, `value`, `obj`, `val`, `res`, `arr`, `list`, `handle`, `process`, `util`, `helper`, `doSomething`, `thing`, `stuff`. Un nombre válido MUST contener al menos un sustantivo descriptivo.

#### Scenario: Nombre prohibido detectado
- **WHEN** el diff contiene un símbolo con uno de los 18 nombres prohibidos
- **THEN** el `@code-reviewer` lo marca como `WARNING` y pide un nombre con sustantivo descriptivo

#### Scenario: Nombre válido
- **WHEN** un símbolo se llama `userList`, `configPath`, `errorMessage`, `orderTotal`
- **THEN** el `@code-reviewer` lo considera válido

### Requirement: Límite de líneas por función

Una función MUST tener máximo 30 líneas de código (excluyendo comentarios y blank lines). Si supera 15 líneas, el `@developer` debe dividirla en funciones auxiliares de máximo 15 líneas cada una.

#### Scenario: Función dentro del límite
- **WHEN** una función tiene 30 líneas o menos (excluyendo comentarios y blank lines)
- **THEN** el `@code-reviewer` lo considera válido

#### Scenario: Función excesivamente larga
- **WHEN** una función tiene más de 30 líneas de código (excluyendo comentarios y blank lines)
- **THEN** el `@code-reviewer` lo marca como `WARNING` y pide dividirla

### Requirement: Responsabilidad única (SRP)

Una función MUST hacer una sola cosa. Se considera que hace más de una cosa si combina validación + transformación + persistencia.

#### Scenario: Función con múltiples responsabilidades
- **WHEN** una función valida entrada, transforma datos y persiste en base de datos
- **THEN** el `@code-reviewer` lo marca como `WARNING` y pide extraer cada responsabilidad

### Requirement: DRY — duplicación detectable

Si un bloque de más de 5 líneas con la misma estructura lógica aparece en 2 o más ficheros, el `@code-reviewer` MUST exigir que se extraiga a función. Si un string literal, número o regex aparece en 3 o más sitios, el `@code-reviewer` MUST exigir una constante con nombre.

#### Scenario: Lógica duplicada en 2+ sitios
- **WHEN** el diff contiene dos bloques de más de 5 líneas con la misma estructura
- **THEN** el `@code-reviewer` lo marca como `WARNING` y pide extraer a función

#### Scenario: Constante repetida
- **WHEN** un literal aparece en 3 o más sitios diferentes
- **THEN** el `@code-reviewer` lo marca como `SUGGESTION` y pide definir una constante

### Requirement: Anti-patrones de error

El `@code-reviewer` MUST prohibir estos anti-patrones: `catch` vacío, `.catch()` sin argumento, `.catch(() => {})`, `return null` sin explicación, `throw new Error()` sin mensaje, `throw new Exception("error")` genérico. Los silenciosos son `CRITICAL`; los genéricos son `WARNING`.

#### Scenario: Error silencioso detectado
- **WHEN** el diff contiene un `catch` vacío, `.catch()` sin argumento, o `.catch(() => {})`
- **THEN** el `@code-reviewer` lo marca como `CRITICAL`

#### Scenario: Excepción sin mensaje
- **WHEN** el diff contiene `throw new Error()` o `throw new Exception("error")` sin mensaje descriptivo
- **THEN** el `@code-reviewer` lo marca como `WARNING`

### Requirement: Comentarios — solo por qué, no qué

Un comentario es redundante si usa estos patrones junto al código correspondiente: `// incrementa`, `// decrementa`, `// asigna`, `// devuelve`, `// verifica`, `// procesa`, `// filtra`, `// mapea`, `// cuenta`, `// compara`, `// guarda`, `// carga`. El `@code-reviewer` MUST marcar comentarios redundantes como `SUGGESTION`.

#### Scenario: Comentario redundante
- **WHEN** un comentario usa uno de estos patrones: `// incrementa`, `// decrementa`, `// asigna`, `// devuelve`, `// verifica`, `// procesa`, `// filtra`, `// mapea`, `// cuenta`, `// compara`, `// guarda`, `// carga` seguido de código que ya lo dice
- **THEN** el `@code-reviewer` lo marca como `SUGGESTION` y pide eliminarlo

#### Scenario: Comentario útil
- **WHEN** un comentario explica una decisión no obvia, una restricción externa, o un workaround
- **THEN** el `@code-reviewer` lo considera válido

### Requirement: Un dominio por fichero

El `@code-reviewer` MUST verificar que un fichero no contiene lógica de más de un dominio. Los dominios son: autenticación, persistencia, interfaz de usuario, lógica de negocio, utilidades de formato, configuración.

#### Scenario: Fichero con múltiples dominios
- **WHEN** un fichero contiene lógica de 2+ dominios (ej: auth + UI + DB)
- **THEN** el `@code-reviewer` lo marca como `WARNING` y pide separar en ficheros por dominio

### Requirement: Un nivel de abstracción por función

El `@code-reviewer` MUST verificar que una función no mezcla operaciones de dominio (`getUser`, `saveOrder`, `sendEmail`) con operaciones de bajo nivel (`json.parse`, `JSON.stringify`, `fs.readFileSync`, `new Date`, `Math.floor`, `Array.prototype.*`, `Object.*`, `String.prototype.*`). Si una función llama a ambas categorías, el `@developer` debe extraer las operaciones de bajo nivel a funciones auxiliares.

#### Scenario: Mezcla de niveles de abstracción
- **WHEN** una función contiene operaciones de dominio (`getUser`, `saveOrder`, `sendEmail`, `calculateTotal`) y operaciones de bajo nivel (`json.parse`, `JSON.stringify`, `fs.readFileSync`, `new Date`, `Math.floor`, `Array.prototype.map`, `Array.prototype.filter`, `Array.prototype.reduce`, `Object.keys`, `Object.values`, `String.prototype.split`, `String.prototype.trim`)
- **THEN** el `@code-reviewer` lo marca como `WARNING` y pide extraer las operaciones de bajo nivel a funciones auxiliares

### Requirement: Máximo 3 parámetros por función

Una función MUST tener máximo 3 parámetros. Si tiene más, el `@developer` debe agrupar los parámetros en un objeto o DTO.

#### Scenario: Función con 3 o menos parámetros
- **WHEN** una función tiene 3 o menos parámetros
- **THEN** el `@code-reviewer` lo considera válido

#### Scenario: Función con más de 3 parámetros
- **WHEN** una función tiene más de 3 parámetros
- **THEN** el `@code-reviewer` lo marca como `WARNING` y pide agrupar en un objeto o DTO

### Requirement: No booleanos como flags

Si una función tiene un parámetro booleano que cambia su comportamiento interno, el `@code-reviewer` MUST exigir dividirla en dos funciones separadas.

#### Scenario: Función con flag booleano
- **WHEN** una función tiene un parámetro booleano que cambia su comportamiento (ej: `save(true)` guarda, `save(false)` actualiza)
- **THEN** el `@code-reviewer` lo marca como `WARNING` y pide dividir en dos funciones con nombres propios

#### Scenario: Función sin flag booleano
- **WHEN** una función no tiene parámetros booleanos, o el booleano no cambia su comportamiento
- **THEN** el `@code-reviewer` lo considera válido

### Requirement: Extraer condicionales

Si una expresión booleana aparece como argumento directo de `if`, `while`, `&&` o `||` y tiene más de 2 condiciones, el `@code-reviewer` MUST exigir que se extraiga a una función con nombre descriptivo.

#### Scenario: Condicional simple
- **WHEN** una expresión booleana tiene 2 o menos condiciones (ej: `if (user && user.isActive)`)
- **THEN** el `@code-reviewer` lo considera válido

#### Scenario: Condicional complejo
- **WHEN** una expresión booleana tiene más de 2 condiciones (ej: `if (user && user.isActive && user.hasPermission && !user.isBanned)`)
- **THEN** el `@code-reviewer` lo marca como `WARNING` y pide extraer a una función con nombre descriptivo

### Requirement: Nombres positivos para booleanos

Una variable o función booleana NO puede usar negación en su nombre. Los prefijos negativos están prohibidos: `not`, `no`, `un`, `in`, `isNot`, `hasNo`, `doNot`, `dont`. Un nombre booleano MUST tener prefijo positivo: `is`, `has`, `can`, `should`, `was`.

#### Scenario: Nombre booleano positivo
- **WHEN** una variable o función booleana se llama `isValid`, `hasPermission`, `canEdit`, `shouldRetry`, `isActive`
- **THEN** el `@code-reviewer` lo considera válido

#### Scenario: Nombre booleano negativo
- **WHEN** una variable o función booleana se llama `isInvalid`, `hasNoPermission`, `notFound`, `isNotActive`, `hasNoError`, `dontSendEmail`
- **THEN** el `@code-reviewer` lo marca como `WARNING` y pide renombrar con prefijo positivo

### Requirement: El developer aplica código limpio al implementar

El `@developer` MUST escribir código que cumpla los criterios de código limpio definidos en este spec. No basta con que el código funcione: debe ser legible, mantenible y seguir los principios de Clean Code.

#### Scenario: Implementación funcional pero sucia
- **WHEN** el `@developer` entrega código con nombres prohibidos, funciones largas, lógica duplicada o anti-patrones de error
- **THEN** el `@code-reviewer` lo rechaza con los criterios específicos incumplidos

### Requirement: Criterios de código limpio en la revisión

El `@code-reviewer` MUST evaluar los 12 criterios de código limpio en cada revisión usando las reglas objetivas de este spec.

#### Scenario: Review con criterios de código limpio
- **WHEN** el `@code-reviewer` revisa un cambio
- **THEN** evalúa cada criterio contra las reglas objetivas y etiqueta cada hallazgo con la severidad correspondiente
