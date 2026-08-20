# QA E2E autenticado — Supervisor/QF y TENS

Este flujo valida K–N con identidades reales de Supabase Auth sin reutilizar cuentas existentes.

## Cuentas QA

El script `scripts/qa-users.mjs` administra exclusivamente estas identidades:

- `qa-supervisor@farmaverse.invalid` → `supervisor` → Hospital de Tomé.
- `qa-tens-tome@farmaverse.invalid` → `learner` → Hospital de Tomé.
- `qa-tens-bellavista@farmaverse.invalid` → `learner` → CESFAM Bellavista.

No reutilizar cuentas reales para estas pruebas.

## Variables requeridas

Las credenciales administrativas se usan solo desde el entorno local o CI y nunca deben guardarse en GitHub.

```bash
export QA_E2E_CONFIRM=FARMAVERSE_QA
export SUPABASE_URL="https://<project-ref>.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="<secret>"
export QA_E2E_PASSWORD="<password-de-qa-de-al-menos-16-caracteres>"
```

`SUPABASE_SERVICE_ROLE_KEY` nunca debe exponerse con prefijo `NEXT_PUBLIC_` ni incorporarse a código cliente.

## Provisionar

```bash
npm run qa:users:provision
```

El comando es idempotente. Si las identidades QA ya existen, actualiza su contraseña, metadatos de QA, rol y establecimiento en vez de crear duplicados.

La creación usa `supabase.auth.admin.createUser` con `email_confirm: true`, por lo que no depende de correos de confirmación.

## Prueba K — Supervisor/QF y aislamiento

1. Iniciar sesión como `qa-supervisor@farmaverse.invalid`.
2. Abrir `/supervision`.
3. Confirmar que puede ver `QA TENS Tomé`.
4. Abrir el perfil individual de esa TENS.
5. Confirmar que puede ver intentos, competencias y alertas disponibles de ese establecimiento.
6. Intentar acceder al perfil de `QA TENS Bellavista` mediante su URL directa.
7. Debe quedar bloqueado por RLS / responder como recurso no disponible.
8. Confirmar que el rol Supervisor no sustituye ni altera TENS 1/TENS 2 dentro de la simulación.

## Prueba L — Cápsula educativa

1. Como Supervisor/QF, abrir `/supervision/capsulas`.
2. Crear una cápsula de QA en Hospital de Tomé.
3. Pasarla por el estado requerido hasta `published`.
4. Asignarla a `QA TENS Tomé`.
5. Cerrar sesión.
6. Iniciar sesión como `qa-tens-tome@farmaverse.invalid`.
7. Abrir `/capsulas` y comprobar que la cápsula aparece.
8. Abrirla y comprobar que la asignación pasa a `opened`.
9. Marcarla como completada y comprobar `completed`.
10. Volver a Supervisor/QF y confirmar la trazabilidad `assigned → opened → completed`.
11. Confirmar que `QA TENS Bellavista` no puede ver esa cápsula de Tomé.

## Prueba M — Alerta de simulación

1. Como `QA TENS Tomé`, ejecutar un escenario normal, no un piloto QA que omite persistencia.
2. Provocar deliberadamente una desviación evaluable.
3. Terminar o detener de forma segura el caso.
4. Confirmar que el intento se guarda.
5. Confirmar que se crea `SimulationAlert` asociada al intento.
6. Iniciar sesión como Supervisor/QF.
7. Confirmar que la alerta aparece en el perfil de la TENS.
8. Verificar que se presenta como **alerta de simulación** y no como incidente clínico real.
9. Confirmar `reachedPatient = false` salvo que el modelo futuro cambie explícitamente esta regla.

## Prueba N — Privacidad y permisos

Validar explícitamente:

- Supervisor Tomé no accede a perfiles, intentos, alertas ni cápsulas privadas de Bellavista.
- TENS solo accede a sus datos propios y cápsulas asignadas/publicadas.
- Un Supervisor no puede asignar una cápsula de Tomé a una TENS de Bellavista.
- Los archivos privados de cápsulas respetan el mismo aislamiento de establecimiento/asignación.

## Limpieza

Cuando termine la prueba:

```bash
npm run qa:users:cleanup
```

El comando elimina únicamente las tres identidades con correo QA definido por el script. Las relaciones dependientes se eliminan mediante las claves foráneas/cascadas ya configuradas.

## Gate de aprobación

K–N solo pueden declararse **PASS E2E** cuando el recorrido anterior se haya ejecutado con sesiones reales. La prueba transaccional SQL de RLS es evidencia complementaria, no sustituta del E2E autenticado.
