'use client';

import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { Photo } from '@/types';
import PhotoCard from './PhotoCard';
import { useViewportTier } from '@/hooks/useViewportTier';
import { arrived, isClaimed, isPending } from '@/lib/photoTransition';

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

// Gutter between photos (and between columns) — a small, even breathing
// space reads as a curated wall rather than an edge-to-edge feed.
const GAP = 'gap-2 sm:gap-3 lg:gap-4';
// Same spacing as a bottom margin, for the CSS-columns fallback (column-gap
// only covers horizontal spacing there).
const ITEM_MB = 'mb-2 sm:mb-3 lg:mb-4';
// Gutter height in units of column width (~12px / ~400px), so the
// shortest-column packing accounts for it.
const GAP_RATIO = 0.03;

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
    heights[shortest] += (photo.aspectRatio || 1) + GAP_RATIO;
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
  // Also skip it when arriving mid-morph: the destination card must be fully
  // visible for the "after" snapshot.
  const skipEntranceRef = useRef(hasAnimatedOnce || isPending());
  const skipEntrance = skipEntranceRef.current;

  useEffect(() => {
    hasAnimatedOnce = true;
  }, []);

  // Returning from a photo page mid-morph: once the layout is final, finish
  // the transition — unless the matching card claimed it (it finishes itself
  // after its image decodes). Child layout effects run before this one.
  const settled = tier !== null && ratiosResolved;
  useLayoutEffect(() => {
    if (settled && isPending() && !isClaimed()) arrived();
  }, [settled]);

  const priorityIds = useMemo(() => new Set(photos.slice(0, 8).map((p) => p.id)), [photos]);
  const variants = shouldReduce ? reducedContainerVariants : containerVariants;
  const childVariants = itemVariants(Boolean(shouldReduce));

  // Fall back to CSS `columns-N` until tier is known (avoids hydration
  // mismatch) and until ratiosResolved (avoids packing with placeholder
  // ratios and re-flowing visibly once real ones arrive).
  if (tier === null || !ratiosResolved) {
    const columnsClassName = `columns-1 ${smClasses[columns.sm]} ${mdClasses[columns.md]} ${lgClasses[columns.lg]} ${GAP}`;
    return (
      <motion.div
        initial={skipEntrance ? false : 'hidden'}
        animate="visible"
        variants={variants}
        className={columnsClassName}
      >
        {photos.map((photo) => (
          <motion.div key={photo.id} variants={childVariants} className={`break-inside-avoid ${ITEM_MB}`}>
            <PhotoCard photo={photo} priority={priorityIds.has(photo.id)} collectionSlug={collectionSlug} settled={false} />
          </motion.div>
        ))}
      </motion.div>
    );
  }

  const numColumns = resolveColumnCount(tier, columns);
  const packedColumns = packIntoColumns(photos, numColumns);

  return (
    <motion.div initial={skipEntrance ? false : 'hidden'} animate="visible" variants={variants} className={`flex items-start ${GAP}`}>
      {packedColumns.map((colPhotos, colIndex) => (
        <div key={colIndex} className={`flex-1 min-w-0 flex flex-col ${GAP}`}>
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
