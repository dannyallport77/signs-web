import { NextResponse } from 'next/server';
import { socialMediaTypeService } from '@/lib/services/socialMediaTypeService';

/**
 * GET /api/social-media-types
 * Returns all available social media types (review platforms, social media, promotions, etc.)
 * 
 * Query params:
 * - category: filter by category (review_platform, social_media, promotion, other)
 * - includeInactive: include deactivated types (default: false)
 * - grouped: return grouped by category (default: false)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const grouped = searchParams.get('grouped') === 'true';

    if (grouped) {
      const groupedTypes = await socialMediaTypeService.getGroupedByCategory();
      return NextResponse.json({ success: true, data: groupedTypes });
    }

    const types = await socialMediaTypeService.getAll({
      category: category || undefined,
      activeOnly: !includeInactive,
    });

    return NextResponse.json({ success: true, data: types });
  } catch (error) {
    console.error('Error fetching social media types:', error);
    return NextResponse.json(
      { error: 'Failed to fetch social media types' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/social-media-types
 * Create a new social media type
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { key, name, category, iconUrl, colorHex, sortOrder } = body;

    if (!key || !name || !category) {
      return NextResponse.json(
        { error: 'key, name, and category are required' },
        { status: 400 }
      );
    }

    const validCategories = ['review_platform', 'social_media', 'promotion', 'other'];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: `category must be one of: ${validCategories.join(', ')}` },
        { status: 400 }
      );
    }

    const type = await socialMediaTypeService.create({
      key,
      name,
      category,
      iconUrl,
      colorHex,
      sortOrder,
    });

    return NextResponse.json({ success: true, data: type }, { status: 201 });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json(
        { error: 'A social media type with this key already exists' },
        { status: 409 }
      );
    }
    console.error('Error creating social media type:', error);
    return NextResponse.json(
      { error: 'Failed to create social media type' },
      { status: 500 }
    );
  }
}
