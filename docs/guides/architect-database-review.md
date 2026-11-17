# Revisión de bases de datos con `@architect`

## Cuándo se usa

`@architect` intenta revisar una tabla cuando el usuario lo solicita explícitamente. También verifica los registros esperados cuando termina un proceso ejecutado que debería crearlos.

## Cómo funciona

1. `@architect` inspecciona la configuración y los scripts pertinentes del proyecto de destino para identificar la base de datos y las herramientas ya disponibles.
2. Para una revisión solicitada, ejecuta una consulta de solo lectura con el cliente existente del proyecto. La solicitud directa autoriza esta revisión; no debe entregar la consulta al usuario ni pedir una confirmación rutinaria.
3. Si un proceso completado debía crear registros, revisa los logs pertinentes, consulta los registros afectados y compara lo observado con el resultado esperado.
4. Informa los hallazgos, o las discrepancias entre los registros observados y los esperados.

## Límites y manejo seguro

- Solo se ejecutan consultas `SELECT` de solo lectura. No se ejecutan DML, DDL, procedimientos almacenados ni comandos que modifiquen la base de datos.
- Se usa la configuración y el cliente existentes del proyecto. Esta capacidad no instala ni configura herramientas o conexiones.
- Todos los valores de filtros no confiables se enlazan mediante el mecanismo de parámetros del cliente existente. Si el cliente no puede enlazarlos, `@architect` se detiene e informa ese bloqueo concreto; nunca concatena ni interpola esos valores en SQL o comandos de shell. Los nombres de tablas y columnas se obtienen de metadatos confiables del esquema, se validan contra ellos y se citan según las convenciones del cliente. Si la consulta no puede construirse de otro modo con seguridad, se detiene.
- No se imprimen valores de `.env`, credenciales, cadenas de conexión ni salida que contenga secretos.
- Se consultan únicamente filas y columnas necesarias para la verificación; se ocultan secretos y valores sensibles no pertinentes en el informe.
- Si no hay configuración, credenciales o cliente utilizables, `@architect` explica el bloqueo concreto y el siguiente paso mínimo. Si el proyecto no identifica de forma fiable la base de datos o el entorno, se detiene y pide una aclaración específica en vez de adivinar.

## Alcance

El toolkit no incorpora un servicio de base de datos, un controlador SQL ni una integración genérica con MCP. La posibilidad de ejecutar una consulta depende de la configuración y las herramientas existentes en cada proyecto de destino; no se garantiza una conexión disponible.
