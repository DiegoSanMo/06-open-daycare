# SPEC 06 — Modal para nueva publicación

> **Status:** Approved  
> **Depends on:** SPEC 01  
> **Date:** 2026-11-18  
> **Objective:** Agregar un modal accesible que se abre desde el CTA "Nueva publicación" del sidebar y la caja de composición del feed, con selección de destinatarios, tipo, descripción y fotos locales, y publicación sin persistencia.

## Scope

**In:**

- Crear `app/_components/NewPostModal.tsx` como Client Component que replica `references/pantallas/crear-publicacion.dc.html`: tarjeta `#FBF4EC`, borde `#ECE0D0`, radio 24 px, max-width 580 px, sombra `0 20px 50px -24px rgba(63,54,46,.35)`, cabecera con "Cancelar" / "Nueva publicación" / "Publicar" y las secciones "PARA", "TIPO", "DESCRIPCIÓN" y "FOTOS".
- Convertir el CTA "Nueva publicación" de `app/_components/AppShell.tsx` y la caja "Compartí un momento…" de `app/page.tsx` en `<button type="button">` mediante `app/_components/NewPostButton.tsx` (Client Component con `useState` y variantes `sidebar` / `compose`), conservando clases, textos e iconos. La URL no cambia.
- "PARA": exactamente Mateo, Sofía y Benjamín con sus avatares/color del prototipo, más el chip "Toda la sala". Multi-selección de niños; "Toda la sala" es excluyente: al marcarlo se desmarcan los niños y viceversa. Requiere al menos un destinatario.
- "TIPO": los siete chips del prototipo (Comida, Siesta, Actividad, Logro, Ánimo, Foto, Anuncio) con sus colores literales. Sin preselección, selección única y validación al publicar. Estado seleccionado con anillo `#3F362E` de 2 px y offset 2 px, ya que el prototipo no lo define.
- "DESCRIPCIÓN": textarea vacía con placeholder literal `Contá cómo le fue hoy…`, obligatoria, validada al publicar.
- "FOTOS": botón "Agregar" con `<input type="file" accept="image/*" multiple>` oculto; cada archivo se muestra como miniatura de 96×96 con botón de quitar, usando `URL.createObjectURL`. Sin upload ni persistencia; se revocan las URLs al quitar una foto o al cerrar el modal. El modal abre sin fotos, solo con el tile punteado "Agregar".
- Validación inline al enviar: destinatarios, tipo y descripción; errores con borde `#D9583C` y mensaje de 12 px, `aria-invalid`. "Publicar" solo cierra cuando todo es válido, sin agregar posts ni navegar. "Cancelar", overlay y `Escape` cierran sin guardar.
- Accesibilidad: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, foco inicial en el primer checkbox (Mateo), cierre con `Escape`, focus trap, retorno de foco al botón que abrió el modal y bloqueo de scroll de fondo. Los chips usan inputs nativos ocultos (checkboxes en "PARA", radios en "TIPO") con etiquetas visuales tipo pill.
- La tarjeta usa `max-h-[calc(100vh-80px)] overflow-y-auto`: si el contenido excede el viewport, hace scroll entera, incluida la cabecera.
- Verificación visual con Playwright MCP a 1440×900 contra `references/pantallas/crear-publicacion.dc.html` (no hay PNG de esta pantalla), guardando artefactos en `.playwright-mcp/` sin commitearlos.

**Out of scope (para futuros specs):**

- Persistencia, agregar el post a `posts`, modificar `PostCard` ni cambiar el contador de publicaciones.
- Botón "Editar" de las tarjetas; sigue inerte como en SPEC 01.
- Los ocho niños de `app/_data/kids.ts`; los chips usan solo los tres del prototipo.
- Backend, API routes, base de datos, autenticación o permisos.
- Ruta propia `/crear-publicacion`; el modal no cambia la URL.
- Subida real de archivos, compresión, drag & drop ni almacenamiento de imágenes.
- Cambios en `AppShell` más allá del CTA, ni en el feed salvo la caja de composición.
- Diseño móvil/tablet.
- Tests automatizados nuevos más allá de lint, typecheck y build.

## Data model

