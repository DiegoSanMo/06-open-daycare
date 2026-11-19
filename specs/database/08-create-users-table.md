# SPEC 08 — Tabla `users`, ENUMs de usuario, trigger de provisión y usuario staff de prueba

> **Status:** Approved  
> **Depends on:** SPEC 07  
> **Date:** 2026-11-19  
> **Objective:** Crear los ENUMs `user_role` y `user_status`, la tabla `public.users` vinculada a `auth.users`, el trigger de provisión de perfil, las policies RLS de `users` y `daycares`, y un usuario staff de prueba real en Supabase, sin conectar todavía la app.

## Scope

**In:**

- Crear `supabase/migrations/<UTC timestamp>_create_users_table.sql` con `supabase migration new create_users_table`, conteniendo: `create schema if not exists private`, los ENUMs `public.user_role` (`staff`, `parent`, `admin`) y `public.user_status` (`pending`, `active`), la tabla `public.users`, índices en columnas usadas por RLS/FK, `alter table ... enable row level security` en `public.users`, funciones y triggers de `updated_at` y de provisión `AFTER INSERT` en `auth.users`, y las policies de esta spec.
- Definir `public.users` según la referencia: `id uuid primary key references auth.users(id) on delete cascade`, `daycare_id uuid not null references public.daycares(id)`, `role public.user_role not null`, `status public.user_status not null default 'active'`, `full_name text not null`, `avatar_url text`, `notify_on_post boolean not null default true`, `daily_summary_enabled boolean not null default true`, `created_at timestamptz not null default now()`, `updated_at timestamptz not null default now()`.
- Implementar el trigger de provisión leyendo `role`, `daycare_id` y `full_name` desde `new.raw_app_meta_data` (equivalente a `app_metadata` en la creación del usuario), en lugar de `raw_user_meta_data`, y documentar la desviación respecto a la nota de implementación de la referencia.
- Actualizar `updated_at` automáticamente en cada `UPDATE` de `public.users` mediante un trigger dedicado.
- Crear las policies RLS mínimas: el usuario autenticado puede leer su propia fila en `public.users` (`select` donde `id = (select auth.uid())`, `to authenticated`); el usuario autenticado puede leer la fila de `public.daycares` a la que pertenece su perfil (policy `select` en `public.daycares` que resuelve la pertenencia vía `public.users`).
- Ajustar el acceso de tablas expuestas tocadas por la spec: revocar privilegios de `anon` y `authenticated` en `public.users` y no volver a otorgarlos (sin exposición a Data API todavía); otorgar a `authenticated` solo el privilegio necesario para que la policy de lectura de `public.daycares` funcione.
- Crear un usuario staff de prueba real en Supabase Auth (email fijo `staff@salasoles.test`, vinculado a la guardería seed `a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d`) para que el trigger genere su fila en `public.users` con `role = 'staff'` y `status = 'active'`. La contraseña se define en el entorno local/remoto en el momento del alta y **nunca** se commitea ni se escribe en la migración.
- Verificar en local (`supabase start` + `supabase db reset`) y en remoto (`supabase db push`): tipos/enums, columnas, defaults, FKs, RLS, policies, trigger y fila del staff; ejecutar `get_advisors` y revisar hallazgos críticos derivados de esta migración.

**Out of scope (para futuros specs):**

- Las otras 11 tablas del esquema (`rooms`, `children`, `parent_children`, `invitations`, `posts`, `post_children`, `post_photos`, `reactions`, `comments`, `daily_summaries`, `devices`) y los ENUMs `relationship_type`, `invitation_status`, `post_type`, `child_status`.
- Policies adicionales (inserción/actualización/borrado por clientes, visibilidad entre usuarios del mismo daycare, acceso de padres/admins más allá del propio perfil y su daycare).
- Exponer `public.users` o `public.daycares` a la Data API para clientes (`NEXT_PUBLIC_*`), instalar `supabase-js`/`@supabase/ssr`, crear helpers de sesión o modificar `app/`, `middleware.ts`/`proxy.ts`, rutas de login o specs 01–06.
- Flujo de invitaciones, signup de padres, confirmación de email, recuperación de contraseña o gestión de contraseñas en la UI.
- Tests automatizados pgTAP (`supabase/tests/`), seeds adicionales, branches de Supabase, cambios de configuración de Auth/Storage o datos de producción distintos del staff de prueba acordado.

## Data model

