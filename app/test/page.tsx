'use client';

import { useState, useEffect } from 'react';
import * as faceapi from 'face-api.js';

export default function TestPage() {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  // Load debug info
  useEffect(() => {
    loadDebugInfo();
  }, []);

  const loadDebugInfo = async () => {
    try {
      const response = await fetch('/api/debug');
      if (response.ok) {
        const data = await response.json();
        setDebugInfo(data);
      }
    } catch (error) {
      console.error('Failed to load debug info:', error);
    }
  };

  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      try {
        setLoading(true);
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
        await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
        await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
        setModelsLoaded(true);
      } catch (error) {
        console.error('Failed to load models:', error);
      } finally {
        setLoading(false);
      }
    };

    loadModels();
  }, []);

  // Test face recognition
  const testFaceRecognition = async () => {
    if (!videoRef || !modelsLoaded) return;

    try {
      setLoading(true);
      
      const detections = await faceapi
        .detectAllFaces(videoRef, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptors();

      if (detections.length === 0) {
        alert('No face detected');
        return;
      }

      const faceDescriptor = Array.from(detections[0].descriptor);
      
      // Test with sample mode first
      const sampleResponse = await fetch('/api/debug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          faceDescriptor,
          testMode: 'sample'
        }),
      });

      if (sampleResponse.ok) {
        const sampleResult = await sampleResponse.json();
        console.log('Sample test result:', sampleResult);
        
        if (sampleResult.distance !== undefined) {
          alert(`Sample test: Distance=${sampleResult.distance}, Threshold=0.6, Match=${sampleResult.isMatch}\nUser: ${sampleResult.user?.name || 'None'}`);
        }
      }
      
      // Test actual face matching
      const response = await fetch('/api/debug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ faceDescriptor }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Face recognition test: ${result.userFound ? 'User found' : 'No user found'}\nUser: ${result.user?.name || 'None'}`);
      }
    } catch (error) {
      console.error('Face recognition test failed:', error);
      alert('Face recognition test failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Face Recognition Debug</h1>
        
        {/* Debug Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">System Info</h2>
          {debugInfo ? (
            <div className="space-y-4">
              <div>
                <strong>Total Users:</strong> {debugInfo.totalUsers}
              </div>
              <div>
                <strong>Current User:</strong> {debugInfo.currentUser?.name || 'None'}
              </div>
              <div>
                <strong>Users:</strong>
                <ul className="mt-2 space-y-1">
                  {debugInfo.users.map((user: any) => (
                    <li key={user.id} className="text-sm">
                      {user.name} (ID: {user.id}) - {user.descriptorCount} descriptors
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <p>Loading debug info...</p>
          )}
        </div>

        {/* Face Recognition Test */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Face Recognition Test</h2>
          
          <div className="mb-4">
            <video
              ref={setVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full max-w-md h-auto border rounded"
            />
          </div>

          <div className="space-y-4">
            <div>
              <strong>Models Loaded:</strong> {modelsLoaded ? 'Yes' : 'No'}
            </div>
            
            <button
              onClick={testFaceRecognition}
              disabled={!modelsLoaded || loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test Face Recognition'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 