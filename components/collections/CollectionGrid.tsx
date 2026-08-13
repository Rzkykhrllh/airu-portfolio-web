'use client';

import { useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Collection } from '@/types';
import CollectionCard from './CollectionCard';

// §7c fix: see the matching comment in components/gallery/MasonryGrid.tsx —
// same module-level "already animated this session" flag, so navigating back
// to /collections doesn't replay the entrance stagger from scratch.
let hasAnimatedOnce = false;

interface CollectionGridProps {
  collections: Collection[];
}

export default function CollectionGrid({ collections }: CollectionGridProps) {
  const shouldReduce = useReducedMotion();
  // Captured once per mount (see MasonryGrid.tsx for why a ref instead of
  // reading the module flag fresh every render).
  const skipEntrance = useRef(hasAnimatedOnce).current;

  useEffect(() => {
    hasAnimatedOnce = true;
  }, []);

  return (
    <motion.div
      initial={skipEntrance ? false : 'hidden'}
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: { staggerChildren: shouldReduce ? 0 : 0.06 },
        },
      }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10"
    >
      {collections.map((collection) => {
        const photos = (collection as any)["photos"] || [];
        return (
          <motion.div
            key={collection.slug}
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { duration: shouldReduce ? 0 : 0.5, ease: [0.22, 1, 0.36, 1] },
              },
            }}
          >
            <CollectionCard collection={collection} photos={photos} />
          </motion.div>
        );
      })}
    </motion.div>
  );
}
