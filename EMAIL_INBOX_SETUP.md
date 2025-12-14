# Email Inbox Setup with Resend

Your email inbox system is now installed and ready to receive emails! Here's how to set it up with Resend.

## What's Been Built

✅ **Database Schema**: Email model with fields for storing incoming emails
✅ **API Endpoints**: 
- `GET /api/emails` - List emails with filters (read/unread, search)
- `GET /api/emails/[id]` - Get single email
- `PATCH /api/emails/[id]` - Mark as read, star, or archive
- `DELETE /api/emails/[id]` - Delete email

✅ **Webhook Endpoint**: `POST /api/webhooks/email` - Receives emails from Resend
✅ **Dashboard Page**: `/dashboard/inbox` - Full email client interface
✅ **Navigation**: Inbox link added to dashboard sidebar

## Setting Up Resend

### 1. Create Resend Account
1. Go to https://resend.com and sign up
2. Verify your email address
3. Navigate to **API Keys** and create a new API key

### 2. Configure Your Domain
1. In Resend dashboard, go to **Domains**
2. Add your domain: `review-signs.co.uk`
3. Add the required DNS records (MX, TXT, CNAME) to your domain provider
4. Wait for verification (usually 5-15 minutes)

### 3. Set Up Inbound Email
1. In Resend dashboard, go to **Inbound**
2. Click **Add Inbound Rule**
3. Configure:
   - **From**: `info@review-signs.co.uk` (recommended) or use `*@review-signs.co.uk` if you want to accept multiple addresses
   - **Webhook URL**: `https://your-domain.com/api/webhooks/email`
   - **Events**: Select "email.received"

### 4. Environment Variables
Add to your `.env.local` file:

```bash
# Optional: For webhook signature verification
RESEND_WEBHOOK_SECRET=your_webhook_secret_here
```

### 5. Deploy Webhook Endpoint
Your webhook endpoint is at:
```
https://your-production-domain.com/api/webhooks/email
```

Make sure this is publicly accessible (not localhost) for Resend to send webhooks.

## Testing

### Test Email Reception
1. Send an email to the configured address (e.g., `info@review-signs.co.uk`)
2. Check Resend dashboard → **Logs** to see if webhook was triggered
3. Check your dashboard at `/dashboard/inbox` to see the email

### Test Locally with Ngrok (Optional)
If testing locally:
```bash
ngrok http 3000
```
Use the ngrok URL in Resend webhook configuration:
```
https://your-ngrok-url.ngrok.io/api/webhooks/email
```

## Features

### Email List View
- ✉️ Unread count badge
- 🔍 Search by sender, subject, or body
- 📋 Filter: All / Unread / Starred
- ⭐ Star important emails
- 🗑️ Delete emails

### Email Detail View
- Full email content (HTML or plain text)
- Sender information
- Timestamp
- Mark as read automatically
- Star/unstar toggle
- Delete option

## Resend Pricing
- **Free tier**: 100 emails/day, 3,000/month
- Perfect for admin inbox usage
- Upgrade plans available for higher volume

## Security Notes
- All endpoints require admin authentication
- Webhook endpoint is public (as required by Resend)
- Consider adding webhook signature verification for production
- Emails are stored in your database, not forwarded

## Next Steps
1. Complete domain verification in Resend
2. Configure inbound rule for `info@review-signs.co.uk` with your production webhook URL
3. Test email reception
4. Outbound sending is configured to use `EMAIL_FROM=info@review-signs.co.uk` and the Resend API (`RESEND_API_KEY` required)

## Cleanup (Optional)
- Remove unused SMTP variables from `.env.local` if present:
   - `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_SECURE`, `EMAIL_USER`, `EMAIL_PASSWORD`
- Keep only:
   - `EMAIL_FROM=info@review-signs.co.uk`
   - `RESEND_API_KEY=...`

## Troubleshooting

**Emails not appearing?**
- Check Resend **Logs** for webhook deliveries
- Verify DNS records are properly configured
- Check server logs for webhook errors
- Ensure webhook URL is publicly accessible

**Webhook timing out?**
- Webhook must respond within 30 seconds
- Current implementation responds immediately after database write

Need help? Check Resend docs at https://resend.com/docs
