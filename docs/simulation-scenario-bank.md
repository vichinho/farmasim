# FarmaVerse · Matriz del banco de escenarios

## Objetivo

Escalar el simulador 2D desde el motor estructural validado hacia un banco de 40+ casos sin perder trazabilidad pedagógica ni repetir variantes superficiales.

## Dimensiones obligatorias

Cada escenario del banco debe declarar y poder reconstruir al menos estas dimensiones:

- competencia principal;
- rol participante (`tens-1` o `tens-2`);
- modo (`guided`, `practice`, `assessment`);
- dificultad (`foundational`, `standard`, `advanced`);
- `challengeKey` observable/evaluable;
- paciente;
- medicamento y presentación reales de Atención Abierta;
- establecimiento;
- semilla determinista.

## Meta de expansión

La meta recomendada para la primera versión completa es **48 escenarios**, dejando margen sobre el mínimo de 40:

| Competencia | Meta | Rol principal |
| --- | ---: | --- |
| Identificación de paciente | 10 | TENS 1 |
| Revisión de prescripciones | 10 | TENS 1 |
| Preparación y comparación | 12 | TENS 2 |
| Reidentificación final | 8 | TENS 1 |
| Indicaciones al paciente | 8 | TENS 1 |
| **Total** | **48** | |

Distribución objetivo por modo: 12 guiados, 20 práctica y 16 evaluación. Distribución objetivo por dificultad: 12 foundational, 20 standard y 16 advanced.

## Piloto de 10 escenarios

La primera muestra controlada se define en `src/data/simulation/pilot-scenario-bank.ts`.

| # | Competencia | Rol | Modo | Dificultad | Challenge |
| ---: | --- | --- | --- | --- | --- |
| 01 | Identificación | TENS 1 | Guided | Foundational | `patient-previous-record` |
| 02 | Identificación | TENS 1 | Practice | Standard | `patient-similar-identity` |
| 03 | Prescripciones | TENS 1 | Assessment | Advanced | `prescription-pending-status` |
| 04 | Prescripciones | TENS 1 | Practice | Standard | `prescription-historical-lookalike` |
| 05 | Preparación | TENS 2 | Guided | Foundational | `preparation-wrong-strength` |
| 06 | Preparación | TENS 2 | Practice | Standard | `preparation-wrong-product` |
| 07 | Preparación | TENS 2 | Assessment | Advanced | `preparation-wrong-quantity` |
| 08 | Reidentificación final | TENS 1 | Practice | Standard | `final-similar-identity` |
| 09 | Reidentificación final | TENS 1 | Assessment | Advanced | `final-previous-record` |
| 10 | Indicaciones | TENS 1 | Guided | Foundational | `instructions-qf-escalation` |

Los primeros ocho pilotos usan semillas escogidas para recorrer los ocho pacientes sintéticos y ocho establecimientos diferentes.

## Puerta de aceptación del piloto

No se escala a los 48 escenarios hasta que el piloto cumpla simultáneamente:

1. 10 IDs únicos y semillas deterministas;
2. los cinco grupos de competencia representados;
3. ambos roles representados;
4. los tres modos y las tres dificultades representados;
5. `challengeKey` materializado y evaluable;
6. bandeja vacía al inicio;
7. presentaciones utilizadas pertenecientes a Atención Abierta;
8. ninguna huella adaptativa exacta duplicada;
9. al menos seis presentaciones diferentes entre los retiros del piloto;
10. `npm run check` y Vercel en estado `success`.

## Estado del piloto

**Puerta técnica: APROBADA.**

Última validación funcional antes de esta actualización documental:

- `npm run check`: PASS;
- ESLint: PASS;
- TypeScript: PASS;
- Vitest: **49/49 PASS** en 7 archivos;
- `pilot-scenario-bank.test.ts`: **7/7 PASS**;
- Next.js production build: PASS;
- 34 páginas generadas, incluyendo el índice QA y los 10 pilotos prerenderizados;
- Vercel preview: SUCCESS.

## Ruta interna de revisión manual

El piloto se puede recorrer en el preview desde:

`/simulaciones/pilotos`

Esta ruta:

- no está enlazada desde el catálogo público de niveles 1–7;
- está marcada `noindex`;
- permite abrir cada piloto y navegar anterior/siguiente;
- reconstruye el escenario desde un ID interno `pilot__<competencia>__<semilla>__<challengeKey>`;
- usa el mismo `Simulation2DExperience` del producto, no un simulador paralelo;
- no modifica progreso: `saveSimulationAttempt` reconoce los IDs QA válidos y devuelve un resultado local sin ejecutar la RPC de progreso.

La aprobación técnica no sustituye la revisión manual/visual. El escalado a 48 permanece detenido hasta revisar flujo, claridad visual, comportamiento del distractor, barreras de seguridad y cierre de los 10 pilotos.

## Regla de expansión

Una vez aprobada también la revisión manual del piloto, los nuevos escenarios deben añadirse por matriz, no por copia manual de casos existentes. La expansión debe mantener diversidad de paciente, medicamento/presentación, establecimiento y error exacto, conservando el arsenal y las barreras de seguridad ya validadas.
