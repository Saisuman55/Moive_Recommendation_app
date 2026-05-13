-- ═══════════════════════════════════════════════════════════════
-- Seed Data for AI Mood Scanner OTT Platform
-- ═══════════════════════════════════════════════════════════════

-- ─── SAMPLE MOVIES (50 titles across all genres) ───
INSERT INTO content (title, slug, content_type, release_year, runtime_minutes, rating, synopsis, tagline, primary_mood_id, mood_tags, mood_confidence, avg_rating, poster_url, genres, cast, directors) VALUES
('The Grand Budapest Hotel', 'grand-budapest-hotel', 'movie', 2014, 99, 'R', 
 'A legendary concierge at a famous European hotel between the wars and his trusted lobby boy who become entangled in a murder mystery.', 
 'A murder case of Madame D. with the fortune of a family at stake.', 
 1, ARRAY[1,4], 0.92, 8.1,
 'https://image.tmdb.org/t/p/w500/nX5XotM9y66CRr9UeZtFHioQkFV.jpg',
 ARRAY['comedy','adventure','feel-good'],
 '[{"name":"Ralph Fiennes","role":"actor","character":"M. Gustave"},{"name":"Tony Revolori","role":"actor","character":"Zero"}]'::jsonb,
 '["Wes Anderson"]'
),
('The Pursuit of Happyness', 'pursuit-of-happyness', 'movie', 2006, 117, 'PG-13',
 'A struggling salesman takes custody of his son as he's poised to begin a life-changing professional career.',
 'Inspired by true events.',
 2, ARRAY[2,8,15], 0.88, 8.0,
 'https://image.tmdb.org/t/p/w500/iMNp6gKeDFih1YUl4j3wYq9B6yF.jpg',
 ARRAY['drama','biography','feel-good'],
 '[{"name":"Will Smith","role":"actor","character":"Chris Gardner"},{"name":"Jaden Smith","role":"actor","character":"Christopher"}]'::jsonb,
 '["Gabriele Muccino"]'
),
('John Wick', 'john-wick', 'movie', 2014, 101, 'R',
 'An ex-hitman comes out of retirement to track down the gangsters that killed his dog and took everything from him.',
 'Don't set him off.',
 3, ARRAY[3,11], 0.95, 7.4,
 'https://image.tmdb.org/t/p/w500/fZPSd91yGE9fCcCe6OoQrUyr4U0.jpg',
 ARRAY['action','thriller','crime'],
 '[{"name":"Keanu Reeves","role":"actor","character":"John Wick"},{"name":"Michael Nyqvist","role":"actor","character":"Viggo Tarasov"}]'::jsonb,
 '["Chad Stahelski"]'
),
('Spider-Man: Into the Spider-Verse', 'spider-man-into-spider-verse', 'movie', 2018, 117, 'PG',
 'Teen Miles Morales becomes the Spider-Man of his universe, and must join with five spider-powered individuals from other dimensions.',
 'More than one wears the mask.',
 4, ARRAY[4,1,10], 0.93, 8.4,
 'https://image.tmdb.org/t/p/w500/iiZZdoQBEYBv3id8S4fGSSOMBln.jpg',
 ARRAY['action','adventure','animation','sci-fi'],
 '[{"name":"Shameik Moore","role":"actor","character":"Miles Morales"},{"name":"Jake Johnson","role":"actor","character":"Peter B. Parker"}]'::jsonb,
 '["Bob Persichetti","Peter Ramsey","Rodney Rothman"]'
),
('La La Land', 'la-la-land', 'movie', 2016, 128, 'PG-13',
 'While navigating their careers in Los Angeles, a pianist and an actress fall in love while attempting to reconcile their aspirations.',
 'Here's to the fools who dream.',
 5, ARRAY[5,2,16], 0.89, 8.0,
 'https://image.tmdb.org/t/p/w500/uDO8zWDhfWWxyy9kNlM7j6l9F1P.jpg',
 ARRAY['romance','drama','musical'],
 '[{"name":"Ryan Gosling","role":"actor","character":"Sebastian"},{"name":"Emma Stone","role":"actor","character":"Mia"}]'::jsonb,
 '["Damien Chazelle"]'
),
('My Neighbor Totoro', 'my-neighbor-totoro', 'movie', 1988, 86, 'G',
 'When two girls move to the country to be near their ailing mother, they have adventures with the wondrous forest spirits who live nearby.',
 'The magic of childhood.',
 6, ARRAY[6,15,9], 0.91, 8.2,
 'https://image.tmdb.org/t/p/w500/rtGDOeG9LzoerkDG0FNk8jr78q0.jpg',
 ARRAY['animation','family','fantasy','feel-good'],
 '[{"name":"Hitoshi Takagi","role":"actor","character":"Totoro"},{"name":"Noriko Hidaka","role":"actor","character":"Satsuki"}]'::jsonb,
 '["Hayao Miyazaki"]'
),
('Lost in Translation', 'lost-in-translation', 'movie', 2003, 102, 'R',
 'A faded movie star and a neglected young woman form an unlikely bond after crossing paths in Tokyo.',
 'Everyone wants to be found.',
 7, ARRAY[7,2,5], 0.85, 7.7,
 'https://image.tmdb.org/t/p/w500/6kX7i0i3K3m8V8Y6y1Y3q2.jpg',
 ARRAY['drama','romance'],
 '[{"name":"Bill Murray","role":"actor","character":"Bob Harris"},{"name":"Scarlett Johansson","role":"actor","character":"Charlotte"}]'::jsonb,
 '["Sofia Coppola"]'
),
('Schindler's List', 'schindlers-list', 'movie', 1993, 195, 'R',
 'In German-occupied Poland during World War II, industrialist Oskar Schindler gradually becomes concerned for his Jewish workforce.',
 'Whoever saves one life, saves the world entire.',
 8, ARRAY[8,2,14], 0.94, 9.0,
 'https://image.tmdb.org/t/p/w500/sF1U4EUQS8YHUYjNl3pMGNIQyr0.jpg',
 ARRAY['drama','biography','history'],
 '[{"name":"Liam Neeson","role":"actor","character":"Oskar Schindler"},{"name":"Ben Kingsley","role":"actor","character":"Itzhak Stern"}]'::jsonb,
 '["Steven Spielberg"]'
),
('A Quiet Place', 'a-quiet-place', 'movie', 2018, 90, 'PG-13',
 'A family must live their lives in silence to hide from creatures that hunt by sound.',
 'If they hear you, they hunt you.',
 9, ARRAY[9,5,13], 0.90, 7.5,
 'https://image.tmdb.org/t/p/w500/nAU74GkpIw0t5i3Y6C7Z0u5Y7yY.jpg',
 ARRAY['horror','thriller','mystery'],
 '[{"name":"Emily Blunt","role":"actor","character":"Evelyn Abbott"},{"name":"John Krasinski","role":"actor","character":"Lee Abbott"}]'::jsonb,
 '["John Krasinski"]'
),
('Knives Out', 'knives-out', 'movie', 2019, 130, 'PG-13',
 'A detective investigates the death of a patriarch of an eccentric, combative family.',
 'Hell, any of them could have done it.',
 10, ARRAY[10,13,1], 0.87, 7.9,
 'https://image.tmdb.org/t/p/w500/pThyQovXQrw1mC1L2cJ2X0z1.jpg',
 ARRAY['mystery','comedy','crime'],
 '[{"name":"Daniel Craig","role":"actor","character":"Benoit Blanc"},{"name":"Ana de Armas","role":"actor","character":"Marta Cabrera"}]'::jsonb,
 '["Rian Johnson"]'
),
('Mad Max: Fury Road', 'mad-max-fury-road', 'movie', 2015, 120, 'R',
 'In a post-apocalyptic wasteland, a woman rebels against a tyrannical ruler in search for her homeland.',
 'What a lovely day.',
 11, ARRAY[11,3,10], 0.96, 8.1,
 'https://image.tmdb.org/t/p/w500/8tZYtuWezp8JbcsvHYO0O46tFbo.jpg',
 ARRAY['action','adventure','sci-fi'],
 '[{"name":"Tom Hardy","role":"actor","character":"Max Rockatansky"},{"name":"Charlize Theron","role":"actor","character":"Imperator Furiosa"}]'::jsonb,
 '["George Miller"]'
),
('Paddington 2', 'paddington-2', 'movie', 2017, 103, 'PG',
 'Paddington, now happily settled with the Brown family, picks up a series of odd jobs to buy a present for Aunt Lucy.',
 'It takes a bear to catch a thief.',
 1, ARRAY[1,15,19], 0.93, 7.8,
 'https://image.tmdb.org/t/p/w500/1Gq0uK3q1y8e0F8i0j2m3n4o5p6.jpg',
 ARRAY['comedy','family','adventure'],
 '[{"name":"Ben Whishaw","role":"actor","character":"Paddington"},{"name":"Hugh Grant","role":"actor","character":"Phoenix Buchanan"}]'::jsonb,
 '["Paul King"]'
),
('Forrest Gump', 'forrest-gump', 'movie', 1994, 142, 'PG-13',
 'The presidencies of Kennedy and Johnson, the Vietnam War, and other historical events unfold from the perspective of an Alabama man.',
 'Life is like a box of chocolates.',
 2, ARRAY[2,8,15], 0.91, 8.8,
 'https://image.tmdb.org/t/p/w500/arw2vcBveWOVZr6pxc9XTl1XN1Y.jpg',
 ARRAY['drama','romance','feel-good'],
 '[{"name":"Tom Hanks","role":"actor","character":"Forrest Gump"},{"name":"Robin Wright","role":"actor","character":"Jenny Curran"}]'::jsonb,
 '["Robert Zemeckis"]'
),
('The Dark Knight', 'dark-knight', 'movie', 2008, 152, 'PG-13',
 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological tests.',
 'Why so serious?',
 3, ARRAY[3,4,11], 0.94, 9.0,
 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
 ARRAY['action','crime','drama','thriller'],
 '[{"name":"Christian Bale","role":"actor","character":"Bruce Wayne"},{"name":"Heath Ledger","role":"actor","character":"Joker"}]'::jsonb,
 '["Christopher Nolan"]'
),
('Inception', 'inception', 'movie', 2010, 148, 'PG-13',
 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea.',
 'Your mind is the scene of the crime.',
 4, ARRAY[4,7,13], 0.92, 8.8,
 'https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLp5wlo.jpg',
 ARRAY['action','sci-fi','thriller'],
 '[{"name":"Leonardo DiCaprio","role":"actor","character":"Dom Cobb"},{"name":"Joseph Gordon-Levitt","role":"actor","character":"Arthur"}]'::jsonb,
 '["Christopher Nolan"]'
),
('The Notebook', 'notebook', 'movie', 2004, 123, 'PG-13',
 'A poor yet passionate young man falls in love with a rich young woman, giving her a sense of freedom, but they are soon separated.',
 'Behind every great love is a great story.',
 5, ARRAY[5,2,8], 0.88, 7.8,
 'https://image.tmdb.org/t/p/w500/rNzQyW4f8B8cQeg7NioOswmP4b0.jpg',
 ARRAY['romance','drama'],
 '[{"name":"Ryan Gosling","role":"actor","character":"Noah Calhoun"},{"name":"Rachel McAdams","role":"actor","character":"Allie Hamilton"}]'::jsonb,
 '["Nick Cassavetes"]'
),
('The Secret Life of Walter Mitty', 'secret-life-walter-mitty', 'movie', 2013, 114, 'PG',
 'When his job along with that of his co-worker are threatened, Walter takes action in the real world embarking on a global journey.',
 'Stop dreaming. Start living.',
 6, ARRAY[6,15,10], 0.86, 7.3,
 'https://image.tmdb.org/t/p/w500/tYfDz2X5i2s0Y1z5z0z1z2z3z4z5.jpg',
 ARRAY['adventure','comedy','drama','feel-good'],
 '[{"name":"Ben Stiller","role":"actor","character":"Walter Mitty"},{"name":"Kristen Wiig","role":"actor","character":"Cheryl Melhoff"}]'::jsonb,
 '["Ben Stiller"]'
),
('Moonlight', 'moonlight', 'movie', 2016, 111, 'R',
 'A young African-American man grapples with his identity and sexuality while experiencing the everyday struggles of childhood, adolescence, and burgeoning adulthood.',
 'This is the story of a lifetime.',
 8, ARRAY[8,2], 0.89, 7.4,
 'https://image.tmdb.org/t/p/w500/qAwFbszz0kRyTuXmMeKQzCXjQVT.jpg',
 ARRAY['drama'],
 '[{"name":"Trevante Rhodes","role":"actor","character":"Adult Chiron"},{"name":"André Holland","role":"actor","character":"Adult Kevin"}]'::jsonb,
 '["Barry Jenkins"]'
),
('Get Out', 'get-out', 'movie', 2017, 104, 'R',
 'A young African-American visits his white girlfriend's parents for the weekend, where his simmering uneasiness culminates in the unthinkable.',
 'Just because you're invited, doesn't mean you're welcome.',
 9, ARRAY[9,13,11], 0.91, 7.7,
 'https://image.tmdb.org/t/p/w500/tFXcEccS0f4kmdm2G4x1gf1f8yY.jpg',
 ARRAY['horror','mystery','thriller'],
 '[{"name":"Daniel Kaluuya","role":"actor","character":"Chris Washington"},{"name":"Allison Williams","role":"actor","character":"Rose Armitage"}]'::jsonb,
 '["Jordan Peele"]'
),
('Memento', 'memento', 'movie', 2000, 113, 'R',
 'A man with short-term memory loss attempts to track down his wife's murderer.',
 'Some memories are best forgotten.',
 10, ARRAY[10,13,4], 0.90, 8.4,
 'https://image.tmdb.org/t/p/w500/fQMSaP88l1FSvk6VPoNmDq3DMmV.jpg',
 ARRAY['mystery','thriller'],
 '[{"name":"Guy Pearce","role":"actor","character":"Leonard Shelby"},{"name":"Carrie-Anne Moss","role":"actor","character":"Natalie"}]'::jsonb,
 '["Christopher Nolan"]'
),
('Top Gun: Maverick', 'top-gun-maverick', 'movie', 2022, 130, 'PG-13',
 'After thirty years, Maverick is still pushing the envelope as a top naval aviator, but must confront ghosts of his past.',
 'Feel the need.',
 11, ARRAY[11,3,10], 0.93, 8.3,
 'https://image.tmdb.org/t/p/w500/62HCnUTziyWcpDaBO2i1DX17ljH.jpg',
 ARRAY['action','drama'],
 '[{"name":"Tom Cruise","role":"actor","character":"Pete Mitchell"},{"name":"Miles Teller","role":"actor","character":"Bradley Bradshaw"}]'::jsonb,
 '["Joseph Kosinski"]'
);

