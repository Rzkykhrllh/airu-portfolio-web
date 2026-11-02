'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import Link from 'next/link';
import MasonryGrid, { ColumnPrefs, DEFAULT_COLUMN_PREFS } from './MasonryGrid';
import ZoomControls from './ZoomControls';
import { getGalleryPage, getAllCollections } from '@/lib/data';
import { resolveAspectRatios } from '@/lib/resolveAspectRatio';
import { Photo, Collection } from '@/types';

interface GalleryViewProps {
  initialPhotos: Photo[];
  totalCount: number;
  initialHasMore: boolean;
  // Set when this view is rendered at /tags/[tag] — pins every fetch
  // (initial load, filter changes, infinite scroll) to this tag on top of
  // whatever search/collection/featured filters the visitor also picks.
  // Unlike those, it's not user-clearable here — "Clear" on this page just
  // means "back to the unfiltered gallery" via the link in the header.
  lockedTag?: string;
}

export default function GalleryView({ initialPhotos, totalCount: initialTotalCount, initialHasMore, lockedTag }: GalleryViewProps) {
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
        tag: lockedTag,
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
  }, [page, hasMore, appliedSearch, selectedCollection, featuredOnly, lockedTag]);

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
          tag: lockedTag,
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
  }, [appliedSearch, selectedCollection, featuredOnly, lockedTag]);

  const clearFilters = () => {
    setSearchInput('');
    setSelectedCollection('');
    setFeaturedOnly(false);
  };

  const closeFilters = () => {
    setShowFilters(false);
    clearFilters();
  };

  const label = 'text-[0.6875rem] uppercase tracking-[0.22em] tabular-nums';
  const labelMuted = `${label} text-neutral-500 dark:text-neutral-400`;
  const fieldClass =
    'bg-transparent border-0 border-b border-neutral-300 dark:border-neutral-700 focus:border-neutral-900 dark:focus:border-neutral-100 outline-none text-sm py-1.5 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 transition-colors';

  return (
    <>
      <header className="pt-16 pb-12 md:pt-24 md:pb-16">
        <p className={labelMuted}>{lockedTag ? 'Photographs tagged' : 'The full archive'}</p>
        <div className="mt-6 flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
          <h1 className="font-display font-normal text-[3.5rem] sm:text-7xl lg:text-[5.5rem] leading-[0.95] tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
            {lockedTag ? `${lockedTag}.` : 'Gallery.'}
          </h1>
          {totalCount > 0 && (
            <span className={`${labelMuted} pb-2`}>
              {String(totalCount).padStart(3, '0')} {totalCount === 1 ? 'photograph' : 'photographs'}
            </span>
          )}
        </div>
        {lockedTag ? (
          <Link
            href="/"
            className="mt-5 inline-block text-base md:text-lg text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
          >
            ← All photographs
          </Link>
        ) : (
          <p className="mt-5 text-base md:text-lg text-neutral-500 dark:text-neutral-400">
            Tokyo streets, Japanese festivals, and landscapes across Japan and Indonesia.
          </p>
        )}
      </header>

      {/* Toolbar — text controls, no chrome */}
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4 pb-6 md:pb-8">
        <div className="flex flex-wrap items-end gap-x-6 gap-y-3 min-w-0 flex-1">
          <button
            type="button"
            onClick={() => (showFilters ? closeFilters() : setShowFilters(true))}
            aria-expanded={showFilters}
            className={`${label} pb-0.5 border-b transition-colors ${
              showFilters
                ? 'text-neutral-900 dark:text-neutral-100 border-current'
                : 'text-neutral-500 dark:text-neutral-400 border-transparent hover:text-neutral-900 dark:hover:text-neutral-100'
            }`}
          >
            {showFilters ? 'Close' : 'Search & filter'}
          </button>

          {showFilters && (
            <>
              <input
                autoFocus
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Escape' && closeFilters()}
                placeholder="Title, location, tag…"
                aria-label="Search photographs"
                className={`${fieldClass} min-w-0 w-full sm:w-64`}
              />
              <select
                value={selectedCollection}
                onChange={(e) => setSelectedCollection(e.target.value)}
                aria-label="Filter by collection"
                className={`${fieldClass} cursor-pointer`}
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
                aria-pressed={featuredOnly}
                className={`${label} pb-0.5 border-b transition-colors ${
                  featuredOnly
                    ? 'text-neutral-900 dark:text-neutral-100 border-current'
                    : 'text-neutral-500 dark:text-neutral-400 border-transparent hover:text-neutral-900 dark:hover:text-neutral-100'
                }`}
              >
                Featured
              </button>
              {hasActiveFilter && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className={`${labelMuted} hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors`}
                >
                  Clear
                </button>
              )}
            </>
          )}
        </div>

        <ZoomControls onChange={setColumnPrefs} />
      </div>

      {isSearching ? (
        <p className={`${labelMuted} py-24 text-center`} aria-live="polite">
          Searching —
        </p>
      ) : (hasActiveFilter || lockedTag) && photos.length === 0 ? (
        <p className="py-24 text-center font-display text-2xl text-neutral-500 dark:text-neutral-400">
          {lockedTag && !hasActiveFilter
            ? `No photographs tagged “${lockedTag}”.`
            : 'Nothing matches those filters.'}
        </p>
      ) : (
        <MasonryGrid photos={photos} columns={columnPrefs} ratiosResolved={ratiosResolved} />
      )}

      {hasMore && !isSearching && (
        <div ref={sentinelRef} className="flex justify-center py-16">
          {isLoadingMore && (
            <p className={labelMuted} aria-live="polite">
              Loading —
            </p>
          )}
        </div>
      )}

      {!hasMore && !isSearching && photos.length > 0 && (
        <p className={`${labelMuted} pt-20 text-center`}>— End of archive —</p>
      )}
    </>
  );
}
