export interface CastMember {
  id: number;
  name: string;
  character: string;
  profileImage: string;
}

export interface Movie {
  id: number;
  title: string;
  overview: string;
  posterUrl: string;
  backdropUrl: string;
  rating: number;
  genres: string[];
  releaseYear: number;
  runtime: number;
  releaseDate: string;
  language: string;
  country: string;
  director: string;
  writers: string[];
  productionCompany: string;
  budget: number;
  revenue: number;
  ageRating: string;
  tagline?: string;
  trailerUrl: string;
  cast: CastMember[];
  mood?: string[];
}

export interface MovieFilters {
  search?: string;
  genres?: string[];
  minRating?: number;
  maxRating?: number;
  yearFrom?: number;
  yearTo?: number;
  language?: string;
  mood?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface TrailerVideo {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  size: number;
}