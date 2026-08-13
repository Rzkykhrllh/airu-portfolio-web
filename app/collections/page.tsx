import { getAllCollections } from "@/lib/data";
import CollectionGrid from "@/components/collections/CollectionGrid";
import { SITE_URL } from "@/lib/config";
import { pluralize } from "@/lib/format";
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

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-baseline justify-between pt-10 pb-7 border-b border-gray-200 dark:border-white/10 mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
          Collections
        </h1>
        {collections.length > 0 && (
          <span className="text-sm text-gray-400 dark:text-gray-500 tabular-nums">
            {pluralize(collections.length, 'collection')}
          </span>
        )}
      </div>
      <CollectionGrid collections={collections} />
    </div>
  );
}
