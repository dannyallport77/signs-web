import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Get a specific preprogrammed tag by ID or slug
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Try to find by ID, slug, or tagUid
    const tag = await prisma.preprogrammedTag.findFirst({
      where: {
        OR: [
          { id },
          { slug: id },
          { tagUid: id }
        ]
      },
      include: {
        _count: {
          select: { scans: true }
        }
      }
    });

    if (!tag) {
      return NextResponse.json(
        { error: 'Tag not found' },
        { status: 404 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://review-signs.co.uk';

    return NextResponse.json({ 
      success: true, 
      data: {
        ...tag,
        redirectUrl: `${baseUrl}/p/${tag.slug}`,
        scanCount: tag._count.scans
      }
    });
  } catch (error) {
    console.error('Error fetching preprogrammed tag:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preprogrammed tag' },
      { status: 500 }
    );
  }
}

// PATCH - Link a preprogrammed tag to a business
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { 
      businessName, 
      businessAddress, 
      placeId, 
      targetUrl,
      linkedBy,
      status 
    } = body;

    // Find the tag
    const existingTag = await prisma.preprogrammedTag.findFirst({
      where: {
        OR: [
          { id },
          { slug: id },
          { tagUid: id }
        ]
      }
    });

    if (!existingTag) {
      return NextResponse.json(
        { error: 'Tag not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {};
    
    // If linking to a business
    if (businessName || placeId || targetUrl) {
      updateData.status = 'linked';
      updateData.linkedAt = new Date();
      if (linkedBy) updateData.linkedBy = linkedBy;
      if (businessName) updateData.businessName = businessName;
      if (businessAddress) updateData.businessAddress = businessAddress;
      if (placeId) updateData.placeId = placeId;
      if (targetUrl) updateData.targetUrl = targetUrl;
    }
    
    // If just updating status
    if (status) {
      updateData.status = status;
      if (status === 'unlinked') {
        // Clear business data when unlinking
        updateData.businessName = null;
        updateData.businessAddress = null;
        updateData.placeId = null;
        updateData.targetUrl = null;
        updateData.linkedAt = null;
        updateData.linkedBy = null;
      }
    }

    const tag = await prisma.preprogrammedTag.update({
      where: { id: existingTag.id },
      data: updateData,
      include: {
        _count: {
          select: { scans: true }
        }
      }
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://review-signs.co.uk';

    return NextResponse.json({ 
      success: true, 
      data: {
        ...tag,
        redirectUrl: `${baseUrl}/p/${tag.slug}`,
        scanCount: tag._count.scans
      }
    });
  } catch (error) {
    console.error('Error updating preprogrammed tag:', error);
    return NextResponse.json(
      { error: 'Failed to update preprogrammed tag' },
      { status: 500 }
    );
  }
}

// DELETE - Deactivate/delete a preprogrammed tag
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    const existingTag = await prisma.preprogrammedTag.findFirst({
      where: {
        OR: [
          { id },
          { slug: id },
          { tagUid: id }
        ]
      }
    });

    if (!existingTag) {
      return NextResponse.json(
        { error: 'Tag not found' },
        { status: 404 }
      );
    }

    // Soft delete - just deactivate
    await prisma.preprogrammedTag.update({
      where: { id: existingTag.id },
      data: { status: 'deactivated' }
    });

    return NextResponse.json({ success: true, message: 'Tag deactivated' });
  } catch (error) {
    console.error('Error deactivating preprogrammed tag:', error);
    return NextResponse.json(
      { error: 'Failed to deactivate preprogrammed tag' },
      { status: 500 }
    );
  }
}
