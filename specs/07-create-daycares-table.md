# SPEC 07 — Tabla `daycares` y primera migración de Supabase

> **Status:** Implemented  
> **Depends on:** Ninguno  
> **Date:** 2026-11-18  
> **Objective:** Crear la tabla raíz `daycares` en Supabase mediante una migración versionada con Supabase CLI, con RLS habilitado y un registro inicial, sin conectar todavía la app.

## Scope

**In:**

- Instalar el CLI de Supabase en el entorno (`brew install supabase/tap/supabase` en macOS) y verificar `supabase --version`; hoy no está instalado.
- Ejecutar `supabase init` en la raíz del repo para generar `supabase/config.toml`, sin modificar la configuración por defecto.
- Crear `supabase/migrations/<UTC timestamp>_create_daycares.sql` con `supabase migration new create_daycares`, conteniendo: la tabla `public.daycares`, `alter table ... enable row level security` y el seed idempotente de `Guardería Sala Soles`.
- Verificar la migración en el stack local con `supabase start` + `supabase db reset` (requiere Docker), consultando columnas, estado de RLS y fila seed.
- Linkear el proyecto remoto con `supabase login` + `supabase link --project-ref <ref>`, tomando la DB password de `.env` tras verificar el nombre real de la variable (hoy parece `SUPERBASE_DB_PASSWORD`).
- Aplicar la migración con `supabase db push --remote --yes`, confirmando antes con `supabase db push --help` si la versión instalada usa `--remote` o el legacy `--linked`.
- Verificar el proyecto remoto con las herramientas MCP de Supabase: `execute_sql` para columnas/defaults, `relrowsecurity` y fila seed, y `get_advisors` para descartar hallazgos críticos.
- Dejar `supabase/config.toml` y la migración listos para commit, sin `.env` ni credenciales en el repo.

**Out of scope (para futuros specs):**

- Las otras 12 tablas del esquema (`users`, `rooms`, `children`, etc.) y los ENUMs.
- El trigger `AFTER INSERT` en `auth.users` y la tabla `users`; la policy `SELECT` con predicado de pertenencia se agrega en ese spec, cuando exista `users.daycare_id`.
- Instalar `supabase-js` o `@supabase/ssr`, crear el cliente, usar variables `NEXT_PUBLIC_*` ni tocar `app/`.
- Cambios en los specs 01–06, en el feed, en el login ni en los prototipos.
- Seeds de salas, niños, padres ni publicaciones.
- Branches de Supabase, cambios de configuración de Auth/Storage ni datos de producción distintos del seed acordado.
- Tests automatizados nuevos.

## Data model

```sql
-- supabase/migrations/<YYYYMMDDHHMMSS>_create_daycares.sql
create table public.daycares (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

alter table public.daycares enable row level security;

insert into public.daycares (id, name)
values ('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Guardería Sala Soles')
on conflict (id) do nothing;
```

Convenciones:

- Esquema `public`; PK `uuid` con `gen_random_uuid()` y `created_at timestamptz` con `now()`, según `../07-DB-Schema/opendaycare-database-schema.md`.
- Sin `updated_at`: la referencia no lo incluye para esta tabla y aparece recién en `users`.
- El UUID del seed es fijo y se documenta en la migración; es la clave de idempotencia, ya que `name` no tiene `UNIQUE`.
- Todo lo persistido va en inglés; el nombre visible de la guardería es dato, no etiqueta de UI.

## Implementation plan

1. **CLI.** Instalar el CLI de Supabase y ejecutar `supabase --version` y `supabase db push --help`. Verificación: ambos comandos responden y se confirma el flag de target de la versión instalada.
2. **Workspace.** Ejecutar `supabase init` en la raíz y revisar el `supabase/config.toml` generado. Verificación: el archivo existe y no se modificó ningún valor por defecto.
3. **Migración.** Ejecutar `supabase migration new create_daycares` y escribir el DDL anterior en el archivo resultante. Verificación: existe un único archivo `supabase/migrations/<timestamp>_create_daycares.sql` con tabla, RLS y seed.
4. **Local.** Ejecutar `supabase start` y `supabase db reset`. Verificación: la migración se aplica sin errores; una query local devuelve 3 columnas con sus tipos, `relrowsecurity = true` y exactamente 1 fila `Guardería Sala Soles`.
5. **Link.** Ejecutar `supabase login` y `supabase link --project-ref <ref>`. Verificación: la salida confirma el project ref; la password se lee de `.env` y nunca se escribe en la migración ni en un comando commiteado.
6. **Push.** Ejecutar `supabase db push --remote --yes` (o `--linked` si el `--help` del paso 1 lo exige). Verificación: la salida indica 1 migración aplicada al proyecto remoto, sin errores.
7. **Remoto.** Verificar con MCP `execute_sql`: columnas de `information_schema.columns`, `relrowsecurity` en `pg_class` y contenido de `public.daycares`; ejecutar `get_advisors`. Verificación: 3 columnas, RLS activo, 1 sola fila seed y sin hallazgos críticos nuevos.
8. **Cierre.** Revisar `git status`: solo `supabase/config.toml` y la migración como archivos nuevos. Verificación: `.env` sigue ignorado y no aparece ninguna credencial en el diff.

