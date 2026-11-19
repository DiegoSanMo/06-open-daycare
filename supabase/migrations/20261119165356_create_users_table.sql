-- SPEC 08: user profiles linked 1:1 to auth.users.
-- Email and password live only in auth.users; this table holds profile data.
-- The private schema hosts internal functions that must not be exposed via the API.

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

-- Keeps updated_at in sync on every profile update.
create function private.set_users_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger users_set_updated_at
before update on public.users
for each row
execute function private.set_users_updated_at();

-- Provisions a profile after Supabase Auth creates a user.
-- role, daycare_id and full_name are read from app_metadata (raw_app_meta_data),
-- which is not user-editable, unlike raw_user_meta_data. This deviates from the
-- schema reference note and follows the repo security rule.
create function private.handle_auth_user_created()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.users (id, daycare_id, role, full_name, status)
  values (
    new.id,
    (new.raw_app_meta_data ->> 'daycare_id')::uuid,
    (new.raw_app_meta_data ->> 'role')::public.user_role,
    new.raw_app_meta_data ->> 'full_name',
    'active'::public.user_status
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function private.handle_auth_user_created();