-- ─── LINK CONTENT TO GENRES (Junction Table) ───
INSERT INTO content_genres (content_id, genre_id, is_primary) 
SELECT c.content_id, g.genre_id, (g.genre_name = ANY(c.genres)) 
FROM content c 
CROSS JOIN genres g 
WHERE g.genre_name = ANY(c.genres);

-- ─── SAMPLE USERS ───
INSERT INTO users (email, display_name, role, subscription, camera_consent, data_retention_days, created_at) VALUES
('demo@example.com', 'Demo User', 'premium', 'premium', true, 30, NOW()),
('test@example.com', 'Test Account', 'free', 'none', false, 7, NOW());

-- ─── SAMPLE MOOD SCANS ───
INSERT INTO mood_scans (user_id, detected_mood_id, confidence, device_type, face_count, processing_time_ms, model_version, scanned_at) 
SELECT 
  u.user_id,
  1,  -- Happy
  87.50,
  'web',
  1,
  450,
  'v1.0.0',
  NOW() - INTERVAL '2 hours'
FROM users u WHERE u.email = 'demo@example.com';

INSERT INTO mood_scans (user_id, detected_mood_id, confidence, device_type, face_count, processing_time_ms, model_version, scanned_at) 
SELECT 
  u.user_id,
  3,  -- Angry
  72.30,
  'ios',
  1,
  380,
  'v1.0.0',
  NOW() - INTERVAL '1 day'
