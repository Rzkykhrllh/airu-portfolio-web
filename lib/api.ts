import {
  Photo,
  PhotoFormData,
  PhotoFilters,
  Collection,
  CollectionFormData,
} from "@/types";
import { apiFetch, uploadFetch } from "./fetch";
import { API_ENDPOINTS } from "./config";
import { transformPhoto, transformPhotos, BackendPhoto } from "./transformers";
import { form } from "framer-motion/client";


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
    `${API_ENDPOINTS.photos.list}${queryString}  `
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

  console.log(metadata);

  const response = await uploadFetch<BackendPhoto>(
    API_ENDPOINTS.photos.create,
    formData
  );

  // Return Transformed Photo
  return transformPhoto(response);
}

export async function deletePhoto(id: string): Promise<void> {
  await apiFetch(API_ENDPOINTS.photos.delete(id), {
    method: "DELETE",
  });
}
