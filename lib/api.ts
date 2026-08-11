import {
  Photo,
  PhotoFormData,
  PhotoFilters,
  Collection,
  CollectionFormData,
  Inquiry,
  InquiryFormData,
} from "@/types";
import { apiFetch, publicFetch, publicFetchWithMeta, adminFetch, adminFetchWithMeta, uploadFetch, ApiError } from "./fetch";
import { API_ENDPOINTS } from "./config";
import {
  transformPhoto,
  transformPhotos,
  BackendPhoto,
  transformCollection,
  transformCollections,
  BackendCollection,
} from "./transformers";


function buildPhotoQueryParams(filters?: PhotoFilters): URLSearchParams {
  const params = new URLSearchParams();

  // Scope parameter for visibility filtering (handled by backend)
  // public: PUBLIC only (default)
  // collection: PUBLIC + COLLECTION_ONLY
  // admin: PUBLIC + COLLECTION_ONLY + PRIVATE (requires auth)
  if (filters?.scope) {
    params.set("scope", filters.scope);
  }

  if (filters?.featured !== undefined) {
    params.append("featured", String(filters?.featured));
  }

  if (filters?.collection) {
    params.set("collectionSlug", filters.collection);
  }

  if (filters?.tags && filters.tags.length > 0) {
    params.set("tag", filters.tags.join(","));
  }

  if (filters?.search) {
    params.set("search", filters.search);
  }

  if (filters?.sort) {
    params.set("sort", filters.sort);
  }

  if (filters?.visibility) {
    params.set("visibility", filters.visibility);
  }

  if (filters?.page) {
    params.set("page", String(filters.page));
  }

  params.set("limit", String(filters?.limit ?? 100));

  return params;
}

export async function getPhotos(filters?: PhotoFilters): Promise<Photo[]> {
  const queryString = `?${buildPhotoQueryParams(filters).toString()}`;

  // Special handling: scope=admin forces adminFetch, others use publicFetch
  // This overrides route-based detection for getPhotos
  const fetchFn = filters?.scope === 'admin' ? adminFetch : publicFetch;

  // Try/catch only for public calls — admin pages handle their own errors
  if (filters?.scope === 'admin') {
    const response = await fetchFn<BackendPhoto[]>(
      `${API_ENDPOINTS.photos.list}${queryString}`
    );
    return transformPhotos(response);
  }

  try {
    const response = await fetchFn<BackendPhoto[]>(
      `${API_ENDPOINTS.photos.list}${queryString}`
    );

    const photos = transformPhotos(response);

    return photos;
  } catch (error) {
    console.error("Failed to fetch photos:", error);
    return [];
  }
}

// Paginated photo fetch that also exposes total/hasMore, for infinite-scroll UIs.
// Public scope only (no admin use case for infinite scroll today).
export async function getPhotosPage(
  filters?: PhotoFilters
): Promise<{ photos: Photo[]; total: number; page: number; totalPages: number }> {
  const queryString = `?${buildPhotoQueryParams(filters).toString()}`;

  try {
    const { data, pagination } = await publicFetchWithMeta<BackendPhoto[]>(
      `${API_ENDPOINTS.photos.list}${queryString}`
    );

    return {
      photos: transformPhotos(data),
      total: pagination?.total ?? data.length,
      page: pagination?.page ?? filters?.page ?? 1,
      totalPages: pagination?.totalPages ?? 1,
    };
  } catch (error) {
    console.error("Failed to fetch photos:", error);
    return { photos: [], total: 0, page: 1, totalPages: 1 };
  }
}

export async function getPhoto(id: string): Promise<Photo | null> {
  try {
    const response = await apiFetch<BackendPhoto>(
      API_ENDPOINTS.photos.detail(id)
    )
    const photo = transformPhoto(response)
    return photo;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    console.error("Failed to fetch photo:", error);
    throw error;
  }
}

export async function uploadPhoto(
  file: File,
  metadata: PhotoFormData
): Promise<Photo> {
  const formData = new FormData();
  formData.append("image", file);
  formData.append("title", metadata.title);
  formData.append("description", metadata.description);
  formData.append("location", metadata.location);
  formData.append("featured", String(metadata.featured));
  formData.append("visibility", metadata.visibility);
  formData.append("capturedAt", metadata.capturedAt);

  if (metadata.tags && metadata.tags.length > 0) {
    metadata.tags.forEach((tag) => formData.append("tags[]", tag));
  }

  if (metadata.collections && metadata.collections.length > 0) {
    metadata.collections.forEach((collectionId) =>
      formData.append("collectionIds[]", collectionId)
    );
  }

  // Append EXIF if exist
  if (metadata.exif) {
    formData.append("exif", JSON.stringify(metadata.exif));
  }

  const response = await uploadFetch<BackendPhoto>(
    API_ENDPOINTS.photos.create,
    formData
  );

  // Return Transformed Photo
  return transformPhoto(response);
}

