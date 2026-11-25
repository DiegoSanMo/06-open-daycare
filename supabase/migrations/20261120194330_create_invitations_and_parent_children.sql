-- SPEC 13: invitations and parent_children tables.
-- Persists the parent invitations sent from /kids/[id] and links accepted parents
-- to their children. All persisted values are English; UI labels are translated
-- in the application layer.

create type public.relationship_type as enum ('father', 'mother', 'guardian');
create type public.invitation_status as enum ('pending', 'accepted', 'expired', 'cancelled');

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children (id),
  invited_by uuid not null references public.users (id),
  full_name text not null,
  email text not null,
  relationship public.relationship_type not null,
  code text not null unique,
  status public.invitation_status not null default 'pending',
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.parent_children (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.users (id),
  child_id uuid not null references public.children (id),
  relationship public.relationship_type not null,
  created_at timestamptz not null default now(),
  constraint parent_children_parent_id_child_id_key unique (parent_id, child_id)
);

-- The unique constraint on invitations.code already creates the backing index,
-- so no duplicate index is added for that column.
create index invitations_child_id_idx on public.invitations (child_id);
create index invitations_invited_by_idx on public.invitations (invited_by);
create index parent_children_parent_id_idx on public.parent_children (parent_id);
create index parent_children_child_id_idx on public.parent_children (child_id);

alter table public.invitations enable row level security;
alter table public.parent_children enable row level security;

-- Invitations: staff can only create and read invitations for children of their
-- own daycare, and only for the ones they created. anon gets no table access.
revoke all on table public.invitations from anon, authenticated;
grant select, insert on table public.invitations to authenticated;

create policy invitations_select_own_daycare on public.invitations
  for select
  to authenticated
  using (
    invited_by = (select auth.uid())
    and exists (
      select 1
      from public.children c
      join public.rooms r on r.id = c.room_id
      where c.id = invitations.child_id
        and r.daycare_id = (select private.current_daycare_id())
    )
  );

create policy invitations_insert_own_daycare on public.invitations
  for insert
  to authenticated
  with check (
    invited_by = (select auth.uid())
    and exists (
      select 1
      from public.children c
      join public.rooms r on r.id = c.room_id
      where c.id = invitations.child_id
        and r.daycare_id = (select private.current_daycare_id())
    )
  );

-- parent_children is written only by SECURITY DEFINER database code (the auth
-- trigger from SPEC 13); clients may only read their own links or links for
-- children of their daycare.
revoke all on table public.parent_children from anon, authenticated;
grant select on table public.parent_children to authenticated;

create policy parent_children_select_own_or_daycare on public.parent_children
  for select
  to authenticated
  using (
    parent_id = (select auth.uid())
    or exists (
      select 1
      from public.children c
      join public.rooms r on r.id = c.room_id
      where c.id = parent_children.child_id
        and r.daycare_id = (select private.current_daycare_id())
    )
  );

-- Resolves the caller's role without a self-referencing subquery in the users
-- policy (which would trigger "infinite recursion detected in policy"). Same
-- SECURITY DEFINER pattern and identity source as private.current_daycare_id().
create function private.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
  select role
  from public.users
  where id = (select auth.uid())
$$;

revoke all on function private.current_user_role() from PUBLIC, anon, service_role;
grant execute on function private.current_user_role() to authenticated;

-- Profiles become readable to authenticated users so the UI can resolve the
-- staff/parent names shown in the linked-parents block. A caller sees their own
-- profile or the parent profiles of their own daycare when the caller is staff
-- or admin. Both cases live in one policy to avoid multiple permissive policies.
-- anon keeps no privileges on public.users.
grant select on table public.users to authenticated;

drop policy if exists users_select_own_profile on public.users;

create policy users_select_profiles on public.users
  for select
  to authenticated
  using (
    id = (select auth.uid())
    or (
      role = 'parent'::public.user_role
      and daycare_id = (select private.current_daycare_id())
      and (select private.current_user_role()) in ('staff'::public.user_role, 'admin'::public.user_role)
    )
  );
