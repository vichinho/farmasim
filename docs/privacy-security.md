# Privacidad y seguridad — Fase 15

Fecha de revisión: 13 de agosto de 2026.

Este documento es una guía técnica del prototipo. No reemplaza una revisión jurídica ni acredita cumplimiento.

## Inventario mínimo de datos

| Dato | Ubicación | Finalidad | Sensibilidad actual |
| --- | --- | --- | --- |
| Correo | Supabase Auth | Identidad, acceso y recuperación | Personal |
| Contraseña | Supabase Auth | Autenticación; no es visible para la aplicación | Credencial |
| Nombre | `public.profiles.full_name` | Personalizar la experiencia | Personal |
| Puntajes, XP, progreso y logros | Tablas públicas con RLS | Mostrar avance educativo | Personal asociado a la cuenta |

FarmaVerse no debe almacenar RUT, datos biométricos, información clínica real ni datos identificables de pacientes en esta etapa.

## Controles verificados

- RLS está habilitado en todas las tablas del esquema `public`.
- Perfiles, intentos, progreso y logros se limitan al `auth.uid()` del usuario.
- La aplicación valida JWT con `getClaims()` en servidor y Proxy.
- Los intentos se escriben mediante una función controlada; el rol autenticado no tiene inserción directa.
- El cierre normal afecta solo a la sesión actual. El perfil permite revocar las demás sesiones.
- Las respuestas de autenticación y rutas protegidas se sirven con `private, no-store`.
- Se aplican encabezados contra clickjacking, MIME sniffing y permisos innecesarios.
- El registro informa qué datos se tratan y exige confirmar la lectura del aviso.

## Cifrado y criterio de riesgo

La Ley 21.719 no impone cifrado de columna para todo dato personal. El artículo 14 quinquies exige medidas apropiadas al riesgo y señala cifrado y seudonimización entre las medidas posibles.

Para el alcance actual se usa cifrado en tránsito en producción, protección administrada de la infraestructura, RLS, privilegio mínimo y minimización. Cifrar `full_name` dentro de Postgres añadiría gestión de llaves y dificultaría consultas sin resolver un riesgo proporcional en este prototipo.

Si se incorporan datos de salud, biométricos, RUT u otros identificadores de alto impacto, se debe realizar una evaluación de impacto y diseñar cifrado o tokenización de campo con llaves fuera de la base, rotación y acceso exclusivo desde servidor.

## Pendientes antes de producción

1. Activar en Supabase Auth la protección contra contraseñas filtradas.
2. Definir responsable del tratamiento y canal para derechos de titulares.
3. Establecer plazos y automatización de retención/eliminación.
4. Crear procedimiento de incidentes y notificación de vulneraciones.
5. Documentar proveedores, ubicación/transferencia de datos y contratos.
6. Evaluar MFA para supervisores y administradores.
7. Ejecutar evaluación de impacto si cambia el alcance o se incorporan datos sensibles.
