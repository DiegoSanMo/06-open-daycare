# SPEC 12 — Modal "Agregar niño" conectado a Supabase

> **Status:** Approved  
> **Depends on:** SPEC 04, SPEC 10, SPEC 11  
> **Date:** 2026-11-20  
> **Objective:** Reemplazar el submit inerte del modal por un `INSERT` real en `public.children`, cargar las salas desde `public.rooms` y refrescar `/kids` sin recargar la página, manteniendo el diseño y la validación de SPEC 04.

## Why this spec exists

SPEC 04 dejó el modal con validación y cierre locales: `handleSubmit` solo llama a `handleClose()`. SPEC 11 conectó el listado a Supabase pero dejó explícitamente fuera de alcance el botón "Agregar niño". Hoy `authenticated` solo tiene `SELECT` sobre `children` y no hay policy de `INSERT`, así que el alta tampoco podría hacerse desde el cliente.

## Scope

**In:**

- Crear `supabase/migrations/<UTC timestamp>_allow_child_inserts.sql` con `supabase migration new allow_child_inserts`: otorgar `INSERT` sobre `public.children` a `authenticated` y crear una policy `FOR INSERT TO authenticated WITH CHECK` que exija que `room_id` pertenezca a la guardería del perfil (`private.current_daycare_id()`). Sin grants ni policies de `UPDATE`/`DELETE`, sin `service_role` ni funciones `SECURITY DEFINER` nuevas.
- Agregar un Server Action (`app/_actions/children.ts`, `"use server"`) que valide nombre, fecha y sala, traduzca las etiquetas de alergias en español a los tags persistidos en inglés (`Maní` → `peanut`, `Lactosa` → `lactose`), derive `enrolled_at` de la fecha actual, inserte en `public.children` con el cliente SSR de `utils/supabase/server.ts` y llame a `revalidatePath("/kids")`.
- Obtener las salas desde `public.rooms` (misma RLS de SPEC 10) y pasarlas al botón/modal como props desde el Server Component, en vez de usar `roomOptions` de `app/_data/kids.ts`. Los fixtures de `kids.ts` se mantienen intactos para `/kids/[id]`, `AddKidModal` tipado y `LinkParentModal`.
- Actualizar `app/_components/AddKidModal.tsx` para usar `useActionState` con el Server Action: input `name` en FormData, botón deshabilitado mientras `pending`, errores del servidor visibles con `role="alert"`, cierre y reset solo cuando el alta terminó bien.
- Actualizar `app/_components/AddKidButton.tsx` para recibir las salas y pasárselas al modal, sin agregar `"use client"` fuera de los componentes que ya lo son.
- Verificar en local (`supabase db reset`) y remoto (`supabase db push --remote --yes`): policy y grant, insert válido, rechazo de sala de otra guardería, alta desde UI apareciendo en `/kids`, consola sin errores, `npx eslint app proxy.ts utils`, `npx tsc --noEmit` y `npm run build`.

**Out of scope:**

- Editar, archivar o borrar niños; subir fotos; vincular padres; invitaciones.
- Agregar columnas o cambiar tipos de `children`/`rooms`; modificar el seed de SPEC 10.
- Exponer `users` a la Data API, usar `service_role`, `raw_user_meta_data` o funciones que bypaseen RLS.
- Cambiar `/kids/[id]`, `AppShell`, el feed `/`, los modales de publicación/vinculación ni los specs 01–11.
- Búsqueda, ordenamiento, paginación, optimistic UI avanzada ni tests automatizados nuevos.

## Data model

Este spec no agrega columnas. Escribe en `public.children` respetando RLS:

| Campo | Origen |
| --- | --- |
| `room_id` | sala elegida en el modal, validada contra las rooms del daycare del perfil |
| `full_name` | input `NOMBRE COMPLETO` |
| `birth_date` | input `FECHA DE NACIMIENTO` (`dd/mm/aaaa` → `YYYY-MM-DD`) |
| `enrolled_at` | fecha actual (`YYYY-MM-DD`) |
| `medical_notes` | textarea `NOTAS MÉDICAS` (opcional) |
| `allergy_tags` | CSV de alergias → `text[]` en inglés |
| `status`, `photo_consent`, `created_at`, `updated_at` | defaults de la tabla (`active`, `true`, `now()`) |

El predicate de la policy reutiliza `private.current_daycare_id()` (SPEC 10), que resuelve el daycare desde `public.users` con `auth.uid()` sin exponer esa tabla.

## Implementation plan

