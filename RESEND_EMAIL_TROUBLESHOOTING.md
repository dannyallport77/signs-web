# Resend Email Troubleshooting Guide

## Password Reset Emails Not Being Received

This guide helps troubleshoot why password reset emails aren't reaching recipients when using Resend.

### Step 1: Verify Resend Configuration

1. **Check API Key is Active**
   - Go to: https://resend.com/api-keys
   - Verify that `RESEND_API_KEY` in `.env.local` matches an active key
   - Current key: `re_cksGdBDr_6bN5KkKAbCsSWm9uUc2NWzcc`
   - If the key is inactive or doesn't match, create a new one

2. **Verify Sender Email Domain**
   - Go to: https://resend.com/domains
   - Verify that `info@review-signs.co.uk` is added and verified
   - If not verified, add it and complete DNS verification:
     - Copy the DNS records provided by Resend
     - Add them to your domain's DNS settings (GoDaddy, Namecheap, etc.)
     - Wait for DNS propagation (5-30 minutes)
   - Current sender: `info@review-signs.co.uk` (set in `.env.local`)

3. **Check Environment Variables**
   ```
   RESEND_API_KEY=re_cksGdBDr_6bN5KkKAbCsSWm9uUc2NWzcc
   RESEND_FROM_EMAIL=info@review-signs.co.uk
   NEXT_PUBLIC_APP_URL=http://localhost:3000  (for development)
   ```

### Step 2: Test Email Sending

1. **Manual API Test**
   ```bash
   curl -X POST "https://api.resend.com/emails" \
     -H "Authorization: Bearer re_cksGdBDr_6bN5KkKAbCsSWm9uUc2NWzcc" \
     -H "Content-Type: application/json" \
     -d '{
       "from": "info@review-signs.co.uk",
       "to": "your-test-email@example.com",
       "subject": "Test Email",
       "html": "<p>This is a test email from Resend</p>"
     }'
   ```

2. **Test via Password Reset UI**
   - Navigate to: http://localhost:3000/auth/forgot-password
   - Enter a valid email address from your app's database
   - Click "Send Reset Link"
   - Check spam/junk folder for the email
   - Look in Resend dashboard for delivery status

### Step 3: Check Resend Dashboard

1. **View Email Logs**
   - Go to: https://resend.com/emails
   - Look for recent sends in the logs
   - Check status: `Sent`, `Delivered`, `Bounced`, `Failed`

2. **Common Failure Reasons**
   - **Invalid API Key**: Key doesn't exist or is inactive
   - **Domain Not Verified**: Sender email domain not added to Resend
   - **Recipient Bounced**: Email address doesn't exist or is on suppression list
   - **Rate Limit**: Too many emails in short time period
   - **Invalid HTML**: Malformed HTML in email content

### Step 4: Debug Logs

1. **Check Server Logs**
   - Look for errors in the Next.js dev server output
   - The forgot-password endpoint logs errors as: `console.error("Resend email error:", error)`
   - Common errors:
     ```
     Error: Invalid API key
     Error: Domain not verified
     Error: Invalid recipient address
     ```

2. **Enable Debug Logging**
   - Update `app/api/auth/forgot-password/route.ts` to log the Resend response:
     ```typescript
     const response = await resend.emails.send({...});
     console.log("Resend response:", response);
     ```

### Step 5: Fix Common Issues

#### Issue: "Invalid API Key"
- **Solution**: Verify API key at https://resend.com/api-keys
- Create a new key if needed and update `.env.local`

#### Issue: "Domain not verified"
- **Solution**: Add and verify your domain
  1. Go to https://resend.com/domains
  2. Click "Add Domain"
  3. Enter: `review-signs.co.uk`
  4. Copy DNS records
  5. Add to your domain registrar's DNS settings
  6. Wait for verification (usually 5-30 minutes)

#### Issue: "Recipient address rejected"
- **Solution**: Check if email is in Resend's suppression list
  1. Go to https://resend.com/suppressions
  2. Check if the recipient email is listed
  3. Remove if needed or test with a different email

#### Issue: Email arrives in spam folder
- **Solution**: Improve email deliverability
  1. Ensure domain is verified with Resend
  2. Add SPF, DKIM, and DMARC records to your domain
  3. Use a professional email address in the sender field
  4. Avoid spammy content in the email template

### Step 6: Production Deployment

For production, ensure these environment variables are set:

```env
RESEND_API_KEY=your_production_api_key
RESEND_FROM_EMAIL=noreply@review-signs.co.uk
NEXT_PUBLIC_APP_URL=https://your-production-url.com
```

**For Railway Deployment:**
1. Go to your Railway project
2. Select the web service
3. Go to "Variables"
4. Add/update:
   - `RESEND_API_KEY`
   - `RESEND_FROM_EMAIL`
   - `NEXT_PUBLIC_APP_URL`

**For Vercel Deployment:**
1. Go to your Vercel project settings
2. Click "Environment Variables"
3. Add/update the above variables
4. Redeploy

### Step 7: Testing Checklist

- [ ] API key is active in Resend dashboard
- [ ] Sender email domain is verified in Resend
- [ ] Environment variables are set correctly
- [ ] Test email sends successfully via API
- [ ] Email arrives in inbox (not spam)
- [ ] Password reset link in email works
- [ ] Clicking link navigates to reset-password page
- [ ] Resetting password updates the database
- [ ] Can login with new password

### Additional Resources

- **Resend Documentation**: https://resend.com/docs
- **Resend Status**: https://resend.statuspage.io
- **API Reference**: https://resend.com/docs/api-reference/emails

### Contact Support

If you're still experiencing issues:
1. Check https://resend.statuspage.io for service status
2. Visit Resend dashboard for detailed error messages
3. Contact Resend support: https://resend.com/support
