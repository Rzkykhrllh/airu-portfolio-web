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
  console.log('WOYY GUA BERHASIL FETCH KE BACKEND', photos.length);
  console.log('is array?', Array.isArray(photos));

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
