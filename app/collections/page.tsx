import { getAllCollections, getPhotosByCollection } from '@/lib/data';
import CollectionGrid from '@/components/collections/CollectionGrid';

export default function CollectionsPage() {
  const collections = getAllCollections();

  // Get first 3 photos for each collection
  const collectionPhotos = new Map();
  collections.forEach((collection) => {
    const photos = getPhotosByCollection(collection.slug).slice(0, 3);
    collectionPhotos.set(collection.slug, photos);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-2">Collections</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Curated sets of photographs organized by theme and location
        </p>
      </div>
      <CollectionGrid collections={collections} collectionPhotos={collectionPhotos} />
    </div>
  );
}
