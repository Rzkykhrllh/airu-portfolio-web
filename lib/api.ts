import {
  Photo,
  PhotoFormData,
  PhotoFilters,
  Collection,
  CollectionFormData,
} from "@/types";
import { apiFetch, uploadFetch } from "./fetch";
import { API_ENDPOINTS } from "./config";
import {
  transformPhoto,
  transformPhotos,
  BackendPhoto,
  transformCollection,
  transformCollections,
  BackendCollection,
} from "./transformers";


export async function getPhotos(filters?: PhotoFilters): Promise<Photo[]> {
  // Buiild query parameters
  const params = new URLSearchParams();

  if (filters?.featured !== undefined) {
    params.append("featured", String(filters?.featured));
  }

  // TODO: Adjust the details with backend.
  if (filters?.collection) {
    params.set(`collection`, filters.collection);
  }

  if (filters?.tags && filters.tags.length > 0) {
    params.set("tag", filters.tags.join(","));
  }

  params.set("limit", String(filters?.limit ?? 100));

  const queryString = params.toString() ? `?${params.toString()}` : "";

  // Fetch data from API
  const response = await apiFetch<BackendPhoto[]>(
    `${API_ENDPOINTS.photos.list}${queryString}`
  );

  // Transform response data into frontend Photo type
  const photos = transformPhotos(response);

  // TODO: Add fe for searching photos by title or description

  return photos;
}

export async function getPhoto(id: string): Promise<Photo | null> {
  try {
    const response = await apiFetch<BackendPhoto>(
      API_ENDPOINTS.photos.detail(id)
    )
    const photo = transformPhoto(response)
    return photo;
  } catch (error) {
    console.log("Failed to fetch photo", error);
    return null;
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
  formData.append("capturedAt", metadata.capturedAt);

  if (metadata.tags && metadata.tags.length > 0) {
    metadata.tags.forEach((tag) => formData.append("tags[]", tag));
  }

  if (metadata.collections && metadata.collections.length > 0) {
    metadata.collections.forEach((collection) =>
      formData.append("collections[]", collection)
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
  if (data.capturedAt !== undefined) payload.capturedAt = data.capturedAt;
  if (data.tags && data.tags.length > 0) payload.tags = data.tags;
  if (data.collections && data.collections.length > 0) payload.collectionsIds = data.collections;
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

export async function getCollections(): Promise<Collection[]> {
  const response = await apiFetch<BackendCollection[]>(
    API_ENDPOINTS.collections.list
  );

  return transformCollections(response);
}

export async function getCollection(slug: string): Promise<Collection | null> {
  try {
    const response = await apiFetch<BackendCollection>(
      API_ENDPOINTS.collections.detail(slug)
    );
    return transformCollection(response);
  } catch (error) {
    console.error("Failed to fetch collection:", error);
    return null;
  }
}

export async function createCollection(
  data: CollectionFormData
): Promise<Collection> {
  const payload = {
    slug: data.slug,
    name: data.title,
    description: data.description,
    coverPhotoId: data.coverPhotoId,
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
  if (data.coverPhotoId !== undefined) payload.coverPhotoId = data.coverPhotoId;

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

// Get photos by collection slug
export async function getPhotosByCollection(slug: string): Promise<Photo[]> {
  return getPhotos({ collection: slug });
}