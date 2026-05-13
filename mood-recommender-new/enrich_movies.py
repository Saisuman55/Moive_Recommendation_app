
import pandas as pd
import urllib.parse

movies_df = pd.read_csv("/mnt/agents/output/mood-recommender/data/movies.csv")

poster_urls = []
trailer_urls = []

for _, row in movies_df.iterrows():
    mid = row["id"]
    title = row["title"]

    # Poster: use placehold.co with unique gradient-like colors based on movie ID
    # Generate a color from the ID
    hue = (mid * 137) % 360
    color1 = f"hsl({hue}, 60%, 20%)"
    color2 = f"hsl({(hue + 40) % 360}, 50%, 15%)"

    # Use a text-based placeholder that shows the movie title
    safe_title = urllib.parse.quote(title[:20])
    poster_url = f"https://placehold.co/300x450/{hue:02x}3a5a/{hue:02x}cccc?text={safe_title}"
    poster_urls.append(poster_url)

    # Trailer: YouTube search link (works for ALL movies, real or synthetic)
    search_query = urllib.parse.quote(f"{title} official trailer")
    trailer_url = f"https://www.youtube.com/results?search_query={search_query}"
    trailer_urls.append(trailer_url)

movies_df["poster_url"] = poster_urls
movies_df["trailer_url"] = trailer_urls

movies_df.to_csv("/mnt/agents/output/mood-recommender/data/movies.csv", index=False)
print(f"✅ Enriched {len(movies_df)} movies with poster_url and trailer_url")
print("Sample:")
print(movies_df[["title", "poster_url", "trailer_url"]].head(3).to_string())
