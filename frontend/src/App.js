import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import MovieListing from './pages/MovieListing';
import MovieDetails from './pages/MovieDetails';
import Watchlist from './pages/Watchlist';
import './index.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <Navbar />
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<MovieListing />} />
            <Route path="/movie/:slug" element={<MovieDetails />} />
            <Route path="/watchlist" element={<Watchlist />} />
          </Routes>
        </AnimatePresence>
      </div>
    </Router>
  );
}

export default App;