'use client';

import { useState, useEffect } from 'react';

export default function DebugPage() {
  const [modelStatus, setModelStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [modelTestResult, setModelTestResult] = useState<string>('');
  const [testingModels, setTestingModels] = useState(false);

  const checkModels = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/debug/models');
      const data = await response.json();
      setModelStatus(data);
    } catch (error) {
      console.error('Failed to check models:', error);
      setModelStatus({ error: 'Failed to check models' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkModels();
  }, []);

  const testModelLoading = async () => {
    setTestingModels(true);
    setModelTestResult('');
    
    try {
      // Test if face-api.js is available
      const faceapi = await import('face-api.js');
      setModelTestResult('face-api.js loaded successfully\n');
      
      // Test model loading
      setModelTestResult(prev => prev + 'Testing model loading...\n');
      
      const startTime = Date.now();
      await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
      const endTime = Date.now();
      
      setModelTestResult(prev => prev + `TinyFaceDetector loaded in ${endTime - startTime}ms\n`);
      
      setModelTestResult(prev => prev + 'All tests passed!');
    } catch (error) {
      setModelTestResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setTestingModels(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Debug Information</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Model Status</h2>
          {loading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
              <span>Checking models...</span>
            </div>
          ) : modelStatus ? (
            <div>
              <div className="mb-4">
                <p><strong>Total Files:</strong> {modelStatus.totalFiles}</p>
                <p><strong>Accessible Files:</strong> {modelStatus.accessibleFiles}</p>
              </div>
              
              <div className="space-y-2">
                {modelStatus.models?.map((model: any, index: number) => (
                  <div key={index} className={`p-3 rounded border ${
                    model.accessible ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                  }`}>
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-sm">{model.file}</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        model.accessible ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                      }`}>
                        {model.accessible ? 'OK' : 'FAILED'}
                      </span>
                    </div>
                    {model.accessible && (
                      <p className="text-xs text-gray-600 mt-1">
                        Size: {(model.size / 1024).toFixed(1)} KB
                      </p>
                    )}
                    {model.error && (
                      <p className="text-xs text-red-600 mt-1">
                        Error: {model.error}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-gray-600">No model status available</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Environment Info</h2>
          <div className="space-y-2 text-sm">
            <p><strong>User Agent:</strong> {navigator.userAgent}</p>
            <p><strong>Platform:</strong> {navigator.platform}</p>
            <p><strong>Language:</strong> {navigator.language}</p>
            <p><strong>Online:</strong> {navigator.onLine ? 'Yes' : 'No'}</p>
            <p><strong>Cookie Enabled:</strong> {navigator.cookieEnabled ? 'Yes' : 'No'}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Model Loading Test</h2>
          <button
            onClick={testModelLoading}
            disabled={testingModels}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {testingModels ? 'Testing...' : 'Test Model Loading'}
          </button>
          
          {modelTestResult && (
            <div className="mt-4 p-4 bg-gray-100 rounded">
              <h3 className="font-semibold mb-2">Test Results:</h3>
              <pre className="text-sm whitespace-pre-wrap">{modelTestResult}</pre>
            </div>
          )}
        </div>

        <div className="mt-6 space-x-4">
          <button
            onClick={checkModels}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Refresh Model Status
          </button>
        </div>
      </div>
    </div>
  );
} 