// Dynamic API Base URL for SSR and Client-side
// - Server-side (SSR): Uses API_BASE_URL to connect directly to backend container
// - Client-side (Browser): Uses NEXT_PUBLIC_API_BASE_URL to go through nginx proxy
const getApiBaseUrl = (): string => {
  // Server-side (SSR) - use direct backend URL
  if (typeof window === 'undefined') {
    return process.env.API_BASE_URL || 'http://localhost:8080';
  }

  // Client-side (Browser) - use nginx proxy path
  return process.env.NEXT_PUBLIC_API_BASE_URL || '/api';
};

export const API_BASE_URL = getApiBaseUrl();

export const API_ENDPOINTS = {
  photos: {
    list: "/photos",
    detail: (id: string) => `/photos/${id}`,
    
    // Private endpoints
    create: "/photos",
    update: (id: string) => `/photos/${id}`,
    delete: (id: string) => `/photos/${id}`,
  },
  collections:{
    list: "/collections",
    detail: (slug: string) => `/collections/slug/${slug}`,

    // Private endpoints (owner only)
    create: "/collections",
    update: (slug: string) => `/collections/slug/${slug}`,
    delete: (slug: string) => `/collections/slug/${slug}`,
  },
  authentication:{
    login: "/auth/login",
    register: "/auth/register",
  },
  health: {
    public: "/health",
    authenticated: "/user/health",
  }

} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  authToken: "auth_token",
  user: "user_data"
} as const;