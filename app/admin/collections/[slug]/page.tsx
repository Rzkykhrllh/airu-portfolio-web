"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { use } from "react";
import Image from "next/image";
import Link from "next/link";
import AdminLayout from "@/components/admin/AdminLayout";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { updateCollection, getPhotos, getCollection } from "@/lib/api";
import { Collection, Photo } from "@/types";
import { useToast } from "@/components/providers/ToastProvider";

interface EditCollectionPageProps {
  params: Promise<{ slug: string }>;
}

export default function EditCollectionPage({
  params,
}: EditCollectionPageProps) {
  const toast = useToast();
  const router = useRouter();
  const { slug } = use(params);

  const [collection, setCollection] = useState<Collection | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [allPhotos, setAllPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverPhotoId, setCoverPhotoId] = useState("");

  useEffect(() => {
    loadData();
  }, [slug]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Fetch collection and all photos in parallel
      // Admin: Show ALL photos regardless of visibility (PUBLIC, COLLECTION_ONLY, PRIVATE)
      // scope=admin requires authentication on backend
      const [collectionData, allPhotosData] = await Promise.all([
        getCollection(slug),
        getPhotos({ scope: 'admin' }),
      ]);

      if (collectionData) {
        setCollection(collectionData);
        setTitle(collectionData.title);
        setDescription(collectionData.description || "");
        setCoverPhotoId(collectionData.coverPhotoId);

        // Use photos from collection if available, otherwise empty array
        setPhotos(collectionData.photos || []);
      }

      setAllPhotos(allPhotosData);
    } catch (error) {
      console.error("Failed to load collection:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await updateCollection(slug, {
        title,
        slug,
        description,
        coverPhotoId,
      });

      toast.success("Collection updated successfully!");
      router.push("/admin/collections");
    } catch (error) {
      console.error("Failed to update collection:", error);
      toast.error("Failed to update collection. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

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
      <div className="max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link
              href="/admin/collections"
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-2 inline-block"
            >
              ← Back to Collections
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Edit Collection
            </h1>
          </div>
          <Button
            type="submit"
            form="collection-form"
            variant="primary"
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-1">
            <form
              id="collection-form"
              onSubmit={handleSubmit}
              className="space-y-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
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

              <div>
                {/* <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cover Photo
                </label>
                {coverPhotoId && photos.find((p) => p.id === coverPhotoId) && (
                  <div className="relative aspect-video bg-gray-200 dark:bg-gray-900 rounded overflow-hidden mb-2">
                    <Image
                      src={
                        photos.find((p) => p.id === coverPhotoId)!.src.medium
                      }
                      alt="Cover"
                      fill
                      className="object-cover"
                      sizes="300px"
                    />
                  </div>
                )} */}
                {/* <Button
                  type="button"
                  variant="secondary"
                  className="w-full text-sm"
                  onClick={() => setShowPhotoModal(true)}
                  disabled={photos.length === 0}
                >
                  Change Cover Photo
                </Button> */}
              </div>
            </form>
          </div>

          {/* Photos in Collection */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Photos in Collection ({photos.length})
                </h2>
                {/* <Button
                  type="button"
                  variant="primary"
                  className="text-sm"
                  onClick={() => setShowPhotoModal(true)}
                >
                  + Add Photos
                </Button> */}
              </div>

              {photos.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">
                    No photos in this collection yet
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {photos.map((photo) => (
                    <div key={photo.id} className="relative group">
                      <div className="relative aspect-square bg-gray-200 dark:bg-gray-900 rounded overflow-hidden">
                        <Image
                          src={photo.src.medium}
                          alt={photo.title || "Photo"}
                          fill
                          className="object-cover"
                          sizes="200px"
                        />
                      </div>
                      <button
                        type="button"
                        className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => {
                          console.log(
                            "Remove photo from collection:",
                            photo.id
                          );
                          // Remove photo logic here
                        }}
                      >
                        <svg
                          className="w-4 h-4"
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
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Photo Picker Modal (Simplified) */}
        {showPhotoModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Select Photos
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

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {allPhotos.map((photo) => (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => {
                      setCoverPhotoId(photo.id);
                      setShowPhotoModal(false);
                    }}
                    className="relative aspect-square bg-gray-200 dark:bg-gray-900 rounded overflow-hidden hover:ring-2 hover:ring-blue-500"
                  >
                    <Image
                      src={photo.src.thumbnail}
                      alt={photo.title || "Photo"}
                      fill
                      className="object-cover"
                      sizes="150px"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
