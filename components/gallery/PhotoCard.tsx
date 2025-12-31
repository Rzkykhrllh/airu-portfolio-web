'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Photo } from '@/types';

interface PhotoCardProps {
  photo: Photo;
  priority?: boolean;
}

export default function PhotoCard({ photo, priority = false }: PhotoCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Get first 3 collections
  const displayCollections = photo.collections.slice(0, 3);

  // Only enable hover on devices that support hover (desktop)
  const handleMouseEnter = () => {
    if (window.matchMedia('(hover: hover)').matches) {
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    if (window.matchMedia('(hover: hover)').matches) {
      setIsHovered(false);
    }
  };

  return (
    <Link href={`/photo/${photo.id}`} className="block relative group w-full">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="relative overflow-hidden bg-gray-900 w-full"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <Image
          src={photo.src.medium}
          alt={photo.title || 'Photo'}
          width={1600}
          height={1600}
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="w-full h-auto"
          priority={priority}
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwABmQAAAA"
        />

        {/* Featured Badge - Top Right (Always visible on all devices) */}
        {photo.featured && (
          <div className="absolute top-3 right-3 z-10">
            <svg
              className="w-5 h-5 md:w-6 md:h-6 text-yellow-400 drop-shadow-lg"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
        )}
      </motion.div>
    </Link>
  );
}
