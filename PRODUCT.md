# Product

## Register

product

## Users

Solo operator: Rizky (airu), a photographer who built and runs this portfolio himself. The admin panel (`/admin/*`) has exactly one user — the site owner — managing his own photo library and collections. No multi-tenant concerns, no permission tiers, no onboarding-for-strangers flows. Sessions happen in short, task-focused bursts (upload a shoot, reorder a collection, toggle visibility before sharing a link).

The public site (`/`, `/collections`, `/photo/*`) is for visitors browsing the portfolio — casual viewers and potential clients evaluating the work.

## Product Purpose

A photography portfolio with two surfaces:
- **Public gallery** (brand-register concern, out of scope for admin work): masonry gallery, collections, photo detail pages — the showcase visitors see.
- **Admin panel** (product-register, where most ongoing work happens): CRUD for photos and collections — upload, tag, set visibility/featured status, organize into collections, reorder.

Success for the admin panel = the owner can manage his growing photo library (100+ photos and counting) quickly, without fighting the UI. Speed and clarity beat visual flourish here.

## Brand Personality

Admin panel: utilitarian, fast, no-nonsense. It does not need to mirror the public site's minimal/dark editorial aesthetic (edge-to-edge photos, no border radius) — that treatment is a deliberate choice for the photography showcase, not a mandate for internal tooling. The admin can look like a plain, clean admin panel (cards, rounded corners, standard form controls) as long as it's efficient.

Public site personality (for reference, not the admin's job to match): modern, editorial, photography-first — the images carry the brand, chrome stays quiet.

## Anti-references

Admin panel should avoid: dense enterprise-SaaS dashboards with heavy chrome, multi-level nav, or features built for teams/roles that don't exist here (it's a single-user tool). Avoid decorative flourish that slows down the core loop of "find a photo, change something about it, move on."

## Design Principles

1. **Optimize for the single returning user, not first impressions.** No onboarding, no explaining what buttons do — the owner already knows this tool.
2. **Bulk/scan-ability over individual polish.** Most admin tasks touch many photos at once (reorder a shoot, tag a batch) — layouts should favor scanning and quick action over showcasing any single photo.
3. **Utility over brand consistency.** The admin doesn't need to "look like" the portfolio brand; it needs to get out of the way.
4. **Direct manipulation where possible.** Prefer inline controls (toggle, drag) over navigating to detail pages/modals for routine edits — already the direction taken with quick-action toggles and drag-to-reorder.
5. **Destructive actions get friction; routine ones don't.** Delete/remove should confirm; visibility/featured toggles and reordering should be instant and optimistic.

## Accessibility & Inclusion

Single known user (site owner) — no specific accommodation requirements have been raised. Standard baseline applies: sufficient color contrast, keyboard-operable controls, visible focus states, and drag-and-drop interactions (photo reordering) should have a non-drag fallback path where feasible given it's a single-operator tool.
