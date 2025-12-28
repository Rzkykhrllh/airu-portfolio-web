import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  getPhotoById,
  getAllPhotos,
  getNextPhoto,
  getPreviousPhoto,
} from '@/lib/data';

interface PhotoPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateStaticParams() {
  const photos = await getAllPhotos();
  return photos.map((photo) => ({
    id: photo.id,
  }));
}

export default async function PhotoPage({ params }: PhotoPageProps) {
  const { id } = await params;
  const photo = await getPhotoById(id);

  if (!photo) {
    notFound();
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link
        href="/"
        className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-8 inline-block"
      >
        ← Back to Gallery
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
        {/* Photo */}
        <div className="lg:col-span-2">
          <div className="relative w-full bg-gray-200 dark:bg-gray-900 rounded-lg overflow-hidden">
            <Image
              src={photo.src.full}
              alt={photo.title || 'Photo'}
              width={1200}
              height={1200 * photo.aspectRatio}
              className="w-full h-auto"
              priority
            />
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center mt-6">
            {/* {prevPhoto ? (
              <Link
                href={`/photo/${prevPhoto.id}`}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                ← Previous
              </Link>
            ) : (
              <div />
            )}
            {nextPhoto ? (
              <Link
                href={`/photo/${nextPhoto.id}`}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Next →
              </Link>
            ) : (
              <div />
            )} */}
          </div>
        </div>

        {/* Metadata */}
        <div className="space-y-6">
          {photo.title && (
            <div>
              <h1 className="text-3xl font-bold mb-2">{photo.title}</h1>
              {photo.featured && (
                <span className="inline-flex items-center text-sm text-yellow-500 dark:text-yellow-400">
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Featured
                </span>
              )}
            </div>
          )}

          {photo.description && (
            <div>
              <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                DESCRIPTION
              </h2>
              <p className="text-gray-700 dark:text-gray-300">{photo.description}</p>
            </div>
          )}

          {photo.location && (
            <div>
              <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                LOCATION
              </h2>
              <p className="text-gray-700 dark:text-gray-300">{photo.location}</p>
            </div>
          )}

          {photo.capturedAt && (
            <div>
              <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                CAPTURED
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                {new Date(photo.capturedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          )}

          {photo.exif && (
            <div>
              <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                CAMERA INFO
              </h2>
              <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                {photo.exif.camera && <p>Camera: {photo.exif.camera}</p>}
                {photo.exif.lens && <p>Lens: {photo.exif.lens}</p>}
                {photo.exif.aperture && <p>Aperture: {photo.exif.aperture}</p>}
                {photo.exif.shutter && <p>Shutter: {photo.exif.shutter}</p>}
                {photo.exif.iso && <p>ISO: {photo.exif.iso}</p>}
              </div>
            </div>
          )}

          {photo.tags.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">TAGS</h2>
              <div className="flex flex-wrap gap-2">
                {photo.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {photo.collections.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                COLLECTIONS
              </h2>
              <div className="space-y-2">
                {photo.collections.map((slug) => (
                  <Link
                    key={slug}
                    href={`/collections/${slug}`}
                    className="block text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    {slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
