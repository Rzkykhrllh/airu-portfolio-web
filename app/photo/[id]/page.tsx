import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  getPhotoById,
  getAllPhotos,
  getNextPhoto,
  getPreviousPhoto,
} from '@/lib/data';
import PhotoDetailClientWrapper from '@/components/photo/PhotoDetailClientWrapper';

// Force dynamic rendering (don't pre-generate at build time)
export const dynamic = 'force-dynamic';

interface PhotoPageProps {
  params: Promise<{
    id: string;
  }>;
}

// Remove generateStaticParams - pages generated on-demand
// export async function generateStaticParams() {
//   const photos = await getAllPhotos();
//   return photos.map((photo) => ({
//     id: photo.id,
//   }));
// }

export default async function PhotoPage({ params }: PhotoPageProps) {
  const { id } = await params;
  const photo = await getPhotoById(id);

  if (!photo) {
    notFound();
  }

  const nextPhoto = await getNextPhoto(id);
  const prevPhoto = await getPreviousPhoto(id);

  return (
    <div className="min-h-screen">
      {/* Hero Image Section */}
      <div className="relative bg-gray-100 dark:bg-black">
        {/* Top Navigation Bar */}
        <div className="absolute top-0 left-0 right-0 z-10 px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link
              href="/"
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors bg-white/80 dark:bg-black/80 backdrop-blur-sm px-4 py-2 rounded-full"
            >
              ← Gallery
            </Link>

            <div className="flex items-center gap-4">
              {prevPhoto && (
                <Link
                  href={`/photo/${prevPhoto.id}`}
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors bg-white/80 dark:bg-black/80 backdrop-blur-sm px-4 py-2 rounded-full"
                >
                  ← Prev
                </Link>
              )}
              {nextPhoto && (
                <Link
                  href={`/photo/${nextPhoto.id}`}
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors bg-white/80 dark:bg-black/80 backdrop-blur-sm px-4 py-2 rounded-full"
                >
                  Next →
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Hero Image with Lightbox */}
        <PhotoDetailClientWrapper
          photo={photo}
          nextPhotoId={nextPhoto?.id}
          prevPhotoId={prevPhoto?.id}
        />
      </div>

      {/* Metadata Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        {/* Title & Featured Badge */}
        {photo.title && (
          <div className="border-b border-gray-200 dark:border-gray-800 pb-6">
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">
                {photo.title}
              </h1>
              {photo.featured && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400">
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
          </div>
        )}

        {/* Quick Info Bar */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
          {photo.location && (
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{photo.location}</span>
            </div>
          )}
          {photo.capturedAt && (
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>
                {new Date(photo.capturedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
          )}
          {photo.exif?.camera && (
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{photo.exif.camera}</span>
            </div>
          )}
        </div>

        {/* Description */}
        {photo.description && (
          <div className="prose dark:prose-invert max-w-none">
            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
              {photo.description}
            </p>
          </div>
        )}

        {/* EXIF Data - Collapsible */}
        {photo.exif && (
          <details className="group border border-gray-200 dark:border-gray-800 rounded-lg p-6">
            <summary className="cursor-pointer font-semibold text-gray-900 dark:text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Camera Settings
              </span>
              <svg className="w-5 h-5 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {photo.exif.camera && (
                <div>
                  <div className="text-gray-500 dark:text-gray-400 mb-1">Camera</div>
                  <div className="font-medium text-gray-900 dark:text-white">{photo.exif.camera}</div>
                </div>
              )}
              {photo.exif.lens && (
                <div>
                  <div className="text-gray-500 dark:text-gray-400 mb-1">Lens</div>
                  <div className="font-medium text-gray-900 dark:text-white">{photo.exif.lens}</div>
                </div>
              )}
              {photo.exif.aperture && (
                <div>
                  <div className="text-gray-500 dark:text-gray-400 mb-1">Aperture</div>
                  <div className="font-medium text-gray-900 dark:text-white">{photo.exif.aperture}</div>
                </div>
              )}
              {photo.exif.shutter && (
                <div>
                  <div className="text-gray-500 dark:text-gray-400 mb-1">Shutter</div>
                  <div className="font-medium text-gray-900 dark:text-white">{photo.exif.shutter}</div>
                </div>
              )}
              {photo.exif.iso && (
                <div>
                  <div className="text-gray-500 dark:text-gray-400 mb-1">ISO</div>
                  <div className="font-medium text-gray-900 dark:text-white">{photo.exif.iso}</div>
                </div>
              )}
            </div>
          </details>
        )}

        {/* Tags */}
        {photo.tags.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">
              TAGS
            </h2>
            <div className="flex flex-wrap gap-2">
              {photo.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Collections */}
        {photo.collections.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">
              COLLECTIONS
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {photo.collections.map((collection) => (
                <Link
                  key={collection.id}
                  href={`/collections/${collection.slug}`}
                  className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                >
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {collection.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            {prevPhoto ? (
              <Link
                href={`/photo/${prevPhoto.id}`}
                className="group flex items-center gap-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <div className="text-left">
                  <div className="text-xs text-gray-500 dark:text-gray-500">Previous</div>
                  <div className="font-medium">{prevPhoto.title || 'Untitled'}</div>
                </div>
              </Link>
            ) : (
              <div />
            )}

            {nextPhoto ? (
              <Link
                href={`/photo/${nextPhoto.id}`}
                className="group flex items-center gap-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <div className="text-right">
                  <div className="text-xs text-gray-500 dark:text-gray-500">Next</div>
                  <div className="font-medium">{nextPhoto.title || 'Untitled'}</div>
                </div>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ) : (
              <div />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
