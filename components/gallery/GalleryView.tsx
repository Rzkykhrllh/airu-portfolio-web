'use client';

import { useState, useEffect } from 'react';
import MasonryGrid from './MasonryGrid';
import { gridIcons, Columns } from './grid-icons';
import { Photo } from '@/types';

interface GalleryViewProps {
  photos: Photo[];
  totalCount: number;
}

export default function GalleryView({ photos, totalCount }: GalleryViewProps) {
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
              {totalCount} photographs
            </span>
          )}
        </div>
      </div>
      <MasonryGrid photos={photos} columns={columns} />
    </>
  );
}
