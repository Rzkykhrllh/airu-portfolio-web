import { Photo, PhotoFormData, PhotoFilters, Collection, CollectionFormData } from '@/types';
import { getAllPhotos as getPhotosFromData, getAllCollections as getCollectionsFromData } from '@/lib/data';

// Mock API functions for MVP
// TODO: Replace with real API calls when backend is ready

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Photos API
export async function getPhotos(filters?: PhotoFilters): Promise<Photo[]> {
  await delay(300);
  // TODO: Replace with fetch('/api/photos')
  let photos = getPhotosFromData();

  if (filters?.collection) {
    photos = photos.filter(p => p.collections.includes(filters.collection!));
  }

  if (filters?.tags && filters.tags.length > 0) {
    photos = photos.filter(p =>
      filters.tags!.some(tag => p.tags.includes(tag))
    );
  }

  if (filters?.featured !== undefined) {
    photos = photos.filter(p => p.featured === filters.featured);
  }

  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    photos = photos.filter(p =>
      p.title?.toLowerCase().includes(searchLower) ||
      p.description?.toLowerCase().includes(searchLower) ||
      p.location?.toLowerCase().includes(searchLower)
    );
  }

  return photos;
}

export async function getPhoto(id: string): Promise<Photo | null> {
  await delay(200);
  // TODO: Replace with fetch(`/api/photos/${id}`)
  const photos = getPhotosFromData();
  return photos.find(p => p.id === id) || null;
}

export async function updatePhoto(id: string, data: Partial<PhotoFormData>): Promise<Photo> {
  await delay(500);
  // TODO: Replace with fetch(`/api/photos/${id}`, { method: 'PUT', ... })
  console.log('Update photo', id, data);

  const photos = getPhotosFromData();
  const photo = photos.find(p => p.id === id);

  if (!photo) {
    throw new Error('Photo not found');
  }

  return { ...photo, ...data } as Photo;
}

export async function uploadPhoto(file: File, data: PhotoFormData): Promise<Photo> {
  await delay(1000);
  // TODO: Replace with multipart form upload
  console.log('Upload photo', file.name, data);

  const newPhoto: Photo = {
    id: Date.now().toString(),
    src: {
      thumbnail: URL.createObjectURL(file),
      medium: URL.createObjectURL(file),
      full: URL.createObjectURL(file),
    },
    aspectRatio: 1.5,
    ...data,
    createdAt: new Date().toISOString(),
  };

  return newPhoto;
}

export async function deletePhoto(id: string): Promise<void> {
  await delay(500);
  // TODO: Replace with fetch(`/api/photos/${id}`, { method: 'DELETE' })
  console.log('Delete photo', id);
}

// Collections API
export async function getCollections(): Promise<Collection[]> {
  await delay(300);
  // TODO: Replace with fetch('/api/collections')
  return getCollectionsFromData();
}

export async function getCollection(slug: string): Promise<Collection | null> {
  await delay(200);
  // TODO: Replace with fetch(`/api/collections/${slug}`)
  const collections = getCollectionsFromData();
  return collections.find(c => c.slug === slug) || null;
}

export async function createCollection(data: CollectionFormData): Promise<Collection> {
  await delay(500);
  // TODO: Replace with fetch('/api/collections', { method: 'POST', ... })
  console.log('Create collection', data);

  const newCollection: Collection = {
    ...data,
    photoCount: 0,
  };

  return newCollection;
}

export async function updateCollection(slug: string, data: Partial<CollectionFormData>): Promise<Collection> {
  await delay(500);
  // TODO: Replace with fetch(`/api/collections/${slug}`, { method: 'PUT', ... })
  console.log('Update collection', slug, data);

  const collections = getCollectionsFromData();
  const collection = collections.find(c => c.slug === slug);

  if (!collection) {
    throw new Error('Collection not found');
  }

  return { ...collection, ...data } as Collection;
}

export async function deleteCollection(slug: string): Promise<void> {
  await delay(500);
  // TODO: Replace with fetch(`/api/collections/${slug}`, { method: 'DELETE' })
  console.log('Delete collection', slug);
}

export async function addPhotoToCollection(photoId: string, collectionSlug: string): Promise<void> {
  await delay(300);
  // TODO: Replace with fetch(`/api/collections/${collectionSlug}/photos`, { method: 'POST', ... })
  console.log('Add photo to collection', photoId, collectionSlug);
}

export async function removePhotoFromCollection(photoId: string, collectionSlug: string): Promise<void> {
  await delay(300);
  // TODO: Replace with fetch(`/api/collections/${collectionSlug}/photos/${photoId}`, { method: 'DELETE' })
  console.log('Remove photo from collection', photoId, collectionSlug);
}
