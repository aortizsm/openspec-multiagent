# readme-engram-not-requirement Specification

## Purpose

Aclarar en el README.md que Engram y CodeGraph no son requerimientos obligatorios en la sección Requirements.

## ADDED Requirements

### Requirement: Engram y CodeGraph no son requerimientos obligatorios

El `README.md` MUST no listar a Engram ni a CodeGraph como componentes obligatorios en la sección `Requirements`.

#### Scenario: Engram y CodeGraph no en tabla obligatoria
- **WHEN** el usuario lee la sección `Requirements` del `README.md`
- **THEN** Engram no aparece como fila obligatoria en la tabla
- **THEN** CodeGraph no aparece como fila obligatoria en la tabla
- **THEN** todos los componentes obligatorios (Node.js, openspec, openspec-mcp, Context7, OpenCode) permanecen

### Requirement: Nota de opcionalidad

El `README.md` SHALL incluir una nota aclaratoria de que Engram y CodeGraph son opcionales.

#### Scenario: Nota opcional
- **WHEN** el usuario lee la sección `Requirements`
- **THEN** puede existir una nota que indique que Engram y CodeGraph son opcionales
