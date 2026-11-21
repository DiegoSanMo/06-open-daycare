# SPEC 13 — Vinculación de padre a niño por invitación, envío con Resend y activación de cuenta

> **Status:** Implemented
> **Depends on:** SPEC 03, SPEC 05, SPEC 08, SPEC 10, SPEC 11
> **Date:** 2026-11-20
> **Objective:** Persistir y enviar por Resend las invitaciones de padres generadas desde `/kids/[id]`, y crear el usuario y el vínculo en `parent_children` cuando el padre activa su cuenta con el código recibido.

## Why this spec exists

SPEC 05 dejó el modal con validación local: `handleSubmit` solo cierra y muestra `7K4P9`, sin guardar ni enviar correo. SPEC 09 dejó fuera el signup y la tabla `invitations`. El esquema de referencia define `invitations` y `parent_children`, pero ninguna de las dos existe hoy en la BD. Este spec une las tres piezas en un solo contrato por decisión del usuario, registrando esa decisión abajo.

## Scope

**In:**

- Crear `supabase/migrations/<UTC timestamp>_create_invitations_and_parent_children.sql` con `supabase migration new create_invitations_and_parent_children`: ENUMs `relationship_type` (`father`, `mother`, `guardian`) e `invitation_status` (`pending`, `accepted`, `expired`, `cancelled`); tablas `public.invitations` y `public.parent_children` según el esquema de referencia; índices en `child_id`, `invited_by`, `parent_id` y `code`; `unique (code)` y `unique (parent_id, child_id)`; `enable row level security`.
- Permisos de la migración de tablas: `authenticated` recibe `INSERT`/`SELECT` en `invitations` solo cuando el niño pertenece al daycare del perfil (`private.current_daycare_id()` de SPEC 10) y `invited_by = auth.uid()`; `anon` no recibe privilegios de tabla. En `parent_children`, `authenticated` recibe `SELECT` (propias filas de padre o niño del daycare del staff) y ningún `INSERT`/`UPDATE`/`DELETE` de cliente. `public.users` recibe `grant select` a `authenticated` con policy que permite leer el propio perfil y los perfiles `parent` del mismo daycare cuando quien consulta es `staff`/`admin`.
- Crear `supabase/migrations/<UTC timestamp>_provision_parent_from_invitation.sql`: (a) `private.get_invitation_by_code(p_code text)`, función `SECURITY DEFINER` con `set search_path = ''`, `revoke all ... from public` y `grant execute to anon`, que devuelve únicamente `code`, `full_name`, `email`, `child_name`, `room_name`, `expires_at` cuando la invitación está `pending`, no vencida y el código coincide en mayúsculas; (b) reemplazar `private.handle_auth_user_created()` para mantener el alta de staff de SPEC 08 y agregar la ruta de padre: si no hay `role` en `raw_app_meta_data`, exige `raw_user_meta_data->>'invitation_code'` que coincida con `new.email` y una invitación `pending` vigente, deriva `daycare_id` del niño, `role = 'parent'`, `full_name`/`relationship` de la invitación, inserta el perfil, inserta `parent_children` y marca la invitación `accepted` con `accepted_at = now()`.
- Generar el código en servidor con `crypto`: 5 caracteres `A–Z0–9`, `unique` en `invitations` con reintento ante colisión, `expires_at = now() + interval '7 days'`. El literal `7K4P9` desaparece: el modal muestra el código real recién generado en un estado de confirmación, con "Vence en 7 días" derivado de `expires_at`.
- Instalar `resend` con `npm install --save-exact resend` y commitear `package.json`/`package-lock.json`. La API key vive en `RESEND_API_KEY` dentro de `.env.local` (nunca `NEXT_PUBLIC_*`); el remitente es `process.env.RESEND_FROM ?? "OpenDayCare <onboarding@resend.dev>"`. Documentar ambos nombres en `.env.template` sin valores.
- Crear `app/_actions/invitations.ts` con `"use server"`: `createInvitation` (valida nombre/email/parentesco/`childId`, verifica pertenencia del niño al daycare del staff, inserta la invitación, envía HTML por Resend con link `${origin}/activate-account?code=<CODE>` construido desde `headers()`, y devuelve estado con código y `expires_at`), `resendInvitation` (reenvía una invitación `pending` del daycare del staff con idempotency key distinta) y `getInvitationPreview` (llama al RPC `private.get_invitation_by_code` con el cliente SSR).
- Si Resend falla: la invitación queda `pending`, el action devuelve el código y un mensaje en español, y el modal ofrece "Reenviar correo" sobre la misma fila. El modal solo se cierra con el formulario limpio cuando la invitación se persistió; el error de correo no se presenta como éxito.
- Modificar `app/_components/LinkParentModal.tsx`: conservar diseño, textos, foco, focus trap, `Escape` y overlay de SPEC 05; reemplazar `handleSubmit` local por `useActionState` con `createInvitation`; prop nueva `childId`; botón "Enviando…" deshabilitado en `pending`; errores del servidor en `role="alert"`; estado de confirmación con código real, vencimiento y botón de reenvío cuando corresponda.
- Modificar `app/_components/LinkParentButton.tsx` para recibir y pasar `childId` al modal sin cambiar su apariencia.
- Modificar `app/(protected)/kids/[id]/page.tsx`: resolver el niño de BD por `full_name` normalizado con la misma regla de slug de `app/_data/children.ts` (primer match ordenado por `created_at`); pasar su UUID al botón; reemplazar `kid.linkedParents` por: vínculos `accepted` de `parent_children` join `users`, e invitaciones `pending` vigentes, mapeados a `Mamá`/`Papá`/`Tutor/a`, badges `ACTIVA`/`PENDIENTE` y el mismo maquetado. Si no hay fila en `children`, mantener los fixtures actuales y dejar el CTA deshabilitado con `aria-disabled`.
- Modificar `app/activate-account/page.tsx`: Server Component con `<Suspense>` y un hijo async que espera `searchParams` (tipado `PageProps<'/activate-account'>`), llama a `getInvitationPreview` y pasa el resultado a un componente nuevo. Sin código, con código inválido/vencido o email distinto: `role="alert"` con "El código de invitación no es válido o venció." y CTA deshabilitado.
- Crear `app/_components/ActivateAccountForm.tsx` como Client Component: código y email precargados y `readOnly` desde la invitación, tarjeta del niño con inicial/etiqueta reales, password y checkbox de consentimiento obligatorios, errores en español, estado "Activando…", `supabase.auth.signUp({ email, password, options: { data: { invitation_code: code } } })` con `utils/supabase/client.ts` y navegación completa a `/login` tras el éxito.
- Modificar `app/_data/auth.ts` y `app/_data/kids.ts`: quitar `activationFixture` e `invitationFixture`, conservar `parentRelationOptions` y agregar el mapa `mother → Mamá`, `father → Papá`, `guardian → Tutor/a`; los textos visibles siguen en español y lo persistido en inglés.
- Verificar con `supabase db reset` local y `supabase db push --remote --yes`, `execute_sql`/`get_advisors`, `npx eslint app proxy.ts utils`, `npx tsc --noEmit`, `npm run build` y recorridos de Playwright a 1440×900 con artefactos en `.playwright-mcp/` (sin commitearlos).

