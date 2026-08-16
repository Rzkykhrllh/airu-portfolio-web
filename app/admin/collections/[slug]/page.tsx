"use client";

import { useState, useEffect, FormEvent } from "react";
import { use } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import AdminLayout from "@/components/admin/AdminLayout";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import CollectionPhotoTile from "@/components/admin/CollectionPhotoTile";
import PhotoEditModal from "@/components/admin/PhotoEditModal";
import {
  updateCollection,
  updatePhoto,
  getPhotos,
  getCollection,
  reorderCollectionPhotos,
} from "@/lib/api";
import { ApiError } from "@/lib/fetch";
import { Collection, Photo } from "@/types";
import { useToast } from "@/components/providers/ToastProvider";

// The "Add Photos" picker filters client-side against the full admin photo
// list (already fetched for the page), but rendering every match at once
// got slow once the library passed a few hundred photos — cap what's
// rendered and let the admin ask for more instead.
const ADD_PHOTOS_PAGE_SIZE = 60;

interface EditCollectionPageProps {
  params: Promise<{ slug: string }>;
}

export default function EditCollectionPage({
  params,
}: EditCollectionPageProps) {
  const toast = useToast();
  const { slug } = use(params);

  const [collection, setCollection] = useState<Collection | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [allPhotos, setAllPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [modalSearch, setModalSearch] = useState("");
  const [modalVisibleCount, setModalVisibleCount] = useState(ADD_PHOTOS_PAGE_SIZE);
  const [addingPhotoId, setAddingPhotoId] = useState<string | null>(null);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  useEffect(() => {
    loadData();
    // `loadData` is a new function reference every render (it's a plain
    // const, not memoized) — including it here would just re-run this on
    // every render. `slug` is the only real trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Fetch collection and all photos in parallel
      // Admin: Show ALL photos regardless of visibility (PUBLIC, COLLECTION_ONLY, PRIVATE)
      // scope=admin requires authentication on backend
      // limit bumped past the 100-photo default (same fix as the photos list
      // page) — otherwise "Add Photos" silently couldn't offer anything past
      // the first 100 uploaded.
      const [collectionData, allPhotosData] = await Promise.all([
        getCollection(slug, 'admin'),
        getPhotos({ scope: 'admin', limit: 1000 }),
      ]);

      if (collectionData) {
        setCollection(collectionData);
        setTitle(collectionData.title);
        setDescription(collectionData.description || "");
        setPhotos(collectionData.photos || []);
      }

      setAllPhotos(allPhotosData);
    } catch (error) {
      console.error("Failed to load collection:", error);
      toast.error(error instanceof ApiError ? error.message : "Failed to load collection.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const updated = await updateCollection(slug, { title, slug, description });
      setCollection(updated);
      toast.success("Collection details saved.");
    } catch (error) {
      console.error("Failed to update collection:", error);
      toast.error(error instanceof ApiError ? error.message : "Failed to update collection. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !collection) return;

    const oldIndex = photos.findIndex((p) => p.id === active.id);
    const newIndex = photos.findIndex((p) => p.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const previousOrder = photos;
    const reordered = arrayMove(photos, oldIndex, newIndex);
    setPhotos(reordered);
    setIsSavingOrder(true);

    try {
      await reorderCollectionPhotos(slug, reordered.map((p) => p.id));
    } catch (error) {
      console.error("Failed to save photo order:", error);
      setPhotos(previousOrder);
      toast.error(error instanceof ApiError ? error.message : "Failed to save photo order.");
    } finally {
      setIsSavingOrder(false);
    }
  };

  const handleRemovePhoto = (photoId: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
  };

  const handlePhotoUpdated = (updated: Photo) => {
    const stillInCollection = updated.collections.some((c) => c.id === collection?.id);
    setPhotos((prev) =>
      stillInCollection
        ? prev.map((p) => (p.id === updated.id ? updated : p))
        : prev.filter((p) => p.id !== updated.id)
    );
    setEditingPhotoId(null);
  };

  const handlePhotoDeleted = (photoId: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    setEditingPhotoId(null);
  };

  const handleAddPhoto = async (photo: Photo) => {
    if (!collection) return;
    setAddingPhotoId(photo.id);

    const nextCollectionIds = [...photo.collections.map((c) => c.id), collection.id];

    try {
      const updated = await updatePhoto(photo.id, { collections: nextCollectionIds });
      setPhotos((prev) => [...prev, updated]);
      toast.success("Photo added to collection.");
    } catch (error) {
      console.error("Failed to add photo to collection:", error);
      toast.error(error instanceof ApiError ? error.message : "Failed to add photo to collection.");
    } finally {
      setAddingPhotoId(null);
    }
  };

  const availablePhotos = allPhotos.filter(
    (p) =>
      !photos.some((cp) => cp.id === p.id) &&
      (modalSearch.trim() === "" ||
        (p.title || "").toLowerCase().includes(modalSearch.trim().toLowerCase()))
  );
  const visibleAvailablePhotos = availablePhotos.slice(0, modalVisibleCount);
  const hasMoreAvailablePhotos = availablePhotos.length > modalVisibleCount;

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            Loading collection...
          </p>
        </div>
      </AdminLayout>
    );
  }

  if (!collection) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            Collection not found
          </p>
          <Link
            href="/admin/collections"
            className="text-blue-600 hover:text-blue-700 mt-4 inline-block"
          >
            ← Back to Collections
          </Link>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/collections"
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-2 inline-block"
          >
            ← Back to Collections
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {collection.title}
          </h1>
        </div>

        {/* Photos — primary content */}
        <div className="mb-10">
          <div className="flex items-center justify-between gap-4 mb-1">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Photos ({photos.length})
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Drag to reorder — the first photo is used as the collection cover.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {isSavingOrder && (
                <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  Saving order...
                </span>
              )}
              <Button
                type="button"
                variant="primary"
                onClick={() => {
                  setModalSearch("");
                  setModalVisibleCount(ADD_PHOTOS_PAGE_SIZE);
                  setShowPhotoModal(true);
                }}
              >
                + Add Photos
              </Button>
            </div>
          </div>

          {photos.length === 0 ? (
            <div className="text-center py-12 mt-4 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
              <p className="text-gray-500 dark:text-gray-400">
                No photos in this collection yet
              </p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={photos.map((p) => p.id)}
                strategy={rectSortingStrategy}
              >
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mt-4">
                  {photos.map((photo, index) => (
                    <CollectionPhotoTile
                      key={photo.id}
                      photo={photo}
                      collectionId={collection.id}
                      isCover={index === 0}
                      onRemoved={handleRemovePhoto}
                      onEdit={setEditingPhotoId}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>

        {/* Collection settings — secondary, collapsed by default */}
        <details className="group rounded-lg border border-gray-200 dark:border-gray-700">
          <summary className="cursor-pointer select-none list-none px-6 py-4 flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
            <span>Collection Settings</span>
            <svg
              className="w-4 h-4 transition-transform group-open:rotate-90"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </summary>

          <form
            onSubmit={handleSubmit}
            className="px-6 pb-6 pt-2 space-y-6 border-t border-gray-200 dark:border-gray-700"
          >
            <Input
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <Input
              label="Slug (URL)"
              value={slug}
              disabled
              className="opacity-50"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <Button type="submit" variant="primary" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Details"}
            </Button>
          </form>
        </details>
      </div>

      {/* Add Photos Modal */}
      {showPhotoModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowPhotoModal(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Add Photos
              </h2>
              <button
                onClick={() => setShowPhotoModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <input
              type="text"
              placeholder="Search photos..."
              value={modalSearch}
              onChange={(e) => {
                setModalSearch(e.target.value);
                setModalVisibleCount(ADD_PHOTOS_PAGE_SIZE);
              }}
              className="w-full mb-4 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {availablePhotos.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                No photos to add
              </p>
            ) : (
              <>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Showing {visibleAvailablePhotos.length} of {availablePhotos.length}
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {visibleAvailablePhotos.map((photo) => (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => handleAddPhoto(photo)}
                    disabled={addingPhotoId === photo.id}
                    className="relative aspect-square bg-gray-200 dark:bg-gray-900 rounded overflow-hidden hover:ring-2 hover:ring-blue-500 disabled:opacity-50"
                  >
                    <Image
                      src={photo.src.thumbnail}
                      alt={photo.title || "Photo"}
                      fill
                      className="object-cover"
                      sizes="150px"
                    />
                    {addingPhotoId === photo.id && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <svg
                          className="w-6 h-6 text-white animate-spin"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
              {hasMoreAvailablePhotos && (
                <div className="flex justify-center mt-4">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setModalVisibleCount((prev) => prev + ADD_PHOTOS_PAGE_SIZE)}
                  >
                    Load more
                  </Button>
                </div>
              )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Edit Photo Modal */}
      {editingPhotoId && (
        <PhotoEditModal
          photoId={editingPhotoId}
          onClose={() => setEditingPhotoId(null)}
          onUpdated={handlePhotoUpdated}
          onDeleted={handlePhotoDeleted}
        />
      )}
    </AdminLayout>
  );
}
