# Stripe Webhook Configuration Guide

## Overview
This guide explains how to configure Stripe webhooks to notify your application of payment events.

## Prerequisites
- Stripe account (free tier works for testing)
- Your app deployed or tunnel for local testing (see Local Testing section)
- `STRIPE_WEBHOOK_SECRET` already configured in `.env.local`

## Configuration Steps

### 1. Get Your Webhook Secret

Your webhook secret is already in `.env.local`:
```
STRIPE_WEBHOOK_SECRET="whsec_8YJxF01lJOebruKYv77jykcYoDMloFn9"
```

This is used to verify that webhook events actually come from Stripe.

### 2. Configure Webhook Endpoint in Stripe Dashboard

**For Production:**

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Developers** → **Webhooks**
3. Click **Add an endpoint**
4. Enter your webhook URL:
   ```
   https://your-production-domain.com/api/webhooks/stripe
   ```
   - Replace `your-production-domain.com` with your actual domain (e.g., `app.review-signs.co.uk`)
   - If deployed on Vercel: `https://your-app.vercel.app/api/webhooks/stripe`
   - If deployed on Railway: `https://your-app.railway.app/api/webhooks/stripe`

5. Select **Events to send**:
   - ✅ `checkout.session.completed`
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`

6. Click **Add endpoint**
7. You'll see a signing secret - verify it matches your `STRIPE_WEBHOOK_SECRET`

### 3. Local Testing with Tunnel

To test webhooks locally, you need to expose your local server to the internet:

**Option A: Using ngrok (Recommended)**
```bash
# Install ngrok
brew install ngrok

# Start ngrok tunnel to your local server
ngrok http 3000

# You'll get a URL like: https://abc123.ngrok.io
```

**Option B: Using Stripe CLI (Best for Stripe)**
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to your account
stripe login

# Forward events to your local webhook
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# You'll see a signing secret - use this in .env.local as STRIPE_WEBHOOK_SECRET
```

### 4. Test Webhook

**Using Stripe Dashboard:**
1. Go to **Developers** → **Webhooks**
2. Find your endpoint
3. Click **Send test webhook**
4. Select `checkout.session.completed` event
5. Click **Send event**
6. Check your server logs to see the webhook received

**Using Stripe CLI:**
```bash
# After running `stripe listen`, in another terminal:
stripe trigger checkout.session.completed
```

## Webhook Handler

The webhook handler is located at:
```
/app/api/webhooks/stripe/route.ts
```

### What It Does:
1. **Verifies the webhook signature** - ensures it actually came from Stripe
2. **Handles checkout completion** - marks the tag as paid
3. **Handles payment successes/failures** - logs for monitoring

### Current Event Handlers:
- `checkout.session.completed` - Updates tag payment status
- `payment_intent.succeeded` - Logs successful payment
- `payment_intent.payment_failed` - Logs failed payment

## Verification Endpoint

A verification endpoint is available at:
```
POST /api/nfc-tags/[id]/verify-payment
```

**Request:**
```json
{
  "sessionId": "cs_test_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0"
}
```

**Response:**
```json
{
  "verified": true,
  "sessionId": "cs_test_...",
  "paymentStatus": "paid",
  "amount": "30.00"
}
```

This endpoint is called by the success page to verify payment immediately.

## Environment Variables

**Development (.env.local):**
```env
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

**Production (.env.production or deployment platform):**
```env
STRIPE_SECRET_KEY="sk_live_..."  # Live secret key (different from test)
STRIPE_WEBHOOK_SECRET="whsec_..."  # Live webhook secret
```

⚠️ **Important**: Never use test keys in production!

## Troubleshooting

### "Webhook signature verification failed"
- Verify `STRIPE_WEBHOOK_SECRET` is correct
- Check that the webhook secret hasn't been regenerated
- Ensure the raw request body is being used (not parsed JSON)

### Webhook not being delivered
- Check that your endpoint URL is publicly accessible
- Verify the endpoint returns a 2xx status code
- Check Stripe Dashboard Webhook logs for delivery failures

### Event not triggering payment update
- Check server logs for webhook delivery
- Verify the `tagId` is in the session metadata
- Ensure `nfcTagService.markAsPaid()` is working

## Flow Diagram

```
User clicks "Complete Payment"
        ↓
Stripe Checkout Session Created
        ↓
Redirect to Stripe Hosted Checkout
        ↓
User completes payment
        ↓
Stripe processes payment
        ↓
Webhook: checkout.session.completed
        ↓
Backend: Mark tag as paid
        ↓
Redirect to /tag-payment/success
        ↓
Success page verifies payment
        ↓
Display confirmation
```

## API Testing Checklist

- [ ] Checkout endpoint creates session: `POST /api/nfc-tags/[id]/checkout`
- [ ] Success page appears after payment: `/tag-payment/success`
- [ ] Webhook logs show events: Check server console
- [ ] Tag marked as paid in database
- [ ] Cancelled page works: `/tag-payment/cancelled`
- [ ] Webhook delivery shows in Stripe Dashboard

## Next Steps

1. Deploy your app to production
2. Configure webhook endpoint with production URL
3. Use live API keys (`sk_live_...`)
4. Test with real Stripe account
5. Monitor webhook deliveries in Dashboard

## Support

For issues with Stripe webhooks:
- [Stripe Webhooks Documentation](https://stripe.com/docs/webhooks)
- [Stripe Dashboard Webhooks](https://dashboard.stripe.com/webhooks)
- [Stripe CLI Guide](https://stripe.com/docs/stripe-cli)
