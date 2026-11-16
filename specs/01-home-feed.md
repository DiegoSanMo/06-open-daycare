# SPEC 01 — Home con feed de la sala

> **Status:** Approved 
> **Depends on:** —
> **Date:** 2026-11-14
> **Objective:** Reemplazar el home por una réplica visual del feed de `references/pantallas/feed.dc.html`, con datos estáticos y sin autenticación ni base de datos.

## Scope

**In:**

- Convertir `/` (`app/page.tsx`) en el feed del prototipo: sidebar de 248 px, header de saludo, caja "Compartí un momento…", separador "PUBLICADO HOY" y 3 tarjetas de post.
- Reproducir tipografías (Fredoka/Nunito), paleta, tamaños, radios, sombras, bordes y estructura exactos de la referencia.
- Cargar Fredoka y Nunito con `next/font/google` y aplicar tokens de diseño en `app/globals.css`.
- Datos estáticos tipados en `app/_data/feed.ts`: persona de la maestra, sala, cantidad de niños, fecha literal y los 3 posts.
- Enlaces del sidebar y "Editar" como placeholders inertes (mismo aspecto, sin navegación).
- Ajustar `app/layout.tsx`: `lang="es"`, metadata "OpenDayCare · Sala Soles", fuentes nuevas.
- Verificación visual con Playwright a 1440×900 contra `references/screenshots/feed.png`.

**Out of scope (para futuros specs):**

- Autenticación, sesión, base de datos o persistencia.
- Likes/comentarios interactivos, estado de cliente, formularios.
- Rutas `/crear-publicacion`, `/ninos`, `/avisos`, `/mi-cuenta`, `/login` y cualquier otra pantalla.
- Diseño móvil o drawer; el prototipo es solo desktop.
- Imágenes reales: el bloque de foto queda como placeholder punteado.
- Borrar los SVG del starter en `public/` que queden sin uso.

## Data model

```ts
// app/_data/feed.ts
export type PostKind = "logro" | "actividad" | "anuncio";

export type FeedPost = {
  id: string;
  kind: PostKind;
  author: string;        // "Mateo" | "Anuncio general"
  time: string;          // "14:20"
  audience: string;      // "familia de Mateo" | "toda la sala"
  body: string;
  likes: number;
  comments: number;
  photoLabel?: string;   // "Foto · pintando con témperas"
};

export const teacher = {
  name: "Caro Giménez",
  role: "Maestra · Soles",
  initial: "C",
  room: "Sala Soles",
  childrenCount: 12,
  dateLabel: "martes 17 jun",
} as const;

export const posts: FeedPost[] = [/* 3 posts exactos del prototipo */];
```

Convenciones:

- Todos los textos visibles van en español y se copian literalmente del prototipo (incluidos `…`, tildes y signos).
- Los contadores (3/1, 5/2, 8/0) son datos, no texto embebido en JSX.
- No se agrega ningún campo que no exista en el prototipo.

## Design tokens

Valores tomados de `references/pantallas/feed.dc.html`; el resto de las sombras y degradados se copian tal cual del prototipo.

| Token | Valor |
| --- | --- |
| Fondo de la app | `#F6ECDF` |
| Superficie de tarjetas/sidebar | `#FFFDF9` |
| Bordes | `#ECE0D0` (tarjetas y sidebar), `#F0E6D8` (separador del post), `#E7DAC8` (regla de sección) |
| Texto principal | `#3F362E` |
| Texto secundario | `#94887B`, `#A89A8B` |
| Marca / activo | `#D9583C` |
| Sidebar | 248 px de ancho, `padding: 24px 16px`, borde derecho de 1 px |
| Contenido | `max-width: 760px`, `padding: 34px 40px 80px` |
| Radios | 12 px (ítems/nav), 14 px (CTA), 16 px (foto), 18 px (compose), 20 px (posts), 999 px (badges) |
| Tipografía | Fredoka 400–700 para títulos, marca y avatares; Nunito 400–800 (+ itálica 400) para el resto |
| Badges | LOGRO `#CFEBD8`/`#3E9B6C`; ACTIVIDAD `#C7E7F1`/`#2E89A6`; ANUNCIO `#CCD8F4`/`#4E72C8` |
| Avatares | Niña/niño `#A9D9E8`/`#1F7A93`; anuncio `#CCD8F4`/`#4E72C8`; maestra `#F2937A` |

## Implementation plan

