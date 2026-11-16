# SPEC 02 — Pantallas de niños (lista y perfil)

> **Status:** Approved  
> **Depends on:** SPEC 01  
> **Date:** 2026-11-15  
> **Objective:** Implementar las pantallas de listado de niños en `/kids` y perfil de niño en `/kids/[id]` replicando visualmente los prototipos, con datos estáticos y sin backend.

## Scope

**In:**

- Crear la ruta `/kids` (`app/kids/page.tsx`) como réplica visual de `references/pantallas/ninos.dc.html`: header "GESTIÓN / Niños", CTA "Agregar niño", buscador visual, separador "SALA SOLES · 8 niños" y grilla de 8 tarjetas de niño.
- Crear la ruta dinámica `/kids/[id]` (`app/kids/[id]/page.tsx`) como réplica visual de `references/pantallas/perfil-nino.dc.html`: enlace "Volver a Niños", header de perfil (avatar, nombre, edad/sala, botón "Editar"), card de alergias/notas (solo si aplica), datos (nacimiento/sala/ingreso), botón "Resumen del día" y bloque "PADRES VINCULADOS" con estados y acción "Vincular otro padre".
- Usar slugs legibles y estables para los 8 niños (`mateo-fernandez`, `sofia-mendez`, `benjamin-ruiz`, `valentina-soto`, `tomas-diaz`, `emma-castro`, `lucas-romero`, `olivia-vega`), todos con perfil navegable y datos coherentes derivados del prototipo (completando campos faltantes de forma razonable y explícita en `app/_data/kids.ts`).
- Datos estáticos tipados en `app/_data/kids.ts` (niños, padres, alergias/notas, badges/colores, conteos). Reutilizar o centralizar datos compartidos de maestra/sala para evitar duplicación innecesaria con `app/_data/feed.ts` (p. ej. constante compartida); `childrenCount` y "8 niños" se derivan de `kids.length`.
- Extraer un shell/layout compartido reutilizable (p. ej. `app/_components/AppShell.tsx`) con sidebar, manteniendo fidelidad visual de SPEC 01, y marcar "Niños" como activo en `/kids` y `/kids/[id]`.
- Activar navegación real **solo** entre rutas existentes: `Feed` → `/` y `Niños` → `/kids`. El resto de enlaces/acciones (`Nueva publicación`, `Avisos`, `Mi cuenta`, logout, `Agregar niño`, `Editar`, buscador, `Vincular otro padre`, `Resumen del día`) permanecen como placeholders inertes (`aria-disabled="true"`, sin navegación funcional).
- Para slugs inexistentes en `/kids/[id]`, invocar `notFound()` (404 estándar de Next.js/app, sin diseño custom).
- Reproducir tipografía, paleta, tamaños, radios, bordes, sombras, degradados y hover de tarjetas (`.kid`) según los prototipos, usando Tailwind y tokens existentes/nuevos en `app/globals.css` cuando aporten consistencia.
- Ajustar `app/page.tsx` mínimamente para usar el shell compartido sin cambiar el contenido/alcance del feed aprobado en SPEC 01.
- Verificación visual con Playwright MCP a 1440×900 contra `references/screenshots/ninos.png` y `references/screenshots/perfil-nino.png` (si existen capturas equivalentes; en su defecto, comparación directa con los HTML de referencia abiertos en navegador).

**Out of scope (para futuros specs):**

- Diseño móvil/tablet, drawer o responsive distinto al prototipo desktop.
- Búsqueda/filtrado real, ordenamiento, paginación o estado de cliente para el buscador.
- Crear/editar niño real, vinculación real de padres, invitaciones, resumen del día real y cualquier formulario/persistencia.
- Rutas reales para `/avisos`, `/mi-cuenta`, `/crear-publicacion`, `/login`, `/agregar-nino`, `/vincular-padre`, `/resumen-dia`.
- Imágenes reales, carga de archivos o avatares con foto.
- Autenticación, roles/permisos, base de datos, API routes o fetch remoto.
- Tests automatizados nuevos (unit/e2e) más allá de lint, typecheck y build.
- Cambios visuales o funcionales al feed más allá de integrar el shell compartido y la navegación Feed/Niños acordada.

## Data model