**Out of scope (para futuros specs):**

- Dominio propio verificado, webhooks de Resend, plantillas con `@react-email/components`, envíos masivos ni tracking de entrega.
- Cron o job que cambie `status` a `expired`; la expiración se evalúa contra `expires_at` en el lookup y en el trigger.
- Cancelación de invitaciones, reenvío automático, edición o borrado de padres/vínculos.
- Recuperación de contraseña, confirmación de email configurable, cambio de contraseña ni "¿Olvidaste tu contraseña?".
- Migrar `/kids/[id]` a UUID en la URL: niños creados en BD sin fixture siguen dando 404.
- Feed real del padre (`post_children`), notificaciones push, `devices` ni resúmenes diarios.
- Cambios en `AppShell`, feed `/`, `/login`, `/kids`, specs 01–12 ni diseño responsive.

## Data model

```sql
create type public.relationship_type as enum ('father', 'mother', 'guardian');
create type public.invitation_status as enum ('pending', 'accepted', 'expired', 'cancelled');

-- public.invitations
-- id uuid pk default gen_random_uuid()
-- child_id uuid fk -> public.children(id)
-- invited_by uuid fk -> public.users(id)
-- full_name text not null
-- email text not null
-- relationship public.relationship_type not null
-- code text unique not null                -- 5 chars A-Z0-9
-- status public.invitation_status not null default 'pending'
-- expires_at timestamptz not null          -- now() + interval '7 days'
-- accepted_at timestamptz null
-- created_at timestamptz not null default now()

-- public.parent_children
-- id uuid pk default gen_random_uuid()
-- parent_id uuid fk -> public.users(id)
-- child_id uuid fk -> public.children(id)
-- relationship public.relationship_type not null
-- created_at timestamptz not null default now()
-- unique (parent_id, child_id)

-- private.get_invitation_by_code(p_code text)
--   returns table(code text, full_name text, email text,
--                 child_name text, room_name text, expires_at timestamptz)

-- private.handle_auth_user_created()  -- reemplazo, mismo trigger de SPEC 08
--   staff: lee raw_app_meta_data como hoy
--   parent: valida raw_user_meta_data->>'invitation_code' + new.email contra invitations
```

