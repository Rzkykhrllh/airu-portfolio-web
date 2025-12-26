import { Photo, Collection } from "@/types"

export interface BackendPhoto {
  id: string;
  title: string;
  description?: string;
  location?: string;
  featured: boolean;
  sortOrder: number;
  metadata: Record<string, any>;
  urlSmall: string;
  urlMedium: string;
  urlLarge: string;
  createdAt: string;
  capturedAt?: string | null;
  updatedAt: string;

  // Tags information from junction table - Optional since not always included
  tags?: Array<{
    photoId: string;
    tag: string;
  }>;

  // Collection information from junction table - Optional since not always included
  collections?: Array<{
    photoId: string;
    collectionId: string;
    collection: {
      id: string;
      slug: string;
      name: string;
      description?: string;
    };
  }>;
}

// Transform backend photo into frontend photo type
export function transformPhoto(backendPhoto: BackendPhoto): Photo {
  return {
    id: backendPhoto.id,
    src: {
      thumbnail: backendPhoto.urlSmall,
      medium: backendPhoto.urlMedium,
      full: backendPhoto.urlLarge,
    },
    aspectRatio: 1.5,
    title: backendPhoto.title,
    description: backendPhoto.description,
    location: backendPhoto.location,
    tags: backendPhoto.tags?.map(t => t.tag) || [],
    collections: backendPhoto.collections?.map(c => c.collection.slug) || [],

    featured: backendPhoto.featured,
    createdAt: backendPhoto.createdAt,
    capturedAt: backendPhoto.capturedAt || undefined,
    exif: backendPhoto.metadata?.exif || undefined,
  }
}

// Transforma array of backend photos into frontend photo types
export function transformPhotos(backendPhotos: BackendPhoto[]): Photo[] {
  return backendPhotos.map(transformPhoto)
}

// Colection types and transformers
export interface BackendCollection {
  id: string;
  slug: string;
  name: string;
  description?: string;
  coverPhotoId: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;

  photos: Array<BackendPhoto>;

  _count?: {
    photos: number;
  };
}

// Transform backend collection to frontend Collection type
export function transformCollection(backendCollection: BackendCollection): Collection {
  // console.log("🔍 transformCollection - backendCollection.photos:", backendCollection.photos);

  return {
    slug: backendCollection.slug,
    title: backendCollection.name,
    description: backendCollection.description,
    coverPhotoId: backendCollection.coverPhotoId,
    photoCount: backendCollection._count?.photos || backendCollection.photos?.length || 0,
    // Transform photos if they exist
    photos: backendCollection.photos
      ? backendCollection.photos.map((p) => transformPhoto(p))
      : [],
  };
}``

// Transform array of backend collections
export function transformCollections(backendCollections: BackendCollection[]): Collection[] {
  return backendCollections.map(transformCollection);
}

