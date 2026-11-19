# SPEC 09 — Autenticación con email y contraseña y protección de rutas

> **Status:** Approved  
> **Depends on:** SPEC 03, SPEC 08  
> **Date:** 2026-11-19  
> **Objective:** Conectar `/login` a Supabase Auth con email y contraseña, habilitar el cierre de sesión y bloquear el acceso a las rutas de la app para usuarios sin sesión válida.

## Why this spec exists

SPEC 03 dejó `/login` y el botón de salida como réplicas estáticas "sin autenticación ni backend", y SPEC 08 creó el usuario staff real en `auth.users` sin conectar la app. Este spec cierra ese hueco: hace funcionar el login contra ese usuario y agrega la capa de protección que hoy no existe.

## Scope

**In:**

- Convertir el panel derecho de `app/login/page.tsx` en un `app/_components/LoginForm.tsx` Client Component que llama a `signInWithPassword({ email, password })` usando `utils/supabase/client.ts`, conservando textos, tokens, clases y accesibilidad de SPEC 03.
- Enviar el formulario con `email`/`password` reales: sin precargar el fixture `caro@opendaycare.com`; el campo arranca vacío con placeholder `correo@ejemplo.com`.
- Estados del formulario: validación nativa de email/password requeridos, CTA deshabilitado y texto `Ingresando…` durante el envío, y un `role="alert"` con mensaje en español ante error de Supabase.
- Éxito de login: navegación completa a `/` (`window.location.assign("/")`) para que el proxy corra con las cookies ya escritas por el browser client.
- Reemplazar el `<a aria-disabled="true" title="Cerrar sesión">` de `app/_components/AppShell.tsx` por `app/_components/LogoutButton.tsx` (Client Component) que llama a `signOut()` y luego navega a `/login`, conservando clases, SVG y tooltip.
- Extender `utils/supabase/middleware.ts`: usar `claims` de `getClaims()` para redirigir a `/login` toda ruta protegida sin sesión, y a `/` las rutas públicas con sesión, copiando al response de redirect las cookies y los headers de caché generados por `setAll`.
- Crear el route group `app/(protected)/` con `app/(protected)/layout.tsx` que verifica `getUser()` vía `utils/supabase/server.ts` y redirige a `/login`. Mover `app/page.tsx`, `app/kids/` y `app/todos/` dentro del grupo; `app/login/` y `app/activate-account/` quedan fuera. Las URLs no cambian.
- Verificar con Playwright los flujos anónimo, login correcto, login incorrecto, logout y el redirect de usuarios autenticados, más captura visual de `/login` a 1440×900.

**Out of scope (para futuros specs):**

- Signup real de `/activate-account`, validación de códigos de invitación y creación de la tabla `invitations`.
- Recuperación de contraseña y verificación/confirmación de email; "¿Olvidaste tu contraseña?" sigue inerte.
- Autorización por rol (`staff` / `parent` / `admin`): toda sesión válida accede; los permisos finos se resuelven con RLS y en specs futuros.
- Parámetro `next` para volver a la ruta solicitada tras el login.
- Cambios en la base de datos, migraciones, RLS, policies o en los specs 07/08.
- Persistencia de datos de dominio, feed real, composición de posts ni modificación de `AppShell` fuera del botón de salida.
- Diseño móvil/tablet y tests automatizados nuevos más allá de lint, typecheck y build.

## Data model

Este spec no introduce tablas, columnas ni estructuras persistentes nuevas. Reutiliza `auth.users` (SPEC 08), los clientes de `utils/supabase/{client,server,middleware}.ts` y los fixtures de `app/_data/auth.ts`.

```ts
// Estado local de app/_components/LoginForm.tsx (no persistido)
type LoginFormState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "error"; message: string };
```

Convenciones:

