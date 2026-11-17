# SPEC 03 — Pantallas de login y activación de cuenta

> **Status:** Implemented
> **Depends on:** SPEC 01
> **Date:** 2026-11-17
> **Objective:** Implementar las pantallas estáticas de inicio de sesión en `/login` y activación de cuenta en `/activate-account` como réplicas visuales de los prototipos, sin selector de rol, autenticación ni backend.

## Scope

**In:**

- Crear `/login` (`app/login/page.tsx`) como réplica de `references/pantallas/login.dc.html`: grilla `1.05fr / 1fr`, panel coral izquierdo (logo, titular, descripción, círculos decorativos y pie "🌿 Guardería Sala Soles") y panel derecho con "Iniciar sesión", campos de email/contraseña, "¿Olvidaste tu contraseña?", CTA y enlace "Activá tu cuenta".
- **Omitir por decisión del usuario** el bloque "INGRESO COMO" y los botones "Personal" / "Familia". El email precargado queda fijo como en la variante de personal (`caro@opendaycare.com`).
- Crear `/activate-account` (`app/activate-account/page.tsx`) como réplica de `references/pantallas/activar-cuenta.dc.html`: icono de marca, "Bienvenida a OpenDayCare", tarjeta de invitación ("M", "Te invitaron a seguir a", "Mateo · Sala Soles"), código `7K4P9`, email, contraseña, casilla de consentimiento marcada, CTA "Activar mi cuenta" y enlace "Iniciar sesión".
- Reutilizar Fredoka/Nunito y los tokens de SPEC 01; agregar a `app/globals.css` solo los tokens nuevos que aporten consistencia (fondo auth, borde de campo, placeholder).
- Fixtures tipados y literales en `app/_data/auth.ts`, siguiendo el patrón de `app/_data/feed.ts` y `app/_data/kids.ts`.
- Enlaces reales **solo** a rutas existentes: CTA "Iniciar sesión" → `/`, "Activá tu cuenta" → `/activate-account`, "Iniciar sesión" (en activación) → `/login`.
- Acciones sin destino real ("¿Olvidaste tu contraseña?" y "Activar mi cuenta") como placeholders inertes con `aria-disabled="true"` y sin `href`.
- Valores del prototipo como `defaultValue` / `defaultChecked`, sin `"use client"` ni hooks.
- Verificación visual con Playwright a 1440×900 contra los HTML de referencia (no existen PNG de estas dos pantallas).

**Out of scope (para futuros specs):**

- Selector de rol Personal/Familia y cualquier lógica dependiente de rol.
- Autenticación, sesión, validación de formularios, recuperación de contraseña o backend.
- Feed familiar (`/familia-feed`) y cualquier otra pantalla no mencionada.
- Cambios en `AppShell`, en el botón de salida del shell o en `/`, `/kids` y `/kids/[id]`.
- Diseño móvil/tablet; los prototipos son desktop.
- Imágenes reales o carga de archivos.
- Tests automatizados nuevos más allá de lint, typecheck y build.

## Data model

```ts
// app/_data/auth.ts
export type LoginFixture = {
  email: string; // "caro@opendaycare.com"
};

export type ActivationFixture = {
  inviteCode: string;      // "7K4P9"
  email: string;           // "lucia.fernandez@gmail.com"
  password: string;        // "contraseña"
  childInitial: string;    // "M"
  childLabel: string;      // "Mateo · Sala Soles"
  invitationLabel: string; // "Te invitaron a seguir a"
  consentLabel: string;    // texto literal del prototipo
};

export const loginFixture: LoginFixture = { /* valores literales */ };
export const activationFixture: ActivationFixture = { /* valores literales */ };
```

Convenciones:

- Todos los textos visibles van en español y se copian literalmente del prototipo (tildes, `…` y signos incluidos).
- Se eliminan `role`, `pickStaff`, `pickParent` y `loginHref` condicional del prototipo: ya no existen variantes por rol.
- No se agregan campos que no se rendericen en pantalla.

## Design tokens

Valores tomados de `references/pantallas/login.dc.html` y `activar-cuenta.dc.html`, alineados con `app/globals.css` de SPEC 01.

| Token / elemento | Valor |
| --- | --- |
| Fondo de ambas rutas | `#FBF4EC` (distinto del `#F6ECDF` global) |
| Panel izquierdo login | degradado `155deg`, `#F6A98E` → `#F2937A` → `#EC7E62` |
| Círculos decorativos | `rgba(255,255,255,.12)` y `rgba(255,255,255,.10)` |
| Borde de inputs / tarjeta invitación | `#EADFD0`, radio 14 px / 16 px |
| Placeholder | `#B6A99B` |
| Texto principal / secundario | `#3F362E`, `#94887B` |
| Enlaces de marca | `#C5503A` (`brand-strong`) |
| CTA coral | degradado `180deg,#F4977E,#EE8164`, sombra `0 10px 22px -8px rgba(238,129,100,.7)`, radio 15 px |
| Logo login | 46 px, radio 14 px, fondo `rgba(255,255,255,.22)` |
| Logo activación | 58 px, radio 18 px, degradado `#F8C3A8` → `#F2937A` |
| Avatar invitación | 44 px, `#A9D9E8` / `#1F7A93`, Fredoka 600 |
| Consentimiento | fondo `#FBF1D6`, check `#5FB97E`, texto `#8A7234` |
| Tipografía | Fredoka para títulos, logo y código; Nunito para el resto |