```ts
// app/_data/kids.ts
export type ParentStatus = "active" | "pending";

export type LinkedParent = {
  id: string;
  name: string;
  relation: string; // "Mamá" | "Papá" | etc.
  status: ParentStatus;
  statusLabel: string; // "activa" | "invitación enviada"
  badgeLabel: string; // "ACTIVA" | "PENDIENTE"
  initial: string;
  avatarBg: string;
  avatarFg?: string; // opcional, por defecto blanco en prototipo
};

export type KidBadge = {
  label: string; // "MANÍ" | "LACTOSA" | "VINCULAR"
  tone: "allergy" | "action";
};

export type Kid = {
  id: string; // slug usado en /kids/[id]
  name: string;
  initial: string;
  ageLabel: string; // "3 años"
  room: string; // "Sala Soles"
  birthDateLabel: string; // "12 mar 2022"
  joinedLabel: string; // "feb 2025"
  linkedParentsLabel: string; // texto visible en la tarjeta del listado
  linkedParents: LinkedParent[];
  allergiesNote?: string; // si existe, se muestra la card roja en el perfil
  listBadge?: KidBadge; // badge de tarjeta en /kids (alergia o VINCULAR)
  avatarBg: string;
  avatarFg: string;
};

export const kids: Kid[] = [/* 8 niños del prototipo, con datos coherentes */];

export function getKidById(id: string): Kid | undefined;
export function getKidsCount(): number;
```

Convenciones:

- Todos los textos visibles van en español y se copian literalmente del prototipo cuando existan; los campos completados para perfiles no detallados en el HTML deben ser coherentes y plausibles (Sala Soles, edades 2–3 años, fechas/ingresos en formato corto en español).
- Los 8 niños del listado son: Mateo Fernández, Sofía Méndez, Benjamín Ruiz, Valentina Soto, Tomás Díaz, Emma Castro, Lucas Romero y Olivia Vega, con sus iniciales, colores de avatar, subtítulos y badges visibles en `ninos.dc.html`.
- La card roja de "Alergias y notas" solo se renderiza si `allergiesNote` está definido. Mateo incluye la nota completa del prototipo; Tomás incluye nota coherente con badge "LACTOSA"; el resto no muestra la card salvo que se defina explícitamente en los fixtures.
- El bloque "PADRES VINCULADOS" muestra los padres definidos en `linkedParents` y siempre incluye la acción inerte "Vincular otro padre". Para Valentina (`linkedParents: []`), se muestra el bloque sin padres listados y con la acción visible.
- La maestra/sala/rol usados en el shell se obtienen de una fuente compartida (reutilizando o extrayendo desde `app/_data/feed.ts`) para no duplicar nombre, inicial, rol y sala.

## Design tokens

Valores tomados de `references/pantallas/ninos.dc.html` y `references/pantallas/perfil-nino.dc.html`, alineados con `app/globals.css` y SPEC 01. Sombras/degradados no tokenizados se mantienen como valores arbitrarios exactos del prototipo.

| Token / elemento | Valor |
| --- | --- |
| Fondo de app | `#F6ECDF` |
| Superficie / sidebar | `#FFFDF9` |
| Bordes base | `#ECE0D0`, separadores `#F0E6D8` / regla `#E7DAC8` |
| Texto principal/secundario | `#3F362E`, `#94887B`, `#A89A8B`, `#6E6359` |
| Marca / activo Niños | fondo `#FBE3D8`, texto `#D9583C` |
| CTA coral (Agregar niño) | degradado `linear-gradient(180deg,#F4977E,#EE8164)`, texto blanco, sombra `0 8px 18px -8px rgba(238,129,100,.7/.75)` |
| Sidebar / contenido | sidebar 248 px; contenido `/kids` `max-width: 880px`, padding `34px 40px 80px`; contenido `/kids/[id]` `max-width: 820px`, padding `34px 40px 80px` |
| Buscador `/kids` | fondo `#FFFDF9`, borde `#ECE0D0`, radio 14 px, icono `#B0A290` |
| Tarjeta niño (`.kid`) | fondo `#FFFDF9`, borde `#ECE0D0`, radio 18 px, padding 16 px, sombra `0 4px 14px -12px rgba(120,90,60,.5)`, hover `border-color:#F2A78E; transform:translateY(-2px)` |
| Badge alergia en lista | `#FBD8CC` / `#D9684A` (MANÍ, LACTOSA) |
| Badge acción en lista | `#F9D2DE` / `#C56486` (VINCULAR) |
| Perfil: alergias/notas | card `#FBDAD6`, icono bg `#F4A8A0`, título `#C5413A`, texto `#B25249` |
| Perfil: padres | card `#FFFDF9` con borde `#ECE0D0`; badge ACTIVA `#CFEBD8`/`#3E9B6C`; badge PENDIENTE `#F7E7A6`/`#9A7B1E` |
| Botón "Resumen del día" | fondo `#3F362E`, texto blanco, radio 14 px |
| Avatares niños | Mateo/Lucas `#A9D9E8/#1F7A93`, Sofía/Emma `#F4B8CC/#C44A7A`, Benjamín/Olivia `#B9DEC4/#3E8B62`, Valentina `#F4DC8E/#9A7B1E`, Tomás `#C9B6E8/#7B5FC0` |

