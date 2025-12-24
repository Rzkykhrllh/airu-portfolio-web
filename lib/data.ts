import { Photo, Collection } from '@/types';
import photosData from '@/data/photos.json';
import collectionsData from '@/data/collections.json';
import { getPhotos, getPhoto } from './api';

export async function getAllPhotos(): Promise<Photo[]> {
  return await getPhotos();
}


export async function getFeaturedPhotos(): Promise<Photo[]> {
  return await getPhotos({ featured: true });
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

export function getAllCollections(): Collection[] {
  return collectionsData as Collection[];
}

export function getCollectionBySlug(slug: string): Collection | undefined {
  return (collectionsData as Collection[]).find(
    (collection) => collection.slug === slug
  );
}

export function getPhotosByIds(ids: string[]): Photo[] {
  return (photosData as Photo[]).filter((photo) => ids.includes(photo.id));
}

// export function getNextPhoto(currentId: string): Photo | null {
//   const photos = getAllPhotos();
//   const currentIndex = photos.findIndex((photo) => photo.id === currentId);
//   if (currentIndex === -1 || currentIndex === photos.length - 1) return null;
//   return photos[currentIndex + 1];
// }

// export function getPreviousPhoto(currentId: string): Photo | null {
//   const photos = getAllPhotos();
//   const currentIndex = photos.findIndex((photo) => photo.id === currentId);
//   if (currentIndex === -1 || currentIndex === 0) return null;
//   return photos[currentIndex - 1];
// }
