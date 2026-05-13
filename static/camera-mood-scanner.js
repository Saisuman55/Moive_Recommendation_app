/**
 * ═══════════════════════════════════════════════════════════════
 * CAMERA UI CONTROLLER — MOOD SCANNER INTERFACE
 * ═══════════════════════════════════════════════════════════════
 * 
 * Manages permission flow, scanner UI, emotion visualization,
 * and mood result handoff to recommendations
 */

class CameraMoodScanner {
    constructor() {
        this.state = 'IDLE'; // IDLE, PERMISSION, CALIBRATING, SCANNING, RESULT, ERROR
        this.engine = window.aiEmotionEngine;
        this.emotionBuffer = [];
        this.scanStartTime = null;
        this.resultMood = null;
        this.resultConfidence = 0;

        this.bindEvents();
        this.setupEmotionListener();
    }

    /**
     * Bind UI event listeners
     */
    bindEvents() {
        // Permission and setup buttons
        const enableBtn = document.getElementById('enableCameraBtn');
        const skipBtn = document.getElementById('skipBtn');
        const closeBtn = document.getElementById('closeScanner');
        const rescanBtn = document.getElementById('rescanBtn');
        const continueBtn = document.getElementById('continueBtn');
        const retryBtn = document.getElementById('retryBtn');
        const errorSkipBtn = document.getElementById('errorSkipBtn');

        if (enableBtn) enableBtn.addEventListener('click', () => this.requestCamera());
        if (skipBtn) skipBtn.addEventListener('click', () => this.skipScanning());
        if (closeBtn) closeBtn.addEventListener('click', () => this.closeScanner());
        if (rescanBtn) rescanBtn.addEventListener('click', () => this.requestCamera());
        if (continueBtn) continueBtn.addEventListener('click', () => this.continueToRecommendations());
        if (retryBtn) retryBtn.addEventListener('click', () => this.requestCamera());
        if (errorSkipBtn) errorSkipBtn.addEventListener('click', () => this.skipScanning());

        // Auto-show permission modal if stored
        const showPermissionWhenReady = () => {
            if (!localStorage.getItem('cameraMoodDismissed')) {
                setTimeout(() => this.showPermission(), 500);
            }
        };

        if (document.readyState === 'loading') {
            window.addEventListener('DOMContentLoaded', showPermissionWhenReady, { once: true });
        } else {
            showPermissionWhenReady();
        }

        // Handle window resize
        window.addEventListener('resize', () => {
            const canvas = document.getElementById('cameraCanvas');
            if (canvas && this.state === 'SCANNING') {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            }
        });
    }

    /**
     * Show permission modal
     */
    showPermission() {
        const modal = document.getElementById('permissionModal');
        const intro = document.getElementById('introScreen');
        
        if (intro) {
            intro.style.opacity = '0';
            setTimeout(() => intro.style.display = 'none', 500);
        }
        
        if (modal) {
            modal.classList.add('active');
        }
        
        this.state = 'PERMISSION';
    }

    /**
     * Request camera access
     */
    async requestCamera() {
        console.log('[CameraMoodScanner] Requesting camera...');
        
        // Hide permission modal
        const modal = document.getElementById('permissionModal');
        if (modal) modal.classList.remove('active');

        // Show calibration screen
        const calibrate = document.getElementById('calibrateScreen');
        if (calibrate) calibrate.classList.add('active');

        this.state = 'CALIBRATING';

        try {
            // Initialize engine if not already done
            if (!this.engine.isModelLoaded) {
                await this.engine.initialize();
            }

            // Get video and canvas elements
            const video = document.getElementById('cameraVideo');
            const canvas = document.getElementById('cameraCanvas');

            if (!video || !canvas) {
                throw new Error('Video or canvas element not found');
            }

            // Request camera
            await this.engine.startCamera(video, canvas);

            // Calibration complete
            if (calibrate) calibrate.classList.remove('active');

            // Start scanning
            this.startScanning();

        } catch (error) {
            console.error('[CameraMoodScanner] Camera request failed:', error);
            if (calibrate) calibrate.classList.remove('active');
            this.showError(error.message);
        }
    }

