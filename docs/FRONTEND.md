# Frontend guide

React 19 and TypeScript with Vite. Plain CSS (dark theme only), `react-router-dom`, `axios`. Code lives in `src/features/<domain>/` (`stats`, `heroes`, `abilities`, `perks`, `relations`, `maps`, `guides`, `history`, `auth`, ...). A feature exposes its public API only through `index.ts`; importing another feature's internals is an oxlint error (`no-restricted-imports`). Admin screens of a domain live next to it in `features/<domain>/admin/` with their own `api/` and `types.ts`; an `index.ts` exists only where other admin screens import from it (`heroes`, `maps`, `relations`); `features/admin/` holds only the admin shell (layout, home, audit, collector, users), and the shared admin kit (tables, drawer, fields, `useSave`) is in `src/components/admin/`. Styles are split per domain: design tokens (colors, radius, font, `--space-*` spacing scale, `--font-size-*`, `--font-weight-*`) are CSS variables in `src/tokens.css`, the only place to add or change them; base styles and classes used by several domains are in `src/index.css`, the rest in `src/features/<domain>/<domain>.css` and `src/components/<group>/<group>.css`. `src/styles.css` imports them all in a fixed order (`tokens.css`, then `index.css`), because the cascade depends on that order; add a new CSS file there instead of importing it from a component. Class names follow BEM (`block__element--modifier`, for example `matchup__cell--counters`). Keep a modifier rule (`.card--active`) in the same file as its base rule (`.card`) and after it, otherwise a later file can override it.

## Conventions

- A feature exposes its public API through `src/features/<domain>/index.ts`. Code outside the feature imports from that file (`from "../stats"`), never from its inner folders. The only exception is lazy route pages in `src/routes/AppRoutes.tsx`, which are imported by their full path so Vite can split them into separate chunks.
- A helper used by one domain stays in `src/features/<domain>/utils/`; once a second domain needs it, move it to `src/utils/`. Hooks, components and types follow the same rule (`src/hooks`, `src/components`, `src/types`).
- Context providers belong to the domain they serve (`features/auth/context`, `features/stats/context`, ...). `src/providers/AppProviders.tsx` is the one place that stacks them, so the order is visible in a single file.
- API types are split by domain in `src/types/` (`hero.ts`, `stats.ts`, `map.ts`, `guide.ts`, `patch.ts`, `user.ts`, `common.ts`). Test data factories live in `src/test/fixtures/<domain>.ts` (typed factories such as `hero()` and `patch()`; do not cast fixtures with `as never`).
- Floating hints use one component, `components/ui/Tooltip.tsx` (portal, hover, focus, Escape, positioning from `useFloatingTip`): `role="tooltip"` for a passive hint, `role="dialog"` with `interactive` for a hint that holds links or buttons, `mount="open"` to render the hint only while it is open. Do not build a second tooltip with `useFloatingTip` directly.
- Searches and filters of list pages live in the address so a view can be shared and survives going back: `useUrlParam` and `useUrlFlag` (`src/hooks/useUrlParam.ts`) for `/maps` (`q`, `mode`, `favorites`), the hero search `q` on `/stats`, `/changes` and `/maps/:slug` (`useFilterState` keeps it through `SEARCH_PARAMS`), and `useHeroListView` for `/counters` and `/perks`.
- `Layout` remembers the scroll position of every history entry while the visitor scrolls and `utils/restoreScroll.ts` returns to it on back navigation, retrying for about a second until a still loading page is tall enough.
- Admin forms use `components/admin/useAdminForm.ts` (values, `change`, dirty tracking and the save state); hero lists with search, role and favorites filters use `features/heroes/components/HeroFilterBar.tsx`.
- Styles come only from CSS files: the Content-Security-Policy has no `unsafe-inline` for styles, so never add `<style>` tags or `style="..."` markup strings; React `style` props are fine.

## Pages

| Address | Page |
|---|---|
| `/stats?queue=&tier=&map=&platform=&region=&role=&sort=&direction=&q=` | Hero statistics; filters live in the address, so every view can be shared |
| `/heroes`, `/heroes/:slug` | Heroes; a hero page has map statistics, perks, counters, synergies (with category chips above the hero cards) and guides |
| `/maps`, `/maps/:slug` | Maps; hero statistics with differences from the all-maps values |
| `/perks` | Perks of all heroes on one page, grouped by role, left and right as in the game |
| `/counters?role=&q=&favorites=1` | Counters and synergies of all heroes on one page, with role, name and favorites filters kept in the address. Rows appear in steps of 12 (`RevealMore`: a `ScrollSentinel` reveals the next step while the visitor scrolls, the "Show more" button stays as a fallback), and the number of revealed rows is kept in the history entry (`useHeroListView`), so going back restores the view. `/perks` works the same way |
| `/heroes/:slug/perks`, `/heroes/:slug/counters`, `/heroes/:slug/maps` | Old addresses: the edge proxy answers `301` to the matching section of the hero page (`/heroes/:slug#perks`, `#counters`, `#maps`); the hero page carries every section, so it is the single page search engines index for a hero |
| `/heroes/:slug?queue=` | A hero: rates and history, best and weakest maps (expandable to every map, each links to its map page), abilities, perks, counters, spots; `/maps/:map/:hero` redirects here |
| `/patches` | Redirects to `/changes`; patches are shown as dashed lines on the statistics chart and as views in `/changes` |
| `/changes?view=7d\|30d\|patch:<slug>&queue=` | Which heroes gained or lost win and pick rate between two snapshots |
| `/guides/:id-:slug` | A single spot or setup video (YouTube embed) |
| `/login`, `/register`, `/verify-email`, `/forgot-password`, `/reset-password` | Accounts |
| `/me` | Favorites and default filters |
| `/me/settings` | Change name, password and email, download or delete your data |
| `/feedback?from=<path>` | Form for reporting an inaccuracy, bug or typo (no login needed; opened from the footer link on every page) |
| `/business` | Sponsorship, advertising and partnership page with a contact form (no login needed; linked from the footer) |
| `/privacy`, `/terms`, `/cookies` | Legal pages linked from the footer; `/cookies` also holds the consent choices |

A cookie banner asks for consent on the first visit. Optional analytics (Umami; the `/admin` pages are never sent), error reports (Sentry, loaded lazily by `ErrorReportingLoader` only while the analytics choice is on) and advertising stay off until allowed; the choice is stored in local storage (`overlab-cookie-consent`) and read with `useConsent`. The data controller line on the privacy page comes from the `VITE_CONTROLLER_NAME` and `VITE_CONTROLLER_ADDRESS` build variables (filled from `CONTROLLER_NAME` and `CONTROLLER_ADDRESS`). The contact line on legal pages and the Business page comes from the `VITE_CONTACT_EMAIL` build variable (in the production compose file it is filled from `CONTACT_EMAIL`); without it they point to the Business page form.

The header has a single "Sign in" button; the sign-in and registration pages link to each other.

The header has a hero search (keyboard friendly) and a compact menu on narrow screens. Auth and admin pages are loaded lazily. `npm run size` (run in CI after `npm run build`) fails when the entry chunk exceeds 125 KB gzip or any other chunk exceeds 30 KB. Component accessibility is checked with `vitest-axe`.

Titles and descriptions of the static pages (statistics, heroes, counters, perks, maps, changes, privacy, terms, cookies, business) live in one file, `backend/src/main/resources/seo/static-pages.json`. The backend reads it for the crawler preview and the sitemap, the frontend imports it through `src/utils/staticSeoPages.ts`, and the edge image build copies it in, so change the texts only there.