```ts
// app/_actions/invitations.ts (tipos de UI, no persistidos)
type InvitationState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | {
      status: "sent";
      code: string;
      email: string;
      expiresAt: string;
      resendError?: string;
    };

type InvitationPreview = {
  code: string;
  fullName: string;
  email: string;
  childName: string;
  roomName: string;
  expiresAt: string;
};
```

Convenciones: valores persistidos en inglés; etiquetas en español solo en la capa de UI; `raw_user_meta_data` se usa únicamente como clave de búsqueda de una invitación verificada en BD, nunca como autorización.

## Implementation plan

1. **Dependencias y entorno.** Instalar `resend` con versión fija, documentar `RESEND_API_KEY`/`RESEND_FROM` en `.env.template`, verificar que `npm run build` sigue pasando.
2. **Migración de tablas.** Crear y aplicar la migración de ENUMs, tablas, índices, RLS, grants y policies; verificar columnas, `relrowsecurity`, privilegios y rechazo de acceso `anon` en local y remoto.
3. **Migración de funciones.** Crear y aplicar el RPC anónimo y el trigger extendido; verificar que el alta de `staff@salasoles.test` sigue creando su perfil y que un `signUp` con código inválido falla sin perfil huérfano.
4. **Capa de acciones.** Implementar `createInvitation`, `resendInvitation` y `getInvitationPreview` con validación, generación de código, envío HTML y manejo de error de Resend; verificar con `tsc` y una llamada manual.
5. **Modal conectado.** Cablear `useActionState`, estados `pending`/`error`/`sent`, código real y reenvío; verificar que `7K4P9` ya no aparece y que la validación local se mantiene.
6. **Perfil con datos reales.** Resolver el niño por slug y mostrar vínculos e invitaciones pendientes desde BD; verificar en `/kids/mateo-fernandez` el badge `PENDIENTE` tras enviar.
7. **Activación real.** Montar la página con `searchParams` bajo `<Suspense>` y el formulario con `signUp`; verificar el recorrido completo hasta `/login` y el alta del vínculo por SQL.
8. **Verificación final.** Chequeos estáticos, build, advisors, recorridos Playwright (staff envía, correo llega, padre activa, perfil actualizado) y capturas sin commitear.

## Acceptance criteria

