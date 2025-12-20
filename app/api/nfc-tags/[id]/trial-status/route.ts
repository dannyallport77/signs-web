import { NextResponse } from 'next/server';
import { nfcTagService } from '@/lib/services/nfcTagService';

/**
 * GET /api/nfc-tags/[id]/trial-status
 * Check the trial/payment status of a tag
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const status = await nfcTagService.getTrialStatus(id);

    if (!status.found) {
      return NextResponse.json(
        { error: 'Tag not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(status);
  } catch (error) {
    console.error('Error fetching trial status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trial status' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/nfc-tags/[id]/trial-status
 * Update the sale price (convert from trial)
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { salePrice } = body;

    if (salePrice === undefined || salePrice === null) {
      return NextResponse.json(
        { error: 'salePrice is required' },
        { status: 400 }
      );
    }

    const tag = await nfcTagService.updateSalePrice(id, salePrice);

    return NextResponse.json({
      success: true,
      tag,
    });
  } catch (error: any) {
    console.error('Error updating sale price:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update sale price' },
      { status: 500 }
    );
  }
}
