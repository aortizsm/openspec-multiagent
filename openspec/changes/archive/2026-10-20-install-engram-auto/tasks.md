# Tasks for Instalar Engram automáticamente desde el instalador del proyecto

## 1. Planning

- [x] **1.1** Revisar requirements y confirmar alcance
- [x] **1.2** Diseñar API/interface del paso de Engram en setup.mjs

## 2. Implementation

- [x] **2.1** Agregar helper de detección de engram en lib.mjs (`isEngramInstalled`)
- [x] **2.2** Agregar helper de descarga desde GitHub releases en lib.mjs (`downloadEngram`)
- [x] **2.3** Modificar install-engram.mjs para descargar binario + escribir config MCP
- [x] **2.4** Agregar paso opcional de Engram en setup.mjs
- [x] **2.5** Verificar si init.mjs necesita bandera --engram

## 3. Integration

- [x] **3.1** Probar en Linux: descarga, extracción, instalación
- [x] **3.2** Verificar que check.mjs detecta engram instalado
- [x] **3.3** Documentar en README.md
- [x] **3.4** Code review y validación con @code-reviewer
