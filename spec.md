# Feature Specs — Admin UX, Filters, Homepage Random Seed

Status: **draft for review** — not started. Written after auditing current FE (`airu-porto-fe`) and BE (`airu-portfolio-be`) code, including `prisma/schema.prisma`, `photo.controller.ts`, `photo.validator.ts`, and `package.json` (confirms no cache layer exists yet — see §3).

---

## 1. Admin: Modal-based Photo Management ✅ Done

**Goal:** No more full-page navigation for add/edit photo in admin. Everything happens as a popup over the current list/grid.

### Current state
- `components/admin/PhotoEditModal.tsx` — already exists (WIP, untracked), fully functional edit modal (form, EXIF, collections checkboxes, delete).
- `app/admin/collections/[slug]/page.tsx` — **already wired** to `PhotoEditModal` via `editingPhotoId` state + `CollectionPhotoTile`'s `onEdit` callback. This page also already has an "Add Photos" modal (inline, not extracted to a component) for attaching existing photos to a collection. Nothing left to do here.
- `app/admin/photos/page.tsx` (the main Photos list) — `PhotoGrid` / `PhotoListItem` still use `<Link href="/admin/photos/${id}">`, navigating to the standalone `app/admin/photos/[id]/page.tsx`. This standalone page is ~100% duplicate logic of `PhotoEditModal`.
- `app/admin/photos/upload/page.tsx` — standalone full-page upload form (file picker, drag/drop, EXIF autofill via `exifr`, big form). No modal equivalent exists yet.

### Target
- `app/admin/photos/[id]/page.tsx` and `app/admin/photos/upload/page.tsx` **deleted**. All photo create/edit happens in-place via modal, on both `/admin/photos` and `/admin/collections/[slug]`.
- New `components/admin/PhotoAddModal.tsx`: same responsibilities as today's upload page (file select/drag-drop, EXIF-autofill preview, form fields, collections checkboxes), opened from the "+ Upload" button.
- `app/admin/photos/page.tsx` gets `editingPhotoId` / `showAddModal` state, same pattern as the collection detail page. `PhotoGrid` and `PhotoListItem` change their click target from `<Link>` to an `onClick` that sets `editingPhotoId` (keep them as buttons/divs, drop the route).
- Consider extracting the modal shell (backdrop, sticky header/footer, close-on-backdrop-click) into a shared `components/admin/Modal.tsx` since `PhotoEditModal`, the inline "Add Photos" modal in collection detail, and the new `PhotoAddModal` all reimplement the same wrapper markup right now — worth a lightweight shared component instead of a third copy-paste.
- No deep-linking (`?photo=<id>` in URL) for MVP — closing/reopening modal state is local only. Flag as a possible follow-up if you ever want to share a direct edit link.

### Migration steps
1. Extract shared modal shell component (optional but recommended given 3rd copy-paste is imminent).
2. Build `PhotoAddModal` (port logic from `app/admin/photos/upload/page.tsx`).
3. Wire `app/admin/photos/page.tsx`: add state, swap `PhotoGrid`/`PhotoListItem` links for onClick, mount `PhotoEditModal` + `PhotoAddModal` conditionally.
4. Delete `app/admin/photos/[id]/page.tsx` and `app/admin/photos/upload/page.tsx`.
5. Sanity check `app/admin/collections/[slug]/page.tsx` still works untouched (it already does the modal pattern — no changes needed there beyond maybe reusing the shared modal shell).

---

## 2. Admin Photos List: Filters ✅ Done (backend deploy pending — see note)

**Goal:** `/admin/photos` gets a real filter bar: search, collection, visibility, sort.

### Current state
- Search input exists in JSX but is commented out ("Hidden until implemented"). Even if uncommented, it's a no-op: `buildPhotoQueryParams()` in `lib/api.ts` never reads `filters.search` — it's silently dropped.
- Backend (`airu-portfolio-be`, `src/controllers/photo.controller.ts` + `photo.validator.ts`) has **zero search support** — no `contains`/`OR` clause in the Prisma query, no `search` field in the zod schema.
- Only filter currently wired: Featured / Not Featured dropdown (`filters.featured`).
- Collection filter: backend already accepts `collectionSlug`, unused in admin list UI.
- Visibility filter: `scope=admin` already returns all visibilities; there's just no client-side or param-based visibility filter yet.
- Sort: hardcoded `orderBy: { createdAt: "desc" }` on the backend, no param.

### Target filter bar
- **Search** (title, location, tags) — needs backend work (see below).
- **Collection** dropdown — populated from `getCollections()`, shows collection titles, sends `collectionSlug`. Frontend-only.
- **Visibility** dropdown (All / Public / Collection Only / Private) — frontend-only if filtering client-side over the already-fetched admin-scope list; or add a `visibility` query param backend-side if you'd rather filter server-side (recommended once search also needs server round-trips, to keep one code path — see decision below).
- **Sort** (Newest / Oldest / Title A–Z) — needs a `sort` param backend-side (`orderBy` currently hardcoded).

### Backend changes needed (`airu-portfolio-be`)
Confirmed against `prisma/schema.prisma`: `Photo.tags` is `PhotoTags[]` with a plain `tag: String` column (`@@id([photoId, tag])`, not a separate `Tag` model) — so a tag search is `tags: { some: { tag: { contains, mode: "insensitive" } } }`. `getPhotoSchema` today (`photo.validator.ts:55-66`) only has `page`, `limit`, `featured`, `tag`, `collectionId`, `collectionSlug`, `scope`.

1. `getPhotoSchema`: add `search: z.string().optional()`, `sort: z.enum(["newest","oldest","title"]).optional()`, plus `visibility: z.enum(["PUBLIC","COLLECTION_ONLY","PRIVATE"]).optional()` if going server-side (see decision below).
2. `photo.controller.ts` `getPhotos` handler (around line 32-71, same place the existing `tag`/`collectionId`/`collectionSlug` filters are built): add to `where`
   ```ts
   if (search) {
     where.OR = [
       { title: { contains: search, mode: "insensitive" } },
       { location: { contains: search, mode: "insensitive" } },
       { tags: { some: { tag: { contains: search, mode: "insensitive" } } } },
     ];
   }
   ```
3. Swap hardcoded `orderBy: { createdAt: "desc" }` (line 78) for a small switch based on `sort`: `newest` → `{ createdAt: "desc" }`, `oldest` → `{ createdAt: "asc" }`, `title` → `{ title: "asc" }`.
4. If visibility goes server-side: add `where.visibility = visibility` when present (only meaningful for `scope=admin`, since `public`/`collection` scopes already constrain visibility themselves).

### Frontend changes needed (`airu-porto-fe`)
1. `types/index.ts` `PhotoFilters`: add `sort?: 'newest' | 'oldest' | 'title'` (search already exists on the type, just wire it).
2. `lib/api.ts` `buildPhotoQueryParams`: actually append `search` and `sort` params.
3. `app/admin/photos/page.tsx`: uncomment/rebuild the filter bar, add collection + sort dropdowns, debounce the search input (300ms) instead of only searching on Enter/blur, since it's now a live server filter.

### Open decision
Filter client-side (over the full admin-scope fetch, `limit=100` today) vs. server-side (send filters as query params, backend does the `where`/`orderBy`). Given search needs a backend round-trip anyway, and collection count will keep growing, **recommend fully server-side** for all four filters — one consistent code path, and it stops silently breaking once photo count exceeds the `limit=100` default.

**Resolved: went server-side**, as recommended.

### Implementation note
Backend commit `ab7deb5` (`airu-portfolio-be`) and frontend commit `13cd130` (`airu-porto-fe`) are both pushed to `main`. **The backend change needs an actual deploy to take effect** — local dev talks to the backend through an SSH tunnel on `:8201` (per infra notes, this is not a locally-running instance of the edited code), and nothing in this repo auto-deploys on `git push` (no CI workflow, Dokploy is presumably pull/webhook-driven separately). Search/sort/visibility filters will silently no-op (zod will just ignore unknown params, existing behavior) until that backend is redeployed.

---

## 3. Homepage: Daily Random Seed with Collection Diversity ✅ Done (backend deploy pending)

**Goal:** Gallery order isn't stuck sorted by `createdAt desc` (which clumps by upload batch / theme). Instead: a randomized order that (a) changes once per day, (b) doesn't dump 10 photos from the same collection in a row on page 1.

