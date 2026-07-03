'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import MasonryGrid from './MasonryGrid';
import { gridIcons, Columns } from './grid-icons';
import { getGalleryPage } from '@/lib/data';
import { Photo } from '@/types';

interface GalleryViewProps {
  initialPhotos: Photo[];
  totalCount: number;
  initialHasMore: boolean;
}

export default function GalleryView({ initialPhotos, totalCount, initialHasMore }: GalleryViewProps) {
  const [columns, setColumns] = useState<Columns>(3);
  const [mounted, setMounted] = useState(false);

  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const isFetchingRef = useRef(false);

  const { ref: sentinelRef, inView } = useInView({ rootMargin: '600px 0px' });

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('gallery-columns');
    if (saved === '2' || saved === '3' || saved === '4') {
      setColumns(Number(saved) as Columns);
    }
  }, []);

  const handleSetColumns = (n: Columns) => {
    setColumns(n);
    localStorage.setItem('gallery-columns', String(n));
  };

  const loadMore = useCallback(async () => {
    if (isFetchingRef.current || !hasMore) return;
    isFetchingRef.current = true;
    setIsLoadingMore(true);

    try {
      const nextPage = page + 1;
      const result = await getGalleryPage(nextPage);
      setPhotos((prev) => [...prev, ...result.photos]);
      setPage(nextPage);
      setHasMore(result.hasMore);
    } catch (error) {
      console.error('Failed to load more photos:', error);
    } finally {
      isFetchingRef.current = false;
      setIsLoadingMore(false);
    }
  }, [page, hasMore]);

  useEffect(() => {
    if (inView && hasMore) {
      loadMore();
    }
  }, [inView, hasMore, loadMore]);

  return (
    <>
      <div className="flex items-center justify-between pt-10 pb-7 border-b border-gray-200 dark:border-white/10 mb-0">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
          Gallery
        </h1>
        <div className="flex items-center gap-4">
          {/* Zoom controls */}
          <div className="flex items-center gap-1">
            {([2, 3, 4] as Columns[]).map((n) => (
              <button
                key={n}
                onClick={() => handleSetColumns(n)}
                aria-label={`${n} columns`}
                className={`p-1.5 rounded transition-colors ${
                  mounted && columns === n
                    ? 'text-gray-900 dark:text-white'
                    : 'text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400'
                }`}
              >
                {gridIcons[n]}
              </button>
            ))}
          </div>
          {totalCount > 0 && (
            <span className="text-sm text-gray-400 dark:text-gray-500 tabular-nums">
              {photos.length < totalCount ? `${photos.length} of ${totalCount}` : totalCount} photographs
            </span>
          )}
        </div>
      </div>
      <MasonryGrid photos={photos} columns={columns} />

      {hasMore && (
        <div ref={sentinelRef} className="flex justify-center py-12">
          {isLoadingMore && (
            <div
              className="w-5 h-5 border-2 border-gray-300 dark:border-gray-700 border-t-gray-900 dark:border-t-white rounded-full animate-spin"
              aria-label="Loading more photographs"
            />
          )}
        </div>
      )}
    </>
  );
}
