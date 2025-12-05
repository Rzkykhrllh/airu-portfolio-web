'use client';

import { motion } from 'framer-motion';
import { Collection, Photo } from '@/types';
import CollectionCard from './CollectionCard';

interface CollectionGridProps {
  collections: Collection[];
  collectionPhotos: Map<string, Photo[]>;
}

export default function CollectionGrid({
  collections,
  collectionPhotos,
}: CollectionGridProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
    >
      {collections.map((collection) => {
        const photos = collectionPhotos.get(collection.slug) || [];
        if (photos.length < 3) return null;

        return (
          <motion.div key={collection.slug} variants={itemVariants}>
            <CollectionCard collection={collection} photos={photos} />
          </motion.div>
        );
      })}
    </motion.div>
  );
}
