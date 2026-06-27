import { getAllPhotos } from '@/lib/data';
import GalleryView from '@/components/gallery/GalleryView';
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
      <GalleryView photos={photos} totalCount={photos.length} />
    </div>
  );
}
