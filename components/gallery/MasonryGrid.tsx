'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Photo } from '@/types';
import PhotoCard from './PhotoCard';

interface MasonryGridProps {
  photos: Photo[];
  collectionSlug?: string;
}

export default function MasonryGrid({ photos, collectionSlug }: MasonryGridProps) {
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
      // 1→2→3→4 columns: mobile, tablet, desktop, wide
      className="columns-1 md:columns-2 lg:columns-3 gap-0"
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
