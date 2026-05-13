import mongoose, { Schema } from "mongoose";

const castSchema = new Schema(
  {
    actorName: {
      type: String,
      required: true,
      index: true,
    },
    characterName: {
      type: String,
      required: true,
    },
    actorImage: {
      type: String,
    },
  },
  { _id: false }
);

const movieSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    overview: {
      type: String,
      required: true,
    },
    tagline: {
      type: String,
    },
    genres: [
      {
        type: String,
        index: true,
      },
    ],
    releaseDate: {
      type: Date,
      index: true,
    },
    runtime: {
      type: Number,
    },
    rating: {
      type: Number,
      min: 0,
      max: 10,
      default: 0,
    },
    votes: {
      type: Number,
      default: 0,
    },
    language: {
      type: String,
      default: "English",
    },
    posterUrl: {
      type: String,
    },
    backdropUrl: {
      type: String,
    },
    trailerUrl: {
      type: String,
    },
    director: {
      type: String,
      index: true,
    },
    writers: [
      {
        type: String,
      },
    ],
    cast: [castSchema],
    productionCompany: {
      type: String,
    },
    budget: {
      type: Number,
    },
    revenue: {
      type: Number,
    },
    ageRating: {
      type: String,
    },
    streamingPlatforms: [
      {
        type: String,
      },
    ],
    country: {
      type: String,
    },
    mood: [
      {
        type: String,
        index: true,
      },
    ],
    keywords: [
      {
        type: String,
        index: true,
      },
    ],
    similarMovies: [
      {
        type: Schema.Types.ObjectId,
        ref: "Movie",
      },
    ],
    isTrending: {
      type: Boolean,
      default: false,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Create text index for search
movieSchema.index({
  title: "text",
  overview: "text",
  tagline: "text",
  "cast.actorName": "text",
  director: "text",
  keywords: "text",
});

// Compound index for filtering
movieSchema.index({ genres: 1, rating: -1, releaseDate: -1 });
movieSchema.index({ mood: 1, rating: -1 });
movieSchema.index({ year: -1, rating: -1 });

export const Movie = mongoose.model("Movie", movieSchema);