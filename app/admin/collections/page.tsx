"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy, arrayMove, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import AdminLayout from "@/components/admin/AdminLayout";
import GridZoomSlider, { useGridZoom, zoomGridClass, zoomGridStyle } from "@/components/admin/GridZoom";
import PageHeader from "@/components/admin/PageHeader";
import SaveStatus, { useSaveState } from "@/components/admin/SaveStatus";
import * as ui from "@/components/admin/ui";
import Link from "next/link";
import { coverCropFor, cropWrapperStyle } from "@/lib/coverCrop";
import Button from "@/components/ui/Button";
import { deleteCollection, reorderCollections, updateCollection } from "@/lib/api";
import { ApiError } from "@/lib/fetch";
import { Collection } from "@/types";
import { getAllCollectionsAdmin } from "@/lib/data";
import { useToast } from "@/components/providers/ToastProvider";
import { useConfirmDialog } from "@/components/providers/ConfirmDialogProvider";

export default function AdminCollectionsPage() {
  // Hooks must be called before any early returns
  const router = useRouter();
  const toast = useToast();
  const confirmDialog = useConfirmDialog();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const orderSave = useSaveState();
  const gridZoom = useGridZoom("collections", { min: 2, max: 8, initial: 4 });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  );

  // Optimistic: reorder locally, persist the full order, roll back on failure.
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = collections.findIndex((c) => c.id === active.id);
    const newIndex = collections.findIndex((c) => c.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const previousOrder = collections;
    const reordered = arrayMove(collections, oldIndex, newIndex);
    setCollections(reordered);

    try {
      await orderSave.run(() => reorderCollections(reordered.map((c) => c.id)));
    } catch (error) {
      console.error("Failed to save collection order:", error);
      setCollections(previousOrder);
    }
  };

  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Admin: Get collections with ALL photos (PUBLIC + COLLECTION_ONLY + PRIVATE)
      const data = await getAllCollectionsAdmin();
      setCollections(data);
    } catch (error) {
      console.error("Failed to load collections:", error);
      setError(error instanceof Error ? error.message : "Failed to load collections");
    } finally {
      setIsLoading(false);
    }
  };

  // Optimistic hide/show; rolls back on failure.
  const handleToggleHidden = async (collection: Collection) => {
    const hidden = !collection.hidden;
    setCollections((prev) => prev.map((c) => (c.id === collection.id ? { ...c, hidden } : c)));
    try {
      await updateCollection(collection.slug, { hidden });
      toast.success(hidden ? `"${collection.title}" is now hidden from the site.` : `"${collection.title}" is visible on the site.`);
    } catch (error) {
      console.error("Failed to update collection visibility:", error);
      setCollections((prev) => prev.map((c) => (c.id === collection.id ? { ...c, hidden: !hidden } : c)));
      toast.error(error instanceof ApiError ? error.message : "Failed to update collection.");
    }
  };

  const handleDelete = async (slug: string) => {
    const ok = await confirmDialog({
      title: "Delete collection?",
      message: "Are you sure you want to delete this collection? Photos will not be deleted.",
      confirmLabel: "Delete",
    });
    if (!ok) return;

    try {
      await deleteCollection(slug);
      toast.success("Collection deleted successfully!");
      loadCollections();
    } catch (error) {
      console.error("Failed to delete collection:", error);
      toast.error(error instanceof ApiError ? error.message : "Failed to delete collection. Please try again.");
    }
  };

  return (
    <AdminLayout>
      <PageHeader
        title="Collections"
        description={
          <>
            <span className="tabular-nums">{collections.length}</span>{" "}
            {collections.length === 1 ? "collection" : "collections"}
            {collections.length > 1 && " · drag to set the order on the site"}
          </>
        }
        actions={
          <>
            <GridZoomSlider {...gridZoom} onChange={gridZoom.setColumns} className="mr-2" />
            <Button onClick={() => router.push("/admin/collections/new")}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" d="M12 5v14M5 12h14" />
              </svg>
              New collection
            </Button>
          </>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-6 animate-pulse">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i}>
              <div className="aspect-[3/2] rounded-xl bg-gray-200/70 dark:bg-gray-800/70" />
              <div className="mt-3 h-4 w-2/3 rounded bg-gray-200/70 dark:bg-gray-800/70" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className={`${ui.card} p-12 text-center`}>
          <p className="font-medium text-gray-900 dark:text-white mb-1">Couldn&apos;t load collections</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">{error}</p>
          <Button variant="secondary" onClick={loadCollections}>Try again</Button>
        </div>
      ) : collections.length === 0 ? (
        <div className={`${ui.card} p-16 text-center`}>
          <p className="font-medium text-gray-900 dark:text-white mb-1">No collections yet</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">Group photos into a series to show on the site.</p>
          <Button onClick={() => router.push("/admin/collections/new")}>Create your first collection</Button>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={collections.map((c) => c.id)} strategy={rectSortingStrategy}>
            <div
              aria-busy={orderSave.isSaving}
              className={`${zoomGridClass(1)} ${gridZoom.columns >= 6 ? "gap-x-4 gap-y-6" : "gap-x-6 gap-y-8"} transition-opacity ${
                orderSave.isSaving ? "opacity-60 pointer-events-none" : ""
              }`}
              style={zoomGridStyle(gridZoom.columns)}
            >
              {collections.map((collection, index) => (
                <CollectionCard
                  key={collection.id}
                  collection={collection}
                  position={index + 1}
                  onDelete={() => handleDelete(collection.slug)}
                  onToggleHidden={() => handleToggleHidden(collection)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
      <SaveStatus state={orderSave.state} savingLabel="Saving collection order…" savedLabel="Collection order saved" />
    </AdminLayout>
  );
}

function CollectionCard({
  collection,
  position,
  onDelete,
  onToggleHidden,
}: {
  collection: Collection;
  position: number;
  onDelete: () => void;
  onToggleHidden: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: collection.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  // Cover = first photo the public can see (private ones are skipped on the
  // site), so the admin card matches /collections exactly.
  const coverPhoto = collection.photos?.find((p) => p.visibility !== "PRIVATE");
  const crop = coverCropFor(collection, coverPhoto);
  const editHref = `/admin/collections/${collection.slug}`;

  return (
    <div ref={setNodeRef} style={style} className="group relative">
      <div className="relative aspect-[3/2] overflow-hidden rounded-xl bg-gray-200 dark:bg-gray-800">
        <Link href={editHref} className="absolute inset-0" aria-label={`Edit ${collection.title}`}>
          {coverPhoto && (
            <div className="absolute inset-0" style={crop ? cropWrapperStyle(crop) : undefined}>
              <Image
                src={coverPhoto.src.medium}
                alt={collection.title}
                fill
                className={`${crop ? "object-fill" : "object-cover"} transition-opacity ${
                  collection.hidden ? "opacity-40 grayscale" : ""
                }`}
                sizes="(max-width: 768px) 100vw, 25vw"
              />
            </div>
          )}
        </Link>

        {/* Position on the public site */}
        <span className="absolute top-2 left-2 flex items-center gap-1 pointer-events-none">
          <span className="min-w-[1.5rem] h-6 px-1.5 inline-flex items-center justify-center rounded-md text-[0.6875rem] font-semibold tabular-nums bg-white/90 dark:bg-gray-900/90 text-gray-900 dark:text-white shadow-sm">
            {position}
          </span>
          {collection.hidden && (
            <span className="h-6 px-2 inline-flex items-center gap-1 rounded-md text-[0.625rem] font-semibold uppercase tracking-[0.12em] bg-gray-900/85 text-white shadow-sm">
              Hidden
            </span>
          )}
        </span>

        <div className="absolute top-2 right-2 flex items-center gap-1">
          {/* Hide / show on the public site */}
          <button
            type="button"
            onClick={onToggleHidden}
            className={`p-1.5 rounded-lg shadow-sm transition-opacity ${
              collection.hidden
                ? "bg-gray-900 text-white"
                : "bg-white/90 dark:bg-gray-900/90 text-gray-500 hover:text-gray-900 dark:hover:text-white opacity-0 group-hover:opacity-100"
            }`}
            title={collection.hidden ? "Hidden from the site — click to show" : "Visible on the site — click to hide"}
            aria-label={collection.hidden ? `Show ${collection.title} on the site` : `Hide ${collection.title} from the site`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d={collection.hidden ? "M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.9 5.1A9.7 9.7 0 0112 5c4.5 0 8.3 2.9 9.5 7a10 10 0 01-2.6 4.1M6.6 6.6A10 10 0 002.5 12c1.3 4.1 5 7 9.5 7a9.8 9.8 0 005.4-1.6" : "M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7zM15 12a3 3 0 11-6 0 3 3 0 016 0z"} />
            </svg>
          </button>
          {/* Delete — hover only */}
          <button
            type="button"
            onClick={onDelete}
            className="p-1.5 rounded-lg bg-white/90 dark:bg-gray-900/90 text-gray-500 hover:text-red-600 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
            title="Delete collection"
            aria-label={`Delete ${collection.title}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
          {/* Drag handle — always visible so it works on touch */}
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="p-1.5 rounded-lg bg-white/90 dark:bg-gray-900/90 text-gray-500 hover:text-gray-900 dark:hover:text-white shadow-sm cursor-grab active:cursor-grabbing touch-none"
            title="Drag to reorder"
            aria-label={`Reorder ${collection.title}`}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M7 4a1 1 0 11-2 0 1 1 0 012 0zM7 10a1 1 0 11-2 0 1 1 0 012 0zM7 16a1 1 0 11-2 0 1 1 0 012 0zM15 4a1 1 0 11-2 0 1 1 0 012 0zM15 10a1 1 0 11-2 0 1 1 0 012 0zM15 16a1 1 0 11-2 0 1 1 0 012 0z" />
            </svg>
          </button>
        </div>
      </div>

      <Link href={editHref} className="block pt-3 px-0.5">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:underline underline-offset-4 decoration-gray-300">
            {collection.title}
          </h3>
          <span className="shrink-0 text-xs tabular-nums text-gray-400">
            {collection.photoCount} {collection.photoCount === 1 ? "photo" : "photos"}
          </span>
        </div>
        {collection.description && (
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{collection.description}</p>
        )}
      </Link>
    </div>
  );
}
