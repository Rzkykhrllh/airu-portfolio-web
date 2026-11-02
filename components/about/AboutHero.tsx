'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { Photo } from '@/types';

// §7c: same module-level flag pattern as MasonryGrid.tsx — skips replaying
// the entrance animation on back/forward navigation.
let hasAnimatedOnce = false;

const label = 'text-[0.6875rem] uppercase tracking-[0.22em] tabular-nums text-neutral-500 dark:text-neutral-400';

interface AboutHeroProps {
  photo?: Photo;
  stats: string[];
}

export default function AboutHero({ photo, stats }: AboutHeroProps) {
  const shouldReduce = useReducedMotion();
  // Ref, not a live read — see MasonryGrid.tsx for why.
  const skipEntrance = useRef(hasAnimatedOnce).current;

  useEffect(() => {
    hasAnimatedOnce = true;
  }, []);

  const container = {
    hidden: {},
    visible: { transition: { staggerChildren: shouldReduce ? 0 : 0.1 } },
  };

  const item = {
    hidden: { opacity: 0, y: shouldReduce ? 0 : 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: shouldReduce ? 0 : 0.8, ease: [0.22, 1, 0.36, 1] },
    },
  };

  return (
    <motion.div initial={skipEntrance ? false : 'hidden'} animate="visible" variants={container}>
      {/* Page header — same pattern as Gallery / Collections */}
      <header className="pt-16 pb-12 md:pt-24 md:pb-20">
        <motion.p variants={item} className={label}>
          About<span className="mx-3" aria-hidden="true">—</span>Tokyo
        </motion.p>
        <motion.div variants={item} className="mt-6 flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
          <h1 className="font-display font-normal text-[3.5rem] sm:text-7xl lg:text-[5.5rem] leading-[0.95] tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
            Hi, I&apos;m Airu.
          </h1>
          <span className={`${label} pb-2`}>Photographer · Fujifilm X-S20</span>
        </motion.div>
      </header>

      {/* Portrait + bio */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-x-10 gap-y-12">
        {photo && (
          <motion.div variants={item} className="md:col-span-6 lg:col-span-5">
            <div className="relative aspect-[4/5] w-full overflow-hidden bg-neutral-200 dark:bg-neutral-900">
              <Image
                src={photo.src.medium}
                alt={photo.title || 'Portrait of Airu'}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 40vw"
                className="object-cover"
              />
            </div>
          </motion.div>
        )}

        <motion.div
          variants={item}
          className={`md:col-span-6 ${photo ? 'lg:col-span-6 lg:col-start-7' : 'lg:col-span-8'} md:pt-1`}
        >
          <div className="space-y-6 text-xl md:text-2xl leading-[1.5] text-neutral-800 dark:text-neutral-200">
            <p>
              Through my camera, I try to preserve simple scenes, quiet details, and moments that feel
              meaningful in everyday life.
            </p>
            <p className="text-neutral-500 dark:text-neutral-400">
              I explore streets, landscapes, travel scenes, and portraits across Japan and beyond — open for
              commercial work, editorial projects, and collaborations.
            </p>
          </div>

          {stats.length > 0 && (
            <ul className="mt-12 flex flex-wrap gap-x-8 gap-y-2">
              {stats.map((s) => (
                <li key={s} className={label}>
                  {s}
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
