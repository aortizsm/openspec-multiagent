# Spec Delta

## Purpose

Define el comportamiento de control de calidad del loop multiagente de este repo: cómo el `architect` obtiene aprobación explícita, qué debe contener un diseño antes de delegar, cómo se revisa y verifica el trabajo, y qué nombres canónicos de herramientas usa el flujo.

## ADDED Requirements

### Requirement: Aprobación explícita con selección

El `architect` MUST solicitar la aprobación del usuario mediante el tool `question` con opciones seleccionables. MUST aceptar cualquier respuesta que exprese aprobación ("sí", "approved", "adelante", "hazlo" o la opción elegida del menú). MUST NOT exigir que el usuario escriba una palabra concreta.

#### Scenario: Aprobación por menú
- **WHEN** el diseño de un change está listo para implementarse
- **THEN** el `architect` presenta un menú con las opciones de aprobar, revisar o rechazar, y no pide escribir una palabra

#### Scenario: Respuesta natural
- **WHEN** el usuario responde "adelante" o "hazlo" en lugar de seleccionar la opción del menú
- **THEN** el `architect` lo trata como aprobación y continúa con la implementación

#### Scenario: Rechazo o revisión
- **WHEN** el usuario selecciona revisar o rechazar
- **THEN** el `architect` no delega al `developer` y vuelve a trabajar el diseño

### Requirement: Contrato de resultado antes de delegar

El `architect` MUST NOT delegar trabajo al `developer` hasta que el diseño del change contenga los campos `status`, `executive_summary`, `artifacts`, `risks` y `next_recommended`. Si alguno falta o está vacío, el gate falla y el `architect` MUST completarlo antes de delegar.

#### Scenario: Diseño completo
- **WHEN** el diseño contiene los cinco campos con contenido
- **THEN** el `architect` puede delegar la implementación

#### Scenario: Campo ausente
- **WHEN** el diseño no incluye `risks` o lo deja vacío
- **THEN** el `architect` no delega y completa el campo primero

### Requirement: Gate de validación antes de archivar

Antes de archivar un change, el `architect` MUST verificar que `openspec validate` pasa, que los tests del proyecto pasan y que el diff no incluye cambios fuera del alcance del change. Si alguna verificación falla, MUST devolver el trabajo al `developer` en lugar de archivar.

#### Scenario: Verificación correcta
- **WHEN** `openspec validate` pasa, los tests pasan y el diff se limita al change
- **THEN** el `architect` procede a archivar

#### Scenario: Tests en rojo
- **WHEN** los tests del proyecto fallan tras la implementación
- **THEN** el `architect` no archiva y solicita la corrección al `developer`

#### Scenario: Diff fuera de alcance
- **WHEN** el diff incluye ficheros ajenos al change
- **THEN** el `architect` no archiva y aclara el alcance antes de continuar

### Requirement: Severidades en la revisión

El `code-reviewer` MUST etiquetar cada petición de cambio como `CRITICAL`, `WARNING` o `SUGGESTION`. `CRITICAL` cubre bugs, riesgos de seguridad, corrupción de datos, regresiones y contratos rotos; `WARNING` cubre casos límite ausentes, comportamiento poco claro y cobertura insuficiente en código de riesgo; `SUGGESTION` cubre estilo, claridad y simplificaciones opcionales. El `code-reviewer` MUST NOT emitir peticiones sin severidad.

#### Scenario: Bug detectado
- **WHEN** la revisión encuentra un comportamiento incorrecto
- **THEN** la petición se etiqueta como `CRITICAL` e indica qué cambiar, por qué y dónde

#### Scenario: Mejora opcional
- **WHEN** la revisión detecta una simplificación que no afecta la corrección
- **THEN** la petición se etiqueta como `SUGGESTION` y el `developer` puede omitirla

#### Scenario: Aprobación
- **WHEN** no hay defectos que corregir
- **THEN** el `code-reviewer` responde con el formato de aprobación e incluye el desglose de severidades en cero

### Requirement: Checklists de cierre y pre-review

`AGENTS.md` MUST documentar los checks previos a la revisión (el `developer` reportó los checks en verde, existe un diff concreto y las tasks del change están completadas) y los checks previos al archivo (validación de OpenSpec, tests del proyecto, alcance del diff, sincronización de specs sin conflictos y `## Purpose` sin placeholders).

#### Scenario: Pre-review incompleto
- **WHEN** el `developer` no reportó verificaciones en verde
- **THEN** el `architect` no envía el trabajo al `code-reviewer`

#### Scenario: Purpose pendiente
- **WHEN** la spec archivada conserva un `## Purpose` con texto de relleno
- **THEN** el `architect` escribe un propósito real antes de cerrar

### Requirement: Permisos de shell compatibles con comandos compuestos

Los agentes con shell restringido MUST tener permitidos los comandos auxiliares que aparecen en cadenas (`echo`, `ls`, `pwd`, `cat`) además de los comandos que ejecutan realmente, porque OpenCode evalúa cada segmento de un comando compuesto y rechaza el comando completo si uno no está permitido.

#### Scenario: Comando compuesto permitido
- **WHEN** el `architect` ejecuta `git status --porcelain && echo "---" && git diff --stat`
- **THEN** el comando se ejecuta, porque cada segmento está permitido

#### Scenario: Segmento no permitido
- **WHEN** un comando compuesto incluye un segmento fuera de la lista permitida
- **THEN** el comando se rechaza y el agente usa comandos separados

### Requirement: Nombres canónicos de las herramientas de OpenSpec

`AGENTS.md` MUST documentar el CLI de OpenSpec como vía principal (`openspec new change <name>`, `openspec list`, `openspec show`, `openspec validate`, `openspec archive`) y los tools MCP disponibles (`openspec_create_change`, `openspec_list_specs`). MUST dejar explícito que `openspec_new_change` y `openspec_change_new` no existen, y que ante un error de tool desconocido se use el CLI.

#### Scenario: Creación de un change
- **WHEN** hace falta crear un change
- **THEN** el agente ejecuta `openspec new change <name>` y no invoca `openspec_new_change`

#### Scenario: Tool inexistente
- **WHEN** una llamada a un tool MCP falla con "Unknown tool"
- **THEN** el agente usa el CLI equivalente en lugar de reintentar el nombre inventado

### Requirement: Firmas correctas de las herramientas de Engram

El `architect` MUST usar `mem_save` con los argumentos `title` y `content`. MUST NOT pasar `type=session_summary` ni otros argumentos no soportados. Para cerrar una sesión MUST usar `mem_session_end` con `id` y `summary`.

#### Scenario: Guardado correcto
- **WHEN** el `architect` guarda una decisión en Engram
- **THEN** llama `mem_save` con `title` y `content`

#### Scenario: Guardado inválido
- **WHEN** una llamada a `mem_save` incluye un argumento `type`
- **THEN** el `architect` corrige la llamada y reintenta solo con `title` y `content`
