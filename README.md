# FarmaVerse / FarmaSim

**Aprende. Practica. Simula.**

FarmaVerse es una plataforma web de capacitación interactiva. Dentro de la plataforma, **FarmaSim** es el módulo de simulaciones donde el usuario practica casos ficticios de farmacia mediante una escena interactiva, decisiones, verificación de información y retroalimentación final.

> El contenido de la demo es ficticio y no reemplaza protocolos institucionales, normativa sanitaria, instrucciones profesionales ni supervisión del químico farmacéutico.

## Estado actual

La aplicación incluye:

- landing pública responsive;
- autenticación con Supabase Auth;
- dashboard;
- selector de siete niveles/casos;
- simulaciones interactivas responsive para escritorio y móvil;
- progreso persistido en Supabase;
- pantalla de novedades;
- perfil y administración básica de sesión;
- despliegue en Vercel.

## Casos de simulación

Actualmente existen siete casos en `src/data/training/cases`:

1. Caso 001 — dispensación ambulatoria.
2. Caso 002 — refuerzo de concentración.
3. Caso 003 — refuerzo de concentración en un contexto distinto.
4. Caso 004 — consolidación de verificación.
5. Caso 005 — revisión de almacenamiento.
6. Caso 006 — múltiples discrepancias.
7. Caso 007 — modo experto.

Los casos 001, 002, 003, 004, 006 y 007 comparten la escena de dispensación y una lógica contextual común. El Caso 005 utiliza un flujo específico de revisión de almacenamiento.

## Arquitectura actual

El proyecto sigue un monolito modular con Next.js App Router.

```text
src/
  app/                    rutas, metadata y estilos globales
  components/             componentes visuales compartidos
  data/                    catálogo y definición de contenido
  features/                lógica de negocio y experiencias
  lib/                     utilidades e integración Supabase
  types/                   contratos TypeScript

supabase/
  migrations/              historial versionado de base de datos

public/
  brand/                   branding utilizado por la aplicación
  images/farmasim/         escena visual de las simulaciones
```

### Simulaciones activas

La ruta dinámica `src/app/(platform)/simulaciones/[slug]/page.tsx` selecciona una de tres experiencias activas:

```text
Caso 001
  -> Case001ExperienceV7

Caso 005
  -> ContextualStorageExperience

Casos 002, 003, 004, 006 y 007
  -> ContextualDispensingExperience
```

La escena interactiva común vive en:

```text
src/features/training/case001-illustrated-scene.tsx
src/features/training/case001-scene-hotspots.ts
```

La imagen actual de la farmacia es:

```text
public/images/farmasim/case001-scene.jpg
```

## Comportamiento responsive

La experiencia está diseñada para escritorio y móvil.

En escritorio:

- escena principal a la izquierda;
- panel contextual a la derecha;
- misión e información obtenida en una zona secundaria;
- al finalizar se oculta la escena y se priorizan los resultados.

En móvil:

- escena arriba;
- hotspots con área táctil ampliada;
- panel contextual debajo de la escena;
- navegación inferior persistente.

## Persistencia y progreso

Los intentos de simulación se guardan de forma idempotente mediante Supabase. El backend mantiene el progreso del usuario y el desbloqueo de niveles.

Las migraciones se conservan en `supabase/migrations` y no deben eliminarse durante tareas de limpieza del repositorio.

## Tecnologías

- Next.js 16 con App Router.
- React 19.
- TypeScript.
- Tailwind CSS 4.
- Supabase (`@supabase/ssr` y `@supabase/supabase-js`).
- Vercel.

## Requisitos

- Node.js 24.
- npm compatible con el `package-lock.json` versionado.

## Instalación

```bash
git clone <URL_DEL_REPOSITORIO>
cd farmasim
npm install
cp .env.example .env.local
npm run dev
```

En PowerShell:

```powershell
Copy-Item .env.example .env.local
```

La aplicación local queda disponible en:

```text
http://localhost:3000
```

## Variables de entorno

| Variable | Uso |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL pública del proyecto Supabase. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Clave publicable para el cliente. |
| `NEXT_PUBLIC_SITE_URL` | URL canónica para metadata y previews. |

Nunca deben versionarse claves secretas ni `service_role`.

## Scripts

| Comando | Uso |
| --- | --- |
| `npm run dev` | Inicia Next.js en desarrollo. |
| `npm run lint` | Ejecuta ESLint. |
| `npm run typecheck` | Ejecuta TypeScript sin emitir archivos. |
| `npm run build` | Genera la compilación de producción. |
| `npm run check` | Ejecuta lint, typecheck y build. |
| `npm run start` | Ejecuta una compilación ya generada. |

Antes de fusionar cambios importantes se recomienda ejecutar:

```bash
npm run check
```

## Supabase

La base contiene autenticación, perfiles, progreso e intentos. Las tablas sensibles utilizan RLS y el cliente no debe modificar directamente XP, nivel o progreso calculado.

Para aplicar migraciones en un entorno enlazado:

```bash
npx supabase db push
```

## Autenticación

FarmaVerse utiliza Supabase Auth con correo y contraseña. Las rutas de plataforma requieren una sesión válida.

La recuperación de contraseña utiliza el callback:

```text
/auth/callback
```

Las URLs de desarrollo y producción correspondientes deben estar configuradas en Supabase Auth.

## Despliegue

La demo pública está desplegada mediante Vercel y el repositorio mantiene `main` como rama de producción.

El QR utilizado para la presentación se conserva en:

```text
public/farmasim-qr.png
```

## Organización del código

Al agregar nuevas funcionalidades:

- mantener contenido de casos en `src/data/training`;
- evitar duplicar datos de un escenario dentro de varios componentes;
- reutilizar las experiencias activas antes de crear motores paralelos;
- evitar nombres versionados (`v2`, `v3`, etc.) cuando una implementación reemplaza definitivamente a otra;
- eliminar prototipos reemplazados una vez validada la nueva versión;
- mantener los estados de finalización explícitos y no inferirlos solo desde porcentajes de progreso;
- preservar `supabase/migrations` como historial de esquema.

## Documentación

- `docs/demo-architecture.md`: arquitectura funcional actual de las simulaciones.
- `docs/privacy-security.md`: consideraciones de privacidad y seguridad.
- `docs/presentation-checklist.md`: respaldo operativo para la presentación.

## Autor

Proyecto desarrollado por Vicente con apoyo de herramientas de IA para desarrollo y revisión técnica.

## Disclaimer

FarmaVerse/FarmaSim es un prototipo de capacitación y simulación. Todo paciente, medicamento, receta, identificador y situación representada en la demo debe tratarse como contenido ficticio de entrenamiento.
