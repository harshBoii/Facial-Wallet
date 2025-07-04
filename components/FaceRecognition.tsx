'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import * as faceapi from 'face-api.js';

interface FaceRecognitionProps {
  isEnrolling: boolean;
  onAuthSuccess: (userId: string) => void;
  onAuthFailure: (error: string) => void;
  onEnrollmentSuccess: (userId: string) => void;
  onEnrollmentFailure: (error: string) => void;
  onClose: () => void;
}

export default function FaceRecognition({
  isEnrolling,
  onAuthSuccess,
  onAuthFailure,
  onEnrollmentFailure,
  onEnrollmentSuccess,
  onClose,
}: FaceRecognitionProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [enrollmentProgress, setEnrollmentProgress] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastProcessTime, setLastProcessTime] = useState(0);
  const [lastEnrollmentTime, setLastEnrollmentTime] = useState(0);
  const [faceDetected, setFaceDetected] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');
  const [videoStarted, setVideoStarted] = useState(false);

  // Load face-api.js models
  useEffect(() => {
    const loadModels = async (retryCount = 0) => {
      try {
        console.log(`Loading face-api models... (attempt ${retryCount + 1})`);
        
        // Add timeout and retry logic for production
        const loadWithTimeout = async (modelLoader: Promise<any>, modelName: string) => {
          const timeout = new Promise((_, reject) => 
            setTimeout(() => reject(new Error(`Timeout loading ${modelName}`)), 30000)
          );
          
          try {
            await Promise.race([modelLoader, timeout]);
            console.log(`${modelName} loaded successfully`);
          } catch (error) {
            console.error(`Failed to load ${modelName}:`, error);
            throw error;
          }
        };

        // Try loading models with fallback URLs
        const loadModelWithFallback = async (modelName: string, modelLoader: () => Promise<any>) => {
          const urls = ['/models', './models', '/public/models'];
          
          for (const url of urls) {
            try {
              console.log(`Trying to load ${modelName} from ${url}...`);
              await loadWithTimeout(modelLoader(), modelName);
              return;
            } catch (error) {
              console.warn(`Failed to load ${modelName} from ${url}:`, error);
              if (url === urls[urls.length - 1]) {
                throw error;
              }
            }
          }
        };

        // Load models sequentially to avoid overwhelming the server
        console.log('Loading TinyFaceDetector...');
        await loadModelWithFallback('TinyFaceDetector', () => faceapi.nets.tinyFaceDetector.loadFromUri('/models'));
        
        console.log('Loading FaceLandmark68Net...');
        await loadModelWithFallback('FaceLandmark68Net', () => faceapi.nets.faceLandmark68Net.loadFromUri('/models'));
        
        console.log('Loading FaceRecognitionNet...');
        await loadModelWithFallback('FaceRecognitionNet', () => faceapi.nets.faceRecognitionNet.loadFromUri('/models'));
        
        console.log('All face-api models loaded successfully');
        setModelsLoaded(true);
      } catch (error) {
        console.error('Failed to load face-api models:', error);
        
        // Retry up to 2 times
        if (retryCount < 2) {
          console.log(`Retrying model loading... (${retryCount + 1}/2)`);
          setTimeout(() => loadModels(retryCount + 1), 2000);
        } else {
          onAuthFailure('Failed to load face recognition models. Please refresh the page and try again.');
        }
      }
    };

    loadModels();
  }, [onAuthFailure]);

  // Reset enrollment progress when starting enrollment
  useEffect(() => {
    if (isEnrolling) {
      setEnrollmentProgress(0);
      setIsProcessing(false);
      setLastProcessTime(0);
      setLastEnrollmentTime(0);
      setFaceDetected(false);
      setProcessingMessage('');
    }
  }, [isEnrolling]);

  // Start video stream - only once when models are loaded
  useEffect(() => {
    if (modelsLoaded && !videoStarted) {
      const startVideo = async () => {
        try {
          console.log('Starting video stream...');
          
          // Check if getUserMedia is supported
          if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error('Camera access not supported in this browser');
          }
          
          const mediaStream = await navigator.mediaDevices.getUserMedia({
            video: { 
              width: { ideal: 640 },
              height: { ideal: 480 },
              facingMode: 'user'
            },
          });
          
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
            setStream(mediaStream);
            setVideoStarted(true);
          }
          
          setIsLoading(false);
          console.log('Video stream started successfully');
        } catch (error) {
          console.error('Failed to access camera:', error);
          let errorMessage = 'Camera access denied';
          if (error instanceof Error) {
            if (error.name === 'NotAllowedError') {
              errorMessage = 'Camera access denied. Please allow camera access and try again.';
            } else if (error.name === 'NotFoundError') {
              errorMessage = 'No camera found. Please connect a camera and try again.';
            } else if (error.name === 'NotSupportedError') {
              errorMessage = 'Camera not supported in this browser. Please try a different browser.';
            }
          }
          onAuthFailure(errorMessage);
        }
      };

      startVideo();
    }

    // Cleanup function
    return () => {
      if (stream) {
        console.log('Stopping video stream...');
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [modelsLoaded, videoStarted, onAuthFailure, stream]);

  // Handle face detection and recognition
  const processFrame = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !videoStarted) return;
    
    // Prevent processing too frequently
    const now = Date.now();
    if (now - lastProcessTime < 300) return; // Only process every 300ms
    
    if (isProcessing) return;

    setIsProcessing(true);
    setLastProcessTime(now);

    try {
      console.log('Processing frame...');
      
      // Check if video is ready
      if (videoRef.current.readyState < 2) {
        console.log('Video not ready yet...');
        setIsProcessing(false);
        return;
      }
      
      // Detect faces in the video frame
      const detections = await faceapi
        .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptors();

      if (detections.length === 0) {
        setFaceDetected(false);
        setProcessingMessage('');
        setIsProcessing(false);
        return;
      }

      if (detections.length > 1) {
        setFaceDetected(true);
        setProcessingMessage('Multiple faces detected. Please ensure only one face is visible.');
        onAuthFailure('Multiple faces detected. Please ensure only one face is visible.');
        setIsProcessing(false);
        return;
      }

      const faceDescriptor = detections[0].descriptor;
      setFaceDetected(true);
      setProcessingMessage('Face detected');

      if (isEnrolling) {
        // Prevent enrollment requests too frequently
        if (now - lastEnrollmentTime < 2000) {
          setProcessingMessage(`Waiting for next capture... (${enrollmentProgress + 1}/5)`);
          setIsProcessing(false);
          return;
        }
        setProcessingMessage(`Capturing image ${enrollmentProgress + 1}/5...`);
        await handleEnrollment(faceDescriptor);
      } else {
        setProcessingMessage('Processing face...');
        await handleAuthentication(faceDescriptor);
      }
    } catch (error) {
      console.error('Face processing error:', error);
      setProcessingMessage('Face processing failed');
      onAuthFailure('Face processing failed');
      setIsProcessing(false);
    }
  }, [videoStarted, lastProcessTime, isProcessing, isEnrolling, lastEnrollmentTime, enrollmentProgress, onAuthFailure]);

  // Handle face authentication
  const handleAuthentication = async (faceDescriptor: Float32Array) => {
    try {
      console.log('Sending authentication request:', { descriptorLength: faceDescriptor.length });
      
      const response = await fetch('/api/auth/face', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          faceDescriptor: Array.from(faceDescriptor),
        }),
        credentials: 'include',
      });

      console.log('Authentication response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('Authentication response:', result);
        const { userId } = result;
        onAuthSuccess(userId);
      } else {
        const error = await response.text();
        console.error('Authentication error:', error);
        onAuthFailure(error || 'Authentication failed');
      }
    } catch (error) {
      console.error('Authentication request failed:', error);
      onAuthFailure('Authentication request failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle face enrollment
  const handleEnrollment = async (faceDescriptor: Float32Array) => {
    try {
      const currentProgress = enrollmentProgress + 1;
      console.log('Sending enrollment request:', { progress: currentProgress, descriptorLength: faceDescriptor.length });
      
      const response = await fetch('/api/auth/enroll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          faceDescriptor: Array.from(faceDescriptor),
          progress: currentProgress,
        }),
        credentials: 'include',
      });

      console.log('Enrollment response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('Enrollment response:', result);
        
        const { userId } = result;
        setEnrollmentProgress(currentProgress);
        setLastEnrollmentTime(Date.now());

        if (currentProgress >= 5) {
          console.log('Enrollment completed successfully');
          setProcessingMessage('Enrollment completed!');
          setTimeout(() => {
            onEnrollmentSuccess(userId);
          }, 1000);
        } else {
          console.log(`Enrollment progress: ${currentProgress}/5`);
          setProcessingMessage(`Image ${currentProgress} captured successfully!`);
          // Reset processing state immediately to allow next capture
          setTimeout(() => {
            setIsProcessing(false);
            setProcessingMessage('');
          }, 1500);
        }
      } else {
        const error = await response.text();
        console.error('Enrollment error:', error);
        onEnrollmentFailure(error || 'Enrollment failed');
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Enrollment request failed:', error);
      onEnrollmentFailure('Enrollment request failed');
      setIsProcessing(false);
    }
  };

  // Start processing frames
  useEffect(() => {
    if (!isLoading && modelsLoaded && videoStarted) {
      console.log('Starting frame processing...');
      const interval = setInterval(processFrame, 100);
      return () => clearInterval(interval);
    }
  }, [isLoading, modelsLoaded, videoStarted, enrollmentProgress, processFrame]);

  return (
    <div className="relative">
      {/* Video Container */}
      <div className="relative w-full max-w-md mx-auto">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-auto face-camera"
        />
        
        {/* Canvas overlay for face detection visualization */}
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full face-overlay"
        />

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
              <p>{!modelsLoaded ? 'Loading face recognition models...' : 'Loading camera...'}</p>
            </div>
          </div>
        )}

        {/* Face detection indicator */}
        {!isLoading && faceDetected && (
          <div className="face-detected-indicator">
            ✓ Face Detected
          </div>
        )}

        {/* Processing overlay - only show when actually processing */}
        {isProcessing && processingMessage && (
          <div className="absolute inset-0 processing-overlay flex items-center justify-center rounded-lg">
            <div className="text-center text-white bg-black bg-opacity-70 px-4 py-3 rounded-lg">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto mb-2"></div>
              <p className="text-sm">{processingMessage}</p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="mt-4 flex justify-center space-x-4">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Cancel
        </button>
      </div>

      {/* Enrollment Progress */}
      {isEnrolling && enrollmentProgress > 0 && (
        <div className="mt-4">
          <div className="bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(enrollmentProgress / 5) * 100}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-2 text-center">
            {enrollmentProgress}/5 images captured
          </p>
        </div>
      )}
    </div>
  );
} 