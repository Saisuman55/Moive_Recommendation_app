import connectDB from "../db/index.js";
import { Movie } from "../models/Movie.js";

const seedMovies = async () => {
  try {
    await connectDB();

    // Clear existing data
    await Movie.deleteMany({});
    console.log("Cleared existing movies");

    const movies = [
      // Sci-Fi
      {
        title: "Inception",
        slug: "inception",
        overview:
          "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.",
        tagline: "Your mind is the scene of the crime.",
        genres: ["Sci-Fi", "Action", "Thriller"],
        releaseDate: new Date("2010-07-16"),
        runtime: 148,
        rating: 8.8,
        votes: 2200000,
        language: "English",
        posterUrl:
          "https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCji3RQ38IcmgCB.jpg",
        backdropUrl:
          "https://image.tmdb.org/t/p/original/s3TBrJKVoFRHI2s6WdmdiGz7cCC.jpg",
        trailerUrl: "YoHxHQLfDbk",
        director: "Christopher Nolan",
        writers: ["Christopher Nolan"],
        cast: [
          {
            actorName: "Leonardo DiCaprio",
            characterName: "Dom Cobb",
            actorImage: "https://image.tmdb.org/t/p/w500/smhWxWp1GsPfL26yQLNJ-DR3pxl.jpg",
          },
          {
            actorName: "Joseph Gordon-Levitt",
            characterName: "Arthur",
            actorImage: "https://image.tmdb.org/t/p/w500/4U9G4QaeePXvVjHdkVm4R2V0D5Y.jpg",
          },
          {
            actorName: "Elliot Page",
            characterName: "Ariadne",
            actorImage: "https://image.tmdb.org/t/p/w500/lMwSZ1aSyGc2puTwCWFuWDWY4tT.jpg",
          },
        ],
        productionCompany: "Warner Bros. Pictures",
        budget: 160000000,
        revenue: 836800000,
        ageRating: "PG-13",
        streamingPlatforms: ["Netflix", "Amazon Prime"],
        country: "USA",
        mood: ["Thrilling", "Mind-Bending", "Epic"],
        keywords: ["dreams", "subconscious", "heist"],
        isTrending: true,
        isFeatured: true,
      },
      {
        title: "Interstellar",
        slug: "interstellar",
        overview:
          "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.",
        tagline: "Mankind was born on Earth. It was not meant to die here.",
        genres: ["Sci-Fi", "Drama", "Adventure"],
        releaseDate: new Date("2014-11-07"),
        runtime: 169,
        rating: 8.6,
        votes: 1900000,
        language: "English",
        posterUrl:
          "https://image.tmdb.org/t/p/w500/gEU2QniL6Ekd3l9LKqFk6fWJRrA.jpg",
        backdropUrl:
          "https://image.tmdb.org/t/p/original/rAiYwiRYu1lSLjB5eHrp1bN8c4b.jpg",
        trailerUrl: "zSWVN1LvVzU",
        director: "Christopher Nolan",
        writers: ["Christopher Nolan", "Jonathan Nolan"],
        cast: [
          {
            actorName: "Matthew McConaughey",
            characterName: "Cooper",
            actorImage: "https://image.tmdb.org/t/p/w500/pFxYe2lZnq0h6sM7W73bW0J4yPx.jpg",
          },
          {
            actorName: "Anne Hathaway",
            characterName: "Brand",
            actorImage: "https://image.tmdb.org/t/p/w500/tLelKoPNoy4tY6lKwJuXHzi3Z.jpg",
          },
          {
            actorName: "Jessica Chastain",
            characterName: "Murph (adult)",
            actorImage: "https://image.tmdb.org/t/p/w500/lMU5tCjI0kRHDEiW4qWiiJ6bP.jpg",
          },
        ],
        productionCompany: "Paramount Pictures",
        budget: 165000000,
        revenue: 677500000,
        ageRating: "PG-13",
        streamingPlatforms: ["Netflix", "Hulu"],
        country: "USA",
        mood: ["Emotional", "Epic", "Thought-provoking"],
        keywords: ["space", "time", "wormhole", "black hole"],
        isTrending: true,
        isFeatured: true,
      },
      {
        title: "The Matrix",
        slug: "the-matrix",
        overview:
          "A computer hacker learns from mysterious rebels about the true nature of his reality and his role in the war against its controllers.",
        tagline: "The fight for the future begins.",
        genres: ["Sci-Fi", "Action"],
        releaseDate: new Date("1999-03-31"),
        runtime: 136,
        rating: 8.7,
        votes: 1800000,
        language: "English",
        posterUrl:
          "https://image.tmdb.org/t/p/w500/f89U3ADr1oi674gxlLP4DcKkzaC.jpg",
        backdropUrl:
          "https://image.tmdb.org/t/p/original/fzB9wNqXZ37hXsHJYd7cKDmWk.jpg",
        trailerUrl: "mPevsM1Nsof4",
        director: "Lana Wachowski",
        writers: ["Lana Wachowski", "Lilly Wachowski"],
        cast: [
          {
            actorName: "Keanu Reeves",
            characterName: "Neo",
            actorImage: "https://image.tmdb.org/t/p/w500/4D0PpwpGbpOgl0WvMUSlD2fP7b4.jpg",
          },
          {
            actorName: "Laurence Fishburne",
            characterName: "Morpheus",
            actorImage: "https://image.tmdb.org/t/p/w500/3o2s1kJc8tF1b9pJ4m6z2k2q.jpg",
          },
          {
            actorName: "Carrie-Anne Moss",
            characterName: "Trinity",
            actorImage: "https://image.tmdb.org/t/p/w500/rRDKlJz7s1x3v0jH2wKtqXl9q.jpg",
          },
        ],
        productionCompany: "Warner Bros. Pictures",
        budget: 63000000,
        revenue: 463500000,
        ageRating: "R",
        streamingPlatforms: ["Netflix"],
        country: "USA",
        mood: ["Mind-Bending", "Action-packed", "Classic"],
        keywords: ["AI", "simulation", "dystopia"],
        isTrending: false,
        isFeatured: true,
      },
      {
        title: "Blade Runner 2049",
        slug: "blade-runner-2049",
        overview:
          "Young Blade Runner K's discovery of a long-buried secret leads him to track down former Blade Runner Rick Deckard, who's been missing for thirty years.",
        tagline: "There's still a page left.",
        genres: ["Sci-Fi", "Thriller", "Drama"],
        releaseDate: new Date("2017-10-06"),
        runtime: 164,
        rating: 8.0,
        votes: 540000,
        language: "English",
        posterUrl:
          "https://image.tmdb.org/t/p/w500/gajF8Udk2S1QZ3Z9p5v5f9t9U.jpg",
        backdropUrl:
          "https://image.tmdb.org/t/p/original/sA0o9bLH9xP8zW7g1r3nP3X9.jpg",
        trailerUrl: "gCcx85NClIE",
        director: "Denis Villeneuve",
        writers: ["Hampton Fancher", "Michael Green"],
        cast: [
          {
            actorName: "Ryan Gosling",
            characterName: "K",
            actorImage: "https://image.tmdb.org/t/p/w500/5XyMwD6v5M9k8J9t9Xy8j9Z.jpg",
          },
          {
            actorName: "Harrison Ford",
            characterName: "Rick Deckard",
            actorImage: "https://image.tmdb.org/t/p/w500/6VJ8wJZP5t9t7t7t9tXt9tXtXtXt.jpg",
          },
          {
            actorName: "Ana de Armas",
            characterName: "Joi",
            actorImage: "https://image.tmdb.org/t/p/w500/9yP9t3t7t7t7t7t7t7t7t7t7t.jpg",
          },
        ],
        productionCompany: "Alcon Entertainment",
        budget: 150000000,
        revenue: 259200000,
        ageRating: "R",
        streamingPlatforms: ["HBO Max", "Amazon Prime"],
        country: "USA",
        mood: ["Atmospheric", "Slow-burn", "Visually Stunning"],
        keywords: ["cyberpunk", "AI", "identity"],
        isTrending: true,
        isFeatured: false,
      },
      {
        title: "Dune",
        slug: "dune-2021",
        overview:
          "A noble family becomes embroiled in a war for control over the galaxy's most valuable asset while its heir becomes troubled by visions of a dark future.",
        tagline: "It begins.",
        genres: ["Sci-Fi", "Adventure", "Drama"],
        releaseDate: new Date("2021-10-22"),
        runtime: 155,
        rating: 8.0,
        votes: 650000,
        language: "English",
        posterUrl:
          "https://image.tmdb.org/t/p/w500/d5NXSklX5x7G0y0J9EyO8T0H0H0H.jpg",
        backdropUrl:
          "https://image.tmdb.org/t/p/original/jYEWU0zS5Q5k9F5t9J9A1N1N1N1N.jpg",
        trailerUrl: "8g18j_SAe1U",
        director: "Denis Villeneuve",
        writers: ["Jon Spaihts", "Denis Villeneuve", "Eric Roth"],
        cast: [
          {
            actorName: "Timothée Chalamet",
            characterName: "Paul Atreides",
            actorImage: "https://image.tmdb.org/t/p/w500/lMU5tCjI0kRHDEiW4qWiiJ6bP.jpg",
          },
          {
            actorName: "Rebecca Ferguson",
            characterName: "Lady Jessica",
            actorImage: "https://image.tmdb.org/t/p/w500/jYEWU0zS5Q5k9F5t9J9A1N1N1N1N.jpg",
          },
          {
            actorName: "Zendaya",
            characterName: "Chani",
            actorImage: "https://image.tmdb.org/t/p/w500/tLelKoPNoy4tY6lKwJuXHzi3Z.jpg",
          },
        ],
        productionCompany: "Legendary Pictures",
        budget: 165000000,
        revenue: 434000000,
        ageRating: "PG-13",
        streamingPlatforms: ["HBO Max"],
        country: "USA",
        mood: ["Epic", "Visually Stunning", "Intense"],
        keywords: ["desert", "spice", "dynasty"],
        isTrending: true,
        isFeatured: true,
      },

      // Action
      {
        title: "The Dark Knight",
        slug: "the-dark-knight",
        overview:
          "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.",
        tagline: "Why So Serious?",
        genres: ["Action", "Crime", "Drama"],
        releaseDate: new Date("2008-07-18"),
        runtime: 152,
        rating: 9.0,
        votes: 2600000,
        language: "English",
        posterUrl:
          "https://image.tmdb.org/t/p/w500/qJ2tW6WM1MvAgbGs0T8xD8y1j.jpg",
        backdropUrl:
          "https://image.tmdb.org/t/p/original/hrBpKnufpX1w0LVXD3N8t6Q0X.jpg",
        trailerUrl: "EXe8hVLQdus",
        director: "Christopher Nolan",
        writers: ["Jonathan Nolan", "Christopher Nolan"],
        cast: [
          {
            actorName: "Christian Bale",
            characterName: "Bruce Wayne / Batman",
            actorImage: "https://image.tmdb.org/t/p/w500/bJeWmH0X0Da50LwX9f1q4q5q.jpg",
          },
          {
            actorName: "Heath Ledger",
            characterName: "Joker",
            actorImage: "https://image.tmdb.org/t/p/w500/jYEWU0zS5Q5k9F5t9J9A1N1N1N1N.jpg",
          },
          {
            actorName: "Aaron Eckhart",
            characterName: "Harvey Dent",
            actorImage: "https://image.tmdb.org/t/p/w500/tLelKoPNoy4tY6lKwJuXHzi3Z.jpg",
          },
        ],
        productionCompany: "Warner Bros. Pictures",
        budget: 185000000,
        revenue: 1005000000,
        ageRating: "PG-13",
        streamingPlatforms: ["HBO Max", "Amazon Prime"],
        country: "USA",
        mood: ["Intense", "Dark", "Masterpiece"],
        keywords: ["superhero", "crime", "dystopia"],
        isTrending: true,
        isFeatured: true,
      },
      {
        title: "Mad Max: Fury Road",
        slug: "mad-max-fury-road",
        overview:
          "In a post-apocalyptic wasteland, a woman rebels against a tyrannical ruler in search for her homeland with the aid of a group of female prisoners, a psychotic worshipper, and a drifter named Max.",
        tagline: "What a lovely day.",
        genres: ["Action", "Adventure", "Sci-Fi"],
        releaseDate: new Date("2015-05-15"),
        runtime: 120,
        rating: 8.1,
        votes: 960000,
        language: "English",
        posterUrl:
          "https://image.tmdb.org/t/p/w500/8tZYtuW6b2wYh1yE59s1aW4e4.jpg",
        backdropUrl:
          "https://image.tmdb.org/t/p/original/tbhdm6k2NsJ9Pnz7Ei6v7foP.jpg",
        trailerUrl: "hE7NP7lU5Hg",
        director: "George Miller",
        writers: ["George Miller", "Brendan McCarthy", "Nico Lathouris"],
        cast: [
          {
            actorName: "Tom Hardy",
            characterName: "Max Rockatansky",
            actorImage: "https://image.tmdb.org/t/p/w500/4D0PpwpGbpOgl0WvMUSlD2fP7b4.jpg",
          },
          {
            actorName: "Charlize Theron",
            characterName: "Imperator Furiosa",
            actorImage: "https://image.tmdb.org/t/p/w500/tLelKoPNoy4tY6lKwJuXHzi3Z.jpg",
          },
          {
            actorName: "Nicholas Hoult",
            characterName: "Nux",
            actorImage: "https://image.tmdb.org/t/p/w500/lMU5tCjI0kRHDEiW4qWiiJ6bP.jpg",
          },
        ],
        productionCompany: "Warner Bros. Pictures",
        budget: 150000000,
        revenue: 374700000,
        ageRating: "R",
        streamingPlatforms: ["Max", "Amazon Prime"],
        country: "Australia",
        mood: ["Adrenaline", "Visually Stunning", "Chaotic"],
        keywords: ["post-apocalyptic", "vehicles", "chase"],
        isTrending: true,
        isFeatured: false,
      },

      // Drama
      {
        title: "The Shawshank Redemption",
        slug: "the-shawshank-redemption",
        overview:
          "Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.",
        tagline: "Fear can hold you prisoner. Hope can set you free.",
        genres: ["Drama"],
        releaseDate: new Date("1994-09-10"),
        runtime: 142,
        rating: 9.3,
        votes: 2700000,
        language: "English",
        posterUrl:
          "https://image.tmdb.org/t/p/w500/9cqNjs0mW6Jq9lWfFsD0da7bxH1.jpg",
        backdropUrl:
          "https://image.tmdb.org/t/p/original/kXhab8JiYvYJc0pYoJ2W4s9J6g.jpg",
        trailerUrl: "NiK1wZ4_6g8",
        director: "Frank Darabont",
        writers: ["Frank Darabont", "Stephen King"],
        cast: [
          {
            actorName: "Tim Robbins",
            characterName: "Andy Dufresne",
            actorImage: "https://image.tmdb.org/t/p/w500/jYEWU0zS5Q5k9F5t9J9A1N1N1N1N.jpg",
          },
          {
            actorName: "Morgan Freeman",
            characterName: "Ellis Boyd 'Red' Redding",
            actorImage: "https://image.tmdb.org/t/p/w500/tLelKoPNoy4tY6lKwJuXHzi3Z.jpg",
          },
          {
            actorName: "Bob Gunton",
            characterName: "Warden Samuel Norton",
            actorImage: "https://image.tmdb.org/t/p/w500/lMU5tCjI0kRHDEiW4qWiiJ6bP.jpg",
          },
        ],
        productionCompany: "Columbia Pictures",
        budget: 25000000,
        revenue: 58300000,
        ageRating: "R",
        streamingPlatforms: ["Netflix", "Amazon Prime"],
        country: "USA",
        mood: ["Uplifting", "Emotional", "Classic"],
        keywords: ["prison", "hope", "friendship"],
        isTrending: false,
        isFeatured: true,
      },
      {
        title: "Parasite",
        slug: "parasite",
        overview:
          "Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.",
        tagline: "Act like you own the place.",
        genres: ["Thriller", "Drama", "Comedy"],
        releaseDate: new Date("2019-05-30"),
        runtime: 132,
        rating: 8.6,
        votes: 690000,
        language: "Korean",
        posterUrl:
          "https://image.tmdb.org/t/p/w500/7IiTTgqlnvFq3mF9Q9Z8X8qX.jpg",
        backdropUrl:
          "https://image.tmdb.org/t/p/original/TuY3GPIy4L7S9Y5j9J9Z8X8q.jpg",
        trailerUrl: "5xH0Hf1e8j0",
        director: "Bong Joon Ho",
        writers: ["Bong Joon Ho", "Han Jin-won"],
        cast: [
          {
            actorName: "Song Kang-ho",
            characterName: "Kim Ki-taek",
            actorImage: "https://image.tmdb.org/t/p/w500/4D0PpwpGbpOgl0WvMUSlD2fP7b4.jpg",
          },
          {
            actorName: "Lee Sun-kyun",
            characterName: "Park Dong-ik",
            actorImage: "https://image.tmdb.org/t/p/w500/jYEWU0zS5Q5k9F5t9J9A1N1N1N1N.jpg",
          },
          {
            actorName: "Cho Yeo-jeong",
            characterName: "Choi Yeon-gyo",
            actorImage: "https://image.tmdb.org/t/p/w500/tLelKoPNoy4tY6lKwJuXHzi3Z.jpg",
          },
        ],
        productionCompany: "CJ Entertainment",
        budget: 11200000,
        revenue: 258800000,
        ageRating: "R",
        streamingPlatforms: ["Hulu"],
        country: "South Korea",
        mood: ["Dark", "Satirical", "Twisted"],
        keywords: ["class", "family", "deception"],
        isTrending: true,
        isFeatured: false,
      },

      // Thriller
      {
        title: "Silence of the Lambs",
        slug: "the-silence-of-the-lambs",
        overview:
          "A young FBI cadet must receive the help of an incarcerated and manipulative cannibal killer to help catch another serial killer, a madman who skins his victims.",
        tagline: "To enter the mind of a killer she must challenge the mind of a madman.",
        genres: ["Thriller", "Crime", "Drama"],
        releaseDate: new Date("1991-02-14"),
        runtime: 118,
        rating: 8.6,
        votes: 1500000,
        language: "English",
        posterUrl:
          "https://image.tmdb.org/t/p/w500/rplLq3tZdL8dY3j9t7t9t9t9t.jpg",
        backdropUrl:
          "https://image.tmdb.org/t/p/original/lplLq3tZdL8dY3j9t7t9t9t9t.jpg",
        trailerUrl: "RuXoY2Lm3jY",
        director: "Jonathan Demme",
        writers: ["Ted Tally", "Thomas Harris"],
        cast: [
          {
            actorName: "Jodie Foster",
            characterName: "Clarice Starling",
            actorImage: "https://image.tmdb.org/t/p/w500/4D0PpwpGbpOgl0WvMUSlD2fP7b4.jpg",
          },
          {
            actorName: "Anthony Hopkins",
            characterName: "Dr. Hannibal Lecter",
            actorImage: "https://image.tmdb.org/t/p/w500/jYEWU0zS5Q5k9F5t9J9A1N1N1N1N.jpg",
          },
          {
            actorName: "Scott Glenn",
            characterName: "Jack Crawford",
            actorImage: "https://image.tmdb.org/t/p/w500/tLelKoPNoy4tY6lKwJuXHzi3Z.jpg",
          },
        ],
        productionCompany: "Orion Pictures",
        budget: 19000000,
        revenue: 273000000,
        ageRating: "R",
        streamingPlatforms: ["Amazon Prime"],
        country: "USA",
        mood: ["Dark", "Suspenseful", "Psychological"],
        keywords: ["serial killer", "psychopath", "detective"],
        isTrending: false,
        isFeatured: false,
      },
      {
        title: "Se7en",
        slug: "se7en",
        overview:
          "Two detectives, a rookie and a veteran, hunt a serial killer who uses the seven deadly sins as his motives.",
        tagline: "Long is the way, and hard, that out of hell leads up to light.",
        genres: ["Crime", "Drama", "Thriller"],
        releaseDate: new Date("1995-09-22"),
        runtime: 127,
        rating: 8.6,
        votes: 1800000,
        language: "English",
        posterUrl:
          "https://image.tmdb.org/t/p/w500/69S7p8w8QH7I893m0Q5lFqgI9.jpg",
        backdropUrl:
          "https://image.tmdb.org/t/p/original/69S7p8w8QH7I893m0Q5lFqgI9.jpg",
        trailerUrl: "znmZ0ZvKGJk",
        director: "David Fincher",
        writers: ["Andrew Kevin Walker"],
        cast: [
          {
            actorName: "Brad Pitt",
            characterName: "David Mills",
            actorImage: "https://image.tmdb.org/t/p/w500/4D0PpwpGbpOgl0WvMUSlD2fP7b4.jpg",
          },
          {
            actorName: "Morgan Freeman",
            characterName: "William Somerset",
            actorImage: "https://image.tmdb.org/t/p/w500/jYEWU0zS5Q5k9F5t9J9A1N1N1N1N.jpg",
          },
          {
            actorName: "Gwyneth Paltrow",
            characterName: "Tracy Mills",
            actorImage: "https://image.tmdb.org/t/p/w500/tLelKoPNoy4tY6lKwJuXHzi3Z.jpg",
          },
        ],
        productionCompany: "New Line Cinema",
        budget: 33000000,
        revenue: 327300000,
        ageRating: "R",
        streamingPlatforms: ["HBO Max"],
        country: "USA",
        mood: ["Dark", "Intense", "Twisted"],
        keywords: ["serial killer", "seven deadly sins", "detective"],
        isTrending: true,
        isFeatured: false,
      },

      // Horror
      {
        title: "Get Out",
        slug: "get-out",
        overview:
          "A young African-American visits his white girlfriend's parents for the weekend, where his simmering uneasiness about their reception of him eventually reaches a boiling point.",
        tagline: "Just because you're invited, doesn't mean you're welcome.",
        genres: ["Horror", "Thriller", "Mystery"],
        releaseDate: new Date("2017-02-24"),
        runtime: 104,
        rating: 7.7,
        votes: 550000,
        language: "English",
        posterUrl:
          "https://image.tmdb.org/t/p/w500/5XyMwD6v5M9k8J9t9Xy8j9Z.jpg",
        backdropUrl:
          "https://image.tmdb.org/t/p/original/5XyMwD6v5M9k8J9t9Xy8j9Z.jpg",
        trailerUrl: "D8jPCCsXgLE",
        director: "Jordan Peele",
        writers: ["Jordan Peele"],
        cast: [
          {
            actorName: "Daniel Kaluuya",
            characterName: "Chris Washington",
            actorImage: "https://image.tmdb.org/t/p/w500/4D0PpwpGbpOgl0WvMUSlD2fP7b4.jpg",
          },
          {
            actorName: "Allison Williams",
            characterName: "Rose Armitage",
            actorImage: "https://image.tmdb.org/t/p/w500/jYEWU0zS5Q5k9F5t9J9A1N1N1N1N.jpg",
          },
          {
            actorName: "Catherine Keener",
            characterName: "Missy Armitage",
            actorImage: "https://image.tmdb.org/t/p/w500/tLelKoPNoy4tY6lKwJuXHzi3Z.jpg",
          },
        ],
        productionCompany: "Blumhouse Productions",
        budget: 4500000,
        revenue: 255400000,
        ageRating: "R",
        streamingPlatforms: ["Peacock"],
        country: "USA",
        mood: ["Suspenseful", "Twisted", "Social Commentary"],
        keywords: ["racism", "horror", "thriller"],
        isTrending: true,
        isFeatured: false,
      },
      {
        title: "Hereditary",
        slug: "hereditary",
        overview:
          "A grieving family is haunted by tragic and disturbing occurrences.",
        tagline: "Every family tree hides a secret.",
        genres: ["Horror", "Drama", "Mystery"],
        releaseDate: new Date("2018-06-08"),
        runtime: 127,
        rating: 7.3,
        votes: 480000,
        language: "English",
        posterUrl:
          "https://image.tmdb.org/t/p/w500/lMU5tCjI0kRHDEiW4qWiiJ6bP.jpg",
        backdropUrl:
          "https://image.tmdb.org/t/p/original/lMU5tCjI0kRHDEiW4qWiiJ6bP.jpg",
        trailerUrl: "V6wCj9jABP8",
        director: "Ari Aster",
        writers: ["Ari Aster"],
        cast: [
          {
            actorName: "Toni Collette",
            characterName: "Annie Graham",
            actorImage: "https://image.tmdb.org/t/p/w500/4D0PpwpGbpOgl0WvMUSlD2fP7b4.jpg",
          },
          {
            actorName: "Alex Wolff",
            characterName: "Peter Graham",
            actorImage: "https://image.tmdb.org/t/p/w500/jYEWU0zS5Q5k9F5t9J9A1N1N1N1N.jpg",
          },
          {
            actorName: "Gabriel Byrne",
            characterName: "Steve Graham",
            actorImage: "https://image.tmdb.org/t/p/w500/tLelKoPNoy4tY6lKwJuXHzi3Z.jpg",
          },
        ],
        productionCompany: "A24",
        budget: 10000000,
        revenue: 79100000,
        ageRating: "R",
        streamingPlatforms: ["Max", "Hulu"],
        country: "USA",
        mood: ["Unsettling", "Disturbing", "Slow-burn"],
        keywords: ["family", "trauma", "possession"],
        isTrending: false,
        isFeatured: false,
      },

      // Romance
      {
        title: "La La Land",
        slug: "la-la-land",
        overview:
          "While navigating their careers in Los Angeles, a pianist and an actress fall in love while attempting to reconcile their aspirations for the future.",
        tagline: "Here's to the fools who dream.",
        genres: ["Romance", "Drama", "Musical"],
        releaseDate: new Date("2016-12-09"),
        runtime: 128,
        rating: 8.0,
        votes: 580000,
        language: "English",
        posterUrl:
          "https://image.tmdb.org/t/p/w500/uDO8zWDkwBCxwPm56PVj5zH0U1.jpg",
        backdropUrl:
          "https://image.tmdb.org/t/p/original/uDO8zWDkwBCxwPm56PVj5zH0U1.jpg",
        trailerUrl: "0pdqf4P8OP0",
        director: "Damien Chazelle",
        writers: ["Damien Chazelle"],
        cast: [
          {
            actorName: "Ryan Gosling",
            characterName: "Sebastian Wilder",
            actorImage: "https://image.tmdb.org/t/p/w500/4D0PpwpGbpOgl0WvMUSlD2fP7b4.jpg",
          },
          {
            actorName: "Emma Stone",
            characterName: "Mia Dolan",
            actorImage: "https://image.tmdb.org/t/p/w500/jYEWU0zS5Q5k9F5t9J9A1N1N1N1N.jpg",
          },
          {
            actorName: "Rosemarie DeWitt",
            characterName: "Laura Wilder",
            actorImage: "https://image.tmdb.org/t/p/w500/tLelKoPNoy4tY6lKwJuXHzi3Z.jpg",
          },
        ],
        productionCompany: "Summit Entertainment",
        budget: 30000000,
        revenue: 446100000,
        ageRating: "PG-13",
        streamingPlatforms: ["Netflix", "Hulu"],
        country: "USA",
        mood: ["Romantic", "Dreamy", "Melancholic"],
        keywords: ["music", "love", "dreams"],
        isTrending: true,
        isFeatured: true,
      },
      {
        title: "Titanic",
        slug: "titanic",
        overview:
          "A seventeen-year-old aristocrat falls in love with a kind but poor artist aboard the luxurious, ill-fated R.M.S. Titanic.",
        tagline: "Nothing on Earth could come between them.",
        genres: ["Romance", "Drama", "Historical"],
        releaseDate: new Date("1997-12-19"),
        runtime: 195,
        rating: 7.9,
        votes: 1100000,
        language: "English",
        posterUrl:
          "https://image.tmdb.org/t/p/w500/9xjZS2rlVxm4FWkGELh6RI5gL7.jpg",
        backdropUrl:
          "https://image.tmdb.org/t/p/original/9xjZS2rlVxm4FWkGELh6RI5gL7.jpg",
        trailerUrl: "2e-eX6QDhYQ",
        director: "James Cameron",
        writers: ["James Cameron"],
        cast: [
          {
            actorName: "Leonardo DiCaprio",
            characterName: "Jack Dawson",
            actorImage: "https://image.tmdb.org/t/p/w500/4D0PpwpGbpOgl0WvMUSlD2fP7b4.jpg",
          },
          {
            actorName: "Kate Winslet",
            characterName: "Rose DeWitt Bukater",
            actorImage: "https://image.tmdb.org/t/p/w500/jYEWU0zS5Q5k9F5t9J9A1N1N1N1N.jpg",
          },
          {
            actorName: "Billy Zane",
            characterName: "Cal Hockley",
            actorImage: "https://image.tmdb.org/t/p/w500/tLelKoPNoy4tY6lKwJuXHzi3Z.jpg",
          },
        ],
        productionCompany: "Paramount Pictures",
        budget: 200000000,
        revenue: 2201000000,
        ageRating: "PG-13",
        streamingPlatforms: ["Netflix", "Paramount+"],
        country: "USA",
        mood: ["Romantic", "Epic", "Tragic"],
        keywords: ["disaster", "love", "ship"],
        isTrending: false,
        isFeatured: true,
      },

      // Comedy
      {
        title: "The Grand Budapest Hotel",
        slug: "the-grand-budapest-hotel",
        overview:
          "A writer encounters the owner of an aging high-class hotel, who tells him of his early years serving as a lobby boy at the hotel when his mentor, the legendary Gustave H., was still the concierge.",
        tagline: "A murder case of Madame D.",
        genres: ["Comedy", "Drama"],
        releaseDate: new Date("2014-03-28"),
        runtime: 99,
        rating: 8.1,
        votes: 750000,
        language: "English",
        posterUrl:
          "https://image.tmdb.org/t/p/w500/eWdyuQcU5lB4g5l5d5y5X5X5.jpg",
        backdropUrl:
          "https://image.tmdb.org/t/p/original/eWdyuQcU5lB4g5l5d5y5X5X5.jpg",
        trailerUrl: "1Fg5i5s58iU",
        director: "Wes Anderson",
        writers: ["Wes Anderson", "Hugo Guinness"],
        cast: [
          {
            actorName: "Ralph Fiennes",
            characterName: "Monsieur Gustave H.",
            actorImage: "https://image.tmdb.org/t/p/w500/4D0PpwpGbpOgl0WvMUSlD2fP7b4.jpg",
          },
          {
            actorName: "F. Murray Abraham",
            characterName: "Mr. Moustafa",
            actorImage: "https://image.tmdb.org/t/p/w500/jYEWU0zS5Q5k9F5t9J9A1N1N1N1N.jpg",
          },
          {
            actorName: "Mathieu Amalric",
            characterName: "Serge X.",
            actorImage: "https://image.tmdb.org/t/p/w500/tLelKoPNoy4tY6lKwJuXHzi3Z.jpg",
          },
        ],
        productionCompany: "Searchlight Pictures",
        budget: 25000000,
        revenue: 172900000,
        ageRating: "R",
        streamingPlatforms: ["Hulu", "Amazon Prime"],
        country: "USA",
        mood: ["Whimsical", "Stylish", "Humorous"],
        keywords: ["hotel", "adventure", "service"],
        isTrending: false,
        isFeatured: false,
      },
      {
        title: "Superbad",
        slug: "superbad",
        overview:
          "Two co-dependent high school seniors are forced to deal with separation anxiety after their plan to stage a booze-soaked party goes awry.",
        tagline: "The hottest night of the summer.",
        genres: ["Comedy"],
        releaseDate: new Date("2007-08-17"),
        runtime: 113,
        rating: 7.6,
        votes: 650000,
        language: "English",
        posterUrl:
          "https://image.tmdb.org/t/p/w500/ekWjK0JN2W4e5x2Z5X5X5X5.jpg",
        backdropUrl:
          "https://image.tmdb.org/t/p/original/ekWjK0JN2W4e5x2Z5X5X5X5.jpg",
        trailerUrl: "4eaZ5SJ0hrQ",
        director: "Greg Mottola",
        writers: ["Seth Rogen", "Evan Goldberg"],
        cast: [
          {
            actorName: "Michael Cera",
            characterName: "Evan",
            actorImage: "https://image.tmdb.org/t/p/w500/4D0PpwpGbpOgl0WvMUSlD2fP7b4.jpg",
          },
          {
            actorName: "Jonah Hill",
            characterName: "Seth",
            actorImage: "https://image.tmdb.org/t/p/w500/jYEWU0zS5Q5k9F5t9J9A1N1N1N1N.jpg",
          },
          {
            actorName: "Christopher Mintz-Plasse",
            characterName: "Fogell / McLovin",
            actorImage: "https://image.tmdb.org/t/p/w500/tLelKoPNoy4tY6lKwJuXHzi3Z.jpg",
          },
        ],
        productionCompany: "Columbia Pictures",
        budget: 17500000,
        revenue: 169800000,
        ageRating: "R",
        streamingPlatforms: ["Netflix"],
        country: "USA",
        mood: ["Funny", "Relatable", "Chaotic"],
        keywords: ["teenagers", "party", "friendship"],
        isTrending: true,
        isFeatured: false,
      },

      // Animation
      {
        title: "Spider-Man: Into the Spider-Verse",
        slug: "spider-man-into-the-spider-verse",
        overview:
          "Teenager Miles Morales becomes the Spider-Man of his universe and must join with five spider-powered individuals from other dimensions to stop a threat for all realities.",
        tagline: "More than one wears the mask.",
        genres: ["Animation", "Action", "Adventure"],
        releaseDate: new Date("2018-12-14"),
        runtime: 117,
        rating: 8.4,
        votes: 650000,
        language: "English",
        posterUrl:
          "https://image.tmdb.org/t/p/w500/iiZZmmyQ2i5sN7o5Y0d5X5X5.jpg",
        backdropUrl:
          "https://image.tmdb.org/t/p/original/iiZZmmyQ2i5sN7o5Y0d5X5X5.jpg",
        trailerUrl: "tg52up8eq7E",
        director: "Bob Persichetti",
        writers: ["Phil Lord", "Christopher Miller"],
        cast: [
          {
            actorName: "Shameik Moore",
            characterName: "Miles Morales / Spider-Man",
            actorImage: "https://image.tmdb.org/t/p/w500/4D0PpwpGbpOgl0WvMUSlD2fP7b4.jpg",
          },
          {
            actorName: "Jake Johnson",
            characterName: "Peter B. Parker / Spider-Man (Spider-Verse)",
            actorImage: "https://image.tmdb.org/t/p/w500/jYEWU0zS5Q5k9F5t9J9A1N1N1N1N.jpg",
          },
          {
            actorName: "Hailee Steinfeld",
            characterName: "Gwen Stacy / Spider-Gwen",
            actorImage: "https://image.tmdb.org/t/p/w500/tLelKoPNoy4tY6lKwJuXHzi3Z.jpg",
          },
        ],
        productionCompany: "Sony Pictures Animation",
        budget: 90000000,
        revenue: 375500000,
        ageRating: "PG",
        streamingPlatforms: ["Netflix"],
        country: "USA",
        mood: ["Inspiring", "Visually Stunning", "Heartwarming"],
        keywords: ["multiverse", "superhero", "coming-of-age"],
        isTrending: true,
        isFeatured: true,
      },
      {
        title: "Spirited Away",
        slug: "spirited-away",
        overview:
          "During her family's move to the suburbs, a sullen 10-year-old girl wanders into a world ruled by gods, witches, and spirits, and where humans are changed into beasts.",
        tagline: "A magical journey.",
        genres: ["Animation", "Fantasy", "Adventure"],
        releaseDate: new Date("2001-07-20"),
        runtime: 125,
        rating: 8.6,
        votes: 860000,
        language: "Japanese",
        posterUrl:
          "https://image.tmdb.org/t/p/w500/39wmItIWjqQHNQW2l8i8p5j5.jpg",
        backdropUrl:
          "https://image.tmdb.org/t/p/original/39wmItIWjqQHNQW2l8i8p5j5.jpg",
        trailerUrl: "ByXuk9tq4gE",
        director: "Hayao Miyazaki",
        writers: ["Hayao Miyazaki"],
        cast: [
          {
            actorName: "Rumi Hiiragi",
            characterName: "Chihiro (voice)",
            actorImage: "https://image.tmdb.org/t/p/w500/4D0PpwpGbpOgl0WvMUSlD2fP7b4.jpg",
          },
          {
            actorName: "Miyu Irino",
            characterName: "Haku (voice)",
            actorImage: "https://image.tmdb.org/t/p/w500/jYEWU0zS5Q5k9F5t9J9A1N1N1N1N.jpg",
          },
          {
            actorName: "Mari Natsuki",
            characterName: "Yubaba / Zeniba (voice)",
            actorImage: "https://image.tmdb.org/t/p/w500/tLelKoPNoy4tY6lKwJuXHzi3Z.jpg",
          },
        ],
        productionCompany: "Studio Ghibli",
        budget: 19000000,
        revenue: 395800000,
        ageRating: "PG",
        streamingPlatforms: ["HBO Max"],
        country: "Japan",
        mood: ["Magical", "Adventurous", "Whimsical"],
        keywords: ["fantasy", "spirits", "journey"],
        isTrending: false,
        isFeatured: true,
      },
    ];

    // Link similar movies (create a graph)
    const savedMovies = await Movie.insertMany(movies);
    console.log(`Seeded ${savedMovies.length} movies`);

    // Update similar movies for each movie
    for (let movie of savedMovies) {
      const similarMovies = savedMovies
        .filter(
          (m) =>
            m._id.toString() !== movie._id.toString() &&
            m.genres.some((g) => movie.genres.includes(g))
        )
        .slice(0, 4)
        .map((m) => m._id);

      if (similarMovies.length > 0) {
        await Movie.findByIdAndUpdate(movie._id, {
          $set: { similarMovies },
        });
      }
    }

    console.log("Similar movies linked successfully");

    // Show 3 sample movies for testing
    const sampleMovies = savedMovies.slice(0, 3);
    console.log("\n--- Sample Movies for testing ---");
    sampleMovies.forEach((movie) => {
      console.log(` Title: ${movie.title}`);
      console.log(` Slug: ${movie.slug}`);
      console.log(` Genre: ${movie.genres.join(", ")}`);
      console.log("-------------------------------");
    });
  } catch (error) {
    console.error("Error seeding movies:", error);
  } finally {
    process.exit();
  }
};

seedMovies();