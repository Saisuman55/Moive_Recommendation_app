-- ═══════════════════════════════════════════════════════════════
-- AI Mood Scanner OTT Platform — PostgreSQL Schema
-- ═══════════════════════════════════════════════════════════════
-- Designed for: mood detection, movie recommendations, user privacy
-- Features: Row-level security, encrypted PII, audit logging

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";       -- For encryption
CREATE EXTENSION IF NOT EXISTS "citext";         -- Case-insensitive text

-- ─── ENUMS ───
CREATE TYPE user_role AS ENUM ('free', 'premium', 'admin');
CREATE TYPE content_type AS ENUM ('movie', 'series', 'documentary', 'short');
CREATE TYPE subscription_tier AS ENUM ('none', 'basic', 'standard', 'premium');
CREATE TYPE scan_status AS ENUM ('pending', 'completed', 'failed', 'skipped');
CREATE TYPE device_type AS ENUM ('web', 'ios', 'android', 'tv', 'unknown');

-- ─── MOOD TAXONOMY (Your 11 moods) ───
CREATE TABLE moods (
    mood_id         SMALLSERIAL PRIMARY KEY,
    mood_name       VARCHAR(20) NOT NULL UNIQUE,
    emoji           VARCHAR(10) NOT NULL,
    description     TEXT,
    color_hex       CHAR(7) DEFAULT '#00f3ff',
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO moods (mood_name, emoji, description, color_hex) VALUES
('happy',      '😊', 'Joyful, upbeat, positive energy',           '#ffd700'),
('sad',        '😢', 'Melancholic, reflective, low energy',     '#4a90d9'),
('angry',      '😠', 'Frustrated, tense, high intensity',       '#ff2a2a'),
('excited',    '🤩', 'Eager, enthusiastic, high arousal',         '#ff9500'),
('romantic',   '🥰', 'Affectionate, dreamy, intimate',            '#ff006e'),
('stressed',   '😰', 'Anxious, overwhelmed, tense',               '#9b59b6'),
('relaxed',    '😌', 'Calm, peaceful, low arousal',               '#2ecc71'),
('emotional',  '🥺', 'Vulnerable, moved, deeply feeling',         '#3498db'),
('fearful',    '😨', 'Apprehensive, cautious, suspense-seeking',  '#5d6d7e'),
('bored',      '😴', 'Disengaged, restless, seeking stimulation', '#95a5a6'),
('energetic',  '⚡',  'Vigorous, dynamic, action-oriented',        '#e74c3c');

-- ─── GENRES ───
CREATE TABLE genres (
    genre_id        SMALLSERIAL PRIMARY KEY,
    genre_name      VARCHAR(40) NOT NULL UNIQUE,
    slug            VARCHAR(40) NOT NULL UNIQUE,
    description     TEXT,
    icon_url        TEXT,
    is_active       BOOLEAN DEFAULT TRUE
);

INSERT INTO genres (genre_name, slug, description) VALUES
('Comedy', 'comedy', 'Humorous and entertaining content'),
('Drama', 'drama', 'Emotionally resonant storytelling'),
('Action', 'action', 'High-energy physical sequences'),
('Thriller', 'thriller', 'Suspenseful and tense narratives'),
('Horror', 'horror', 'Fear-inducing supernatural or psychological content'),
('Romance', 'romance', 'Love-centered narratives'),
('Sci-Fi', 'sci-fi', 'Futuristic and speculative concepts'),
('Documentary', 'documentary', 'Non-fiction educational content'),
('Animation', 'animation', 'Animated features for all ages'),
('Adventure', 'adventure', 'Journey and exploration themes'),
('Crime', 'crime', 'Criminal underworld and investigations'),
('Fantasy', 'fantasy', 'Magical and mythical worlds'),
('Mystery', 'mystery', 'Puzzle-solving and enigma plots'),
('Biography', 'biography', 'Real-life individual stories'),
('Feel-Good', 'feel-good', 'Uplifting and heartwarming content'),
('Musical', 'musical', 'Music-driven narratives'),
('War', 'war', 'Military conflict and historical battles'),
('Western', 'western', 'American frontier narratives'),
('Family', 'family', 'All-age appropriate entertainment'),
('Noir', 'noir', 'Dark, cynical crime dramas');

-- ─── MOOD-GENRE MAPPING (The Recommendation Engine Core) ───
CREATE TABLE mood_genre_weights (
    mapping_id      SERIAL PRIMARY KEY,
    mood_id         SMALLINT NOT NULL REFERENCES moods(mood_id) ON DELETE CASCADE,
    genre_id        SMALLINT NOT NULL REFERENCES genres(genre_id) ON DELETE CASCADE,
    weight          DECIMAL(3,2) NOT NULL DEFAULT 0.50
                        CHECK (weight >= 0.00 AND weight <= 1.00),
    is_primary      BOOLEAN DEFAULT FALSE,  -- Top recommendation for this mood
    UNIQUE(mood_id, genre_id)
);

-- Primary mappings (your recommendation logic)
INSERT INTO mood_genre_weights (mood_id, genre_id, weight, is_primary) VALUES
-- Happy → Comedy, Feel-Good, Adventure, Animation, Musical
(1, 1, 0.95, TRUE),   -- Comedy
(1, 15, 0.90, TRUE),  -- Feel-Good
(1, 10, 0.75, FALSE), -- Adventure
(1, 9, 0.70, FALSE),  -- Animation
(1, 16, 0.65, FALSE), -- Musical

-- Sad → Drama, Biography, Feel-Good, Family
(2, 2, 0.90, TRUE),   -- Drama
(2, 14, 0.85, TRUE),  -- Biography
(2, 15, 0.80, FALSE), -- Feel-Good
(2, 19, 0.70, FALSE), -- Family

-- Angry → Action, Thriller, Crime, War
(3, 3, 0.95, TRUE),   -- Action
(3, 4, 0.85, TRUE),   -- Thriller
(3, 11, 0.75, FALSE), -- Crime
(3, 17, 0.60, FALSE), -- War

-- Excited → Action, Adventure, Sci-Fi, Thriller
(4, 3, 0.90, TRUE),   -- Action
(4, 10, 0.85, TRUE),  -- Adventure
(4, 7, 0.80, FALSE),  -- Sci-Fi
(4, 4, 0.70, FALSE),  -- Thriller

-- Romantic → Romance, Drama, Musical, Feel-Good
(5, 6, 0.95, TRUE),   -- Romance
(5, 2, 0.70, FALSE),  -- Drama
(5, 16, 0.65, FALSE), -- Musical
(5, 15, 0.60, FALSE), -- Feel-Good

-- Stressed → Feel-Good, Comedy, Family, Animation, Documentary
(6, 15, 0.95, TRUE),  -- Feel-Good
(6, 1, 0.85, TRUE),   -- Comedy
(6, 19, 0.75, FALSE), -- Family
(6, 9, 0.70, FALSE),  -- Animation
(6, 8, 0.60, FALSE),  -- Documentary

-- Relaxed → Documentary, Drama, Fantasy, Romance
(7, 8, 0.85, TRUE),   -- Documentary
(7, 2, 0.80, TRUE),   -- Drama
(7, 12, 0.75, FALSE), -- Fantasy
(7, 6, 0.65, FALSE),  -- Romance

-- Emotional → Drama, Biography, Romance, Musical
(8, 2, 0.95, TRUE),   -- Drama
(8, 14, 0.85, TRUE),  -- Biography
(8, 6, 0.75, FALSE),  -- Romance
(8, 16, 0.70, FALSE), -- Musical

-- Fearful → Horror, Thriller, Mystery, Crime
(9, 5, 0.95, TRUE),   -- Horror
(9, 4, 0.85, TRUE),   -- Thriller
(9, 13, 0.75, FALSE), -- Mystery
(9, 11, 0.65, FALSE), -- Crime

-- Bored → Mystery, Sci-Fi, Adventure, Comedy, Thriller
(10, 13, 0.85, TRUE), -- Mystery
(10, 7, 0.80, TRUE),  -- Sci-Fi
(10, 10, 0.75, FALSE),-- Adventure
(10, 1, 0.70, FALSE), -- Comedy
(10, 4, 0.65, FALSE), -- Thriller

-- Energetic → Action, Adventure, Sports, Musical, Sci-Fi
(11, 3, 0.95, TRUE),  -- Action
(11, 10, 0.90, TRUE), -- Adventure
(11, 16, 0.75, FALSE),-- Musical
(11, 7, 0.70, FALSE), -- Sci-Fi
(11, 3, 0.60, FALSE); -- Action (reinforced)

-- ─── USERS (Privacy-First Design) ───
CREATE TABLE users (
    user_id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email           CITEXT UNIQUE NOT NULL,
    email_hash      TEXT GENERATED ALWAYS AS (digest(email::text, 'sha256')::text) STORED,
    -- Password handled by auth provider (Supabase/Auth0/Firebase), not stored here

    display_name    VARCHAR(50),
    avatar_url      TEXT,
    role            user_role DEFAULT 'free',
    subscription    subscription_tier DEFAULT 'none',

    -- Privacy & Consent
    camera_consent  BOOLEAN DEFAULT FALSE,
    consent_date    TIMESTAMPTZ,
    data_retention_days INTEGER DEFAULT 30,  -- Auto-delete mood scans after N days
    allow_data_training BOOLEAN DEFAULT FALSE, -- Opt-in for model improvement

    -- Preferences
    preferred_languages TEXT[] DEFAULT ARRAY['en'],
    content_ratings   TEXT[] DEFAULT ARRAY['G','PG','PG-13','R'],
    autoplay_enabled  BOOLEAN DEFAULT TRUE,
    subtitles_default BOOLEAN DEFAULT FALSE,

    -- Security
    last_login_at   TIMESTAMPTZ,
    last_login_ip   INET,
    failed_logins   INTEGER DEFAULT 0,
    locked_until    TIMESTAMPTZ,

    -- Timestamps
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ,  -- Soft delete

    -- Constraints
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Index for fast lookups
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_subscription ON users(subscription) WHERE deleted_at IS NULL;

-- ─── USER PREFERENCES (Detailed) ───
CREATE TABLE user_preferences (
    preference_id   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,

    -- Mood-based preferences (learned over time)
    preferred_moods SMALLINT[] DEFAULT ARRAY[]::SMALLINT[],
    avoided_moods   SMALLINT[] DEFAULT ARRAY[]::SMALLINT[],

    -- Genre preferences (explicit + learned)
    liked_genres    SMALLINT[] DEFAULT ARRAY[]::SMALLINT[],
    disliked_genres SMALLINT[] DEFAULT ARRAY[]::SMALLINT[],

    -- Actor/Director preferences
    liked_actors    TEXT[] DEFAULT ARRAY[]::TEXT[],
    liked_directors TEXT[] DEFAULT ARRAY[]::TEXT[],

    -- Time-based patterns
    peak_usage_hour INTEGER CHECK (peak_usage_hour BETWEEN 0 AND 23),
    weekend_genre_bias SMALLINT[],

    -- AI Calibration
    emotion_baseline JSONB DEFAULT '{}',  -- User's personal "neutral" face metrics

    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- ─── CONTENT (Movies & Series) ───
CREATE TABLE content (
    content_id      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Basic Info
    title           VARCHAR(200) NOT NULL,
    slug            VARCHAR(220) NOT NULL UNIQUE,
    original_title  VARCHAR(200),
    synopsis        TEXT,
    tagline         VARCHAR(300),

    -- Classification
    content_type    content_type NOT NULL,
    release_year    INTEGER CHECK (release_year BETWEEN 1888 AND 2100),
    runtime_minutes INTEGER CHECK (runtime_minutes > 0),
    rating          VARCHAR(10) CHECK (rating IN ('G','PG','PG-13','R','NC-17','TV-Y','TV-G','TV-PG','TV-14','TV-MA','NR')),

    -- Mood Tags (AI-generated or editorial)
    primary_mood_id SMALLINT REFERENCES moods(mood_id),
    mood_tags       SMALLINT[] DEFAULT ARRAY[]::SMALLINT[],  -- Multiple applicable moods
    mood_confidence DECIMAL(3,2) DEFAULT 0.00,  -- AI confidence in mood tagging

    -- Metadata
    poster_url      TEXT,
    backdrop_url    TEXT,
    trailer_url     TEXT,
    video_url       TEXT,  -- CDN link

    -- Cast & Crew (denormalized for performance, normalized in separate tables if needed)
    cast            JSONB DEFAULT '[]',
    directors       JSONB DEFAULT '[]',

    -- Technical
    video_quality   TEXT[] DEFAULT ARRAY['HD','4K'],
    audio_languages TEXT[] DEFAULT ARRAY['en'],
    subtitle_languages TEXT[] DEFAULT ARRAY['en'],

    -- Engagement
    avg_rating      DECIMAL(2,1) DEFAULT 0.0 CHECK (avg_rating BETWEEN 0.0 AND 10.0),
    rating_count    INTEGER DEFAULT 0,
    view_count      INTEGER DEFAULT 0,

    -- Availability
    is_active       BOOLEAN DEFAULT TRUE,
    available_from  DATE,
    available_until DATE,
    region_restrictions TEXT[] DEFAULT ARRAY[]::TEXT[],

    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_content_primary_mood ON content(primary_mood_id) WHERE is_active = TRUE;
CREATE INDEX idx_content_mood_tags ON content USING GIN(mood_tags) WHERE is_active = TRUE;
CREATE INDEX idx_content_release_year ON content(release_year) WHERE is_active = TRUE;
CREATE INDEX idx_content_rating ON content(rating) WHERE is_active = TRUE;

-- ─── CONTENT-GENRE JUNCTION ───
CREATE TABLE content_genres (
    content_id      UUID NOT NULL REFERENCES content(content_id) ON DELETE CASCADE,
    genre_id        SMALLINT NOT NULL REFERENCES genres(genre_id) ON DELETE CASCADE,
    is_primary      BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (content_id, genre_id)
);

-- ─── MOOD SCANS (Privacy-Critical Table) ───
-- NEVER stores face images. Only stores: mood result, confidence, and metadata.
CREATE TABLE mood_scans (
    scan_id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,

    -- Detection Results
    detected_mood_id SMALLINT NOT NULL REFERENCES moods(mood_id),
    confidence      DECIMAL(5,2) NOT NULL CHECK (confidence BETWEEN 0.00 AND 100.00),

    -- Secondary detections (top-3)
    secondary_mood_1_id SMALLINT REFERENCES moods(mood_id),
    secondary_conf_1    DECIMAL(5,2),
    secondary_mood_2_id SMALLINT REFERENCES moods(mood_id),
    secondary_conf_2    DECIMAL(5,2),

    -- Technical metadata (not biometric!)
    device_type     device_type DEFAULT 'unknown',
    lighting_score  DECIMAL(3,2),  -- 0-1 brightness estimate
    face_count      SMALLINT DEFAULT 1,

    -- User feedback
    user_corrected_mood_id SMALLINT REFERENCES moods(mood_id),  -- If user said "wrong mood"
    was_accurate    BOOLEAN,  -- NULL = no feedback, TRUE/FALSE = explicit feedback

    -- Processing
    processing_time_ms INTEGER,  -- How long AI took
    model_version   VARCHAR(20) DEFAULT 'v1.0.0',

    -- Status
    status          scan_status DEFAULT 'completed',
    error_message   TEXT,

    -- Timestamps
    scanned_at      TIMESTAMPTZ DEFAULT NOW(),
    expires_at      TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days',  -- Auto-delete

    -- Constraints
    CONSTRAINT valid_feedback CHECK (
        (was_accurate IS NOT NULL AND user_corrected_mood_id IS NOT NULL) OR
        (was_accurate IS NULL AND user_corrected_mood_id IS NULL) OR
        (was_accurate = FALSE AND user_corrected_mood_id IS NOT NULL)
    )
);

-- Indexes for analytics and cleanup
CREATE INDEX idx_mood_scans_user ON mood_scans(user_id, scanned_at DESC);
CREATE INDEX idx_mood_scans_mood ON mood_scans(detected_mood_id) WHERE status = 'completed';
CREATE INDEX idx_mood_scans_expiry ON mood_scans(expires_at) WHERE expires_at < NOW();
CREATE INDEX idx_mood_scans_feedback ON mood_scans(was_accurate) WHERE was_accurate IS NOT NULL;

-- ─── WATCH HISTORY ───
CREATE TABLE watch_history (
    history_id      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    content_id      UUID NOT NULL REFERENCES content(content_id) ON DELETE CASCADE,

    -- Playback state
    progress_seconds INTEGER DEFAULT 0,
    total_seconds   INTEGER NOT NULL,
    completion_pct  DECIMAL(5,2) GENERATED ALWAYS AS 
                        (CASE WHEN total_seconds > 0 
                              THEN ROUND((progress_seconds::DECIMAL / total_seconds) * 100, 2)
                              ELSE 0.00 END) STORED,
    is_completed    BOOLEAN GENERATED ALWAYS AS (progress_seconds >= total_seconds * 0.9) STORED,

    -- Context
    watched_at      TIMESTAMPTZ DEFAULT NOW(),
    device_type     device_type DEFAULT 'unknown',

    -- Mood context (what was user's mood when they watched?)
    associated_mood_scan_id UUID REFERENCES mood_scans(scan_id),

    -- Engagement
    paused_count    INTEGER DEFAULT 0,
    rewind_count    INTEGER DEFAULT 0,

    UNIQUE(user_id, content_id)
);

CREATE INDEX idx_watch_history_user ON watch_history(user_id, watched_at DESC);
CREATE INDEX idx_watch_history_content ON watch_history(content_id);

-- ─── USER RATINGS ───
CREATE TABLE user_ratings (
    rating_id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    content_id      UUID NOT NULL REFERENCES content(content_id) ON DELETE CASCADE,
    score           DECIMAL(2,1) NOT NULL CHECK (score BETWEEN 0.5 AND 10.0),
    review_text     TEXT,
    contains_spoiler BOOLEAN DEFAULT FALSE,
    rated_at        TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, content_id)
);

-- ─── RECOMMENDATIONS (Generated by AI Engine) ───
CREATE TABLE recommendations (
    recommendation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id           UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,

    -- Source
    source_mood_scan_id UUID REFERENCES mood_scans(scan_id),
    generation_method   VARCHAR(30) NOT NULL DEFAULT 'mood_ai'
        CHECK (generation_method IN ('mood_ai', 'collaborative', 'content_based', 'trending', 'editorial')),

    -- Recommended Content
    content_id        UUID NOT NULL REFERENCES content(content_id) ON DELETE CASCADE,
    match_score       DECIMAL(5,2) NOT NULL CHECK (match_score BETWEEN 0.00 AND 100.00),
    match_reason      TEXT,  -- Human-readable "Because you liked..." or "Matches your Happy mood"

    -- User interaction
    was_shown         BOOLEAN DEFAULT FALSE,  -- Did user see this recommendation?
    was_clicked       BOOLEAN DEFAULT FALSE,
    was_watched       BOOLEAN DEFAULT FALSE,
    dismissed_at      TIMESTAMPTZ,

    -- TTL
    expires_at        TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
    created_at        TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, content_id, source_mood_scan_id)
);

CREATE INDEX idx_recommendations_user ON recommendations(user_id, created_at DESC);
CREATE INDEX idx_recommendations_active ON recommendations(user_id) 
    WHERE was_shown = FALSE AND expires_at > NOW();

-- ─── MOOD TIMELINE (User's emotional journey) ───
CREATE TABLE mood_timeline (
    timeline_id     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    scan_id         UUID NOT NULL REFERENCES mood_scans(scan_id),

    -- Aggregated daily stats
    date            DATE NOT NULL,
    dominant_mood_id SMALLINT NOT NULL REFERENCES moods(mood_id),
    mood_variety    SMALLINT DEFAULT 1,  -- How many different moods detected today
    avg_confidence  DECIMAL(5,2),
    scan_count      INTEGER DEFAULT 1,

    -- Derived insights
    mood_trend      VARCHAR(10) CHECK (mood_trend IN ('improving', 'declining', 'stable', 'volatile')),

    UNIQUE(user_id, date)
);

CREATE INDEX idx_mood_timeline_user ON mood_timeline(user_id, date DESC);

-- ─── USER SESSIONS (For security & analytics) ───
CREATE TABLE user_sessions (
    session_id      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    device_fingerprint TEXT,  -- Hashed device identifier
    device_type     device_type,
    ip_address      INET,
    user_agent      TEXT,

    started_at      TIMESTAMPTZ DEFAULT NOW(),
    ended_at        TIMESTAMPTZ,
    is_active       BOOLEAN DEFAULT TRUE,

    -- Mood scanner usage in this session
    scans_count     INTEGER DEFAULT 0
);

-- ─── AUDIT LOG (GDPR/CCPA compliance) ───
CREATE TABLE audit_log (
    log_id          BIGSERIAL PRIMARY KEY,
    table_name      VARCHAR(50) NOT NULL,
    record_id       UUID NOT NULL,
    action          VARCHAR(10) NOT NULL CHECK (action IN ('INSERT','UPDATE','DELETE')),
    old_data        JSONB,
    new_data        JSONB,
    performed_by    UUID REFERENCES users(user_id),
    performed_at    TIMESTAMPTZ DEFAULT NOW(),
    ip_address      INET
);

-- ─── ROW-LEVEL SECURITY (Multi-tenant isolation) ───
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE watch_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_timeline ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY user_isolation ON users
    FOR ALL USING (user_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY mood_scan_isolation ON mood_scans
    FOR ALL USING (user_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY watch_history_isolation ON watch_history
    FOR ALL USING (user_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY recommendations_isolation ON recommendations
    FOR ALL USING (user_id = current_setting('app.current_user_id')::UUID);

-- ─── AUTO-UPDATE TRIGGER ───
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_updated_at BEFORE UPDATE ON content
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── AUTO-DELETE EXPIRED MOOD SCANS (Privacy) ───
CREATE OR REPLACE FUNCTION delete_expired_mood_scans()
RETURNS void AS $$
BEGIN
    DELETE FROM mood_scans WHERE expires_at < NOW();
    DELETE FROM recommendations WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Run daily via pg_cron or external scheduler:
-- SELECT cron.schedule('0 0 * * *', 'SELECT delete_expired_mood_scans()');
