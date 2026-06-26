import { getAllCollections } from "@/lib/data";
import CollectionGrid from "@/components/collections/CollectionGrid";
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Collections — Airu Photography',
  description: 'Photographs grouped by place, mood, and moment.',
  openGraph: {
    title: 'Collections — Airu Photography',
    description: 'Photographs grouped by place, mood, and moment.',
    type: 'website',
  },
};

export default async function CollectionsPage() {
  const collections = await getAllCollections();

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-baseline justify-between pt-10 pb-7 border-b border-gray-200 dark:border-white/10 mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
          Collections
        </h1>
        {collections.length > 0 && (
          <span className="text-sm text-gray-400 dark:text-gray-500 tabular-nums">
            {collections.length} collections
          </span>
        )}
      </div>
      <CollectionGrid collections={collections} />
    </div>
  );
}
