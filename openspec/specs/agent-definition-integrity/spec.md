# agent-definition-integrity Specification

## Purpose
Definir la integridad de las definiciones de agente bajo `opencode/agents/`: cada archivo contiene exactamente una definición —un solo bloque de frontmatter, una copia de cada sección de guía, ningún bloque `permissions:` en el cuerpo y ningún delimitador huérfano— y una consolidación preserva byte a byte cada sección única.

## Requirements

### Requirement: Una sola definición por archivo de agente

Cada archivo de definición en `opencode/agents/` MUST contener una única definición: exactamente un bloque de frontmatter delimitado por `---`, una sola copia de cada sección de guía, ningún bloque de `permissions:` en el cuerpo y ningún delimitador `---` huérfano.

#### Scenario: Un solo bloque de frontmatter

- **WHEN** un mantenedor cuenta los delimitadores `---` de un archivo de agente
- **THEN** hay exactamente dos, los del frontmatter

#### Scenario: Ninguna sección de guía duplicada

- **WHEN** un mantenedor lista los encabezados del archivo
- **THEN** cada encabezado aparece una sola vez

#### Scenario: Sin permisos en el cuerpo

- **WHEN** un mantenedor busca `permissions:` en el archivo
- **THEN** solo aparece dentro del bloque de frontmatter

### Requirement: La consolidación preserva el contenido único

Cuando un archivo de agente se consolida, cada sección única MUST conservar su contenido, y cada sección eliminada por estar duplicada MUST estar identificada como duplicado exacto de otra que permanece.

#### Scenario: Inventario de secciones antes y después

- **WHEN** se compara el inventario de secciones anterior y posterior a la consolidación
- **THEN** todas las secciones únicas siguen presentes con el mismo cuerpo, y lo eliminado son copias exactas

#### Scenario: Contenido único que no se pierde

- **WHEN** una sección existe en una sola de las copias consolidadas
- **THEN** permanece en el archivo final con su texto intacto
