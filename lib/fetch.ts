import { API_BASE_URL, STORAGE_KEYS } from "./config";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Public API Fetch - NEVER sends auth token (for public pages)
export async function publicFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  // No token - always public request
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Parse response
  const jsonResponse: ApiResponse<T> = await response.json();

  if (!response.ok || !jsonResponse.success) {
    const errorMessage = jsonResponse.message || "An error occurred";
    throw new Error(errorMessage);
  }

  return (jsonResponse.data ?? jsonResponse) as T;
}

// Admin API Fetch - ALWAYS sends auth token (for admin pages)
export async function adminFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem(STORAGE_KEYS.authToken)
      : null;

  if (!token) {
    throw new Error("Authentication required");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Parse response
  const jsonResponse: ApiResponse<T> = await response.json();

  if (!response.ok || !jsonResponse.success) {
    const errorMessage = jsonResponse.message || "An error occurred";
    throw new Error(errorMessage);
  }

  return (jsonResponse.data ?? jsonResponse) as T;
}

/**
 * Smart API Fetch - Auto-detects based on current route
 * - /admin/* routes → uses adminFetch (requires auth)
 * - Other routes → uses publicFetch (no auth)
 */
export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // Detect if we're on admin route
  const isAdminRoute = typeof window !== "undefined" && window.location.pathname.startsWith('/admin');

  // Use appropriate fetch based on route
  if (isAdminRoute) {
    return adminFetch<T>(endpoint, options);
  } else {
    return publicFetch<T>(endpoint, options);
  }
}

export async function uploadFetch<T>(
  endpoint: string,
  formData: FormData
): Promise<T> {
  // Get authtoken
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem(STORAGE_KEYS.authToken)
      : null;

  const headers: Record<string, string> = {};

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Make Request
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers,
    body: formData,
  });

  // Parse Response
  const jsonResponse: ApiResponse<T> = await response.json();

  // Error Handling
  if (!response.ok || !jsonResponse.success) {
    const errorMessage = jsonResponse.message || "Upload failed";
    throw new Error(errorMessage);
  }

  return jsonResponse.data as T;
}