- Las credenciales no se guardan en localStorage, cookies propias ni fixtures; solo viven en los inputs controlados por el componente.
- `app/_data/auth.ts` pierde `loginFixture` (su email era un dato de ejemplo de SPEC 03); `activationFixture` permanece intacto.
- Los mensajes visibles van en español; los errores de Supabase se mapean a texto propio antes de mostrarse.

## Implementation plan

1. **Helper de servidor.** Crear `utils/supabase/auth.ts` con `requireUser()` que llama a `getUser()` con `await createClient()` y ejecuta `redirect("/login")` si no hay usuario. Verificación: `npx tsc --noEmit` limpio.
2. **Route group protegido.** Crear `app/(protected)/layout.tsx` con un `<Suspense fallback={null}>` que envuelva un componente async `AuthGuard` (llama a `requireUser()` y renderiza `children`). Mover `app/page.tsx`, `app/kids/` y `app/todos/` al grupo, sin cambiar su contenido. Tipar props como `{ children: React.ReactNode }` para no depender de `LayoutProps<"/">`. Verificación: `GET /` anónimo devuelve 307 a `/login` y `npm run build` pasa con `cacheComponents`.
3. **Redirects en el proxy.** En `utils/supabase/middleware.ts`, capturar `claims`, definir `isPublicPath` para `/login` y `/activate-account`, y redirigir según corresponda; copiar al `NextResponse.redirect` todas las cookies de `supabaseResponse` y los headers de no-cache. Verificación: `GET /` y `GET /kids/mateo` anónimos → `/login`; con sesión, `GET /login` → `/`.
4. **Login real.** Crear `app/_components/LoginForm.tsx` con `signInWithPassword`, estados `idle/submitting/error`, `role="alert"` y navegación completa a `/`. Reemplazar el panel derecho de `app/login/page.tsx` por el componente, sin tocar el panel coral. Verificación: credenciales incorrectas muestran el alert y no navegan; correctas llegan a `/` con cookie de sesión.
5. **Logout real.** Crear `app/_components/LogoutButton.tsx` con `signOut()` + navegación a `/login` y reemplazar el ancla inerte en `AppShell.tsx`. Verificación: tras el clic, `/` vuelve a redirigir a `/login`.
6. **Verificación final.** Correr `npx eslint app proxy.ts utils`, `npx tsc --noEmit` y `npm run build`; ejecutar los recorridos de Playwright y comparar `/login` a 1440×900 contra la captura de SPEC 03, guardando artefactos en `.playwright-mcp/` sin commitearlos.

## Acceptance criteria

- [ ] `GET /`, `/kids`, `/kids/mateo` y `/todos` sin sesión responden 307 a `/login`.
- [ ] Con sesión válida, `GET /login` y `GET /activate-account` responden 307 a `/`.
- [ ] La respuesta 307 del proxy conserva las cookies refrescadas por `setAll` y los headers `Cache-Control: private, no-cache, no-store, must-revalidate, max-age=0`, `Expires: 0` y `Pragma: no-cache`.
- [ ] `app/(protected)/layout.tsx` invoca `getUser()` y redirige a `/login` cuando no hay usuario, sin depender solo del proxy.
- [ ] Las URLs `/`, `/kids/*` y `/todos` no cambian tras mover los archivos al route group.
- [ ] `/login` envía a `signInWithPassword` exactamente los valores escritos por el usuario, sin email precargado.
- [ ] Credenciales inválidas muestran un `role="alert"` en español y permanecen en `/login`.
- [ ] Credenciales válidas de `staff@salasoles.test` terminan en `/` con una cookie de sesión válida y el feed renderiza.
- [ ] Durante el envío, el CTA "Iniciar sesión" queda deshabilitado y muestra `Ingresando…`.
- [ ] "Cerrar sesión" ejecuta `signOut()`, redirige a `/login` y, tras el clic, `/` vuelve a redirigir a `/login`.
- [ ] El botón de salida conserva `title="Cerrar sesión"`, clases y SVG del prototipo.
- [ ] No aparece selector de rol ni lógica que distinga `staff`/`parent`/`admin` en la app.
- [ ] No se crean migraciones ni se modifican tablas, RLS, policies ni los specs 07/08.
- [ ] `npx eslint app proxy.ts utils`, `npx tsc --noEmit` y `npm run build` terminan sin errores.
- [ ] No hay errores ni warnings nuevos en la consola del navegador.
- [ ] La comparación visual a 1440×900 de `/login` contra SPEC 03 no muestra diferencias salvo el campo email sin precargar.

