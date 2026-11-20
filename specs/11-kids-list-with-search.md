# SPEC 11 — Listado de niños en `/kids` con datos reales, agrupación por sala y búsqueda

> **Status:** Implemented  
> **Depends on:** SPEC 02, SPEC 09, SPEC 10  
> **Date:** 2026-11-19  
> **Objective:** Reemplazar los fixtures del listado `/kids` por niños y salas leídos de Supabase, con búsqueda instantánea en cliente, agrupación por sala y estados de carga y sin resultados, sin modificar `/kids/[id]`.

## Why this spec exists

SPEC 02 dejó `/kids` como réplica visual con datos estáticos y un buscador inerte. SPEC 10 crea `rooms` y `children`; este spec conecta la pantalla a esas tablas y convierte el buscador en funcional sin romper la paridad visual aprobada.

## Scope

**In:**

- Crear `app/_data/children.ts` con el tipo `ChildListItem`, la función asíncrona `getKidsWithRooms()` y los mappers de UI. La query usa `await createClient()` de `utils/supabase/server.ts`, selecciona `children` con `status = 'active'` y hace join a `rooms` para traer `id`, `name`, `full_name`, `birth_date`, `enrolled_at`, `allergy_tags` y `medical_notes`, ordenando por sala y nombre.
- Consultar también todas las rooms del daycare para renderizar una sección por sala, incluso las que no tienen niños, con el separador `SOLES · N niños` (nombre en mayúsculas, count de niños activos).
- Derivar de los datos reales: `ageLabel` calculado desde `birth_date` (`"3 años"`, `"2 años"`, `"N meses"` para menores de un año), `initial` desde `full_name`, `room` desde `rooms.name`, y el badge de la tarjeta desde `allergy_tags` traducidos (`peanut` → `MANÍ`, `lactose` → `LACTOSA`; varios tags se unen con ` · `). El contador de padres del subtítulo se elimina porque `parent_children` no existe.
- Convertir el buscador de `/kids` en un Client Component `app/_components/KidsSearch.tsx` con input controlado `placeholder="Buscar niño…"`, filtrado en cliente insensible a mayúsculas y tildes por nombre y por etiquetas de alergia en español, sin requests ni debounce. El término se mantiene solo en estado local.
- Ocultar las secciones de sala sin coincidencias y mostrar el estado vacío `No se encontraron niños` cuando el filtro no devuelve resultados, conservando tipografía, colores y espaciados de SPEC 02.
- Actualizar `app/_components/KidCard.tsx` para consumir `ChildListItem` y mantener el avatar, nombre, subtítulo calculado, badge, chevron y hover del prototipo. `href` derivado del `full_name` con normalización (sin tildes, minúsculas, guiones), de modo que los ocho niños del seed resuelvan los slugs de SPEC 02.
- Convertir `app/(protected)/kids/page.tsx` en Server Component con la query dentro de un componente async hijo envuelto en `<Suspense>` (requerido por `cacheComponents: true`), con un fallback que conserva el layout y muestra skeletons. Ante error de Supabase, renderizar un `role="alert"` con mensaje en español.
- Mantener `app/_data/kids.ts` intacto: sus fixtures siguen alimentando `/kids/[id]`, `AddKidModal` y `LinkParentModal`. No agregar `"use client"` fuera de `KidsSearch.tsx`.
- Verificación con Playwright a 1440×900: listado inicial contra la captura de SPEC 02, búsqueda por nombre y por alergia, estado vacío y consola sin errores; más `npx eslint app proxy.ts utils`, `npx tsc --noEmit` y `npm run build`.

**Out of scope (para futuros specs):**

- Migrar `/kids/[id]` a consultas por UUID; el perfil sigue con slugs y fixtures. Niños nuevos creados en la DB darán 404 hasta ese spec.
- Crear `parent_children`, mostrar padres vinculados reales ni cambiar el bloque "PADRES VINCULADOS" del perfil.
- Conectar el botón "Agregar niño", los modales de alta/vinculación ni cualquier operación de escritura.
- Búsqueda en servidor con `ilike`, parámetro en la URL, histórico o debounce.
- Ordenamiento, paginación, filtros por sala, vista móvil/tablet ni tests automatizados nuevos.
- Cambios en el feed `/`, en `AppShell`, en SPEC 02 ni en la migración de SPEC 10.

## Data model

Este spec no introduce tablas ni columnas nuevas. Reutiliza `public.children` y `public.rooms` de SPEC 10 y los clientes de `utils/supabase/server.ts`.

