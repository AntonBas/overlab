# API reference

The statistics endpoints are public `GET` requests.

| Endpoint | Description |
|---|---|
| `/api/heroes`, `/api/heroes/{slug}` | Heroes |
| `/api/maps`, `/api/maps/{slug}` | Maps |
| `/api/stats` | Statistics table. Parameters: `queue`, `tier`, `map`, `platform`, `region`, `role`, `sort`, `direction`. For a map it also returns deltas against the all-maps numbers |
| `/api/stats/hero/{slug}` | Statistics of one hero across all maps |
| `/api/stats/hero/{slug}/history` | Snapshots of one hero over time. Parameters: `queue`, `tier`, `map`, `platform`, `region`, `from`, `to` (ISO date-time; default is the last 90 days, at most 366 days; an explicit range is rounded to whole UTC days, so `from` starts at 00:00 of its day and `to` ends at the end of its day) |
| `/api/stats/freshness` | When Blizzard's numbers last changed, found by comparing the latest snapshots of one queue, rank, platform and region (`valuesSince` is the first snapshot that already had the current numbers). Parameters: `queue`, `tier`, `platform`, `region` |
| `/api/stats/coverage` | Which platform, region and queue combinations have ranks and maps collected |
| `/api/stats/history-start` | When statistics collection started for one queue, rank, platform and region (`firstCapturedAt`, empty when nothing is stored); the changes page uses it to hide patches that cannot be compared. Parameters: `queue`, `tier`, `platform`, `region` |
| `/api/stats/compare` | Changes between two snapshots, biggest win rate gain first. Use `from` and `to` (the last snapshot at or before each moment) or `patch={slug}` (last snapshot before the release against one a week later) |

Quick Play has no ranks (`tier` is ignored) and no ban rate. Errors use one JSON shape (`ApiError`).

Curated content, also public `GET` requests:

| Endpoint | Description |
|---|---|
| `/api/perks` | Perks of all heroes |
| `/api/heroes/{slug}/perks` | Perks with a recommendation (`RECOMMENDED`, `OPTIONAL`, `AVOID`) |
| `/api/abilities` | Abilities of all heroes |
| `/api/heroes/{slug}/abilities` | Abilities of a hero with description and icon |
| `/api/hero-categories` | Hero categories (for example beam or dive) with their members, and curated hero-versus-category matchups (strong against, struggles against or works well with a category); shown as chips on `/counters`, where heroes covered by a chip are not repeated as separate avatars |
| `/api/hero-relations` | Counters, counters against and synergies of all heroes in one response |
| `/api/heroes/{slug}/counters` | Heroes this hero counters and heroes that counter it |
| `/api/heroes/{slug}/synergies` | Heroes that work well together (both directions) |
| `/api/guides?hero=&map=`, `/api/guides/{id}-{slug}` | Published spots and setups (YouTube embeds; `kind`, `side`, `abilitySlug`, `startSeconds`, `endSeconds`) |
| `/api/patches`, `/api/patches/{slug}`, `/api/patches/at?date=` | Patches and the patch active at a date. `season` is read from a "Season N" in the title and carried over to the later patches until the next season is announced (empty before the first one); to correct it, edit the title of the patch that opens the season |
| `/api/sitemap.xml` | Sitemap of the public pages (static pages, active heroes, maps, published guides); served as `/sitemap.xml` by the edge proxy, which also answers `/robots.txt` with the sitemap link |
| `/api/seo/preview?path=` | Static HTML for crawlers that do not run JavaScript: the page title, description, canonical, Open Graph, Twitter card, `schema.org` data, a heading and the real content (for a hero its strengths, abilities, perks, counters and synergies, for lists the linked heroes or maps). The edge proxy sends link-preview crawlers (Telegram, Discord, Slack, Facebook, X, WhatsApp, LinkedIn) and search crawlers without JS (Bingbot, DuckDuckBot, YandexBot, Baiduspider, Applebot) to it for public pages; people, Googlebot and BingPreview get the normal app, which sets the same metadata itself (for `/heroes/<slug>`, `/maps/<slug>`, `/maps/<slug>/<hero>` and `/guides/<id>` the edge first asks `/api/seo/exists` and answers HTTP 404 with the app shell when the page is unknown) |
| `/api/seo/exists?path=` | `204` when the page path exists, `404` otherwise (no body, never cached). Used only by the edge proxy to give unknown hero, map and guide addresses a real 404 |

Counters, synergies and perks are curated recommendations, not statistics. They are managed through the admin API (`ADMIN` role): `/api/admin/perks`, `/api/admin/hero-relations`, `/api/admin/hero-categories`, `/api/admin/hero-category-relations`, `/api/admin/guides`, `/api/admin/patches`, `PUT /api/admin/heroes/{slug}` and `PUT /api/admin/maps/{slug}` (image upload: `PUT /api/admin/maps/{slug}/image`, `PUT /api/admin/perks/{id}/icon`). Any admin change clears the content caches.

