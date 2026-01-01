import { Photo, Collection } from "@/types";
import photosData from "@/data/photos.json";
import collectionsData from "@/data/collections.json";
import { getPhotos, getPhoto, getCollections, getCollection } from "./api";

export async function getAllPhotos(): Promise<Photo[]> {
  return await getPhotos({ scope: 'public' });
}

export async function getFeaturedPhotos(): Promise<Photo[]> {
  return await getPhotos({ featured: true, scope: 'public' });
}

export async function getPhotosForCollection(collectionSlug?: string): Promise<Photo[]> {
  return await getPhotos({
    scope: 'collection',
    collection: collectionSlug
  });
}

export async function getPhotoById(id: string): Promise<Photo | undefined> {
  const photo = await getPhoto(id);
  return photo ?? undefined;
}

// TODO: Replace with real api calls

export function getPhotosByCollection(slug: string): Photo[] {
  return (photosData as Photo[]).filter((photo) =>
    photo.collections.includes(slug)
  );
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

export function getPhotosByIds(ids: string[]): Photo[] {
  return (photosData as Photo[]).filter((photo) => ids.includes(photo.id));
}

export async function getNextPhoto(currentId: string): Promise<Photo | null> {
  const photos = await getAllPhotos();
  const currentIndex = photos.findIndex((photo) => photo.id === currentId);
  if (currentIndex === -1 || currentIndex === photos.length - 1) return null;
  return photos[currentIndex + 1];
}

export async function getPreviousPhoto(
  currentId: string
): Promise<Photo | null> {
  const photos = await getAllPhotos();
  const currentIndex = photos.findIndex((photo) => photo.id === currentId);
  if (currentIndex === -1 || currentIndex === 0) return null;
  return photos[currentIndex - 1];
}

// ============ Admin Functions ============
// These functions are for admin use and show ALL photos/collections regardless of visibility
// NOTE: scope=admin requires authentication on the backend

export async function getAllPhotosAdmin(): Promise<Photo[]> {
  // Admin sees all photos: PUBLIC + COLLECTION_ONLY + PRIVATE
  return await getPhotos({ scope: 'admin' });
}

export async function getAllCollectionsAdmin(): Promise<Collection[]> {
  // Admin sees collections with ALL photos: PUBLIC + COLLECTION_ONLY + PRIVATE
  return await getCollections('admin');
}

export async function getCollectionBySlugAdmin(slug: string): Promise<Collection | null> {
  // Admin sees collection with ALL photos: PUBLIC + COLLECTION_ONLY + PRIVATE
  return await getCollection(slug, 'admin');
}
