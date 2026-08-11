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

export default function GalleryView({ initialPhotos, totalCount: initialTotalCount, initialHasMore }: GalleryViewProps) {
  const [columns, setColumns] = useState<Columns>(3);
  const [mounted, setMounted] = useState(false);

  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const isFetchingRef = useRef(false);

  const [showSearch, setShowSearch] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const isFirstSearchRun = useRef(true);

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
      const result = await getGalleryPage(nextPage, activeSearch);
      setPhotos((prev) => [...prev, ...result.photos]);
      setPage(nextPage);
      setHasMore(result.hasMore);
    } catch (error) {
      console.error('Failed to load more photos:', error);
    } finally {
      isFetchingRef.current = false;
      setIsLoadingMore(false);
    }
  }, [page, hasMore, activeSearch]);

  useEffect(() => {
    if (inView && hasMore) {
      loadMore();
    }
  }, [inView, hasMore, loadMore]);

  // Debounce the raw input into `activeSearch`, which actually triggers a fetch.
  useEffect(() => {
    const handle = setTimeout(() => setActiveSearch(searchInput.trim()), 300);
    return () => clearTimeout(handle);
  }, [searchInput]);

  // Re-fetch page 1 whenever the applied search term changes (including
  // clearing it back to ""), skipping the very first run since
  // initialPhotos already represents page 1 with no search applied.
  useEffect(() => {
    if (isFirstSearchRun.current) {
      isFirstSearchRun.current = false;
      return;
    }

    (async () => {
      setIsSearching(true);
      try {
        const result = await getGalleryPage(1, activeSearch);
        setPhotos(result.photos);
        setPage(1);
        setHasMore(result.hasMore);
        setTotalCount(result.total);
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setIsSearching(false);
      }
    })();
  }, [activeSearch]);

  const closeSearch = () => {
    setShowSearch(false);
    setSearchInput('');
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 pt-10 pb-7 border-b border-gray-200 dark:border-white/10 mb-0">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white shrink-0">
            Gallery
          </h1>
          {showSearch && (
            <input
              autoFocus
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Escape' && closeSearch()}
              placeholder="Search by title, location, tag..."
              className="min-w-0 flex-1 max-w-xs bg-transparent border-b border-gray-300 dark:border-gray-600 focus:border-gray-900 dark:focus:border-white outline-none text-sm py-1 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
          )}
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <button
            type="button"
            onClick={() => (showSearch ? closeSearch() : setShowSearch(true))}
            aria-label={showSearch ? 'Close search' : 'Search photographs'}
            className="p-1.5 rounded transition-colors text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white"
          >
            {showSearch ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
              </svg>
            )}
          </button>

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

      {isSearching ? (
        <div className="flex justify-center py-24">
          <div
            className="w-5 h-5 border-2 border-gray-300 dark:border-gray-700 border-t-gray-900 dark:border-t-white rounded-full animate-spin"
            aria-label="Searching"
          />
        </div>
      ) : activeSearch && photos.length === 0 ? (
        <div className="py-24 text-center text-gray-400 dark:text-gray-500">
          No photographs match &ldquo;{activeSearch}&rdquo;.
        </div>
      ) : (
        <MasonryGrid photos={photos} columns={columns} />
      )}

      {hasMore && !isSearching && (
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
