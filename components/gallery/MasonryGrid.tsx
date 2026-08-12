'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Photo } from '@/types';
import PhotoCard from './PhotoCard';

// Custom breakpoints (not Tailwind's sm/md/lg defaults): <425px = 1 column
// always (no choice). Each tier from there has its own independent column
// preference — 425–767px picks between 1–2, 768–1023px between 2–3, 1024px+
// between 2–4 — rather than one global "zoom level" cascading through all
// of them, since e.g. someone's 2-vs-3 preference on a tablet doesn't imply
// anything about their preference on desktop.
export type ColumnPrefs = {
  sm: 1 | 2; // 425–767px
  md: 2 | 3; // 768–1023px
  lg: 2 | 3 | 4; // 1024px+
};

export const DEFAULT_COLUMN_PREFS: ColumnPrefs = { sm: 2, md: 3, lg: 3 };

// Literal class name lookups — Tailwind's JIT scanner needs the exact class
// strings present in source; `columns-${n}` built at runtime would never
// get generated, so every possible value is spelled out here instead.
const smClasses: Record<ColumnPrefs['sm'], string> = {
  1: 'min-[425px]:columns-1',
  2: 'min-[425px]:columns-2',
};
const mdClasses: Record<ColumnPrefs['md'], string> = {
  2: 'md:columns-2',
  3: 'md:columns-3',
};
const lgClasses: Record<ColumnPrefs['lg'], string> = {
  2: 'lg:columns-2',
  3: 'lg:columns-3',
  4: 'lg:columns-4',
};

interface MasonryGridProps {
  photos: Photo[];
  collectionSlug?: string;
  columns?: ColumnPrefs;
}

export default function MasonryGrid({ photos, collectionSlug, columns = DEFAULT_COLUMN_PREFS }: MasonryGridProps) {
  const shouldReduce = useReducedMotion();
  const columnsClassName = `columns-1 ${smClasses[columns.sm]} ${mdClasses[columns.md]} ${lgClasses[columns.lg]} gap-0`;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: { staggerChildren: shouldReduce ? 0 : 0.04 },
        },
      }}
      className={columnsClassName}
    >
      {photos.map((photo, index) => (
        <motion.div
          key={photo.id}
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                duration: shouldReduce ? 0 : 0.5,
                ease: [0.22, 1, 0.36, 1],
              },
            },
          }}
          className="break-inside-avoid"
        >
          <PhotoCard photo={photo} priority={index < 8} collectionSlug={collectionSlug} />
        </motion.div>
      ))}
    </motion.div>
  );
}
