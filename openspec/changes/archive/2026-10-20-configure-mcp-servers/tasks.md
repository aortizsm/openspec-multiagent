# Tasks for Preguntar al usuario si quiere configurar MCP servers en el instalador

## 1. Planning

- [x] **1.1** Revisar requirements y confirmar alcance
- [x] **1.2** Diseñar flujo de preguntas en setup.mjs

## 2. Implementation

- [x] **2.1** Agregar helpers en lib.mjs para escribir entradas MCP en opencode.json
- [x] **2.2** Agregar paso opcional "Configurar MCP servers" en setup.mjs
- [x] **2.3** Pedir GITHUB_TOKEN si el usuario acepta github MCP
- [x] **2.4** Detectar MCP ya configurados y no sobrescribir
- [x] **2.5** Verificar si init.mjs necesita cambios

## 3. Integration

- [x] **3.1** Probar en Linux: preguntas, escritura de config, detección de existentes
- [x] **3.2** Verificar que check.mjs detecta MCP configurados
- [x] **3.3** Documentar en README.md
- [x] **3.4** Code review y validación con @code-reviewer
