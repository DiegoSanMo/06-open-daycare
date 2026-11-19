-- SPEC 10: rooms and children for the kids screen.
-- Seed data is added in the following step.

create type public.child_status as enum ('active', 'archived');

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  daycare_id uuid not null references public.daycares (id),
  name text not null,
  created_at timestamptz not null default now()
);

create table public.children (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id),
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

-- Keeps updated_at in sync on every child update.
create function private.set_children_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger children_set_updated_at
before update on public.children
for each row
execute function private.set_children_updated_at();

-- Resolves the caller's daycare without exposing public.users to the Data API.
-- SECURITY DEFINER is required because SPEC 08 grants no SELECT on users to
-- authenticated roles; search_path is pinned and the identity comes from auth.uid().
create function private.current_daycare_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select daycare_id
  from public.users
  where id = (select auth.uid())
$$;

revoke all on function private.current_daycare_id() from PUBLIC, anon, service_role;
grant execute on function private.current_daycare_id() to authenticated;

-- Read-only Data API access for authenticated users of the owning daycare.
revoke all on table public.rooms from anon, authenticated;
revoke all on table public.children from anon, authenticated;
grant select on table public.rooms to authenticated;
grant select on table public.children to authenticated;

create policy rooms_select_own_daycare on public.rooms
  for select
  to authenticated
  using (rooms.daycare_id = (select private.current_daycare_id()));

create policy children_select_own_daycare on public.children
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.rooms r
      where r.id = children.room_id
        and r.daycare_id = (select private.current_daycare_id())
    )
  );