    /**
     * Start scanning
     */
    startScanning() {
        console.log('[CameraMoodScanner] Starting scan...');
        
        this.state = 'SCANNING';
        this.scanStartTime = Date.now();
        this.emotionBuffer = [];

        // Show scanner UI
        const scanner = document.getElementById('scannerContainer');
        if (scanner) scanner.classList.add('active');

        const emotionPanel = document.getElementById('emotionPanel');
        if (emotionPanel) emotionPanel.classList.add('active');

        // Auto-finish after 5 seconds
        setTimeout(() => {
            if (this.state === 'SCANNING') {
                this.finishScanning();
            }
        }, 5000);

        this.updateScannerUI();
    }

    /**
     * Setup emotion listener
     */
    setupEmotionListener() {
        window.addEventListener('emotionDetected', (event) => {
            if (this.state !== 'SCANNING') return;

            const { mood, confidence, emotions } = event.detail;

            this.emotionBuffer.push({
                mood,
                confidence,
                emotions,
                timestamp: Date.now()
            });

            // Keep only recent detections (last 10)
            if (this.emotionBuffer.length > 10) {
                this.emotionBuffer.shift();
            }

            this.updateEmotionDisplay(emotions);
            this.updateConfidenceDisplay(confidence);
            this.updateScanProgress();
        });
    }

    /**
     * Update scanner UI
     */
    updateScannerUI() {
        if (this.state !== 'SCANNING') return;

        const elapsed = Date.now() - this.scanStartTime;
        const progress = Math.min(elapsed / 5000, 1);

        // Update progress indicator
        const progressEl = document.getElementById('scanProgress');
        if (progressEl) {
            progressEl.style.width = (progress * 100) + '%';
        }

        // Update instruction text
        const instruction = document.getElementById('hudInstruction');
        if (instruction) {
            if (this.emotionBuffer.length === 0) {
                instruction.textContent = 'Position your face in the frame...';
            } else if (progress < 0.3) {
                instruction.textContent = 'Keep steady... Analyzing mood...';
            } else if (progress < 0.7) {
                instruction.textContent = 'Building emotion profile...';
            } else {
                instruction.textContent = 'Finalizing results...';
            }
        }
    }

    /**
     * Update emotion display
     */
    updateEmotionDisplay(emotions) {
        if (!emotions) return;

        const emotionList = document.getElementById('emotionList');
        if (!emotionList) return;

        // Get all emotion bars
        const bars = emotionList.querySelectorAll('.emotion-item');
        
        bars.forEach(bar => {
            const emotionId = bar.dataset.emotion;
            const confidence = emotions[emotionId] || 0;
            const percentage = Math.round(confidence * 100);

            // Update value
            const valueEl = bar.querySelector('.emotion-value');
            if (valueEl) valueEl.textContent = percentage + '%';

            // Update bar width
            const barFill = bar.querySelector('.emotion-bar-fill');
            if (barFill) {
                barFill.style.width = percentage + '%';
            }
        });
    }

    /**
     * Update confidence display
     */
    updateConfidenceDisplay(confidence) {
        const confidencePercent = document.getElementById('confidencePercent');
        if (confidencePercent) {
            confidencePercent.textContent = Math.round(confidence * 100) + '%';
        }

        // Update progress circle
        const confidenceProgress = document.getElementById('confidenceProgress');
        if (confidenceProgress) {
            const circumference = 2 * Math.PI * 60; // radius = 60
            const offset = circumference - (circumference * confidence);
            confidenceProgress.style.strokeDashoffset = offset;
        }
    }

    /**
     * Update scan progress
     */
    updateScanProgress() {
        const elapsed = Date.now() - this.scanStartTime;
        const progressPercent = Math.min((elapsed / 5000) * 100, 100);

        const scanProgress = document.getElementById('scanProgress');
        if (scanProgress) {
            scanProgress.style.width = progressPercent + '%';
        }
    }

    /**
     * Finish scanning
     */
    finishScanning() {
        console.log('[CameraMoodScanner] Scan complete');
        
        this.state = 'RESULT';
        this.engine.stopCamera();

        // Calculate dominant mood from buffer
        if (this.emotionBuffer.length > 0) {
            const moodCounts = {};
            const confidences = {};

            this.emotionBuffer.forEach(({ mood, confidence }) => {
                moodCounts[mood] = (moodCounts[mood] || 0) + 1;
                confidences[mood] = (confidences[mood] || 0) + confidence;
            });

            // Find most frequent mood
            let dominantMood = 'relaxed';
            let maxCount = 0;
            let maxConfidence = 0;

            for (const [mood, count] of Object.entries(moodCounts)) {
                if (count > maxCount) {
                    maxCount = count;
                    dominantMood = mood;
                    maxConfidence = confidences[mood] / count;
                }
            }

            this.resultMood = dominantMood;
            this.resultConfidence = maxConfidence;
        }

        this.showResult();
    }

