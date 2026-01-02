'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Collection, Photo } from '@/types';

interface CollectionCardProps {
  collection: Collection;
  photos: Photo[];
}

export default function CollectionCard({
  collection,
  photos,
}: CollectionCardProps) {
  // Use photos[0] as cover photo if available
  const mainPhoto = photos?.[0];
  const sidePhotos = photos?.slice(1, 3) || [];
  const hasSidePhotos = sidePhotos.length > 0;

  return (
    <Link href={`/collections/${collection.slug}`} className="block">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        whileHover={{ y: -8 }}
        transition={{ duration: 0.3 }}
        className="space-y-4"
      >
        {/* Image Grid - 3 photos: 1 large left, 2 small right */}
        {/* Fixed aspect ratio 4:3 for consistent card sizes */}
        <div className="relative w-full rounded-lg overflow-hidden" style={{ aspectRatio: '4/3' }}>
          <div className="absolute inset-0 flex gap-1">
            {/* Main photo - left side, larger (2/3 width) */}
            <div className="relative flex-[2] h-full">
              {mainPhoto ? (
                <Image
                  src={mainPhoto.src.medium}
                  alt={mainPhoto.title || collection.title}
                  fill
                  sizes="(max-width: 768px) 66vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-300 dark:bg-gray-700" />
              )}
            </div>

            {/* Side photos - right side, stacked, smaller (1/3 width) */}
            {hasSidePhotos && (
              <div className="flex flex-col gap-1 flex-1 h-full">
                {sidePhotos.map((photo) => (
                  <div key={photo.id} className="relative flex-1">
                    <Image
                      src={photo.src.medium}
                      alt={photo.title || collection.title}
                      fill
                      sizes="(max-width: 768px) 33vw, (max-width: 1024px) 16vw, 12vw"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Title */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white transition-colors line-clamp-2">
            {collection.title}
          </h3>
        </div>
      </motion.div>
    </Link>
  );
}
