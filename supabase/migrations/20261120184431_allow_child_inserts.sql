-- SPEC 12: allow staff to create children in their own daycare.

grant insert on table public.children to authenticated;

create policy children_insert_own_daycare on public.children
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.rooms r
      where r.id = children.room_id
        and r.daycare_id = (select private.current_daycare_id())
    )
  );
