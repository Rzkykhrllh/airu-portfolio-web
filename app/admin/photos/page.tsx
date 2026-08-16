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
import BulkActionBar from '@/components/admin/BulkActionBar';
import { getPhotosPage, getCollections, updatePhoto, deletePhoto } from '@/lib/api';
import { ApiError } from '@/lib/fetch';
import { Photo, PhotoFilters, Collection, PhotoVisibility } from '@/types';
import { useToast } from '@/components/providers/ToastProvider';
import { useConfirmDialog } from '@/components/providers/ConfirmDialogProvider';

// Grid/list page size — the library is well past 500 photos, so fetching
// everything in one request (the old `limit: 1000` approach) meant a slow
// initial load that only grows worse as more photos are added.
const PAGE_SIZE = 60;

export default function AdminPhotosPage() {
  const toast = useToast();
  const confirmDialog = useConfirmDialog();

  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState<PhotoFilters>({ sort: 'newest' });
  const [availableCollections, setAvailableCollections] = useState<Collection[]>([]);
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  useEffect(() => {
    loadPhotos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, page]);

  // Debounce free-text search into `filters` so it goes through the same
  // server-side round-trip as the other filters instead of firing per keystroke.
  useEffect(() => {
    const handle = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchInput.trim() || undefined }));
      setPage(1);
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
      const result = await getPhotosPage({
        ...filters,
        scope: 'admin',
        page,
        limit: PAGE_SIZE,
      });
      setPhotos(result.photos);
      setTotal(result.total);
      setTotalPages(Math.max(1, result.totalPages));
    } catch (error) {
      console.error('Failed to load photos:', error);
      setError(error instanceof ApiError ? error.message : 'Failed to load photos');
    } finally {
      setIsLoading(false);
    }
  };

  const updateFilters = (updater: (prev: PhotoFilters) => PhotoFilters) => {
    setFilters(updater);
    setPage(1);
  };

  const handlePhotoUploaded = () => {
    setShowAddModal(false);
    loadPhotos();
  };

  const handlePhotoUpdated = (updated: Photo) => {
    setPhotos((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setEditingPhotoId(null);
  };

  const handlePhotoDeleted = (photoId: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    setEditingPhotoId(null);
  };

  // ---- Selection ----

  const toggleSelectMode = () => {
    setSelectMode((prev) => !prev);
    setSelectedIds(new Set());
  };

  const toggleSelect = (photoId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(photoId)) {
        next.delete(photoId);
      } else {
        next.add(photoId);
      }
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const goToPage = (nextPage: number) => {
    setPage(nextPage);
    setSelectedIds(new Set());
  };

  // ---- Bulk actions ----
  // The backend has no bulk endpoints, so these fan out per-photo requests
  // and report how many succeeded/failed rather than failing the whole
  // batch on the first error.

  const runBulk = async (
    label: string,
    action: (photoId: string) => Promise<unknown>
  ) => {
    setBulkBusy(true);
    const ids = Array.from(selectedIds);
    let succeeded = 0;
    let firstError: unknown = null;

    for (const id of ids) {
      try {
        await action(id);
        succeeded++;
      } catch (error) {
        console.error(`Bulk ${label} failed for photo ${id}:`, error);
        if (!firstError) firstError = error;
      }
    }

    setBulkBusy(false);
    clearSelection();
    await loadPhotos();

    if (succeeded === ids.length) {
      toast.success(`${label} applied to ${succeeded} ${succeeded === 1 ? 'photo' : 'photos'}.`);
    } else if (succeeded === 0) {
      toast.error(
        firstError instanceof ApiError
          ? firstError.message
          : `Failed to apply ${label.toLowerCase()} to any selected photos.`
      );
    } else {
      toast.error(`${label} applied to ${succeeded} of ${ids.length} photos — some failed. Check console for details.`);
    }
  };

  const handleBulkAddToCollection = (collectionId: string) => {
    // updatePhoto's `collections` payload REPLACES the photo's full
    // membership list, so each photo's existing collections must be
    // merged with the target rather than overwritten.
    runBulk('Add to collection', (photoId) => {
      const photo = photos.find((p) => p.id === photoId);
      const existingIds = photo?.collections.map((c) => c.id) ?? [];
      const nextIds = existingIds.includes(collectionId) ? existingIds : [...existingIds, collectionId];
      return updatePhoto(photoId, { collections: nextIds });
    });
  };

  const handleBulkSetVisibility = (visibility: PhotoVisibility) => {
    runBulk('Visibility update', (photoId) => updatePhoto(photoId, { visibility }));
  };

  const handleBulkDelete = async () => {
    const ok = await confirmDialog({
      title: 'Delete selected photos?',
      message: `Delete ${selectedIds.size} selected ${selectedIds.size === 1 ? 'photo' : 'photos'}? This cannot be undone.`,
      confirmLabel: 'Delete',
    });
    if (!ok) return;

    runBulk('Delete', (photoId) => deletePhoto(photoId));
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Photos</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {total} {total === 1 ? 'photo' : 'photos'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={toggleSelectMode}>
              {selectMode ? 'Cancel Select' : 'Select'}
            </Button>
            <Button variant="primary" onClick={() => setShowAddModal(true)}>
              + Upload
            </Button>
          </div>
        </div>

        {selectMode && (
          <BulkActionBar
            selectedCount={selectedIds.size}
            collections={availableCollections}
            busy={bulkBusy}
            onAddToCollection={handleBulkAddToCollection}
            onSetVisibility={handleBulkSetVisibility}
            onDelete={handleBulkDelete}
            onClear={clearSelection}
          />
        )}

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
                updateFilters((prev) => ({ ...prev, collection: value || undefined }));
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
                updateFilters((prev) => ({
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
                updateFilters((prev) => ({ ...prev, sort: value }));
              }}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="title">Title A–Z</option>
              <option value="views">Most Viewed</option>
            </select>

            <select
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.featured === undefined ? '' : String(filters.featured)}
              onChange={(e) => {
                const value = e.target.value;
                updateFilters((prev) => ({
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
              <PhotoGrid
                photos={photos}
                onPhotoClick={setEditingPhotoId}
                onPhotoDeleted={loadPhotos}
                selectMode={selectMode}
                selectedIds={selectedIds}
                onToggleSelect={toggleSelect}
              />
            ) : (
              <PhotoList
                photos={photos}
                onPhotoClick={setEditingPhotoId}
                onPhotoDeleted={loadPhotos}
                selectMode={selectMode}
                selectedIds={selectedIds}
                onToggleSelect={toggleSelect}
              />
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 pt-2">
                <Button
                  variant="secondary"
                  onClick={() => goToPage(page - 1)}
                  disabled={page <= 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="secondary"
                  onClick={() => goToPage(page + 1)}
                  disabled={page >= totalPages}
                >
                  Next
                </Button>
              </div>
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
