import { getAllPhotos } from '@/lib/data';
import MasonryGrid from '@/components/gallery/MasonryGrid';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Gallery — Airu Photography',
  description: 'Photographs of everyday moments — Tokyo streets, landscapes, portraits.',
  openGraph: {
    title: 'Gallery — Airu Photography',
    description: 'Photographs captured along the journey.',
    type: 'website',
  },
};

export default async function HomePage() {
  const photos = await getAllPhotos();

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-baseline justify-between pt-10 pb-7 border-b border-gray-200 dark:border-white/10 mb-0">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
          Gallery
        </h1>
        {photos.length > 0 && (
          <span className="text-sm text-gray-400 dark:text-gray-500 tabular-nums">
            {photos.length} photographs
          </span>
        )}
      </div>
      <MasonryGrid photos={photos} />
    </div>
  );
}
