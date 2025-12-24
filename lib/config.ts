export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

export const API_ENDPOINTS = {
  photos: {
    list: "/photos",
    detail: (id: string) => `/photos/${id}`,
    
    // Private endpoints
    create: "/photos",
    update: (id: string) => `/photos/${id}`,
    delete: (id: string) => `/photos/${id}`,
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