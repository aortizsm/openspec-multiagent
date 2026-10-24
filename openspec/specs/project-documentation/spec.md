# project-documentation Specification

## Purpose
Define la documentación humana que produce el workflow: qué artefactos existen, con qué estructura, de qué fuentes se derivan, quién los escribe y revisa, y cuándo son obligatorios antes de archivar un cambio.

## Requirements

### Requirement: Estructura documental fija

El repo MUST mantener una carpeta `docs/` con esta estructura: `docs/CHANGELOG.md` como índice cronológico, `docs/changes/YYYY-MM-DD-<change>.md` con una entrada por cambio archivado y `docs/guides/<capability>.md` con el manual de uso de cada capacidad.

#### Scenario: Cambio archivado con entrada
- **WHEN** un change se archiva
- **THEN** existe `docs/changes/<fecha>-<change>.md` y una línea en `docs/CHANGELOG.md` que enlaza a esa entrada

#### Scenario: Capacidad con guía
- **WHEN** una capacidad queda sincronizada en `openspec/specs/`
- **THEN** existe o se crea `docs/guides/<capability>.md` que explica cómo se usa

### Requirement: Entrada de cambio derivada de artefactos

Cada entrada de `docs/changes/` MUST derivarse de los artefactos del change — `proposal.md`, `design.md`, `tasks.md`, el diff y el reporte del `@verifier` — y MUST cubrir: contexto, qué cambió, por qué, cómo se usa, impacto o migración y evidencia de verificación. MUST NOT inventar comportamiento que no esté en el diff o en la spec.

#### Scenario: Entrada completa
- **WHEN** se escribe la entrada de un change archivado
- **THEN** contiene las seis secciones y cada afirmación de comportamiento se puede rastrear al diff, a la spec o al reporte del verifier

#### Scenario: Sin material para una sección
- **WHEN** el change no tiene impacto de migración
- **THEN** la entrada lo dice explícitamente en vez de omitir la sección o rellenarla

### Requirement: Documentación como task del change

Cuando un change altera comportamiento, configuración o uso, su `tasks.md` MUST incluir una task de documentación. La task MUST ser ejecutada por `@developer` y MUST formar parte del mismo diff que el cambio.

#### Scenario: Cambio visible para el usuario
- **WHEN** un change añade o modifica un agente, un permiso, un comando o un gate
- **THEN** el change incluye una task de documentación y la entrada correspondiente en `docs/`

#### Scenario: Cambio invisible
- **WHEN** un change es un refactor interno sin efecto observable
- **THEN** no requiere entrada de changelog, pero la decisión de omitirla queda registrada en `tasks.md`

### Requirement: Revisión de exactitud documental

El `@code-reviewer` MUST comprobar que la documentación coincide con el diff: nombres de ficheros, comandos, rutas y comportamiento descrito. MUST NOT evaluar estilo, tono ni redacción.

#### Scenario: Documentación desactualizada
- **WHEN** el diff renombra un fichero o cambia un comando y la documentación mantiene el nombre anterior
- **THEN** el `@code-reviewer` lo marca como `CRITICAL`

#### Scenario: Documentación imprecisa
- **WHEN** la documentación describe un comportamiento que el diff no implementa
- **THEN** el `@code-reviewer` lo marca como `WARNING` y pide corregir la doc o el código

### Requirement: Gate de documentación antes de archivar

El `@architect` MUST NOT archivar un change que altere comportamiento o uso sin entrada de changelog y sin actualizar la guía de la capacidad afectada. La ausencia de documentación es un motivo de bloqueo, no una observación.

#### Scenario: Falta la entrada
- **WHEN** el change está verificado pero no tiene entrada en `docs/`
- **THEN** el `@architect` no archiva y devuelve la task de documentación al `@developer`

#### Scenario: Change solo documental
- **WHEN** el change únicamente actualiza documentación
- **THEN** el gate se satisface con la propia entrada del change y no exige guía nueva

### Requirement: Idioma de la documentación

La documentación de `docs/` MUST escribirse en español. Las specs de `openspec/specs/` y el `README.md` MUST mantenerse en inglés.

#### Scenario: Entrada en español
- **WHEN** se escribe una entrada de `docs/changes/`
- **THEN** el texto está en español, con los nombres de ficheros y comandos en su forma literal

#### Scenario: Spec en inglés
- **WHEN** se sincroniza un delta al archivar
- **THEN** la spec resultante en `openspec/specs/` queda en inglés