1. **Tokens y tipografía base.** En `app/globals.css`, definir en `@theme` los colores del prototipo, fuentes y scrollbar. En `app/layout.tsx`, cambiar Geist por Fredoka/Nunito con variables, `lang="es"` y metadata. Verificación: `npm run dev` sigue renderizando `/`.
2. **Shell de la pantalla.** Reemplazar el contenido de `app/page.tsx` por el layout `flex min-h-screen` con sidebar fijo de 248 px y `main` de altura de viewport con scroll interno (`h-screen overflow-y-auto`) y contenedor `max-w-[760px]` con `padding: 34px 40px 80px`. Verificación: sidebar no se mueve al hacer scroll del feed.
3. **Sidebar.** Marca "OpenDayCare / Sala Soles" con logo degradado, CTA "Nueva publicación", navegación (Feed activo, Niños, Avisos, Mi cuenta) y footer con avatar, nombre y botón de salida. Iconos SVG inline. Verificación: colores y pesos coinciden con el prototipo.
4. **Header y caja de composición.** Eyebrow "GUARDERÍA · SALA SOLES", "Buenas, Caro", "12 niños · martes 17 jun" y caja con avatar, placeholder y botón de cámara.
5. **Separador y componente de post.** Crear `PostCard` con header (avatar, autor, hora, badge por tipo), "Para: …", cuerpo y footer (likes, comentarios, Editar). El badge cambia color por `kind`. Verificación: las 3 tarjetas se ven con los colores correctos.
6. **Variante con foto.** Si el post tiene `photoLabel`, renderizar el bloque punteado de 200 px con icono y etiqueta.
7. **Datos y placeholders.** Conectar `posts` y `teacher` desde `app/_data/feed.ts`; convertir todos los enlaces y "Editar" en elementos sin `href` con `aria-disabled="true"`. Verificación: ningún clic navega ni produce 404.
8. **Verificación visual.** Con Playwright MCP, capturar `/` a 1440×900 en `.playwright-mcp/` y comparar contra `references/screenshots/feed.png`; corregir diferencias de espaciado, sombras y colores. Cerrar con `npx eslint app`, `npx tsc --noEmit` y `npm run build`.

## Acceptance criteria

- [x] A 1440 px de ancho, el fondo es `#F6ECDF`, la sidebar mide 248 px con fondo `#FFFDF9` y borde derecho `#ECE0D0`. ✅ `bgBody rgb(246,236,223)`, `sidebarWidth 248px`, `sidebarBg rgb(255,253,249)`, `sidebarBorderRight rgb(236,224,208)` — Playwright computed styles at 1440×900 (`.playwrights-mcp/home-feed-1440.png`)
- [x] El contenido principal está centrado con ancho máximo 760 px y padding 34/40/80. ✅ `contentWidth 760px`, `contentPadding 34px 40px 80px` — Playwright computed styles
- [x] Títulos, marca y avatares usan Fredoka; el resto usa Nunito. No se ve Geist ni Arial. ✅ `h1 Fredoka`, `body Nunito`, 0 visible elements render Geist/Arial — Playwright computed styles
- [x] Aparecen exactamente 3 posts en orden: logro (3 likes, 1 comentario), actividad (5/2 con placeholder de foto) y anuncio (8/0). ✅ `postCount 3`, order LOGRO/3/1, ACTIVIDAD/5/2/photo, ANUNCIO/8/0 — Playwright DOM + computed styles
- [x] Los badges dicen LOGRO, ACTIVIDAD y ANUNCIO con sus colores verde/azul/azul y punto del mismo color. ✅ LOGRO `rgb(207,235,216)`/`rgb(62,155,108)` = `#CFEBD8`/`#3E9B6C`, dot `bg-current` — Playwright computed styles
- [x] "Feed" está activo en la sidebar (`#FBE3D8` / `#D9583C`); los demás ítems son `#6E6359`. ✅ `feedBg rgb(251,227,216)`, `feedColor rgb(217,88,60)`, `ninosColor rgb(110,99,89)` — Playwright computed styles
- [x] La caja "Compartí un momento…" y el CTA "Nueva publicación" tienen los degradados y sombras del prototipo. ✅ `bg-linear-[180deg,#F4977E,#EE8164]` + `shadow-[0_8px_18px_-8px_...]` on CTA; compose `bg-surface` + `shadow-[0_4px_14px_-10px_...]` — source `app/page.tsx`
- [x] El scroll ocurre dentro del `main`, manteniendo la sidebar fija. ✅ `main overflow-y auto`, sidebar `sticky top-0 h-screen` — Playwright computed styles + source `app/page.tsx`
- [x] Ningún enlace navega a una ruta inexistente. ✅ every `<a>` has `href: null` and `aria-disabled="true"` (14 anchors) — Playwright DOM
- [x] La página no usa estado ni `"use client"`; es un Server Component estático. ✅ `"use client"` not present; no hooks/state — source `app/page.tsx`, `PostCard.tsx`
- [x] `npx eslint app`, `npx tsc --noEmit` y `npm run build` terminan sin errores. ✅ eslint clean, tsc clean, `next build` succeeded (static prerender `/`)
- [x] No hay errores ni warnings nuevos en la consola del navegador. ✅ 0 errors, 0 warnings at 1440×900 (only Next.js HMR/devtools info logs) — Playwright console messages

