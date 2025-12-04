'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Collection, Photo } from '@/types';

interface CollectionCardProps {
  collection: Collection;
  coverPhoto: Photo;
}

export default function CollectionCard({
  collection,
  coverPhoto,
}: CollectionCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link href={`/collections/${collection.slug}`} className="block group">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="relative overflow-hidden bg-gray-900 aspect-[4/3]"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Image
          src={coverPhoto.src.medium}
          alt={collection.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent hidden md:flex items-end p-6"
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{
              opacity: isHovered ? 1 : 0,
              y: isHovered ? 0 : 10,
            }}
            transition={{ duration: 0.2, delay: 0.05 }}
            className="text-white w-full"
          >
            <h3 className="text-xl font-bold mb-2">{collection.title}</h3>
            {collection.description && (
              <p className="text-sm text-gray-300 mb-3 line-clamp-2">
                {collection.description}
              </p>
            )}
            <p className="text-xs text-gray-400">
              {collection.photoCount} {collection.photoCount === 1 ? 'photo' : 'photos'}
            </p>
          </motion.div>
        </motion.div>

        {/* Mobile overlay (always visible) */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent md:hidden flex items-end p-4">
          <div className="text-white w-full">
            <h3 className="text-lg font-bold mb-1">{collection.title}</h3>
            <p className="text-xs text-gray-400">
              {collection.photoCount} {collection.photoCount === 1 ? 'photo' : 'photos'}
            </p>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
