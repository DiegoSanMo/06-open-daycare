# SPEC 05 — Modal para vincular padre

> **Status:** Implemented  
> **Depends on:** SPEC 02  
> **Date:** 2026-11-18  
> **Objective:** Agregar un modal accesible que se abre desde "Vincular otro padre" en el perfil de un niño (`/kids/[id]`), con validación de nombre y email y envío de invitación sin persistencia.

## Scope

**In:**

- Crear `app/_components/LinkParentModal.tsx` como Client Component que replica `references/pantallas/vincular-padre.dc.html`: tarjeta `#FBF4EC`, borde `#ECE0D0`, radio 24 px, max-width 480 px, sombra `0 20px 50px -24px rgba(63,54,46,.35)`, cabecera con título/botón X, aviso informativo azul, campos nombre y email, selector de parentesco, bloque de código y CTA "Enviar invitación".
- Convertir el `<a aria-disabled="true">` actual de `app/kids/[id]/page.tsx` en un `<button type="button">` mediante `app/_components/LinkParentButton.tsx` (Client Component con `useState`), conservando el círculo punteado con ícono `+`, el texto "Vincular otro padre" y su color `#C5503A`. La URL no cambia.
- Textos dinámicos por niño: cabecera "a {kid.name}" y aviso "Solo verá el feed de {firstName}.", derivados del `kid` que ya resuelve `getKidById(id)` en el perfil.
- Parentesco con exactamente `Mamá`, `Papá`, `Tutor/a`, con `Mamá` preseleccionada como en el prototipo; se puede conmutar a las otras dos opciones.
- Código de invitación literal `7K4P9` y texto "Vence en 7 días", alineados con la pantalla de activación de SPEC 03; sin generación aleatoria.
- Validación inline al enviar: nombre obligatorio y email obligatorio con formato válido; errores con borde de campo y mensaje debajo. "Enviar invitación" cierra el modal solo cuando todo es válido, sin guardar ni navegar.
- Accesibilidad: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, foco inicial en el campo nombre, cierre con `Escape`, cierre al hacer clic en el overlay, focus trap, retorno de foco al botón que abrió el modal y bloqueo de scroll de fondo. El botón X cierra sin navegar.
- Verificación visual con Playwright MCP a 1440×900 contra `references/pantallas/vincular-padre.dc.html` (no hay PNG de esta pantalla), guardando artefactos en la carpeta de Playwright del repo (`.playwright-mcp/`), sin commitearlos.

**Out of scope (para futuros specs):**

- Persistencia, agregar padres a `linkedParents`, actualizar contadores ("2 padres vinculados") ni envío real de correo.
- Backend, API routes, base de datos, autenticación o permisos.
- Ruta propia `/vincular-padre`; el modal no cambia la URL.
- Navegación a `/activate-account` tras enviar: esa pantalla es la vista del padre invitado, no del docente.
- Generación rotativa de códigos, expiración real, reenvío ni copiar al portapapeles.
- Botón "Vincular otro padre" en el listado `/kids`; no está en el prototipo de referencia.
- Cambios en `AppShell`, feed, `KidCard`, `/login` ni `/activate-account`.
- Diseño móvil/tablet, fotos ni carga de archivos.
- Tests automatizados nuevos más allá de lint, typecheck y build.

## Data model

```ts
// app/_data/kids.ts (adiciones)
export const parentRelationOptions = ["Mamá", "Papá", "Tutor/a"] as const;
export type ParentRelation = (typeof parentRelationOptions)[number];

export type LinkParentFormValues = {
  parentName: string; // "Ej. Diego Fernández"
  email: string;      // "correo@ejemplo.com"
  relation: ParentRelation; // "Mamá" por defecto
};

export const invitationFixture = {
  code: "7K4P9",
  expiryLabel: "Vence en 7 días",
} as const;
```

Convenciones:

- `open` vive en `LinkParentButton.tsx` con `useState`; el modal recibe `open`, `onClose` y `kidName`.
- `kidName` se pasa desde `app/kids/[id]/page.tsx` (`kid.name`). El nombre de pila se deriva con `split(" ")[0]`.
- Validación manual con `noValidate`: `parentName.trim()` no vacío y email que coincida con `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`. El parentesco siempre tiene valor válido por la preselección.
- Los textos visibles se copian literalmente del prototipo, incluidas tildes.
- Los colores nuevos (aviso azul, bloque ámbar) se aplican como valores arbitrarios de Tailwind dentro del modal; no se agregan tokens a `app/globals.css`.

