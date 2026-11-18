# SPEC 04 — Modal para agregar niño

> **Status:** Implemented  
> **Depends on:** SPEC 02  
> **Date:** 2026-11-18  
> **Objective:** Agregar un modal accesible que se abre desde el botón "Agregar niño" de `/kids`, con validación de campos obligatorios y máscaras de ayuda, sin persistencia de datos.

## Scope

**In:**

- Crear `app/_components/AddKidModal.tsx` como Client Component que replica `references/pantallas/agregar-nino.dc.html`: tarjeta `#FBF4EC`, borde `#ECE0D0`, radio 24 px, sombra `0 20px 50px -24px rgba(63,54,46,.35)`, cabecera con "Cancelar" / "Agregar niño" / "Guardar" y los cinco campos del prototipo.
- Convertir el `<a aria-disabled="true">` actual de `app/kids/page.tsx` en un `<button type="button">` que conserve estilos/texto y abra el modal. El listado de niños y las tarjetas existentes no cambian.
- Campos obligatorios: nombre completo (texto), fecha de nacimiento y sala. Campos opcionales: alergias (etiquetas) y notas médicas.
- Lista hardcodeada de salas: `Soles`, `Luna`, `Estrellas`, en una constante tipada dentro de `app/_data/kids.ts`. El selector arranca en la opción `Seleccione sala` con valor vacío (`""`), sin ninguna sala preseleccionada; guardar sin elegir sala muestra un error de validación.
- Máscaras y ayudas: placeholders literales del prototipo (`Ej. Martina López`, `dd/mm/aaaa`, `Ej. Maní, Lactosa`, `Indicaciones, medicación, contactos…`), `inputMode`, `pattern` y texto de ayuda visible por campo; la fecha se autoformatea `dd/mm/aaaa` y se valida como fecha real.
- Validación inline al enviar: marca los campos obligatorios vacíos o inválidos con borde de error y mensaje; "Guardar" solo cierra el modal cuando todo es válido; "Cancelar" lo cierra sin guardar.
- Accesibilidad: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, foco inicial en el primer campo, cierre con `Escape`, cierre al hacer clic en el overlay, focus trap y retorno de foco al botón que abrió el modal. Bloquear scroll de fondo mientras está abierto.
- Verificación visual con Playwright MCP a 1440×900 contra `references/pantallas/agregar-nino.dc.html` (no existe PNG de esta pantalla), dentro de la convención del repo de guardar artefactos en `.playwrights-mcp/`.

**Out of scope (para futuros specs):**

- Persistencia, agregar el niño al listado, edición o borrado.
- Backend, API routes, base de datos, autenticación o permisos.
- Búsqueda/filtrado real, ordenamiento o paginación en `/kids`.
- Cambios visuales en el feed, el shell (`AppShell`) ni las tarjetas de niños.
- Ruta propia `/agregar-nino`; el modal no cambia la URL.
- Diseño móvil/tablet, carga de archivos, fotos o avatares.
- Tests automatizados nuevos más allá de lint, typecheck y build.

## Data model

```ts
// app/_data/kids.ts (adiciones)
export const roomOptions = ["Soles", "Luna", "Estrellas"] as const;
export type RoomOption = (typeof roomOptions)[number];

export type AddKidFormValues = {
  name: string;
  birthDate: string; // "dd/mm/aaaa"
  room: RoomOption | ""; // "" = opción "Seleccione sala"
  allergies: string; // CSV separado por comas
  medicalNotes: string;
};
```

Convenciones:

- El modal usa estado local con `useState` para los valores del formulario, `errors` por campo y `open` controlado desde `app/kids/page.tsx`.
- Los textos visibles se copian literalmente del prototipo, incluidas tildes y la elipsis `…`.
- `formatBirthDate` inserta `/` automáticamente después de 2 y 4 dígitos; `isValidBirthDate` valida formato y existencia real de la fecha con `Date.UTC`.
- `roomOptions` y los tipos viven con los datos de niños para reutilización futura; el modal no agrega un niño a `kids`.
- El selector renderiza primero `<option value="">Seleccione sala</option>` y luego las tres salas; `room: ""` representa esa opción guía y es el estado inicial del formulario.

## Design tokens

Valores tomados de `references/pantallas/agregar-nino.dc.html`, alineados con los tokens existentes de `app/globals.css` y SPEC 02.

