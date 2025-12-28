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


  return (
    <Link href={`/collections/${collection.slug}`} className="block">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        whileHover={{ y: -8 }}
        transition={{ duration: 0.3 }}
        className="space-y-4"
      >
        {/* Image Grid */}
        <div className="grid grid-cols-2 gap-1 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-800">
          {/* Main photo - left side, full height */}
          <div className="relative row-span-2 aspect-square">
            {mainPhoto ? (
              <Image
                src={mainPhoto.src.medium}
                alt={mainPhoto.title || collection.title}
                fill
                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 25vw, 20vw"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-300 dark:bg-gray-700" />
            )}
          </div>

          {/* Side photos - right side, stacked */}
          {sidePhotos.length > 0 ? (
            sidePhotos.map((photo) => (
              <div key={photo.id} className="relative aspect-square">
                <Image
                  src={photo.src.medium}
                  alt={photo.title || collection.title}
                  fill
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 25vw, 20vw"
                  className="object-cover"
                />
              </div>
            ))
          ) : (
            // Placeholder divs to maintain grid layout
            <>
              <div className="relative aspect-square bg-gray-300 dark:bg-gray-700" />
              <div className="relative aspect-square bg-gray-300 dark:bg-gray-700" />
            </>
          )}
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