```ts
// app/_data/children.ts (tipos de UI, no persistidos)
export type ChildListItem = {
  id: string;              // UUID de public.children
  slug: string;            // derivado de full_name, para /kids/[id]
  name: string;
  initial: string;
  ageLabel: string;        // "3 años" | "2 años" | "N meses"
  roomId: string;
  roomName: string;        // "Sala Soles"
  allergyTags: string[];   // valores DB en inglés
  allergyBadges: string[]; // etiquetas UI en español
  joinedLabel: string;     // "feb 2025"
};

export type RoomSection = {
  id: string;
  name: string;            // "Soles"
  children: ChildListItem[];
};

export async function getKidsWithRooms(): Promise<{
  rooms: RoomSection[];
  error: string | null;
}>;
```

Convenciones:

- Los valores persistidos (`child_status`, `allergy_tags`) se leen en inglés; la traducción a español ocurre en `app/_data/children.ts`.
- La query filtra `status = 'active'`; los niños `archived` no aparecen.
- La edad se calcula contra la fecha actual; el seed de SPEC 10 está ajustado para que los ocho niños del prototipo muestren 3 o 2 años.
- El slug se deriva con normalización NFD, eliminación de diacríticos, minúsculas y guiones; no se agrega una columna `slug` a la DB.

## Implementation plan

1. **Capa de datos.** Crear `app/_data/children.ts` con `ChildListItem`, `RoomSection`, `getKidsWithRooms()`, el mapeo de etiquetas y el cálculo de edad/slug. Verificación: `npx tsc --noEmit` limpio y un script manual devuelve las tres salas y ocho niños activos.
2. **Query en la página.** Reescribir `app/(protected)/kids/page.tsx` para llamar a `getKidsWithRooms()` en un componente async hijo de `<Suspense>`, con fallback de skeletons y `role="alert"` ante error. Verificación: con sesión, `/kids` renderiza el listado real; sin sesión sigue redirigiendo a `/login` por SPEC 09.
3. **Agrupación por sala.** Renderizar un separador por room con `NOMBRE · N niños`, incluidas las salas vacías, y una grilla de dos columnas por sección. Verificación: aparecen `SOLES · 8 niños`, `LUNA · 0 niños` y `ESTRELLAS · 0 niños`.
4. **Tarjetas reales.** Adaptar `KidCard.tsx` a `ChildListItem`, con avatar, subtítulo `X años · <sala>`, badge de alergias derivado de `allergy_tags` y `href` con el slug normalizado. Verificación: los ocho enlaces resuelven a los slugs de SPEC 02; `/kids/mateo-fernandez` sigue mostrando el perfil fixture.
5. **Buscador en cliente.** Crear `app/_components/KidsSearch.tsx` con el input controlado y el filtrado por nombre y alergias; montarlo en `/kids` pasando las secciones ya cargadas. Verificación: escribir `mateo` deja una tarjeta; escribir `maní` deja Mateo; escribir `zzz` muestra `No se encontraron niños`.
6. **Verificación final.** Capturas y recorridos de Playwright, revisión de consola y ejecución de `npx eslint app proxy.ts utils`, `npx tsc --noEmit` y `npm run build`.

## Acceptance criteria

- [x] Con sesión válida, `/kids` muestra tres secciones (`SOLES`, `LUNA`, `ESTRELLAS`) y `SOLES · 8 niños`, sin los ocho niños hardcodeados en el JSX de la página.
- [x] Los nombres, edades y salas de las tarjetas provienen de `children` y `rooms` de Supabase.
- [x] La edad calculada muestra `3 años` o `2 años` para los ocho niños del seed de SPEC 10.
- [x] El badge de Mateo es `MANÍ` y el de Tomás `LACTOSA`, derivados de `allergy_tags` y traducidos en la capa de UI.
- [x] Las salas sin niños se muestran con count `0` y sin tarjetas.
- [x] El subtítulo de cada tarjeta no incluye el texto "padres vinculados".
- [x] Escribir en el buscador filtra de inmediato por nombre, sin recargar la página ni emitir requests a Supabase.
- [x] La búsqueda ignora mayúsculas y tildes (`"sofia"` encuentra `Sofía Méndez`).
- [x] La búsqueda por `maní` o `lactosa` encuentra al niño correspondiente.
- [x] Cuando no hay coincidencias, se ocultan las secciones y aparece `No se encontraron niños`.
- [x] Las tarjetas enlazan a los slugs de SPEC 02 y `/kids/mateo-fernandez` sigue mostrando el perfil fixture sin cambios.
- [x] `app/_data/kids.ts`, `/kids/[id]`, `AppShell` y el feed `/` no se modifican.
- [x] La query async vive dentro de `<Suspense>` y `npm run build` pasa con `cacheComponents: true`.
- [x] Un error de Supabase se muestra en un `role="alert"` en español; la consola no tiene errores en el recorrido normal.
- [x] El listado a 1440×900 conserva fondos, sidebar, tipografía, badges y hover de SPEC 02.
- [x] `npx eslint app proxy.ts utils`, `npx tsc --noEmit` y `npm run build` terminan sin errores.

