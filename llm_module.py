"""
LLM Mood Classifier
Production: OpenAI GPT-3.5/4 with JSON mode
College Demo: Keyword-based mock (zero API cost)
"""
import os


def classify_mood(user_text, use_llm=False, api_key=None):
    if not user_text or not user_text.strip():
        return {
            "mood_category": "chill",
            "confidence": 0.50,
            "explanation": "No input provided, defaulting to chill.",
            "preferred_genres": ['Documentary', 'Drama', 'Romance', 'Comedy'],
            "avoid_genres": ['Horror', 'Action']
        }

    # Truncate to prevent abuse
    user_text = user_text[:500]

    # ============================================================
    # PRODUCTION LLM PATH (Uncomment when ready)
    # ============================================================
    # if use_llm:
    #     from openai import OpenAI
    #     client = OpenAI(api_key=api_key or os.getenv("OPENAI_API_KEY"))
    #     response = client.chat.completions.create(
    #         model="gpt-3.5-turbo-1106",
    #         response_format={"type": "json_object"},
    #         messages=[{
    #             "role": "system",
    #             "content": (
    #                 "You are a Mood Analysis API for a movie recommendation system. "
    #                 "Analyze user input and classify into exactly one mood category. "
    #                 "Output JSON with keys: mood_category, confidence, explanation, "
    #                 "preferred_genres (list), avoid_genres (list). "
    #                 "Valid moods: happy, sad, excited, chill, romantic, angry, scared, nostalgic."
    #             )
    #         }, {
    #             "role": "user",
    #             "content": user_text
    #         }]
    #     )
    #     import json
    #     return json.loads(response.choices[0].message.content)

    # ============================================================
    # COLLEGE DEMO PATH (Zero cost, works offline)
    # ============================================================
    text = user_text.lower().strip()

    keywords = {
        'sad':      ['sad', 'cry', 'depressed', 'down', 'heartbroken', 'tears', 'grief', 'melancholy', 'blue', 'lonely'],
        'happy':    ['happy', 'joy', 'fun', 'laugh', 'cheerful', 'upbeat', 'smile', 'great', 'awesome', 'good'],
        'excited':  ['excited', 'thrill', 'adrenaline', 'pumped', 'energy', 'intense', 'hype', 'wild', 'crazy'],
        'chill':    ['chill', 'relax', 'calm', 'peaceful', 'quiet', 'lazy', 'cozy', 'unwind', 'mellow'],
        'romantic': ['love', 'romantic', 'date', 'couple', 'valentine', 'sweet', 'crush', 'wedding', 'kiss'],
        'angry':    ['angry', 'mad', 'furious', 'rage', 'frustrated', 'revenge', 'hate', 'pissed'],
        'scared':   ['scared', 'fear', 'horror', 'terrified', 'nightmare', 'ghost', 'spooky', 'creepy'],
        'nostalgic':['nostalgic', 'childhood', 'memory', 'old days', 'growing up', 'retro', 'past', 'remember']
    }

    scores = {mood: sum(1 for word in words if word in text)
              for mood, words in keywords.items()}

    if max(scores.values()) == 0:
        mood = 'chill'
        confidence = 0.50
    else:
        mood = max(scores, key=scores.get)
        confidence = min(0.50 + 0.08 * scores[mood], 0.98)

    genre_map = {
        'happy':    ['Comedy', 'Animation', 'Adventure', 'Family'],
        'sad':      ['Drama', 'Romance', 'Music'],
        'excited':  ['Action', 'Thriller', 'Adventure', 'Sci-Fi'],
        'chill':    ['Documentary', 'Drama', 'Romance', 'Comedy'],
        'romantic': ['Romance', 'Drama', 'Comedy'],
        'angry':    ['Action', 'Crime', 'Thriller'],
        'scared':   ['Horror', 'Thriller', 'Mystery'],
        'nostalgic':['Animation', 'Family', 'Fantasy', 'Drama']
    }

    avoid_map = {
        'sad': ['Horror', 'Action'],
        'happy': ['Drama', 'Horror'],
        'romantic': ['Horror', 'Action'],
        'scared': ['Comedy', 'Family'],
        'chill': ['Horror', 'Action'],
        'excited': ['Documentary'],
        'angry': ['Romance', 'Family'],
        'nostalgic': ['Horror', 'Crime']
    }

    return {
        "mood_category": mood,
        "confidence": round(confidence, 2),
        "explanation": f"Detected keywords related to '{mood}' emotional state in your input.",
        "preferred_genres": genre_map[mood],
        "avoid_genres": avoid_map.get(mood, [])
    }
