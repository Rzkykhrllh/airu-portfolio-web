'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Collection } from '@/types';
import CollectionCard from './CollectionCard';

interface CollectionGridProps {
  collections: Collection[];
}

export default function CollectionGrid({ collections }: CollectionGridProps) {
  const shouldReduce = useReducedMotion();

  return (
    <motion.div
      initial="hidden"
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
