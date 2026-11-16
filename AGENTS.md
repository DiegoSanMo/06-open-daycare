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

`app/` is still the stock create-next-app page, so building a screen means translating a prototype into `app/` components — do not import `references/` files or `support.js`, and do not copy their inline styles verbatim (the app uses Tailwind). The prototypes all load Fredoka + Nunito; the starter layout loads Geist instead.

## Commands

- `npm run dev` — dev server (Turbopack is the default in Next 16; no `--turbopack` flag).
- `npm run lint` — bare `eslint` over the whole repo, including the generated `references/pantallas/support.js` (its header says "do not edit"), which has 2 pre-existing errors (`react/no-deprecated`, `no-assign-module-variable`). Lint only what you changed (`npx eslint app`). `next lint` was removed in Next 16.
- `npx tsc --noEmit` — typecheck. Depends on generated types in `.next/types`; if `LayoutProps`/`PageProps` are unresolved, run `npx next typegen` or start the dev server.
- `npm run build` — production build.
- No test suite, formatter, or CI workflows exist yet.

## Next.js 16 gotchas in this repo

- `next.config.ts` enables `cacheComponents` + `partialPrefetching`. Uncached async data and `cookies()`/`headers()` reads must sit inside `<Suspense>`; use `'use cache'` + `cacheLife()` to cache. `export const runtime` is not allowed (Node only). See `node_modules/next/dist/docs/01-app/01-getting-started/08-caching.md`.
- `params`, `searchParams`, `cookies()`, `headers()` are async-only. Route props come from generated globals (`PageProps<'/route'>`, `LayoutProps<'/'>`) — `app/layout.tsx` already does this.
- `middleware.ts` is `proxy.ts` in v16 (Node runtime only).
- CSS is wired through `turbopack.rules` with `@tailwindcss/turbopack`, not PostCSS. Keep the single `@import "tailwindcss";` entry in `app/globals.css`.
- The two `BEGIN:nextjs-*` blocks above are rewritten by `next dev`; put project notes outside them.
- `@/*` maps to the repo root (`@/app/...`), not `src/`. There is no `src/`.

## Spec workflow

This repo ships repo-local skills (`.agents/skills/`, pinned in `skills-lock.json`): `/spec` designs a spec at `specs/NN-slug.md`, `/spec-impl` implements only specs marked `Approved` on branch `spec-NN-slug`. `specs/.spec-config.yml` controls branch creation and per-step commits. Check the spec state before implementing.

## Spec verifier

- **Agent:** `spec-verifier` (`.opencode/agents/spec-verifier.md`), project-level primary agent on `opencode/nemotron-3.5-super-vl-free`.
- **How to invoke:** select the `spec-verifier` agent with **Tab** and pass the spec to verify (`01-home-feed`, `01`, `home-feed`, or the full file name).
- **What it does:** validates the spec is Approved/Implemented, builds a verification matrix, checks Next.js conventions with Context7, runs static checks (`npx eslint app`, `npx tsc --noEmit`, `npm run build`), performs visual checks with Playwright MCP when applicable, fixes real deviations, ticks acceptance criteria with evidence, and appends/replaces a `## Verification` section.
- **Safety:** it never edits criteria/scope/decisions, never commits/pushes/switches branches, never changes `Status` without asking, and does not leave dev servers or browsers running.

## MCPs

- Playwright Screenshots y cualquier cosa relacionada a Playwright tienen que estar en la carpeta .playwrights-mcp
- Context7 usaremos esta mcp para traer la documentacion actualizada del framework.
- Actual Playwright output is tracked in `.playwright-mcp/`, while `.gitignore` only lists `.playwrights-mcp/*` (extra `s`), so new screenshots and logs show up in `git status` — don't commit them.

## Spec Driven Development - Skills / Commands
- `/spec` — skill para crear las especificaciones.
- `/spec-impl` — skill para implementar specs aprobadas.
- **Spec verifier** — no es una skill slash; se invoca seleccionando el agente `spec-verifier` con **Tab** y pasando el spec (ej. `01-home-feed`, `01` o el slug). Verifica criterios de aceptación, corrige desviaciones reales y documenta evidencia en `## Verification`.

## Reglas de codigo

- Usar codigo limpio, nombres, variables, funciones, etc en ingles 