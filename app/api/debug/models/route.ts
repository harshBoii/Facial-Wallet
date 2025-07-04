import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const modelFiles = [
      'tiny_face_detector_model-shard1',
      'tiny_face_detector_model-weights_manifest.json',
      'face_landmark_68_model-shard1',
      'face_landmark_68_model-weights_manifest.json',
      'face_recognition_model-shard1',
      'face_recognition_model-shard2',
      'face_recognition_model-weights_manifest.json'
    ];

    const results = [];

    for (const file of modelFiles) {
      try {
        const filePath = path.join(process.cwd(), 'public', 'models', file);
        const exists = fs.existsSync(filePath);
        const stats = exists ? fs.statSync(filePath) : null;
        
        results.push({
          file,
          exists,
          size: stats ? stats.size : 0,
          accessible: exists
        });
      } catch (error) {
        results.push({
          file,
          exists: false,
          size: 0,
          accessible: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      models: results,
      totalFiles: modelFiles.length,
      accessibleFiles: results.filter(r => r.accessible).length
    });
  } catch (error) {
    console.error('Model debug error:', error);
    return NextResponse.json(
      { error: 'Failed to check models' },
      { status: 500 }
    );
  }
} 