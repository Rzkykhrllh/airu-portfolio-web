import { Photo, Collection } from "@/types";
import { getPhotos, getPhotosPage, getPhoto, getCollections, getCollection } from "./api";

const GALLERY_PAGE_SIZE = 30;

export async function getAllPhotos(): Promise<Photo[]> {
  // Used for prev/next photo navigation, which needs the full ordered list.
  // Bumped well above the old 100-photo default so navigation doesn't
  // silently break once the library grows past that.
  return await getPhotos({ scope: 'public', limit: 1000 });
}

export type GalleryFilters = {
  search?: string;
  collection?: string;
  featured?: boolean;
};

export async function getGalleryPage(page: number, filters?: GalleryFilters): Promise<{
  photos: Photo[];
  total: number;
  hasMore: boolean;
}> {
  const { photos, total, totalPages } = await getPhotosPage({
    scope: 'public',
    page,
    limit: GALLERY_PAGE_SIZE,
    search: filters?.search || undefined,
    collection: filters?.collection || undefined,
    featured: filters?.featured || undefined,
  });

  return { photos, total, hasMore: page < totalPages };
}

export async function getFeaturedPhotos(): Promise<Photo[]> {
  return await getPhotos({ featured: true, scope: 'public' });
}

export async function getPhotosForCollection(collectionSlug?: string): Promise<Photo[]> {
  if (!collectionSlug) return [];
  // Use collection API to get photos - same source as collection page display
  const collection = await getCollection(collectionSlug);
  return collection?.photos || [];
}

export async function getPhotoById(id: string): Promise<Photo | undefined> {
  const photo = await getPhoto(id);
  return photo ?? undefined;
}

export async function getRelatedPhotos(photo: Photo, limit = 8): Promise<Photo[]> {
  if (photo.collections.length === 0) return [];

  const collectionPhotoLists = await Promise.all(
    photo.collections.map((c) => getPhotosForCollection(c.slug))
  );

  const seen = new Set([photo.id]);
  const related: Photo[] = [];

  for (const list of collectionPhotoLists) {
    for (const candidate of list) {
      if (seen.has(candidate.id)) continue;
      seen.add(candidate.id);
      related.push(candidate);
      if (related.length >= limit) return related;
    }
  }

  return related;
}

export async function getAllCollections(): Promise<Collection[]> {
  return await getCollections();
}

export async function getCollectionBySlug(
  slug: string
): Promise<Collection | null> {
  const collection = await getCollection(slug);
  return collection;
}

export async function getNextPhoto(currentId: string, collectionSlug?: string): Promise<Photo | null> {
  // If collectionSlug provided, navigate within collection only
  const photos = collectionSlug
    ? await getPhotosForCollection(collectionSlug)
    : await getAllPhotos();
  const currentIndex = photos.findIndex((photo) => photo.id === currentId);
  if (currentIndex === -1 || currentIndex === photos.length - 1) return null;
  return photos[currentIndex + 1];
}

export async function getPreviousPhoto(
  currentId: string,
  collectionSlug?: string
): Promise<Photo | null> {
  // If collectionSlug provided, navigate within collection only
  const photos = collectionSlug
    ? await getPhotosForCollection(collectionSlug)
    : await getAllPhotos();
  const currentIndex = photos.findIndex((photo) => photo.id === currentId);
  if (currentIndex === -1 || currentIndex === 0) return null;
  return photos[currentIndex - 1];
}

// ============ Admin Functions ============
// These functions are for admin use and show ALL photos/collections regardless of visibility
// NOTE: scope=admin requires authentication on the backend

export async function getAllPhotosAdmin(): Promise<Photo[]> {
  // Admin sees all photos: PUBLIC + COLLECTION_ONLY + PRIVATE
  return await getPhotos({ scope: 'admin', limit: 1000 });
}

export async function getAllCollectionsAdmin(): Promise<Collection[]> {
  // Admin sees collections with ALL photos: PUBLIC + COLLECTION_ONLY + PRIVATE
  return await getCollections('admin');
}

export async function getCollectionBySlugAdmin(slug: string): Promise<Collection | null> {
  // Admin sees collection with ALL photos: PUBLIC + COLLECTION_ONLY + PRIVATE
  return await getCollection(slug, 'admin');
}
