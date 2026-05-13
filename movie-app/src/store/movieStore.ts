import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Movie, MovieFilters } from '@/types/movie';
import { sampleMovies, allGenres, allMoods, allLanguages } from '@/lib/movies';

interface MovieStore {
  movies: Movie[];
  filteredMovies: Movie[];
  currentPage: number;
  pageSize: number;
  filters: MovieFilters;
  watchlist: number[];
  recentlyViewed: number[];
  likedMovies: number[];
  
  // Actions
  setMovies: (movies: Movie[]) => void;
  setCurrentPage: (page: number) => void;
  setFilters: (filters: MovieFilters) => void;
  applyFilters: () => void;
  addToWatchlist: (movieId: number) => void;
  removeFromWatchlist: (movieId: number) => void;
  addToRecentlyViewed: (movieId: number) => void;
  toggleLike: (movieId: number) => void;
  resetFilters: () => void;
  getFilteredMovies: () => Movie[];
  isInWatchlist: (movieId: number) => boolean;
  isLiked: (movieId: number) => boolean;
}

export const useMovieStore = create<MovieStore>()(
  persist(
    (set, get) => ({
      movies: sampleMovies,
      filteredMovies: sampleMovies,
      currentPage: 1,
      pageSize: 10,
      filters: {},
      watchlist: [],
      recentlyViewed: [],
      likedMovies: [],

      setMovies: (movies) => {
        set({ movies, filteredMovies: movies });
      },

      setCurrentPage: (page) => set({ currentPage: page }),

      setFilters: (filters) => {
        set({ filters, currentPage: 1 });
        get().applyFilters();
      },

      applyFilters: () => {
        const { movies, filters } = get();
        let filtered = [...movies];

        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          filtered = filtered.filter(
            (movie) =>
              movie.title.toLowerCase().includes(searchLower) ||
              movie.overview.toLowerCase().includes(searchLower)
          );
        }

        if (filters.genres && filters.genres.length > 0) {
          filtered = filtered.filter((movie) =>
            filters.genres!.some((genre) => movie.genres.includes(genre))
          );
        }

        if (filters.minRating !== undefined) {
          filtered = filtered.filter((movie) => movie.rating >= filters.minRating!);
        }

        if (filters.maxRating !== undefined) {
          filtered = filtered.filter((movie) => movie.rating <= filters.maxRating!);
        }

        if (filters.yearFrom !== undefined) {
          filtered = filtered.filter((movie) => movie.releaseYear >= filters.yearFrom!);
        }

        if (filters.yearTo !== undefined) {
          filtered = filtered.filter((movie) => movie.releaseYear <= filters.yearTo!);
        }

        if (filters.language) {
          filtered = filtered.filter((movie) => movie.language === filters.language);
        }

        if (filters.mood) {
          filtered = filtered.filter((movie) =>
            movie.mood?.some((m) => m === filters.mood)
          );
        }

        set({ filteredMovies: filtered, currentPage: 1 });
      },

      addToWatchlist: (movieId) => {
        set((state) => ({
          watchlist: [...state.watchlist, movieId],
        }));
      },

      removeFromWatchlist: (movieId) => {
        set((state) => ({
          watchlist: state.watchlist.filter((id) => id !== movieId),
        }));
      },

      addToRecentlyViewed: (movieId) => {
        set((state) => {
          const filtered = state.recentlyViewed.filter((id) => id !== movieId);
          return {
            recentlyViewed: [movieId, ...filtered].slice(0, 20),
          };
        });
      },

      toggleLike: (movieId) => {
        set((state) => ({
          likedMovies: state.likedMovies.includes(movieId)
            ? state.likedMovies.filter((id) => id !== movieId)
            : [...state.likedMovies, movieId],
        }));
      },

      resetFilters: () => {
        set({ filters: {}, filteredMovies: get().movies, currentPage: 1 });
      },

      getFilteredMovies: () => get().filteredMovies,

      isInWatchlist: (movieId) => get().watchlist.includes(movieId),

      isLiked: (movieId) => get().likedMovies.includes(movieId),
    }),
    {
      name: 'movie-store',
      partialize: (state) => ({
        watchlist: state.watchlist,
        recentlyViewed: state.recentlyViewed,
        likedMovies: state.likedMovies,
      }),
    }
  )
);

export const usePagination = () => {
  const { filteredMovies, currentPage, pageSize } = useMovieStore();

  const totalItems = filteredMovies.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedMovies = filteredMovies.slice(startIndex, endIndex);
  const hasNext = currentPage < totalPages;
  const hasPrev = currentPage > 1;

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      useMovieStore.getState().setCurrentPage(page);
    }
  };

  const nextPage = () => goToPage(currentPage + 1);
  const prevPage = () => goToPage(currentPage - 1);

  return {
    movies: paginatedMovies,
    currentPage,
    totalPages,
    totalItems,
    hasNext,
    hasPrev,
    nextPage,
    prevPage,
    goToPage,
  };
};

export const getPaginatedMovies = (page: number, pageSize: number = 10) => {
  const filteredMovies = useMovieStore.getState().filteredMovies;
  const totalItems = filteredMovies.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  return {
    data: filteredMovies.slice(startIndex, endIndex),
    page,
    pageSize,
    totalItems,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
};