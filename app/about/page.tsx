import { Metadata } from "next";
import Link from "next/link";
import { getPhotoById, getGalleryPage, getAllCollections } from "@/lib/data";
import { photoYear } from "@/lib/format";
import { buildPhotographerProfilePage, toJsonLdScript } from "@/lib/structuredData";
import AboutHero from "@/components/about/AboutHero";
import ContactForm from "@/components/about/ContactForm";

const PORTRAIT_PHOTO_ID = "fb96d8e1-e8b1-40cd-b2c0-8f301b8cbb8e";

// Force dynamic rendering — this page now fetches from the backend
// (portrait photo), which isn't reachable at build time in this deploy
// setup (same reason app/page.tsx, app/photo/[id]/page.tsx, and
// app/collections/page.tsx are all force-dynamic already).
export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const portrait = await getPhotoById(PORTRAIT_PHOTO_ID);

  return {
    title: "About — Airu Photography",
    description: "Airu — Tokyo-based photographer. Shooting with Fujifilm X-S20.",
    openGraph: {
      title: "About — Airu Photography",
      description: "Tokyo-based photographer capturing everyday moments.",
      type: "profile",
      images: portrait ? [{ url: portrait.src.medium }] : undefined,
    },
  };
}

const EMAIL = "m.rizky.khairullah@gmail.com";

// "What I shoot" — each row browses a real tag (counts are live).
const PRACTICE = [
  { name: "Streets", tag: "Street Photography", note: "Everyday life in passing" },
  { name: "Portraits", tag: "Portrait", note: "People met along the way" },
  { name: "Landscapes", tag: "Landscape", note: "Mountains, coasts, quiet towns" },
  { name: "Festivals", tag: "Festival", note: "Matsuri and celebrations" },
];

const label = "text-[0.6875rem] uppercase tracking-[0.22em] tabular-nums text-neutral-500 dark:text-neutral-400";

export default async function AboutPage() {
  const [portrait, gallery, collections, tagCounts] = await Promise.all([
    getPhotoById(PORTRAIT_PHOTO_ID),
    getGalleryPage(1).catch(() => null),
    getAllCollections(),
    Promise.all(
      PRACTICE.map((p) =>
        getGalleryPage(1, { tag: p.tag })
          .then((r) => r.total)
          .catch(() => 0)
      )
    ),
  ]);
  const jsonLd = buildPhotographerProfilePage(portrait?.src.medium);

  // Honest numbers only — each stat is dropped if its data didn't load.
  const visibleCollections = collections.filter((c) => c.photoCount > 0);
  const years = visibleCollections
    .flatMap((c) => c.photos || [])
    .map(photoYear)
    .filter((y): y is number => y !== null);
  const stats = [
    gallery?.total ? `${gallery.total} photographs` : null,
    visibleCollections.length ? `${visibleCollections.length} collections` : null,
    years.length
      ? Math.min(...years) === Math.max(...years)
        ? `${Math.min(...years)}`
        : `${Math.min(...years)}–${Math.max(...years)}`
      : null,
  ].filter((s): s is string => Boolean(s));

  const practice = PRACTICE.map((p, i) => ({ ...p, count: tagCounts[i] })).filter((p) => p.count > 0);

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLdScript(jsonLd) }}
      />

      <AboutHero photo={portrait} stats={stats} />

      {/* What I shoot */}
      {practice.length > 0 && (
        <section className="pt-28 md:pt-40">
          <p className={label}>What I shoot</p>
          <ul className="mt-8 md:mt-10 grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-10 md:gap-y-14">
            {practice.map((p, i) => (
              <li key={p.tag}>
                <Link href={`/tags/${encodeURIComponent(p.tag)}`} className="group block">
                  <span className={label}>
                    {String(i + 1).padStart(2, "0")}
                    <span className="mx-2.5" aria-hidden="true">—</span>
                    {p.count} photographs
                  </span>
                  <span className="mt-3 flex items-baseline gap-4 font-display text-4xl md:text-5xl leading-none text-neutral-900 dark:text-neutral-100">
                    {p.name}
                    <svg
                      className="w-5 h-5 shrink-0 text-neutral-400 dark:text-neutral-500 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-neutral-900 dark:group-hover:text-neutral-100 motion-reduce:transition-none"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1}
                      aria-hidden="true"
                    >
                      <path d="M4 12L12 4M5.5 4H12v6.5" />
                    </svg>
                  </span>
                  <span className="mt-3 block text-base text-neutral-500 dark:text-neutral-400">{p.note}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Work with me — the one contact section on this page */}
      <section id="contact" className="pt-28 md:pt-40 grid grid-cols-1 lg:grid-cols-12 gap-x-10 gap-y-12">
        <div className="lg:col-span-5">
          <p className={label}>Work with me</p>
          <h2 className="mt-6 font-display font-normal text-5xl md:text-6xl leading-[0.95] text-neutral-900 dark:text-neutral-100">
            Let&apos;s make something.
          </h2>
          <p className="mt-6 max-w-md text-base md:text-lg leading-relaxed text-neutral-500 dark:text-neutral-400">
            Open for commercial work, editorial projects, and collaborations. Tell me a little about what you
            have in mind.
          </p>
          <a
            href={`mailto:${EMAIL}`}
            className="mt-8 inline-block text-base text-neutral-900 dark:text-neutral-100 underline decoration-neutral-300 dark:decoration-neutral-600 underline-offset-4 hover:decoration-current transition-colors"
          >
            {EMAIL}
          </a>
        </div>
        <div className="lg:col-span-6 lg:col-start-7 lg:pt-2">
          <ContactForm />
        </div>
      </section>
    </div>
  );
}
