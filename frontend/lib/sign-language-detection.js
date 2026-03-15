// lib/sign-language-detection.js
import * as tf from '@tensorflow/tfjs';

class SignLanguageDetector {
  constructor() {
    this.model = null;
    this.isProcessing = false;
    this.canvas = null;
    this.ctx = null;
    this.lastDetectedSign = '';
    this.detectionHistory = [];
    this.confidenceThreshold = 0.7;
    
    // Sign language alphabet mapping
    this.signMap = {
      0: 'A', 1: 'B', 2: 'C', 3: 'D', 4: 'E', 5: 'F', 6: 'G', 7: 'H', 8: 'I', 9: 'J',
      10: 'K', 11: 'L', 12: 'M', 13: 'N', 14: 'O', 15: 'P', 16: 'Q', 17: 'R', 18: 'S',
      19: 'T', 20: 'U', 21: 'V', 22: 'W', 23: 'X', 24: 'Y', 25: 'Z',
      26: 'space', 27: 'delete', 28: 'nothing'
    };
  }

  async initialize() {
    try {
      console.log('🤟 Initializing Sign Language Detection...');
      
      // Load pre-trained model (you can use a custom model or a public one)
      // For now, we'll use a simplified approach with MediaPipe-like detection
      // In production, you'd load a real model trained on sign language dataset
      
      // Create a simple CNN model for demonstration
      this.model = await this.createSignLanguageModel();
      
      console.log('✅ Sign Language Detection initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize sign language detection:', error);
      return false;
    }
  }

  async createSignLanguageModel() {
    // Create a simple CNN model for sign language recognition
    // In production, you'd load a pre-trained model
    const model = tf.sequential({
      layers: [
        tf.layers.conv2d({
          inputShape: [224, 224, 3],
          kernelSize: 3,
          filters: 32,
          activation: 'relu'
        }),
        tf.layers.maxPooling2d({ poolSize: 2 }),
        tf.layers.conv2d({
          kernelSize: 3,
          filters: 64,
          activation: 'relu'
        }),
        tf.layers.maxPooling2d({ poolSize: 2 }),
        tf.layers.flatten(),
        tf.layers.dense({ units: 128, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.5 }),
        tf.layers.dense({ units: 29, activation: 'softmax' }) // 26 letters + space + delete + nothing
      ]
    });

    return model;
  }

  async detectSign(videoElement) {
    if (!this.model || this.isProcessing || !videoElement) {
      return null;
    }

    try {
      this.isProcessing = true;

      // Create canvas if not exists
      if (!this.canvas) {
        this.canvas = document.createElement('canvas');
        this.canvas.width = 224;
        this.canvas.height = 224;
        this.ctx = this.canvas.getContext('2d');
      }

      // Draw video frame to canvas
      this.ctx.drawImage(videoElement, 0, 0, 224, 224);

      // Convert to tensor
      const imageTensor = tf.browser.fromPixels(this.canvas)
        .toFloat()
        .div(tf.scalar(255))
        .expandDims(0);

      // Make prediction
      const predictions = await this.model.predict(imageTensor);
      const predictedClass = predictions.argMax(-1).dataSync()[0];
      const confidence = predictions.max().dataSync()[0];

      // Clean up tensors
      imageTensor.dispose();
      predictions.dispose();

      // Only return if confidence is high enough
      if (confidence > this.confidenceThreshold) {
        const detectedSign = this.signMap[predictedClass];
        
        // Add to history for smoothing
        this.detectionHistory.push(detectedSign);
        if (this.detectionHistory.length > 5) {
          this.detectionHistory.shift();
        }

        // Return most common detection in history
        const mostCommon = this.getMostCommonSign();
        
        if (mostCommon !== 'nothing' && mostCommon !== this.lastDetectedSign) {
          this.lastDetectedSign = mostCommon;
          return {
            sign: mostCommon,
            confidence: confidence
          };
        }
      }

      return null;
    } catch (error) {
      console.error('Error detecting sign:', error);
      return null;
    } finally {
      this.isProcessing = false;
    }
  }

  getMostCommonSign() {
    if (this.detectionHistory.length === 0) return 'nothing';
    
    const counts = {};
    this.detectionHistory.forEach(sign => {
      counts[sign] = (counts[sign] || 0) + 1;
    });

    return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
  }

  reset() {
    this.detectionHistory = [];
    this.lastDetectedSign = '';
  }

  cleanup() {
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
    if (this.canvas) {
      this.canvas = null;
      this.ctx = null;
    }
    this.detectionHistory = [];
  }
}

// Alternative: Using Hugging Face API for sign language detection
export async function detectSignLanguageWithAPI(imageBlob) {
  try {
    const response = await fetch('/api/detect-sign-language', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: imageBlob
      })
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error calling sign language API:', error);
    return null;
  }
}

export default SignLanguageDetector;