```sql
-- supabase/migrations/<YYYYMMDDHHMMSS>_create_users_table.sql (estructura objetivo)

create schema if not exists private;

create type public.user_role as enum ('staff', 'parent', 'admin');
create type public.user_status as enum ('pending', 'active');

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  daycare_id uuid not null references public.daycares(id),
  role public.user_role not null,
  status public.user_status not null default 'active',
  full_name text not null,
  avatar_url text,
  notify_on_post boolean not null default true,
  daily_summary_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index users_daycare_id_idx on public.users (daycare_id);

alter table public.users enable row level security;
```

Convenciones y notas de modelo:

- `id` es el mismo UUID que `auth.users(id)`; no se genera con `gen_random_uuid()`. Email y contraseña no se duplican: viven en `auth.users`.
- `daycare_id` es `NOT NULL` (`1 daycare` tiene muchos `users`; todo perfil pertenece a una guardería). No se agrega `UNIQUE` en `daycare_id`: varios usuarios comparten el mismo daycare.
- `updated_at` se mantiene con `default now()` y se actualiza en cada `UPDATE` mediante trigger (p. ej. función que asigna `new.updated_at = now()` o `extensions.moddatetime` si está disponible); la implementación concreta se fija en la migración.
- Índices: `users_daycare_id_idx` soporta la FK/policy de pertenencia; la PK ya indexa `id` (usado por la policy de perfil propio).
- Nombres y valores persistidos en inglés (`user_role`, `user_status`, columnas).

## Implementation plan

1. **Precondiciones y CLI.** Confirmar que SPEC 07 está aplicado (`public.daycares` existe con el seed `Guardería Sala Soles`), `supabase --version` responde y `supabase migration new --help`/`supabase db push --help` confirman el flujo de la versión instalada. Verificación: la guardería seed existe en local/remoto y se conoce el comando correcto para crear/aplicar la migración.
2. **Migración base (schema).** Ejecutar `supabase migration new create_users_table` y escribir el DDL: `private` schema, ENUMs `user_role`/`user_status`, tabla `public.users` con columnas/defaults/constraints/FKs exactos, índice `users_daycare_id_idx` y `enable row level security` en `public.users`. Verificación: existe un único archivo `supabase/migrations/<timestamp>_create_users_table.sql` con el esquema anterior.
3. **Funciones y triggers.** Añadir en la migración: (a) función/trigger para refrescar `updated_at` en `public.users` antes de cada `UPDATE`; (b) función `SECURITY DEFINER` en schema `private` con `set search_path = ''` que inserte en `public.users` (`id`, `daycare_id`, `role`, `full_name`, `status`) leyendo `new.raw_app_meta_data->>'daycare_id'`, `->>'role'` y `->>'full_name'` (con cast a `uuid`/`user_role` según corresponda); (c) trigger `AFTER INSERT` en `auth.users` que ejecute esa función. Verificación: `supabase db reset` aplica la migración sin errores.
4. **RLS, grants y policies.** En la misma migración: `revoke all on table public.users from anon, authenticated`; `revoke all on table public.daycares from anon, authenticated` y `grant select on table public.daycares to authenticated` (mínimo para la policy); crear policy `select` en `public.users` `to authenticated` con `using (id = (select auth.uid()))`; crear policy `select` en `public.daycares` `to authenticated` con pertenencia vía `exists (select 1 from public.users u where u.daycare_id = daycares.id and u.id = (select auth.uid()))`. No crear policies de `insert/update/delete` para clientes ni grants sobre `public.users`. Verificación: localmente `relrowsecurity = true` en `users`, policies presentes y `anon`/`authenticated` sin privilegios de tabla sobre `users`.
5. **Usuario staff de prueba.** Crear en Supabase Auth un usuario real con email fijo `staff@salasoles.test` y `app_metadata`/`raw_app_meta_data` que incluya `daycare_id = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'`, `role = 'staff'` y `full_name = 'Staff Sala Soles'` (o el nombre acordado), de forma que el trigger inserte la fila en `public.users`. La contraseña se proporciona en el momento del alta (Dashboard, Admin API o flujo local equivalente) y no se registra en archivos versionados. Si el alta se realiza con SQL administrativo, la contraseña/hash no debe incluirse en la migración ni en commits. Verificación: existe el usuario en `auth.users` con ese email y existe exactamente su perfil en `public.users` con `role = 'staff'`, `status = 'active'` y el `daycare_id` del seed.
6. **Aplicación remota.** Con el proyecto linkeado (patrón de SPEC 07), ejecutar `supabase db push --remote --yes` (o el flag equivalente según `--help`) y repetir el alta/verificación del staff en el proyecto remoto si no se propagó por la migración. Verificación: la migración queda aplicada sin errores y el perfil staff existe en remoto.
7. **Verificación final y cierre.** Validar con `execute_sql` (local/remoto): enums y columnas de `information_schema`/`pg_type`/`pg_attribute`, FKs, `relrowsecurity`, policies en `pg_policies`, triggers en `information_schema.triggers`/`pg_trigger`, y fila staff; ejecutar `get_advisors` (security/performance). Revisar `git status`: solo `supabase/migrations/<timestamp>_create_users_table.sql` (y ningún archivo con credenciales). Verificación: criterios de aceptación cubiertos y sin hallazgos críticos nuevos derivados de esta tabla/policies/trigger.

