# FarmaSim

**Aprende. Practica. Simula.**

FarmaSim es una plataforma web gamificada para apoyar procesos de capacitación
mediante microaprendizaje, simulaciones interactivas y seguimiento del progreso.
La experiencia está diseñada principalmente para teléfonos, sin excluir el uso
desde computadores.

## Problema

La incorporación de personal en farmacias puede requerir aprender numerosos
procedimientos operativos mediante documentos, capacitaciones y experiencia
directa. FarmaSim busca ofrecer un entorno complementario donde practicar
situaciones ficticias antes de enfrentarlas en el trabajo.

## Solución

La aplicación presentará escenarios definidos mediante datos. Cada escenario
podrá incluir personajes, diálogos, decisiones, retroalimentación y resultados.
Un motor genérico interpretará estos datos para evitar programar cada historia
por separado.

## Objetivos

- Ofrecer simulaciones breves y fáciles de entender.
- Entregar retroalimentación inmediata después de cada decisión.
- Registrar intentos, precisión y experiencia del usuario.
- Permitir que el contenido evolucione sin reescribir el motor.
- Priorizar una experiencia clara, estable y mobile-first.

## Alcance del MVP

- Landing y acceso a la plataforma.
- Autenticación con correo y contraseña.
- Dashboard del funcionario.
- Motor básico de simulaciones ramificadas.
- Primer escenario completamente ficticio.
- Resultado, XP y progreso individual.
- Modo demostración sin datos reales.
- Diseño responsive.
- Despliegue público y acceso mediante QR.

El panel de supervisión, el constructor de escenarios, las notificaciones, el
modo turno y la experiencia offline quedan fuera del MVP.

## Tecnologías

- Next.js con App Router.
- React y TypeScript estricto.
- Tailwind CSS.
- Supabase para PostgreSQL, autenticación y persistencia.
- Vercel para despliegue.
- PWA de forma progresiva después de estabilizar la aplicación web.

## Arquitectura

FarmaSim seguirá una arquitectura de monolito modular. Las rutas y layouts
vivirán en `src/app`; cada capacidad del producto tendrá su propio módulo en
`src/features`; los componentes visuales compartidos estarán en
`src/components`; y las integraciones externas estarán en `src/lib`.

El motor de simulaciones permanecerá separado del contenido farmacéutico. Los
escenarios demostrativos se almacenarán como datos ficticios y posteriormente
podrán migrarse a contenido versionado en Supabase.

## Sistema de diseño

La interfaz utiliza una paleta clara, superficies elevadas, bordes suaves,
jerarquía tipográfica simple y áreas táctiles de al menos 44 px. Los componentes
reutilizables actuales están en `src/components`:

- `Button`: variantes primaria, secundaria y sutil; tamaños y estado deshabilitado.
- `Card`: contenedor de contenido con borde y elevación ligera.
- `Badge`: indicador de estado o contexto.
- `ProgressBar`: progreso accesible mediante atributos ARIA.
- `PageContainer`, `AppHeader` y `BottomNavigation`: composición y navegación
  mobile-first.

## Requisitos

- Node.js 24 LTS.
- npm 11 o compatible.

## Instalación

```bash
git clone <URL_DEL_REPOSITORIO>
cd farmasim
npm install
cp .env.example .env.local
npm run dev
```

En PowerShell, la copia del archivo de entorno puede hacerse con:

```powershell
Copy-Item .env.example .env.local
```

La aplicación estará disponible en `http://localhost:3000`.

## Variables de entorno

| Variable | Descripción |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL pública del proyecto Supabase. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Clave publicable para el cliente. |
| `NEXT_PUBLIC_SITE_URL` | URL canónica para metadatos y vista previa social. |

No se deben guardar claves secretas ni una clave `service_role` en variables
expuestas al navegador. `.env.local` está ignorado por Git.

## Supabase y seguridad

La estructura versionada de la base de datos está en `supabase/migrations`.
Incluye perfiles creados al registrarse, contenido de aprendizaje, progreso,
intentos y logros. Todas las tablas del esquema `public` usan RLS: el contenido
solo se lee con sesión y cada persona accede únicamente a sus propios datos.

Para aplicar la migración a un proyecto Supabase, primero enlaza el proyecto y
ejecuta `npx supabase db push`. Las credenciales reales se mantienen solo en
`.env.local` y en la configuración del proveedor de despliegue.

## Autenticación

FarmaSim utiliza Supabase Auth con correo y contraseña. Las rutas `/dashboard`,
`/simulaciones`, `/novedades`, `/aprender`, `/progreso` y `/perfil` requieren una sesión
validada. Para que los enlaces de recuperación funcionen fuera de desarrollo,
agrega la URL de producción y `http://localhost:3000/auth/callback` a las
Redirect URLs de Supabase Auth.

## Privacidad y sesiones

La ruta pública `/privacidad` informa los datos mínimos usados por la demo. El
registro exige confirmar su lectura y `/perfil` permite revisar la sesión actual,
cerrarla localmente o revocar las demás sesiones. Las respuestas autenticadas no
se almacenan en cachés compartidas. La evaluación técnica y los pendientes para
producción están en [`docs/privacy-security.md`](docs/privacy-security.md).

La lista operativa y los tres respaldos de la presentación están en
[`docs/presentation-checklist.md`](docs/presentation-checklist.md).