export async function updatePhoto(
  id: string,
  data: Partial<PhotoFormData>
): Promise<Photo>{

  const payload : Record<string, any> = {};

  if (data.title !== undefined) payload.title = data.title;
  if (data.description !== undefined) payload.description = data.description;
  if (data.location !== undefined) payload.location = data.location;
  if (data.featured !== undefined) payload.featured = data.featured;
  if (data.visibility !== undefined) payload.visibility = data.visibility;
  if (data.capturedAt !== undefined) payload.capturedAt = data.capturedAt;
  if (data.tags && data.tags.length > 0) payload.tags = data.tags;
  if (data.collections !== undefined) payload.collectionIds = data.collections;
  if (data.exif !== undefined) payload.exif = data.exif;

  const respone = await apiFetch<BackendPhoto>(
    API_ENDPOINTS.photos.update(id),
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  return transformPhoto(respone);
}

export async function deletePhoto(id: string): Promise<void> {
  await apiFetch(API_ENDPOINTS.photos.delete(id), {
    method: "DELETE",
  });
}

// ============ Collection API ============

export async function getCollections(
  scope?: 'public' | 'admin'
): Promise<Collection[]> {
  const params = new URLSearchParams();

  // Add scope parameter if specified
  // public (default): Collections with PUBLIC + COLLECTION_ONLY photos
  // admin: Collections with ALL photos (requires auth)
  if (scope) {
    params.set('scope', scope);
  }

  const queryString = params.toString() ? `?${params.toString()}` : '';

  // scope=admin → adminFetch (with token), otherwise publicFetch
  const fetchFn = scope === 'admin' ? adminFetch : publicFetch;

  // Try/catch only for public calls — admin pages handle their own errors
  if (scope === 'admin') {
    const response = await fetchFn<BackendCollection[]>(
      `${API_ENDPOINTS.collections.list}${queryString}`
    );
    return transformCollections(response);
  }

  try {
    const response = await fetchFn<BackendCollection[]>(
      `${API_ENDPOINTS.collections.list}${queryString}`
    );

    return transformCollections(response);
  } catch (error) {
    console.error("Failed to fetch collections:", error);
    return [];
  }
}

export async function getCollection(
  slug: string,
  scope?: 'public' | 'admin'
): Promise<Collection | null> {
  try {
    const params = new URLSearchParams();

    // Add scope parameter if specified
    // public (default): PUBLIC + COLLECTION_ONLY photos
    // admin: ALL photos (requires auth)
    if (scope) {
      params.set('scope', scope);
    }

    const queryString = params.toString() ? `?${params.toString()}` : '';

    // scope=admin → adminFetch (with token), otherwise publicFetch
    const fetchFn = scope === 'admin' ? adminFetch : publicFetch;

    const response = await fetchFn<BackendCollection>(
      `${API_ENDPOINTS.collections.detail(slug)}${queryString}`
    );
    return transformCollection(response);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    console.error("Failed to fetch collection:", error);
    throw error;
  }
}

export async function createCollection(
  data: CollectionFormData
): Promise<Collection> {
  const payload = {
    slug: data.slug,
    name: data.title,
    description: data.description,
  };

  const response = await apiFetch<BackendCollection>(
    API_ENDPOINTS.collections.create,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );

  return transformCollection(response);
}

export async function updateCollection(
  slug: string,
  data: Partial<CollectionFormData>
): Promise<Collection> {
  const payload: Record<string, any> = {};

  if (data.title !== undefined) payload.name = data.title;
  if (data.slug !== undefined) payload.slug = data.slug;
  if (data.description !== undefined) payload.description = data.description;

  const response = await apiFetch<BackendCollection>(
    API_ENDPOINTS.collections.update(slug),
    {
      method: "PUT",
      body: JSON.stringify(payload),
    }
  );

  return transformCollection(response);
}

export async function deleteCollection(slug: string): Promise<void> {
  await apiFetch(API_ENDPOINTS.collections.delete(slug), {
    method: "DELETE",
  });
}

export async function reorderCollectionPhotos(
  slug: string,
  photoIds: string[]
): Promise<Collection> {
  const response = await apiFetch<BackendCollection>(
    API_ENDPOINTS.collections.reorder(slug),
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ photoIds }),
    }
  );

  return transformCollection(response);
}

// Get photos by collection slug
export async function getPhotosByCollection(slug: string): Promise<Photo[]> {
  return getPhotos({ collection: slug });
}

// ============ Inquiries (contact form) ============

export async function submitInquiry(data: InquiryFormData): Promise<void> {
  await publicFetch(API_ENDPOINTS.inquiries.create, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getInquiries(params?: {
  page?: number;
  limit?: number;
  read?: boolean;
}): Promise<{ inquiries: Inquiry[]; unreadCount: number; total: number; totalPages: number }> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.read !== undefined) query.set("read", String(params.read));

  const queryString = query.toString() ? `?${query.toString()}` : "";
  const { data, pagination, unreadCount } = await adminFetchWithMeta<Inquiry[]>(
    `${API_ENDPOINTS.inquiries.list}${queryString}`
  );

  return {
    inquiries: data,
    unreadCount: unreadCount ?? 0,
    total: pagination?.total ?? data.length,
    totalPages: pagination?.totalPages ?? 1,
  };
}

export async function markInquiryRead(id: string, read: boolean): Promise<Inquiry> {
  return adminFetch<Inquiry>(API_ENDPOINTS.inquiries.markRead(id), {
    method: "PATCH",
    body: JSON.stringify({ read }),
  });
}

export async function deleteInquiry(id: string): Promise<void> {
  await adminFetch(API_ENDPOINTS.inquiries.delete(id), {
    method: "DELETE",
  });
}