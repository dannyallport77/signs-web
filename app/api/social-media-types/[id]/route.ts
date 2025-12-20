import { NextResponse } from 'next/server';
import { socialMediaTypeService } from '@/lib/services/socialMediaTypeService';

/**
 * GET /api/social-media-types/[id]
 * Get a specific social media type
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const type = await socialMediaTypeService.getById(id);

    if (!type) {
      return NextResponse.json(
        { error: 'Social media type not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: type });
  } catch (error) {
    console.error('Error fetching social media type:', error);
    return NextResponse.json(
      { error: 'Failed to fetch social media type' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/social-media-types/[id]
 * Update a social media type
 * Note: The 'key' cannot be changed to preserve historical references
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, category, iconUrl, colorHex, sortOrder } = body;

    const type = await socialMediaTypeService.update(id, {
      name,
      category,
      iconUrl,
      colorHex,
      sortOrder,
    });

    return NextResponse.json({ success: true, data: type });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return NextResponse.json(
        { error: 'Social media type not found' },
        { status: 404 }
      );
    }
    console.error('Error updating social media type:', error);
    return NextResponse.json(
      { error: 'Failed to update social media type' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/social-media-types/[id]
 * Soft delete (deactivate) a social media type
 * NOTE: This does NOT actually delete the record - it sets isActive=false
 * This preserves historical data integrity
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const type = await socialMediaTypeService.deactivate(id);

    return NextResponse.json({
      success: true,
      data: type,
      message: 'Social media type deactivated (soft delete). Historical records preserved.',
    });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return NextResponse.json(
        { error: 'Social media type not found' },
        { status: 404 }
      );
    }
    console.error('Error deactivating social media type:', error);
    return NextResponse.json(
      { error: 'Failed to deactivate social media type' },
      { status: 500 }
    );
  }
}