| Elemento | Valor |
| --- | --- |
| Overlay | `rgba(63,54,46,.45)`, centrado, `z-50` |
| Tarjeta modal | fondo `#FBF4EC`, borde `#ECE0D0`, radio 24 px, max-width 520 px |
| Sombra tarjeta | `0 20px 50px -24px rgba(63,54,46,.35)` |
| Cabecera | padding `20px 26px`, borde inferior `#ECE0D0` |
| Cancelar / Guardar | Nunito, 15 px; `#94887B` / `#D9583C`, weight 700 / 800 |
| Título "Agregar niño" | Fredoka 600, 18 px, `#3F362E` |
| Contenido | padding `24px 26px`; labels 12 px, weight 800, tracking `.7px`, `#94887B` |
| Inputs/textarea/select | fondo blanco, borde `#EADFD0` 1.5 px, radio 14 px, padding `13px 16px`, texto 15 px `#3F362E` |
| Placeholder | `#B6A99B` |
| Separación entre campos | 18 px; fila fecha/sala con gap 14 px |
| Estado de error | borde `#D9583C`, mensaje 12 px `#D9583C` |
| Foco visible | outline `#D9583C` 2 px con offset 2 px |

## Implementation plan

1. **Datos y utilidades.** Agregar `roomOptions`, `RoomOption`, `AddKidFormValues`, `formatBirthDate` e `isValidBirthDate` en `app/_data/kids.ts`. Verificación: `npx tsc --noEmit` sin errores y helpers probados con `01/02/2020` y `31/02/2020`.
2. **Esqueleto del modal.** Crear `app/_components/AddKidModal.tsx` con `"use client"`, props `open` / `onClose`, overlay, tarjeta, cabecera y `role="dialog"`. Verificación: `/kids` sigue renderizando igual con el modal cerrado.
3. **Formulario y máscaras.** Agregar los cinco campos con placeholders, ayudas, `inputMode="numeric"` y autoformato en fecha; el selector de sala incluye la opción inicial `Seleccione sala` con valor `""`. Verificación: escribir `01022020` muestra `01/02/2020` y el selector arranca en `Seleccione sala`.
4. **Validación y cierre.** Implementar `handleSubmit` con validación de requeridos (incluida sala vacía) y fecha real; errores inline; "Cancelar"/overlay/`Escape` cierran sin guardar; `Guardar` válido cierra. Verificación manual: enviar vacío muestra 3 errores (nombre, fecha y sala) y no cierra; completar válido, incluida una sala, cierra.
5. **Accesibilidad.** Foco inicial, focus trap, retorno de foco al botón, `aria-labelledby`/`aria-describedby`, `aria-invalid` y bloqueo de scroll. Verificación: tabular dentro del modal nunca saca el foco; `Escape` retorna foco al botón "Agregar niño".
6. **Integración en `/kids`.** Convertir el CTA en `<button>` con estado local delgando en `app/kids/page.tsx`; conservar estilos y texto. Verificación: clic abre modal, el listado no cambia.
7. **Verificación final.** Capturar modal abierto a 1440×900 en `.playwrights-mcp/` y comparar con `agregar-nino.dc.html`. Verificar en navegador que guardar sin sala no cierra y muestra el error, y que elegir `Soles`, `Luna` o `Estrellas` permite guardar. Correr `npx eslint app`, `npx tsc --noEmit` y `npm run build`.

## Acceptance criteria