## Decisions

- **Sí:** login y logout únicamente. `staff@salasoles.test` ya existe por SPEC 08; el signup real depende de `invitations`, que no existe todavía.
- **Sí:** Client Component con `utils/supabase/client.ts`. Conserva la réplica visual de SPEC 03, permite errores inline y evita el `redirect('/error')` de la plantilla oficial.
- **Sí:** `getClaims()` en el proxy para refresh y redirect, `getUser()` en el layout para verificación real. Context7 confirma que `getClaims()` resuelve el JWT localmente mientras `getUser()` consulta el servidor de Auth; ambas capas son complementarias.
- **Sí:** copiar cookies y headers de no-cache al response de redirect. Sin esto se descarta el refresh de sesión justo en el momento de navegar.
- **Sí:** route group `app/(protected)/`. Es la única forma de aplicar un layout a `/`, `/kids` y `/todos` sin proteger también `/login` y `/activate-account`.
- **Sí:** `<Suspense>` around `AuthGuard`. Requerido por `cacheComponents: true` para lecturas dinámicas de cookies en el layout.
- **Sí:** navegación completa (`window.location.assign`) tras login y logout. Garantiza que el proxy reevalúe las cookies recién escritas antes de renderizar RSC.
- **Sí:** mensajes de error en español mapeados desde `error.message`. Las credenciales inválidas dicen "Email o contraseña incorrectos."; el resto, "No se pudo iniciar sesión. Intentá nuevamente.".
- **No:** parámetro `next`. Suficiente con volver a `/` en el estado actual de la app.
- **No:** autorización por rol. SPEC 03 eliminó el selector de rol y RLS ya resuelve pertenencia en SPEC 08.
- **No:** signup, activación real, recuperación ni confirmación de email. Cada uno merece su propio spec.
- **No:** cambios de base de datos ni de `proxy.ts` fuera de lo que ya delega en `utils/supabase/middleware.ts`.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| El redirect del proxy pierde las cookies refrescadas | Copiar explícitamente `supabaseResponse.cookies` y los headers de no-cache al `NextResponse.redirect`; verificar con Playwright que la sesión sobrevive. |
| `cacheComponents` rechaza `getUser()` en el layout | Envolver el guard async en `<Suspense fallback={null}>` y validar con `npm run build`. |
| El browser client escribe cookies pero el RSC sirve HTML cached | Navegación completa tras `signInWithPassword` y `signOut`. |
| `getClaims()` expone claims sin verificación de red | Usarlo solo para el gate del proxy; el layout llama a `getUser()` contra el servidor de Auth. |
| Mover archivos al route group rompe imports relativos | `app/_components` y `app/_data` quedan en `app/`; revisar imports con `npx tsc --noEmit` y rutas con Playwright. |
| La contraseña del staff no vive en el repo | El login se prueba con credenciales provistas fuera del versionado; nunca escribirlas en el spec ni en archivos. |

## What is **not** in this spec

- Signup/activación de cuentas, tabla `invitations` ni validación de códigos.
- Recuperación de contraseña, confirmación de email ni "¿Olvidaste tu contraseña?" funcional.
- Permisos por rol, parámetro `next` ni cambios de esquema, RLS o migraciones.
- Datos reales de dominio, feed real, composición de posts ni cambios en `AppShell` fuera del logout.

Cada uno de esos puntos, si se aborda, irá en su propio spec.