## Implementation plan

1. **Datos compartidos y fixtures de niños.** Crear `app/_data/kids.ts` con tipos, los 8 niños, slugs, helpers (`getKidById`, conteo) y datos de padres/alergias coherentes. Centralizar/reutilizar datos de maestra/sala compartidos con el feed para evitar duplicación. Verificación manual: importar/inspeccionar que `kids.length === 8` y que todos los slugs resuelven.
2. **Shell compartido.** Extraer `app/_components/AppShell.tsx` (o equivalente) con la sidebar y contenedor `main` (scroll interno, anchos/paddings configurables o variantes por pantalla) y una prop para el ítem activo (`feed` | `kids` | etc.). Activar enlaces reales `Feed` → `/` y `Niños` → `/kids`; mantener el resto inerte con `aria-disabled="true"`. Verificación: el componente renderiza la sidebar con estados activo/inactivo correctos.
3. **Migrar feed al shell.** Refactorizar `app/page.tsx` para usar el shell compartido sin alterar el contenido del feed, posts, datos ni criterios aprobados de SPEC 01. Verificación: `npm run dev` muestra `/` visualmente equivalente y "Feed" navega a `/`, "Niños" a `/kids`.
4. **Pantalla `/kids`.** Implementar `app/kids/page.tsx` (Server Component) con header, CTA inerte "Agregar niño", buscador visual estático, separador "SALA SOLES · N niños" y grilla responsive en 2 columnas como en prototipo de tarjetas (`KidCard` en `app/_components/` si ayuda a claridad). Cada tarjeta enlaza a `/kids/[id]`; badges/chevron/hover según referencia. Verificación: 8 tarjetas visibles, orden y textos del prototipo, links a slugs correctos.
5. **Pantalla `/kids/[id]`.** Implementar `app/kids/[id]/page.tsx` (Server Component, `params` async según Next.js 16) que resuelve el niño por slug y llama `notFound()` si no existe. Renderizar perfil completo: volver a `/kids`, header, card de alergias/notas condicional, datos, botón "Resumen del día" inerte y bloque de padres con badges de estado y acción "Vincular otro padre" inerte. Verificación: `/kids/mateo-fernandez` coincide con el prototipo y `/kids/no-existe` devuelve 404.
6. **Ajustes de tokens/estilos.** Añadir en `app/globals.css` solo los tokens/utilidades necesarios para colores/sombras/hover no cubiertos, manteniendo consistencia con `@theme`. Verificación: no hay regresiones visibles en `/`.
7. **Verificación final.** Capturar `/kids` y `/kids/mateo-fernandez` a 1440×900 con Playwright MCP en `.playwright-mcp/` y comparar contra `references/screenshots/ninos.png` y `references/screenshots/perfil-nino.png` (o los HTML de referencia). Corregir diferencias de espaciado, tipografía, colores y sombras. Ejecutar `npx eslint app`, `npx tsc --noEmit` y `npm run build`.

## Acceptance criteria

