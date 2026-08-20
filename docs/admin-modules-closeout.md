# Cierre de módulos Admin

Este documento resume el alcance funcional del bloque `feat/admin-modules`.

## Módulos completados

- Usuarios: gestión de rol, estado de capacitación y establecimiento principal.
- Establecimientos: creación, edición, activación y desactivación.
- Escenarios: disponibilidad, dificultad y XP del catálogo registrado.
- Cápsulas: catálogo global, estado y acceso a gestión completa.
- Analítica: intentos, puntaje, progreso y alertas de simulación.
- Auditoría: últimas acciones administrativas y de supervisión.
- Configuración: activación y XP de módulos de capacitación.

## Seguridad

Las acciones administrativas sensibles usan RPC con validación interna de rol `admin`, `anon` sin permiso de ejecución y registro en auditoría.

## Responsive

El Admin incluye un stylesheet exclusivo para los módulos que:

- centra correctamente badges de estado;
- evita overflow en inputs, selects y formularios;
- apila acciones en móvil;
- hace botones de formularios de ancho completo en móvil;
- permite wrap de encabezados largos sin empujar badges;
- mantiene el layout de tablet y desktop sin afectar TENS/Supervisor.