## Acceptance criteria

- [ ] Existe `supabase/migrations/<timestamp>_create_users_table.sql`, creado con `supabase migration new create_users_table`.
- [ ] La migración crea los ENUMs `public.user_role` con valores `staff`, `parent`, `admin` y `public.user_status` con valores `pending`, `active`.
- [ ] `public.users` existe con columnas, tipos, nulabilidad y defaults exactos de la referencia: `id uuid PK FK → auth.users(id) ON DELETE CASCADE`, `daycare_id uuid NOT NULL FK → public.daycares(id)`, `role user_role NOT NULL`, `status user_status NOT NULL default 'active'`, `full_name text NOT NULL`, `avatar_url text NULL`, `notify_on_post boolean NOT NULL default true`, `daily_summary_enabled boolean NOT NULL default true`, `created_at timestamptz NOT NULL default now()`, `updated_at timestamptz NOT NULL default now()`.
- [ ] `updated_at` de `public.users` se actualiza automáticamente en cada `UPDATE` mediante un trigger definido en la migración.
- [ ] Existe un trigger `AFTER INSERT` en `auth.users` que crea la fila correspondiente en `public.users` leyendo `daycare_id`, `role` y `full_name` desde `raw_app_meta_data` (app metadata), y la función del trigger es `SECURITY DEFINER` en un schema no expuesto con `search_path = ''`.
- [ ] `alter table public.users enable row level security` está aplicado y existe una policy `SELECT` para `to authenticated` que permite leer solo la propia fila (`id = auth.uid()`).
- [ ] `public.daycares` tiene una policy `SELECT` para `to authenticated` que permite leer únicamente la guardería asociada al perfil del usuario autenticado (resuelta vía `public.users`), reemplazando el estado sin policies de SPEC 07.
- [ ] `anon` y `authenticated` no tienen privilegios de tabla sobre `public.users`; `public.users` no se expone a la Data API en este spec. Los grants sobre `public.daycares` quedan limitados al mínimo requerido por la policy de lectura autenticada.
- [ ] Existe un usuario staff de prueba real en `auth.users` con email `staff@salasoles.test` y su fila en `public.users` con `daycare_id = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'`, `role = 'staff'` y `status = 'active'`, creada por el trigger.
- [ ] La contraseña del staff de prueba no aparece en la migración, en el spec, en el diff ni en archivos commiteados.
- [ ] `supabase db reset` aplica la migración sin errores y `supabase db push --remote` la aplica al proyecto linkeado.
- [ ] La verificación con `execute_sql` confirma enums, estructura, RLS, policies, triggers y perfil staff en el entorno objetivo; `get_advisors` no reporta hallazgos críticos derivados de esta migración.
- [ ] No se agregaron dependencias npm, código en `app/`, variables `NEXT_PUBLIC_*` ni cambios en specs 01–07.

## Decisions

