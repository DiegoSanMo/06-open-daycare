# SPEC 10 — Tablas `rooms` y `children`, ENUM `child_status`, RLS y datos seed

> **Status:** Approved  
> **Depends on:** SPEC 07, SPEC 08  
> **Date:** 2026-11-19  
> **Objective:** Crear en Supabase las tablas `public.rooms` y `public.children` con su ENUM, RLS, policies de lectura por daycare y datos seed de salas y niños, aplicados en local y remoto.

## Why this spec exists

SPEC 02 implementó `/kids` con ocho niños hardcodeados y SPEC 08 dejó listos `daycares` y `users`, pero hoy no existe dónde persistir salas ni niños. Este spec crea esa capa de datos; SPEC 11 conectará la pantalla.

## Scope

**In:**

- Crear `supabase/migrations/<UTC timestamp>_create_rooms_and_children_tables.sql` con `supabase migration new create_rooms_and_children_tables`, conteniendo el ENUM `public.child_status` (`active`, `archived`), las tablas `public.rooms` y `public.children`, índices, `alter table ... enable row level security` en ambas, trigger de `updated_at` en `children`, policies `SELECT`, grants mínimos y el seed.
- Definir `public.rooms` según la referencia: `id uuid primary key default gen_random_uuid()`, `daycare_id uuid not null references public.daycares(id)`, `name text not null`, `created_at timestamptz not null default now()`.
- Definir `public.children` según la referencia: `id uuid primary key default gen_random_uuid()`, `room_id uuid not null references public.rooms(id)`, `full_name text not null`, `birth_date date not null`, `enrolled_at date not null`, `medical_notes text`, `allergy_tags text[] not null default '{}'`, `photo_consent boolean not null default true`, `status public.child_status not null default 'active'`, `created_at timestamptz not null default now()`, `updated_at timestamptz not null default now()`.
- Crear índices `rooms_daycare_id_idx`, `children_room_id_idx` y `children_status_idx` para soportar FKs, policies y el filtro por niño activo.
- Actualizar `children.updated_at` automáticamente en cada `UPDATE` mediante un trigger en `private`, siguiendo el patrón de SPEC 08.
- Habilitar RLS en ambas tablas, revocar privilegios de `anon` y `authenticated`, otorgar solo `SELECT` a `authenticated`, y crear policies `SELECT` que resuelvan la pertenencia al daycare del perfil autenticado: `rooms` vía `rooms.daycare_id`, `children` vía `children.room_id → rooms.daycare_id`.
- Seed: tres rooms (`Soles`, `Luna`, `Estrellas`) para el daycare `a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d`, y los ocho niños del prototipo de SPEC 02 en `Soles`, con `allergy_tags` en inglés (`peanut`, `lactose`), `medical_notes` derivadas de las notas del fixture y `status = 'active'`.
- Ajustar las fechas de nacimiento del seed un año respecto del fixture (`12 mar 2022` → `2023-03-12`, etc.) para que la edad calculada en la UI siga siendo 3 o 2 años en 2026-11-19.
- Verificar en local (`supabase db reset`) y remoto (`supabase db push --remote --yes`): enums, columnas, defaults, FKs, índices, RLS, policies, trigger y filas del seed; ejecutar advisors y revisar hallazgos derivados de esta migración.

**Out of scope (para futuros specs):**

- Las tablas `parent_children`, `invitations`, `posts`, `post_children`, `post_photos`, `reactions`, `comments`, `daily_summaries` y `devices`, y los ENUMs `relationship_type`, `invitation_status` y `post_type`.
- Policies de `INSERT`/`UPDATE`/`DELETE` para clientes, autorización por rol dentro del daycare y visibilidad de padres sobre sus propios hijos (depende de `parent_children`).
- Exponer las tablas por Data API a `anon`, instalar dependencias npm, crear clientes Supabase ni modificar `app/`, `proxy.ts` o los helpers de `utils/supabase/`.
- Conectar el buscador o las tarjetas de `/kids`, ni el modal "Agregar niño" ni migrar `/kids/[id]` (SPEC 11 y specs futuros).
- Tests pgTAP, branches de Supabase, cambios de Auth/Storage, seeds masivos ni credenciales en el repositorio.

## Data model

