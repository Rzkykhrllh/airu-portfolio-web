'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import Button from '@/components/ui/Button';
import ViewToggle from '@/components/admin/ViewToggle';
import PhotoGrid from '@/components/admin/PhotoGrid';
import GridZoomSlider, { useGridZoom } from '@/components/admin/GridZoom';
import PageHeader from '@/components/admin/PageHeader';
import * as ui from '@/components/admin/ui';
import PhotoList from '@/components/admin/PhotoList';
import PhotoEditModal from '@/components/admin/PhotoEditModal';
import PhotoAddModal from '@/components/admin/PhotoAddModal';
import BulkActionBar from '@/components/admin/BulkActionBar';
import { getPhotosPage, getCollections, updatePhoto, deletePhoto } from '@/lib/api';
import { ApiError } from '@/lib/fetch';
import { Photo, PhotoFilters, Collection, PhotoVisibility } from '@/types';
import { useToast } from '@/components/providers/ToastProvider';
import { useConfirmDialog } from '@/components/providers/ConfirmDialogProvider';
import { useUndoDelete } from '@/components/providers/UndoDeleteProvider';

// Grid/list page size — the library is well past 500 photos, so fetching
// everything in one request (the old `limit: 1000` approach) meant a slow
// initial load that only grows worse as more photos are added.
const PAGE_SIZE = 60;

