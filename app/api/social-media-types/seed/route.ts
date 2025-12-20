import { NextResponse } from 'next/server';
import { socialMediaTypeService } from '@/lib/services/socialMediaTypeService';

/**
 * POST /api/social-media-types/seed
 * Seeds the default social media types into the database
 * Safe to call multiple times - only creates missing types
 */
export async function POST() {
  try {
    const types = await socialMediaTypeService.seedDefaults();
    
    return NextResponse.json({
      success: true,
      message: 'Social media types seeded successfully',
      data: types,
    });
  } catch (error) {
    console.error('Error seeding social media types:', error);
    return NextResponse.json(
      { error: 'Failed to seed social media types' },
      { status: 500 }
    );
  }
}
