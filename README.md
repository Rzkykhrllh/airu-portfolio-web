# Photography Portfolio Website

A beautiful, minimal photography portfolio website built with Next.js 14+, inspired by Unsplash.

## Features

- **Masonry Gallery Layout**: Responsive masonry grid that adapts to different screen sizes
  - Mobile (<768px): 1 column
  - Tablet (768-1024px): 2 columns
  - Desktop (>1024px): 3 columns
  - Wide (>1440px): 4 columns

- **Interactive Photo Cards**: Hover animations with metadata overlay using Framer Motion
- **Collections System**: Organize photos into themed collections
- **Photo Detail Pages**: Full-size photo view with complete metadata and EXIF data
- **Dark Theme**: Minimal UI with focus on photography
- **Fully Responsive**: Optimized for all device sizes

## Tech Stack

- **Next.js 15** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Framer Motion** for smooth animations
- **react-intersection-observer** for scroll effects
- **next/image** for optimized image loading

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run the development server**:
   ```bash
   npm run dev
   ```

3. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
├── app/
│   ├── layout.tsx              # Root layout with Header/Footer
│   ├── page.tsx                # Main gallery page
│   ├── about/
│   │   └── page.tsx            # About page
│   ├── collections/
│   │   ├── page.tsx            # Collections list
│   │   └── [slug]/
│   │       └── page.tsx        # Single collection view
│   └── photo/
│       └── [id]/
│           └── page.tsx        # Photo detail page
├── components/
│   ├── layout/
│   │   ├── Header.tsx          # Navigation header
│   │   └── Footer.tsx          # Site footer
│   ├── gallery/
│   │   ├── MasonryGrid.tsx     # Responsive masonry layout
│   │   └── PhotoCard.tsx       # Photo card with hover effects
│   └── collections/
│       ├── CollectionGrid.tsx  # Collections grid layout
│       └── CollectionCard.tsx  # Collection card component
├── data/
│   ├── photos.json             # Photo data
│   └── collections.json        # Collections data
├── types/
│   └── index.ts                # TypeScript type definitions
├── lib/
│   └── data.ts                 # Data fetching helper functions
└── styles/
    └── globals.css             # Global styles and dark theme
```

## Customization

### Adding Photos

Edit `data/photos.json` to add your photos. Each photo should include:
- Unique ID
- Image URLs (thumbnail, medium, full)
- Aspect ratio
- Title, description, location
- Tags and collections
- EXIF data (optional)

### Adding Collections

Edit `data/collections.json` to create new collections:
- Unique slug
- Title and description
- Cover photo ID
- Photo count

### Styling

The project uses a dark theme by default. Customize colors in:
- `styles/globals.css` - CSS variables
- `tailwind.config.ts` - Tailwind theme configuration

## Build for Production

```bash
npm run build
npm start
```

## Deployment

This project is configured for easy deployment on Vercel:

1. Push your code to GitHub
2. Import the repository in Vercel
3. Deploy with zero configuration

The `next.config.js` is already configured to allow Unsplash images.

## Pages

- **/** - Main gallery with all photos in masonry layout
- **/collections** - Grid of all collections
- **/collections/[slug]** - Photos in a specific collection
- **/photo/[id]** - Detailed photo view with metadata
- **/about** - About page with bio and contact info

## Features to Add in Future Steps

This is Step 1 (static frontend). Future enhancements could include:
- Backend API
- User authentication
- Admin panel for managing photos
- Photo upload functionality
- Search feature
- Infinite scroll
- Lightbox/modal view

## License

MIT License - feel free to use this project for your own portfolio!