```ts
// app/_data/feed.ts (adiciones)
export const postAudienceOptions = [
  { id: "mateo", label: "Mateo", initial: "M", avatarBg: "#A9D9E8", avatarFg: "#1F7A93" },
  { id: "sofia", label: "Sofía", initial: "S", avatarBg: "#F4B8CC", avatarFg: "#C44A7A" },
  { id: "benjamin", label: "Benjamín", initial: "B", avatarBg: "#B9DEC4", avatarFg: "#3E8B62" },
] as const;
export type PostAudienceId = (typeof postAudienceOptions)[number]["id"];

export const postTypeOptions = [
  { id: "comida", label: "Comida", bg: "#9A7B1E", fg: "#FFFFFF" },
  { id: "siesta", label: "Siesta", bg: "#E7DCF6", fg: "#7B5FC0" },
  { id: "actividad", label: "Actividad", bg: "#2E89A6", fg: "#FFFFFF" },
  { id: "logro", label: "Logro", bg: "#CFEBD8", fg: "#3E9B6C" },
  { id: "animo", label: "Ánimo", bg: "#F9D2DE", fg: "#C56486" },
  { id: "foto", label: "Foto", bg: "#FBD8CC", fg: "#D9684A" },
  { id: "anuncio", label: "Anuncio", bg: "#CCD8F4", fg: "#4E72C8" },
] as const;
export type PostTypeId = (typeof postTypeOptions)[number]["id"];

export type NewPostPhoto = { id: string; url: string; name: string };

export type NewPostFormValues = {
  audienceIds: PostAudienceId[];
  allRoom: boolean;
  type: PostTypeId | ""; // "" = sin elegir
  description: string;
  photos: NewPostPhoto[];
};

export const newPostPlaceholder = "Contá cómo le fue hoy…";
```

Convenciones:

- El estado del formulario vive en `NewPostModal.tsx`; `open` vive en `NewPostButton.tsx`, igual que en los specs 04 y 05.
- Los textos visibles se copian literalmente del prototipo, incluidas tildes y la elipsis `…`.
- `photos` contiene ObjectURLs temporales que no salen del componente; no se agregan campos a `FeedPost`.
- Los colores de avatar coinciden con `app/_data/kids.ts` para Mateo, Sofía y Benjamín.

## Design tokens

Valores tomados de `references/pantallas/crear-publicacion.dc.html`, alineados con los tokens de SPEC 01.

| Elemento | Valor |
| --- | --- |
| Overlay | `rgba(63,54,46,.45)`, `flex items-start justify-center`, padding `40px 24px`, `z-50` |
| Tarjeta | fondo `#FBF4EC`, borde `#ECE0D0`, radio 24 px, max-width 580 px, sombra `0 20px 50px -24px rgba(63,54,46,.35)`, `max-h-[calc(100vh-80px)] overflow-y-auto` |
| Cabecera | padding `20px 26px`, borde inferior `#ECE0D0`; Cancelar Nunito 15 px/700 `#94887B`, título Fredoka 600/18 px `#3F362E`, Publicar Nunito 15 px/800 `#D9583C` |
| Contenido | padding `24px 26px`; labels 12 px, weight 800, tracking `.7px`, `#94887B`, margin-bottom 10 px |
| Chips "PARA" | gap 9 px, margin-bottom 22 px; activo borde/fondo `#3F362E` y texto blanco; inactivo borde `#ECE0D0`, fondo `#FFFDF9`, texto `#6E6359`; padding `6px 14px 6px 6px` (niño) / `6px 16px` (Toda la sala); radio 999 px, 14 px weight 700 |
| Avatar chip | 26×26 px, Fredoka 600 13 px con los colores de `postAudienceOptions` |
| Chips "TIPO" | gap 9 px, margin-bottom 22 px; padding `8px 16px`, radio 999 px, sin borde, 13.5 px weight 800; colores de `postTypeOptions`; seleccionado con ring `#3F362E` 2 px offset 2 px |
| Textarea | fondo blanco, borde `#EADFD0` 1.5 px, radio 14 px, padding `14px 16px`, 15 px `#3F362E`, line-height 1.5, min-height 120 px, margin-bottom 22 px; placeholder `#B6A99B` |
| Tile de foto | 96×96 px, radio 14 px, fondo `#F4ECE1`, borde `1px #ECE0D0`, ícono `#CBB89F` |
| Tile "Agregar" | 96×96 px, radio 14 px, borde dashed `#DBCDBA` 1.5 px, fondo `#F4ECE1`, signo `+` `#C5503A`, texto "Agregar" 12 px `#B0A290`, gap 12 px entre tiles |
| Error | borde `#D9583C`, mensaje 12 px `#D9583C` |
| Foco visible | outline `#D9583C` 2 px con offset 2 px |