## Implementation plan

1. **Tokens y fixtures.** Agregar a `app/globals.css` los tokens auth necesarios y crear `app/_data/auth.ts` con los tipos y valores literales. Verificación: `npx tsc --noEmit` limpio.
2. **Shell de `/login`.** Crear `app/login/page.tsx` con la grilla `1.05fr / 1fr` y el panel izquierdo completo. Verificación: `npm run dev` renderiza la ruta sin errores.
3. **Formulario de `/login`.** Agregar el panel derecho con campos precargados, enlace de olvido inerte, CTA → `/` y enlace → `/activate-account`. Verificación: no aparecen "Personal", "Familia" ni "INGRESO COMO" en el DOM.
4. **Pantalla `/activate-account`.** Crear `app/activate-account/page.tsx` con tarjeta de invitación, campos, consentimiento marcado, CTA inerte y enlace → `/login`. Verificación: valores y textos coinciden con el prototipo.
5. **Verificación final.** Capturar ambas rutas a 1440×900 en `.playwright-mcp/` y comparar contra los HTML de referencia. Cerrar con `npx eslint app`, `npx tsc --noEmit` y `npm run build`.

## Acceptance criteria

- [x] `/login` y `/activate-account` renderizan sin errores ni 404. ✅ `GET /login 200`, `GET /activate-account 200` — `npm run build` (16 páginas estáticas, sin 404)
- [x] `/login` no contiene "Personal", "Familia" ni "INGRESO COMO"; no hay botones de selección de rol. ✅ `roleWords: []` — Playwright `browser_evaluate` en `/login` (`.playwrights-mcp/verif-login-1440.png`)
- [x] A 1440 px, `/login` muestra la grilla `1.05fr / 1fr`, fondo `#FBF4EC` y panel izquierdo con degradado `155deg`. ✅ `grid 737.555px 702.445px`, `rootBg rgb(251,244,236)`, `leftBg linear-gradient(155deg,...)` — Playwright computed styles
- [x] El email de `/login` aparece precargado con `caro@opendaycare.com` y el campo de contraseña usa el placeholder de viñetas. ✅ `email.value "caro@opendaycare.com"`, `pwd.placeholder "••••••••"` — Playwright DOM
- [x] En `/login`, "Iniciar sesión" enlaza a `/` y "Activá tu cuenta" enlaza a `/activate-account`. ✅ `cta.href "/"`, `linkActivar.href "/activate-account"` — Playwright DOM
- [x] "¿Olvidaste tu contraseña?" es inerte (`aria-disabled="true"`, sin `href`). ✅ `inerte { text "¿Olvidaste tu contraseña?", href null }` — Playwright DOM
- [x] `/activate-account` muestra la tarjeta de invitación, el código `7K4P9`, el email, la contraseña y la casilla de consentimiento marcada. ✅ `cardBg rgb(255,255,255)`, `code.value "7K4P9"`, `email.value "lucia.fernandez@gmail.com"`, `pwd.value "contraseña"`, `checkbox.checked true` — Playwright computed styles + DOM (`.playwrights-mcp/verif-activate-account-1440.png`)
- [x] En `/activate-account`, "Iniciar sesión" enlaza a `/login` y "Activar mi cuenta" es inerte. ✅ `linkLogin.href "/login"`, `cta.href null` (inerte) — Playwright DOM
- [x] Ambas páginas son Server Components sin `"use client"`, sin hooks ni estado. ✅ `"use client"` ausente en `app/login/page.tsx` y `app/activate-account/page.tsx`; sin `useState`/`useEffect` ni hooks — source
- [x] Títulos/logo/código usan Fredoka y el resto Nunito; no aparece Geist ni Arial. ✅ `h1 Fredoka`, `h2 Fredoka`, `code Fredoka`, `email/nombre Nunito`, 0 elementos Geist/Arial — Playwright computed styles
- [x] `npx eslint app`, `npx tsc --noEmit` y `npm run build` terminan sin errores. ✅ eslint EXIT 0; tsc EXIT 0; `next build` EXIT 0, 16 páginas estáticas
- [x] No hay errores ni warnings nuevos en la consola del navegador. ✅ `browser_console_messages` level warning → 0 mensajes en `/login` y `/activate-account`
- [x] La comparación visual a 1440×900 contra los HTML de referencia no muestra diferencias relevantes. ✅ `appLogin` vs `refLogin` y `appAct` vs `refAct` coinciden en tipografía, colores, radios, degradados y sombras (única diferencia esperada: ausencia del bloque Personal/Familia por decisión de alcance) — Playwright computed styles + capturas `.playwrights-mcp/verif-login-1440.png`, `verif-activate-account-1440.png`

