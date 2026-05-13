require('dotenv').config();
const connectDB = require('../config/database');
const { Movie, User, ModelMetadata } = require('../models');

const seedMovies = async () => {
  const movies = [
    {
      title: "The Grand Budapest Hotel",
      slug: "grand-budapest-hotel",
      description: "A legendary concierge at a famous European hotel...",
      tagline: "A murder case of Madame D.",
      contentType: "movie",
      releaseYear: 2014,
      runtime: 99,
      rating: "R",
      primaryMood: "happy",
      moodTags: ["happy", "excited"],
      moodConfidence: 0.92,
      genres: ["comedy", "adventure", "feel-good"],
      primaryGenre: "comedy",
      cast: [
        { name: "Ralph Fiennes", character: "M. Gustave", role: "actor", order: 1 },
        { name: "Tony Revolori", character: "Zero", role: "actor", order: 2 }
      ],
      directors: ["Wes Anderson"],
      avgRating: 8.1,
      posterUrl: "https://image.tmdb.org/t/p/w500/nX5XotM9y66CRr9UeZtFHioQkFV.jpg",
      isActive: true
    },
    {
      title: "John Wick",
      slug: "john-wick",
      description: "An ex-hitman comes out of retirement...",
      tagline: "Don't set him off.",
      contentType: "movie",
      releaseYear: 2014,
      runtime: 101,
      rating: "R",
      primaryMood: "angry",
      moodTags: ["angry", "energetic"],
      moodConfidence: 0.95,
      genres: ["action", "thriller", "crime"],
      primaryGenre: "action",
      cast: [
        { name: "Keanu Reeves", character: "John Wick", role: "actor", order: 1 }
      ],
      directors: ["Chad Stahelski"],
      avgRating: 7.4,
      posterUrl: "https://image.tmdb.org/t/p/w500/fZPSd91yGE9fCcCe6OoQrUyr4U0.jpg",
      isActive: true
    },
    {
      title: "La La Land",
      slug: "la-la-land",
      description: "A pianist and an actress fall in love in LA...",
      tagline: "Here's to the fools who dream.",
      contentType: "movie",
      releaseYear: 2016,
      runtime: 128,
      rating: "PG-13",
      primaryMood: "romantic",
      moodTags: ["romantic", "happy"],
      moodConfidence: 0.89,
      genres: ["romance", "drama", "musical"],
      primaryGenre: "romance",
      cast: [
        { name: "Ryan Gosling", character: "Sebastian", role: "actor", order: 1 },
        { name: "Emma Stone", character: "Mia", role: "actor", order: 2 }
      ],
      directors: ["Damien Chazelle"],
      avgRating: 8.0,
      posterUrl: "https://image.tmdb.org/t/p/w500/uDO8zWDhfWWxyy9kNlM7j6l9F1P.jpg",
      isActive: true
    },
    {
      title: "My Neighbor Totoro",
      slug: "my-neighbor-totoro",
      description: "Two girls have adventures with forest spirits...",
      tagline: "The magic of childhood.",
      contentType: "movie",
      releaseYear: 1988,
      runtime: 86,
      rating: "G",
      primaryMood: "stressed",
      moodTags: ["stressed", "relaxed", "happy"],
      moodConfidence: 0.91,
      genres: ["animation", "family", "fantasy", "feel-good"],
      primaryGenre: "animation",
      cast: [
        { name: "Hitoshi Takagi", character: "Totoro", role: "actor", order: 1 }
      ],
      directors: ["Hayao Miyazaki"],
      avgRating: 8.2,
      posterUrl: "https://image.tmdb.org/t/p/w500/rtGDOeG9LzoerkDG0FNk8jr78q0.jpg",
      isActive: true
    },
    {
      title: "A Quiet Place",
      slug: "a-quiet-place",
      description: "A family must live in silence to hide from creatures...",
      tagline: "If they hear you, they hunt you.",
      contentType: "movie",
      releaseYear: 2018,
      runtime: 90,
      rating: "PG-13",
      primaryMood: "fearful",
      moodTags: ["fearful", "stressed"],
      moodConfidence: 0.90,
      genres: ["horror", "thriller", "mystery"],
      primaryGenre: "horror",
      cast: [
        { name: "Emily Blunt", character: "Evelyn Abbott", role: "actor", order: 1 }
      ],
      directors: ["John Krasinski"],
      avgRating: 7.5,
      posterUrl: "https://image.tmdb.org/t/p/w500/nAU74GkpIw0t5i3Y6C7Z0u5Y7yY.jpg",
      isActive: true
    },
    {
      title: "Schindler's List",
      slug: "schindlers-list",
      description: "Oskar Schindler saves Jewish workers during WWII...",
      tagline: "Whoever saves one life, saves the world entire.",
      contentType: "movie",
      releaseYear: 1993,
      runtime: 195,
      rating: "R",
      primaryMood: "emotional",
      moodTags: ["emotional", "sad"],
      moodConfidence: 0.94,
      genres: ["drama", "biography", "history"],
      primaryGenre: "drama",
      cast: [
        { name: "Liam Neeson", character: "Oskar Schindler", role: "actor", order: 1 }
      ],
      directors: ["Steven Spielberg"],
      avgRating: 9.0,
      posterUrl: "https://image.tmdb.org/t/p/w500/sF1U4EUQS8YHUYjNl3pMGNIQyr0.jpg",
      isActive: true
    }
  ];

  await Movie.deleteMany({});
  await Movie.insertMany(movies);
  console.log(`✅ Seeded ${movies.length} movies`);
};

const seedModelMetadata = async () => {
  await ModelMetadata.create({
    name: 'mood-classifier',
    version: 'v1.0.0',
    path: '/models/mood-model-v1/model.json',
    status: 'deployed',
    isActive: true,
    metrics: {
      accuracy: 0.78,
      macroF1: 0.65,
      top2Accuracy: 0.91,
      inferenceTimeMs: 45,
      modelSizeMb: 8.2
    },
    training: {
      datasetSize: 45000,
      epochs: 50,
      batchSize: 64,
      learningRate: 0.001,
      backbone: 'mobilenetv2',
      inputSize: 224
    },
    releaseNotes: 'Initial production model with 11 mood classification'
  });
  console.log('✅ Seeded model metadata');
};

const runSeed = async () => {
  try {
    await connectDB();
    await seedMovies();
    await seedModelMetadata();
    console.log('\n🎉 Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
};

runSeed();
