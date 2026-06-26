import Image from 'next/image';
import Link from 'next/link';
import { Collection, Photo } from '@/types';

interface CollectionCardProps {
  collection: Collection;
  photos: Photo[];
}

export default function CollectionCard({ collection, photos }: CollectionCardProps) {
  const mainPhoto = photos?.[0];
  const sidePhotos = photos?.slice(1, 3) || [];

  return (
    <Link href={`/collections/${collection.slug}`} className="block group">
      {/* Photo grid — no border radius, no gap */}
      <div className="relative w-full overflow-hidden rounded-lg" style={{ aspectRatio: '4/3' }}>
        <div className="absolute inset-0 flex">
          {/* Main photo — 2/3 width */}
          <div className="relative flex-[2] h-full overflow-hidden">
            {mainPhoto ? (
              <Image
                src={mainPhoto.src.medium}
                alt={mainPhoto.title || collection.title}
                fill
                sizes="(max-width: 768px) 66vw, (max-width: 1024px) 33vw, 22vw"
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transition-none"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 dark:bg-gray-800" />
            )}
          </div>

          {/* Side photos — 1/3 width, stacked */}
          {sidePhotos.length > 0 && (
            <div className="flex flex-col flex-1 h-full">
              {sidePhotos.map((photo) => (
                <div key={photo.id} className="relative flex-1 overflow-hidden">
                  <Image
                    src={photo.src.medium}
                    alt={photo.title || collection.title}
                    fill
                    sizes="(max-width: 768px) 33vw, (max-width: 1024px) 16vw, 11vw"
                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transition-none"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="pt-3 pb-1">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white leading-snug">
          {collection.title}
        </h3>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 tabular-nums">
          {collection.photoCount} photographs
        </p>
        {collection.description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed line-clamp-2">
            {collection.description}
          </p>
        )}
      </div>
    </Link>
  );
}
