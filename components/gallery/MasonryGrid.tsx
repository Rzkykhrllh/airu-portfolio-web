'use client';

import { motion } from 'framer-motion';
import { Photo } from '@/types';
import PhotoCard from './PhotoCard';

interface MasonryGridProps {
  photos: Photo[];
}

export default function MasonryGrid({ photos }: MasonryGridProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
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
      className="columns-1 md:columns-2 lg:columns-3 2xl:columns-4 gap-0 space-y-0"
    >
      {photos.map((photo, index) => (
        <motion.div
          key={photo.id}
          variants={itemVariants}
          className="break-inside-avoid mb-0"
        >
          <PhotoCard photo={photo} priority={index < 4} />
        </motion.div>
      ))}
    </motion.div>
  );
}
