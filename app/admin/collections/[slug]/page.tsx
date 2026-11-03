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
import GridZoomSlider, { useGridZoom, zoomGridClass, zoomGridStyle } from "@/components/admin/GridZoom";
import PageHeader from "@/components/admin/PageHeader";
import SaveStatus, { useSaveState } from "@/components/admin/SaveStatus";
import * as ui from "@/components/admin/ui";
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
const ADD_PHOTOS_PAGE_SIZE = 120;

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
  const orderSave = useSaveState();
  const [saveLabel, setSaveLabel] = useState("Saving order…");
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [showDetails, setShowDetails] = useState(false);

  const tileZoom = useGridZoom("collection-photos", { min: 3, max: 14, initial: 8 });
  const pickerZoom = useGridZoom("add-photos", { min: 3, max: 16, initial: 10 });

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
    const firstVisible = (list: Photo[]) => list.find((p) => p.visibility !== "PRIVATE")?.id;
    const coverChanged = firstVisible(previousOrder) !== firstVisible(reordered);
    setSaveLabel(coverChanged ? "Saving order & new cover…" : "Saving order…");
    setPhotos(reordered);

    try {
      await orderSave.run(() => reorderCollectionPhotos(slug, reordered.map((p) => p.id)));
    } catch (error) {
      console.error("Failed to save photo order:", error);
      setPhotos(previousOrder);
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

  // Esc closes the photo picker.
  useEffect(() => {
    if (!showPhotoModal) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setShowPhotoModal(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showPhotoModal]);

  const [isTogglingHidden, setIsTogglingHidden] = useState(false);
  const handleToggleHidden = async () => {
    if (!collection) return;
    const hidden = !collection.hidden;
    setIsTogglingHidden(true);
    try {
      await updateCollection(slug, { hidden });
      setCollection((prev) => (prev ? { ...prev, hidden } : prev));
      toast.success(hidden ? "Collection hidden from the site." : "Collection is visible on the site.");
    } catch (error) {
      console.error("Failed to update collection visibility:", error);
      toast.error(error instanceof ApiError ? error.message : "Failed to update collection.");
    } finally {
      setIsTogglingHidden(false);
    }
  };

  // Same rule as the public site: the cover is the first non-private photo.
  const coverId = photos.find((p) => p.visibility !== "PRIVATE")?.id;

  const openPicker = () => {
    setModalSearch("");
    setModalVisibleCount(ADD_PHOTOS_PAGE_SIZE);
    setShowPhotoModal(true);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="animate-pulse">
          <div className="h-3 w-24 rounded bg-gray-200 dark:bg-gray-800 mb-4" />
          <div className="h-7 w-64 rounded bg-gray-200 dark:bg-gray-800 mb-8" />
          <div className="grid grid-cols-4 lg:grid-cols-8 gap-3">
            {Array.from({ length: 16 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-lg bg-gray-200/70 dark:bg-gray-800/70" />
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!collection) {
    return (
      <AdminLayout>
        <div className={`${ui.card} p-16 text-center`}>
          <p className="font-medium text-gray-900 dark:text-white mb-1">Collection not found</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">It may have been renamed or deleted.</p>
          <Link href="/admin/collections" className="text-sm underline underline-offset-4">
            Back to collections
          </Link>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <PageHeader
        back={{ href: "/admin/collections", label: "Collections" }}
        title={
          <span className="inline-flex items-center gap-3">
            {collection.title}
            {collection.hidden && (
              <span className="h-6 px-2 inline-flex items-center rounded-md text-[0.625rem] font-semibold uppercase tracking-[0.12em] bg-gray-900 text-white dark:bg-white dark:text-gray-900">
                Hidden
              </span>
            )}
          </span>
        }
        description={
          <>
            <span className="tabular-nums">{photos.length}</span> {photos.length === 1 ? "photo" : "photos"}
            {" · "}
            {collection.hidden ? (
              <span>Admin only — not shown anywhere on the site</span>
            ) : (
              <a
                href={`/collections/${collection.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-900 dark:hover:text-white underline-offset-4 hover:underline"
              >
                View on site ↗
              </a>
            )}
          </>
        }
        actions={
          <>
            <Button variant="ghost" onClick={handleToggleHidden} disabled={isTogglingHidden}>
              {collection.hidden ? "Show on site" : "Hide from site"}
            </Button>
            <Button variant="secondary" onClick={() => setShowDetails((open) => !open)}>
              {showDetails ? "Close details" : "Edit details"}
            </Button>
            <Button onClick={openPicker}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" d="M12 5v14M5 12h14" />
              </svg>
              Add photos
            </Button>
          </>
        }
      />

      {/* Collection details — inline panel, hidden until needed */}
      {showDetails && (
        <form onSubmit={handleSubmit} className={`${ui.card} p-5 mb-8 grid gap-4 md:grid-cols-2`}>
          <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <Input label="Slug (URL)" value={slug} disabled className="opacity-60" />
          <div className="md:col-span-2">
            <label className={ui.label}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={ui.textarea}
            />
          </div>
          <div className="md:col-span-2 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setShowDetails(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving…" : "Save details"}
            </Button>
          </div>
        </form>
      )}

      {/* Photos toolbar */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Drag to reorder · the first non-private photo is the cover
        </p>
        <GridZoomSlider {...tileZoom} onChange={tileZoom.setColumns} />
      </div>

      {photos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-16 text-center">
          <p className="font-medium text-gray-900 dark:text-white mb-1">No photos yet</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">Pick photos from your library to fill this collection.</p>
          <Button onClick={openPicker}>Add photos</Button>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={photos.map((p) => p.id)} strategy={rectSortingStrategy}>
            <div
              aria-busy={orderSave.isSaving}
              className={`${zoomGridClass(2)} ${tileZoom.columns >= 9 ? "gap-2" : "gap-3"} transition-opacity ${
                orderSave.isSaving ? "opacity-60 pointer-events-none" : ""
              }`}
              style={zoomGridStyle(tileZoom.columns)}
            >
              {photos.map((photo) => (
                <CollectionPhotoTile
                  key={photo.id}
                  photo={photo}
                  collectionId={collection.id}
                  isCover={photo.id === coverId}
                  onRemoved={handleRemovePhoto}
                  onEdit={setEditingPhotoId}
                  compact={tileZoom.columns >= 9}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <SaveStatus
        state={orderSave.state}
        savingLabel={saveLabel}
        savedLabel={saveLabel.includes("cover") ? "Order & cover saved" : "Order saved"}
      />

      {/* Add Photos Modal */}
      {showPhotoModal && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 sm:p-4"
          onClick={() => setShowPhotoModal(false)}
        >
          <div
            className="bg-[var(--background)] sm:rounded-2xl w-full h-full overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sticky toolbar: title, search, zoom stay put while scrolling */}
            <div className="sticky top-0 z-10 bg-[color-mix(in_srgb,var(--background)_92%,transparent)] backdrop-blur-md border-b border-gray-200/80 dark:border-gray-800 px-4 sm:px-6 py-4 mb-4">
            <div className="flex items-center justify-between gap-4 mb-3">
              <h2 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white">
                Add photos{" "}
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                  to {collection?.title}
                </span>
              </h2>
              <div className="flex items-center gap-4">
              <GridZoomSlider {...pickerZoom} onChange={pickerZoom.setColumns} />
              <button
                onClick={() => setShowPhotoModal(false)}
                className={ui.iconButton}
                aria-label="Close"
              >
                <svg
                  className="w-5 h-5"
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
            </div>

            <input
              type="text"
              autoFocus
              placeholder="Search photos..."
              value={modalSearch}
              onChange={(e) => {
                setModalSearch(e.target.value);
                setModalVisibleCount(ADD_PHOTOS_PAGE_SIZE);
              }}
              className={ui.field}
            />
            </div>

            <div className="px-4 sm:px-6 pb-6">
            {availablePhotos.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                No photos to add
              </p>
            ) : (
              <>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Showing {visibleAvailablePhotos.length} of {availablePhotos.length}
              </p>
              <div
                className={`${zoomGridClass(3)} gap-2`}
                style={zoomGridStyle(pickerZoom.columns)}
              >
                {visibleAvailablePhotos.map((photo) => (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => handleAddPhoto(photo)}
                    disabled={addingPhotoId === photo.id}
                    className="group relative aspect-square bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden hover:ring-2 hover:ring-gray-900 dark:hover:ring-white hover:ring-offset-2 ring-offset-[var(--background)] disabled:opacity-50 transition-shadow"
                    title={photo.title ? `Add "${photo.title}"` : "Add photo"}
                  >
                    <Image
                      src={photo.src.thumbnail}
                      alt={photo.title || "Photo"}
                      fill
                      className="object-cover"
                      sizes={`${Math.ceil(1600 / pickerZoom.columns)}px`}
                    />
                    <span className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/25 transition-colors">
                      <span className="w-8 h-8 rounded-full bg-white text-gray-900 inline-flex items-center justify-center opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 transition-all shadow">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" d="M12 5v14M5 12h14" />
                        </svg>
                      </span>
                    </span>
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
