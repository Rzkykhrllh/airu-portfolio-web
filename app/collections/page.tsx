import { getAllCollections, getPhotosByCollection } from '@/lib/data';
import CollectionGrid from '@/components/collections/CollectionGrid';

// Feature flag - set to true to hide collections feature
const HIDE_COLLECTIONS = true;

export default function CollectionsPage() {
  if (HIDE_COLLECTIONS) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
        <div className="text-center px-4">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4">
            Coming Soon
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            Collections feature is currently under development
          </p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
          >
            ← Back to Gallery
          </a>
        </div>
      </div>
    );
  }

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
