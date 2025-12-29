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

  // Tags information - Can be junction table or direct array
  tags?: Array<{
    photoId: string;
    tag: string;
  }> | string[];

  // Collection information - Array of collection objects
  collections?: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
}

// Transform backend photo into frontend photo type
export function transformPhoto(backendPhoto: BackendPhoto): Photo {
  // Handle tags - can be junction table or direct array
  let tags: string[] = [];
  if (backendPhoto.tags) {
    if (Array.isArray(backendPhoto.tags) && backendPhoto.tags.length > 0) {
      // Check if it's junction table format or direct array
      if (typeof backendPhoto.tags[0] === 'string') {
        tags = backendPhoto.tags as string[];
      } else {
        tags = (backendPhoto.tags as Array<{ photoId: string; tag: string }>).map(t => t.tag);
      }
    }
  }

  // Handle collections - backend always returns array of collection objects
  const collections = backendPhoto.collections || [];

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
    tags,
    collections,
    featured: backendPhoto.featured,
    createdAt: backendPhoto.createdAt,
    capturedAt: backendPhoto.capturedAt || undefined,
    exif: backendPhoto.metadata || undefined,
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
  
  return {
    id: backendCollection.id,
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
}

// Transform array of backend collections
export function transformCollections(backendCollections: BackendCollection[]): Collection[] {
  return backendCollections.map(transformCollection);
}

