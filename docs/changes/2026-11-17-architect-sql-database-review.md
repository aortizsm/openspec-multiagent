# architect-sql-database-review

## Contexto

El prompt de `@architect` no describía cómo revisar tablas, por lo que podía rechazar consultas SQL de forma genérica o pedir al usuario que las ejecutara. Esto también impedía comprobar registros que un proceso completado debía crear.

## Qué cambió

El prompt ahora guía a `@architect` para intentar revisiones solicitadas y verificar registros esperados con herramientas y configuración existentes. Limita las consultas a `SELECT`, exige enlazar cada valor de filtro no confiable y detenerse si el cliente no puede parametrizarlo; nunca permite interpolarlo en SQL o comandos de shell. También valida y cita identificadores desde metadatos confiables, protege credenciales y valores sensibles, e informa bloqueos concretos o discrepancias. Se añadieron pruebas de regresión, se actualizó la descripción del rol en `README.md` y se agregó esta guía.

## Por qué

La revisión basada en la configuración real del proyecto permite informar evidencia sin incorporar dependencias ni acoplar el toolkit a un motor de base de datos. Una petición directa permite la consulta de solo lectura; exigir enlace de parámetros evita que los valores externos se conviertan en SQL ejecutable. Una conexión ambigua requiere aclaración, no una suposición.

## Cómo se usa

El usuario puede pedir a `@architect` que revise una tabla, indicando el objetivo o entorno si el proyecto no lo identifica claramente. Después de un proceso que debía crear registros, `@architect` comprueba los logs y los registros afectados si están disponibles. Cada valor de filtro no confiable debe enlazarse mediante parámetros; si el cliente no puede hacerlo, `@architect` se detiene e informa el bloqueo, sin interpolar el valor en SQL ni en comandos de shell. Los identificadores proceden de metadatos confiables. Para los límites y el manejo seguro, consulte la [guía de revisión de bases de datos](../guides/architect-database-review.md).

## Impacto / Migración

El comportamiento depende de la configuración y del cliente SQL que ya tenga el proyecto de destino; este cambio no instala ni configura herramientas, conexiones o servicios. No se requiere migración de datos ni runtime. Para usar la versión actualizada, reinstale o copie la definición distribuida de `@architect` mediante el flujo de instalación existente.

## Evidencia

`npm test` pasó: 64 pruebas en `tests/run.mjs` y 39 en `tests/lib.test.mjs`, sin fallos. `npm run check` indicó `READY` con Node 22.23.5 y OpenSpec 1.14.3; `openspec validate architect-sql-database-review --strict` validó el change y `git diff --check` pasó. No se ejecutó una consulta contra una base de datos real: el toolkit no incorpora integración genérica de base de datos, por lo que esa verificación depende de cada proyecto de destino.
