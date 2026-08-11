# Feature Specs — Admin UX, Filters, Homepage Random Seed

Status: **draft for review** — not started. Written after auditing current FE (`airu-porto-fe`) and BE (`airu-portfolio-be`) code, including `prisma/schema.prisma`, `photo.controller.ts`, `photo.validator.ts`, and `package.json` (confirms no cache layer exists yet — see §3).

---

## 1. Admin: Modal-based Photo Management

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

## 2. Admin Photos List: Filters

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

---

## 3. Homepage: Daily Random Seed with Collection Diversity

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

---

## 4. Per-Photo SEO + Visibility Leak Fix

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

---

## 5. Admin Login Rate Limiting

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
None, beyond making sure the login form surfaces the 429 response as a readable "too many attempts, try again later" message instead of a generic error.

---

## Suggested build order
1. **Feature 1** (modal refactor) — pure frontend, no backend dependency, and you're already halfway through it. Lowest risk, finish this first.
2. **Feature 5** (rate limiting) — tiny, isolated, pure security fix with no product-behavior tradeoffs to discuss. Good to slot in whenever there's backend time, doesn't block or get blocked by anything else.
3. **Feature 4** (SEO + visibility fix) — do the backend visibility fix first (small, self-contained), then the sitemap/metadata frontend work. Independent of 1–3.
4. **Feature 2** (filters) — needs a small, well-scoped backend change (search + sort params) plus frontend wiring. Do after 1 so the admin list UI isn't being touched by two efforts at once.
5. **Feature 3** (random seed) — backend-heavy, needs the diversity bucket rule confirmed first (only open question left, cache/seed strategy is already settled above). Independent of the rest, can be done in parallel by backend while frontend does 1–2.
