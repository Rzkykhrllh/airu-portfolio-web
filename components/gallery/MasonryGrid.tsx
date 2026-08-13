'use client';

import { useEffect, useMemo, useRef } from 'react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { Photo } from '@/types';
import PhotoCard from './PhotoCard';
import { useViewportTier } from '@/hooks/useViewportTier';

// §7c fix: module-level (not React state) "has this grid already animated in
// this session" flag. Next.js App Router fully remounts page-level content
// like this on every navigation — including navigating back to a page you
// already saw seconds ago — which replays the staggered fade-in from scratch
// even though the photos are already browser-cached and would otherwise
// paint instantly. Module scope persists across client-side navigations
// within the same session and only resets on a true hard reload, which is
// exactly "animate once per session, not on every back/forward".
let hasAnimatedOnce = false;

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
// get generated, so every possible value is spelled out here instead. Only
// used for the pre-hydration fallback render below (§7d) — once the live
// viewport tier is known, layout switches to JS-computed columns instead.
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
  // Whether every photo currently in `photos` has had its *real* aspect
  // ratio resolved yet (see lib/resolveAspectRatio.ts) — packIntoColumns
  // reads `photo.aspectRatio`, so packing before this is true would place
  // photos using the placeholder ratio, then need to re-place them once
  // real data arrives (a second, avoidable shift). Defaults to `true` so
  // callers that don't wire this up (RelatedPhotos, currently — a small
  // fixed list where the placeholder-ratio imbalance is negligible) keep
  // today's behavior rather than getting stuck on the fallback forever.
  ratiosResolved?: boolean;
}

// §7d fix: native CSS `columns-N` (multi-column layout) defaults to
// `column-fill: balance`, which re-flows and redistributes the ENTIRE set
// of items across columns from scratch any time total content height
// changes — including every infinite-scroll page append. That full re-flow
// is what was moving already-visible photos to a different column/position;
// it isn't actually about individual images "reloading".
//
// Fixed by computing placement in JS instead of leaving it to the browser:
// greedily assign each photo (in array order) to whichever column currently
// has the smallest estimated cumulative height, using `photo.aspectRatio`
// (height/width) as a stand-in for its rendered height — no need to wait
// for the real <img> to load or measure anything in the DOM. This is stable
// for any *prefix* of `photos`: since a photo's column only depends on
// photos before it in the array, recomputing from scratch as `photos` grows
// via infinite scroll never changes where already-placed photos land. New
// photos only ever append to whichever column is shortest at that point.
//
// This estimate is only as good as `photo.aspectRatio` — see
// lib/resolveAspectRatio.ts for why that used to be a hardcoded placeholder
// (same value for every photo) and how it's resolved to the real ratio
// before a batch ever reaches this function.
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

  // Captured once per mount rather than read fresh on every render: this
  // component re-renders once more right after mount (when `tier` resolves
  // from null to a real value), and reading the module flag live at that
  // point could catch it having already flipped to `true` by the sibling
  // effect below, prematurely killing the entrance animation for a photo
  // that hasn't actually animated yet.
  const skipEntranceRef = useRef(hasAnimatedOnce);
  const skipEntrance = skipEntranceRef.current;

  useEffect(() => {
    hasAnimatedOnce = true;
  }, []);

  const priorityIds = useMemo(() => new Set(photos.slice(0, 8).map((p) => p.id)), [photos]);
  const variants = shouldReduce ? reducedContainerVariants : containerVariants;
  const childVariants = itemVariants(Boolean(shouldReduce));

  // Before the live viewport tier is known (SSR + first client paint before
  // hydration), fall back to the old CSS `columns-N` layout — identical
  // markup on the server and on the pre-hydration client render, so there's
  // no hydration mismatch, and it gives a correct-looking column count on
  // first paint without waiting on JS. This window is too short for the
  // infinite-scroll reflow bug to ever surface (nothing can have been
  // appended yet), so the fallback's balance-reflow behavior is harmless.
  //
  // Also stay on this fallback until `ratiosResolved` — tier usually
  // resolves (a synchronous matchMedia check) well before the first
  // batch's thumbnails have actually loaded over the network, and packing
  // with still-placeholder ratios would just mean doing it again, visibly,
  // moments later once the real ones arrive.
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
