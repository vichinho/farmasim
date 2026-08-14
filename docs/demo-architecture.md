# Arquitectura de la demo 2026-08-20

## Objetivo

Construir una demostración visual estable que recorra un caso ficticio desde la
selección de nivel hasta el entrenamiento de refuerzo. Esta arquitectura amplía
el motor existente sin reemplazar autenticación, progreso ni persistencia.

Cada escenario mantiene trazabilidad documental y puede marcarse como contenido
base documentado, educativo en desarrollo, revisado o validado para uso
institucional. Ninguno de estos estados bloquea la práctica autónoma de una
TENS.

## Flujo cerrado

```text
Selección de nivel
  -> contexto
  -> paciente
  -> identificación ficticia
  -> sistema clínico ficticio
  -> prescripción ficticia
  -> almacenamiento
  -> gaveta
  -> selección
  -> preparación
  -> doble chequeo
  -> verificación final
  -> despacho
  -> resultado por etapas
  -> NO OLVIDAR
  -> entrenamiento recomendado
```

## Decisiones técnicas

### Mantener Next.js

La demo seguirá siendo una aplicación web responsive. No se migrará a Flutter
antes de la presentación. Esto conserva el acceso desde teléfono o navegador,
Supabase y la futura configuración PWA.

### Escenarios definidos como datos

Los casos se describen con `TrainingCase`. La interfaz interpretará etapas,
interacciones y efectos; no habrá un componente exclusivo para cada historia.

```text
src/data/training/
  competencies.ts
  levels.ts
  cases/
    case-001-ambulatory-dispensing.ts
  validate-training-case.ts
```

Los contratos viven en `src/types/training-simulation.ts`.

### Separar contenido, motor y presentación

```text
Datos del caso
  -> validador estructural
  -> motor de sesión
  -> componentes de escena
  -> resultado normalizado
  -> persistencia
```

- Los datos definen qué ocurre.
- El motor mantiene selecciones, errores y etapa actual.
- Los componentes muestran cada área.
- Supabase recibe únicamente el resultado normalizado.

Las páginas y catálogos seguirán siendo Server Components por defecto. El motor
de sesión y las escenas interactivas formarán un límite cliente específico.

## Estado mínimo de sesión

```text
attemptId
caseId
currentStageId
visitedStageIds
selectedItemIds
recordedErrorIds
detectedErrorIds
correctedErrorIds
activatedBarrierIds
competencyStatuses
startedAt
completedAt
```

Un efecto `record-error` registra una discrepancia. `detect-error` y
`correct-error` solo actuarán si la discrepancia corresponde. Así, un mismo
doble chequeo funciona tanto en el camino correcto como en el incorrecto.

## Feedback diferido

Cada alternativa declara `feedbackTiming`:

- `immediate`: explica la decisión en la misma etapa.
- `deferred`: registra el efecto sin revelar todavía el resultado.
- `none`: avanza sin tarjeta de feedback.

La trampa del Caso 001 se activa al seleccionar la presentación ficticia de
100 mg. Puede revelarse en doble chequeo, verificación final o resultado. Si se
corrige antes del despacho, el resultado indicará que no alcanzó al paciente
virtual.

## Componentes previstos

La siguiente fase implementará componentes reales siguiendo esta estructura:

```text
src/features/training/
  level-selector.tsx
  training-session.tsx
  training-stage-router.tsx
  training-result.tsx
  scenes/
    pharmacy-scene.tsx
    service-counter-scene.tsx
    clinical-terminal-scene.tsx
    storage-scene.tsx
    preparation-scene.tsx
  interactions/
    decision-panel.tsx
    item-selector.tsx
    safety-check.tsx
```

No se crean componentes o carpetas vacías durante esta fase.

## Rutas previstas

```text
/simulaciones          selector de niveles y casos
/simulaciones/[slug]   contexto y sesión interactiva
/progreso              resultados y competencias
/novedades              contenido agregado o actualizado
```

La fase 10 no agrega rutas nuevas.

## Caso 001

El blueprint contiene:

- 16 etapas conectadas.
- Cinco competencias.
- Tres errores demostrativos.
- Dos barreras recuperables.
- Una trampa con feedback diferido.
- Resultado por etapas.
- Tarjeta educativa.
- Recomendación de refuerzo.

El validador comprueba identificadores duplicados, conexiones, competencias,
efectos, errores, barreras y referencias de las trampas.

## Persistencia

No se modifica Supabase en la fase 10. El esquema actual continúa guardando
intentos, precisión y XP. Cuando el motor v2 sea estable, una migración separada
y con RLS añadirá solo la información necesaria sobre competencias y errores.

## Fuera de alcance

- Movimiento libre tipo videojuego o 3D pesado.
- Contenido clínico definitivo.
- Panel administrador.
- Cuatro casos de la misma profundidad.
- Migración a Flutter.
- Cambios de Supabase antes de validar el motor v2.

## Criterio de cierre

- Flujo de presentación cerrado.
- Tipos del motor v2 compilables.
- Niveles y competencias definidos.
- Caso 001 expresado completamente como datos.
- Feedback diferido y recuperaciones representables.
- Contenido sensible marcado para revisión profesional.
- Validador estructural disponible.
- Sin regresiones en el motor actual.