## Design tokens

Valores tomados de `references/pantallas/vincular-padre.dc.html`.

| Elemento | Valor |
| --- | --- |
| Overlay | `rgba(63,54,46,.45)`, centrado arriba, `z-50` |
| Tarjeta | fondo `#FBF4EC`, borde `#ECE0D0`, radio 24 px, max-width 480 px, sombra `0 20px 50px -24px rgba(63,54,46,.35)` |
| Cabecera | padding `20px 26px`, borde inferior `#ECE0D0`; título Fredoka 600 18 px `#3F362E`; subtítulo 13 px `#A89A8B`; X 34×34, radio 10, fondo `#F0E6D8`, color `#94887B` |
| Aviso | fondo `#E3ECFB`, radio 14 px, padding `13px 16px`, ícono `#4E72C8`, texto 13.5 px `#3F5694` |
| Labels | 12 px, weight 800, tracking `.7px`, `#94887B` |
| Inputs | fondo blanco, borde `#EADFD0` 1.5 px, radio 14 px, padding `13px 16px`, texto 15 px `#3F362E`; placeholder `#B6A99B` |
| Parentesco | pills `flex-1`, gap 9 px, radio 999 px, padding 11 px, 14 px weight 800; activo borde `#9FB8EC`, fondo `#CCD8F4`, texto `#4E72C8`; inactivo borde `#ECE0D0`, fondo `#FFFDF9`, texto `#6E6359` |
| Código | fondo `#FBF1D6`, borde dashed `#E6D08A` 1.5 px, radio 16 px, padding 18 px; label 12 px `#A88526`, código Fredoka 600 34 px tracking 7 px `#8A7234`, vencimiento 13 px `#A88526` |
| CTA | degradado `180deg,#F4977E,#EE8164`, radio 14 px, padding 14 px, 15.5 px weight 800 blanco, sombra `0 10px 22px -8px rgba(238,129,100,.7)`, ícono de avión |
| Error | borde `#D9583C`, mensaje 12 px `#D9583C` |
| Foco visible | outline `#D9583C` 2 px con offset 2 px |

## Implementation plan

1. **Datos y tipos.** Agregar `parentRelationOptions`, `ParentRelation`, `LinkParentFormValues` e `invitationFixture` en `app/_data/kids.ts`. Verificación: `npx tsc --noEmit` sin errores.
2. **Esqueleto del modal.** Crear `app/_components/LinkParentModal.tsx` con `"use client"`, props `open`/`onClose`/`kidName`, overlay, tarjeta, cabecera y `role="dialog"`. Verificación: el perfil sigue renderizando igual con el modal cerrado.
3. **Formulario y contenido.** Agregar aviso, nombre, email, parentesco con `Mamá` preseleccionada (radio inputs nativos ocultos con etiquetas tipo pill), bloque `7K4P9` y CTA. Verificación: en `/kids/mateo-fernandez` se lee "a Mateo Fernández" y "Solo verá el feed de Mateo."; en `/kids/sofia-mendez`, "a Sofía Méndez".
4. **Validación y cierre.** Implementar `handleSubmit` con `noValidate` y errores inline; "Enviar invitación" válido cierra; X, overlay y `Escape` cierran sin guardar. Verificación: enviar vacío muestra 2 errores y no cierra; completar válido cierra sin navegar y sin modificar los padres del perfil.
5. **Accesibilidad.** Foco inicial en nombre, focus trap, retorno de foco, `aria-labelledby`/`aria-describedby`, `aria-invalid` y bloqueo de scroll. Verificación: `Tab`/`Shift+Tab` nunca salen del diálogo; `Escape` devuelve el foco al botón.
6. **Integración en el perfil.** Crear `LinkParentButton.tsx` y reemplazar el `<a aria-disabled>` de `app/kids/[id]/page.tsx`, pasando `kid.name`. Verificación: el clic abre el modal; el resto del perfil no cambia.
7. **Verificación final.** Capturar el modal abierto a 1440×900 y comparar con `vincular-padre.dc.html`. Correr `npx eslint app`, `npx tsc --noEmit` y `npm run build`.

## Acceptance criteria

