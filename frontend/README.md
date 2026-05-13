# CineVerse - Movie Recommendation Web App

A modern, cinematic movie recommendation platform built with React, featuring a premium Netflix-like UI/UX experience.

## 🚀 Features

### Core Features
- **Movie Discovery**: Browse movies with responsive grid layouts
- **Movie Details**: Immersive movie details pages with hero sections
- **Advanced Search & Filters**: Search by title, genre, mood, year, rating, and language
- **Pagination**: Smooth pagination with 10 movies per page
- **Watchlist**: Save movies to your personal watchlist
- **Recently Viewed**: Track your browsing history
- **Trailer Playback**: Watch movie trailers in a modal popup
- **Cast Information**: View cast members with character details
- **Recommendations**: Get AI-powered movie recommendations

### UI/UX Features
- **Dark Cinematic Theme**: Premium Netflix-inspired design
- **Smooth Animations**: Framer Motion powered transitions
- **Responsive Design**: Optimized for desktop, tablet, and mobile
- **Glassmorphism Effects**: Modern blur and transparency effects
- **Hover Effects**: Interactive movie cards with zoom and glow
- **Skeleton Loading**: Beautiful loading states
- **Lazy Loading**: Optimized image loading

## 🛠️ Tech Stack

### Frontend
- **React 18**: Modern React with hooks
- **React Router 6**: Client-side routing
- **Tailwind CSS**: Utility-first CSS framework
- **Framer Motion**: Animation library
- **Axios**: HTTP client
- **Zustand**: State management
- **Lucide React**: Icon library

### Backend
- **Node.js + Express**: REST API server
- **MongoDB**: NoSQL database
- **Mongoose**: ODM for MongoDB

## 📦 Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- MongoDB (local or Atlas)

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Start the development server:
```bash
npm start
```

The frontend will run on `http://localhost:3000`

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Update the `.env` file with your configuration:
```env
PORT=9000
MONGODB_URI=mongodb://localhost:27017/cineverse
JWT_SECRET=your-secret-key
NODE_ENV=development
```

5. Start the development server:
```bash
npm run dev
```

The backend will run on `http://localhost:9000`

## 📁 Project Structure

```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Navbar.jsx
│   │   ├── MovieCard.jsx
│   │   ├── TrailerModal.jsx
│   │   ├── CastSection.jsx
│   │   └── RecommendedMovies.jsx
│   ├── pages/
│   │   ├── MovieListing.jsx
│   │   ├── MovieDetails.jsx
│   │   └── Watchlist.jsx
│   ├── store/
│   │   └── useStore.js
│   ├── lib/
│   │   └── api.js
│   ├── hooks/
│   ├── App.js
│   ├── index.js
│   └── index.css
├── package.json
├── tailwind.config.js
└── .env

backend/
├── src/
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── movie.controller.js
│   │   └── watchlist.controller.js
│   ├── models/
│   │   ├── Movie.js
│   │   ├── User.js
│   │   └── Watchlist.js
│   ├── routes/
│   │   ├── auth.route.js
│   │   ├── movie.route.js
│   │   └── watchlist.route.js
│   ├── middleware/
│   ├── utils/
│   ├── db/
│   └── seeds/
├── app.js
├── server.js
└── package.json
```

## 🔌 API Endpoints

### Movies
- `GET /api/movies` - Get all movies with pagination and filters
- `GET /api/movies/:id` - Get movie by ID or slug
- `GET /api/movies/:id/trailer` - Get movie trailer
- `GET /api/movies/:id/recommendations` - Get movie recommendations
- `GET /api/movies/trending` - Get trending movies
- `GET /api/movies/mood/:mood` - Get mood-based recommendations

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Watchlist
- `GET /api/watchlist` - Get user's watchlist
- `POST /api/watchlist` - Add movie to watchlist
- `DELETE /api/watchlist/:id` - Remove movie from watchlist
- `GET /api/watchlist/check/:id` - Check if movie is in watchlist

## 🎨 Features Overview

### Movie Listing Page
- Responsive grid layout (2-5 columns based on screen size)
- Movie cards with poster, title, rating, genre, and year
- Hover effects with zoom and glow
- Advanced filtering system
- Pagination with smooth transitions

### Movie Details Page
- Hero section with backdrop image
- Movie information (rating, runtime, release date, language)
- Action buttons (Watch Trailer, Add to Watchlist, Share)
- Overview with expandable text
- Director, writers, cast information
- Budget, revenue, production details
- Streaming platforms
- Horizontal cast carousel
- Recommended movies section

### Search & Filters
- Real-time search
- Genre filter
- Mood filter
- Year filter
- Rating filter
- Language filter
- Sort options (rating, release date, title)

### Watchlist
- Add/remove movies
- Persistent storage
- Quick access from navbar
- Remove button on hover

## 🚀 Deployment

### Frontend (Vercel/Netlify)
1. Build the project:
```bash
npm run build
```

2. Deploy the `build` folder to your hosting platform

### Backend (Heroku/Railway/Render)
1. Set environment variables
2. Deploy the backend server
3. Update frontend API URL

## 📝 Environment Variables

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:9000/api
```

### Backend (.env)
```env
PORT=9000
MONGODB_URI=mongodb://localhost:27017/cineverse
JWT_SECRET=your-secret-key
NODE_ENV=development
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

Built with ❤️ by Suman Roy

## 🙏 Acknowledgments

- TMDB for movie data inspiration
- Netflix for UI/UX design inspiration
- The open-source community