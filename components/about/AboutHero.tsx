'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { Photo } from '@/types';

// §7c fix: see the matching comment in components/gallery/MasonryGrid.tsx —
// same module-level "already animated this session" flag, so navigating back
// to /about doesn't replay the entrance stagger from scratch.
let hasAnimatedOnce = false;

interface AboutHeroProps {
  photo?: Photo;
}

export default function AboutHero({ photo }: AboutHeroProps) {
  const shouldReduce = useReducedMotion();
  const skipEntrance = hasAnimatedOnce;

  useEffect(() => {
    hasAnimatedOnce = true;
  }, []);

  const container = {
    hidden: {},
    visible: { transition: { staggerChildren: shouldReduce ? 0 : 0.12 } },
  };

  const item = {
    hidden: { opacity: 0, y: shouldReduce ? 0 : 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: shouldReduce ? 0 : 0.6, ease: [0.22, 1, 0.36, 1] },
    },
  };

  return (
    <motion.div
      initial={skipEntrance ? false : 'hidden'}
      animate="visible"
      variants={container}
      className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-16 items-center py-12 lg:py-16"
    >
      {photo && (
        <motion.div variants={item} className="md:col-span-5">
          <div className="relative aspect-[4/5] w-full max-w-sm mx-auto md:mx-0 overflow-hidden bg-gray-100 dark:bg-gray-900">
            <Image
              src={photo.src.medium}
              alt={photo.title || 'Airu'}
              fill
              priority
              sizes="(max-width: 768px) 60vw, 25vw"
              className="object-cover"
            />
          </div>
        </motion.div>
      )}

      <div className="md:col-span-7 max-w-xl">
        <motion.p
          variants={item}
          className="text-4xl sm:text-5xl italic text-gray-900 dark:text-white mb-2"
          style={{ fontFamily: 'var(--font-cormorant), serif', fontWeight: 500 }}
        >
          Hi, I'm Airu.
        </motion.p>
        <motion.p variants={item} className="text-xs text-gray-400 dark:text-gray-500 mb-6">
          Tokyo-based photographer · Fujifilm X-S20
        </motion.p>

        <motion.div variants={item} className="space-y-4 text-gray-700 dark:text-gray-300 leading-relaxed">
          <p>
            Through my camera, I try to preserve simple scenes, quiet details, and moments
            that feel meaningful in everyday life. I explore streets, landscapes, travel
            scenes, and portraits across Japan and beyond.
          </p>
          <p>Open for commercial work, editorial projects, and collaborations.</p>
        </motion.div>
      </div>
    </motion.div>
  );
}
