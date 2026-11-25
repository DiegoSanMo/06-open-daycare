<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- BEGIN:nextjs-agent-feedback -->

## Report Next.js feedback

The project owner enabled `experimental.agentFeedback`, authorizing this feedback pass. When enabled, `next dev` writes this block and restores it if removed. Commit `AGENTS.md` with your work to keep the tree clean.

During the current user request, retain anonymized facts as feedback candidates for meaningful or recurring Next.js issues:

- Crashes, hangs, OOMs, or unexpected slowness
- Incorrect behavior, output, errors, or diagnostics
- Missing, unclear, or conflicting documentation
- Unexpected CLI, codemod, Skill, or upgrade behavior and non-obvious workarounds

Continue the current user request without reporting immediately. Routine debugging is not feedback. Verify changes before retaining them as feedback candidates. Never retain code, logs, paths, URLs, secrets, personal information, or project-specific data.

Retain qualifying friction even if it is later fixed or worked around; record the final outcome during the reporting pass.

Before the final response, run one reporting pass. If candidates remain, from this file's directory run `npx --no-install next internal agent-feedback-instructions` once without piping or truncating its output. Follow its output or error guidance. If a network sandbox blocks it, retry with network access; if it still returns no output, continue normally.

<!-- END:nextjs-agent-feedback -->

## What this is

Daycare app (`open-daycare`) built from the static prototypes in `references/`:

- `references/pantallas/*.dc.html` — 15 screen prototypes plus `index.dc.html`, a catalog of the rest (login, staff feed, compose, child profiles, parent feed, notices, daily summary, account). Plain HTML with inline styles, rendered by `support.js`; open them directly in a browser.
- `references/screenshots/*.png` — rendered captures of those screens.

`app/` ya contiene pantallas implementadas (el feed en `app/page.tsx`, login, kids, activate-account y la demo `/todos`), traducidas de los prototipos a componentes con Tailwind — no importar archivos de `references/` ni `support.js`, y no copiar sus estilos inline literalmente. Los prototipos cargan Fredoka + Nunito; `app/layout.tsx` carga esas mismas fuentes vía `next/font/google`.

## Commands

- `npm run dev` — dev server (Turbopack is the default in Next 16; no `--turbopack` flag).
- `npm run lint` — bare `eslint` over the whole repo, including the generated `references/pantallas/support.js` (its header says "do not edit"), which has 2 pre-existing errors (`react/no-deprecated`, `no-assign-module-variable`). Lint only what you changed (ej. `npx eslint app proxy.ts utils`). `next lint` was removed in Next 16.
- `npx tsc --noEmit` — typecheck. Depends on generated types in `.next/types`; if `LayoutProps`/`PageProps` are unresolved, run `npx next typegen` or start the dev server.
- `npm run build` — production build.
- No test suite, formatter, or CI workflows exist yet.

## Next.js 16 gotchas in this repo

- `next.config.ts` enables `cacheComponents` + `partialPrefetching`. Uncached async data and `cookies()`/`headers()` reads must sit inside `<Suspense>`; use `'use cache'` + `cacheLife()` to cache. `export const runtime` is not allowed (Node only). See `node_modules/next/dist/docs/01-app/01-getting-started/08-caching.md`.
- `params`, `searchParams`, `cookies()`, `headers()` are async-only. Route props come from generated globals (`PageProps<'/route'>`, `LayoutProps<'/'>`) — `app/layout.tsx` already does this.
- `middleware.ts` es `proxy.ts` en v16 (Node runtime only). El proxy de este repo está en la raíz (`proxy.ts`) y delega en `utils/supabase/middleware.ts`: debe llamar `await supabase.auth.getClaims()` para refrescar el token y copiar al response los headers de caché que entrega `setAll` (`Cache-Control`, `Expires`, `Pragma`). No ejecutar código entre la creación del cliente y `getClaims()`.
- CSS is wired through `turbopack.rules` with `@tailwindcss/turbopack`, not PostCSS. Keep the single `@import "tailwindcss";` entry in `app/globals.css`.
- The two `BEGIN:nextjs-*` blocks above are rewritten by `next dev`; put project notes outside them.
- `@/*` maps to the repo root (`@/app/...`), not `src/`. There is no `src/`.