## Limits and caching

Public `GET /api/**` requests, the token refresh and the public write endpoints are limited per client IP in Redis over a sliding one-minute window (the count of the previous minute, weighted by how much of it still overlaps, is added to the current one, so a burst split across a minute boundary is not allowed twice): 600 per minute in general and 1200 per minute for `/api/stats/**` (a hero page makes about nine API calls, and a search engine crawler renders many pages from a few addresses, so lower limits would give it empty pages) (`app.rate-limit.api-per-minute`, `app.rate-limit.stats-per-minute`); the limit is exceeded with `429` in the `ApiError` format and a `Retry-After` header. Counters are atomic Lua scripts in Redis (the expiry is always set); if Redis is unavailable, a per-instance in-memory counter takes over so limits are never silently off. Sign-in and registration endpoints keep their own stricter limit, and so does the start of Google sign-in (`GET /oauth2/authorization/google`, 10 per minute per address, because each start creates a server session). Checking the current password (change password, change email, delete account) shares the failed-attempt counters of sign-in (a correct password there does not reset them), and notice emails to an already registered address are sent at most once a minute per address. A signed-in user may have at most 20 unprocessed feedback or business messages. Public responses carry `Cache-Control: public, max-age=60, stale-while-revalidate=300` and an `ETag`; errors, `/api/auth/**` and `/api/admin/**` are never cached. In `prod` the client IP is read from `X-Forwarded-For` set by Caddy.

Statistics history for an unknown map is a 404. History is cached per hero, filter and rounded day range (default range or explicit `from`/`to`; the cache has a one hour TTL and the whole Redis instance is limited to 128 MB), and comparisons are cached per pair of resolved snapshots rather than per requested bounds, so clients cannot fill the cache with arbitrary keys.

All caches (`content`, `heroes`, `maps`, `stats`) are cleared on every backend start, so a release that changes cached response shapes never reads stale entries. If Redis is unavailable, cache reads and writes are skipped and the request is answered from the database. Guide and SEO preview entries are keyed by guide id, and empty guide lists are not cached, so clients cannot fill the cache by varying the URL.

## OpenAPI

Swagger UI is at `/swagger-ui.html` and the OpenAPI document at `/v3/api-docs`; both require an administrator session (sign in through the site first). They are disabled in the `prod` profile. Controllers carry `@Tag` and `@Operation`, and the statistics DTOs carry `@Schema` descriptions (units, meaning of deltas); keep them in sync when changing those endpoints.

## Authentication

Email and password registration plus Google sign-in. Tokens are stored in `httpOnly` cookies (access token 5 minutes, refresh token 14 days, rotated on every refresh).

| Endpoint | Description |
|---|---|
| `POST /api/auth/register` | Create an account and send a verification email |
| `POST /api/auth/verify-email`, `/resend-verification` | Confirm the email address |
| `POST /api/auth/login`, `/refresh`, `/logout` | Sign in, rotate tokens, sign out |
| `GET /api/auth/me` | Current user |
| `POST /api/auth/forgot-password`, `/reset-password` | Password reset by email |
| `GET /oauth2/authorization/google` | Start Google sign-in (needs `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`) |
| `PUT /api/me/profile` | Change the display name |
| `POST /api/me/password` | Change the password (local accounts; needs the current password) |
| `POST /api/me/email` | Request an email change; the address changes after the confirmation link sent to the new one is opened (`/verify-email`) |
| `GET /api/me/export` | Download the account data (profile, favorites, votes on counters and synergies, feedback messages, default filters) as JSON |
| `DELETE /api/me` | Delete the account (accounts with a password confirm with it, accounts without a password first call `POST /api/me/delete-request`, which emails a one-time link (`/confirm-deletion?token=...`, valid for the password reset token lifetime, one hour), and send its token as `deletionToken`); audit entries about the user are anonymized, the last administrator cannot be deleted |
| `GET /api/me/favorites`, `PUT`/`DELETE /api/me/favorites/heroes/{slug}`, `/maps/{slug}` | Favorite heroes and maps (200 of each at most) |
| `GET`/`PUT`/`DELETE /api/me/relation-votes` | Agree or disagree with a counter or synergy (`heroSlug`, `relatedHeroSlug`, `type`, `value` `UP`/`DOWN`; the pair works in either direction, one vote per user, 1000 at most) |
| `POST /api/business` | Send a sponsorship or partnership message (`name`, `email`, `message` of 10 to 2000 characters); login is optional, rate limited per IP, 5 unreviewed messages per sender email at most. The message is stored as feedback of type `BUSINESS` and emailed to `CONTACT_EMAIL` with the sender as reply-to |
| `POST /api/feedback` | Send a message about an inaccuracy, bug or typo (`type` `INACCURACY`/`BUG`/`TYPO`/`OTHER`, 10 to 2000 characters, optional site `pagePath`); login is optional, rate limited per IP, a signed in user can have 20 unreviewed messages at most, anonymous visitors share 200 unreviewed messages in total and may send 5 per address per hour (`429` beyond that) |
| `GET`/`PUT /api/me/preferences` | Default mode, rank, platform and region for the statistics filters |
| `DELETE /api/admin/maps/{slug}/image`, `DELETE /api/admin/perks/{id}/icon` | Admin: remove the uploaded image of a map or the icon of a perk |
| `GET /api/admin/feedback?status=NEW`, `PUT /api/admin/feedback/{id}/status`, `GET /api/admin/relation-votes/summary` | Admin: review messages (`NEW`, `RESOLVED`, `DISMISSED`) and see votes per recommendation. Votes are never shown publicly and never change the curated data on their own |
| `GET /api/admin/heroes`, `GET /api/admin/abilities?hero=`, `PUT /api/admin/abilities/{id}/control` | Admin: all heroes including inactive ones, and the controller slot of each ability |
| `GET /api/admin/collector/jobs`, `GET /api/admin/collector/runs`, `POST /api/admin/collector/jobs/{name}/run`, `POST /api/admin/collector/perks/import`, `POST /api/admin/collector/patches/import` | Admin: collector jobs and run history, start a job now, import perks and abilities in the background, import new balance patches from Blizzard (both imports run in the background on the collector queue, with the collector pause, and answer `202`) |
| `GET /api/admin/users`, `PUT /api/admin/users/{id}/enabled`, `PUT /api/admin/users/{id}/role` | Admin: search users, block or unblock (blocked users are signed out and cannot sign in), change role between `USER` and `ADMIN` (removing admin signs the user out; an admin cannot block or change their own account) |

