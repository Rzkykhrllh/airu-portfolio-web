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

  return (
    <Link href={`/photo/${photo.id}`} className="block relative group">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="relative overflow-hidden bg-gray-900"
        style={{ aspectRatio: 1 / photo.aspectRatio }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Image
          src={photo.src.medium}
          alt={photo.title || 'Photo'}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover"
          priority={priority}
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwABmQAAAA"
        />

        {/* Overlay - Desktop only */}
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
            <div className="flex items-start justify-between">
              <div>
                {photo.title && (
                  <h3 className="text-lg font-semibold mb-1">{photo.title}</h3>
                )}
                {photo.location && (
                  <p className="text-sm text-gray-300">{photo.location}</p>
                )}
                {photo.exif && (
                  <p className="text-xs text-gray-400 mt-2">
                    {photo.exif.camera} • {photo.exif.lens}
                  </p>
                )}
              </div>
              {photo.featured && (
                <svg
                  className="w-5 h-5 text-yellow-400 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              )}
            </div>
          </motion.div>
        </motion.div>

        {/* Overlay - Mobile (always visible) */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent md:hidden flex items-end p-4">
          <div className="text-white w-full">
            <div className="flex items-start justify-between">
              <div>
                {photo.title && (
                  <h3 className="text-base font-semibold mb-1">{photo.title}</h3>
                )}
                {photo.location && (
                  <p className="text-sm text-gray-300">{photo.location}</p>
                )}
              </div>
              {photo.featured && (
                <svg
                  className="w-4 h-4 text-yellow-400 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
