# Frontend Architecture - Photography Portfolio

## 📋 Table of Contents
1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Data Flow Architecture](#data-flow-architecture)
5. [Routing & Pages](#routing--pages)
6. [Components Hierarchy](#components-hierarchy)
7. [Current State (Mock Data)](#current-state-mock-data)
8. [API Integration Guide](#api-integration-guide)
9. [Migration Roadmap](#migration-roadmap)

---

## Overview

**Project Type:** Photography Portfolio Website dengan Admin Panel
**Current Status:** ✅ UI selesai, mock data & API layer siap untuk integrasi backend
**Next Step:** Replace mock API di `lib/api.ts` dengan real backend API calls

### Key Features
- 📸 **Public Gallery** - Masonry layout, collections, photo detail
- 🎨 **Dark/Light Theme** - next-themes dengan smooth transitions
- 🔐 **Admin Panel** - Upload, edit, delete photos & collections
- 📱 **Responsive** - Mobile-first design
- ⚡ **Optimized** - Next.js 15 App Router, Image optimization

---

## Tech Stack

```json
{
  "framework": "Next.js 15 (App Router)",
  "language": "TypeScript",
  "styling": "Tailwind CSS",
  "animations": "Framer Motion",
  "theme": "next-themes",
  "state": "React Hooks (useState, useEffect)",
  "forms": "Controlled components",
  "routing": "Next.js App Router (file-based)"
}
```

**Dependencies:**
- `next@15.0.0` - React framework
- `react@19.0.0` - UI library
- `framer-motion@11.0.0` - Animations
- `next-themes@0.4.6` - Theme management
- `react-intersection-observer@9.5.0` - Lazy loading

**No external state management** - Karena admin pages pake client-side fetching dengan local state

---

## Project Structure

```
airu-porto-fe/
│
├── app/                          # Next.js App Router (Pages)
│   ├── layout.tsx               # Root layout: ThemeProvider, Header, Footer
│   ├── page.tsx                 # Homepage: Gallery masonry (PUBLIC)
│   │
│   ├── about/
│   │   └── page.tsx            # About page (PUBLIC)
│   │
│   ├── collections/
│   │   ├── page.tsx            # Collections grid (PUBLIC)
│   │   └── [slug]/page.tsx     # Single collection view (PUBLIC)
│   │
│   ├── photo/
│   │   └── [id]/page.tsx       # Photo detail page (PUBLIC)
│   │
│   └── admin/                   # Admin panel (PROTECTED)
│       ├── login/
│       │   └── page.tsx        # Login page
│       ├── photos/
│       │   ├── page.tsx        # Photo management (list/grid view)
│       │   ├── upload/page.tsx # Upload new photo
│       │   └── [id]/page.tsx   # Edit photo
│       └── collections/
│           ├── page.tsx        # Collection management
│           ├── new/page.tsx    # Create collection
│           └── [slug]/page.tsx # Edit collection
│
├── components/
│   ├── layout/
│   │   ├── Header.tsx          # Navigation + theme toggle
│   │   └── Footer.tsx          # Site footer
│   │
│   ├── gallery/
│   │   ├── MasonryGrid.tsx     # Responsive masonry layout
│   │   └── PhotoCard.tsx       # Photo card dengan hover effects
│   │
│   ├── collections/
│   │   ├── CollectionGrid.tsx  # Grid of collections
│   │   └── CollectionCard.tsx  # Single collection card
│   │
│   ├── admin/
│   │   ├── AdminLayout.tsx     # Admin layout wrapper (checks auth)
│   │   ├── AdminHeader.tsx     # Admin header dengan logout
│   │   ├── AdminSidebar.tsx    # Admin navigation sidebar
│   │   ├── ViewToggle.tsx      # Grid/List view toggle
│   │   ├── PhotoGrid.tsx       # Admin photo grid view
│   │   ├── PhotoList.tsx       # Admin photo list view
│   │   ├── PhotoListItem.tsx   # Single photo item in list
│   │   └── TagInput.tsx        # Tag input component
│   │
│   ├── ui/
│   │   ├── ThemeToggle.tsx     # Theme toggle button
│   │   ├── Button.tsx          # Reusable button component
│   │   └── Input.tsx           # Reusable input component
│   │
│   └── providers/
│       └── ThemeProvider.tsx   # next-themes wrapper
│
├── lib/
│   ├── data.ts                 # 🔴 Static data helpers (JSON files)
│   ├── api.ts                  # 🟡 Mock API layer (READY for backend)
│   └── auth.ts                 # 🟡 Mock auth (localStorage)
│
├── data/
│   ├── photos.json             # 50 mock photos
│   └── collections.json        # 4 mock collections
│
├── types/
│   └── index.ts                # TypeScript type definitions
│
├── styles/
│   └── globals.css             # Global styles + dark mode vars
│
└── scripts/
    └── add-photos.js           # Script to add more mock photos
```

### File Roles

| File | Purpose | Current State |
|------|---------|---------------|
| `lib/data.ts` | Sync helpers untuk read static JSON | ✅ Dipakai di **PUBLIC pages** |
| `lib/api.ts` | Async API layer dengan mock delays | 🟡 Dipakai di **ADMIN pages** (mock) |
| `lib/auth.ts` | Authentication helpers | 🟡 localStorage (temporary) |
| `data/*.json` | Static mock data | 🔴 Will be removed after API integration |

---

## Data Flow Architecture

### **Current State: Dual System**

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                        │
├──────────────────────────────┬──────────────────────────────┤
│      PUBLIC PAGES            │       ADMIN PAGES            │
│  (Server Components)         │   (Client Components)        │
├──────────────────────────────┼──────────────────────────────┤
│  app/page.tsx                │  app/admin/photos/page.tsx   │
│  app/collections/[slug]      │  app/admin/collections/      │
│  app/photo/[id]              │                              │
├──────────────────────────────┼──────────────────────────────┤
│         ↓                    │           ↓                  │
├──────────────────────────────┼──────────────────────────────┤
│   lib/data.ts                │     lib/api.ts               │
│   (Sync, build-time)         │   (Async, runtime)           │
│   ✅ getAllPhotos()          │   🟡 getPhotos()             │
│   ✅ getPhotoById()          │   🟡 updatePhoto()           │
│   ✅ getCollectionss()        │   🟡 uploadPhoto()           │
├──────────────────────────────┼──────────────────────────────┤
│         ↓                    │           ↓                  │
├──────────────────────────────┼──────────────────────────────┤
│   data/photos.json           │   data/photos.json           │
│   data/collections.json      │   (via lib/data.ts)          │
│   (Static JSON)              │   + Mock delays              │
└──────────────────────────────┴──────────────────────────────┘
```

### **After API Integration: Unified System**

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                        │
├──────────────────────────────┬──────────────────────────────┤
│      PUBLIC PAGES            │       ADMIN PAGES            │
│  (Server Components)         │   (Client Components)        │
├──────────────────────────────┼──────────────────────────────┤
│         ↓                    │           ↓                  │
├──────────────────────────────┴──────────────────────────────┤
│                       lib/api.ts                             │
│                  (Real API calls with fetch)                 │
│   getPhotos() → fetch('http://backend/api/photos')          │
│   updatePhoto() → fetch('http://backend/api/photos/:id')    │
│   uploadPhoto() → FormData upload                           │
├──────────────────────────────────────────────────────────────┤
│         ↓                                                    │
├──────────────────────────────────────────────────────────────┤
│                      BACKEND API                             │
│                   (Your existing backend)                    │
│   GET    /api/photos                                         │
│   GET    /api/photos/:id                                     │
│   POST   /api/photos                                         │
│   PUT    /api/photos/:id                                     │
│   DELETE /api/photos/:id                                     │
│   GET    /api/collections                                    │
│   POST   /api/collections                                    │
│   ...                                                        │
└──────────────────────────────────────────────────────────────┘
```

---

## Routing & Pages

### Public Routes (Server Components)

| Route | File | Data Source | Purpose |
|-------|------|-------------|---------|
| `/` | `app/page.tsx` | `getAllPhotos()` | Homepage gallery |
| `/about` | `app/about/page.tsx` | Static | About page |
| `/collections` | `app/collections/page.tsx` | `getAllCollections()` | Collections grid |
| `/collections/[slug]` | `app/collections/[slug]/page.tsx` | `getPhotosByCollection()` | Single collection |
| `/photo/[id]` | `app/photo/[id]/page.tsx` | `getPhotoById()` | Photo detail |

**Characteristics:**
- ✅ Server Components (default di App Router)
- ✅ Data fetching saat build time (Static Generation)
- ✅ SEO-friendly
- 🔴 Currently uses `lib/data.ts` (static JSON)

### Admin Routes (Client Components)

| Route | File | Data Source | Purpose |
|-------|------|-------------|---------|
| `/admin/login` | `app/admin/login/page.tsx` | `lib/auth.ts` | Login form |
| `/admin/photos` | `app/admin/photos/page.tsx` | `getPhotos()` | Photo management |
| `/admin/photos/upload` | `app/admin/photos/upload/page.tsx` | `uploadPhoto()` | Upload form |
| `/admin/photos/[id]` | `app/admin/photos/[id]/page.tsx` | `getPhoto()`, `updatePhoto()` | Edit form |
| `/admin/collections` | `app/admin/collections/page.tsx` | `getCollectionss()` | Collection management |
| `/admin/collections/new` | `app/admin/collections/new/page.tsx` | `createCollection()` | Create form |
| `/admin/collections/[slug]` | `app/admin/collections/[slug]/page.tsx` | `getCollections()`, `updateCollection()` | Edit form |

**Characteristics:**
- 🔵 Client Components (`'use client'`)
- 🔵 Runtime data fetching (client-side)
- 🔐 Protected by `AdminLayout` (checks `isAuthenticated()`)
- 🟡 Currently uses `lib/api.ts` (mock with delays)

---

## Components Hierarchy

### Layout Components

```
RootLayout (app/layout.tsx)
├── ThemeProvider
│   ├── Header
│   │   ├── Navigation Links (/, /collections, /about)
│   │   └── ThemeToggle
│   ├── main
│   │   └── {children} (page content)
│   └── Footer
```

### Public Page Components

```
HomePage (/)
└── MasonryGrid
    └── PhotoCard[] (50 photos)
        ├── Image (next/image)
        ├── Overlay (hover effect)
        └── Metadata (title, location, camera)

CollectionsPage (/collections)
└── CollectionGrid
    └── CollectionCard[] (4 collections)
        ├── Cover Photo
        ├── Title & Description
        └── Photo Count

PhotoDetailPage (/photo/[id])
├── Full Image
├── Metadata Section (title, desc, location)
├── EXIF Data (camera, lens, settings)
├── Tags
├── Collections Links
└── Prev/Next Navigation
```

### Admin Page Components

```
AdminLayout
├── AdminHeader (logout button)
├── AdminSidebar (navigation)
└── {children}
    │
    ├── AdminPhotosPage
    │   ├── Header (title + upload button)
    │   ├── Filters
    │   │   ├── ViewToggle (grid/list)
    │   │   ├── Search Input
    │   │   └── Featured Filter
    │   └── PhotoGrid | PhotoList
    │       └── PhotoCard[] | PhotoListItem[]
    │
    ├── PhotoUploadPage
    │   ├── Image Upload (drag & drop)
    │   ├── Form Fields (title, desc, location)
    │   ├── TagInput
    │   ├── Collection Checkboxes
    │   ├── EXIF Fields
    │   └── Submit Button
    │
    └── PhotoEditPage
        └── (same as upload, pre-filled)
```

---

## Current State (Mock Data)

### lib/data.ts (Static Helpers)

**Used by:** Public pages
**Data source:** `data/photos.json`, `data/collections.json`
**Type:** Synchronous functions

```typescript
// Current implementation
export function getAllPhotos(): Photo[] {
  return photosData as Photo[];
}

export function getPhotoById(id: string): Photo | undefined {
  return photosData.find((photo) => photo.id === id);
}

export function getPhotosByCollection(slug: string): Photo[] {
  return photosData.filter((photo) => photo.collections.includes(slug));
}

export function getAllCollections(): Collection[] {
  return collectionsData as Collection[];
}
```

**Status:** 🔴 Will need to be replaced OR refactored to call `lib/api.ts`

---

### lib/api.ts (Mock API Layer)

**Used by:** Admin pages
**Data source:** Currently wraps `lib/data.ts` with async delays
**Type:** Async functions (ready for real API)

```typescript
// Current mock implementation
export async function getPhotos(filters?: PhotoFilters): Promise<Photo[]> {
  await delay(300); // Simulate network
  let photos = getPhotosFromData(); // From lib/data.ts

  // Apply filters
  if (filters?.collection) {
    photos = photos.filter(p => p.collections.includes(filters.collection!));
  }
  // ... more filters

  return photos;
}

// TODO: Replace with real API
export async function uploadPhoto(file: File, data: PhotoFormData): Promise<Photo> {
  await delay(1000);
  // TODO: Replace with multipart form upload to backend
  console.log('Upload photo', file.name, data);

  // Mock response
  return {
    id: Date.now().toString(),
    src: {
      thumbnail: URL.createObjectURL(file),
      medium: URL.createObjectURL(file),
      full: URL.createObjectURL(file),
    },
    ...data
  };
}
```

**All functions marked with TODO:**
- ✅ `getPhotos()` - GET /api/photos
- ✅ `getPhoto(id)` - GET /api/photos/:id
- ✅ `uploadPhoto()` - POST /api/photos (multipart)
- ✅ `updatePhoto(id, data)` - PUT /api/photos/:id
- ✅ `deletePhoto(id)` - DELETE /api/photos/:id
- ✅ `getCollectionss()` - GET /api/collections
- ✅ `createCollection()` - POST /api/collections
- ✅ `updateCollection()` - PUT /api/collections/:slug
- ✅ `deleteCollection()` - DELETE /api/collections/:slug

**Status:** 🟡 Ready for API integration (just replace TODO lines)

---

### lib/auth.ts (Mock Auth)

**Used by:** Admin pages
**Data source:** localStorage
**Type:** Client-side only

```typescript
// Current mock implementation
export function login(username: string, password: string): boolean {
  const validUsername = process.env.NEXT_PUBLIC_ADMIN_USERNAME || 'admin';
  const validPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';

  if (username === validUsername && password === validPassword) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ username }));
    return true;
  }
  return false;
}

export function isAuthenticated(): boolean {
  return getUser() !== null;
}
```

**Status:** 🔴 Needs to be replaced with JWT/session-based auth

---

## API Integration Guide

### Step-by-Step Migration Plan

#### **Phase 1: Setup API Configuration**

1. **Create API config file**

```typescript
// lib/config.ts
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const API_ENDPOINTS = {
  photos: {
    list: '/api/photos',
    detail: (id: string) => `/api/photos/${id}`,
    create: '/api/photos',
    update: (id: string) => `/api/photos/${id}`,
    delete: (id: string) => `/api/photos/${id}`,
  },
  collections: {
    list: '/api/collections',
    detail: (slug: string) => `/api/collections/${slug}`,
    create: '/api/collections',
    update: (slug: string) => `/api/collections/${slug}`,
    delete: (slug: string) => `/api/collections/${slug}`,
  },
  auth: {
    login: '/api/auth/login',
    logout: '/api/auth/logout',
    verify: '/api/auth/verify',
  },
};
```

2. **Create fetch wrapper with auth**

```typescript
// lib/fetch.ts
import { API_BASE_URL } from './config';

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== 'undefined'
    ? localStorage.getItem('auth_token')
    : null;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  return response.json();
}
```

#### **Phase 2: Update lib/api.ts**

Replace mock implementations dengan real API calls:

```typescript
// lib/api.ts (AFTER integration)
import { apiFetch } from './fetch';
import { API_ENDPOINTS } from './config';

// Photos API
export async function getPhotos(filters?: PhotoFilters): Promise<Photo[]> {
  const params = new URLSearchParams();
  if (filters?.collection) params.set('collection', filters.collection);
  if (filters?.featured !== undefined) params.set('featured', String(filters.featured));
  if (filters?.search) params.set('search', filters.search);

  const query = params.toString() ? `?${params.toString()}` : '';
  return apiFetch<Photo[]>(`${API_ENDPOINTS.photos.list}${query}`);
}

export async function uploadPhoto(file: File, data: PhotoFormData): Promise<Photo> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('data', JSON.stringify(data));

  const token = localStorage.getItem('auth_token');

  const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.photos.create}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData, // Multipart upload
  });

  if (!response.ok) throw new Error('Upload failed');
  return response.json();
}

export async function updatePhoto(id: string, data: Partial<PhotoFormData>): Promise<Photo> {
  return apiFetch<Photo>(API_ENDPOINTS.photos.update(id), {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deletePhoto(id: string): Promise<void> {
  await apiFetch(API_ENDPOINTS.photos.delete(id), {
    method: 'DELETE',
  });
}

// Same pattern for collections...
```

#### **Phase 3: Update lib/auth.ts**

Replace localStorage auth dengan JWT:

```typescript
// lib/auth.ts (AFTER integration)
import { apiFetch } from './fetch';
import { API_ENDPOINTS } from './config';

export async function login(username: string, password: string): Promise<boolean> {
  try {
    const response = await apiFetch<{ token: string; user: User }>(
      API_ENDPOINTS.auth.login,
      {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }
    );

    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    }

    return true;
  } catch (error) {
    return false;
  }
}

export async function logout(): Promise<void> {
  try {
    await apiFetch(API_ENDPOINTS.auth.logout, { method: 'POST' });
  } finally {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
    }
  }
}

export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('auth_token');
}

export async function verifyToken(): Promise<boolean> {
  try {
    await apiFetch(API_ENDPOINTS.auth.verify, { method: 'POST' });
    return true;
  } catch {
    return false;
  }
}
```

#### **Phase 4: Update Public Pages (Optional)**

**Option A:** Keep server components, call API at build time

```typescript
// app/page.tsx
import { getPhotos } from '@/lib/api';

export default async function HomePage() {
  const photos = await getPhotos(); // Now calls real API

  return <MasonryGrid photos={photos} />;
}
```

**Option B:** Use Next.js API Routes as proxy

```typescript
// app/api/photos/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const photos = await fetch('http://backend/api/photos');
  return NextResponse.json(await photos.json());
}

// Then in pages:
const photos = await fetch('/api/photos').then(r => r.json());
```

#### **Phase 5: Environment Variables**

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_ADMIN_USERNAME=admin
NEXT_PUBLIC_ADMIN_PASSWORD=admin123
```

```bash
# .env.production
NEXT_PUBLIC_API_URL=https://api.your-domain.com
```

---

## Migration Roadmap

### ✅ **Already Done**
- UI components complete
- Admin panel UI complete
- Mock API layer with proper function signatures
- Type definitions ready
- Authentication flow (client-side)

### 🔄 **To Do for API Integration**

#### **Week 1: Backend Connection**
- [ ] Create `lib/config.ts` (API endpoints)
- [ ] Create `lib/fetch.ts` (fetch wrapper)
- [ ] Setup environment variables
- [ ] Test backend connectivity

#### **Week 2: Authentication**
- [ ] Update `lib/auth.ts` with JWT
- [ ] Add token refresh logic
- [ ] Update AdminLayout to verify token
- [ ] Add auth error handling
- [ ] Test login/logout flow

#### **Week 3: Photos API**
- [ ] Replace `getPhotos()` in `lib/api.ts`
- [ ] Replace `uploadPhoto()` dengan multipart upload
- [ ] Replace `updatePhoto()`
- [ ] Replace `deletePhoto()`
- [ ] Test admin photo management

#### **Week 4: Collections API**
- [ ] Replace collection CRUD functions
- [ ] Test admin collection management
- [ ] Test photo-collection relationships

#### **Week 5: Public Pages**
- [ ] Update `lib/data.ts` to call `lib/api.ts`
  - OR replace direct imports dengan API calls
- [ ] Add error handling untuk public pages
- [ ] Add loading states
- [ ] Test SSR/SSG dengan real data

#### **Week 6: Polish & Deploy**
- [ ] Add error boundaries
- [ ] Add toast notifications untuk admin actions
- [ ] Add image optimization (CDN?)
- [ ] Remove `data/*.json` files
- [ ] Remove mock code
- [ ] Deploy to production

---

## Key Integration Points

### **What Needs to Change**

| File | Change Required | Difficulty |
|------|-----------------|------------|
| `lib/api.ts` | Replace all TODO lines dengan fetch calls | 🟡 Medium |
| `lib/auth.ts` | Replace localStorage dengan JWT | 🟡 Medium |
| `lib/config.ts` | Create new file | 🟢 Easy |
| `lib/fetch.ts` | Create new file | 🟢 Easy |
| `lib/data.ts` | Refactor to use lib/api OR keep as-is | 🟡 Medium |
| Admin pages | Add error handling & loading states | 🟢 Easy |
| Public pages | Convert to async (if using API) | 🟡 Medium |

### **What Stays the Same**

- ✅ All components (zero changes needed)
- ✅ All types in `types/index.ts`
- ✅ Routing structure
- ✅ Styling & theme system
- ✅ Admin UI flow

---

## Backend API Requirements

Untuk integrasi sempurna, backend lo harus provide endpoints berikut:

### **Authentication**
```
POST /api/auth/login       # { username, password } → { token, user }
POST /api/auth/logout      # Invalidate token
POST /api/auth/verify      # Verify token validity
```

### **Photos**
```
GET    /api/photos                    # List all (with filters)
GET    /api/photos/:id                # Get single photo
POST   /api/photos                    # Upload (multipart/form-data)
PUT    /api/photos/:id                # Update metadata
DELETE /api/photos/:id                # Delete photo
```

**Query params untuk GET /api/photos:**
- `?collection=slug` - Filter by collection
- `?featured=true` - Filter featured
- `?search=query` - Search title/description/location
- `?tags=tag1,tag2` - Filter by tags

### **Collections**
```
GET    /api/collections               # List all
GET    /api/collections/:slug         # Get single collection
POST   /api/collections               # Create new
PUT    /api/collections/:slug         # Update
DELETE /api/collections/:slug         # Delete
POST   /api/collections/:slug/photos  # Add photo to collection
DELETE /api/collections/:slug/photos/:id  # Remove photo from collection
```

### **Response Format**

```typescript
// Success response
{
  "data": Photo | Photo[] | Collection | Collection[],
  "meta"?: {
    "total": number,
    "page": number,
    "limit": number
  }
}

// Error response
{
  "error": {
    "message": string,
    "code": string,
    "details"?: any
  }
}
```

---

## Questions Before Starting

Sebelum mulai integrasi, tolong confirm:

1. **Backend API URL-nya apa?** (local & production)
2. **Auth system-nya gimana?** JWT? Session? Cookie?
3. **Response format-nya udah sesuai dengan yang aku define di atas?**
4. **Image upload flow-nya gimana?**
   - Langsung upload file ke backend?
   - Atau pakai signed URL ke cloud storage (S3, Cloudinary, etc)?
5. **CORS udah di-setup?** Frontend di `localhost:3000` bisa hit backend?

---

## Contact

**Developer:** Rizky (airu)
**Email:** rizkykirigaya@gmail.com

**Next Step:** Share backend API details untuk mulai integrasi! 🚀