- [x] Existen las dos migraciones creadas con `supabase migration new` y aplicadas en local y remoto.
- [x] `invitations` y `parent_children` tienen las columnas, ENUMs, defaults, FKs y `unique` de la sección Data model.
- [x] `anon` no tiene privilegios de tabla en `invitations`, `parent_children` ni `users`.
- [x] Un staff inserta una invitación para un niño de su daycare; un intento con niño de otro daycare falla por RLS.
- [x] `private.get_invitation_by_code` es `SECURITY DEFINER`, tiene `search_path = ''`, `grant execute to anon` y no hay policy `SELECT` anónima en `invitations`.
- [x] El RPC devuelve datos solo para un código vigente y no devuelve nada para un código vencido, `accepted` o inexistente.
- [x] El código generado tiene 5 caracteres alfanuméricos en mayúsculas, es único y vence 7 días después del alta.
- [x] Enviar el modal crea la fila `pending`, envía el correo por Resend y el link del correo contiene `/activate-account?code=<CODE>`.
- [x] El modal muestra el código real y "Vence en 7 días" en el estado de confirmación, sin el literal `7K4P9`.
- [x] Si Resend responde error, la invitación sigue `pending`, aparece un `role="alert"`, el modal ofrece "Reenviar correo" y el reenvío usa la misma fila.
- [x] El botón "Enviar invitación" queda deshabilitado con texto "Enviando…" durante la action.
- [x] El bloque "PADRES VINCULADOS" de `/kids/mateo-fernandez` muestra las invitaciones `pending` vigentes con badge `PENDIENTE` y los vínculos `accepted` con badge `ACTIVA`.
- [x] `/activate-account?code=<CODE>` precarga código, email y tarjeta del niño reales, sin los valores de `activationFixture`.
- [x] Sin código, con código inválido o vencido aparece "El código de invitación no es válido o venció." y el CTA está deshabilitado.
- [x] Activar con el código correcto crea un `auth.users` con role `parent`, su fila en `public.users` con el `daycare_id` del niño, `full_name` de la invitación y una fila en `parent_children` con la `relationship` mapeada.
- [x] Activar con un código válido pero otro email falla y no crea usuario ni vínculo.
- [x] El alta de `staff@salasoles.test` sigue creando su perfil `staff`/`active` con el trigger modificado.
- [x] Tras activar, la navegación completa llega a `/login` y el nuevo padre puede iniciar sesión.
- [x] Después del login del padre, el perfil del niño muestra el vínculo `ACTIVA` con nombre y parentesco de la invitación.
- [x] `raw_user_meta_data` no se usa en ninguna policy ni predicado de autorización.
- [x] No hay secretos de Resend en `NEXT_PUBLIC_*`, en el spec, en migraciones ni en archivos commiteados.
- [x] `npx eslint app proxy.ts utils`, `npx tsc --noEmit` y `npm run build` terminan sin errores con `cacheComponents: true`.
- [x] Los recorridos de Playwright terminan con 0 errores en consola y las capturas quedan fuera del commit.

## Decisions

- **Sí:** un solo spec para BD, correo y activación; decisión explícita del usuario pese a que la skill sugería dividirlo. Las decisiones quedan aquí para no reabrirlas durante la implementación.
- **Sí:** resolver el niño por `full_name` normalizado desde el slug de `/kids/[id]`. Mantiene las URLs y evita migrar el perfil a UUID en este spec.
- **Sí:** código aleatorio generado al enviar, mostrado en la confirmación. Evita el código predecible del prototipo sin agregar una request al abrir el modal.
- **Sí:** Server Action + HTML inline con `resend`. El API key queda en servidor; no se agrega `@react-email/components`.
- **Sí:** modo prueba con `onboarding@resend.dev`. El correo de prueba se envía al email del dueño de la cuenta Resend, configurado fuera del repo.
- **Sí:** la invitación se guarda aunque falle Resend. Permite reenviar sin perder el código ni la relación con el niño.
- **Sí:** lookup anónimo mediante función `private` y `grant execute to anon`. La tabla `invitations` no se expone a PostgREST para usuarios sin sesión.
- **Sí:** aprovisionar el padre desde el trigger de `auth.users` validando código + email contra la BD. `raw_user_meta_data` entra como dato del formulario, nunca como autorización; evita `service_role`.
- **Sí:** link con `?code=` en el correo, email y código precargados y de solo lectura; password y consentimiento los elige el padre.
- **Sí:** redirigir a `/login` tras activar. El flujo de sesión de SPEC 09 queda intacto.
- **Sí:** mostrar vínculos reales en el perfil; los fixtures quedan solo como fallback cuando no hay fila en `children`.
- **No:** `service_role`, exposición de `users` a la Data API sin policy, `raw_user_meta_data` como autorización ni `SECURITY DEFINER` sin validación contra BD.
- **No:** cron de expiración, cancelación, React Email, dominio propio, feed del padre ni responsive.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| El trigger extendido rompe el alta de staff de SPEC 08 | Mantener la rama `app_metadata` intacta y repetir la prueba de regresión con `staff@salasoles.test`. |
| Supabase Auth exige confirmación de email y no crea sesión | Verificar la configuración del proyecto antes del recorrido; si está activa, la UI informa que debe confirmar y el perfil/vínculo ya quedó creado por el trigger. |
| Resend en modo prueba solo entrega al email del dueño | Usar ese email como invitado en la prueba, sin escribirlo en archivos versionados. |
| Código duplicado por colisión | `unique (code)` + reintento en el action; criterio de aceptación explícito. |
| `searchParams` async rompe el prerender con `cacheComponents` | Componente async hijo dentro de `<Suspense>` y validación con `npm run build`. |
| Dos niños con el mismo `full_name` derivan al mismo slug | Query ordenada por `created_at` con `limit(1)`, documentada como regla determinista. |
| El RPC permita adivinar códigos | Código de 5 caracteres, validación de vigencia en la función y sin `SELECT` anónimo; el `signUp` vuelve a validar código + email en el trigger. |

