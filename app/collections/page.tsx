import { getAllCollections } from "@/lib/data";
import CollectionGrid from "@/components/collections/CollectionGrid";
import { Photo } from "@/types";
import { Metadata } from 'next';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Collections - Photography Portfolio',
  description: 'Browse curated photography collections organized by theme and location. Discover landscapes, portraits, urban scenes, and architectural photography.',
  openGraph: {
    title: 'Photography Collections',
    description: 'Curated photography collections organized by theme',
    type: 'website',
  },
};

export default async function CollectionsPage() {
  const collections = await getAllCollections();
  const collectionPhotos = new Map<string, Photo[]>();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-2">Collections</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Curated sets of photographs organized by theme and location
        </p>
      </div>
      <CollectionGrid
        collections={collections}
        collectionPhotos={collectionPhotos}
      />
    </div>
  );
}
