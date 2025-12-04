'use client';

import { motion } from 'framer-motion';
import { Collection, Photo } from '@/types';
import CollectionCard from './CollectionCard';

interface CollectionGridProps {
  collections: Collection[];
  coverPhotos: Photo[];
}

export default function CollectionGrid({
  collections,
  coverPhotos,
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
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      {collections.map((collection) => {
        const coverPhoto = coverPhotos.find(
          (photo) => photo.id === collection.coverPhotoId
        );
        if (!coverPhoto) return null;

        return (
          <motion.div key={collection.slug} variants={itemVariants}>
            <CollectionCard collection={collection} coverPhoto={coverPhoto} />
          </motion.div>
        );
      })}
    </motion.div>
  );
}