```sql
-- supabase/migrations/<YYYYMMDDHHMMSS>_create_rooms_and_children_tables.sql

create type public.child_status as enum ('active', 'archived');

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  daycare_id uuid not null references public.daycares(id),
  name text not null,
  created_at timestamptz not null default now()
);

create table public.children (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id),
  full_name text not null,
  birth_date date not null,
  enrolled_at date not null,
  medical_notes text,
  allergy_tags text[] not null default '{}',
  photo_consent boolean not null default true,
  status public.child_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index rooms_daycare_id_idx on public.rooms (daycare_id);
create index children_room_id_idx on public.children (room_id);
create index children_status_idx on public.children (status);

alter table public.rooms enable row level security;
alter table public.children enable row level security;
```

Convenciones y notas de modelo:

- Todo lo persistido va en inglés: `child_status`, `allergy_tags` (`peanut`, `lactose`), nombres de columnas y constraints. Las etiquetas en español se producen en la UI (SPEC 11).
- `children.room_id` es `NOT NULL`: todo niño pertenece a una sala. `status = 'archived'` modela el borrado lógico.
- `allergy_tags` usa un array de Postgres con default `{}` y `NOT NULL`; la referencia no fijaba la nulabilidad, se refuerza para evitar `NULL` en la UI.
- Seed de `children` (nacimiento ajustado, ingreso en 2025):

| `full_name` | `birth_date` | `enrolled_at` | `allergy_tags` | `medical_notes` |
| --- | --- | --- | --- | --- |
| Mateo Fernández | 2023-03-12 | 2025-02-03 | `{peanut}` | Alergia al maní. Evitar frutos secos. Lleva inhalador en la mochila. |
| Sofía Méndez | 2024-08-04 | 2025-03-10 | `{}` | NULL |
| Benjamín Ruiz | 2023-01-21 | 2025-02-03 | `{}` | NULL |
| Valentina Soto | 2024-11-15 | 2025-04-07 | `{}` | NULL |
| Tomás Díaz | 2023-05-09 | 2025-02-03 | `{lactose}` | Intolerancia a la lactosa. Evitar lácteos y derivados. |
| Emma Castro | 2024-09-30 | 2025-03-10 | `{}` | NULL |
| Lucas Romero | 2023-02-02 | 2025-02-03 | `{}` | NULL |
| Olivia Vega | 2024-07-18 | 2025-03-10 | `{}` | NULL |

## Implementation plan

1. **Precondiciones y CLI.** Confirmar que SPEC 07 y 08 están aplicadas (`public.daycares`, `public.users`, perfil staff), que el daycare seed existe y revisar `supabase migration new --help` y `supabase db push --help`. Verificación: daycare `a1b2c3d4-...` presente en local y remoto.
2. **Migración base.** Ejecutar `supabase migration new create_rooms_and_children_tables` y escribir el DDL de enums, tablas, índices y `enable row level security`. Verificación: `supabase db reset` aplica la migración sin errores.
3. **Trigger de `updated_at`.** Añadir la función en `private` y el trigger `BEFORE UPDATE` en `public.children`. Verificación: prueba de humo con `UPDATE` confirma que `updated_at` cambia.
4. **RLS, grants y policies.** Revocar `anon`/`authenticated` en ambas tablas, otorgar solo `SELECT` a `authenticated`, crear `rooms_select_own_daycare` y `children_select_own_daycare` con `exists(...)` sobre `public.users` y `(select auth.uid())`. Verificación: `pg_policies`, `relrowsecurity` y `has_table_privilege` confirman el estado; `authenticated` ve solo filas del daycare propio.
5. **Seed.** Insertar las tres salas y los ocho niños del data model en una sola migración, con ids generados por la DB y sin valores sensibles. Verificación: consulta SQL devuelve 3 rooms y 8 children activos, con los tags y notas esperados.
6. **Aplicación remota y cierre.** `supabase db push --remote --yes`, verificación equivalente en remoto con `execute_sql`/CLI y advisors; revisar `git status` para confirmar que solo se agregó el archivo de migración. Verificación: criterios de aceptación cubiertos y sin hallazgos críticos nuevos.

## Acceptance criteria

