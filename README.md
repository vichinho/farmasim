# FarmaVerse

FarmaVerse es una plataforma de entrenamiento orientada a la simulación del proceso de dispensación en farmacia ambulatoria. El proyecto prioriza una experiencia 2D interactiva donde las acciones observables del participante alimentan un motor de evaluación, seguridad y refuerzo.

## Desarrollo local

```bash
npm ci
npm run dev
```

Validación completa:

```bash
npm run check
```

`npm run check` ejecuta lint, typecheck, Vitest y build de producción.

## Simulación 2D

La experiencia sigue el patrón:

`escena → objeto interactivo → foco/zoom → acción → volver a escena → continuar simulación`

El motor separa la representación visual de las reglas pedagógicas. Entre sus componentes actuales se encuentran:

- EventLog para registrar acciones observables;
- evaluación de siete criterios de dispensación;
- SafetyEngine para discrepancias de preparación/despacho;
- StorageEvaluator para desviaciones de almacenamiento independientes;
- ScenarioValidator;
- ReinforcementEngine;
- control individual desde TENS 1 o TENS 2.

Antes de comenzar un caso debe seleccionarse explícitamente TENS 1 o TENS 2. Hasta `role.selected`, ambos roles operativos permanecen bajo control de simulación y el motor ignora acciones clínicas o de preparación.

## Arsenal de Atención Abierta

La fuente utilizada por la simulación proviene de `ARSENAL 2026.xlsx`, hoja `ARSENAL HT 2025`, filtrando las filas marcadas para Atención Abierta.

La transformación conserva los datos fuente relevantes —código TrakCare, descripción, forma farmacéutica y unidad de dispensación— y añade identificadores normalizados para agrupar medicamentos y presentaciones sin crear concentraciones inexistentes.

Los escenarios de error de concentración solo pueden utilizar otra presentación existente del mismo medicamento en el arsenal. La prueba estructural B utiliza Carvedilol 12,5 mg frente a Carvedilol 25 mg, ambas presentaciones reales de Atención Abierta.

## Auditoría estructural A–G

La suite automatizada cubre:

- A. entorno y preparación completamente correctos;
- B. concentración incorrecta usando presentaciones reales del arsenal;
- C. múltiples registros y omisión de una prescripción pertinente;
- D. paciente incorrecto sin atribuir el fallo al criterio de doble chequeo;
- E. desviación de gaveta detectada sin seleccionar el producto incorrecto;
- F. desviación de gaveta que se convierte en discrepancia de preparación tras la selección;
- G. preparación farmacológicamente correcta sin evidencia de doble chequeo.

El workflow `.github/workflows/simulation-audit.yml` ejecuta `npm ci` y `npm run check` en cada pull request hacia `main`.

## Estado de la rama de correcciones estructurales

En `fix/simulation-structural-gaps`, el workflow de auditoría alcanzó una ejecución completa satisfactoria con:

- lint sin errores bloqueantes;
- typecheck satisfactorio;
- 17/17 pruebas Vitest aprobadas, incluyendo A–G;
- build de producción Next.js satisfactorio.

La rama permanece separada de `main` mientras se revisa el resultado antes de incorporar el banco completo de escenarios.