### Current state
- `app/page.tsx` → `getGalleryPage(1)` → `lib/api.ts` `getPhotosPage()` → backend `GET /photos?scope=public&page=1&limit=...`.
- Backend: plain `skip`/`take` over `orderBy: { createdAt: "desc" }`. No randomness, no seeding.
- Infinite scroll (added recently, commit `381be13`) depends on stable ordering across pages — whatever we do must not skip or duplicate photos as the user scrolls into page 2, 3, ...

### Design
**This is primarily backend work.** Plain `ORDER BY random()` (or a per-request seeded hash) is not enough on its own — it produces randomness but doesn't *guarantee* collection diversity on page 1 (you could still get unlucky and cluster).

Confirmed from `schema.prisma`: there is **no "primary collection" concept** in the data model. `PhotoCollections` (the join table) has its own `sortOrder`, but that's scoped to ordering photos *within one collection's detail page* (used by the existing drag-reorder feature) — it says nothing about which collection is "primary" for a photo that belongs to several. So the diversity bucket needs an explicit, new rule; nothing in the DB implies one today.

Recommended approach — precomputed daily order:
1. Once per day (first request of the day, cached — no need for a real cron), backend computes a full ordering of all `PUBLIC` photo IDs:
   - Group photos by a diversity bucket. **Proposed rule** (needs your confirm/veto): bucket = the `collectionId` with the lowest `PhotoCollections.sortOrder` among that photo's memberships (i.e. whichever collection the photo was positioned first/earliest in); photos with zero collections go into their own `uncategorized` bucket rather than being scattered.
   - Shuffle bucket order and shuffle within each bucket, seeded by `date + a fixed salt` (e.g. `seed = hash(YYYY-MM-DD)`) so it's deterministic for the whole day but different from yesterday.
   - Round-robin interleave across buckets (bucket₁[0], bucket₂[0], bucket₃[0], bucket₁[1], bucket₂[1], ...) so early pages naturally sample across collections instead of exhausting one bucket before moving to the next.
