'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import ViewToggle from '@/components/admin/ViewToggle';
import PhotoGrid from '@/components/admin/PhotoGrid';
import PhotoList from '@/components/admin/PhotoList';
import { getPhotos } from '@/lib/api';
import { Photo, PhotoFilters } from '@/types';

export default function AdminPhotosPage() {
  const router = useRouter();
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<PhotoFilters>({});

  useEffect(() => {
    loadPhotos();
  }, [filters]);

  const loadPhotos = async () => {
    setIsLoading(true);
    try {
      const data = await getPhotos({ ...filters, search: searchQuery });
      setPhotos(data);
    } catch (error) {
      console.error('Failed to load photos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    loadPhotos();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Photos</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {photos.length} {photos.length === 1 ? 'photo' : 'photos'}
            </p>
          </div>

          <Button variant="primary" onClick={() => router.push('/admin/photos/upload')}>
            + Upload
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-4">
            <ViewToggle view={view} onChange={setView} />

            <div className="flex-1 max-w-md">
              <div className="flex gap-2">
                <Input
                  placeholder="Search by title, location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button variant="secondary" onClick={handleSearch}>
                  Search
                </Button>
              </div>
            </div>

            <select
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              onChange={(e) => {
                const value = e.target.value;
                setFilters({
                  ...filters,
                  featured: value === '' ? undefined : value === 'true',
                });
              }}
            >
              <option value="">All Photos</option>
              <option value="true">Featured Only</option>
              <option value="false">Not Featured</option>
            </select>
          </div>
        </div>

        {/* Photos */}
        {isLoading ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">Loading photos...</p>
          </div>
        ) : photos.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">No photos found</p>
          </div>
        ) : (
          <>
            {view === 'grid' ? (
              <PhotoGrid photos={photos} onPhotoDeleted={loadPhotos} />
            ) : (
              <PhotoList photos={photos} onPhotoDeleted={loadPhotos} />
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
