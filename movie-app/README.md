# CineVault - Premium Movie Recommendation Platform

A modern, cinematic movie discovery and recommendation web application built with Next.js, Tailwind CSS, and Framer Motion.

## Features

### Core Features
- **Movie Listing Page**: Responsive grid with movie cards
- **Movie Details Page**: Cinematic hero section with full movie information
- **Trailer Player**: YouTube trailer modal with fullscreen support
- **Pagination**: 10 movies per page with smooth navigation
- **Search & Filters**: Real-time search by title, genre, mood, language, year, and rating
- **Watchlist**: Persistent user watchlist with localStorage
- **Like System**: Mark favorite movies
- **Recently Viewed**: Track viewing history

### UI/UX Features
- Dark cinematic theme inspired by Netflix/IMDb
- Glassmorphism effects and blur backgrounds
- Smooth Framer Motion animations
- Hover effects on movie cards (zoom, glow, shadow)
- Responsive design (mobile, tablet, desktop)
- Skeleton loading states
- Custom scrollbars

### API Endpoints
- `GET /api/movies` - Get all movies with pagination and filters
- `GET /api/movies/[id]` - Get movie by ID
- `GET /api/movies/[id]/trailer` - Get movie trailer
- `GET /api/movies/[id]/recommendations` - Get similar movies
- `GET /api/trending` - Get trending movies
- `GET /api/filters` - Get available filter options
- `GET /api/recommendations/mood?mood=action` - Get mood-based recommendations

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **State Management**: Zustand with persistence
- **Icons**: Lucide React
- **HTTP Client**: Axios (for API calls)

## Installation

### Prerequisites
- Node.js 18+ and npm/yarn

### Setup

1. Navigate to the project directory:
```bash
cd movie-app
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
src/
├── app/
│   ├── api/           # API routes
│   │   ├── movies/    # Movie endpoints
│   │   ├── trending/  # Trending movies
│   │   └── filters/   # Filter options
│   ├── movie/[id]/    # Dynamic movie details page
│   ├── globals.css    # Global styles
│   ├── layout.tsx     # Root layout
│   └── page.tsx       # Home page
├── components/
│   ├── MovieCard.tsx      # Movie card component
│   ├── Navbar.tsx         # Navigation bar
│   ├── Footer.tsx         # Footer
│   ├── FilterBar.tsx      # Search and filters
│   ├── Pagination.tsx     # Pagination controls
│   ├── HeroSection.tsx    # Movie hero section
│   ├── CastSection.tsx    # Cast carousel
│   ├── RecommendedSection.tsx # Recommendations
│   ├── TrailerModal.tsx   # YouTube modal
│   └── Skeleton.tsx       # Loading skeletons
├── lib/
│   └── movies.ts          # Movie data
├── store/
│   └── movieStore.ts      # Zustand store
└── types/
    └── movie.ts           # TypeScript interfaces
```

## API Usage Examples

### Get all movies with pagination
```
GET /api/movies?page=1&pageSize=10
```

### Search movies
```
GET /api/movies?search=inception
```

### Filter by genre
```
GET /api/movies?genres=Action&genres=Sci-Fi
```

### Filter by rating
```
GET /api/movies?minRating=8
```

### Get recommendations
```
GET /api/movies/6/recommendations
```

### Mood-based recommendations
```
GET /api/recommendations/mood?mood=action
```

## Customization

### Colors
Edit `tailwind.config.js` to customize the color scheme:
```javascript
colors: {
  primary: {
    DEFAULT: '#e50914',  // Netflix red
    hover: '#f40612',
  },
  // ...
}
```

### Add More Movies
Edit `src/lib/movies.ts` to add movie data:
```typescript
export const sampleMovies: Movie[] = [
  {
    id: 11,
    title: 'Your Movie',
    overview: 'Description...',
    posterUrl: 'https://...',
    // ...
  },
];
```

## Features Roadmap

- [ ] User authentication
- [ ] Advanced AI recommendations
- [ ] User reviews and ratings
- [ ] Social sharing
- [ ] Voice search
- [ ] Dark/Light theme toggle
- [ ] Progressive Web App (PWA) support

## License

MIT License - feel free to use this project for learning or commercial purposes.

## Credits

Design inspiration from: Netflix, IMDb, TMDb