- [ ] El CTA "Vincular otro padre" de `/kids/[id]` es un `<button type="button">` que abre el modal al hacer clic y conserva ícono `+`, círculo punteado, texto y color `#C5503A`.
- [ ] El modal no está en el DOM inicial del perfil; aparece solo tras el clic.
- [ ] La cabecera muestra "Vincular padre" y "a {kid.name}": "a Mateo Fernández" en `/kids/mateo-fernandez` y "a Sofía Méndez" en `/kids/sofia-mendez`.
- [ ] El aviso dice "Le enviaremos un correo con un código para que active su cuenta. Solo verá el feed de {firstName}.", con el nombre de pila dinámico.
- [ ] Los labels, placeholders y textos del formulario coinciden literalmente con `vincular-padre.dc.html`.
- [ ] El parentesco ofrece exactamente `Mamá`, `Papá` y `Tutor/a`, arranca en `Mamá` y permite cambiar a las otras dos.
- [ ] El bloque muestra `7K4P9` y "Vence en 7 días" de forma fija en cualquier perfil.
- [ ] Enviar vacío marca nombre y email con error inline y `aria-invalid="true"`, y el modal permanece abierto.
- [ ] Un email sin formato válido (ej. `correo`) muestra error; `correo@ejemplo.com` lo pasa.
- [ ] Enviar válido cierra el modal sin navegar, sin agregar padres a `linkedParents` y sin cambiar el contador del perfil.
- [ ] El botón X, el clic en el overlay y `Escape` cierran el modal; la X no navega a otra ruta.
- [ ] El modal tiene `role="dialog"`, `aria-modal="true"` y `aria-labelledby`; el foco entra en el campo nombre y vuelve al botón al cerrar.
- [ ] `Tab` y `Shift+Tab` no mueven el foco a elementos detrás del overlay; el scroll del fondo se bloquea y se restaura.
- [ ] La comparación visual a 1440×900 contra `vincular-padre.dc.html` no muestra diferencias relevantes en colores, radios, tipografías ni espaciados.
- [ ] `npx eslint app`, `npx tsc --noEmit` y `npm run build` terminan sin errores.

## Decisions

- **Sí:** Client Component con `open` controlado por un wrapper `<button>`, como en SPEC 04; `app/kids/[id]/page.tsx` sigue siendo Server Component.
- **Sí:** Textos del niño dinámicos por `kid.name`. El prototipo dice "Mateo", pero la app tiene ocho perfiles.
- **Sí:** `Mamá` preseleccionada, por decisión del usuario. A diferencia de "Seleccione sala" en SPEC 04, no hay opción guía vacía ni validación de parentesco.
- **Sí:** Validar nombre y email y cerrar sin persistir, por decisión del usuario y coherencia con SPEC 04.
- **Sí:** Código `7K4P9` y "Vence en 7 días" literales del prototipo y coincidentes con `/activate-account` (SPEC 03); sin generación aleatoria.
- **Sí:** Patrón completo de accesibilidad de SPEC 04, incluido el retorno de foco y el bloqueo de scroll.
- **No:** Ruta `/vincular-padre`. El prototipo es un modal; la URL no debe cambiar.
- **No:** Envío real de correo ni navegación a `/activate-account`. La activación es el flujo del padre invitado.
- **No:** Modificar `linkedParents`, contadores, `AppShell` ni otras rutas.
- **No:** Tokens nuevos en `globals.css`; los colores puntuales van como valores arbitrarios de Tailwind, igual que en SPEC 04.
- **No:** Diseño responsive; el prototipo es desktop.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| Convertir el `<a>` en `<button>` altere estilos por el reset de Tailwind | Copiar las clases existentes literalmente y comparar computed styles en Playwright |
| El grupo de parentesco pierda navegación por teclado si se implementa con botones ARIA | Usar radio inputs nativos ocultos con etiquetas visuales tipo pill |
| Un nombre de niño largo rompa la cabecera | `min-w-0` y truncado; verificar con "Benjamín Ruiz" o "Valentina Soto" |
| No existe PNG de referencia para esta pantalla | Abrir el HTML de referencia en navegador y comparar a 1440×900 |

## What is **not** in this spec

- Guardar padres, modificar `linkedParents` ni navegar tras enviar.
- Envío real de correo, códigos generados, expiración ni reenvío.
- Botón en `/kids`, cambios en el shell/feed ni ruta `/vincular-padre`.
- Backend, autenticación o base de datos.
- Responsive, fotos, archivos ni tests automatizados nuevos.

Cada uno de esos puntos, si se aborda, irá en su propio spec.