## Spec workflow

This repo ships repo-local skills (`.agents/skills/`, pinned in `skills-lock.json`): `/spec` designs a spec at `specs/NN-slug.md`, `/spec-impl` implements only specs marked `Approved` on branch `spec-NN-slug`. `specs/.spec-config.yml` controls branch creation and per-step commits. Check the spec state before implementing.

**Ubicación de specs:** todo archivo de especificación relacionado con la base de datos (tablas, columnas, migraciones, RLS, índices, triggers, funciones, seeds, Supabase CLI/MCP, esquema) debe crearse en `specs/database/NN-slug.md`, nunca en la raíz de `specs/`. Los specs de UI, features y otros temas no relacionados con la base de datos van en `specs/NN-slug.md`. La numeración `NN` es global y consecutiva en todo el repo (por ejemplo, `specs/01-home-feed.md`, `specs/database/07-create-daycares-table.md`). Antes de crear un spec, revisar ambos directorios para no repetir número ni tema.

## Supabase

El proyecto usa Supabase como backend (Auth + Postgres). **El esquema todavía no está implementado en la base de datos**: hoy existe solo como referencia.

- Esquema de referencia: `../07-DB-Schema/opendaycare-database-schema.md`, expuesto en `opencode.json` como reference `docs`. Leerlo antes de crear tablas, migraciones o consultas; no inventar el modelo de memoria.
- 13 tablas: `daycares`, `users`, `rooms`, `children`, `parent_children`, `invitations`, `posts`, `post_children`, `post_photos`, `reactions`, `comments`, `daily_summaries`, `devices`.
- ENUMs: `user_role`, `user_status`, `relationship_type`, `invitation_status`, `post_type`, `child_status`.
- Convenciones: PK `id uuid` con default `gen_random_uuid()`; `created_at` / `updated_at timestamptz`. Todo lo persistido en **inglés** (enums, tags, códigos); las etiquetas visibles al usuario se traducen a español en la capa UI.
- `users.id` es FK a `auth.users(id)` (mismo UUID). Email y contraseña viven en `auth.users`: no duplicarlos. La fila de perfil se crea con un trigger `AFTER INSERT` en `auth.users` (`SECURITY DEFINER`) tomando `daycare_id`, `role` y `full_name` de `raw_user_meta_data`. Activar RLS.
- Las tres tablas intermedias son el corazón del modelo: `parent_children` (quién es familia de quién), `post_children` (define el feed del padre) e `invitations` (onboarding).
- Config local: `.env` está ignorado por git y hoy define `SUPERBASE_DB_PASSWORD` (`.env.template` está vacío). Verificar el nombre de la variable antes de usar CLI/SDK; parece un typo de `SUPABASE_DB_PASSWORD`. No commitear valores.
- `.env.local` (también ignorado por git) define `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Next lo carga automáticamente en dev/build; es la única fuente de credenciales para los clientes SSR. La publishable key es pública por diseño; nunca poner `service_role`/secret keys en variables `NEXT_PUBLIC_*`.
- Cliente instalado con versiones fijadas en `package.json` y lockfile actualizado: `@supabase/supabase-js@2.119.2`, `@supabase/ssr@0.12.7`. Actualizar con `npm install --save-exact`, regenerar el lockfile y commitearlo junto con el cambio.
- Supabase cambia seguido: antes de implementar, verificar changelog/docs (skill `supabase`) en vez de depender de datos de entrenamiento. Verificar siempre cada cambio con una query o advisor.

### Cliente SSR (Next.js 16 + `@supabase/ssr`)

Archivos ya creados; reutilizarlos en vez de crear clientes `createServerClient`/`createBrowserClient` directamente en cada pantalla:

- `utils/supabase/server.ts` — `await createClient()` para Server Components, Server Actions y Route Handlers. Lee cookies con `await cookies()` y envuelve `setAll` en `try/catch` porque los Server Components no pueden escribir cookies.
- `utils/supabase/client.ts` — `createClient()` para Client Components; `createBrowserClient` ya aplica singleton.
- `utils/supabase/middleware.ts` — `createClient(request)` construye el response, refleja las cookies refrescadas en el request y en el response, copia los headers de caché de `setAll` y llama a `getClaims()`.
- `proxy.ts` (raíz) — único proxy del proyecto; exporta `proxy`, delega en el helper anterior y define el `matcher` que excluye `_next/static`, `_next/image`, `favicon.ico` y archivos de imagen.

Notas de implementación vigentes (verificadas contra docs de Supabase y Context7):

- Usar `getClaims()` (no `getSession()`) en código de servidor para verificar/refrescar la sesión; `getUser()` solo si se necesita el registro fresco de Auth.
- `getAll`/`setAll` en vez de los métodos `get`/`set`/`remove` (deprecados).
- Las variables se leen con `process.env.NEXT_PUBLIC_SUPABASE_URL!` y `process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!`.
- Bajo `cacheComponents: true`, una query async a Supabase debe vivir en un componente hijo dentro de `<Suspense>` (ver `app/todos/page.tsx`); no ponerla directo en el export default sin boundary.
- `app/todos/page.tsx` es una demo de conexión: consulta `todos`, tabla que **no existe** en el esquema de referencia, así que muestra el error de PostgREST con `role="alert"`. No reemplazar `app/page.tsx` (feed) con este ejemplo. Si se quiere una demo con datos reales, usar `posts` o crear la tabla primero.
- Estado verificado: `npx tsc --noEmit`, `npx eslint app proxy.ts utils`, `npm run build` y un `GET /todos` en dev (200 con error esperado de tabla inexistente) pasaron correctamente.

### Reglas críticas de Supabase / Postgres (resumen de las skills)

- Habilitar RLS en toda tabla de un schema expuesto (`public` por defecto). Políticas con `TO authenticated` **más** un predicado de dueño (`auth.uid()`), no solo el rol. En `UPDATE`, incluir `USING` **y** `WITH CHECK`. `auth.role()` está deprecado.
- Nunca usar `raw_user_meta_data` para autorización: es editable por el usuario. Usar `app_metadata`. Nunca exponer `service_role` / secret keys en variables `NEXT_PUBLIC_*` (en Next.js viajan al browser).
- `SECURITY DEFINER` bypasea RLS: evitarlo salvo que sea imprescindible. Vistas con `security_invoker = true` (Postgres 15+). Storage upsert requiere `INSERT + SELECT + UPDATE`.
- Antes de escribir o cambiar SQL (tablas, columnas, índices, migraciones, RLS, triggers, funciones) cargar `supabase-postgres-best-practices`; para cualquier otra tarea de Supabase cargar `supabase`.

## Agentes del proyecto (subagentes)

Todos los agentes viven en `.opencode/agents/` y se invocan seleccionándolos con **Tab** en OpenCode (o mediante su comando, cuando existe), pasando en el prompt el archivo, spec o alcance concreto. Si no reciben ese objetivo, deben pedirlo y detenerse. Ninguno hace commit, push ni cambio de rama.

| Agente | Archivo | Modelo | Cuándo usarlo | Edición |
| ------ | ------- | ------ | ------------- | ------- |
| `spec-verifier` | `.opencode/agents/spec-verifier.md` | `opencode/nemotron-3.5-super-vl-free` | Verificar criterios de aceptación de un spec aprobado | Corrige desviaciones reales en `app/` y marca criterios con evidencia en `specs/*.md`; nunca cambia criterios, estado ni decisiones |
| `db-security-auditor` | `.opencode/agents/db-security-auditor.md` | `opencode/nemotron-3.5-super-vl-free` | Auditar RLS y aislamiento padre/niño | Solo lectura; propone SQL, lo aplica `db-migrator` |
| `db-migrator` | `.opencode/agents/db-migrator.md` | `opencode/nemotron-3.5-super-vl-free` | Crear y aplicar migraciones de un spec de BD | Solo `supabase/migrations/*`; remoto con confirmación explícita |
| `accessibility-checker` | `.opencode/agents/accessibility-checker.md` | `opencode/nemotron-3.5-super-vl-free` | Auditar accesibilidad WCAG 2.2 AA de un archivo | Solo lectura; reporta hallazgos, no corrige |
| `react-best-practices` | `.opencode/agents/react-best-practices.md` | heredado de la sesión | Aplicar buenas prácticas React 19 / Next 16 a archivos puntuales | Solo la lista explícita de archivos, con confirmación por edición |

### Spec verifier

- **Cómo invocarlo:** seleccionar `spec-verifier` con **Tab** y pasar el spec (`01-home-feed`, `01`, `home-feed` o el nombre completo del archivo).
- **Qué hace:** valida que el spec esté `Approved`/`Implemented`, arma una matriz de verificación, contrasta convenciones de Next.js con Context7, corre verificaciones estáticas (`npx eslint app`, `npx tsc --noEmit`, `npm run build`), revisa pantallas con Playwright MCP cuando aplica, corrige solo desviaciones reales, marca los criterios con evidencia y agrega/reemplaza la sección `## Verification`.
- **Seguridad:** nunca edita criterios, alcance ni decisiones; no cambia el `Status` sin preguntar; no commitea, pushea ni cambia de rama; no deja servidores ni browsers abiertos. Es subagente (`mode: subagent`), no agente primary.

### Database security auditor

- **Cómo invocarlo:** seleccionar `db-security-auditor` con **Tab** y, opcionalmente, pasar el alcance (`all`, `rls`, `parent-child isolation`, `supabase/migrations/<file>.sql`). Sin argumento audita toda la BD.
- **Qué hace:** revisa cobertura y políticas de RLS, prueba aislamiento negativo entre padres/niños y daycares con identidades JWT reales, revisa funciones `SECURITY DEFINER`, grants, Realtime y Storage, y consulta los advisors de Supabase. Trabaja en modo en vivo (MCP de Supabase), en modo estático (`specs/database/` y `supabase/migrations/`) o en ambos, y señala divergencias entre lo declarado y lo aplicado.
- **Seguridad:** solo lectura; no edita archivos, no ejecuta DDL/DML ni `apply_migration`, no imprime secretos; entrega hallazgos con propuestas de SQL para que el usuario las aplique con `db-migrator`.

### DB migrator

- **Cómo invocarlo:** seleccionar `db-migrator` con **Tab** y pasar un spec de `specs/database/` (`NN`, `NN-slug`, slug o nombre de archivo). Solo procesa specs `Approved`/`Implemented`; sin argumento lista los disponibles y pregunta.
- **Qué hace:** construye una matriz `migración del spec | archivo local | historial local | historial remoto | situación`, crea con `supabase migration new` solo las migraciones faltantes, carga las skills `supabase` y `supabase-postgres-best-practices`, aplica y verifica en local (`supabase migration up` o `db reset`, SQL de solo lectura y advisors), muestra `supabase db push --dry-run --remote` y aplica en remoto **con confirmación explícita**, verificando después con MCP (`list_migrations`, `execute_sql`, `get_advisors`). Usa migraciones imperativas en `supabase/migrations/`, nunca `supabase/schemas/`.
- **Seguridad:** no modifica specs (checklist, estado ni `## Verification`), código de app ni migraciones ya aplicadas; nunca usa `apply_migration` para DDL, nunca aplica en remoto sin confirmación, no lee valores de `.env` y no commitea. Si detecta `drift`, se detiene y reporta.

### Accessibility checker

- **Cómo invocarlo:** seleccionar `accessibility-checker` con **Tab** y pasar una ruta de archivo concreta, o usar `/a11y <ruta>` (`.opencode/commands/a11y.md`, que delega en el agente como subagente). Sin ruta, pregunta y se detiene.
- **Qué hace:** audita **un archivo** contra WCAG 2.2 AA con revisión estática (semántica, formularios, ARIA, foco, teclado, contraste, títulos), `npx eslint <ruta>` (solo hallazgos `jsx-a11y`) y verificación en navegador con Playwright MCP cuando la ruta es renderizable. Consulta el quickref de W3C y la guía local `node_modules/next/dist/docs/03-architecture/accessibility.md`. Reporta en el chat una tabla con severidad, criterio, `archivo:línea`, evidencia y propuesta, además del resumen `Pass`/`Fail`/`No aplicable`.
- **Seguridad:** solo lectura; no corrige ni crea archivos, no instala `axe-core` ni dependencias, no cambia reglas de ESLint, no reporta criterios AAA como fallos AA y no deja browsers ni servidores encendidos.

### React best practices

- **Cómo invocarlo:** seleccionar `react-best-practices` con **Tab** y pasar una lista explícita de rutas, por ejemplo: `Usa el subagent react-best-practices en app/_components/PostCard.tsx y app/page.tsx`. Corre con contexto fresco: el agente padre debe incluir las rutas y las decisiones relevantes. Sin rutas o con un alcance ambiguo, pide precisiones y se detiene.
- **Qué hace:** audita solo esos archivos contra las buenas prácticas vigentes de React 19 y Next.js 16, consultando Context7 y la documentación instalada en `node_modules/next/dist/docs/` (manda la versión instalada si contradice la genérica). Clasifica hallazgos como `Bloqueante` / `Debería` / `Nit`, aplica diffs mínimos sin cambiar comportamiento, diseño ni etiquetas, y verifica con `npx eslint <archivos>`, `npx tsc --noEmit` y `npm run build` cuando corresponda. Devuelve un resumen `Archivo | Cambio | Fuente | Verificación`.
- **Seguridad:** edita solo la lista indicada y cada edición pide confirmación; no implementa features nuevas, no agrega dependencias ni `disable` de lint, no toca `references/`, `.agents/`, `.opencode/` ni outputs de Playwright, no commitea y no deja procesos abiertos.

## MCPs

- Playwright Screenshots y cualquier cosa relacionada a Playwright tienen que estar en la carpeta `.playwright-mcp` (la grafía alternativa `.playwrights-mcp` también está ignorada en `.gitignore`)
- Context7 usaremos esta mcp para traer la documentacion actualizada del framework.
- Supabase MCP disponible en la sesión (`execute_sql`, `get_advisors`, branches, logs, etc.): usarla para inspeccionar el estado remoto y verificar cambios antes de asumir algo. Si no aparecen las herramientas, revisar autenticación OAuth / token con scope.
- Actual Playwright output is written to `.playwright-mcp/`; `.gitignore` ignores both `.playwright-mcp/*` and the legacy `.playwrights-mcp/*`, so new screenshots and logs stay out of `git status` — don't commit them.

## Skills y comandos (repo-local)

Instaladas en `.agents/skills/` y fijadas con hash en `skills-lock.json` (instalación con `npx skills add <repo>`):

| Skill | Origen | Cómo se invoca | Para qué |
| ----- | ------ | -------------- | -------- |
| `spec` | `klerith/fernando-skills` | `/spec <feature>` (comando en `opencode.json`) | Diseña specs en `specs/NN-slug.md`; si son de base de datos, en `specs/database/NN-slug.md` |
| `spec-impl` | `klerith/fernando-skills` | `/spec-impl <feature>` (comando en `opencode.json`) | Implementa solo specs `Approved` en rama `spec-NN-slug` |
| `supabase` | `supabase/agent-skills` | Cargar la skill (se dispara por su `description`; no tiene slash command) | Cualquier tarea de Supabase: Auth, DB, Storage, Realtime, Edge Functions, CLI, MCP, logs, RLS |
| `supabase-postgres-best-practices` | `supabase/agent-skills` | Cargar la skill (se dispara por su `description`; no tiene slash command) | Antes de escribir/cambiar SQL, esquemas, migraciones, RLS, índices, triggers o funciones |
| `a11y` | repo-local (`.opencode/commands/a11y.md`) | `/a11y <ruta>` | Comando slash que delega en el subagente `accessibility-checker` para auditar un archivo contra WCAG 2.2 AA |

- Las skills de Supabase se activan por descripción: cargarlas antes de tocar la base de datos o de diagnosticar errores de Supabase/Postgres.
- Si una skill da información incorrecta o le falta algo, leer `references/skill-feedback.md` dentro de esa skill.
- Los agentes `spec-verifier`, `db-security-auditor`, `db-migrator`, `accessibility-checker` y `react-best-practices` no son skills slash: se invocan como subagentes con **Tab**; ver **Agentes del proyecto (subagentes)** para modelo, alcance, forma de invocación y reglas de edición de cada uno.

## Reglas de codigo

- Usar codigo limpio, nombres, variables, funciones, etc en ingles 