-- Additional daycare seed rows.
-- Fixed UUIDs are the idempotency key: `name` has no UNIQUE constraint,
-- so re-running this migration must not duplicate rows.
insert into public.daycares (id, name)
values
  ('751c0918-7186-44a7-9063-569e51a24cda', 'Guardería Sala Luna'),
  ('6c4ddcc1-e77b-41b4-be4d-4ad4ae4018d0', 'Guardería Sala Estrellas'),
  ('0c708c57-aa62-466b-9327-0a0791cbff83', 'Guardería Sala Arcoíris'),
  ('59276686-3905-42f6-a4fd-63b3c8c9618d', 'Guardería Sala Mariposas'),
  ('f4b1540d-1920-4c68-b9a3-ec9b464f40cd', 'Guardería Sala Delfines')
on conflict (id) do nothing;
