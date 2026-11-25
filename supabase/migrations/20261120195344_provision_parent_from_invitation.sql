-- SPEC 13: anonymous invitation lookup and parent provisioning on signup.
-- The lookup lives in private (PostgREST does not expose that schema), so a
-- thin SECURITY INVOKER wrapper in public is what the SSR client calls.

create function private.get_invitation_by_code(p_code text)
returns table(code text, full_name text, email text, child_name text, room_name text, expires_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select i.code, i.full_name, i.email, c.full_name, r.name, i.expires_at
  from public.invitations i
  join public.children c on c.id = i.child_id
  join public.rooms r on r.id = c.room_id
  where i.code = upper(btrim(p_code))
    and i.status = 'pending'::public.invitation_status
    and i.expires_at > now()
$$;

-- USAGE on the schema is required to call the function inside it; the schema
-- itself is not exposed through PostgREST, and function EXECUTE stays explicit.
grant usage on schema private to anon, authenticated;

revoke all on function private.get_invitation_by_code(text) from PUBLIC;
grant execute on function private.get_invitation_by_code(text) to anon, authenticated;

create function public.get_invitation_preview(p_code text)
returns table(code text, full_name text, email text, child_name text, room_name text, expires_at timestamptz)
language sql
stable
set search_path = ''
as $$
  select * from private.get_invitation_by_code(p_code)
$$;

revoke all on function public.get_invitation_preview(text) from PUBLIC;
grant execute on function public.get_invitation_preview(text) to anon, authenticated;

-- Replaces the SPEC 08 trigger: keeps the staff path from app_metadata and adds
-- the parent path, which validates the invitation code against the database and
-- matches it to the new user's email. raw_user_meta_data is only a lookup key,
-- never an authorization source.
create or replace function private.handle_auth_user_created()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role public.user_role;
  v_daycare_id uuid;
  v_invitation public.invitations%rowtype;
begin
  v_role := (new.raw_app_meta_data ->> 'role')::public.user_role;

  if v_role is not null then
    insert into public.users (id, daycare_id, role, full_name, status)
    values (
      new.id,
      (new.raw_app_meta_data ->> 'daycare_id')::uuid,
      v_role,
      new.raw_app_meta_data ->> 'full_name',
      'active'::public.user_status
    );
    return new;
  end if;

  select i.* into v_invitation
  from public.invitations i
  where i.code = upper(btrim(new.raw_user_meta_data ->> 'invitation_code'))
    and lower(i.email) = lower(btrim(coalesce(new.email, '')))
    and i.status = 'pending'::public.invitation_status
    and i.expires_at > now()
  for update;

  if not found then
    raise exception 'Invalid or expired invitation code';
  end if;

  select r.daycare_id into v_daycare_id
  from public.children c
  join public.rooms r on r.id = c.room_id
  where c.id = v_invitation.child_id;

  insert into public.users (id, daycare_id, role, full_name, status)
  values (
    new.id,
    v_daycare_id,
    'parent'::public.user_role,
    v_invitation.full_name,
    'active'::public.user_status
  );

  insert into public.parent_children (parent_id, child_id, relationship)
  values (new.id, v_invitation.child_id, v_invitation.relationship);

  update public.invitations
  set status = 'accepted'::public.invitation_status,
      accepted_at = now()
  where id = v_invitation.id;

  return new;
end;
$$;