export default function AdminPhotosPage() {
  const toast = useToast();
  const confirmDialog = useConfirmDialog();
  const undoDelete = useUndoDelete();

  const [view, setView] = useState<'grid' | 'list'>('grid');
  const gridZoom = useGridZoom('photos', { min: 2, max: 10, initial: 5 });
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
  // Photos hidden immediately on bulk delete but not yet actually deleted —
  // see handleBulkDelete / UndoDeleteProvider.
  const [pendingDeleteIds, setPendingDeleteIds] = useState<Set<string>>(new Set());

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
    const ids = Array.from(selectedIds);
    const ok = await confirmDialog({
      title: 'Delete selected photos?',
      message: `Delete ${ids.length} selected ${ids.length === 1 ? 'photo' : 'photos'}? This cannot be undone.`,
      confirmLabel: 'Delete',
    });
    if (!ok) return;

    // Hides immediately; the actual deletes only fire after the undo grace
    // period, same pattern as the single-photo delete buttons.
    setPendingDeleteIds((prev) => new Set([...prev, ...ids]));
    clearSelection();

    undoDelete.requestDelete({
      key: `bulk-${ids.join(',')}`,
      message: `${ids.length} ${ids.length === 1 ? 'photo' : 'photos'} deleted.`,
      commit: async () => {
        let succeeded = 0;
        let firstError: unknown = null;

        for (const id of ids) {
          try {
            await deletePhoto(id);
            succeeded++;
          } catch (error) {
            console.error(`Bulk delete failed for photo ${id}:`, error);
            if (!firstError) firstError = error;
          }
        }

        setPendingDeleteIds((prev) => {
          const next = new Set(prev);
          ids.forEach((id) => next.delete(id));
          return next;
        });
        await loadPhotos();

        if (succeeded < ids.length) {
          toast.error(
            succeeded === 0
              ? firstError instanceof ApiError
                ? firstError.message
                : 'Failed to delete selected photos.'
              : `Deleted ${succeeded} of ${ids.length} photos — some failed. Check console for details.`
          );
        }
      },
      undo: () => {
        setPendingDeleteIds((prev) => {
          const next = new Set(prev);
          ids.forEach((id) => next.delete(id));
          return next;
        });
      },
    });
  };

  const hasActiveFilters =
    !!searchInput ||
    !!filters.collection ||
    !!filters.visibility ||
    filters.featured !== undefined ||
    (filters.sort ?? 'newest') !== 'newest';

  const clearFilters = () => {
    setSearchInput('');
    updateFilters(() => ({ sort: 'newest' } as PhotoFilters));
  };

  const visiblePhotos = photos.filter((p) => !pendingDeleteIds.has(p.id));

  return (
    <AdminLayout>
      <PageHeader
        title="Photos"
        description={
          <>
            <span className="tabular-nums">{total}</span> {total === 1 ? 'photo' : 'photos'} in the library
          </>
        }
        actions={
          <>
            <Button variant={selectMode ? 'primary' : 'secondary'} onClick={toggleSelectMode}>
              {selectMode ? 'Done' : 'Select'}
            </Button>
            <Button variant="primary" onClick={() => setShowAddModal(true)}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0l-4 4m4-4l4 4M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3" />
              </svg>
              Upload
            </Button>
          </>
        }
      />

      <div className="space-y-5">
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

        {/* Toolbar: search + filters + view controls */}
        <div className={`${ui.card} p-3 flex flex-wrap items-center gap-2`}>
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="7" />
              <path strokeLinecap="round" d="M20 20l-3.5-3.5" />
            </svg>
            <input
              type="search"
              placeholder="Search title, location, tag…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className={`${ui.field} pl-9`}
            />
          </div>

          <select
            className={ui.select}
            value={filters.collection ?? ''}
            onChange={(e) => {
              const value = e.target.value;
              updateFilters((prev) => ({ ...prev, collection: value || undefined }));
            }}
            aria-label="Collection"
          >
            <option value="">All collections</option>
            {availableCollections.map((col) => (
              <option key={col.slug} value={col.slug}>
                {col.title}
              </option>
            ))}
          </select>

          <select
            className={ui.select}
            value={filters.visibility ?? ''}
            onChange={(e) => {
              const value = e.target.value;
              updateFilters((prev) => ({
                ...prev,
                visibility: value === '' ? undefined : (value as PhotoFilters['visibility']),
              }));
            }}
            aria-label="Visibility"
          >
            <option value="">Any visibility</option>
            <option value="PUBLIC">Public</option>
            <option value="COLLECTION_ONLY">Collection only</option>
            <option value="PRIVATE">Private</option>
          </select>

          <select
            className={ui.select}
            value={filters.featured === undefined ? '' : String(filters.featured)}
            onChange={(e) => {
              const value = e.target.value;
              updateFilters((prev) => ({
                ...prev,
                featured: value === '' ? undefined : value === 'true',
              }));
            }}
            aria-label="Featured"
          >
            <option value="">Featured or not</option>
            <option value="true">Featured only</option>
            <option value="false">Not featured</option>
          </select>

          <select
            className={ui.select}
            value={filters.sort ?? 'newest'}
            onChange={(e) => {
              const value = e.target.value as PhotoFilters['sort'];
              updateFilters((prev) => ({ ...prev, sort: value }));
            }}
            aria-label="Sort"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="title">Title A–Z</option>
            <option value="views">Most viewed</option>
          </select>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear
            </Button>
          )}

          <div className="ml-auto flex items-center gap-3">
            {view === 'grid' && <GridZoomSlider {...gridZoom} onChange={gridZoom.setColumns} />}
            <ViewToggle view={view} onChange={setView} />
          </div>
        </div>

        {/* Photos */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4 animate-pulse">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="aspect-[4/5] rounded-xl bg-gray-200/70 dark:bg-gray-800/70" />
            ))}
          </div>
        ) : error ? (
          <div className={`${ui.card} p-12 text-center`}>
            <p className="font-medium text-gray-900 dark:text-white mb-1">Couldn&apos;t load photos</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">{error}</p>
            <Button variant="secondary" onClick={loadPhotos}>Try again</Button>
          </div>
        ) : visiblePhotos.length === 0 ? (
          <div className={`${ui.card} p-16 text-center`}>
            <p className="font-medium text-gray-900 dark:text-white mb-1">
              {hasActiveFilters ? 'No photos match these filters' : 'No photos yet'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
              {hasActiveFilters ? 'Try a different search or clear the filters.' : 'Upload your first photos to get started.'}
            </p>
            {hasActiveFilters ? (
              <Button variant="secondary" onClick={clearFilters}>Clear filters</Button>
            ) : (
              <Button onClick={() => setShowAddModal(true)}>Upload photos</Button>
            )}
          </div>
        ) : (
          <>
            {view === 'grid' ? (
              <PhotoGrid
                photos={visiblePhotos}
                onPhotoClick={setEditingPhotoId}
                onPhotoDeleted={loadPhotos}
                selectMode={selectMode}
                selectedIds={selectedIds}
                onToggleSelect={toggleSelect}
                columns={gridZoom.columns}
              />
            ) : (
              <PhotoList
                photos={visiblePhotos}
                onPhotoClick={setEditingPhotoId}
                onPhotoDeleted={loadPhotos}
                selectMode={selectMode}
                selectedIds={selectedIds}
                onToggleSelect={toggleSelect}
              />
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-4">
                <Button variant="secondary" size="sm" onClick={() => goToPage(page - 1)} disabled={page <= 1}>
                  ← Previous
                </Button>
                <span className="text-sm text-gray-500 dark:text-gray-400 tabular-nums px-2">
                  {page} / {totalPages}
                </span>
                <Button variant="secondary" size="sm" onClick={() => goToPage(page + 1)} disabled={page >= totalPages}>
                  Next →
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