2. Cache that ordered ID list in-memory (a module-level `Map`/array with a TTL until next local midnight). **Confirmed: no Redis or any cache layer exists in this backend today** (`package.json` has no redis/ioredis/cache dependency — it's Express + Prisma + multer + sharp + R2 storage, nothing else). In-memory is fine given production is a single Dokploy instance (per prior infra notes); just means the order resets (harmlessly, recomputes) on every redeploy, and would need revisiting if this backend is ever horizontally scaled.
3. Pagination (`skip`/`take`) becomes slicing that cached ID array, then a single `WHERE id IN (...)` fetch (Prisma doesn't preserve array order on `IN`, so re-sort the fetched rows to match the slice order in the controller before responding).
4. Photos uploaded mid-day: append to the end of the cached order (or just recompute next midnight — simplest is fine, this isn't a high-traffic ordering guarantee).

### Frontend impact
Minimal to none — `getGalleryPage`/`getPhotosPage` keep calling the same paginated endpoint the same way. No new params needed unless we want an explicit `?order=daily-random` toggle (not required — can just become the new default `scope=public` behavior).

### Open questions (need your call before backend work starts)
1. **Diversity bucket rule** — confirm or override the proposed "lowest `PhotoCollections.sortOrder`" rule above, and confirm the "uncategorized" bucket treatment for zero-collection photos.
2. Confirmed: **in-memory cache** (no Redis needed/available), **daily seed** (not per-visitor, not per-request) — same order for everyone, rotates at midnight.

### Implementation note
Built as proposed, without an explicit re-confirm on the bucket rule (flagging here instead — override if you want it different): `src/services/dailyOrder.service.ts` (`airu-portfolio-be`, commit `34fe138`) computes the order lazily on the first `GET /photos` request of the UTC day and caches it in-memory; `photo.controller.ts` uses it only for the "plain" public gallery query (`scope=public` with no `tag`/`collectionId`/`collectionSlug`/`search`/`featured`) — any of those filters falls back to the normal `orderBy`, since slicing the daily order and then filtering further would silently break pagination (fewer than `limit` results on some pages). No frontend changes needed — `getGalleryPage`/`getAllPhotos` already send exactly that plain query shape.

Same deploy caveat as feature 2: pushed to `main` but **not live** until the backend is redeployed (see note above §2).

Not implemented (deferred, wasn't in scope): mid-day photo uploads append to the *next* day's recompute, not the current day's cached order — a photo published at 2pm won't show in the gallery until the following day's rotation. Fine for this traffic level per the spec, but worth knowing if you publish something and wonder why it's not showing up yet.

**Added after initial build (commit `369097d`):** `GET /photos?scope=public` accepts `order=chronological` as an explicit escape hatch back to the pre-feature-3 behavior (`sort`/`createdAt desc`), no redeploy needed to roll back — just a different query param. Defaults to `order=daily-random`, so the homepage's behavior is unchanged; this is purely an operational off-switch. Not wired into the frontend (no UI toggle) since it wasn't asked for — only the API-level switch was requested.

**Verified live (2026-08-13), via direct `api.byairu.com/photos` calls:** rotation is genuinely active — served order doesn't match `createdAt`, and is stable across repeated requests (correctly cached for the day, not reshuffling per-request). Round-robin diversity works well for roughly the first 185 of 328 photos (page 1 alone spans 14 distinct collection buckets). Past that point, the tail is a single 143-photo unbroken run of one collection (`kamakura-trip`) — round-robin naturally exhausts the smaller buckets first (most collections are 1–39 photos) and falls through to whichever bucket is left, which happens to be `kamakura-trip` at 181 photos (55% of the whole public catalog). **Owner reviewed and confirmed this is fine as-is** — the collection is genuinely that much bigger than the others, so a long same-collection stretch deep in the scroll is an accurate reflection of the catalog, not treated as a bug to fix.

---

## 4. Per-Photo SEO + Visibility Leak Fix ✅ Done

**Goal:** Photo detail pages get real metadata (title, description, OG image) for link previews and search indexing. Bundled with a bug fix found while scoping this: the detail endpoint currently ignores visibility entirely.

### Current state
- `app/photo/[id]/page.tsx` has **no `generateMetadata` export at all** — no per-photo `<title>`, description, or Open Graph tags. Link shares (WhatsApp, Twitter, iMessage, etc.) fall back to whatever the root layout's generic metadata is.
- No `sitemap.ts` or `robots.txt` anywhere in `app/` — nothing tells search engines the photo/collection URLs exist.
- **Bug found:** backend `GET /photos/:id` (`photo.controller.ts` → `getPhotoById`) does `prisma.photo.findUnique({ where: { id } })` with **no `visibility` filter at all**, even though the route is registered with `optionalAuth` (implying it's meant to respect scope like the list endpoint does). Anyone who has (or guesses) a `PRIVATE` or `COLLECTION_ONLY` photo's UUID can fetch its full data — title, description, EXIF, image URLs — via this public, unauthenticated endpoint. The list endpoint (`getPhotos`) filters visibility correctly by scope; the detail endpoint just doesn't. Low practical risk (UUIDs aren't guessable) but a real gap, and directly relevant here since SEO tooling (sitemap, metadata) must never surface a private photo's URL.

### Target
- `app/photo/[id]/page.tsx` gets a `generateMetadata()` function: fetches the photo (already-public `getPhotoById`/`getPhoto` call, no new endpoint needed), sets `title`, `description` (fallback to a generic line if the photo has none), `openGraph.images` (use `photo.src.medium` or `full`), and `twitter.card = 'summary_large_image'`.
- New `app/sitemap.ts` (Next.js App Router sitemap convention): lists home, `/about`, `/collections`, every collection slug, and every `PUBLIC` photo detail URL — pulled from the existing public `getPhotos({ scope: 'public' })` / `getCollections()` calls, paginated through if the count exceeds the default `limit`.
- New `app/robots.ts` (or static `public/robots.txt`): allow all, point to the sitemap; disallow `/admin`.

### Backend fix needed (`airu-portfolio-be`)
In `getPhotoById` (`photo.controller.ts`), mirror the scope logic already used in `getPhotos`:
```ts
const isAuthenticated = !!(req as any).user;
const where: any = { id };
if (!isAuthenticated) {
  where.visibility = 'PUBLIC';
}
const photo = await prisma.photo.findUnique({ where, ... });
```
(Exact shape depends on whether `findUnique` accepts a compound filter like that in this Prisma version — may need `findFirst` instead, since `findUnique` requires the `where` to only contain unique fields. Worth a quick check when implementing.) This should land **before or alongside** the sitemap work, not after — no point generating a sitemap correctly if the underlying endpoint still leaks private photos to anyone who has the URL.

### Frontend impact
Just the two new `app/` files + the `generateMetadata` addition. No changes to `lib/api.ts` needed — reuses existing public fetch functions.

### Implementation note
Backend fix landed as `findFirst({ where: isAuthenticated ? { id } : { id, visibility: "PUBLIC" } })` — needed `findFirst` over `findUnique` as anticipated, since `findUnique`'s `where` can only contain unique fields (`id, visibility` together isn't one). `airu-portfolio-be` commit `67a8412`, deployed and verified live: unauthenticated requests for both a real `PRIVATE` and a real `COLLECTION_ONLY` photo id now 404, admin (authenticated) access unaffected.

Frontend: `generateMetadata()` added to `app/photo/[id]/page.tsx` (title, description with location+year fallback, OG + Twitter card images), plus `app/sitemap.ts` and `app/robots.ts`. New `SITE_URL` export in `lib/config.ts` (`NEXT_PUBLIC_SITE_URL` env override, defaults to `https://byairu.com`) since nothing in the codebase had a canonical site URL before this. `airu-porto-fe` commit `9c723e3`.

Verified end-to-end against the live site: `/sitemap.xml` and `/robots.txt` render correctly and don't list the private/collection-only photo ids used to test the backend fix; a photo page's rendered `<title>`/OG/Twitter tags match the photo's real data; the private photo's detail page correctly 404s instead of rendering.

---

## 5. Admin Login Rate Limiting ✅ Done (scope expanded — see note)

**Goal:** Stop unlimited brute-force / credential-stuffing attempts against the admin login.

### Current state
- `POST /auth/login` (`auth.controller.ts`) does `bcrypt.compare(password, user.passwordHash)` with **no attempt tracking, lockout, or throttling of any kind**.
- `package.json` has no `express-rate-limit` (or any rate-limiting/security-middleware package) — only `helmet` is present, which doesn't cover this.
- Admin panel is reachable from the public internet (byairu.com, per production infra), so this endpoint is exposed to automated guessing today with no friction at all.

### Target
- Add `express-rate-limit` middleware scoped to `POST /auth/login` (and `/auth/register` if that route is still reachable — worth checking whether registration is still open or was a one-time setup path): something like 5–10 attempts per IP per 15 minutes, with a clear 429 response.
- Optional hardening beyond the minimal fix (flag, don't build yet): track failed attempts per-username in the DB or in-memory to slow down distributed/rotating-IP attempts too, since IP-based limits alone are weak against botnets. Not necessary for a personal portfolio's threat model — the basic IP-based limiter is enough to start.

### Backend changes needed (`airu-portfolio-be`)
1. `npm install express-rate-limit`.
2. New `src/middlewares/rateLimiter.middleware.ts` exporting a configured limiter.
3. Apply it in `src/routes/auth.routes.ts` on the `login` (and optionally `register`) route only — not globally, so it doesn't throttle normal photo/collection reads.

### Frontend impact
None, beyond making sure the login form surfaces the 429 response as a readable "too many attempts, try again later" message instead of a generic error. (Not built — the form still shows a generic error on 429; low priority since this path is rare.)

### Implementation note — scope expanded past the original plan
While wiring this up, checked whether `/auth/register` was "still reachable" as flagged above: it was — **fully public, no invite/approval, no auth gate**. Since this app has a single `User` model with no role/permission distinction, anyone could `POST /auth/register` with an arbitrary username/password and get back a fully-privileged admin JWT, no password-guessing needed at all. That's a bigger hole than the login brute-force this task started as, so it got fixed in the same pass rather than deferred:

- `POST /auth/register` now requires `authenticateToken` — only an already-authenticated admin can create another account (chosen over deleting the route outright, since there turned out to be **two** legitimate accounts already, `airu` and `nadia` — not single-admin as assumed earlier in this doc).
- `POST /auth/login`: 10 attempts / IP / 15 min via `express-rate-limit`.
- Also added `app.set("trust proxy", 1)` in `app.ts` — the app runs behind Nginx (per `DEPLOYMENT-GUIDE.md`, single hop), and without this, `express-rate-limit` would either key every visitor by the proxy's shared IP (one bucket for everyone, real users lock each other out) or outright reject requests over the unconfigured `X-Forwarded-For` header. This wasn't set anywhere before.

Pushed as `airu-portfolio-be` commit `33f7036`, deployed via Dokploy auto-deploy (confirmed live).

**Incident during testing, self-caused and self-resolved:** tested the fix against the live tunnel before the Dokploy deploy had actually rolled out, so the *old* unpatched `/auth/register` briefly handled the test request and created a real user (`test` / `test1234`) on production. Caught immediately by checking the response code (`201` instead of the expected `401`), traced the actual running container (`airu-fotografi-be-yl1tcf`, found via the `airu-upload-relay` socat container it's tunneled through — not the more obviously-named `airu-portfolio-api`, which turned out to be a stale/unused container) and its DB (`dokploy-postgres` / `portfolio_db`, likewise not the more obviously-named `airu-portfolio-db*` containers, which are also stale), then deleted the `test` row directly (`DELETE FROM users WHERE username = 'test' AND id = '...'`, confirmed by row count and a follow-up `SELECT`). Re-verified after the real deploy landed: `register` without a token now correctly returns `401` and creates nothing. Worth knowing for next time: this Contabo box has several orphaned containers (`airu-portfolio-api`, `airu-portfolio-fe`, `airu-portfolio-db`, `airu-portfolio-db-iszn8t`, `airu-dev-web-frontend-qke9wa`) alongside the ones actually live (`airu-fotografi-be-yl1tcf`, `airu-fotografi-fe-5uu3jv`, `dokploy-postgres`) — not cleaned up here since it wasn't this task's scope, but worth a cleanup pass sometime so "which container is real" isn't a live debugging question again. Also noted in passing: a `dokploy-redis` container already exists on the box, which may be usable for the feature-3 Redis migration mentioned earlier instead of standing up a new one.

---

## Suggested build order
1. **Feature 1** (modal refactor) — pure frontend, no backend dependency, and you're already halfway through it. Lowest risk, finish this first.
2. **Feature 5** (rate limiting) — tiny, isolated, pure security fix with no product-behavior tradeoffs to discuss. Good to slot in whenever there's backend time, doesn't block or get blocked by anything else.
3. **Feature 4** (SEO + visibility fix) — do the backend visibility fix first (small, self-contained), then the sitemap/metadata frontend work. Independent of 1–3.
4. **Feature 2** (filters) — needs a small, well-scoped backend change (search + sort params) plus frontend wiring. Do after 1 so the admin list UI isn't being touched by two efforts at once.
5. **Feature 3** (random seed) — backend-heavy, needs the diversity bucket rule confirmed first (only open question left, cache/seed strategy is already settled above). Independent of the rest, can be done in parallel by backend while frontend does 1–2.

---

## 6. Client-Facing Improvements ✅ Done

Follow-up round after all 5 core features shipped — a discussion about public-site polish (not originally in this doc) turned into four shipped pieces plus two bugs found along the way. `airu-porto-fe` commits `63dce4b` → `4cc40ef`; `airu-portfolio-be` commit `6df3ecc`.

### 6a. Related photos on photo detail pages
Photo detail page navigation was Prev/Next-only within a collection. Added a grid below the existing Collections section showing other photos from any collection(s) the current photo belongs to (deduped across collections, capped at 8, "More from `<Collection>`" heading for single-collection photos, "Related Photos" when a photo spans several). No section for uncategorized photos. New `getRelatedPhotos()` in `lib/data.ts`, new `components/photo/RelatedPhotos.tsx`.

### 6b. Click-to-reveal search on the public gallery
Search icon in the gallery header expands into a debounced (300ms) text input, reusing the `search` param the backend already had from feature 2 (works for any scope, not just admin — no backend change needed). Reverts to normal infinite-scroll browsing when cleared/closed; shows a "no results" state instead of an empty grid. `getGalleryPage()` in `lib/data.ts` now takes an optional `search` param; `GalleryView.tsx` manages the toggle/debounce/refetch state.

### 6c. About page revamp + structured contact form
Redesigned with a two-column hero (the photographer's own portrait — photo `fb96d8e1-e8b1-40cd-b2c0-8f301b8cbb8e`, "Me and Snow Doll" — alongside a display-serif opening line and the existing bio copy) and a staggered entrance animation, matching the public site's existing minimal/monochrome/edge-to-edge identity rather than introducing a new look. New `components/about/AboutHero.tsx` (client, for the motion).

Contact form (name, email, project type, message) replaces the old plain `mailto:` CTA, styled with underline inputs (not the admin panel's boxed/blue-accented `Input`/`Button` — that kit is `/admin`-only, using it on the public site would've been the first color accent anywhere on it). New `components/about/ContactForm.tsx`.

**Chosen without asking first, flagged here instead:** submissions are stored in a new `Inquiry` table and read via a simple admin inbox (`/admin/inquiries`, with an unread-count badge in the sidebar) rather than emailed — this backend has no email/SMTP service configured, and setting one up needs an account + API key only you can create. Easy to add email notifications later once that exists; swap is backend-only, doesn't touch the form itself.

Backend: new `Inquiry` Prisma model, `POST /inquiries` (public, rate-limited 5/IP/hour, zero-size honeypot field as a second spam layer), `GET/PATCH/DELETE /inquiries` (admin). Needed a manual `prisma db push` against prod after deploy (same gap as always — `migrate deploy` is a no-op, no tracked migration files in this repo). New `adminFetchWithMeta` in `lib/fetch.ts` since the existing `adminFetch` drops `pagination`/extra fields the inbox needs (`unreadCount`).

### Bugs found and fixed along the way
- **Silent 100-photo cap in admin, again.** Same class of bug already fixed on the homepage (commit `381be13`) was still present in `/admin/photos` and the collection detail page's "Add Photos" picker — neither passed a `limit` override, so both silently capped at the backend's default 100. Library is at 338 photos (confirmed via direct DB query: 328 PUBLIC + 9 COLLECTION_ONLY + 1 PRIVATE), so the admin list was hiding ~70% of the library, and photos past the first 100 couldn't be added to any collection at all. Fixed by passing `limit: 1000`, matching the existing `getAllPhotos()` precedent.
- **Cormorant Garamond was never actually loaded.** `Logo.tsx` referenced `fontFamily: "'Cormorant Garamond', serif"` for the "frame by airu" wordmark, but nothing in the app ever loaded that font — no `next/font`, no Google Fonts `<link>` anywhere. It's been silently falling back to the browser's default serif since whenever the logo was built. Fixed via `next/font/google` in `app/layout.tsx` (self-hosted, `--font-cormorant` CSS variable), `Logo.tsx` and the new About page styling both reference the variable now.
- **Production build broke twice** after `app/about/page.tsx` and `app/sitemap.ts` started fetching from the backend without `export const dynamic = 'force-dynamic'` — Next tried to prerender them at build time, and the build container can't reach the backend's Swarm-internal hostname (`ENOTFOUND`). Fixed by adding the flag, matching the pattern already used by `app/page.tsx`, `app/photo/[id]/page.tsx`, and `app/collections/page.tsx`. Now always run `npm run build` locally before pushing any change that touches a data-fetching page — this is what caught it the second time before it ever reached production.

### 6d. Gallery zoom control: real breakpoints, per-tier options
Follow-up discussion after 6b/6c shipped. Zoom control originally used Tailwind's default `sm`/`md`/`lg`/`xl` (640/768/1024/1280), which didn't match the actual desired scaling and made the control invisible or inert across large chunks of the mobile/tablet range. Rebuilt around three custom tiers — **<425px always 1 column** (no control shown, no choice possible), **425–767px picks 1 or 2**, **768–1023px picks 2 or 3**, **1024px+ picks 2, 3, or 4** — each tier showing only the options that actually produce a different result at that width. Implementation: `MasonryGrid` takes a `ColumnPrefs` object (`{ sm, md, lg }`) instead of one global 2/3/4 level, built into a literal Tailwind class string (`min-[425px]:columns-N` etc — arbitrary-value breakpoint syntax, not a new named screen in `tailwind.config.ts`) since JIT needs literal class strings, not runtime-interpolated ones. New shared `components/gallery/ZoomControls.tsx` (viewport-tier tracking via `matchMedia`, localStorage persistence) replaces near-duplicate implementations that used to live separately in `GalleryView` and `CollectionView`.

---

## Deferred / Future To-Dos

Raised in discussion, not started. Re-derive current state before picking any of these back up — this list is a pointer, not a spec.

- **Per-photo view counter ✅ Done and deployed (built 2026-08-13, deployed 2026-08-15).** Built as proposed: `Photo.viewCount` (Prisma `Int @default(0)`), incremented in `getPhotoById` only when the request is unauthenticated (real visitor reads on the public photo detail page — admin edit/preview via the dashboard doesn't inflate it), fired after the response is sent so a slow/failed write never delays the page. New `sort=views` option (`getPhotoSchema` + `orderByMap`), exposed through `transformPhoto`. `airu-portfolio-be` commit `ca7f3fe`.
  Frontend: `Photo.viewCount` on the type, `transformPhoto` passes it through, admin sort dropdown gets a "Most Viewed" option, and both `PhotoGrid`/`PhotoListItem` show a small eye-icon count on each card. `airu-porto-fe` commit `7e81ae6`. `tsc --noEmit` clean on both repos (backend verified once `prisma generate` runs — confirmed the *only* pre-generate type error was the stale client not yet knowing about `viewCount`, expected and resolved by the Docker build's own `npx prisma generate` step).
  **Deploy note (2026-08-15):** `ca7f3fe`/`bb09b63` sat unpushed on the backend for two days (frontend side had already been pushed) — pushed, Dokploy auto-deployed, then `npx prisma db push` run against prod (`docker exec` into the fresh container, same procedure as every prior schema change) to actually create the `view_count` column. Verified end-to-end against live prod: an unauthenticated `GET /photos/:id` incremented `view_count` from 0 → 1 in the DB, and the same response's JSON body did **not** contain `viewCount` — both the counting and the privacy hardening below confirmed working together, not just individually.
  **Privacy hardening (2026-08-13, same day, before first deploy):** owner flagged wanting the numbers admin-only, explicitly not a public "look how quiet/busy this site is" stat — reasonable for a low-traffic personal portfolio where a visible low count could read as a negative signal. The admin dashboard UI never rendered `viewCount` anywhere public-facing (only `/admin/photos`, behind login), but the raw JSON API response *did* still include it on every scope, including unauthenticated public/collection requests — visible to anyone opening the browser Network tab or hitting the API directly, even with no UI surfacing it. Fixed: `transformPhoto`/`transformPhotos`/`transformCollection`/`transformCollections` now take an `includeViewCount` param defaulting to **false** (opt-in, not opt-out, so a missed call site can't leak it), wired to `true` only on the already-computed `isAuthenticated` check in `getPhotos`, `getPhotoById`, `getCollections`, `getCollectionsbySlug`. `airu-portfolio-be` commit `bb09b63`.
- **Site-wide traffic analytics.** Wanted: visitor counts, referrers, general traffic — a different question from the per-photo counter above. Undecided between **Plausible/Umami** (privacy-friendly, no cookie-consent banner needed, simpler dashboard — recommended) and **Google Analytics / GA4** (free, most familiar since it's already used on other projects, but needs a consent banner for EU visitors and a fussier UI for a question as simple as "which page got the most views"). Owner leans GA4 for the cross-project familiarity but asked for a fuller comparison before deciding — not yet given. Pick up by actually writing that comparison out, then implementing whichever is chosen.
- **Error monitoring** (e.g. Sentry). Confirmed low priority, not urgent — but worth noting this session alone had two production build failures that were only caught because the owner was watching the Dokploy log and pasted it in; there's currently no automated way to learn about a runtime error otherwise.
- **Admin bulk actions** (select multiple → bulk delete/move-to-collection/change visibility). Skipped for now. Natural pairing with the feature-2 filters once picked back up.
- **Automated tests**, either repo. Skipped for now — flagged as a structural gap, not treated as urgent for a fast-moving solo project.
- **Photo discoverability / SEO depth** (the "gua pengen gambar gua bisa terkenal" conversation): split into what code can do vs. what it can't.
  - ✅ **Done** (commit `d80b069`): `ImageObject`/`Person`/`ProfilePage` JSON-LD structured data — new `lib/structuredData.ts`, injected via `<script type="application/ld+json">` on `app/photo/[id]/page.tsx` (per-photo `ImageObject` with author/creator/copyrightHolder, `contentLocation` from the photo's location, dates, tag keywords) and `app/about/page.tsx` (`ProfilePage` wrapping a `Person` with `sameAs` linking Instagram/Twitter/Unsplash). Also replaced `app/sitemap.ts` with `app/sitemap.xml/route.ts` — hand-built XML carrying Google's image sitemap extension (`xmlns:image`, `<image:image>` with loc/title/caption/geo_location) per public photo, since the framework's `MetadataRoute.Sitemap` type can't express that extension. Verified live: 346 `<url>` entries, 328 `<image:image>` blocks (matches PUBLIC photo count) at `byairu.com/sitemap.xml`.
  - *Still owner's own follow-through, not code:* submit the sitemap to Google Search Console (needs the owner's own GSC account, ~5 minutes once the account exists — this is also how to confirm Google actually picked up the new structured data, via GSC's Rich Results / URL Inspection tools); active posting to Instagram (@frame_by_airu) and Unsplash (@airuphotograph, already linked from the About page); Pinterest specifically flagged as a strong, underused channel for photography discoverability (Pinterest functions as an image search engine, tends to drive real traffic for photographers); backlinks from other sites, which is a promotion/networking problem, not an engineering one.
  - **GSC follow-up (2026-08-12):** domain property `sc-domain:byairu.com` verified successfully (covers all subdomains/protocols automatically — no separate property needed for e.g. a future `api.byairu.com`). Sitemap submission (`sitemap.xml`, then retried as the full `https://byairu.com/sitemap.xml` after a "invalid path" error on the relative form) currently shows **"Tidak dapat mengambil peta situs"** (couldn't fetch) — the sitemap itself checks out fine from here (200, correct `Content-Type`, valid SSL cert, `robots.txt` doesn't block it, no User-Agent-based blocking found testing as Googlebot's UA directly). Leading suspect if this doesn't self-resolve: the domain has an **AAAA (IPv6) record** (`2400:d320:2300:199::1`) pointing at the Contabo VPS, and Googlebot prefers IPv6 when available — budget VPS IPv6 routing is a known flaky spot. Plan: wait 24-48h for Google's automatic retry (owner explicitly asked to pause on this, not urgent); if it's still failing after that, next step is removing the AAAA record (owner's DNS provider, needs their approval first since it's a live prod DNS change) to force IPv4-only.

- **Photo share/watermark feature** (raised 2026-08-12, casually — owner explicitly said not committed to this yet, exploring alongside other ideas, so keeping this loose rather than a full spec). Idea: a "Share" affordance on the public photo detail page that lets a visitor download/share a version of the photo with a border carrying just Airu's signature/watermark (not a full EXIF metadata card — that option was raised and declined). Open questions for whenever this gets picked up: exact visual treatment of the signature mark, client-side canvas composition vs. server-side (backend already has `sharp` as a dependency, could reuse it) vs. simple download vs. Web Share API integration for mobile share sheets.

---

## 7. Mobile UX Polish (feedback-driven) — 7a, 7b, 7c, 7d, 7e done

Status: all sub-items greenlit, built, reviewed, and shipped.

Context: owner shared feedback from other people who tried the site, mostly on mobile, relayed 2026-08-13 (WhatsApp screenshots, "Zul CS 19").

### 7a. Empty "Camera Settings" box shows even with no data ✅ Done
**Root cause (confirmed via DB query):** `Photo.metadata` defaults to `{}` in the schema (not `null`), so `photo.exif` (`= backendPhoto.metadata || undefined`) is truthy for essentially every photo — `{}` is a truthy value in JS. The photo detail page's EXIF section gates on `{photo.exif && (<details>...)}`, which is always true, then individually hides each *field* that's empty (`{photo.exif.camera && (...)}` etc.) — but never hides the *whole box* when every field inside is empty. Confirmed live: **31 photos** have `metadata = {}` entirely; several more (e.g. "Mask group", "Quack Quack Quack") have only `camera` populated with `iso`/`lens`/`shutter`/`aperture` all empty strings — both cases currently render a "Camera Settings" accordion that's empty or near-empty once expanded.

**Proposed fix:** change the outer gate from "does `photo.exif` exist" to "does `photo.exif` have at least one non-empty field" — a small `hasExifData(photo.exif)` check (`Boolean(exif.camera || exif.lens || exif.aperture || exif.shutter || exif.iso)`) in `app/photo/[id]/page.tsx`. Small, self-contained, no backend change, no data migration.

**Implementation note:** built exactly as proposed — `hasExifData` computed once per page and used to gate the accordion; the four inner field checks changed from `photo.exif.field` to `photo.exif?.field` (needed for TS narrowing once the gate no longer directly references `photo.exif`, caught by `tsc --noEmit`, zero errors after the fix). `airu-porto-fe` commit `dafc3ca`. Verified live on `byairu.com` via browser automation post-deploy (Dokploy).

### 7b. Photos "popping" in in during load ✅ Done (hero image; `CollectionCard` also done under §9)
**Root cause (confirmed via code read across every image-rendering component):**
- `components/photo/PhotoDetailClient.tsx` (the hero image on every photo detail page — the largest, heaviest image on the site, `photo.src.full`) has **no blur placeholder at all**. Likely the most visible offender, since it's both the biggest asset and the one with zero progressive-loading treatment.
- `components/gallery/PhotoCard.tsx` (homepage gallery, collection pages, related-photos grid) already has `placeholder="blur"`, but with one **generic static gray `blurDataURL`** shared by every photo regardless of its actual colors — better than nothing, but the swap from generic-gray to the real image is still visually abrupt since the placeholder doesn't resemble the incoming photo.
- `components/collections/CollectionCard.tsx` (the `/collections` listing page thumbnails) has **no blur placeholder at all** either — fixed under §9.

**Three tiers of fix, increasing cost/quality — pick one:**
1. **Cheap:** add the same generic gray `placeholder="blur"` (copy the existing `blurDataURL` constant from `PhotoCard.tsx`) to the hero image and `CollectionCard`. ~15 minutes. Helps some, doesn't fix the "placeholder doesn't look like the photo" issue.
2. **Recommended — medium:** for the hero image specifically (the worst offender), paint `photo.src.medium` first (much lighter, loads fast) and swap to `photo.src.full` once it's finished loading in the background, instead of going straight for the full-res file with nothing to show in the meantime. Needs a small bit of client state in `PhotoDetailClient.tsx` (two-image swap or an `onLoad` handler), no backend change. Meaningfully smooths out the single worst spot without touching the database or the upload pipeline.
3. **Most correct, most work:** generate a real per-photo LQIP (a tiny, actually-representative blurred thumbnail) at upload time using `sharp` (already a backend dependency), store it, and use it everywhere instead of the generic gray placeholder. Needs a schema change (new column or reuse `metadata`), upload-pipeline changes, and — critically — **won't retroactively cover the 300+ already-uploaded photos** unless separately backfilled. Best long-term fix, biggest lift.

Recommendation: do **Tier 2** now (best value for the effort, fixes the worst offender), leave Tier 3 as a future upgrade once there's appetite for a backend change + backfill job.

**Implementation note (2026-08-13):** went with the tier-2-style pattern already proven on `PhotoCard`/`CollectionCard` rather than the medium→full swap originally proposed above — `photo.src.thumbnail` blurred underneath, cross-fading to `photo.src.full` on `onLoad`, same technique across the whole site now. Extracted into a `HeroImage` subcomponent inside `PhotoDetailClient.tsx`, keyed by `photo.id` so `loaded` resets cleanly on every client-side Next/Prev click — this incidentally fixed a second, undocumented instance of the same bug: clicking Next/Prev swapped `currentPhoto` with no loading state at all, showing a bare gray box mid-transition (confirmed live via screenshot before the fix). Bundled with two related fixes found during the same pass: (1) neither the hero nor the `Lightbox` image had a `sizes` prop, so Next.js defaulted to the largest device bucket — confirmed live via network tab, the hero was requesting `w=3840` for a box rendered at ~1150px max-width; both now set `sizes` (Lightbox's zoomed mode intentionally left uncapped, since it's a pixel-peek feature). (2) `getNextPhoto`/`getPreviousPhoto` (`lib/data.ts`) were re-fetching the entire photo list (up to 1000 photos) or the full collection detail on **every single** Next/Prev click — now cached in-memory for 60s. `airu-porto-fe` commit `54290d0`. `tsc --noEmit` clean.

**Reverted (2026-08-13):** owner reported the hero image looking pixelated/broken ("pecah") on the live detail page after this deployed. Reverted `PhotoDetailClient.tsx` and `Lightbox.tsx` back to pre-change state (`airu-porto-fe` commit `d070f98`) — the `lib/data.ts` nav caching has no visual effect and was kept. While reverting: confirmed via live DOM inspection that the blur→sharp crossfade itself *was* completing correctly (blur layer at `opacity-0`, sharp image at `opacity-100`), but the delivered `photo.src.full` decoded to only ~720×480 real pixels on the two photos checked, stretched across a much larger box on a high-DPI screen — reads as the same root cause as the visible softness either way, likely a pre-existing low source-resolution issue that the blur-up transition made more noticeable by inviting a direct before/after comparison, not something the `sizes`/blur-up change itself introduced. Not re-attempted; worth checking actual pixel dimensions of `photo.src.full` (the R2 `-large.jpg` variant) across the library before trying a blur-up placeholder here again.

**Re-applied (2026-08-13):** the "pre-existing low source-resolution" theory above didn't hold up. Re-checked properly with browser caching disabled: R2 source is 2400x1600, and `/_next/image` serves 2400x1600 correctly when fetched fresh — the earlier ~720x480 reading was a stale-cache artifact in one testing tab, not a real server or code issue (confirmed by reloading the same URL via a plain `<img>`, which returned 2400x1600 correctly). Also re-derived the `sizes` request-width math for every DPR/viewport combination checked — never smaller than what the pre-blur-up code requested. Re-applied `PhotoDetailClient.tsx`/`Lightbox.tsx` back to the `54290d0` state via commit `888dada`. `tsc --noEmit` clean.

### 7c. "Blinking" on back/forward navigation, especially mobile ✅ Done
**Root cause (confirmed via code read):** `Header` (root layout, doesn't remount on navigation — confirmed safe) is not the issue. `components/gallery/MasonryGrid.tsx` and `components/collections/CollectionGrid.tsx` are page-level content, not layout — Next.js App Router fully remounts them on every navigation to `/` or `/collections`, **including clicking back to a page you already saw seconds ago**. Their Framer Motion entrance animation (`initial="hidden" animate="visible"`, staggered fade-in) replays from scratch every single time, even though the underlying photos are already browser-cached and would otherwise paint instantly — this is very likely what reads as "blinking," especially on back/forward where the user expects the page to just *be there*, not replay an intro animation.

Separately, confirmed **not a bandwidth/billing concern**: images are served from Cloudflare R2, which has zero egress fees (R2's core pitch) — repeat image loads cost nothing regardless of caching behavior. The JSON data itself does refetch on every navigation (all pages are `force-dynamic`), but that payload is small and isn't the source of the visual issue.

**Proposed fix:** a module-level (not React state) "has this animated once already this session" flag, checked by `MasonryGrid` and `CollectionGrid` (and possibly `AboutHero`) to skip the entrance animation on repeat mounts. Module-level state persists across client-side navigations within the same session (SPA behavior) and only resets on a true hard reload — exactly matching "only animate on true initial load, not on every back/forward."

**Implementation note:** built as proposed in all three places — `MasonryGrid.tsx`, `CollectionGrid.tsx`, and `AboutHero.tsx` each got their own module-level `hasAnimatedOnce` flag (not shared between components, so each grid gets its own "first time" independent of whether another grid elsewhere already animated this session) and render `initial={skipEntrance ? false : 'hidden'}` — Framer Motion propagates `initial={false}` down to child `motion.div`s that don't set their own explicit `initial`, so the whole stagger tree is skipped on repeat mounts without touching the children. `airu-porto-fe` commit `dafc3ca` (same commit as 7a). Verified live: back-navigating to `/` after visiting a photo now renders the full 30-photo grid instantly, vs. the pre-fix screenshot showing only 2/30 photos rendered ~1s after landing back on the page.

### 7d. Masonry grid re-orders photos as more load in (found 2026-08-13, plan only)
Raised by the owner directly (not the WhatsApp feedback round): "urutan di masonry grid-nya ngaco, karena tiap ada gambar yang baru reload, urutannya berubah lagi" — photos visibly jump to a different position/column as more content loads in, not just on initial paint.

**Root cause (confirmed via code read, `components/gallery/MasonryGrid.tsx`):** the grid isn't a real masonry implementation — it's native CSS multi-column (`columns-1 md:columns-3 lg:columns-3`, Tailwind `columns-N` utilities). Browsers default multi-column layout to `column-fill: balance`, which does **not** behave like Pinterest-style masonry (append each new item to the currently-shortest column, never touching earlier items). Instead, `balance` re-flows and redistributes the *entire* set of items across columns from scratch any time total content height changes — which happens on every infinite-scroll page append (`GalleryView.tsx`'s `loadMore`, appending to the `photos` array on `IntersectionObserver` trigger). That full re-flow is what moves already-visible photos to a different column/position; it isn't actually about individual images "reloading."

Individual item sizing itself looks correct and isn't the problem: `PhotoCard.tsx`'s `<Image>` already sets explicit `width={1600}` / `height={Math.round(1600 * photo.aspectRatio)}`, which Next.js turns into a reserved aspect-ratio box before the image request even starts — so a single photo's box shouldn't itself resize when its image finishes loading. The reflow is a property of the CSS column-balance algorithm reacting to the *set* changing size, not of any one image.

**Proposed fix:** replace CSS `columns-N` with a JS-computed masonry — walk the `photos` array in order and greedily assign each one to whichever column currently has the smallest estimated cumulative height (estimated from the already-known `photo.aspectRatio`, no need to wait for the real `<img>` to load). This is deterministic and stable for any *stable prefix* of the array: since each item's placement only depends on items before it, recomputing from scratch as `photos` grows via infinite scroll never changes where already-placed photos land — new items only ever append to whatever column is shortest at that point. Needs the *actual* live column count as a plain number (not just CSS breakpoint classes) to run the packing — `ZoomControls.tsx` already does exactly this kind of viewport-tier tracking via `matchMedia` for the zoom-level picker, so the same pattern can supply the column count here rather than introducing a second mechanism.

Scope: `components/gallery/MasonryGrid.tsx` only. `CollectionGrid.tsx` (the `/collections` listing) is unaffected — it's a fixed-size CSS grid (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`) for uniform collection-cover cards, not a variable-aspect-ratio masonry, so it doesn't have this failure mode.

**Implementation note:** built as proposed — `packIntoColumns()` greedily assigns each photo to the shortest column using `photo.aspectRatio`, and the live column count comes from a new shared `hooks/useViewportTier.ts` (extracted out of `ZoomControls.tsx`'s existing `matchMedia` logic so both components track the exact same breakpoints instead of two copies that could drift). Before the tier is known client-side (SSR + the instant before hydration), `MasonryGrid` still falls back to the old CSS `columns-N` markup — identical on server and pre-hydration client render, so there's no hydration mismatch — then swaps to the JS-packed layout once the real tier resolves. `airu-porto-fe` commit `e1f0850`.

Verified live on production (`byairu.com`) via browser automation: captured each photo's on-screen position before and after triggering infinite scroll (all 328 photos loaded), diffed by photo ID. Zero photos changed **column** (`left`) after the fix, vs. the pre-fix behavior where a full CSS-balance re-flow could move anything anywhere. The original bug — "urutan berubah tiap ada gambar baru reload" — is confirmed fixed.

**Residual, smaller issue found during that same verification (not the original bug, not infinite-scroll related):** a one-time vertical settle shortly after each fresh page load — items stay in their column (`left` unchanged) but can shift up/down by tens to a few hundred px once, before anything is scrolled or appended. Root-caused to the SSR-safe fallback itself: the CSS `columns-N` balance algorithm and the JS greedy-packing algorithm don't lay out the *same* set of photos identically even at the same column count, so the one-time swap from fallback → final JS layout (which has to happen post-hydration to avoid a mismatch, per the note above) is itself a small reflow. Confirmed happening even with no saved zoom preference in `localStorage`, so it's not the same thing as returning visitors whose saved column-count preference (`ZoomControls`' `gallery-column-prefs` key) differs from the default and applies a moment after mount, though that stacks an *additional* shift on top for that subset of visitors. This is inherent to the current hydration-mismatch-safe approach — happens once, very early (well under a second), and doesn't recur on scroll or on subsequent infinite-scroll appends (re-verified with longer observation windows and mid-scroll snapshots — no further movement once settled). Fully eliminating it would mean a bigger change (e.g. deciding the column count server-side via a cookie, or hiding the grid for that brief instant instead of showing a fallback that then gets replaced) — logged as a possible future item, not built, since it's a one-time settle rather than the "keeps reordering" behavior the owner originally flagged.

### 7e. Masonry column imbalance — `aspectRatio` was a hardcoded placeholder, not real data (found + fixed 2026-08-13)

Raised by the owner's friend (screenshot: scrolled to the bottom of the gallery, most columns had visibly ended while one column was still going, well before the footer) and independently reproduced live. At first glance this looked like it might just be pale/dark photos blending into the page background at a glance (a real, separate, minor effect — confirmed by zooming into what looked like a "gap" and finding a fully-loaded snow/fox photo sitting there) — but the owner's own testing showed the column-height gap was too large for that alone, and pushed to look deeper.

**Actual root cause (confirmed via code read, `lib/transformers.ts`):** `transformPhoto()` set `aspectRatio: 1.5` as a **hardcoded constant for every single photo** — the backend never stored or returned real image dimensions at all (checked live: raw `/photos` response has no width/height/aspectRatio field anywhere, only EXIF-style `metadata`). Since §7d's `packIntoColumns` decides which column is "shortest" using `photo.aspectRatio`, and every photo reported the *identical* fake ratio, its placement decisions were made close to blind — real portraits (~0.67) and real wide landscapes (~1.5–2+) were treated as the same height. Over a large batch (up to 328 photos) that error compounds into a visibly lopsided result: confirmed live, one column ended up roughly 150 photos "ahead" of the others by the end of the full scroll. This is also very likely a real contributor to the residual settle-shift noted above (§7d) beyond just the fallback-layout swap — every photo's box was initially sized from the same wrong 1.5 ratio, then snapped to its real size the moment its actual image loaded, for the entire session, not just once at mount.

**Fix implemented (frontend-only, no backend/DB change):** new `lib/resolveAspectRatio.ts` — before a batch of photos is placed in the grid, probe each one's *real* aspect ratio by loading its small thumbnail (`photo.src.thumbnail` / backend `urlSmall`, resized server-side with `fit: "inside"` so it's the exact same aspect ratio as the full photo, just far lighter — 300px/quality 75 vs. 1600px+ for the medium/large variants actually displayed). Runs in parallel across a batch, module-level cache keyed by photo id (no re-probing on repeat mounts within a session), 4s per-photo timeout falling back to the old placeholder so one broken thumbnail can't block a whole batch.

Wired into every real usage of `MasonryGrid`: `GalleryView.tsx` resolves the initial SSR batch once on mount and each `loadMore()` batch before it's appended (already-placed photos are never re-evaluated — same stable-prefix guarantee as §7d); `CollectionView.tsx` (large collections like Kamakura at 181 photos hit the identical bug) resolves its fixed photo list once. `MasonryGrid` gained a `ratiosResolved` prop (default `true`, so `RelatedPhotos.tsx` — a handful of photos, negligible risk — is unaffected): the pre-hydration CSS fallback now also waits on this, not just on the viewport tier resolving, so the very first JS-packed render already has real ratios instead of packing once with placeholders and again moments later once real data arrives — this should reduce the §7d residual settle-shift too, not just fix the column-imbalance bug.

Net new network cost: one small thumbnail fetch per photo (parallel, same-origin-adjacent R2 request, independent of the medium/large fetch that already happens for display) — not a doubling of the existing image traffic, since the thumbnail is far lighter than what's actually shown.

Verified: `tsc --noEmit` clean. Not yet verified live (needs push + Dokploy deploy, which the owner does manually — see note below).

### Execution plan
1. Build against **local dev** (`npm run dev`, pointed at the production backend via the `airu-server-be` SSH tunnel on `:8201` — already configured via `.env.local`, no local DB needed) rather than pushing straight to production, so changes are visible immediately via hot reload for review/feedback before any deploy.
2. ~~7a first (trivial, zero risk), then 7c (moderate, clear win)~~ — both done (commit `dafc3ca`). ~~7d~~ — done (commit `e1f0850`). ~~7e~~ — built, not yet deployed (see above). Remaining: 7b whenever picked back up.
3. Only commit/push/deploy after the owner has reviewed locally.

---

## 8. SEO/Metadata Audit Follow-up (via Claude browser extension) — plan, not yet built

Status: **plan only**, findings cross-checked against actual source + live DB on 2026-08-13 (the audit tool only had DOM/meta access, not code, and explicitly asked for re-verification — done below). Owner hasn't picked priority order yet.

### Already done, audit was stale on these — no action needed
- `/photo/[id]`: `og:image`, `twitter:image`/`twitter:card`, `<link rel="canonical">`, `ImageObject` JSON-LD — all confirmed live (feature 4 + §6/§7 work).
- `/about`: `ProfilePage`/`Person` JSON-LD — confirmed live.
- `sitemap.xml`/`robots.txt` — confirmed correct, audit said don't touch, agreed.

### Confirmed real gaps (verified against actual `app/*/page.tsx` files + live curl)
- **Homepage (`/`) and `/collections`**: static `metadata` exports with **no `openGraph.images`, no `twitter` card, no `alternates.canonical`, no JSON-LD** at all. Confirmed via `curl` — literally zero `og:image`/canonical tags in the served HTML.
- **`/collections/[slug]` (individual collection pages)**: **no metadata export whatsoever** — not even a title override, let alone OG/canonical/JSON-LD. Worse than the audit itself flagged (it assumed *some* metadata existed and just needed an image; there's actually none).
- **Title/description quality**: homepage title/description is generic ("Gallery — Airu Photography"), doesn't reflect the actual travel/location breadth in the catalog (Japan, Indonesia, festivals, landscapes). Valid, low-risk copy improvement.
- **10 public photos missing `location`**, plus one confirmed typo: photo `949a7a5e-73e7-420b-9480-95c150cb003c`, title `"a gilmpse of kamikochi"` → should be `"A Glimpse of Kamikochi"`. Per the audit's own (correct) caution: this is a content fix, not something to auto-edit in bulk — flag the list to the owner, let them decide, possibly fix the one typo while touching that record if they confirm.
- **Thin collections**: confirmed "Naka Meguro Summer Festival" at 2 photos — but also found **two thinner ones the audit missed**: "Yogyakarta" and "Kawaguchiko Trip" at **1 photo each**. Content decision (add more photos to the collection, or leave as-is) — not something to silently merge/hide.

### Misidentified by the audit — do NOT act on this one
- **"Company" field on the contact form is not a stray B2B template leftover — it's the honeypot spam field** built in §6c (`components/about/ContactForm.tsx`), deliberately zero-size + `aria-hidden` + `tabIndex={-1}` so real visitors never see or reach it, only bots that blindly fill every input. The audit's own DOM inspection found it in the markup (correctly, it does exist there) but couldn't tell it was intentionally invisible. Removing or relabeling it would break the spam-prevention mechanism. Audit's own caveat ("check the submission handler before touching this") turned out to be exactly the right call — leave it alone.

### Unverified — needs a real fresh-mobile-load test, not a resize
- **Priority 7 (grid glitch on viewport resize)**: audit itself flagged this might be a DevTools-resize-only artifact rather than a real bug on a fresh mobile load, and asked for re-verification before treating it as real. No browser tool available in this session to test that distinction directly. Structural note: `PhotoCard.tsx`'s `<Image>` already sets explicit `width`/`height` (`aspectRatio`-derived), which should reserve correct space before the image loads and is the usual fix for exactly this class of bug — suggesting it's more likely the resize-artifact the audit suspected than a real first-load issue, but this is inference, not confirmation. Needs an actual phone or fresh DevTools device-emulation load (set before navigating, not resized after) to confirm either way.

### Proposed fix scope (once prioritized against §7)
1. ~~Add `og:image` + `twitter:image`/`card` + `alternates.canonical` to homepage and `/collections` metadata~~ — done for both now (§9 for collections, homepage below).
2. ~~Add a full `generateMetadata()` to `/collections/[slug]`~~ — done, see §9.
3. ~~Add `WebSite` JSON-LD to the homepage~~ — done below, without `SearchAction` (see note).
4. ~~Rewrite homepage/collections title+description copy~~ — done for `/collections` (commit `d88eb0c`) and now homepage (below).
5. Report the 10 missing-location photos + the typo back to the owner as a punch list — no auto-editing content.
6. Report the two newly-found thin collections (Yogyakarta, Kawaguchiko Trip) alongside Naka Meguro — owner's call. **Update:** a third was found during §9 — Jakarta is also down to 1 public photo (2 total, 1 not PUBLIC). Same owner's-call bucket.
7. Leave the contact form's honeypot exactly as-is.
8. Re-test the mobile grid resize issue with a genuine fresh-load device emulation before deciding whether it needs a fix at all.

### Homepage SEO metadata — done (2026-08-13)
`app/page.tsx` converted from a static `metadata` export (no `og:image`, no `twitter` card, no canonical, and an inconsistent description — the top-level `description` didn't match the `openGraph.description`) to `generateMetadata()`, pulling a cover image from the first featured photo (`getFeaturedPhotos()`), plus `alternates.canonical`. Added `WebSite` JSON-LD (`lib/structuredData.ts`: `buildWebSiteObject`) — deliberately **without** `SearchAction`: the gallery's search box (`GalleryView.tsx`) is client-state only, never reads a `?search=` URL param on load, so advertising a search deep-link in structured data would be inaccurate (Google could offer a sitelinks search box that doesn't actually work). Title/description unified into one shared copy reflecting the real catalog breadth: "A growing collection of photographs — Tokyo streets, Japanese festivals, and landscapes across Japan and Indonesia." `airu-porto-fe` commit `46f3db3`. `tsc --noEmit` clean. Not yet verified live.

### Photo detail page — small polish bundled with the above (2026-08-13)
Three minor items found during the earlier `/photo/[id]` investigation (§7b), not part of the blur-up/sizes/caching work, shipped together with the homepage pass:
- **Dead code removed:** `components/photo/PhotoDetailClientWrapper.tsx` wrapped `PhotoDetailClient` in a `<Suspense>` with a skeleton fallback that could never actually render — `PhotoDetailClient` is a plain client component with no async/`use()` data read, so it never suspends. `app/photo/[id]/page.tsx` now renders `PhotoDetailClient` directly; the wrapper file is deleted.
- **Mobile fullscreen affordance:** the "Click for fullscreen" hint on the hero image was `group-hover`-only, so touch devices had zero visual indication the image was tappable for the lightbox. Now always visible (subdued, bottom-anchored) below the `md` breakpoint, hover-revealed (centered) at `md` and up — same responsive pattern `PhotoCard.tsx` already uses for its own overlay. Copy changed from "Click for fullscreen" to "View fullscreen" since it now applies to both tap and click.
- **Alt text:** hero image fell back to the generic `"Photo"` when a photo had no title. Now falls back to `photo.location` (e.g. "Photograph from Kamakura") before the final generic `"Photograph by Airu"`.

---

## 9. Collections page improvements (2026-08-13)

Owner asked for a general pass on `/collections` and `/collections/[slug]`. Investigated live (browser automation against `byairu.com` + direct backend API calls) before building anything, then scoped to the UI-facing subset the owner picked: metadata, blur-up covers, sort order. Content issues (thin collections, duplicate cover photos across collections that share a tagged photo) were reported, not touched — owner's call, not code.

**Also checked and ruled out during investigation**, worth recording so it isn't re-litigated: the old 100-photo silent-cap bug (§ "Silent 100-photo cap in admin, again") does **not** affect `GET /collections/slug/:slug` — confirmed live, Kamakura Trip's full 181 photos come back uncapped, that endpoint has no `limit` param at all. And 1-/2-photo collection cards render their cover cleanly with no empty gap (flexbox naturally fills when `sidePhotos` is short) — not a bug either.

### Built
- **`app/collections/[slug]/page.tsx`**: added `generateMetadata()` — title, description (collection's own description, falling back to a photo-count sentence), `alternates.canonical`, OG + Twitter images from the collection's cover photo. Previously had no metadata export at all, so every collection page rendered the site's default `<title>` regardless of which one you were on (confirmed live pre-fix: browser tab just said "Airu Photography" everywhere). Also added `CollectionPage`/`ImageGallery` JSON-LD via a new `buildCollectionPageObject()` in `lib/structuredData.ts`, following the exact pattern `buildPhotoImageObject` already established for photo pages (same `PHOTOGRAPHER` author/creator, same `toJsonLdScript` escaping).
- **`app/collections/page.tsx`**: converted the static `metadata` export to `generateMetadata()` so it can pick a real cover image — first photo of the first collection that has one — for OG/Twitter, plus `alternates.canonical`. Same gap as the audit found (§8), now closed for this page specifically (homepage still open, see §8 item 1).
- **`components/collections/CollectionCard.tsx`**: blur-up cross-fade on the cover photo(s), same technique as `PhotoCard.tsx` (§7e/blur-up work) — reuses the thumbnail already cheap to fetch, cross-fades to the real medium image on load instead of sitting on a flat gray box. Extracted into a small internal `CoverPhoto` component since a card can show up to 3 images (main + 2 side) each needing their own `loaded` state. Combined with the existing hover-scale transform via `transition-[opacity,transform]` so both animations coexist on one element.
- **`lib/data.ts`**: `getAllCollections()` now sorts by `photoCount` descending before returning. Raw backend order was close to creation order — a 181-photo collection could sit between a 42-photo and a 2-photo one with no visible logic. This also feeds the gallery's collection filter dropdown (`GalleryView.tsx`), so that gets the same improvement for free.
- **New `lib/format.ts`**: small `pluralize(count, singular, plural?)` helper. Fixed "1 photographs" (should read "1 photograph") live in three places — `GalleryView.tsx`'s count, `CollectionView.tsx`'s count, `CollectionCard.tsx`'s count — plus the collections listing's "N collections" label for the same class of bug.

`tsc --noEmit` clean. Committed `airu-porto-fe` commit `b0ce783`. Not yet verified live — needs push + Dokploy deploy (owner pushes manually, see infra note below).

### Push automation — investigated, not viable
Owner asked about automating `git push` so they don't have to do it manually. Investigated two paths this session, both dead ends:
- `device_bash`'s egress goes through a local proxy (`localhost:3128`) enforcing a domain allowlist — confirmed via `curl -v`, explicit `X-Proxy-Error: blocked-by-allowlist` on a 403 for github.com, both over HTTPS and SSH. Not fixable from inside the session.
- The cloud sandbox (this environment, not the device bridge) *can* reach github.com over plain HTTPS — but SSH cannot get out at all, confirmed two ways: port 22 times out completely, and GitHub's port-443 SSH fallback gets caught by an HTTP-aware proxy that returns a raw `400 Bad Request` banner instead of an SSH handshake. So SSH deploy keys (generated for both `airu-porto-fe` and `airu-portfolio-be`, added to GitHub) can't actually be used for push from here — the transport itself is blocked, not the auth. GitHub's account-wide OAuth device flow is also blocked by this environment's own network policy (explicit error: "sessions are bound to their configured repositories... use repository-scoped endpoints"), and HTTPS push needs a token, which isn't something Claude accepts from the user regardless of scope.
- Net: no automated-push path currently available from this session. `git push` stays a manual step after each commit. If picked back up later, the realistic option is a GitHub Action on the repo (owner's own automation, no credential ever touches Claude) rather than anything from this side.

### Execution plan
1. Build against **local dev**, review before deploy — same pattern as §7.
2. Owner reviews locally, pushes manually (see push-automation note above), Dokploy deploys.
3. Once live: verify `/collections` and a couple of `/collections/[slug]` pages via `curl`/view-source for the new meta tags, and a visual check that blur-up covers cross-fade correctly on the listing page.