- **Sí:** Crear solo `user_role` y `user_status`. Son los ENUMs que consume `users`; `relationship_type`, `invitation_status`, `post_type` y `child_status` se crean en los specs de sus tablas.
- **Sí:** `daycare_id uuid not null`. Todo perfil pertenece a una guardería y el modelo establece que un daycare tiene muchos usuarios.
- **Sí:** Trigger `AFTER INSERT` en `auth.users` + usuario staff real en Supabase Auth. El perfil se provisiona automáticamente y queda un usuario de prueba utilizable.
- **Sí:** Leer `role`, `daycare_id` y `full_name` desde `raw_app_meta_data` (app metadata). Se prioriza la regla de seguridad del repo (no usar `raw_user_meta_data` para datos sensibles/de provisión controlada) frente a la nota de la referencia; la desviación queda registrada.
- **Sí:** Función de trigger `SECURITY DEFINER` en schema `private` con `set search_path = ''` y nombres calificados, para no exponerla en `public` y evitar riesgos de search_path.
- **Sí:** `updated_at` con `default now()` y trigger de actualización automática en cada `UPDATE`.
- **Sí:** RLS en `users` con policy `SELECT` de perfil propio (`to authenticated`, `id = auth.uid()`), y policy `SELECT` en `daycares` limitada a la guardería del usuario. Cierra el acceso abierto pendiente de SPEC 07 con el predicado de pertenencia.
- **Sí:** `revoke` de privilegios a `anon/authenticated` en `users` y no exponerla a Data API en este spec. Grants y policies se tratan como parte del mismo cambio.
- **Sí:** Staff de prueba con email fijo `staff@salasoles.test`; contraseña definida fuera del repo en el alta. Permite verificación reproducible sin filtrar secretos.
- **Sí:** Verificación con SQL/MCP y `get_advisors`, sin suite pgTAP nueva (consistente con el estado actual del repo).
- **Sí:** Pasos ejecutables con Supabase CLI/MCP siguiendo el patrón de SPEC 07 (`migration new`, `db reset`, `db push --remote`, `execute_sql`, `get_advisors`).
- **No:** Crear los otros 4 ENUMs o las otras tablas del esquema. Amplía el alcance sin necesidad para este objetivo.
- **No:** Leer metadatos desde `raw_user_meta_data`. Es editable por el usuario y contradice las reglas de seguridad adoptadas.
- **No:** Policies de `insert/update/delete` para clientes, visibilidad entre compañeros de daycare o rol admin/staff sobre otros perfiles. Requieren reglas de producto no definidas aquí.
- **No:** Exponer `users` por Data API ni instalar/configurar clientes Supabase en la app.
- **No:** Duplicar `email`/contraseña en `public.users`; la fuente de autenticación es `auth.users`.
- **No:** Commiter contraseña, service role key o valores de `.env`.
- **No:** Tests automatizados nuevos ni cambios fuera de `supabase/` (salvo el propio archivo de spec cuando se guarde).

## Risks

| Riesgo | Mitigación |
| --- | --- |
| Metadatos faltantes o inválidos en `raw_app_meta_data` al crear un usuario Auth | La función del trigger debe castear/validar `daycare_id` y `role`; si faltan, el `INSERT`/cast falla y bloquea la creación inconsistente. Documentar el contrato de metadata para el alta del staff. |
| La contraseña del staff no puede vivir en la migración versionada | Fijar email/UUID/metadata y crear el usuario como paso administrativo con contraseña local; verificar perfil generado por trigger sin registrar la contraseña. |
| `auto_expose_new_tables` o grants por defecto exponen tablas en `public` | Revocar explícitamente privilegios de `anon/authenticated` en `public.users` y limitar grants en `public.daycares`; validar con consulta a privilegios/policies y `get_advisors`. |
| La policy de `daycares` depende de `public.users` y puede romper si se altera el orden o falta el perfil | Mantener todo en una sola migración ordenada, asegurar FK/pertenencia y verificar con un caso autenticado (o simulación SQL) que el usuario staff resuelve su daycare. |
| Diferencias de flags/versión del CLI (`--remote`/`--linked`, disponibilidad de Docker para local) | Confirmar con `--help` antes de ejecutar; si falta Docker, documentar el salto local y sostener push remoto + verificación MCP. |
| Hallazgos de advisors por RLS/policies en tablas expuestas | Revisar `get_advisors` y corregir dentro del alcance (grants/policies/función en schema no expuesto); registrar cualquier hallazgo residual justificado. |

## What is **not** in this spec

- Resto de tablas, relaciones intermedias y ENUMs del esquema completo.
- Cliente Supabase en Next.js, auth de la app, rutas `/login`/`/activate-account` funcionales ni cambios en `app/`.
- Policies y permisos de producto avanzados (admin sobre guardería, padres sobre sus hijos, escritura desde cliente).
- Exposición de `users` a Data API, tests pgTAP, seeds masivos o gestión de credenciales en repositorio.

Cada uno de esos puntos, si se aborda, irá en su propio spec.