    /**
     * Show result screen
     */
    showResult() {
        const scanner = document.getElementById('scannerContainer');
        if (scanner) scanner.classList.remove('active');

        const resultScreen = document.getElementById('resultScreen');
        if (resultScreen) {
            resultScreen.classList.add('active');
            this.updateResultScreen();
        }
    }

    /**
     * Update result screen
     */
    updateResultScreen() {
        const mood = this.resultMood || 'relaxed';
        const confidence = Math.round(this.resultConfidence * 100) || 0;

        // Mood emoji mapping
        const emojiMap = {
            happy: '😊',
            sad: '😢',
            angry: '😠',
            excited: '🤩',
            romantic: '🥰',
            stressed: '😰',
            relaxed: '😌',
            emotional: '🥺',
            fearful: '😨',
            bored: '😴',
            energetic: '⚡'
        };

        // Update emoji
        const emoji = document.getElementById('resultEmoji');
        if (emoji) emoji.textContent = emojiMap[mood] || '🎭';

        // Update mood text
        const moodText = document.getElementById('resultMood');
        if (moodText) moodText.textContent = mood.toUpperCase();

        // Update tagline
        const tagline = document.getElementById('resultTagline');
        if (tagline) {
            const taglines = {
                happy: 'You\'re feeling joyful! Let\'s find movies that celebrate the moment.',
                sad: 'You\'re feeling down. Let\'s find something to lift your spirits.',
                angry: 'You\'re feeling intense. Let\'s channel that energy into powerful stories.',
                excited: 'You\'re buzzing with excitement! Let\'s find thrilling entertainment.',
                romantic: 'You\'re in the mood for love. Let\'s find romantic stories.',
                stressed: 'You\'re feeling tense. Let\'s find something calming.',
                relaxed: 'You\'re chilled out. Let\'s find something easy and enjoyable.',
                emotional: 'You\'re feeling deeply. Let\'s find moving stories.',
                fearful: 'You\'re feeling brave. Let\'s find something thrilling.',
                bored: 'You need excitement. Let\'s find something engaging.',
                energetic: 'You\'re full of energy! Let\'s find action-packed content.'
            };
            tagline.textContent = taglines[mood] || 'Time to find the perfect movie!';
        }

        // Update confidence stat
        const stat = document.getElementById('statConfidence');
        if (stat) stat.textContent = confidence + '%';

        // Update time stat
        const timeEl = document.getElementById('statTime');
        if (timeEl) {
            const elapsed = ((Date.now() - this.scanStartTime) / 1000).toFixed(1);
            timeEl.textContent = elapsed + 's';
        }
    }

    /**
     * Continue to recommendations
     */
    continueToRecommendations() {
        const mood = this.resultMood || 'relaxed';
        window.location.href = `/recommendations?mood=${encodeURIComponent(mood)}`;
    }

    /**
     * Close scanner
     */
    closeScanner() {
        this.engine.stopCamera();
        this.state = 'IDLE';

        const scanner = document.getElementById('scannerContainer');
        if (scanner) scanner.classList.remove('active');

        const resultScreen = document.getElementById('resultScreen');
        if (resultScreen) resultScreen.classList.remove('active');
    }

    /**
     * Skip scanning
     */
    skipScanning() {
        localStorage.setItem('cameraMoodDismissed', 'true');
        const modal = document.getElementById('permissionModal');
        if (modal) modal.classList.remove('active');
        
        this.state = 'IDLE';
    }

    /**
     * Show error
     */
    showError(errorMessage) {
        this.state = 'ERROR';

        const errorScreen = document.getElementById('errorScreen');
        if (errorScreen) {
            errorScreen.classList.add('active');
            const message = errorScreen.querySelector('#errorMessage');
            if (message) {
                message.textContent = errorMessage || 'Unable to access camera. Please try again.';
            }
        }
    }
}

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.cameraMoodScanner = new CameraMoodScanner();
    });
} else {
    window.cameraMoodScanner = new CameraMoodScanner();
}
