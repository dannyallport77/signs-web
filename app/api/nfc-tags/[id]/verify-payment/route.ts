import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { nfcTagService } from '@/lib/services/nfcTagService';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
});

/**
 * POST /api/nfc-tags/[id]/verify-payment
 * Verify a Stripe payment session
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Retrieve the Stripe session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Check if payment was successful
    const isSuccessful = session.payment_status === 'paid';

    if (isSuccessful) {
      // Mark tag as paid if webhook hasn't processed it yet
      const status = await nfcTagService.getTrialStatus(id);
      if (status.found && !status.isPaid) {
        await nfcTagService.markAsPaid({
          tagId: id,
          paymentId: session.id,
          paymentAmount: (session.amount_total || 3000) / 100,
        });
      }
    }

    return NextResponse.json({
      verified: isSuccessful,
      sessionId: session.id,
      paymentStatus: session.payment_status,
      amount: session.amount_total ? (session.amount_total / 100).toFixed(2) : null,
    });
  } catch (error: any) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    );
  }
}
