import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'Signs App API',
    version: '1.0.0',
    status: 'operational',
    timestamp: new Date().toISOString(),
  });
}
