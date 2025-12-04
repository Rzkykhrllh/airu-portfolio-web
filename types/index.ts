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
};