## Implementation plan

1. **Datos y tipos.** Agregar `postAudienceOptions`, `PostAudienceId`, `postTypeOptions`, `PostTypeId`, `NewPostPhoto`, `NewPostFormValues` y `newPostPlaceholder` en `app/_data/feed.ts`. Verificación: `npx tsc --noEmit` sin errores.
2. **Esqueleto del modal.** Crear `app/_components/NewPostModal.tsx` con `"use client"`, props `open`/`onClose`, overlay, tarjeta, cabecera, los cuatro labels y `role="dialog"`. Verificación: `/` y `/kids` siguen renderizando igual con el modal cerrado.
3. **Selección de destinatarios y tipo.** Agregar los checkedboxes de Mateo/Sofía/Benjamín con avatares, el chip "Toda la sala" con lógica excluyente y los siete radios de tipo con sus colores y ring de selección. Verificación: marcar dos niños y luego "Toda la sala" deja solo esta última activa; solo un tipo queda activo.
4. **Descripción y validación.** Agregar el textarea con placeholder literal; implementar `handleSubmit` con `noValidate`, errores inline y `aria-invalid` para destinatarios, tipo y descripción. "Publicar" válido cierra; "Cancelar", overlay y `Escape` cierran sin guardar. Verificación: enviar vacío muestra 3 errores y no cierra; completar válido cierra sin tocar los 3 posts.
5. **Fotos.** Agregar el input oculto, las miniaturas con botón de quitar y la revocación de ObjectURL al quitar y al cerrar. Verificación: seleccionar dos imágenes muestra dos tiles de 96×96; quitar una deja una; cerrar no deja URLs vivas.
6. **Accesibilidad.** Foco inicial en Mateo, focus trap, retorno de foco, `aria-labelledby`/`aria-describedby`, `aria-invalid` y bloqueo de scroll. Verificación: `Tab`/`Shift+Tab` nunca salen del diálogo; `Escape` devuelve el foco al botón correcto.
7. **Integración.** Crear `NewPostButton.tsx` con las variantes `sidebar` y `compose`, reemplazar los dos `<a aria-disabled>` en `AppShell.tsx` y `app/page.tsx`, conservando clases e iconos. Verificación: ambos botones abren el modal en `/`, el de sidebar también en `/kids`, y ninguno navega.
8. **Verificación final.** Capturar el modal abierto a 1440×900 y comparar con `crear-publicacion.dc.html`; verificar scroll interno, cierres y validación en navegador. Correr `npx eslint app`, `npx tsc --noEmit` y `npm run build`.

## Acceptance criteria

