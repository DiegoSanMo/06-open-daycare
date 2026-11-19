-- Root table for daycares (multi-tenant boundary).
-- The fixed seed UUID below is the idempotency key: `name` has no UNIQUE
-- constraint, so re-running this migration must not duplicate the seed row.
create table public.daycares (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

alter table public.daycares enable row level security;

insert into public.daycares (id, name)
values ('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Guardería Sala Soles')
on conflict (id) do nothing;
