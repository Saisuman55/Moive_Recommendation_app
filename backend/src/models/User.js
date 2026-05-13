import mongoose, { Schema } from "mongoose";

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    avatar: {
      type: String,
      default: "", // Can be a URL or hex color
    },
    bio: {
      type: String,
      maxlength: 200,
      default: "",
    },
    role: {
      type: String,
      enum: ["user", "admin", "moderator"],
      default: "user",
    },
    watchlist: [
      {
        type: Schema.Types.ObjectId,
        ref: "Movie",
      },
    ],
    likedMovies: [
      {
        type: Schema.Types.ObjectId,
        ref: "Movie",
      },
    ],
    recentlyViewed: [
      {
        movie: {
          type: Schema.Types.ObjectId,
          ref: "Movie",
        },
        viewedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    preferences: {
      genres: [
        {
          type: String,
        },
      ],
      mood: {
        type: String,
        enum: [
          "happy",
          "sad",
          "adventurous",
          "romantic",
          "scared",
          "thoughtful",
          "energetic",
          "relaxed",
        ],
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);