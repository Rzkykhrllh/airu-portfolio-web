import { Photo, Collection } from '@/types';
import photosData from '@/data/photos.json';
import collectionsData from '@/data/collections.json';
import { getPhotos, getPhoto, getCollections } from './api';

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

export async function getAllCollections(): Promise<Collection[]> {
  return await getCollections();
}


export async function getCollectionBySlug(slug: string): Promise<Collection | undefined> {
  const collections = await getCollections();
  return collections.find(
    (collection) => collection.slug === slug
  );
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

export async function getPreviousPhoto(currentId: string): Promise<Photo | null> {
  const photos = await getAllPhotos();
  const currentIndex = photos.findIndex((photo) => photo.id === currentId);
  if (currentIndex === -1 || currentIndex === 0) return null;
  return photos[currentIndex - 1];
}