## Decisions

- **Sí:** rutas `/login` y `/activate-account`. El usuario pidió el slug en inglés para la activación.
- **Sí:** eliminar el selector de rol. Decisión explícita del usuario; queda un único email precargado.
- **Sí:** enlaces reales solo a rutas existentes. Evita 404 y mantiene la coherencia con SPEC 02.
- **Sí:** componentes estáticos con `defaultValue` / `defaultChecked`. No se introduce estado cliente ni autenticación.
- **Sí:** fixtures tipados en `app/_data/auth.ts`. Mantiene el patrón de specs anteriores y facilita reemplazo futuro.
- **Sí:** verificación contra los HTML de referencia. No existen screenshots PNG de login ni activación.
- **No:** autenticación, validación ni recuperación de contraseña. Requieren backend y otro spec.
- **No:** modificar `AppShell` ni las rutas existentes. Fuera de alcance acordado.
- **No:** diseño responsive. Los prototipos son desktop.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| No hay screenshots PNG de referencia | Abrir los `.dc.html` en el navegador y comparar a 1440×900 con Playwright |
| Los valores `defaultValue` parezcan formulario funcional | Documentar que son datos de ejemplo estáticos; sin `"use client"` |
| El fondo `#FBF4EC` difiera del resto de la app | Aplicar el token solo en estas dos rutas; el `body` global se mantiene |
| Quitar el rol deje un email fijo de personal | Decisión registrada en Decisions; sin variantes ocultas |

## What is **not** in this spec

- Selector Personal/Familia ni lógica por rol.
- Autenticación, sesión, validación ni recuperación de contraseña.
- Feed familiar ni otras pantallas nuevas.
- Cambios en `/`, `/kids`, `/kids/[id]` ni en el shell compartido.
- Versión móvil/tablet, imágenes reales ni carga de archivos.

Cada uno de esos puntos, si se aborda, irá en su propio spec.

## Verification

> **Date:** 2026-11-17 · **Verified by:** spec-verifier (`opencode/nemotron-3.5-super-vl-free`)
> **Result:** 13/13 criteria passed

| # | Criterion | Result | Evidence |
| --- | --- | --- | --- |
| 1 | `/login` y `/activate-account` renderizan sin errores ni 404 | ✅ Pass | `GET /login 200`, `GET /activate-account 200` — `next build` EXIT 0, 16 páginas estáticas |
| 2 | `/login` sin "Personal", "Familia" ni "INGRESO COMO" | ✅ Pass | `roleWords: []` — Playwright `browser_evaluate` `/login` |
| 3 | Grilla `1.05fr/1fr`, fondo `#FBF4EC`, panel degradado `155deg` | ✅ Pass | `grid 737.555px 702.445px`, `rootBg rgb(251,244,236)`, `leftBg linear-gradient(155deg,#F6A98E,#F2937A,#EC7E62)` — computed styles |
| 4 | Email precargado `caro@opendaycare.com`, contraseña placeholder viñetas | ✅ Pass | `email.value`, `pwd.placeholder` — Playwright DOM |
| 5 | "Iniciar sesión" → `/`, "Activá tu cuenta" → `/activate-account` | ✅ Pass | `cta.href "/"`, `linkActivar.href "/activate-account"` — Playwright DOM |
| 6 | "¿Olvidaste tu contraseña?" inerte (`aria-disabled="true"`, sin `href`) | ✅ Pass | `href: null` — Playwright DOM |
| 7 | Tarjeta invitación, `7K4P9`, email, contraseña, consentimiento marcado | ✅ Pass | `cardBg rgb(255,255,255)`, `code.value "7K4P9"`, `checkbox.checked true` — computed styles + DOM |
| 8 | "Iniciar sesión" → `/login`, "Activar mi cuenta" inerte | ✅ Pass | `linkLogin.href "/login"`, `cta.href null` — Playwright DOM |
| 9 | Server Components sin `"use client"`, sin hooks ni estado | ✅ Pass | `"use client"` ausente; sin `useState`/`useEffect` — source `app/login/page.tsx`, `app/activate-account/page.tsx` |
| 10 | Fredoka para títulos/logo/código; Nunito para el resto; sin Geist ni Arial | ✅ Pass | `h1 Fredoka`, `code Fredoka`, `email Nunito`, 0 elementos Geist/Arial — computed styles |
| 11 | `npx eslint app`, `npx tsc --noEmit`, `npm run build` sin errores | ✅ Pass | eslint EXIT 0; tsc EXIT 0; `next build` EXIT 0 |
| 12 | Sin errores ni warnings en consola del navegador | ✅ Pass | `browser_console_messages` warning → 0 mensajes en `/login` y `/activate-account` |
| 13 | Comparación visual 1440×900 vs HTML de referencia sin diferencias relevantes | ✅ Pass | `appLogin`/`refLogin` y `appAct`/`refAct` coinciden en tipografía, colores, radios, degradados y sombras — `.playwrights-mcp/verif-login-1440.png`, `verif-activate-account-1440.png` |
