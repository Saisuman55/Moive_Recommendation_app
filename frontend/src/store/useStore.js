import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useStore = create(
  persist(
    (set, get) => ({
      movies: [],
      currentMovie: null,
      watchlist: [],
      recentlyViewed: [],
      filters: {
        search: '',
        genre: '',
        mood: '',
        year: '',
        rating: '',
        language: '',
        sortBy: 'rating',
        sortOrder: 'desc',
      },
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalMovies: 0,
        limit: 10,
        hasNextPage: false,
        hasPrevPage: false,
      },
      isLoading: false,
      error: null,
      trailerModal: {
        isOpen: false,
        trailerUrl: null,
        movieTitle: null,
      },

      setMovies: (movies) => set({ movies }),
      
      setCurrentMovie: (movie) => set({ currentMovie: movie }),
      
      setWatchlist: (watchlist) => set({ watchlist }),
      
      addToWatchlist: (movie) => set((state) => ({
        watchlist: [...state.watchlist, movie],
      })),
      
      removeFromWatchlist: (movieId) => set((state) => ({
        watchlist: state.watchlist.filter((movie) => movie._id !== movieId),
      })),
      
      toggleWatchlist: (movie) => set((state) => {
        const exists = state.watchlist.some((m) => m._id === movie._id);
        if (exists) {
          return {
            watchlist: state.watchlist.filter((m) => m._id !== movie._id),
          };
        }
        return {
          watchlist: [...state.watchlist, movie],
        };
      }),
      
      addToRecentlyViewed: (movie) => set((state) => {
        const filtered = state.recentlyViewed.filter((m) => m._id !== movie._id);
        return {
          recentlyViewed: [movie, ...filtered].slice(0, 10),
        };
      }),
      
      setFilters: (filters) => set((state) => ({
        filters: { ...state.filters, ...filters },
        pagination: { ...state.pagination, currentPage: 1 },
      })),
      
      resetFilters: () => set({
        filters: {
          search: '',
          genre: '',
          mood: '',
          year: '',
          rating: '',
          language: '',
          sortBy: 'rating',
          sortOrder: 'desc',
        },
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalMovies: 0,
          limit: 10,
          hasNextPage: false,
          hasPrevPage: false,
        },
      }),
      
      setPagination: (pagination) => set((state) => ({
        pagination: { ...state.pagination, ...pagination },
      })),
      
      setCurrentPage: (page) => set((state) => ({
        pagination: { ...state.pagination, currentPage: page },
      })),
      
      setLoading: (isLoading) => set({ isLoading }),
      
      setError: (error) => set({ error }),
      
      openTrailerModal: (trailerUrl, movieTitle) => set({
        trailerModal: {
          isOpen: true,
          trailerUrl,
          movieTitle,
        },
      }),
      
      closeTrailerModal: () => set({
        trailerModal: {
          isOpen: false,
          trailerUrl: null,
          movieTitle: null,
        },
      }),
      
      isInWatchlist: (movieId) => {
        return get().watchlist.some((movie) => movie._id === movieId);
      },
    }),
    {
      name: 'movie-app-storage',
      partialize: (state) => ({
        watchlist: state.watchlist,
        recentlyViewed: state.recentlyViewed,
        filters: state.filters,
      }),
    }
  )
);

export default useStore;