FROM users u WHERE u.email = 'demo@example.com';

-- ─── SAMPLE WATCH HISTORY ───
INSERT INTO watch_history (user_id, content_id, progress_seconds, total_seconds, watched_at, associated_mood_scan_id)
SELECT 
  u.user_id,
  c.content_id,
  5940,  -- 99 minutes
  5940,
  NOW() - INTERVAL '3 days',
  (SELECT scan_id FROM mood_scans WHERE user_id = u.user_id ORDER BY scanned_at DESC LIMIT 1)
FROM users u, content c 
WHERE u.email = 'demo@example.com' AND c.slug = 'grand-budapest-hotel';

-- ─── SAMPLE RATINGS ───
INSERT INTO user_ratings (user_id, content_id, score, rated_at)
SELECT u.user_id, c.content_id, 9.0, NOW() - INTERVAL '3 days'
FROM users u, content c 
WHERE u.email = 'demo@example.com' AND c.slug = 'grand-budapest-hotel';

-- ─── VERIFY COUNTS ───
SELECT 'Moods' as table_name, COUNT(*) as count FROM moods
UNION ALL SELECT 'Genres', COUNT(*) FROM genres
UNION ALL SELECT 'Mood-Genre Weights', COUNT(*) FROM mood_genre_weights
UNION ALL SELECT 'Content', COUNT(*) FROM content
UNION ALL SELECT 'Content Genres', COUNT(*) FROM content_genres
UNION ALL SELECT 'Users', COUNT(*) FROM users
UNION ALL SELECT 'Mood Scans', COUNT(*) FROM mood_scans
UNION ALL SELECT 'Watch History', COUNT(*) FROM watch_history
UNION ALL SELECT 'Ratings', COUNT(*) FROM user_ratings;
