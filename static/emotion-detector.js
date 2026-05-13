/**
 * AI Emotion Detection Module
 * Uses TensorFlow.js and face-api.js for real-time facial emotion recognition
 */

class EmotionDetector {
  constructor() {
    this.isModelLoaded = false;
    this.isDetecting = false;
    this.stream = null;
    this.canvas = null;
    this.video = null;
    this.detectionInterval = null;
    this.emotionHistory = [];
    this.currentMood = null;
    this.confidence = 0;
  }

  /**
   * Initialize and load TensorFlow models
   */
  async initialize() {
    try {
      console.log('Loading emotion detection models...');
      // Load face-api models from CDN
      const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.13/model/';
      
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
      ]);
      
      this.isModelLoaded = true;
      console.log('✅ Emotion detection models loaded successfully');
      return true;
    } catch (error) {
      console.error('Failed to load models:', error);
      return false;
    }
  }

  /**
   * Request camera access and start detection
   */
  async startCamera(videoElement, canvasElement) {
    try {
      this.video = videoElement;
      this.canvas = canvasElement;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false,
      });

      this.stream = stream;
      this.video.srcObject = stream;

      return new Promise((resolve) => {
        this.video.onloadedmetadata = () => {
          this.isDetecting = true;
          this.startEmotionDetection();
          resolve(true);
        };
      });
    } catch (error) {
      console.error('Camera access denied:', error);
      throw new Error('Camera access denied. Please enable camera permissions.');
    }
  }

  /**
   * Stop camera and cleanup
   */
  stopCamera() {
    this.isDetecting = false;
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
    }
    if (this.detectionInterval) {
      clearInterval(this.detectionInterval);
    }
    if (this.video) {
      this.video.srcObject = null;
    }
  }

  /**
   * Start real-time emotion detection loop
   */
  startEmotionDetection() {
    this.detectionInterval = setInterval(async () => {
      if (!this.isDetecting || !this.video) return;

      try {
        const displaySize = {
          width: this.video.videoWidth,
          height: this.video.videoHeight,
        };

        faceapi.matchDimensions(this.canvas, displaySize);

        const detections = await faceapi
          .detectAllFaces(this.video, new faceapi.TinyFaceDetectorOptions())
          .withFaceExpressions();

        if (detections.length > 0) {
          // Get the first detected face
          const detection = detections[0];
          const expressions = detection.expressions;

          // Determine dominant emotion
          const emotions = Object.entries(expressions).map(([emotion, confidence]) => ({
            emotion,
            confidence,
          }));

          emotions.sort((a, b) => b.confidence - a.confidence);

          if (emotions[0]) {
            this.currentMood = emotions[0].emotion;
            this.confidence = Math.round(emotions[0].confidence * 100);
            this.emotionHistory.push({
              mood: this.currentMood,
              confidence: this.confidence,
              timestamp: Date.now(),
            });

            // Keep only recent history (last 10 detections)
            if (this.emotionHistory.length > 10) {
              this.emotionHistory.shift();
            }

            // Dispatch custom event with emotion data
            window.dispatchEvent(
              new CustomEvent('emotionDetected', {
                detail: {
                  mood: this.currentMood,
                  confidence: this.confidence,
                  allEmotions: emotions,
                },
              })
            );
          }

          // Draw face detection on canvas
          this.drawDetection(displaySize, detections);
        }
      } catch (error) {
        console.error('Detection error:', error);
      }
    }, 100);
  }

  /**
   * Draw face detection visualization
   */
  drawDetection(displaySize, detections) {
    const ctx = this.canvas.getContext('2d');
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const resizedDetections = faceapi.resizeResults(detections, displaySize);

    resizedDetections.forEach((detection) => {
      const box = detection.detection.box;

      // Draw face box with glow effect
      ctx.strokeStyle = '#00d4aa';
      ctx.lineWidth = 3;
      ctx.shadowColor = 'rgba(0, 212, 170, 0.5)';
      ctx.shadowBlur = 20;
      ctx.strokeRect(box.x, box.y, box.width, box.height);
      ctx.shadowColor = 'transparent';

      // Draw landmark points
      const landmarks = detection.landmarks;
      ctx.fillStyle = '#00d4aa';
      landmarks.positions.forEach((point) => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
        ctx.fill();
      });
    });
  }

  /**
   * Get dominant mood from recent detections
   */
  getDominantMood() {
    if (this.emotionHistory.length === 0) return null;

    const moodCounts = {};
    this.emotionHistory.forEach(({ mood }) => {
      moodCounts[mood] = (moodCounts[mood] || 0) + 1;
    });

    let dominantMood = null;
    let maxCount = 0;

    Object.entries(moodCounts).forEach(([mood, count]) => {
      if (count > maxCount) {
        maxCount = count;
        dominantMood = mood;
      }
    });

    return dominantMood;
  }

  /**
   * Map face-api emotion to app mood
   */
  mapEmotionToMood(emotion) {
    const emotionMap = {
      happy: 'happy',
      sad: 'sad',
      angry: 'angry',
      surprised: 'excited',
      fearful: 'scared',
      disgusted: 'angry',
      neutral: 'chill',
    };

    return emotionMap[emotion] || 'chill';
  }
}

// Initialize global detector
window.emotionDetector = new EmotionDetector();
