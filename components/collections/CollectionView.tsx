'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import MasonryGrid from '@/components/gallery/MasonryGrid';
import { gridIcons, Columns } from '@/components/gallery/grid-icons';
import { Photo, Collection } from '@/types';

interface CollectionViewProps {
  collection: Collection;
  photos: Photo[];
  slug: string;
}

export default function CollectionView({ collection, photos, slug }: CollectionViewProps) {
  const [columns, setColumns] = useState<Columns>(3);
  const [mounted, setMounted] = useState(false);

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

  return (
    <>
      <div className="pt-10 pb-7 border-b border-gray-200 dark:border-white/10 mb-0">
        <Link
          href="/collections"
          className="inline-flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors mb-4"
        >
          ← Collections
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
            {collection.title}
          </h1>
          <div className="flex items-center gap-4">
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
            {photos.length > 0 && (
              <span className="text-sm text-gray-400 dark:text-gray-500 tabular-nums">
                {photos.length} photographs
              </span>
            )}
          </div>
        </div>
        {collection.description && (
          <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400 max-w-xl">
            {collection.description}
          </p>
        )}
      </div>

      <MasonryGrid photos={photos} columns={columns} collectionSlug={slug} />
    </>
  );
}
