# FarmaSim 3D — Roadmap de reconstrucción

> Rama de trabajo: `feat/farmasim-3d-rebuild`
>
> Regla: no reemplazar las simulaciones actuales ni fusionar a `main` hasta aprobar la experiencia completa.

## Objetivo visual

Reconstruir desde cero una simulación 3D compacta en primera persona con la distribución acordada:

- Frente del jugador: paciente, mesón, PC y scanner.
- Espacio central: desplazamiento corto y controlado.
- Detrás del jugador: Medicamentos, Arsenal y Cuidados.
- Desktop: WASD + mouse + interacción contextual.
- Móvil/tablet: experiencia completa en landscape con joystick y cámara táctil.

## Fase 1 — Base 3D y navegación · HECHA

- Ruta local aislada `/dev/simulation-3d`.
- Mundo 3D completamente nuevo; no reutiliza escenas 3D anteriores.
- Habitación compacta.
- Mesón, PC, scanner y paciente placeholder al frente.
- Medicamentos, Arsenal y Cuidados en la pared trasera.
- Cámara en primera persona.
- Movimiento WASD y mouse mediante pointer lock.
- Límites simples de movimiento.
- Joystick y look táctil para dispositivos con pointer coarse.
- Bloqueo de experiencia móvil en portrait y solicitud de giro a landscape.
- HUD base inspirado en el diseño aprobado.

## Fase 2 — Sistema de interacción

- Raycast desde el centro de la cámara.
- Registro desacoplado de objetos interactuables.
- Prompt contextual (`Usar`, `Abrir`, `Tomar`, `Examinar`, `Hablar`).
- Distancia máxima de interacción.
- Estado de foco del computador.
- Apertura/cierre de gavetas.
- Base para sostener/examinar objetos.

## Fase 3 — Computador FarmaSys

- Transición cámara → computador.
- Interfaz React superpuesta al mundo 3D.
- Buscar paciente por RUT.
- Ver ficha del paciente.
- Revisar prescripciones activas.
- Salir del computador y regresar al control FPS.
- UI responsive para desktop y landscape móvil.

## Fase 4 — Arsenal y medicamentos

- Inventario por sección/gaveta.
- Gavetas identificadas por rangos alfabéticos.
- Medicamentos generados desde datos, no un GLB por producto.
- Tomar medicamento.
- Examinar nombre, dosis, forma farmacéutica y cantidad.
- Selección correcta e incorrecta sin ayudas visuales automáticas.

## Fase 5 — Caso 001

- Adaptar la lógica pedagógica existente al motor nuevo sin reutilizar la antigua escena 3D/2D.
- Paciente y diálogo inicial.
- Documento/identidad.
- Consulta en FarmaSys.
- Prescripciones.
- Búsqueda en arsenal.
- Verificación de medicamento.
- Entrega.
- Criterios, errores, barreras de seguridad y resultado.
- Persistencia del intento/progreso.

## Fase 6 — Pulido, móvil y rendimiento

- Sustituir placeholders por assets finales nuevos.
- Iluminación final y materiales coherentes con el concepto aprobado.
- Optimización de geometría y texturas.
- Instancing/LOD donde sea necesario.
- Perfil de calidad desktop y mobile.
- Ajustes de controles touch.
- Pruebas responsive y orientación.
- Accesibilidad de interfaces HTML.
- Pruebas completas antes de considerar integración con `/simulaciones`.

## Criterio para integrar a main

La nueva experiencia solo se propone para integración cuando:

1. Caso 001 tenga paridad funcional con el flujo pedagógico necesario.
2. Desktop y móvil landscape sean utilizables.
3. No existan regresiones en el resto de FarmaSim.
4. `lint`, `typecheck` y `build` pasen.
5. La experiencia visual haya sido revisada y aprobada.
