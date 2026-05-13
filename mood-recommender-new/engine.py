"""
MoodRecommender Engine
Hybrid Content-Based + Collaborative Filtering + Mood Mapping
"""
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


class MoodRecommender:
    def __init__(self, movies_df, ratings_df=None):
        self.movies = movies_df.copy()
        self.ratings = ratings_df.copy() if ratings_df is not None else None
        self.tfidf = TfidfVectorizer(stop_words='english', max_features=500)
        self.cosine_sim = None
        self.movie_indices = pd.Series(
            self.movies.index, index=self.movies['id']
        ).drop_duplicates()

        # Curated Mood -> Genre mapping
        self.mood_map = {
            'happy':    ['Comedy', 'Animation', 'Adventure', 'Family'],
            'sad':      ['Drama', 'Romance', 'Music'],
            'excited':  ['Action', 'Thriller', 'Adventure', 'Sci-Fi'],
            'chill':    ['Documentary', 'Drama', 'Romance', 'Comedy'],
            'romantic': ['Romance', 'Drama', 'Comedy'],
            'angry':    ['Action', 'Crime', 'Thriller'],
            'scared':   ['Horror', 'Thriller', 'Mystery'],
            'nostalgic':['Animation', 'Family', 'Fantasy', 'Drama']
        }

    def fit(self):
        """Train TF-IDF content model on movie overviews."""
        self.movies['overview'] = self.movies['overview'].fillna('')
        tfidf_matrix = self.tfidf.fit_transform(self.movies['overview'])
        self.cosine_sim = cosine_similarity(tfidf_matrix, tfidf_matrix)

    def get_recommendations(self, mood, user_id=None, top_n=10):
        """
        Hybrid recommendation pipeline.

        Scoring:
            60% Content similarity to mood-cluster centroid
            25% Collaborative signal (user history similarity)
            15% Exact genre match bonus
        """
        target_genres = set(self.mood_map.get(mood, []))

        # 1. Genre filtering
        def genre_match(g_str):
            return len(set(g_str.split(',')) & target_genres) > 0

        mask = self.movies['genres'].apply(genre_match)
        candidates = self.movies[mask].copy()
        if candidates.empty:
            candidates = self.movies.copy()

        c_indices = candidates.index.tolist()
        scores = {}

        # 2. Content score (centroid similarity within mood cluster)
        if len(c_indices) > 1:
            centroid = self.cosine_sim[c_indices][:, c_indices].mean(axis=1)
            for idx, sc in zip(c_indices, centroid):
                scores[idx] = sc * 0.60
        else:
            for idx in c_indices:
                scores[idx] = 0.60

        # 3. Collaborative filtering signal
        if user_id is not None and self.ratings is not None:
            liked = self.ratings[
                (self.ratings['user_id'] == user_id) &
                (self.ratings['rating'] >= 4)
            ]['movie_id'].tolist()
            liked_idx = [self.movie_indices[m] for m in liked
                        if m in self.movie_indices]
            if liked_idx:
                for idx in c_indices:
                    scores[idx] += self.cosine_sim[idx, liked_idx].mean() * 0.25

        # 4. Exact genre match bonus
        for idx in c_indices:
            g = set(self.movies.loc[idx, 'genres'].split(','))
            scores[idx] += 0.05 * len(g & target_genres)

        # Sort & format top N
        top = sorted(scores.items(), key=lambda x: x[1], reverse=True)[:top_n]
        result_df = self.movies.loc[[i for i, _ in top]].copy()
        result_df['match_score'] = [round(scores[i] * 100, 1) for i, _ in top]
        return result_df
