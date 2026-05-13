import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          localStorage.removeItem('token');
          window.location.href = '/login';
          break;
        case 404:
          console.error('Resource not found');
          break;
        case 500:
          console.error('Server error');
          break;
        default:
          console.error('API error:', error.response.data);
      }
    } else if (error.request) {
      console.error('Network error');
    } else {
      console.error('Request error:', error.message);
    }
    return Promise.reject(error);
  }
);

export const movieAPI = {
  getAllMovies: (params = {}) => {
    return api.get('/movies', { params });
  },
  
  getMovieById: (id) => {
    return api.get(`/movies/${id}`);
  },
  
  getMovieTrailer: (id) => {
    return api.get(`/movies/${id}/trailer`);
  },
  
  getRecommendations: (id, params = {}) => {
    return api.get(`/movies/${id}/recommendations`, { params });
  },
  
  getTrendingMovies: (params = {}) => {
    return api.get('/movies/trending', { params });
  },
  
  getMoodRecommendations: (mood, params = {}) => {
    return api.get(`/movies/mood/${mood}`, { params });
  },
  
  searchMovies: (params = {}) => {
    return api.get('/movies', { params });
  },
};

export const authAPI = {
  login: (credentials) => {
    return api.post('/auth/login', credentials);
  },
  
  register: (userData) => {
    return api.post('/auth/register', userData);
  },
  
  logout: () => {
    return api.post('/auth/logout');
  },
  
  getCurrentUser: () => {
    return api.get('/auth/me');
  },
};

export const watchlistAPI = {
  getWatchlist: () => {
    return api.get('/watchlist');
  },
  
  addToWatchlist: (movieId) => {
    return api.post('/watchlist', { movieId });
  },
  
  removeFromWatchlist: (movieId) => {
    return api.delete(`/watchlist/${movieId}`);
  },
  
  isInWatchlist: (movieId) => {
    return api.get(`/watchlist/check/${movieId}`);
  },
};

export default api;
