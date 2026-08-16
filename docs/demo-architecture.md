# Arquitectura actual de FarmaSim

## Objetivo

FarmaSim es el módulo interactivo de FarmaVerse para practicar casos ficticios de farmacia desde navegador o teléfono. La arquitectura actual prioriza una experiencia visual consistente, persistencia de progreso y una base de código simple de mantener.

## Flujo general

```text
Selector de nivel
  -> carga del caso
  -> escena interactiva
  -> interacción contextual
  -> verificación de criterios
  -> persistencia del intento
  -> resultados
  -> repetir o avanzar al siguiente caso
```

## Rutas

```text
/simulaciones
  selector de niveles

/simulaciones/[slug]
  experiencia interactiva del caso

/progreso
  progreso e historial del usuario

/novedades
  contenido y cambios de la plataforma
```

## Experiencias activas

La ruta `[slug]` selecciona una de tres implementaciones:

```text
case-001-ambulatory-dispensing
  -> Case001ExperienceV7

case-005-storage-review
  -> ContextualStorageExperience

case-002-concentration-reinforcement
case-003-concentration-reinforcement
case-004-concentration-reinforcement
case-006-multiple-errors
case-007-expert-mode
  -> ContextualDispensingExperience
```

No deben agregarse motores paralelos para un caso nuevo si puede representarse mediante una de estas experiencias y datos de configuración.

## Separación por responsabilidad

### Datos

```text
src/data/training/
```

Contiene los casos, niveles, modos, criterios y contenido educativo.

### Presentación e interacción

```text
src/features/training/
```

Contiene las experiencias interactivas actualmente utilizadas.

### Escena

```text
case001-illustrated-scene.tsx
case001-scene-hotspots.ts
```

La escena utiliza el asset:

```text
public/images/farmasim/case001-scene.jpg
```

Los hotspots se posicionan sobre la imagen y mantienen áreas táctiles mayores en móvil.

### Persistencia

```text
src/features/progress/actions.ts
src/lib/supabase/
supabase/migrations/
```

El cliente solicita el guardado del intento y la base de datos valida/actualiza progreso. Las migraciones son parte del historial del proyecto y no se consideran archivos temporales.

## Responsive

### Escritorio

```text
┌─────────────────────────────┬───────────────────┐
│                             │ interacción       │
│        escena               ├───────────────────┤
│                             │ misión / info     │
└─────────────────────────────┴───────────────────┘
```

Al finalizar el caso, la escena deja de ser protagonista y se muestra la vista de resultados.

### Móvil

```text
┌──────────────────────┐
│ header               │
├──────────────────────┤
│ escena               │
├──────────────────────┤
│ interacción          │
├──────────────────────┤
│ navegación inferior  │
└──────────────────────┘
```

La escena no debe quedar cubierta por un panel contextual grande. Los puntos visibles pueden ser pequeños, pero el área táctil debe mantenerse cómoda.

## Estado de finalización

Un caso no debe considerarse finalizado solo porque la barra de progreso llegue a 100 %.

La finalización debe depender del estado real de la experiencia (`result`, `finished` o equivalente). Esto evita falsos positivos como una revisión con todos los campos inspeccionados pero aún no cerrada.

## Resultados

La vista final debe:

- ocultar interacciones que ya no son necesarias;
- mostrar los criterios obtenidos;
- informar si el progreso se guardó;
- permitir **Volver a repetir**;
- ofrecer **Siguiente caso** cuando corresponda.

## Datos del dominio

La meta de mantenimiento es que los datos de paciente, prescripciones, medicamentos, discrepancias y criterios vivan en la definición del caso o en una configuración común, evitando repetirlos dentro de múltiples componentes.

Cuando se refactorice una simulación, debe preferirse:

```text
TrainingCase / configuración
          ↓
experiencia reutilizable
          ↓
resultado normalizado
```

antes que crear un componente nuevo con datos duplicados.

## Reglas de mantenimiento

1. No conservar implementaciones `v2`, `v3`, etc. una vez reemplazadas y validadas.
2. No guardar imágenes binarias fragmentadas dentro de archivos TypeScript.
3. No mantener escenas o motores alternativos sin una ruta activa.
4. No inferir estado de negocio mediante selectores CSS o porcentajes cuando puede exponerse un estado explícito.
5. Mantener los assets de `public` limitados a recursos realmente consumidos o necesarios para documentación/presentación.
6. Ejecutar `npm run check` antes de fusionar refactors amplios.
7. Mantener Supabase y sus migraciones separados de la presentación visual.

## Evolución recomendada

La mejora arquitectónica siguiente es consolidar el Caso 001 y los casos de dispensación en un único motor/configuración de dispensación, reduciendo la duplicación entre `Case001ExperienceV7` y `ContextualDispensingExperience`.

Ese refactor debe hacerse por separado de tareas de limpieza para poder probar cada cambio con facilidad.
