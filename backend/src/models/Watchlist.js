import mongoose, { Schema } from "mongoose";

const watchlistSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    movie: {
      type: Schema.Types.ObjectId,
      ref: "Movie",
      required: true,
      index: true,
    },
    watched: {
      type: Boolean,
      default: false,
    },
    rating: {
      type: Number,
      min: 0,
      max: 10,
    },
    notes: {
      type: String,
      maxlength: 500,
    },
  },
  { timestamps: true }
);

// Compound index to prevent duplicate watchlist entries
watchlistSchema.index({ user: 1, movie: 1 }, { unique: true });

watchlistSchema.pre(/^find/, function (next) {
  this.populate({
    path: "movie",
    select: "title posterUrl rating releaseDate genres runtime",
  });
  next();
});

export const Watchlist = mongoose.model("Watchlist", watchlistSchema);