1. **Policy de inserción.** Crear y aplicar la migración con grant + policy `INSERT`; verificar en local y remoto que existe, que `authenticated` tiene `INSERT` y que no se agregaron otros privilegios.
2. **Capa de datos y Server Action.** Agregar `getRoomOptions()` y el action tipado con validación, mapeo de alergias, `enrolled_at`, insert y `revalidatePath("/kids")`. Verificación: `tsc` y eslint limpios.
3. **Salas reales en el modal.** Pasar las rooms desde `/kids` al botón y al `<select>`, reemplazando `roomOptions` de fixtures. Verificación: el select lista las tres salas de la BD y desaparece la dependencia de `roomOptions` en el modal.
4. **Submit conectado.** Montar `useActionState`, estados de error/pending y cierre tras éxito. Verificación: completar el formulario inserta la fila, el listado se refresca y los errores de validación no cierran el modal.
5. **Verificación final.** Chequeos estáticos, build, Playwright a 1440×900 y prueba negativa de RLS (sala de otro daycare rechazada). Cerrar el spec solo con aprobación del usuario.

## Acceptance criteria

- [ ] Existe `supabase/migrations/<timestamp>_allow_child_inserts.sql`, creada con `supabase migration new allow_child_inserts`.
- [ ] `authenticated` tiene privilegio `INSERT` en `public.children`; `anon` no, y no se agregaron `UPDATE`/`DELETE`.
- [ ] Existe una policy `FOR INSERT TO authenticated` con `WITH CHECK` que valida la sala contra el daycare del perfil.
- [ ] Un insert con una sala de otra guardería falla por RLS en local y remoto.
- [ ] El `<select>` de salas del modal muestra `rooms` de Supabase, no los fixtures `roomOptions`.
- [ ] Enviar el formulario crea una fila en `public.children` con los valores del modal y `status = 'active'`.
- [ ] `Maní`/`Lactosa` se persisten como `peanut`/`lactose`; tags desconocidos se normalizan a minúsculas.
- [ ] `birth_date` se guarda en formato ISO y `enrolled_at` usa la fecha actual.
- [ ] El modal muestra errores del servidor y no se cierra cuando el alta falla.
- [ ] El botón `Guardar` queda deshabilitado mientras el action está pendiente.
- [ ] Después de guardar, `/kids` muestra el niño nuevo sin recarga manual y el modal se cierra con el formulario limpio.
- [ ] `app/_data/kids.ts`, `/kids/[id]`, `AppShell`, el feed `/` y los specs 01–11 no se modifican.
- [ ] `npx eslint app proxy.ts utils`, `npx tsc --noEmit` y `npm run build` terminan sin errores.
- [ ] La consola del recorrido de alta no tiene errores.

## Decisions

- **Sí:** policy `INSERT` con `WITH CHECK` sobre `room_id` + `current_daycare_id()`. Es el mínimo privilegio que permite el alta sin bypasear RLS.
- **Sí:** Server Action con el cliente SSR. Usa la sesión del usuario y mantiene la escritura fuera del browser.
- **Sí:** `useActionState`. Es el patrón actual de Next 16 para formularios con estado de servidor y `pending`.
- **Sí:** `revalidatePath("/kids")`. El listado está streamado bajo `cacheComponents`; la invalidación asegura que el niño nuevo aparezca sin recargar.
- **Sí:** traducir alergias en la capa del action. La UI sigue en español y la BD sigue guardando tags en inglés.
- **Sí:** `enrolled_at = hoy`. El modal no pide esa fecha y la columna es `NOT NULL`.
- **No:** `service_role`, `SECURITY DEFINER` nuevo ni `raw_user_meta_data`. Evitan saltarse RLS o autorizar con datos editables por el usuario.
- **No:** optimistic UI. Con pocos niños, basta la revalidación del action.
- **No:** modificar `/kids/[id]`. Los niños nuevos seguirán sin perfil real hasta su propio spec.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| El insert falla por falta de grant aunque la policy exista | Otorgar explícitamente `INSERT` a `authenticated` y verificar con `information_schema.role_table_grants`. |
| La policy permite escribir en una sala de otro daycare | `WITH CHECK` valida `room_id` contra `private.current_daycare_id()`; prueba negativa antes de cerrar. |
| El modal cierra aunque falle el alta | Cerrar solo cuando el state del action indique éxito. |
| El listado no se actualiza tras el insert | `revalidatePath("/kids")` dentro del action y verificación con Playwright. |
| Tags en español/inglés mezclados en `allergy_tags` | Normalizar en el action y reutilizar el mapa inverso de `app/_data/children.ts`. |

## What is **not** in this spec

- Edición/borrado de niños, fotos, padres, invitaciones ni perfil real con UUID.
- Cambios de esquema más allá del grant y la policy.
- Otros specs, el feed, el shell ni los fixtures del perfil.

Cada uno de esos puntos, si se aborda, irá en su propio spec.
