import { getAllCollections } from "@/lib/data";
import CollectionGrid from "@/components/collections/CollectionGrid";
import { SITE_URL } from "@/lib/config";
import { photoYear } from "@/lib/format";
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

const TITLE = 'Collections — Airu Photography';
const DESCRIPTION =
  'Trip-by-trip photo collections — from Sanja Matsuri to quiet mountain towns across Japan and Indonesia.';

export async function generateMetadata(): Promise<Metadata> {
  const collections = await getAllCollections();
  // Cover image: first photo of the first (now biggest, per the sort in
  // getAllCollections) collection that actually has one.
  const cover = collections.find((c) => c.photos?.[0])?.photos?.[0];
  const pageUrl = `${SITE_URL}/collections`;

  return {
    title: TITLE,
    description: DESCRIPTION,
    alternates: { canonical: pageUrl },
    openGraph: {
      title: TITLE,
      description: DESCRIPTION,
      url: pageUrl,
      type: 'website',
      ...(cover ? { images: [{ url: cover.src.medium }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: TITLE,
      description: DESCRIPTION,
      ...(cover ? { images: [cover.src.medium] } : {}),
    },
  };
}

export default async function CollectionsPage() {
  const allCollections = await getAllCollections();
  const collections = allCollections.filter((c) => c.photoCount > 0);

  // Archive span for the eyebrow, from every visible photo across collections.
  const years = collections
    .flatMap((c) => c.photos || [])
    .map(photoYear)
    .filter((y): y is number => y !== null);
  const span =
    years.length === 0
      ? null
      : Math.min(...years) === Math.max(...years)
        ? `${Math.min(...years)}`
        : `${Math.min(...years)} / ${Math.max(...years)}`;

  const eyebrow = 'text-[0.6875rem] uppercase tracking-[0.24em] text-neutral-500 dark:text-neutral-400 tabular-nums';

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
      <header className="pt-16 pb-16 md:pt-24 md:pb-24 lg:pb-28">
        <p className={eyebrow}>
          The photographic archive
          {span && (
            <>
              <span className="mx-3" aria-hidden="true">—</span>
              {span}
            </>
          )}
        </p>
        <div className="mt-6 flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
          <h1 className="font-display font-normal text-[3.5rem] sm:text-7xl lg:text-[5.5rem] leading-[0.95] tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
            Collections.
          </h1>
          {collections.length > 0 && (
            <span className={`${eyebrow} pb-2`}>
              {String(collections.length).padStart(3, '0')}{' '}
              {collections.length === 1 ? 'collection' : 'collections'}
            </span>
          )}
        </div>
        <p className="mt-5 text-base md:text-lg text-neutral-500 dark:text-neutral-400">
          People, places, and quiet moments collected along the way.
        </p>
      </header>

      {collections.length > 0 ? (
        <CollectionGrid collections={collections} />
      ) : (
        <p className="py-24 font-display italic text-2xl text-neutral-500">Nothing here yet.</p>
      )}
    </div>
  );
}