- [ ] El CTA "Nueva publicación" del sidebar y la caja "Compartí un momento…" del feed son `<button type="button">` que abren el modal y conservan texto, degradado, sombra e icono del prototipo.
- [ ] El modal no está en el DOM inicial de `/` ni de `/kids`; aparece solo tras el clic.
- [ ] La cabecera muestra "Cancelar" / "Nueva publicación" / "Publicar" con tipografía y colores del prototipo; Cancelar y Publicar son botones que no navegan.
- [ ] Los labels "PARA", "TIPO", "DESCRIPCIÓN" y "FOTOS" y el placeholder `Contá cómo le fue hoy…` coinciden literalmente con el prototipo.
- [ ] "PARA" ofrece exactamente Mateo, Sofía y Benjamín con sus avatares, más "Toda la sala", y permite marcar varios niños.
- [ ] "Toda la sala" es excluyente: al marcarlo se desmarcan los niños, y al marcar un niño se desmarca "Toda la sala".
- [ ] "TIPO" ofrece los siete chips con los colores del prototipo, arranca sin selección y solo uno puede estar activo.
- [ ] La descripción arranca vacía con el placeholder literal y es obligatoria.
- [ ] Publicar sin destinatarios, sin tipo o sin descripción muestra errores inline, marca `aria-invalid` y no cierra el modal.
- [ ] Publicar con todo válido cierra sin agregar posts, sin navegar y sin cambiar los 3 posts del feed.
- [ ] "FOTOS" arranca solo con el tile "Agregar"; seleccionar imágenes crea miniaturas de 96×96 con botón de quitar y no se sube nada.
- [ ] "Cancelar", el clic en el overlay y `Escape` cierran sin guardar y devuelven el foco al botón que abrió el modal.
- [ ] El modal tiene `role="dialog"`, `aria-modal="true"` y `aria-labelledby`; el foco entra en el primer checkbox y `Tab`/`Shift+Tab` no salen del diálogo.
- [ ] El scroll del fondo se bloquea al abrir y se restaura al cerrar; si el contenido excede el viewport, la tarjeta hace scroll con `max-h-[calc(100vh-80px)]` y la cabecera se desplaza con ella.
- [ ] La comparación visual a 1440×900 contra `crear-publicacion.dc.html` no muestra diferencias relevantes en colores, radios, tipografías ni espaciados.
- [ ] `npx eslint app`, `npx tsc --noEmit` y `npm run build` terminan sin errores.

## Decisions

- **Sí:** Dos puntos de apertura con un único wrapper `NewPostButton.tsx` y variantes `sidebar`/`compose`. El prototipo enlaza ambos a `crear-publicacion.dc.html`.
- **Sí:** Validar y cerrar sin persistir, como en los specs 04 y 05. El feed sigue siendo un Server Component estático.
- **Sí:** "PARA" multi-selección de los tres niños del prototipo con "Toda la sala" excluyente. Fidelidad visual y decisión del usuario.
- **Sí:** "TIPO" de selección única sin preselección, con un anillo visible añadido como estado activo. El prototipo no muestra estado seleccionado, pero la validación lo exige.
- **Sí:** Descripción vacía y obligatoria, con el placeholder literal del prototipo.
- **Sí:** Fotos reales con preview local mediante ObjectURL, sin upload. Decisión del usuario; se revocan al quitarlas o al cerrar.
- **Sí:** Scroll en toda la tarjeta con `max-h-[calc(100vh-80px)]`, sin cabecera fija.
- **Sí:** Patrón de accesibilidad de los specs 04/05, con inputs nativos ocultos para los chips, como en SPEC 05.
- **No:** Ruta `/crear-publicacion`. El prototipo se implementa como modal; la URL no debe cambiar.
- **No:** Agregar posts, modificar `posts`/`PostCard` ni activar "Editar". Ese flujo merece su propio spec.
- **No:** Usar los ocho niños de `app/_data/kids.ts`. El prototipo define solo tres y la prioridad es la fidelidad visual.
- **No:** Tokens nuevos en `globals.css`; los colores puntuales van como valores arbitrarios de Tailwind.
- **No:** Backend, autenticación, responsive ni tests automatizados nuevos.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| El prototipo no define estados seleccionados para los chips | Anillo `#3F362E` documentado como decisión y verificado en la comparación visual |
| Los ObjectURL pueden filtrarse si se cierra el modal con fotos cargadas | Revocar en `handleRemovePhoto` y en el cleanup de cierre |
| Los chips con inputs nativos ocultos pueden perder el foco visible | Aplicar `focus-visible` con outline `#D9583C` en la etiqueta asociada |
| Dos instancias del modal en `/` (sidebar y compose) | Cada botón controla su propio `open`; verificar que solo una abra y que el foco retorne al botón correcto |
| No existe PNG de referencia para esta pantalla | Abrir el HTML del prototipo en navegador y comparar a 1440×900, como en los specs 04 y 05 |

## What is **not** in this spec

- Guardar publicaciones, modificar el feed ni activar "Editar".
- Backend, autenticación o base de datos.
- Ruta `/crear-publicacion` o cambios en el shell/feed fuera de los dos puntos de apertura.
- Los ocho niños reales, subida de archivos, fotos persistidas ni responsive.
- Tests automatizados nuevos.

Cada uno de esos puntos, si se aborda, irá en su propio spec.
