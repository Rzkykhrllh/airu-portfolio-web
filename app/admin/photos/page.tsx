'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import ViewToggle from '@/components/admin/ViewToggle';
import PhotoGrid from '@/components/admin/PhotoGrid';
import PhotoList from '@/components/admin/PhotoList';
import PhotoEditModal from '@/components/admin/PhotoEditModal';
import PhotoAddModal from '@/components/admin/PhotoAddModal';
import { getPhotos, getCollections } from '@/lib/api';
import { Photo, PhotoFilters, Collection } from '@/types';

export default function AdminPhotosPage() {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState<PhotoFilters>({ sort: 'newest' });
  const [availableCollections, setAvailableCollections] = useState<Collection[]>([]);
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadPhotos();
  }, [filters]);

  // Debounce free-text search into `filters` so it goes through the same
  // server-side round-trip as the other filters instead of firing per keystroke.
  useEffect(() => {
    const handle = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchInput.trim() || undefined }));
    }, 300);
    return () => clearTimeout(handle);
  }, [searchInput]);

  useEffect(() => {
    getCollections('admin')
      .then(setAvailableCollections)
      .catch((error) => console.error('Failed to load collections:', error));
  }, []);

  const loadPhotos = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Admin: Show ALL photos regardless of visibility (PUBLIC, COLLECTION_ONLY, PRIVATE)
      // scope=admin requires authentication on backend
      // limit bumped past the 100-photo default — same silent cap already
      // fixed on the homepage (commit 381be13), just never caught here.
      // The library is already past 300 photos, so this was hiding ~70% of
      // it from the admin list entirely.
      const data = await getPhotos({
        ...filters,
        scope: 'admin',
        limit: 1000,
      });
      setPhotos(data);
    } catch (error) {
      console.error('Failed to load photos:', error);
      setError(error instanceof Error ? error.message : 'Failed to load photos');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoUploaded = (photo: Photo) => {
    setPhotos((prev) => [photo, ...prev]);
    setShowAddModal(false);
  };

  const handlePhotoUpdated = (updated: Photo) => {
    setPhotos((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setEditingPhotoId(null);
  };

  const handlePhotoDeleted = (photoId: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    setEditingPhotoId(null);
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

          <Button variant="primary" onClick={() => setShowAddModal(true)}>
            + Upload
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex flex-wrap items-center gap-4">
            <ViewToggle view={view} onChange={setView} />

            <div className="flex-1 min-w-[200px] max-w-md">
              <Input
                placeholder="Search by title, location, tag..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>

            <select
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.collection ?? ''}
              onChange={(e) => {
                const value = e.target.value;
                setFilters((prev) => ({ ...prev, collection: value || undefined }));
              }}
            >
              <option value="">All Collections</option>
              {availableCollections.map((col) => (
                <option key={col.slug} value={col.slug}>
                  {col.title}
                </option>
              ))}
            </select>

            <select
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.visibility ?? ''}
              onChange={(e) => {
                const value = e.target.value;
                setFilters((prev) => ({
                  ...prev,
                  visibility: value === '' ? undefined : (value as PhotoFilters['visibility']),
                }));
              }}
            >
              <option value="">All Visibility</option>
              <option value="PUBLIC">Public</option>
              <option value="COLLECTION_ONLY">Collection Only</option>
              <option value="PRIVATE">Private</option>
            </select>

            <select
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.sort ?? 'newest'}
              onChange={(e) => {
                const value = e.target.value as PhotoFilters['sort'];
                setFilters((prev) => ({ ...prev, sort: value }));
              }}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="title">Title A–Z</option>
            </select>

            <select
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.featured === undefined ? '' : String(filters.featured)}
              onChange={(e) => {
                const value = e.target.value;
                setFilters((prev) => ({
                  ...prev,
                  featured: value === '' ? undefined : value === 'true',
                }));
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
        ) : error ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-red-200 dark:border-red-900/50 p-12 text-center">
            <p className="text-red-600 dark:text-red-400 mb-2">Failed to load photos</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{error}</p>
            <Button variant="secondary" onClick={loadPhotos}>Try Again</Button>
          </div>
        ) : photos.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">No photos found</p>
          </div>
        ) : (
          <>
            {view === 'grid' ? (
              <PhotoGrid photos={photos} onPhotoClick={setEditingPhotoId} onPhotoDeleted={loadPhotos} />
            ) : (
              <PhotoList photos={photos} onPhotoClick={setEditingPhotoId} onPhotoDeleted={loadPhotos} />
            )}
          </>
        )}
      </div>

      {editingPhotoId && (
        <PhotoEditModal
          photoId={editingPhotoId}
          onClose={() => setEditingPhotoId(null)}
          onUpdated={handlePhotoUpdated}
          onDeleted={handlePhotoDeleted}
        />
      )}

      {showAddModal && (
        <PhotoAddModal
          onClose={() => setShowAddModal(false)}
          onUploaded={handlePhotoUploaded}
        />
      )}
    </AdminLayout>
  );
}