- [ ] Existe `supabase/migrations/<timestamp>_create_rooms_and_children_tables.sql`, creado con `supabase migration new`.
- [ ] `public.child_status` existe con valores exactos `active` y `archived`.
- [ ] `public.rooms` existe con columnas, tipos, nulabilidad, defaults y FK a `public.daycares` exactos del data model.
- [ ] `public.children` existe con columnas, tipos, nulabilidad, defaults y FK a `public.rooms` exactos del data model, incluido `allergy_tags text[] not null default '{}'`.
- [ ] Existen los índices `rooms_daycare_id_idx`, `children_room_id_idx` y `children_status_idx`.
- [ ] El `updated_at` de `public.children` se actualiza automáticamente en cada `UPDATE` mediante un trigger definido en la migración.
- [ ] RLS está habilitada en `rooms` y `children`; `anon` no tiene privilegios y `authenticated` tiene solo `SELECT`.
- [ ] La policy `SELECT` de `rooms` permite leer únicamente salas del daycare del perfil autenticado.
- [ ] La policy `SELECT` de `children` permite leer únicamente niños cuyo room pertenece al daycare del perfil autenticado.
- [ ] El seed tiene tres rooms para el daycare `a1b2c3d4-...` y ocho children activos en `Soles`, con las fechas, tags y notas del data model.
- [ ] `supabase db reset` y `supabase db push --remote` aplican la migración sin errores y el seed existe en local y remoto.
- [ ] La verificación con SQL/CLI y advisors no reporta hallazgos críticos derivados de esta migración.
- [ ] No se crean policies de escritura, no se exponen tablas a `anon` y no hay cambios en `app/`, dependencias npm ni credenciales versionadas.

## Decisions

- **Sí:** dos specs separados. Cumple la convención de AGENTS.md de ubicar los specs de base de datos en `specs/database/` y mantiene este documento enfocado en persistencia.
- **Sí:** migración con RLS, grants y seed juntos. Sin datos, SPEC 11 no podría verificar la pantalla; sin policies, la tabla quedaría expuesta.
- **Sí:** `child_status` con `archived` y default `active`. Borrado lógico del esquema de referencia.
- **Sí:** `allergy_tags text[] not null default '{}'`. Simplicidad del reference; se refuerza la nulabilidad para que la UI siempre reciba un array.
- **Sí:** policy de lectura por pertenencia a daycare vía `rooms` y `public.users`. No existe `parent_children`, así que no hay forma de restringir padres a sus hijos todavía.
- **Sí:** tres salas (`Soles`, `Luna`, `Estrellas`) y ocho niños en `Soles`. Coincide con `roomOptions` de SPEC 02 y con el prototipo.
- **Sí:** fechas de nacimiento ajustadas un año. Conserva las etiquetas "3 años"/"2 años" del prototipo al calcular la edad en 2026.
- **Sí:** función del trigger en `private`, siguiendo SPEC 08. Evita exponerla en `public`.
- **No:** `parent_children` ni políticas por rol de padre. Requieren decisiones de producto y ampliarían el alcance a una tercera tabla.
- **No:** policies de escritura ni exposición a la Data API para clientes. El alta de niños sigue siendo un placeholder y se resolverá en otro spec.
- **No:** tests pgTAP, seeds masivos ni credenciales en el repo. Coherente con el estado actual del proyecto.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| La policy de `children` depende de `users` y `rooms` y puede devolver cero filas si el perfil no existe | Verificar que el staff de SPEC 08 tiene perfil con `daycare_id` válido antes de probar la policy. |
| Grants por defecto exponen tablas nuevas | Revocar explícitamente `anon`/`authenticated` y confirmar con `has_table_privilege`. |
| El seed con fechas ajustadas diverge de `app/_data/kids.ts` | Documentar la desviación aquí y en SPEC 11; los fixtures siguen sirviendo solo a `/kids/[id]`. |
| `auto_expose_new_tables` o advisors reportan índices/RLS | Revisar `get_advisors` y justificar cualquier hallazgo INFO/WARN residual. |
| Diferencias de flags entre versiones de Supabase CLI | Confirmar con `--help` antes de `db reset`/`db push`, como en SPEC 08. |

## What is **not** in this spec

- Tablas intermedias y ENUMs distintos de `child_status`.
- Escritura desde clientes, roles de padre o visibilidad por familia.
- Conexión con `/kids`, búsqueda, tarjetas, modales ni perfil de niño.
- Tests automatizados nuevos, branches o credenciales en el repositorio.

Cada uno de esos puntos, si se aborda, irá en su propio spec.