## Dashboard

La ruta protegida `/dashboard` muestra el nombre, nivel y XP del perfil
autenticado. También consulta el conteo propio de módulos completados y de
simulaciones de los últimos siete días. Las tarjetas de cápsulas y simulaciones
preparan la experiencia de las próximas fases y no enlazan a rutas aún no
implementadas.

## Motor de simulaciones

La ruta protegida `/simulaciones` presenta la ruta visual de siete niveles. El
primer nivel abre `/simulaciones/case-001-ambulatory-dispensing`, una farmacia
2D responsive con cuatro áreas navegables. La página y el catálogo se renderizan
en el servidor; únicamente el plano exploratorio requiere estado en el cliente.

El Caso 001 se interpreta desde datos separados de la interfaz mediante un motor
de sesión genérico. Sus 16 etapas recorren contexto, paciente, identificación,
sistema ficticio, solicitud, almacenamiento, selección, preparación, doble
chequeo, verificación final, resultado y cierre educativo. Las decisiones y sus
efectos viven en la sesión del navegador; la persistencia ampliada se incorporará
después de estabilizar el modelo de resultados.

Los niveles 1, 2 y 3 reutilizan este mismo escenario con modos distintos. El
primero ofrece orientación contextual; el segundo conserva el feedback diferido
de la trampa; y el tercero reduce las ayudas, agrega un objetivo de tiempo e
interrupciones controladas. Los niveles 4 a 7 permanecen bloqueados para mostrar
la expansión futura sin ampliar el alcance de la demo.

La capacitación adaptativa incluye cuatro casos completos. Si se registra un
error de concentración, el cierre recomienda el siguiente caso con la misma
competencia y un contexto diferente. El resultado clasifica cada competencia
como `Dominado`, `En progreso` o `En refuerzo`. La ruta protegida `/novedades`
muestra el catálogo versionado de casos, funciones y entrenamientos agregados a
la versión educativa 1.1.

## Primer escenario

El Caso 001 representa una dispensación ambulatoria ficticia y pendiente de
validación profesional. Su primera entrega visual incluye un paciente virtual,
un trabajador, mesón de atención, computador, almacenamiento con gavetas y
mesón de preparación. No representa indicaciones, procedimientos ni reglas de
dispensación farmacéutica.

## Progreso del usuario

Al completar una simulación, FarmaSim guarda el intento de forma idempotente en
Supabase con su precisión, respuestas correctas e incorrectas, XP y fecha. Una
función transaccional calcula el resultado en la base de datos, actualiza el XP
y nivel del perfil y desbloquea la primera insignia sin permitir que el cliente
modifique directamente esos valores.

La ruta protegida `/progreso` muestra nivel, avance hacia el siguiente nivel,
simulaciones y módulos completados, precisión acumulada, insignias y actividad
reciente. Para esta primera fórmula, cada nivel requiere 250 XP.

## Scripts

| Comando | Uso |
| --- | --- |
| `npm run dev` | Inicia el entorno local. |
| `npm run build` | Genera la compilación de producción. |
| `npm run start` | Ejecuta una compilación de producción. |
| `npm run lint` | Revisa la calidad estática del código. |

## Estructura actual

```text
src/
  app/
    globals.css
    layout.tsx
    page.tsx
```

La estructura crecerá por funcionalidades a medida que se implemente cada fase,
evitando crear carpetas vacías o abstracciones prematuras.

## Roadmap

1. Configuración inicial del proyecto.
2. Sistema de diseño.
3. Landing pública responsive.
4. Supabase y políticas RLS.
5. Autenticación.
6. Dashboard.
7. Motor de simulaciones.
8. Primer escenario ficticio.
9. Persistencia, XP y progreso.
10. Arquitectura de la demo de alta fidelidad y definición del Caso 001.
11. Selección de niveles y farmacia visual navegable.
12. Caso 001 jugable de principio a fin.
13. Niveles, trampas, decisiones ramificadas y registro de errores.
14. Capacitación adaptativa, casos de refuerzo y contenido actualizado.
15. Estabilización, despliegue, QR y respaldos para la presentación.

## Demo del 20 de agosto de 2026

La línea de presentación amplía el MVP con selección visual de niveles,
farmacia 2D, etapas ficticias, errores diferidos, barreras, resultados por
competencia y entrenamiento de refuerzo. La arquitectura y el blueprint del
Caso 001 están documentados en
[`docs/demo-architecture.md`](docs/demo-architecture.md).

El contenido que hace referencia a medicamentos permanece separado del motor y
marcado como pendiente de validación profesional. Esta fase no modifica
Supabase ni reemplaza el escenario estable actual.

## Landing

La ruta principal presenta FarmaSim, sus beneficios y el flujo de aprendizaje.
Incluye un escenario visual ficticio para explicar la experiencia sin exponer
contenido clínico ni protocolos reales.

## Capturas

Las capturas se incorporarán cuando el sistema de diseño y las primeras
pantallas estén terminados.

## Autor

Proyecto desarrollado por Vicente con apoyo de Codex.

## Disclaimer

FarmaSim es un prototipo de capacitación y simulación. El contenido incluido en
esta versión es demostrativo y no reemplaza protocolos institucionales,
instrucciones profesionales, normativa sanitaria ni supervisión del químico
farmacéutico.
