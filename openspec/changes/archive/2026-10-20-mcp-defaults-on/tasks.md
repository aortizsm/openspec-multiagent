# Tasks for MCP servers con default sí en el instalador

## 1. Planning

- [x] **1.1** Confirmar alcance: 3 servidores MCP, defaultYes false → true

## 2. Implementation

- [x] **2.1** Cambiar defaultYes a true para filesystem, git, github en setup.mjs

## 3. Integration

- [x] **3.1** Verificar que setup.mjs --help siga listando --no-mcp
- [x] **3.2** Verificar que check.mjs siga detectando MCP correctamente
- [x] **3.3** Actualizar README si es necesario
- [x] **3.4** Code review y archivo del cambio
