/* ===== MoodFlix App Logic ===== */

let selectedMood = null;

// ---------- Particle Canvas ----------
(function initParticles() {
    const canvas = document.getElementById('particleCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w, h, particles = [];

    function resize() {
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    for (let i = 0; i < 60; i++) {
        particles.push({
            x: Math.random() * w,
            y: Math.random() * h,
            r: Math.random() * 1.8 + 0.4,
            dx: (Math.random() - 0.5) * 0.3,
            dy: (Math.random() - 0.5) * 0.3,
            o: Math.random() * 0.4 + 0.1
        });
    }

    function draw() {
        ctx.clearRect(0, 0, w, h);
        particles.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(229,9,20,${p.o})`;
            ctx.fill();
            p.x += p.dx; p.y += p.dy;
            if (p.x < 0 || p.x > w) p.dx *= -1;
            if (p.y < 0 || p.y > h) p.dy *= -1;
        });
        requestAnimationFrame(draw);
    }
    draw();
})();

// ---------- Mood Selection ----------
document.querySelectorAll('.mood-chip').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.mood-chip').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedMood = btn.dataset.mood;
        document.getElementById('moodText').value = '';
    });
});

// Deselect mood chip when user types
document.getElementById('moodText').addEventListener('input', () => {
    if (document.getElementById('moodText').value.trim()) {
        document.querySelectorAll('.mood-chip').forEach(b => b.classList.remove('active'));
        selectedMood = null;
    }
});

// ---------- Genre poster gradients ----------
const genreGradients = {
    'Comedy':     'linear-gradient(135deg,#f39c12,#f1c40f)',
    'Animation':  'linear-gradient(135deg,#1abc9c,#2ecc71)',
    'Adventure':  'linear-gradient(135deg,#e67e22,#d35400)',
    'Family':     'linear-gradient(135deg,#3498db,#2980b9)',
    'Drama':      'linear-gradient(135deg,#2c3e50,#34495e)',
    'Romance':    'linear-gradient(135deg,#e91e63,#c2185b)',
    'Music':      'linear-gradient(135deg,#9b59b6,#8e44ad)',
    'Action':     'linear-gradient(135deg,#e74c3c,#c0392b)',
    'Thriller':   'linear-gradient(135deg,#2c3e50,#1a252f)',
    'Sci-Fi':     'linear-gradient(135deg,#0d47a1,#1565c0)',
    'Documentary':'linear-gradient(135deg,#607d8b,#455a64)',
    'Crime':      'linear-gradient(135deg,#37474f,#263238)',
    'Horror':     'linear-gradient(135deg,#4a148c,#311b92)',
    'Mystery':    'linear-gradient(135deg,#1a237e,#283593)',
    'Fantasy':    'linear-gradient(135deg,#6a1b9a,#4a148c)',
    'History':    'linear-gradient(135deg,#795548,#5d4037)',
    'Western':    'linear-gradient(135deg,#bf360c,#8d6e63)',
};

const genreEmojis = {
    'Comedy':'😂','Animation':'🎨','Adventure':'🗺️','Family':'👨‍👩‍👧‍👦',
    'Drama':'🎭','Romance':'💕','Music':'🎵','Action':'💥',
    'Thriller':'🔪','Sci-Fi':'🚀','Documentary':'📽️','Crime':'🔫',
    'Horror':'👻','Mystery':'🔍','Fantasy':'🧙','History':'📜','Western':'🤠'
};

function getPosterStyle(genres) {
    const first = genres.split(',')[0].trim();
    return genreGradients[first] || 'linear-gradient(135deg,#2c3e50,#4ca1af)';
}

function getPosterEmoji(genres) {
    const first = genres.split(',')[0].trim();
    return genreEmojis[first] || '🎬';
}

// ---------- Mood badge colors ----------
const moodColors = {
    happy:'#f1c40f', sad:'#3498db', excited:'#e74c3c',
    chill:'#1abc9c', romantic:'#e91e63', angry:'#c0392b',
    scared:'#8e44ad', nostalgic:'#d35400'
};

// ---------- Utilities ----------
function escapeHtml(text) {
    const d = document.createElement('div');
    d.textContent = text;
    return d.innerHTML;
}

function matchTier(score) {
    if (score >= 75) return 'high';
    if (score >= 50) return 'medium';
    return '';
}

// ---------- Main Fetch ----------
function getRecommendations() {
    const text = document.getElementById('moodText').value.trim();
    const loading = document.getElementById('loading');
    const grid = document.getElementById('moviesGrid');
    const analysisBox = document.getElementById('analysisBox');
    const resultsSection = document.getElementById('resultsSection');
    const emptyState = document.getElementById('emptyState');
    const btn = document.getElementById('submitBtn');

    if (!text && !selectedMood) {
        // shake the mood section
        const sec = document.getElementById('mood-section');
        sec.style.animation = 'none';
        sec.offsetHeight; // reflow
        sec.style.animation = 'shake 0.4s ease';
        return;
    }

    // show loading
    loading.classList.remove('hidden');
    grid.innerHTML = '';
    analysisBox.classList.add('hidden');
    resultsSection.classList.add('hidden');
    emptyState.classList.add('hidden');
    btn.disabled = true;
    btn.innerHTML = '<span class="cta-icon">⏳</span> Analyzing...';

    fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            text: text,
            mood: selectedMood,
            user_id: 1,
            top_n: 10
        })
    })
    .then(r => {
        if (!r.ok) throw new Error('Server error: ' + r.status);
        return r.json();
    })
    .then(data => {
        // Analysis box
        const a = data.mood_analysis;
        const tag = document.getElementById('moodTag');
        tag.textContent = a.mood_category.toUpperCase() + '  •  ' + Math.round(a.confidence * 100) + '% confident';
        tag.style.background = moodColors[a.mood_category] || '#e50914';
        document.getElementById('moodExplanation').textContent = a.explanation;
        document.getElementById('moodGenres').textContent = '🎯 Preferred: ' + a.preferred_genres.join(', ');
        analysisBox.classList.remove('hidden');

        // Results header
        document.getElementById('resultCount').textContent = data.recommendations.length + ' movies';
        document.getElementById('resultsTitle').textContent =
            '🎯 Picked for your "' + a.mood_category + '" mood';
        resultsSection.classList.remove('hidden');

        // Render cards
        data.recommendations.forEach((movie, i) => {
            const card = document.createElement('div');
            card.className = 'movie-card';
            card.style.animationDelay = (i * 0.06) + 's';
            const tier = matchTier(movie.match_score);
            card.innerHTML = `
                <div class="card-poster" style="background:${getPosterStyle(movie.genres)}">
                    <span class="card-rank">${i + 1}</span>
                    ${getPosterEmoji(movie.genres)}
                </div>
                <div class="card-body">
                    <div class="card-title">${escapeHtml(movie.title)}</div>
                    <div class="card-genres">${escapeHtml(movie.genres)}</div>
                    <div class="card-overview">${escapeHtml(movie.overview)}</div>
                    <div class="card-footer">
                        <span class="match-pill ${tier}">${movie.match_score}% Match</span>
                        <span class="card-id">#${movie.id}</span>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });
    })
    .catch(err => {
        console.error(err);
        emptyState.classList.remove('hidden');
        const p = emptyState.querySelector('p');
        p.textContent = 'Something went wrong: ' + err.message;
    })
    .finally(() => {
        loading.classList.add('hidden');
        btn.disabled = false;
        btn.innerHTML = '<span class="cta-icon">✨</span> Find Movies';
    });
}

// Shake animation (added dynamically)
const shakeStyle = document.createElement('style');
shakeStyle.textContent = `
@keyframes shake {
    0%,100%{transform:translateX(0)}
    20%{transform:translateX(-8px)}
    40%{transform:translateX(8px)}
    60%{transform:translateX(-6px)}
    80%{transform:translateX(6px)}
}`;
document.head.appendChild(shakeStyle);
