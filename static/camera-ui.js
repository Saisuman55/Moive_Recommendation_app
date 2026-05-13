/**
 * Camera Mood Detection UI Controller
 * Manages camera permissions, emotion detection UI, and transitions
 */

class CameraMoodUI {
  constructor() {
    this.isInitialized = false;
    this.detectionActive = false;
    this.bestMood = null;
    this.bestConfidence = 0;
    this.finishTimer = null;
    this.boundEmotionHandler = this.onEmotionDetected.bind(this);
  }

  /**
   * Show camera permission modal
   */
  showPermissionModal() {
    const modal = document.getElementById('cameraPermissionModal');
    modal.classList.add('active');
  }

  /**
   * Hide camera permission modal
   */
  hidePermissionModal() {
    const modal = document.getElementById('cameraPermissionModal');
    modal.classList.remove('active');
    try {
      localStorage.setItem('moodflix_camera_dismissed', 'true');
    } catch (error) {
      // Ignore storage failures in private browsing / restricted contexts.
    }
  }

  /**
   * Request camera and start emotion detection
   */
  async startCameraDetection() {
    const modal = document.getElementById('cameraScannerModal');
    const status = document.getElementById('cameraStatus');

    try {
      status.textContent = 'Initializing AI models...';

      // Initialize emotion detector if not already done
      if (!window.emotionDetector.isModelLoaded) {
        const loaded = await window.emotionDetector.initialize();
        if (!loaded) throw new Error('Failed to load AI models');
      }

      status.textContent = 'Requesting camera access...';

      const video = document.getElementById('cameraVideo');
      const canvas = document.getElementById('detectionCanvas');

      await window.emotionDetector.startCamera(video, canvas);

      status.textContent = 'Camera ready - analyzing your mood...';
      modal.classList.add('active');
      this.detectionActive = true;
      this.hidePermissionModal();

      // Listen for emotion detection events
      window.removeEventListener('emotionDetected', this.boundEmotionHandler);
      window.addEventListener('emotionDetected', this.boundEmotionHandler);

      // Auto-finish after 5 seconds of consistent detection
      this.startFinishTimer();
    } catch (error) {
      status.textContent = '❌ ' + error.message;
      console.error(error);
      this.hidePermissionModal();
    }
  }

  /**
   * Handle detected emotion
   */
  onEmotionDetected(event) {
    const { mood, confidence } = event.detail;

    // Update best detection
    if (confidence > this.bestConfidence) {
      this.bestConfidence = confidence;
      this.bestMood = mood;
    }

    // Update UI
    const result = document.getElementById('detectionResult');
    const emoji = this.getMoodEmoji(mood);
    result.innerHTML = `
      <div style="font-size: 56px; margin-bottom: 16px;">${emoji}</div>
      <div style="font-size: 18px; font-weight: 700; margin-bottom: 8px;">${mood.toUpperCase()}</div>
      <div style="font-size: 14px; color: var(--accent-green);">${confidence}% Confident</div>
    `;
  }

  /**
   * Start auto-finish timer
   */
  startFinishTimer() {
    if (this.finishTimer) {
      clearTimeout(this.finishTimer);
    }
    this.finishTimer = setTimeout(() => {
      if (this.detectionActive && this.bestMood) {
        this.finishDetection();
      }
    }, 5000);
  }

  /**
   * Finalize the current mood result and notify the host page.
   */
  emitMoodResult() {
    const mood = window.emotionDetector.mapEmotionToMood(this.bestMood);
    const result = {
      mood,
      rawMood: this.bestMood,
      confidence: this.bestConfidence,
      emoji: this.getMoodEmoji(this.bestMood),
    };

    window.dispatchEvent(new CustomEvent('moodScannerComplete', { detail: result }));

    const config = window.cameraMoodUIConfig || {};
    if (typeof config.onMoodResolved === 'function') {
      config.onMoodResolved(result);
      return;
    }

    this.applyCameraDetectedMood(result);
  }

  /**
   * Finish detection and apply mood
   */
  finishDetection() {
    this.detectionActive = false;
    if (this.finishTimer) {
      clearTimeout(this.finishTimer);
      this.finishTimer = null;
    }
    window.emotionDetector.stopCamera();
    window.removeEventListener('emotionDetected', this.boundEmotionHandler);

    const modal = document.getElementById('cameraScannerModal');
    const resultContainer = document.getElementById('cameraResultContainer');

    // Show result animation
    resultContainer.classList.add('show-result');

    setTimeout(() => {
      modal.classList.remove('active');
      this.emitMoodResult();
    }, 2000);
  }

  /**
   * Apply camera-detected mood to main UI
   */
  applyCameraDetectedMood(result) {
    const appMood = result?.mood || window.emotionDetector.mapEmotionToMood(this.bestMood);

    // Select mood in grid
    document.querySelectorAll('.mood-card').forEach(c => c.classList.remove('active'));
    const card = document.querySelector(`.mood-card[data-mood="${appMood}"]`);
    if (card) card.classList.add('active');

    if (typeof selectedMood !== 'undefined') {
      selectedMood = appMood;
    }

    const moodText = document.getElementById('moodText');
    if (moodText) {
      moodText.value = '';
    }

    const analysisBox = document.getElementById('analysisBox');
    const moodTag = document.getElementById('moodTag');
    const moodExplanation = document.getElementById('moodExplanation');
    const moodGenres = document.getElementById('moodGenres');

    if (analysisBox && moodTag && moodExplanation && moodGenres) {
      moodTag.textContent = `${appMood.toUpperCase()}  ${Math.max(0, Math.min(100, this.bestConfidence))}%`;
      moodExplanation.textContent = 'Detected from your live camera scan. Local-only processing keeps the experience privacy-safe.';
      moodGenres.textContent = 'Auto-routing to mood recommendations...';
      analysisBox.style.display = 'block';
    }

    const submitBtn = document.getElementById('submitBtn');
    const mainCard = document.querySelector('.main-card');
    if (mainCard) {
      setTimeout(() => mainCard.scrollIntoView({ behavior: 'smooth' }), 250);
    }

    if (submitBtn) {
      setTimeout(() => submitBtn.click(), 500);
      return;
    }

    window.location.href = `/recommendations?mood=${encodeURIComponent(appMood)}`;
  }

  /**
   * Get emoji for mood
   */
  getMoodEmoji(mood) {
    const emojis = {
      happy: '😊',
      sad: '😢',
      angry: '😠',
      surprised: '⚡',
      fearful: '👻',
      disgusted: '😠',
      neutral: '🍃',
    };
    return emojis[mood] || '😐';
  }
}

// Initialize global UI controller
window.cameraMoodUI = new CameraMoodUI();
