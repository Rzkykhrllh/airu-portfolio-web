import {Photo} from "@/types"

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

  // Tags information from junction table
  tags: Array<{
    photoId: string;
    tag: string;
  }>;

  // Collection information from junction table
  collections: Array<{
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
    tags: backendPhoto.tags.map(t => t.tag),
    collections: backendPhoto.collections.map(c => c.collection.slug),

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

