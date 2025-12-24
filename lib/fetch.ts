import { json } from "stream/consumers";
import { API_BASE_URL, STORAGE_KEYS } from "./config";

interface ApiResponse<T>{
  success: boolean;
  data?: T;
  message?: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
  pagination?: {
    page:number;
    limit:number;
    total: number;
    totalPages: number;
}}

// API Fetch for owner endpoints
export async function apiFetch<T>
  (endpoint: string, options: RequestInit = {})
  : Promise<T> {
    const token = typeof window !== "undefined" 
      ? localStorage.getItem(STORAGE_KEYS.authToken) 
      : null

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    if (token){
      headers["Authorization"] = `Bearer ${token}`
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    })

    // Parse response
    const jsonResponse: ApiResponse<T> = await response.json();

    if (!response.ok || !jsonResponse.success){
      const errorMessage = jsonResponse.message || 'An error occurred';
      throw new Error(errorMessage);
    }

    return jsonResponse.data as T ?? jsonResponse as T;
 }

export async function uploadFetch<T>(
  endpoint: string,
  formData: FormData,
): Promise<T> {

  // Get authtoken
  const token = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.authToken) : null;

  const headers: HeadersInit = {}
  
  if (token){
    headers["Authorization"] = `Bearer ${token}`
  }

  // Make Request
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: formData,
  });

  // Parse Response
  const jsonResponse: ApiResponse<T> = await response.json()

  // Error Handling
  if (!response.ok || !jsonResponse.success){
    const errorMessage = jsonResponse.message || 'Upload failed';
    throw new Error(errorMessage);
  }

  return jsonResponse.data as T;
}