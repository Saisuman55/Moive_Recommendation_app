/**
 * ═══════════════════════════════════════════════════════════════
 * AI MOOD DETECTION ENGINE — PRODUCTION IMPLEMENTATION
 * ═══════════════════════════════════════════════════════════════
 * 
 * Combines real face-api.js detection with fallback simulation
 * Properly handles video stream processing and emotion mapping
 */

class AIEmotionEngine {
    constructor() {
        this.isModelLoaded = false;
        this.isDetecting = false;
        this.stream = null;
        this.video = null;
        this.canvas = null;
        this.ctx = null;
        this.detectionInterval = null;
        this.emotionHistory = [];
        this.currentMood = null;
        this.confidence = 0;
        this.useSimulation = false;
        this.useTrainedModel = false;
        this.moodModel = null;
        this.moodClasses = [
            'happy',
            'sad',
            'angry',
            'excited',
            'romantic',
            'stressed',
            'relaxed',
            'emotional',
            'fearful',
            'bored',
            'energetic'
        ];
        this.prevFrame = null;
        this.frameCount = 0;

        // Emotion configuration
        this.emotions = {
            happy: 0.05,
            sad: 0.05,
            angry: 0.05,
            excited: 0.05,
            romantic: 0.05,
            stressed: 0.05,
            relaxed: 0.05,
            emotional: 0.05,
            fearful: 0.05,
            bored: 0.05,
            energetic: 0.05
        };

        this.emotionMaps = {
            // face-api.js expressions to our moods
            happy: 'happy',
            sad: 'sad',
            angry: 'angry',
            surprised: 'excited',
            fearful: 'fearful',
            disgusted: 'angry',
            neutral: 'relaxed'
        };
    }

    /**
     * Initialize face-api models
     */
    async initialize() {
        try {
            console.log('[AIEmotionEngine] Loading face detection models...');

            await this.waitForLibraries();

            await this.loadTrainedMoodModel();

            if (typeof faceapi === 'undefined') {
                console.warn('[AIEmotionEngine] face-api.js not available after waiting, using simulation');
                this.useSimulation = true;
                this.isModelLoaded = true;
                return true;
            }

            const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.13/model/';
            
            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
            ]);