- [ ] A 1440 px de ancho, `/kids` y `/kids/[id]` muestran fondo `#F6ECDF`, sidebar de 248 px con `#FFFDF9` y borde derecho `#ECE0D0`, y scroll del contenido dentro de `main` con sidebar fija.
- [ ] El contenido de `/kids` está centrado con `max-width: 880px` y padding `34px 40px 80px`; el de `/kids/[id]` con `max-width: 820px` y el mismo padding.
- [ ] El shell compartido se usa en `/`, `/kids` y `/kids/[id]`; "Feed" está activo en `/` y "Niños" está activo en `/kids` y `/kids/[id]` con estilos `#FBE3D8` / `#D9583C`.
- [ ] La navegación real funciona solo para `Feed` → `/` y `Niños` → `/kids`; los demás ítems/acciones del shell y de estas pantallas son placeholders inertes (`aria-disabled="true"` y sin navegación funcional).
- [ ] `/kids` muestra el header "GESTIÓN / Niños", CTA "Agregar niño" con degradado/sombra del prototipo, buscador visual estático, separador "SALA SOLES · 8 niños" y exactamente 8 tarjetas en el orden del prototipo.
- [ ] Cada tarjeta de `/kids` muestra avatar, nombre, subtítulo y el indicador correcto (badge MANÍ/LACTOSA/VINCULAR o chevron), aplica el hover del prototipo y enlaza a `/kids/[id]` con el slug correcto.
- [ ] `/kids/mateo-fernandez` reproduce el prototipo: enlace "Volver a Niños" a `/kids`, avatar/header, botón "Editar" inerte, card roja de "Alergias y notas", bloque de datos (nacimiento/sala/ingreso), botón "Resumen del día" inerte y bloque "PADRES VINCULADOS" con Lucía (ACTIVA) y Diego (PENDIENTE) más "Vincular otro padre" inerte.
- [ ] Los 8 slugs definidos son navegables y muestran perfiles coherentes; los niños sin `allergiesNote` no renderizan la card roja; Valentina no muestra padres listados pero sí la acción "Vincular otro padre".
- [ ] Un slug inexistente en `/kids/[id]` produce `notFound()` (respuesta 404 estándar), sin error en consola.
- [ ] `app/_data/kids.ts` contiene fixtures tipados y `getKidById`; los conteos/textos derivados (ej. "8 niños") provienen de los datos, sin hardcodear el número en JSX.
- [ ] Las páginas nuevas y los componentes extraídos son Server Components (sin `"use client"`), salvo que una excepción quede documentada; el feed mantiene su comportamiento estático aprobado.
- [ ] `npx eslint app`, `npx tsc --noEmit` y `npm run build` terminan sin errores.
- [ ] La verificación visual a 1440×900 no muestra diferencias relevantes frente a `references/screenshots/ninos.png` y `references/screenshots/perfil-nino.png` (o los HTML de referencia) en layout, tipografía, colores, espaciado y sombras.
- [ ] No hay errores ni warnings nuevos en la consola del navegador en `/`, `/kids` y `/kids/mateo-fernandez`.

## Decisions

- **Sí:** Rutas App Router `/kids` y `/kids/[id]` con slugs legibles para los 8 niños. Son URLs estables, legibles y fáciles de mapear a datos futuros.
- **Sí:** Fixtures tipados en `app/_data/kids.ts` y helpers puros (`getKidById`). Mantiene el patrón de SPEC 01 y facilita reemplazo posterior por BD.
- **Sí:** Extraer shell compartido y activarlo también en `/`. Reduce duplicación y permite estado activo correcto por ruta con cambio acotado al feed existente.
- **Sí:** Navegación real solo entre rutas existentes (`/` y `/kids`). Mejora la UX sin inventar pantallas fuera de alcance.
- **Sí:** Buscador y acciones secundarias como placeholders inertes. Preserva paridad visual y evita introducir estado cliente o rutas stub.
- **Sí:** `notFound()` para slugs inválidos. Es el comportamiento estándar de Next.js y evita diseñar un estado custom no especificado.
- **Sí:** Datos coherentes de ejemplo para perfiles no detallados en el prototipo, manteniendo estructura visual completa. Permite verificar navegación y variantes (con/sin alergias, con/sin padres).
- **No:** Búsqueda/filtrado en cliente. Requeriría `"use client"` y queda fuera del alcance acordado.
- **No:** Crear rutas stub para agregar/editar/vincular/resumen. Agrega superficie no pedida y sin diseño aprobado.
- **No:** Duplicar sidebar en cada página. Aumenta deuda y riesgo de inconsistencias tras la integración.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| El refactor a shell compartido introduce regresiones visuales en `/` (feed) | Comparar `/` contra `references/screenshots/feed.png` y revalidar criterios de SPEC 01 durante la verificación |
| Los datos inventados para los 7 perfiles no detallados generan ambigüedad futura | Mantener fixtures explícitos y fáciles de editar en `app/_data/kids.ts`; documentar que son coherentes/ejemplo |
| Diferencias sutiles de hover, sombras o grid respecto al prototipo HTML inline | Usar valores arbitrarios exactos cuando haga falta y validar con Playwright a 1440×900 |
| `params` en Next.js 16 es async y rompe tipos si se trata como sync | Tipar `params` como `Promise<{ id: string }>` (o `PageProps` generado) y hacer `await` antes de usar |
| Enlaces inertes (`aria-disabled` sin `href`) afectan foco/navegación por teclado | Aceptado en esta fase por consistencia con SPEC 01; se resolverá al implementar rutas reales |

## What is **not** in this spec

- Búsqueda o filtrado real de niños.
- Alta, edición o borrado real de niños.
- Vinculación real de padres, estados persistentes o invitaciones.
- Pantalla/flujo real de "Resumen del día".
- Rutas reales de Avisos, Mi cuenta, Nueva publicación, Login u otras acciones secundarias.
- Versión móvil/tablet, imágenes reales o carga de archivos.
- Autenticación, permisos, base de datos o API.

Cada uno de esos puntos, si se aborda, irá en su propio spec.
