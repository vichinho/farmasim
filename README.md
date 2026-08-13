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
`/simulaciones`, `/aprender`, `/progreso` y `/perfil` requieren una sesión
validada. Para que los enlaces de recuperación funcionen fuera de desarrollo,
agrega la URL de producción y `http://localhost:3000/auth/callback` a las
Redirect URLs de Supabase Auth.

## Dashboard

La ruta protegida `/dashboard` muestra el nombre, nivel y XP del perfil
autenticado. También consulta el conteo propio de módulos completados y de
simulaciones de los últimos siete días. Las tarjetas de cápsulas y simulaciones
preparan la experiencia de las próximas fases y no enlazan a rutas aún no
implementadas.

## Motor de simulaciones

La ruta protegida `/simulaciones` contiene una práctica técnica completamente
ficticia. El motor interpreta escenarios definidos como datos y separa los
nodos visuales de la lógica de avance, respuestas, precisión y XP. En esta
etapa los resultados solo viven durante la sesión del navegador; la
persistencia se incorporará en la fase de progreso.

## Primer escenario

La ruta protegida `/simulaciones` presenta **Tu primera atención**, un escenario
completamente ficticio con un paciente virtual, cuatro decisiones, feedback
inmediato y un resultado con precisión, XP, errores y tiempo. Sus decisiones
evalúan únicamente comunicación general y no representan indicaciones,
procedimientos ni reglas de dispensación farmacéutica.

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
10. Modo demo, despliegue y QR.

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