## Acceptance criteria

- [ ] Existe `supabase/migrations/<timestamp>_create_daycares.sql`, creado con `supabase migration new create_daycares`.
- [ ] La migración define `public.daycares` con exactamente `id uuid primary key default gen_random_uuid()`, `name text not null` y `created_at timestamptz not null default now()`.
- [ ] La migración ejecuta `alter table public.daycares enable row level security;` y no crea ninguna policy.
- [ ] La migración inserta una única fila con id fijo `a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d` y `name = 'Guardería Sala Soles'`, con `on conflict (id) do nothing`.
- [ ] `supabase db reset` aplica la migración sin errores y la query local confirma 3 columnas, RLS activo y 1 fila seed.
- [ ] `supabase db push --remote` aplica exactamente 1 migración al proyecto linkeado.
- [ ] `execute_sql` sobre el proyecto remoto confirma las 3 columnas, `relrowsecurity = true` y una sola fila con el nombre de la guardería.
- [ ] `get_advisors` no reporta hallazgos críticos derivados de esta tabla.
- [ ] No se agregaron dependencias npm, código en `app/` ni variables `NEXT_PUBLIC_*`.
- [ ] No se commiteó `.env` ni aparece la DB password en la migración, el spec ni el diff.

## Decisions

- **Sí:** Supabase CLI con migración versionada. Establece el patrón para las 12 tablas restantes y permite probar local antes de tocar el remoto.
- **Sí:** `supabase db push --remote --yes` según la documentación actual del CLI, con fallback a `--linked` si la versión instalada es anterior; se decide con `supabase db push --help`.
- **Sí:** Columnas literales de la referencia: `id`, `name`, `created_at`. `name` es `NOT NULL` porque una guardería sin nombre no es un registro válido.
- **Sí:** RLS habilitado sin policies. Sin `users`, no existe hoy un predicado seguro de pertenencia; mientras tanto solo `service_role` puede acceder.
- **Sí:** Seed dentro de la misma migración con UUID fijo e `on conflict (id) do nothing`. `db push` no aplica `seed.sql` en remoto, y así re-ejecutar no duplica la fila.
- **Sí:** Verificación local, remota y con MCP antes de dar por terminado el spec.
- **No:** Agregar `updated_at`, `slug`, `logo_url` ni `UNIQUE (name)`. No están en la referencia y ampliarían el alcance.
- **No:** Policy `to authenticated using (true)`. Expondría todas las guarderías y rompería el aislamiento multi-tenant; se evalúa en el spec de `users`.
- **No:** Instalar `supabase-js`/`@supabase/ssr` ni modificar `app/`. El cliente merece su propio spec.
- **No:** Trigger de `auth.users`, tabla `users` ni ENUMs en esta migración.
- **No:** Usar `supabase/seed.sql` ni commitear credenciales.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| CLI no instalado o Docker no disponible para el stack local | Instalar el CLI; si Docker falta, omitir `supabase start`/`db reset` y documentar el salto, manteniendo push remoto y verificación MCP. |
| La variable de DB password en `.env` parece tener typo (`SUPERBASE_DB_PASSWORD`) | Leer el nombre real antes de linkear; no hardcodear ni commitear el valor. |
| `on conflict (id) do nothing` evita duplicados solo por id | `name` no tiene `UNIQUE` por decisión; el UUID fijo es la única clave de idempotencia y va documentado. |
| Cambios de flags entre versiones del CLI (`--remote` vs `--linked`, `--yes`) | Ejecutar `supabase db push --help` en el paso 1 y ajustar el comando del paso 6. |
| Migración ya aplicada en el proyecto remoto | `db push` respeta el historial; si hace falta rollback, es `drop table public.daycares` manual y no se ejecuta en este spec. |

## What is **not** in this spec

- Otras tablas, ENUMs, trigger de `auth.users` ni policies de lectura.
- Cliente Supabase, dependencias npm, variables de entorno públicas ni cambios en `app/`.
- Seeds adicionales, branches remotos ni cambios de Auth/Storage.
- Responsive, diseño ni tests automatizados nuevos.

Cada uno de esos puntos, si se aborda, irá en su propio spec.