## Decisions

- **Sí:** dos specs, uno de BD y otro de UI. Separa la migración de la pantalla y respeta la ubicación exigida para specs de base de datos.
- **Sí:** filtrado en cliente. El dataset es chico, responde sin latencia y evita combinar `ilike`, parámetros de URL y `cacheComponents`.
- **Sí:** agrupar por todas las salas, incluso vacías. Da uso real a `rooms` y mantiene el separador del prototipo como patrón visual.
- **Sí:** derivar edad, inicial, sala y badges desde la DB. Elimina la mezcla de datos reales con fixtures en el listado.
- **Sí:** fechas del seed ajustadas en SPEC 10. Conserva las etiquetas de edad del prototipo sin guardar `ageLabel` en la DB.
- **Sí:** slug derivado del nombre para los links. Mantiene `/kids/[id]` intacto y hace navegables los ocho niños sembrados.
- **Sí:** estado vacío con mensaje en español. Es verificable y evita una pantalla en blanco sin explicación.
- **Sí:** `<Suspense>` y `role="alert"`. Requerido por `cacheComponents` y coherente con el patrón de `app/todos/page.tsx`.
- **No:** migrar el perfil a UUID ni crear `parent_children`. Queda para un spec propio y evita perder "PADRES VINCULADOS".
- **No:** conectar "Agregar niño" ni modales. No hay policies de escritura en SPEC 10.
- **No:** búsqueda en servidor ni término en la URL. Innecesario para este volumen de datos.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| La policy RLS devuelve cero filas si el perfil del usuario no resuelve el daycare | Verificar en SPEC 10 que `users.daycare_id` coincide con `rooms.daycare_id`; el spec muestra el estado vacío en lugar de fallar. |
| El slug derivado colisiona o no existe en `/kids/[id]` | Normalizar de forma determinista y documentar que niños nuevos darán 404 hasta migrar el perfil. |
| `cacheComponents` rechaza la query async fuera de un boundary | Colocar `getKidsWithRooms()` en un componente async hijo de `<Suspense>` y validar con `npm run build`. |
| La edad calculada difiera de la captura de SPEC 02 | El seed de SPEC 10 usa fechas ajustadas; comparar visualmente con Playwright. |
| El buscador filtre solo nombre y no alergias | Incluir `allergyBadges` en el predicado y cubrirlo con criterios de aceptación explícitos. |

## What is **not** in this spec

- Perfil de niño con datos reales, UUID en rutas ni `parent_children`.
- Alta, edición o borrado de niños; modales ni botones de acción.
- Búsqueda en servidor, URL compartible, paginación u ordenamiento.
- Cambios en el feed, el shell, SPEC 02 ni la migración de SPEC 10.

Cada uno de esos puntos, si se aborda, irá en su propio spec.

## Verification

- **Fecha:** 2026-11-20. Rama `spec-11-kids-list-with-search`.
- **Estáticos:** `npx eslint app proxy.ts utils`, `npx tsc --noEmit` y `npm run build` (Next 16.4.6, `cacheComponents: true`) sin errores; `/kids` queda como Partial Prerender.
- **Datos reales:** con sesión local, `/kids` muestra `SOLES → 8 niños`, `LUNA → 0 niños`, `ESTRELLAS → 0 niños`, edades `3 años`/`2 años`, `MANÍ` en Mateo y `LACTOSA` en Tomás. Los ocho links usan los slugs de SPEC 02 y `/kids/mateo-fernandez` sigue mostrando el perfil fixture.
- **Búsqueda (Playwright 1440×900, servidor de producción):** `mateo` → 1 tarjeta, `maní` → Mateo, `sofia` → Sofía Méndez, `zzz` → `No se encontraron niños`; al limpiar vuelven las 8. Cero requests a Supabase al tipear, sin recarga ni cambio de URL; consola con 0 errores y 0 warnings.
- **Error de Supabase:** forzando un 500 en `/rest/v1/children` desde el servidor, `/kids` renderiza `role="alert"` con `No se pudieron cargar los niños. Intentá nuevamente.` y 0 tarjetas.
- **Alcance:** `git diff 8b1d3f6..HEAD --name-only` solo incluye `app/(protected)/kids/page.tsx`, `app/_components/KidCard.tsx`, `app/_components/KidsSearch.tsx`, `app/_data/children.ts` y el cierre de SPEC 10. No se modificaron `app/_data/kids.ts`, `/kids/[id]`, `AppShell` ni el feed.
- **Nota de entorno:** en `next dev` con Turbopack, acceder desde `127.0.0.1` hizo que Next bloqueara `/_next/hmr` y el input no hidraba; los recorridos se verificaron con `next start`. No afecta al código de la feature.