- [x] El botón "Agregar niño" de `/kids` es un `<button>` que abre el modal al hacer clic y mantiene texto, degradado, sombra e icono del prototipo. — Evidencia: `tagName: BUTTON`, gradiente `rgb(244,151,126)→rgb(238,129,100)`, sombra `rgba(238,129,100,0.7)` e icono en `app/kids/page.tsx` y `app/_components/AddKidButton.tsx`
- [x] El modal no está en el DOM inicial de `/kids`; aparece solo tras el clic. — Evidencia: `browser_evaluate` `dialogCount: 0` al cargar `/kids`
- [x] El modal muestra cabecera "Cancelar" / "Agregar niño" / "Guardar" y los labels/placeholders literales de `agregar-nino.dc.html`. — Evidencia: `browser_evaluate` header `[Cancelar, Agregar niño, Guardar]`, 5 labels y placeholders del prototipo verificados en DOM
- [x] Nombre, fecha de nacimiento y sala son obligatorios; alergias y notas médicas son opcionales. — Evidencia: `browser_evaluate` envío vacío marca nombre, fecha y sala (3 errores); `allergies` y `medicalNotes` no se validan
- [x] La sala es un selector con opción inicial `Seleccione sala` (valor `""`) y exactamente `Soles`, `Luna`, `Estrellas`, sin sala preseleccionada. — Evidencia: `browser_evaluate` options `["", "Soles", "Luna", "Estrellas"]`, texto `Seleccione sala`, `value: ""` al abrir
- [x] Escribir `01022020` en fecha muestra `01/02/2020`; `31/02/2020` se marca inválido con mensaje inline. — Evidencia: `browser_evaluate` `01022020→01/02/2020`; `31/02/2020` inválido con mensaje "La fecha no es válida. Usá dd/mm/aaaa."
- [x] Enviar con campos obligatorios vacíos muestra errores inline, marca `aria-invalid="true"` y no cierra el modal. — Evidencia: `browser_evaluate` 3 errores (nombre, fecha y "Elegí una sala."), `aria-invalid="true"`, borde `rgb(217,88,60)`, modal permanece abierto
- [x] Enviar con campos obligatorios válidos, incluida una sala, cierra el modal sin agregar niño al listado ni navegar. — Evidencia: `browser_evaluate` Guardar con `Soles`/`Luna`/`Estrellas` → `dialogCount: 0`, 8 kidCards, `location.pathname /kids`
- [x] "Cancelar", clic en el overlay y `Escape` cierran el modal sin guardar. — Evidencia: `browser_evaluate` los tres cierran, `dialogCount: 0`, foco retorna a "Agregar niño", `body.style.overflow` restaurado
- [x] El modal tiene `role="dialog"`, `aria-modal="true"` y `aria-labelledby`; el foco entra al primer campo y vuelve al botón al cerrar. — Evidencia: `browser_evaluate` atributos presentes, `activeElementId: kid-name` al abrir, `activeText: Agregar niño` al cerrar
- [x] Tabular dentro del modal no mueve el foco a elementos detrás del overlay. — Evidencia: `browser_press_key` Tab×14 y `Shift+Tab` desde Cancelar, foco siempre dentro del `dialog`
- [x] El scroll del fondo se bloquea mientras el modal está abierto y se restaura al cerrarlo. — Evidencia: `browser_evaluate` `body.style.overflow` `hidden` al abrir → `""` al cerrar
- [x] Comparación visual a 1440×900 contra `agregar-nino.dc.html` sin diferencias relevantes en colores, radios, tipografías ni espaciados. — Evidencia: `.playwrights-mcp/spec04-modal-app.png` vs `spec04-modal-ref.png`; computed styles iguales (tarjeta #FBF4EC, borde #ECE0D0, radio 24 px, sombra, labels #94887B 12 px, inputs #EADFD0 14 px)
- [x] `npx eslint app`, `npx tsc --noEmit` y `npm run build` terminan sin errores. — Evidencia: re-ejecutados tras el cambio de sala: `eslint` EXIT 0, `tsc --noEmit` EXIT 0, `next build` EXIT 0, 16 páginas estáticas

## Decisions

- **Sí:** Validar y cerrar sin persistencia. Decisión del usuario; mantiene coherencia con los specs 01–03 y evita convertir el listado en cliente.
- **Sí:** Botón `<button>` en lugar de `<a aria-disabled>`. Es el control correcto para abrir un diálogo y preservar el diseño aprobado.
- **Sí:** Ayudas + autoformato de fecha con validación real. Decisión del usuario: el usuario ve el formato esperado y los errores son concretos.
- **Sí:** Salas `Soles`/`Luna`/`Estrellas` con opción inicial `Seleccione sala` (valor `""`), sin preselección. Decisión del usuario en revisión al spec: la sala debe elegirse explícitamente y Guardar valida que no esté vacía.
- **Sí:** `"use client"` limitado al modal y al punto de apertura. El feed, `/kids/[id]`, `AppShell` y `KidCard` siguen siendo Server Components.
- **No:** Librería externa de máscaras. El autoformato requerido es pequeño y no justifica una dependencia.
- **No:** Ruta `/agregar-nino`. El prototipo es un modal; la URL no debe cambiar.
- **No:** Modificar SPEC 02 ni su verificación. Este spec solo habilita la acción que antes era inerte.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| El focus trap o el cierre con `Escape` fallen en navegadores reales | Verificar con Playwright teclado real y `aria-*` en la acceptance criteria |
| El autoformato de fecha interfiera con borrado/selección de texto | Implementar formateo solo sobre dígitos y probar borrado parcial en la verificación manual |
| El cambio de `<a>` a `<button>` altere estilos por reset de Tailwind | Copiar las clases existentes literalmente y comparar computed styles en Playwright |
| No existe PNG de referencia para esta pantalla | Abrir `references/pantallas/agregar-nino.dc.html` en navegador y comparar a 1440×900 |
| Guardar con la opción guía `Seleccione sala` pase la validación por ser un `select` | Tipar `room` como `RoomOption \| ""`, validar `!values.room` en `handleSubmit` y verificar en navegador que el modal permanece abierto con error inline |

## What is **not** in this spec

- Guardar niños, modificar `kids`, navegar tras guardar.
- Edición, borrado, vinculación de padres ni resumen del día.
- Backend, autenticación o base de datos.
- Ruta `/agregar-nino` o cambios en el shell/feed.
- Responsive, fotos, archivos ni tests automatizados nuevos.

Cada uno de esos puntos, si se aborda, irá en su propio spec.

## Verification

> **Date:** 2026-11-18 · **Verified by:** spec-impl (implementación y verificación ejecutadas por el agente spec-impl)
> **Result:** 14/14 criteria passed (re-verificado tras la revisión del selector de sala)
>
> **Nota de revisión:** el selector ya no preselecciona `Soles`; arranca en `Seleccione sala` (valor `""`) y `Guardar` valida que se haya elegido una sala. Esta sección refleja ese comportamiento final.

| # | Criterion | Result | Evidence |
| --- | --- | --- | --- |
| 1 | Botón `<button>` abre el modal con estilos del prototipo | ✅ Pass | `tagName: BUTTON`, gradiente `#F4977E→#EE8164`, sombra, icono; `app/kids/page.tsx`, `AddKidButton.tsx` |
| 2 | Modal ausente del DOM inicial | ✅ Pass | `dialogCount: 0` al cargar `/kids` |
| 3 | Cabecera y placeholders literales del prototipo | ✅ Pass | `role="dialog"`, título "Agregar niño", placeholders verificados en DOM |
| 4 | 3 obligatorios + 2 opcionales | ✅ Pass | envío vacío marca nombre, fecha y sala (3 errores); opcionales sin validar |
| 5 | Selector con `Seleccione sala` + Soles/Luna/Estrellas | ✅ Pass | options `["", "Soles", "Luna", "Estrellas"]`, `value: ""` al abrir; placeholder re-seleccionable |
| 6 | Autoformato y validación real de fecha | ✅ Pass | `01022020→01/02/2020`; `31/02/2020` inválido con mensaje |
| 7 | Errores inline y `aria-invalid` al enviar vacío | ✅ Pass | 3 errores (incl. "Elegí una sala."), borde coral en `#kid-room`, modal permanece |
| 8 | Envío válido cierra sin agregar ni navegar | ✅ Pass | Luna, Estrellas y Soles cierran; 8 tarjetas, foco en "Agregar niño", pathname `/kids` |
| 9 | Cancelar/overlay/Escape cierran sin guardar | ✅ Pass | los tres probados; foco y scroll restaurados |
| 10 | `role="dialog"`, `aria-modal`, `aria-labelledby`, foco | ✅ Pass | atributos presentes; foco inicial y de retorno al botón |
| 11 | Focus trap con Tab/Shift+Tab | ✅ Pass | foco nunca sale del `dialog` |
| 12 | Scroll bloqueado y restaurado | ✅ Pass | `overflow: hidden` → `""` |
| 13 | Comparación visual 1440×900 | ✅ Pass | computed styles vs `agregar-nino.dc.html`; captura actualizada `.playwrights-mcp/spec04-modal-app.png` con el placeholder visible |
| 14 | lint/types/build sin errores | ✅ Pass | re-ejecutados tras el cambio: eslint/tsc/build EXIT 0, 16 páginas |
