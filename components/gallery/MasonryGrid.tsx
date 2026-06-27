'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Photo } from '@/types';
import PhotoCard from './PhotoCard';

const columnClasses: Record<number, string> = {
  2: 'columns-1 sm:columns-2 gap-0',
  3: 'columns-1 md:columns-2 lg:columns-3 gap-0',
  4: 'columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-0',
};

interface MasonryGridProps {
  photos: Photo[];
  collectionSlug?: string;
  columns?: 2 | 3 | 4;
}

export default function MasonryGrid({ photos, collectionSlug, columns = 3 }: MasonryGridProps) {
  const shouldReduce = useReducedMotion();

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: { staggerChildren: shouldReduce ? 0 : 0.04 },
        },
      }}
      className={columnClasses[columns] ?? columnClasses[3]}
    >
      {photos.map((photo, index) => (
        <motion.div
          key={photo.id}
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                duration: shouldReduce ? 0 : 0.5,
                ease: [0.22, 1, 0.36, 1],
              },
            },
          }}
          className="break-inside-avoid"
        >
          <PhotoCard photo={photo} priority={index < 8} collectionSlug={collectionSlug} />
        </motion.div>
      ))}
    </motion.div>
  );
}