Signing in with Google using an email that already has a password account links the two, so both ways work. If that account's email was not verified yet, its password is removed (use "Forgot your password?" to set a new one).

Password reset for a Google-only account sends an email that explains it signs in with Google instead of staying silent.

Authentication endpoints are rate limited per IP (Redis). Sign-in is also limited per account: 10 failed attempts within 15 minutes from one IP address lock that email address for that address for the rest of the window (`429`), and 50 failures from any addresses lock it for everyone; a successful sign-in resets the per-address counter, so a stranger cannot lock the owner out from another address. Passwords must be 8 characters to 72 bytes (the BCrypt limit). Presenting an already used refresh token again (after a 30 second grace period for parallel requests) signs the user out everywhere; inside the grace period the second parallel refresh answers `401` without clearing the cookies, so the new session set by the first one survives. `/api/admin/**` requires the `ADMIN` role, and every admin request re-checks in the database that the account is still enabled and still an administrator, so blocking or demoting takes effect immediately instead of when the 5 minute access token expires; a blocked user is also rejected on every state-changing request, not only on `/api/me/**`. Emails for password reset, verification resend and registration notices are limited to one per minute per address and email, and 10 per hour per email, so a stranger cannot silence the owner's reset email from another address. Registering with an address that is already taken answers `202` like a new registration and emails the owner a notice instead, so the response never reveals whether an address has an account (the same applies to an email change to a taken address). To create the first admin, start the backend once with `ADMIN_EMAIL` and `ADMIN_PASSWORD` set. Locally, emails go to Mailpit unless `.env` sets `MAIL_HOST` (and `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_SMTP_AUTH=true`, `MAIL_STARTTLS=true`, `EMAIL_FROM`), for example with Brevo: `MAIL_HOST=smtp-relay.brevo.com`, `MAIL_PORT=587`, the SMTP login and key from Brevo, and `EMAIL_FROM` set to a sender verified in Brevo; in `prod` set `JWT_SECRET` (at least 32 characters) and the `MAIL_*` variables. Emails are sent in the background as plain text plus HTML, only after the surrounding database transaction commits, sent in up to 3 attempts (two retries) with growing pauses (`app.mail.retry-delay`, default 2s; a full mail queue drops the message and counts it in the `mail.dropped` metric) and never block the request, so a missing mail server does not break registration or password reset (a message that fails all three attempts is logged and counted in the `mail.failed` metric, which has a Grafana alert). `CONTACT_EMAIL` is the address that receives Business page messages; while it is empty the messages are only stored and shown in the admin panel.

## Audit log

Every admin change (perks, counters, synergies, guides, patches, hero and map edits) and user events (registration, sign-in, password change) are written to `audit_log` asynchronously, after the transaction commits, so a failed write never breaks the request. Updates store only the changed fields as `{from, to}`. Secrets and request bodies are never stored. Admins read it with `GET /api/admin/audit` (filters: `entityType`, `actorId`, `action`, `from`, `to`, `page`, `size`). User events are deleted after `app.audit.user-event-retention` (default 90 days); the IP address of every audit entry is cleared after the same period, and finished `collector_runs` are deleted after 90 days. Resolved and dismissed feedback messages, with the contact details in them, are deleted after `app.feedback.retention` (default 180 days).