## What is **not** in this spec

- Envío masivo, webhooks, dominio propio, plantillas React Email ni reenvío automático.
- Cron de expiración, cancelación de invitaciones ni borrado de vínculos.
- Recuperación de contraseña, confirmación de email ni cambios en `/login`.
- Migrar `/kids/[id]` a UUID, feed del padre, notificaciones push ni niños nuevos con perfil real.
- Cambios en `AppShell`, feed, `/kids`, specs 01–12 ni diseño responsive.

Cada uno de esos puntos, si se aborda, irá en su propio spec.

## Verification

Fecha: 2026-11-21. Rama: `spec-13-parent-invitation-and-activation`.

**Estáticos y build.** `npx eslint app proxy.ts utils`, `npx tsc --noEmit` y `npm run build` terminaron sin errores con `cacheComponents: true`; `/activate-account` y `/kids/[id]` figuran como Partial Prerender.

**Migraciones y BD.** `supabase db reset` aplicó las 7 migraciones en local; `supabase db push --remote --yes` devolvió `upToDate: true`. `20261120194330` y `20261120195344` están en local y remoto. `get_advisors` no reportó hallazgos nuevos (solo WARNs preexistentes e INFOs de índices no usados). Inspección de `information_schema`/`pg_constraint`/`pg_proc`/`pg_policies`: columnas, ENUMs, FKs, `unique (code)`, `unique (parent_id, child_id)`, `relrowsecurity`, grants (`anon` sin privilegios de tabla, `authenticated` con `INSERT,SELECT` en `invitations` y `SELECT` en `parent_children`/`users`), `SECURITY DEFINER` + `search_path = ''` en `private.get_invitation_by_code`, `SECURITY INVOKER` en el wrapper público y ninguna policy con `raw_user_meta_data`.

**SQL funcional (local, transacción revertida).** `staff_profile_created=t`; `rpc_pending_case_insensitive=t`; `rpc_hides_accepted=t`; `rpc_hides_expired=t`; `parent_profile_created=t`; `parent_child_link_created=t`; `invitation_marked_accepted=t`; `wrong_email_rejected=true`. RLS: `own_daycare_insert=t`, `other_daycare_insert=f`, `anon_select=f`.

**Playwright 1440×900 (0 errores de consola en el recorrido final).** Login staff → `/kids/mateo-fernandez` → modal → invitación persistida `pending` con código real `07Q48` y "Vence en 7 días". Con `RESEND_API_KEY` vacío apareció el `role="alert"` de error y "Reenviar correo" reutilizó la misma fila/código (el perfil pasó a `PENDIENTE`). `/activate-account?code=NOPE1` mostró el alerta exacta con CTA deshabilitado; con `07Q48` precargó código, email y "Mateo Fernández · Sala Soles". La validación de consentimiento y el `signUp` completos crearon el perfil `parent`, el vínculo `mother` y marcaron la invitación `accepted`. Tras el logout/login del padre, el perfil del niño mostró "Lucía Prueba · Mamá · activa" con badge `ACTIVA`. Capturas en `.playwright-mcp/spec13-01…05*.png`, sin trackear.

**Limitación registrada.** El envío real por Resend no se ejecutó: no se dispone del email del dueño autorizado como destinatario de prueba y se evitó enviar correo a una dirección inventada. El link `${origin}/activate-account?code=<CODE>` y el remitente se verificaron por inspección de `app/_actions/invitations.ts`, y la rama de fallo (incluido el reenvío) se verificó en el navegador. Queda pendiente únicamente una prueba de entrega con el destinatario configurado fuera del repo.
