'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import MasonryGrid, { ColumnPrefs, DEFAULT_COLUMN_PREFS } from './MasonryGrid';
import ZoomControls from './ZoomControls';
import { getGalleryPage, getAllCollections } from '@/lib/data';
import { resolveAspectRatios } from '@/lib/resolveAspectRatio';
import { pluralize } from '@/lib/format';
import { Photo, Collection } from '@/types';

interface GalleryViewProps {
  initialPhotos: Photo[];
  totalCount: number;
  initialHasMore: boolean;
}

export default function GalleryView({ initialPhotos, totalCount: initialTotalCount, initialHasMore }: GalleryViewProps) {
  const [columnPrefs, setColumnPrefs] = useState<ColumnPrefs>(DEFAULT_COLUMN_PREFS);

  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const isFetchingRef = useRef(false);

  // Real ratios ready? See lib/resolveAspectRatio.ts. Starts false since
  // SSR's initialPhotos still carry the transformPhoto placeholder.
  const [ratiosResolved, setRatiosResolved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    resolveAspectRatios(initialPhotos).then((resolved) => {
      if (cancelled) return;
      setPhotos(resolved);
      setRatiosResolved(true);
    });
    return () => {
      cancelled = true;
    };
    // Empty deps intentional — resolves the initial SSR batch once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [showFilters, setShowFilters] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [availableCollections, setAvailableCollections] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState('');
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const isFirstFilterRun = useRef(true);

  const hasActiveFilter = Boolean(appliedSearch || selectedCollection || featuredOnly);

  const { ref: sentinelRef, inView } = useInView({ rootMargin: '600px 0px' });

  useEffect(() => {
    getAllCollections()
      .then(setAvailableCollections)
      .catch((error) => console.error('Failed to load collections:', error));
  }, []);

  const loadMore = useCallback(async () => {
    if (isFetchingRef.current || !hasMore) return;
    isFetchingRef.current = true;
    setIsLoadingMore(true);

    try {
      const nextPage = page + 1;
      const result = await getGalleryPage(nextPage, {
        search: appliedSearch,
        collection: selectedCollection || undefined,
        featured: featuredOnly || undefined,
      });
      // Resolve real ratios before this batch reaches MasonryGrid — only
      // newly-appended photos get packed, so this is the point that matters.
      const resolvedPhotos = await resolveAspectRatios(result.photos);
      setPhotos((prev) => [...prev, ...resolvedPhotos]);
      setPage(nextPage);
      setHasMore(result.hasMore);
    } catch (error) {
      console.error('Failed to load more photos:', error);
    } finally {
      isFetchingRef.current = false;
      setIsLoadingMore(false);
    }
  }, [page, hasMore, appliedSearch, selectedCollection, featuredOnly]);

  useEffect(() => {
    if (inView && hasMore) {
      loadMore();
    }
  }, [inView, hasMore, loadMore]);

  // Debounce the raw input into `appliedSearch`, which actually triggers a fetch.
  useEffect(() => {
    const handle = setTimeout(() => setAppliedSearch(searchInput.trim()), 300);
    return () => clearTimeout(handle);
  }, [searchInput]);

  // Re-fetch page 1 whenever any applied filter changes (including clearing
  // back to none), skipping the very first run since initialPhotos already
  // represents page 1 with no filters applied.
  useEffect(() => {
    if (isFirstFilterRun.current) {
      isFirstFilterRun.current = false;
      return;
    }

    (async () => {
      setIsSearching(true);
      try {
        const result = await getGalleryPage(1, {
          search: appliedSearch,
          collection: selectedCollection || undefined,
          featured: featuredOnly || undefined,
        });
        const resolvedPhotos = await resolveAspectRatios(result.photos);
        setPhotos(resolvedPhotos);
        setPage(1);
        setHasMore(result.hasMore);
        setTotalCount(result.total);
      } catch (error) {
        console.error('Filter failed:', error);
      } finally {
        setIsSearching(false);
      }
    })();
  }, [appliedSearch, selectedCollection, featuredOnly]);

  const clearFilters = () => {
    setSearchInput('');
    setSelectedCollection('');
    setFeaturedOnly(false);
  };

  const closeFilters = () => {
    setShowFilters(false);
    clearFilters();
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 pt-10 pb-7 border-b border-gray-200 dark:border-white/10 mb-0">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white shrink-0">
            Gallery
          </h1>
          {showFilters && (
            <>
              <input
                autoFocus
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Escape' && closeFilters()}
                placeholder="Search by title, location, tag..."
                className="min-w-0 flex-1 max-w-xs bg-transparent border-b border-gray-300 dark:border-gray-600 focus:border-gray-900 dark:focus:border-white outline-none text-sm py-1 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
              <select
                value={selectedCollection}
                onChange={(e) => setSelectedCollection(e.target.value)}
                className="bg-transparent border-b border-gray-300 dark:border-gray-600 focus:border-gray-900 dark:focus:border-white outline-none text-sm py-1 text-gray-700 dark:text-gray-300"
              >
                <option value="">All collections</option>
                {availableCollections.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.title}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setFeaturedOnly((prev) => !prev)}
                className={`text-sm py-1 border-b transition-colors ${
                  featuredOnly
                    ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white'
                    : 'border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Featured only
              </button>
              {hasActiveFilter && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white underline"
                >
                  Clear
                </button>
              )}
            </>
          )}
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <button
            type="button"
            onClick={() => (showFilters ? closeFilters() : setShowFilters(true))}
            aria-label={showFilters ? 'Close search and filters' : 'Search and filter photographs'}
            className="p-1.5 rounded transition-colors text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white"
          >
            {showFilters ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
              </svg>
            )}
          </button>

          <ZoomControls onChange={setColumnPrefs} />
          {totalCount > 0 && (
            <span className="text-sm text-gray-400 dark:text-gray-500 tabular-nums">
              {photos.length < totalCount
                ? `${photos.length} of ${pluralize(totalCount, 'photograph')}`
                : pluralize(totalCount, 'photograph')}
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
      ) : hasActiveFilter && photos.length === 0 ? (
        <div className="py-24 text-center text-gray-400 dark:text-gray-500">
          No photographs match your filters.
        </div>
      ) : (
        <MasonryGrid photos={photos} columns={columnPrefs} ratiosResolved={ratiosResolved} />
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
