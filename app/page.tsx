import { getAllPhotos } from '@/lib/data';
import MasonryGrid from '@/components/gallery/MasonryGrid';

export default function HomePage() {
  const photos = getAllPhotos();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Gallery</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Explore {photos.length} photographs from around the world
        </p>
      </div>
      <MasonryGrid photos={photos} />
    </div>
  );
}
