import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Test if we can access the models directory
    const modelUrls = [
      '/models/tiny_face_detector_model-shard1',
      '/models/tiny_face_detector_model-weights_manifest.json',
      '/models/face_landmark_68_model-shard1',
      '/models/face_landmark_68_model-weights_manifest.json',
      '/models/face_recognition_model-shard1',
      '/models/face_recognition_model-shard2',
      '/models/face_recognition_model-weights_manifest.json'
    ];

    const results = [];

    for (const url of modelUrls) {
      try {
        const response = await fetch(`${request.nextUrl.origin}${url}`);
        results.push({
          url,
          accessible: response.ok,
          status: response.status,
          size: response.headers.get('content-length')
        });
      } catch (error) {
        results.push({
          url,
          accessible: false,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      models: results,
      totalFiles: modelUrls.length,
      accessibleFiles: results.filter(r => r.accessible).length,
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Model test error:', error);
    return NextResponse.json(
      { error: 'Failed to test models' },
      { status: 500 }
    );
  }
} 