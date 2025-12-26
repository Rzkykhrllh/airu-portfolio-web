export type Photo = {
  id: string;
  src: {
    thumbnail: string; // ~400px width
    medium: string; // ~1200px width
    full: string; // original
  };
  aspectRatio: number; // height/width for masonry
  title?: string;
  description?: string;
  location?: string;
  tags: string[];
  collections: string[]; // collection slugs
  featured: boolean;
  capturedAt?: string; // ISO date
  exif?: {
    camera?: string;
    lens?: string;
    aperture?: string;
    shutter?: string;
    iso?: number;
  };
  createdAt: string;
};

export type Collection = {
  slug: string;
  title: string;
  description?: string;
  coverPhotoId: string;
  photoCount: number;
  photos?: Photo[]; // Optional: included when fetching with photos relation
};

// Admin-specific types
export type PhotoFormData = {
  title: string;
  description: string;
  location: string;
  tags: string[];
  collections: string[];
  featured: boolean;
  capturedAt: string;
  exif: {
    camera: string;
    lens: string;
    aperture: string;
    shutter: string;
    iso: string;
  };
};

export type CollectionFormData = {
  title: string;
  slug: string;
  description: string;
  coverPhotoId: string;
};

export type User = {
  username: string;
};

export type AuthState = {
  isAuthenticated: boolean;
  user: User | null;
};

export type PhotoFilters = {
  collection?: string;
  tags?: string[];
  featured?: boolean;
  search?: string;
  limit?: number;
};
