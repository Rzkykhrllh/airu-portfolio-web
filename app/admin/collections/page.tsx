"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import AdminLayout from "@/components/admin/AdminLayout";
import Button from "@/components/ui/Button";
import { deleteCollection } from "@/lib/api";
import { Collection } from "@/types";
import { getAllCollections } from "@/lib/data";

export default function AdminCollectionsPage() {
  // Hooks must be called before any early returns
  const router = useRouter();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    setIsLoading(true);
    try {
      const data = await getAllCollections();
      setCollections(data);
    } catch (error) {
      console.error("Failed to load collections:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (slug: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this collection? Photos will not be deleted."
      )
    ) {
      return;
    }

    try {
      await deleteCollection(slug);
      alert("Collection deleted successfully!");
      loadCollections();
    } catch (error) {
      console.error("Failed to delete collection:", error);
      alert("Failed to delete collection. Please try again.");
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Collections
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {collections.length}{" "}
              {collections.length === 1 ? "collection" : "collections"}
            </p>
          </div>

          <Button
            variant="primary"
            onClick={() => router.push("/admin/collections/new")}
          >
            + New Collection
          </Button>
        </div>

        {/* Collections Grid */}
        {isLoading ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              Loading collections...
            </p>
          </div>
        ) : collections.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              No collections yet
            </p>
            <Button
              variant="primary"
              onClick={() => router.push("/admin/collections/new")}
            >
              Create your first collection
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections.map((collection) => (
              <CollectionCard
                key={collection.slug}
                collection={collection}
                onDelete={() => handleDelete(collection.slug)}
              />
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function CollectionCard({
  collection,
  onDelete,
}: {
  collection: Collection;
  onDelete: () => void;
}) {
  const router = useRouter();


  // Use the first photo as cover photo.
  // TODO: need to be refined to be able to choose specific cover photo.
  const coverPhoto = collection.photos && collection.photos.length > 0 ? collection.photos[0] : undefined;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow">
      {/* Cover Image */}
      <div className="relative aspect-video bg-gray-200 dark:bg-gray-900">
        {coverPhoto && (
          <Image
            src={coverPhoto.src.medium}
            alt={collection.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-1">
          {collection.title}
        </h3>
        {collection.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
            {collection.description}
          </p>
        )}
        <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
          {collection.photoCount}{" "}
          {collection.photoCount === 1 ? "photo" : "photos"}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            className="flex-1 text-sm"
            onClick={() => router.push(`/admin/collections/${collection.slug}`)}
          >
            Edit
          </Button>
          <Button
            variant="danger"
            className="flex-1 text-sm"
            onClick={onDelete}
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
