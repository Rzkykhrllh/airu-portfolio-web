import Image from 'next/image';
import Link from 'next/link';
import { Photo } from '@/types';

interface RelatedPhotosProps {
  photos: Photo[];
  heading: string;
}

export default function RelatedPhotos({ photos, heading }: RelatedPhotosProps) {
  if (photos.length === 0) return null;

  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">{heading}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {photos.map((photo) => (
          <Link
            key={photo.id}
            href={`/photo/${photo.id}`}
            className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-900 group"
          >
            <Image
              src={photo.src.thumbnail}
              alt={photo.title || 'Photograph by Airu'}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
              className="object-cover transition-transform duration-300 ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            />
            {photo.title && (
              <div
                className="absolute inset-x-0 bottom-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 motion-reduce:duration-0 pointer-events-none"
                style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 70%)' }}
              >
                <p className="px-2.5 pb-2 pt-6 text-xs text-white line-clamp-1">{photo.title}</p>
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