## Decisions

- **Sí:** Tailwind con tokens en `@theme` y valores arbitrarios exactos para sombras/radios. Mantiene la convención del repo y evita CSS duplicado.
- **Sí:** `next/font/google` para Fredoka y Nunito. Sin request a Google en runtime ni layout shift; requiere red en el build.
- **Sí:** iconos SVG inline copiados del prototipo. Evita una dependencia nueva (`lucide-react`) y garantiza los mismos trazos.
- **Sí:** fixtures tipados y fecha literal "martes 17 jun". Fidelidad exacta y reemplazo simple cuando exista base de datos.
- **Sí:** placeholders inertes (`<a>` sin `href` + `aria-disabled`). No inventa rutas ni pide autenticación.
- **Sí:** quitar el modo oscuro automático de `globals.css` y el `font-family: Arial` del starter. El prototipo no define variante oscura.
- **Sí:** scrollbar global del prototipo (`#E4D6C4`, 10 px). Es visual y no afecta otras pantallas todavía.
- **No:** CSS Module o CSS global con clases copiadas. Se aleja de Tailwind para una sola pantalla.
- **No:** rutas stub, estado de likes o datos calculados. Pertenecen a specs posteriores.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| Las sombras y degradados con valores arbitrarios no quedan idénticos | Comparación por screenshot a 1440×900 antes de cerrar el spec |
| `next/font/google` falla sin red en build | Descargar las fuentes y pasar a `next/font/local` sin cambiar el resto |
| El scroll interno del `main` deja doble scroll | Raíz con altura de viewport y `overflow` controlado; verificar con contenido corto y largo |
| Los placeholders sin `href` pierden foco de teclado | Aceptado para esta fase; se resuelve cuando existan las rutas reales |

## What is **not** in this spec

- Login, sesión, roles ni permisos.
- Base de datos, API routes o persistencia.
- Interacciones (likes, comentarios, edición real, publicar).
- Pantallas Niños, Avisos, Mi cuenta, Crear publicación y detalle.
- Versión móvil o tablet.
- Imágenes reales o carga de archivos.

## Verification

> **Date:** 2026-11-15 · **Verified by:** spec-verifier (`opencode/nemotron-3.5-super-vl-free`)
> **Result:** 12/12 criteria passed

| # | Criterion (paraphrase) | Result | Evidence |
| --- | --- | --- | --- |
| 1 | Fondo #F6ECDF, sidebar 248px #FFFDF9 con borde #ECE0D0 | ✅ Pass | Computed styles at 1440×900; `.playwrights-mcp/home-feed-1440.png` |
| 2 | Contenido max-width 760px, padding 34/40/80 | ✅ Pass | `contentWidth 760px`, `contentPadding 34px 40px 80px` |
| 3 | Fredoka para títulos/marca/avatares; Nunito resto; sin Geist ni Arial | ✅ Pass | `h1 Fredoka`, `body Nunito`, 0 visible elements in Geist/Arial |
| 4 | 3 posts en orden: logro 3/1, actividad 5/2+foto, anuncio 8/0 | ✅ Pass | `postCount 3`, order and counters from DOM |
| 5 | Badges LOGRO/ACTIVIDAD/ANUNCIO con colores y punto | ✅ Pass | LOGRO `#CFEBD8`/`#3E9B6C`, dot `bg-current` |
| 6 | "Feed" activo `#FBE3D8`/`#D9583C`; resto `#6E6359` | ✅ Pass | Computed styles for active/inactive nav items |
| 7 | Caja compose y CTA con degradados/sombras del prototipo | ✅ Pass | Source `app/page.tsx` gradients + shadows |
| 8 | Scroll dentro del `main`, sidebar fija | ✅ Pass | `main overflow-y auto`, sidebar `sticky top-0 h-screen` |
| 9 | Ningún enlace navega a ruta inexistente | ✅ Pass | 14 anchors, all `href: null` + `aria-disabled="true"` |
| 10 | Sin estado ni `"use client"`; Server Component estático | ✅ Pass | Source `app/page.tsx`, `PostCard.tsx` |
| 11 | eslint / tsc / build sin errores | ✅ Pass | `npx eslint app` clean, `tsc --noEmit` clean, `next build` static OK |
| 12 | Sin errores ni warnings en consola | ✅ Pass | 0 errors / 0 warnings at 1440×900 |

