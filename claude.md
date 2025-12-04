# Photography Portfolio - Claude Project Documentation

## Project Overview
A modern, responsive photography portfolio website built with Next.js 14+, featuring a masonry gallery layout, collections system, and light/dark theme toggle. Currently displays 50 placeholder photos with realistic metadata.

**Live Dev Server:** http://localhost:3000

## Tech Stack
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS with dark mode support
- **Animations:** Framer Motion
- **Image Optimization:** next/image
- **Theme Management:** next-themes

## Project Structure

```
├── app/                          # Next.js App Router pages
│   ├── layout.tsx               # Root layout with ThemeProvider
│   ├── page.tsx                 # Main gallery (/)
│   ├── about/page.tsx           # About page
│   ├── collections/
│   │   ├── page.tsx            # Collections list
│   │   └── [slug]/page.tsx     # Single collection view
│   └── photo/[id]/page.tsx     # Photo detail page
│
├── components/
│   ├── layout/
│   │   ├── Header.tsx          # Navigation with theme toggle
│   │   └── Footer.tsx          # Site footer
│   ├── gallery/
│   │   ├── MasonryGrid.tsx     # Responsive masonry layout
│   │   └── PhotoCard.tsx       # Photo card with hover effects
│   ├── collections/
│   │   ├── CollectionGrid.tsx  # Grid of collections
│   │   └── CollectionCard.tsx  # Single collection card
│   ├── providers/
│   │   └── ThemeProvider.tsx   # next-themes wrapper
│   └── ui/
│       └── ThemeToggle.tsx     # Theme toggle button
│
├── data/
│   ├── photos.json             # 50 photos with metadata
│   └── collections.json        # 4 collections
│
├── lib/
│   └── data.ts                 # Helper functions for data
│
├── types/
│   └── index.ts                # TypeScript type definitions
│
├── styles/
│   └── globals.css             # Global styles + dark mode
│
└── scripts/
    └── add-photos.js           # Script to add more photos
```

## Key Features

### 1. Masonry Gallery
- **Responsive columns:**
  - Mobile (<768px): 1 column
  - Tablet (768-1024px): 2 columns
  - Desktop (>1024px): 3 columns
  - Wide (>1440px): 4 columns
- Uses CSS columns for masonry effect
- Staggered fade-in animations on load

### 2. Photo Cards
- **Desktop:** Hover reveals dark gradient overlay with metadata
- **Mobile:** Metadata always visible
- Displays: title, location, camera info, featured badge
- Framer Motion animations (200ms transitions)

### 3. Collections System
- 4 collections: Tokyo Streets, Portraits, Landscapes, Architecture
- Each collection shows cover photo, title, description, photo count
- Filter photos by collection slug

### 4. Theme System
- Light/Dark mode toggle in header
- Uses `next-themes` with class strategy
- Persists preference in localStorage
- Default: dark mode
- Smooth 300ms transitions

### 5. Photo Detail Page
- Full-size image view
- Complete metadata and EXIF data
- Previous/Next navigation
- Tags and collections links

## Data Structure

### Photo Type
```typescript
type Photo = {
  id: string;
  src: {
    thumbnail: string;  // ~400px
    medium: string;     // ~1200px
    full: string;       // ~2400px
  };
  aspectRatio: number;  // height/width for masonry
  title?: string;
  description?: string;
  location?: string;
  tags: string[];
  collections: string[]; // collection slugs
  featured: boolean;
  capturedAt?: string;   // ISO date
  exif?: {
    camera?: string;
    lens?: string;
    aperture?: string;
    shutter?: string;
    iso?: number;
  };
  createdAt: string;
}
```

### Collection Type
```typescript
type Collection = {
  slug: string;
  title: string;
  description?: string;
  coverPhotoId: string;
  photoCount: number;
}
```

## Current Data
- **Photos:** 50 total (IDs 1-50)
- **Collections:** 4 (tokyo-streets, portraits, landscapes, architecture)
- **Images:** Placeholder from Unsplash (images.unsplash.com)

## Styling Guidelines

### Theme Colors
```css
/* Light Mode */
--background: #ffffff
--foreground: #0a0a0a

/* Dark Mode */
--background: #0a0a0a
--foreground: #f5f5f5
```

### Typography
- Font: System font stack (SF Pro, Segoe UI, Roboto, etc.)
- Smooth antialiasing enabled

### Color Classes
**Light mode text:**
- Primary: `text-gray-900`
- Secondary: `text-gray-700 dark:text-gray-300`
- Tertiary: `text-gray-600 dark:text-gray-400`

**Backgrounds:**
- Header: `bg-white dark:bg-black/80`
- Body: Uses CSS variables

### Borders
- Light: `border-gray-200 dark:border-white/10`
- Dark: `border-gray-800 dark:border-gray-700`

## Development Commands

```bash
npm run dev      # Start dev server (localhost:3000)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Adding More Photos

Use the script:
```bash
node scripts/add-photos.js
```

Or manually add to `data/photos.json` following the Photo type structure.

## Git Configuration
- **Remote:** git@rzkykhrllh.github.com:Rzkykhrllh/airu-portfolio-web.git
- **Branch:** main
- **Author:** airu <rizkykirigaya@gmail.com>

## Future Enhancements (Not Yet Implemented)
- [ ] Backend API for photo management
- [ ] User authentication
- [ ] Admin panel for uploads
- [ ] Photo upload functionality
- [ ] Search feature
- [ ] Infinite scroll
- [ ] Real photos from Unsplash profile @airuphotograph
- [ ] Software Engineer portfolio section
- [ ] Homepage with redirect to SE/Photo sections

## Important Notes

1. **Image Loading:** All images use Unsplash with `w=400/1200/2400` parameters
2. **Animations:** Keep transitions under 300ms for smooth UX
3. **Dark Mode:** Default theme, prioritize dark mode styling
4. **Responsive:** Test all breakpoints (mobile, tablet, desktop, wide)
5. **No Border Radius:** Photos use edge-to-edge aesthetic (no rounded corners)
6. **Masonry Gap:** Zero or minimal gap between photos

## Common Tasks

### Update Collection Photo Count
After adding photos to a collection, update `data/collections.json`:
```json
{
  "slug": "collection-name",
  "photoCount": 10  // Update this number
}
```

### Add New Collection
1. Add collection object to `data/collections.json`
2. Add collection slug to photos in `data/photos.json`
3. Create new collection page if custom styling needed

### Modify Theme Colors
Edit `styles/globals.css`:
- `:root` for light mode
- `.dark` for dark mode

## Deployment
- **Platform:** Vercel (recommended)
- **Build Command:** `npm run build`
- **Output:** `.next` directory
- **Environment:** No environment variables needed yet

## Contact
- **Developer:** Rizky (airu)
- **Email:** rizkykirigaya@gmail.com
- **Unsplash:** @airuphotograph

---

**Last Updated:** December 2024
**Current Status:** ✅ Static frontend complete with 50 photos and theme toggle
