'use client';

import { useEffect, useMemo, useRef } from 'react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { Photo } from '@/types';
import PhotoCard from './PhotoCard';
import { useViewportTier } from '@/hooks/useViewportTier';

// §7c: module-level so it survives client-side navigation (resets only on
// hard reload) — skips the entrance animation replaying on every back/forward.
let hasAnimatedOnce = false;

// Custom breakpoints, independent per-tier column choice (a tablet's 2-vs-3
// preference says nothing about desktop's).
export type ColumnPrefs = {
  sm: 1 | 2; // 425–767px
  md: 2 | 3; // 768–1023px
  lg: 2 | 3 | 4; // 1024px+
};

export const DEFAULT_COLUMN_PREFS: ColumnPrefs = { sm: 2, md: 3, lg: 3 };

// Spelled out literally so Tailwind's JIT scanner picks them up (`columns-${n}` at runtime wouldn't generate).
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
  // Real (not placeholder) aspect ratios ready yet? See lib/resolveAspectRatio.ts. Defaults true so unwired callers don't get stuck on the fallback.
  ratiosResolved?: boolean;
}

// §7d: greedily assigns each photo to the shortest column, estimating height
// from photo.aspectRatio (see lib/resolveAspectRatio.ts for why that has to
// be real data, not a placeholder). Stable for any prefix of `photos`, so
// infinite-scroll appends never move already-placed photos — unlike CSS
// `columns-N` (column-fill: balance), which used to re-flow everything.
function packIntoColumns(photos: Photo[], numColumns: number): Photo[][] {
  const heights = new Array(numColumns).fill(0);
  const cols: Photo[][] = Array.from({ length: numColumns }, () => []);

  for (const photo of photos) {
    let shortest = 0;
    for (let i = 1; i < numColumns; i++) {
      if (heights[i] < heights[shortest]) shortest = i;
    }
    cols[shortest].push(photo);
    heights[shortest] += photo.aspectRatio || 1;
  }

  return cols;
}

function resolveColumnCount(tier: 'xs' | 'sm' | 'md' | 'lg', columns: ColumnPrefs): number {
  if (tier === 'xs') return 1;
  return columns[tier];
}

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04 } },
};

const reducedContainerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0 } },
};

function itemVariants(shouldReduce: boolean): Variants {
  return {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: shouldReduce ? 0 : 0.5,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };
}

export default function MasonryGrid({
  photos,
  collectionSlug,
  columns = DEFAULT_COLUMN_PREFS,
  ratiosResolved = true,
}: MasonryGridProps) {
  const shouldReduce = useReducedMotion();
  const tier = useViewportTier();

  // Captured once per mount, not read live — avoids catching the flag mid-flip
  // from the effect below on the re-render right after mount.
  const skipEntranceRef = useRef(hasAnimatedOnce);
  const skipEntrance = skipEntranceRef.current;

  useEffect(() => {
    hasAnimatedOnce = true;
  }, []);

  const priorityIds = useMemo(() => new Set(photos.slice(0, 8).map((p) => p.id)), [photos]);
  const variants = shouldReduce ? reducedContainerVariants : containerVariants;
  const childVariants = itemVariants(Boolean(shouldReduce));

  // Fall back to CSS `columns-N` until tier is known (avoids hydration
  // mismatch) and until ratiosResolved (avoids packing with placeholder
  // ratios and re-flowing visibly once real ones arrive).
  if (tier === null || !ratiosResolved) {
    const columnsClassName = `columns-1 ${smClasses[columns.sm]} ${mdClasses[columns.md]} ${lgClasses[columns.lg]} gap-0`;
    return (
      <motion.div
        initial={skipEntrance ? false : 'hidden'}
        animate="visible"
        variants={variants}
        className={columnsClassName}
      >
        {photos.map((photo) => (
          <motion.div key={photo.id} variants={childVariants} className="break-inside-avoid">
            <PhotoCard photo={photo} priority={priorityIds.has(photo.id)} collectionSlug={collectionSlug} />
          </motion.div>
        ))}
      </motion.div>
    );
  }

  const numColumns = resolveColumnCount(tier, columns);
  const packedColumns = packIntoColumns(photos, numColumns);

  return (
    <motion.div initial={skipEntrance ? false : 'hidden'} animate="visible" variants={variants} className="flex items-start">
      {packedColumns.map((colPhotos, colIndex) => (
        <div key={colIndex} className="flex flex-col" style={{ width: `${100 / numColumns}%` }}>
          {colPhotos.map((photo) => (
            <motion.div key={photo.id} variants={childVariants}>
              <PhotoCard photo={photo} priority={priorityIds.has(photo.id)} collectionSlug={collectionSlug} />
            </motion.div>
          ))}
        </div>
      ))}
    </motion.div>
  );
}
