'use client';

import { useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Collection } from '@/types';
import CollectionCard from './CollectionCard';

// §7c: same module-level flag pattern as MasonryGrid.tsx — skips replaying
// the entrance animation on back/forward navigation.
let hasAnimatedOnce = false;

interface CollectionGridProps {
  collections: Collection[];
}

// Two-column editorial layout with the right column pushed down so the
// columns sit staggered. The offset lives on a plain wrapper (framer-motion
// owns `transform` on the motion.div for its entrance y), and the grid's
// bottom padding absorbs it.
export default function CollectionGrid({ collections }: CollectionGridProps) {
  const shouldReduce = useReducedMotion();
  // Ref, not a live read — see MasonryGrid.tsx for why.
  const skipEntrance = useRef(hasAnimatedOnce).current;

  useEffect(() => {
    hasAnimatedOnce = true;
  }, []);

  return (
    <motion.div
      initial={skipEntrance ? false : 'hidden'}
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: shouldReduce ? 0 : 0.08 } },
      }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 lg:gap-x-10 gap-y-16 md:gap-y-20 md:pb-24"
    >
      {collections.map((collection, i) => (
        <div
          key={collection.slug}
          // 2 cols: right column drops. 3 cols: middle column drops.
          className={`${i % 2 === 1 ? 'md:translate-y-24' : ''} ${i % 3 === 1 ? 'lg:translate-y-24' : 'lg:translate-y-0'}`}
        >
          <motion.div
            variants={{
              hidden: { opacity: 0, y: shouldReduce ? 0 : 20 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { duration: shouldReduce ? 0 : 0.8, ease: [0.22, 1, 0.36, 1] },
              },
            }}
          >
            <CollectionCard collection={collection} index={i} priority={i < 3} />
          </motion.div>
        </div>
      ))}
    </motion.div>
  );
}