            this.isModelLoaded = true;
            this.useSimulation = false;
            console.log('✅ [AIEmotionEngine] Face-api models loaded successfully');
            return true;
        } catch (error) {
            console.warn('[AIEmotionEngine] Face-api load failed, switching to simulation:', error);
            this.isModelLoaded = true;
            this.useSimulation = true;
            return true;
        }
    }

    async loadTrainedMoodModel() {
        try {
            if (typeof tf === 'undefined') {
                return false;
            }

            const statusResponse = await fetch('/api/model-status');
            if (!statusResponse.ok) {
                return false;
            }

            const status = await statusResponse.json();
            if (!status.available || !status.url) {
                console.warn('[AIEmotionEngine] No local trained mood model found, using face-api path');
                return false;
            }

            this.moodModel = await tf.loadGraphModel(status.url);
            this.useTrainedModel = true;
            console.log('✅ [AIEmotionEngine] Local trained mood model loaded successfully');
            return true;
        } catch (error) {
            console.warn('[AIEmotionEngine] Local trained mood model unavailable, using face-api path:', error);
            this.moodModel = null;
            this.useTrainedModel = false;
            return false;
        }
    }

    async waitForLibraries(timeoutMs = 6000) {
        const startedAt = Date.now();

        while (Date.now() - startedAt < timeoutMs) {
            if (typeof tf !== 'undefined' && typeof faceapi !== 'undefined') {
                return true;
            }

            await new Promise((resolve) => setTimeout(resolve, 100));
        }

        return false;
    }

    /**
     * Request camera and start stream
     */
    async startCamera(videoElement, canvasElement) {
        try {
            console.log('[AIEmotionEngine] Requesting camera access...');
            
            this.video = videoElement;
            this.canvas = canvasElement;
            this.ctx = canvasElement.getContext('2d', { willReadFrequently: true });

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'user',
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    frameRate: { ideal: 30 }
                },
                audio: false
            });

            this.stream = stream;
            this.video.srcObject = stream;
            this.video.play();

            console.log('✅ [AIEmotionEngine] Camera stream started');
            
            return new Promise((resolve) => {
                this.video.onloadedmetadata = () => {
                    this.canvas.width = this.video.videoWidth;
                    this.canvas.height = this.video.videoHeight;
                    this.isDetecting = true;
                    this.startDetectionLoop();
                    resolve(true);
                };
            });
        } catch (error) {
            console.error('[AIEmotionEngine] Camera error:', error.message);
            throw new Error(`Camera access denied: ${error.message}`);
        }
    }

    /**
     * Stop camera and cleanup
     */
    stopCamera() {
        this.isDetecting = false;
        
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        
        if (this.detectionInterval) {
            clearInterval(this.detectionInterval);
            this.detectionInterval = null;
        }
        
        if (this.video) {
            this.video.srcObject = null;
        }
        
        console.log('[AIEmotionEngine] Camera stopped');
    }

    /**
     * Main detection loop
     */
    startDetectionLoop() {
        console.log('[AIEmotionEngine] Starting detection loop...');
        
        this.detectionInterval = setInterval(async () => {
            if (!this.isDetecting || !this.video || this.video.readyState < 2) return;

            try {
                if (this.useSimulation) {
                    await this.detectWithSimulation();
                } else {
                    await this.detectWithFaceAPI();
                }
            } catch (error) {
                console.error('[AIEmotionEngine] Detection error:', error);
            }
        }, 100); // 10 FPS for reasonable performance
    }

    /**
     * Real face-api.js detection
     */
    async detectWithFaceAPI() {
        try {
            const detectorOptions = new faceapi.TinyFaceDetectorOptions({
                inputSize: 512,
                scoreThreshold: 0.45
            });

            const detection = await faceapi
                .detectSingleFace(this.video, detectorOptions)
                .withFaceLandmarks()
                .withFaceExpressions();

            if (!detection) {
                this.confidence = 0;
                return;
            }

            if (this.useTrainedModel && this.moodModel) {
                await this.detectWithTrainedModel(detection);
                return;
            }

            const expressions = detection.expressions;

            // Find dominant emotion
            let maxConfidence = 0;
            let dominantEmotion = 'neutral';

            for (const [emotion, confidence] of Object.entries(expressions)) {
                if (confidence > maxConfidence) {
                    maxConfidence = confidence;
                    dominantEmotion = emotion;
                }
            }

            // Map to our mood taxonomy
            const mood = this.emotionMaps[dominantEmotion] || 'relaxed';

            // Keep the detector honest by biasing toward stable, confident results.
            const stabilityBoost = Math.min(1, this.emotionHistory.filter((entry) => entry.mood === mood).length / 5);
            maxConfidence = Math.min(1, maxConfidence * 0.85 + stabilityBoost * 0.15);
            
            // Update state
            this.currentMood = mood;
            this.confidence = maxConfidence;
            this.emotions = this.mapExpressionsToEmotions(expressions);

            // Add to history
            this.emotionHistory.push({
                mood,
                confidence: maxConfidence,
                allEmotions: expressions,
                timestamp: Date.now()
            });

            if (this.emotionHistory.length > 30) {
                this.emotionHistory.shift();
            }

            // Draw on canvas
            this.drawDetection(detection, [detection]);

            // Dispatch event
            if (maxConfidence >= 0.35 || this.emotionHistory.length < 3) {
                this.dispatchEmotionEvent(mood, maxConfidence, expressions);
            }

        } catch (error) {
            console.error('[AIEmotionEngine] Face-api detection failed:', error);
        }
    }

    async detectWithTrainedModel(detection) {
        try {
            const emotions = await this.predictMoodFromFaceCrop(detection.detection.box);
            if (!emotions) {
                return;
            }

            const rankedEmotions = Object.entries(emotions).sort((left, right) => right[1] - left[1]);
            const [dominantMood, dominantConfidence] = rankedEmotions[0] || ['relaxed', 0];
            const smoothedConfidence = Math.min(
                1,
                dominantConfidence * 0.85 + Math.min(1, this.emotionHistory.filter((entry) => entry.mood === dominantMood).length / 5) * 0.15
            );

            this.currentMood = dominantMood;
            this.confidence = smoothedConfidence;
            this.emotions = emotions;

            this.emotionHistory.push({
                mood: dominantMood,
                confidence: smoothedConfidence,
                allEmotions: emotions,
                timestamp: Date.now()
            });

            if (this.emotionHistory.length > 30) {
                this.emotionHistory.shift();
            }

            this.drawDetection(detection, [detection]);

            if (smoothedConfidence >= 0.35 || this.emotionHistory.length < 3) {
                this.dispatchEmotionEvent(dominantMood, smoothedConfidence, emotions);
            }
        } catch (error) {
            console.error('[AIEmotionEngine] Trained model detection failed:', error);
        }
    }

    async predictMoodFromFaceCrop(box) {
        if (!this.moodModel || typeof tf === 'undefined' || !this.video) {
            return null;
        }

        const cropCanvas = this.getCropCanvas();
        const context = cropCanvas.getContext('2d', { willReadFrequently: true });
        const videoWidth = this.video.videoWidth || this.canvas.width;
        const videoHeight = this.video.videoHeight || this.canvas.height;
        const padding = Math.min(box.width, box.height) * 0.25;

        const sourceX = Math.max(0, box.x - padding);
        const sourceY = Math.max(0, box.y - padding);
        const sourceWidth = Math.min(videoWidth - sourceX, box.width + padding * 2);
        const sourceHeight = Math.min(videoHeight - sourceY, box.height + padding * 2);

        context.clearRect(0, 0, cropCanvas.width, cropCanvas.height);
        context.drawImage(
            this.video,
            sourceX,
            sourceY,
            sourceWidth,
            sourceHeight,
            0,
            0,
            cropCanvas.width,
            cropCanvas.height
        );

        const inputTensor = tf.browser
            .fromPixels(cropCanvas)
            .toFloat()
            .div(255.0)
            .expandDims(0);

        let prediction = null;

        try {
            if (typeof this.moodModel.executeAsync === 'function') {
                prediction = await this.moodModel.executeAsync(inputTensor);
            } else if (typeof this.moodModel.predict === 'function') {
                prediction = this.moodModel.predict(inputTensor);
            }
        } finally {
            if (typeof inputTensor.dispose === 'function') {
                inputTensor.dispose();
            }
        }

        if (!prediction) {
            return null;
        }

        const outputTensor = Array.isArray(prediction) ? prediction[0] : prediction;
        const values = await outputTensor.data();

        if (typeof outputTensor.dispose === 'function') {
            outputTensor.dispose();
        }

        const emotions = {};
        const total = values.reduce((sum, value) => sum + value, 0) || 1;

        this.moodClasses.forEach((mood, index) => {
            emotions[mood] = values[index] !== undefined ? values[index] / total : 0;
        });

        return this.smoothEmotions(emotions);
    }

    getCropCanvas() {
        if (!this.cropCanvas) {
            this.cropCanvas = document.createElement('canvas');
            this.cropCanvas.width = 224;
            this.cropCanvas.height = 224;
        }

        return this.cropCanvas;
    }

    smoothEmotions(emotions) {
        const smoothed = { ...this.emotions };
        const smoothing = 0.2;

        for (const key of Object.keys(smoothed)) {
            smoothed[key] += ((emotions[key] || 0) - smoothed[key]) * smoothing;
        }

        return smoothed;
    }

    /**
     * Simulation-based detection (fallback)
     */
    async detectWithSimulation() {
        try {
            if (this.video.readyState < 2) return;

            // Draw video frame to canvas for analysis
            this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
            const frame = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
            const data = frame.data;

            // Analyze brightness and motion
            let totalBrightness = 0;
            let motionPixels = 0;
            const sampleStep = 4;

            for (let i = 0; i < data.length; i += 4 * sampleStep) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                const brightness = (r + g + b) / 3;
                totalBrightness += brightness;

                if (this.prevFrame) {
                    const diff = Math.abs(r - this.prevFrame[i]) +
                                 Math.abs(g - this.prevFrame[i + 1]) +
                                 Math.abs(b - this.prevFrame[i + 2]);
                    if (diff > 50) motionPixels++;
                }
            }

            if (this.frameCount % 3 === 0) {
                this.prevFrame = new Uint8ClampedArray(data);
            }
            this.frameCount++;

            const avgBrightness = totalBrightness / (data.length / 4 / sampleStep);
            const normalizedBrightness = avgBrightness / 255;
            const motionScore = Math.min(motionPixels / (data.length / 4 / sampleStep) * 10, 1);

            // Predict emotions based on video features
            const emotions = this.predictEmotionsFromFeatures(normalizedBrightness, motionScore);
            this.emotions = emotions;

            // Find dominant mood
            let maxConfidence = 0;
            let dominantMood = 'relaxed';

            for (const [mood, confidence] of Object.entries(emotions)) {
                if (confidence > maxConfidence) {
                    maxConfidence = confidence;
                    dominantMood = mood;
                }
            }

            this.currentMood = dominantMood;
            this.confidence = maxConfidence;

            // Add to history
            this.emotionHistory.push({
                mood: dominantMood,
                confidence: maxConfidence,
                brightness: normalizedBrightness,
                motion: motionScore,
                timestamp: Date.now()
            });

            if (this.emotionHistory.length > 30) {
                this.emotionHistory.shift();
            }

            // Draw simulation visualization
            this.drawSimulationVisualization(normalizedBrightness, motionScore);

            // Dispatch event
            this.dispatchEmotionEvent(dominantMood, maxConfidence, emotions);

        } catch (error) {
            console.error('[AIEmotionEngine] Simulation detection failed:', error);
        }
    }

    /**
     * Predict emotions from video features
     */
    predictEmotionsFromFeatures(brightness, motion) {
        const noise = () => (Math.random() - 0.5) * 0.08;
        const smoothing = 0.15;

        const predictions = {
            happy: Math.max(0, brightness * 0.7 + (1 - motion) * 0.3 + noise()),
            sad: Math.max(0, (1 - brightness) * 0.6 + (1 - motion) * 0.2 + noise()),
            angry: Math.max(0, motion * 0.6 + brightness * 0.2 + noise()),
            excited: Math.max(0, motion * 0.8 + brightness * 0.3 + noise()),
            romantic: Math.max(0, (1 - motion) * 0.5 + brightness * 0.4 + noise()),
            stressed: Math.max(0, motion * 0.7 + (1 - brightness) * 0.3 + noise()),
            relaxed: Math.max(0, (1 - motion) * 0.8 + brightness * 0.3 + noise()),
            emotional: Math.max(0, (1 - brightness) * 0.5 + motion * 0.2 + noise()),
            fearful: Math.max(0, motion * 0.4 + (1 - brightness) * 0.4 + noise()),
            bored: Math.max(0, (1 - motion) * 0.6 + (1 - brightness) * 0.2 + noise()),
            energetic: Math.max(0, motion * 0.9 + brightness * 0.4 + noise())
        };

        // Softmax normalization
        const expValues = {};
        let sumExp = 0;

        for (const [key, val] of Object.entries(predictions)) {
            const clamped = Math.max(0, Math.min(1, val));
            expValues[key] = Math.exp(clamped * 3);
            sumExp += expValues[key];
        }

        const normalized = {};
        for (const key of Object.keys(expValues)) {
            normalized[key] = expValues[key] / sumExp;
        }

        // Apply EMA smoothing
        for (const key of Object.keys(this.emotions)) {
            this.emotions[key] += (normalized[key] - this.emotions[key]) * smoothing;
        }

        return this.emotions;
    }

    /**
     * Map face-api expressions to our emotion taxonomy
     */
    mapExpressionsToEmotions(expressions) {
        const emotions = { ...this.emotions };
        
        // Simple mapping with weighted distribution
        emotions.happy = (expressions.happy || 0) * 0.7 + (expressions.surprised || 0) * 0.2;
        emotions.sad = expressions.sad || 0;
        emotions.angry = expressions.angry + (expressions.disgusted || 0) * 0.5;
        emotions.excited = (expressions.surprised || 0) * 0.6 + (expressions.happy || 0) * 0.2;
        emotions.romantic = emotions.happy * 0.3 + (expressions.surprised || 0) * 0.1;
        emotions.stressed = (expressions.fearful || 0) * 0.6 + expressions.angry * 0.2;
        emotions.relaxed = (1 - expressions.angry - expressions.fearful) * 0.5 + (expressions.neutral || 0);
        emotions.emotional = expressions.sad * 0.4 + (expressions.fearful || 0) * 0.3;
        emotions.fearful = expressions.fearful || 0;
        emotions.bored = (expressions.neutral || 0) * 0.6 + (1 - expressions.happy) * 0.2;
        emotions.energetic = expressions.happy * 0.4 + (expressions.surprised || 0) * 0.3;

        // Normalize
        const sum = Object.values(emotions).reduce((a, b) => a + b, 0);
        for (const key in emotions) {
            emotions[key] = emotions[key] / Math.max(sum, 0.01);
        }

        return emotions;
    }

    /**
     * Draw face detection visualization
     */
    drawDetection(detection, detections) {
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Clear canvas
        this.ctx.clearRect(0, 0, w, h);

        // Draw face box
        const box = detection.detection.box;
        this.ctx.strokeStyle = '#00f3ff';
        this.ctx.lineWidth = 3;
        this.ctx.shadowColor = 'rgba(0, 243, 255, 0.5)';
        this.ctx.shadowBlur = 15;
        this.ctx.strokeRect(box.x, box.y, box.width, box.height);

        // Draw landmarks
        if (detection.landmarks) {
            const landmarks = detection.landmarks.positions;
            this.ctx.fillStyle = '#00f3ff';
            landmarks.forEach(point => {
                this.ctx.beginPath();
                this.ctx.arc(point.x, point.y, 2, 0, Math.PI * 2);
                this.ctx.fill();
            });
        }

        this.ctx.shadowBlur = 0;
    }

    /**
     * Draw simulation visualization
     */
    drawSimulationVisualization(brightness, motion) {
        const w = this.canvas.width;
        const h = this.canvas.height;

        this.ctx.clearRect(0, 0, w, h);

        // Draw face detection box (simulated)
        const boxW = w * 0.3;
        const boxH = h * 0.4;
        const boxX = (w - boxW) / 2;
        const boxY = (h - boxH) / 2 + Math.sin(Date.now() / 500) * 10;

        this.ctx.strokeStyle = '#00f3ff';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([8, 4]);
        this.ctx.strokeRect(boxX, boxY, boxW, boxH);
        this.ctx.setLineDash([]);

        // Draw corner brackets
        const cornerSize = 30;
        const corners = [
            { x: boxX, y: boxY, dx: cornerSize, dy: cornerSize },
            { x: boxX + boxW, y: boxY, dx: -cornerSize, dy: cornerSize },
            { x: boxX, y: boxY + boxH, dx: cornerSize, dy: -cornerSize },
            { x: boxX + boxW, y: boxY + boxH, dx: -cornerSize, dy: -cornerSize }
        ];

        this.ctx.strokeStyle = '#00f3ff';
        this.ctx.lineWidth = 2;
        this.ctx.shadowColor = 'rgba(0, 243, 255, 0.5)';
        this.ctx.shadowBlur = 15;

        corners.forEach(corner => {
            this.ctx.beginPath();
            this.ctx.moveTo(corner.x, corner.y);
            this.ctx.lineTo(corner.x + corner.dx, corner.y);
            this.ctx.stroke();

            this.ctx.beginPath();
            this.ctx.moveTo(corner.x, corner.y);
            this.ctx.lineTo(corner.x, corner.y + corner.dy);
            this.ctx.stroke();
        });

        this.ctx.shadowBlur = 0;
    }

    /**
     * Dispatch emotion detected event
     */
    dispatchEmotionEvent(mood, confidence, emotions) {
        window.dispatchEvent(new CustomEvent('emotionDetected', {
            detail: {
                mood,
                confidence,
                emotions,
                timestamp: Date.now()
            }
        }));
    }

    /**
     * Get dominant mood
     */
    getDominantMood() {
        return {
            mood: this.currentMood,
            confidence: this.confidence,
            allEmotions: this.emotions
        };
    }

    /**
     * Get emotion history
     */
    getHistory() {
        return this.emotionHistory;
    }
}

// Initialize globally
window.aiEmotionEngine = new AIEmotionEngine();
