# Spec Delta

## MODIFIED Requirements

### Requirement: El developer aplica código limpio al implementar
El `@developer` MUST completar una pasada de refinamiento de código limpio después de que el comportamiento y las pruebas aplicables estén en verde. Puede posponer la aplicación sistemática de los 12 criterios durante el primer borrador funcional, pero MUST cumplirlos antes de entregar el cambio.

#### Scenario: La implementación funcional pasa a refinamiento
- **WHEN** el comportamiento solicitado y las pruebas aplicables pasan
- **THEN** el `@developer` revisa el cambio contra los 12 criterios de código limpio y vuelve a ejecutar las pruebas y comprobaciones aplicables después de los cambios

#### Scenario: El refinamiento deja criterios incumplidos
- **WHEN** el `@developer` termina el refinamiento con un criterio aplicable incumplido
- **THEN** no reporta la implementación como completa y corrige el criterio antes de entregar

#### Scenario: Revisión final de código limpio
- **WHEN** el `@code-reviewer` revisa el cambio entregado
- **THEN** evalúa los 12 criterios de código limpio y rechaza los incumplimientos según las severidades existentes

#### Scenario: Implementación funcional pero sucia
- **WHEN** el `@developer` entrega código con nombres prohibidos, funciones largas, lógica duplicada o anti-patrones de error
- **THEN** el `@code-reviewer` lo rechaza con los criterios específicos incumplidos
