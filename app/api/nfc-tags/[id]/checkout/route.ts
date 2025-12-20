import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { nfcTagService } from '@/lib/services/nfcTagService';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
});

const PAYMENT_PRICE_PENCE = 3000; // £30.00 in pence

/**
 * POST /api/nfc-tags/[id]/checkout
 * Create a Stripe checkout session for tag payment
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get tag details
    const status = await nfcTagService.getTrialStatus(id);
    
    if (!status.found) {
      return NextResponse.json(
        { error: 'Tag not found' },
        { status: 404 }
      );
    }

    if (status.isPaid) {
      return NextResponse.json(
        { error: 'Tag is already paid' },
        { status: 400 }
      );
    }

    const tag = status.tag!;
    
    // Get the base URL for success/cancel
    const origin = request.headers.get('origin') || process.env.NEXTAUTH_URL || 'http://localhost:3000';

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: 'NFC Sign Activation',
              description: `Activate NFC sign for ${tag.businessName}`,
              metadata: {
                tagId: tag.id,
                tagUid: tag.tagUid || '',
                businessName: tag.businessName,
                placeId: tag.placeId,
              },
            },
            unit_amount: PAYMENT_PRICE_PENCE,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/tag-payment/success?session_id={CHECKOUT_SESSION_ID}&tag_id=${tag.id}`,
      cancel_url: `${origin}/tag-payment/cancelled?tag_id=${tag.id}`,
      metadata: {
        tagId: tag.id,
        tagUid: tag.tagUid || '',
        businessName: tag.businessName,
        placeId: tag.placeId,
      },
    });

    return NextResponse.json({
      success: true,
      checkoutUrl: session.url,
      sessionId: session.id,
    });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
