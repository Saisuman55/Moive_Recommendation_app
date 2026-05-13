# Movie App Setup Instructions

## Step 1: Install Node.js

Since Node.js is not installed, you need to install it first:

### Option A: Install via Homebrew (Recommended)
```bash
# Install Homebrew if not already installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node
```

### Option B: Install via nvm (Node Version Manager)
```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Restart terminal, then install Node.js
nvm install --lts
nvm use --lts
```

### Option C: Download from official website
Visit https://nodejs.org and download the LTS version for macOS.

## Step 2: Install Project Dependencies

Once Node.js is installed, navigate to the project folder:

```bash
cd "/Users/saisumansamantaray/work/moive app/antigravity/movie-app"
```

Install all dependencies:

```bash
npm install
```

## Step 3: Run the Development Server

```bash
npm run dev
```

The app will be available at http://localhost:3000

## Step 4: Build for Production

```bash
npm run build
npm start
```

## Troubleshooting

### If you see "command not found: npm"
Make sure Node.js is properly installed by running:
```bash
node -v
npm -v
```

### If there are port conflicts
Run the dev server on a different port:
```bash
npm run dev -- -p 3001
```

### To clear Next.js cache
```bash
rm -rf .next
npm run dev
```

## Project Features

✅ Movie listing with responsive grid
✅ Movie details page with hero section
✅ YouTube trailer modal with fullscreen
✅ Search and filter functionality
✅ Pagination (10 movies per page)
✅ Watchlist with localStorage
✅ Like/favorite movies
✅ Recently viewed tracking
✅ Cast carousel
✅ Similar movie recommendations
✅ Dark cinematic theme
✅ Smooth animations with Framer Motion
✅ Glassmorphism effects
✅ Responsive design

## API Endpoints

- GET /api/movies - Get movies with pagination
- GET /api/movies/[id] - Get single movie
- GET /api/movies/[id]/trailer - Get trailer
- GET /api/movies/[id]/recommendations - Get similar movies
- GET /api/trending - Get trending movies
- GET /api/filters - Get filter options
- GET /api/recommendations/mood?mood=action - Mood-based recommendations