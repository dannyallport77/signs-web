# Password Reset Configuration Guide

## Overview

Password reset functionality has been added to both the web and mobile apps. Users can now securely reset their passwords through an email-based reset flow.

## Features

### Web App
- **Login Page**: Added "Forgot Password?" link
- **Forgot Password Page**: Email entry form at `/auth/forgot-password`
- **Reset Password Page**: Password entry form at `/auth/reset-password?token=...&email=...`

### Mobile App
- **Login Screen**: Added "Forgot Password?" link
- **Email Prompt**: Users enter email address to request reset
- **Email Link**: Users receive reset link via email

## Setup Instructions

### 1. Environment Variables (Web App)

Add these to your `.env.local`:

```env
# Email Configuration (using Resend)
RESEND_API_KEY=your-resend-api-key
RESEND_FROM_EMAIL=noreply@yourdomain.com  # Default: noreply@review-signs.co.uk
NEXT_PUBLIC_APP_URL=http://localhost:3000  # or your production URL
```

### 2. Get Resend API Key

1. Go to [Resend](https://resend.com)
2. Sign up / Log in
3. Go to API Keys section
4. Create new API key
5. Copy the key and add to `.env.local`

### 3. Configure Sender Email

The sender email should be:
- A domain you own
- Or use the default `noreply@review-signs.co.uk`
- Must be verified in Resend dashboard

Add these fields to the User model in `prisma/schema.prisma`:

```prisma
model User {
  // ... existing fields ...
  
  // Password reset
  passwordResetToken    String?       @unique
  passwordResetExpires  DateTime?
  
  // ... rest of fields ...
}
```

Then run:
```bash
npx prisma migrate dev --name add_password_reset_fields
```

## Password Reset Flow

### Web App Flow

```
1. User on login page
   ↓
2. Clicks "Forgot Password?"
   ↓
3. Redirected to /auth/forgot-password
   ↓
4. Enters email address
   ↓
5. POST /api/auth/forgot-password
   - Validates email exists
   - Generates reset token
   - Stores token in database
   - Sends email with reset link
   ↓
6. User receives email
   ↓
7. Clicks reset link in email
   ↓
8. Redirected to /auth/reset-password?token=XXX&email=user@example.com
   ↓
9. Enters new password
   ↓
10. POST /api/auth/reset-password
    - Validates token
    - Checks token expiry (1 hour)
    - Hashes new password
    - Updates database
    - Clears reset token
    ↓
11. Shows success message
   ↓
12. Redirected to login page
```

### Mobile App Flow

```
1. User on login screen
   ↓
2. Taps "Forgot Password?"
   ↓
3. Alert prompt appears for email
   ↓
4. Enters email
   ↓
5. POST /api/auth/forgot-password
   ↓
6. Shows success alert
   ↓
7. User receives email
   ↓
8. Taps link in email (opens Safari)
   ↓
9. Web browser opens reset page
   ↓
10. Completes password reset
```

## Email Template

The reset email includes:

```html
<h2>Password Reset Request</h2>
<p>You requested a password reset for your Signs NFC account.</p>
<p>Click the link below to reset your password (valid for 1 hour):</p>
<a href="[reset-link]">Reset Password</a>
<p>If you didn't request this, you can safely ignore this email.</p>
```

You can customize this template in the API endpoints.

## Security Considerations

1. **Token Expiry**: Reset tokens expire after 1 hour
2. **One-Time Use**: Tokens should be invalidated after use
3. **Email Verification**: Ensures only email account owner can reset password
4. **Password Hashing**: Passwords are hashed with bcrypt (12 rounds)
5. **No User Enumeration**: Same message for valid/invalid emails
6. **HTTPS Only**: Always use HTTPS in production
7. **Secure Token**: Generated using crypto.randomBytes(32)

## Testing

### Test Locally

1. Set up email credentials in `.env.local`
2. Create test user in database:
   ```sql
   INSERT INTO "User" (id, email, password, name, role, active)
   VALUES ('test-user', 'test@example.com', '<hashed-password>', 'Test User', 'admin', true);
   ```

3. Go to `http://localhost:3000/auth/forgot-password`
4. Enter `test@example.com`
5. Check email for reset link
6. Test password reset

### Test on Production

Same as above but use production URL

## Troubleshooting

### Email not sending

**Check 1**: Verify environment variables are set
```bash
# In your deployment platform, confirm:
# - RESEND_API_KEY
# - RESEND_FROM_EMAIL
# - NEXT_PUBLIC_APP_URL
```

**Check 2**: Verify Resend API key is valid
- Go to [Resend Dashboard](https://resend.com)
- Check API key hasn't been revoked
- Generate new key if needed

**Check 3**: Check Resend logs
- Go to [Resend Activity](https://resend.com/activity)
- Look for failed email sends
- Check error messages

### Reset link not working

**Check 1**: Verify token is valid and not expired
```sql
-- Check database
SELECT * FROM "User" WHERE email = 'user@example.com';
-- passwordResetExpires should be in the future
```

**Check 2**: Verify URL format
- Should be: `/auth/reset-password?token=XXX&email=user@example.com`
- Check token is not URL encoded

**Check 3**: Clear browser cache and try again

### Password not updating

**Check 1**: Verify bcrypt is installed
```bash
npm install bcryptjs
```

**Check 2**: Check database for errors
```sql
-- Verify user was updated
SELECT id, email, password, passwordResetToken FROM "User" 
WHERE email = 'user@example.com';
-- passwordResetToken should be null after reset
```

## Future Enhancements

- [ ] Add password strength indicator
- [ ] Implement rate limiting on password reset requests
- [ ] Add password reset history
- [ ] Implement two-factor authentication
- [ ] Add "reset password at next login" for admins
- [ ] Implement password expiration policies
- [ ] Add login attempt tracking
- [ ] Implement password breach checking

## API Reference

### Forgot Password

```bash
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}

Response:
{
  "success": true,
  "message": "If an account exists with this email, you will receive a password reset link"
}
```

### Reset Password

```bash
POST /api/auth/reset-password
Content-Type: application/json

{
  "email": "user@example.com",
  "token": "reset-token-from-email",
  "password": "new-password-123"
}

Response:
{
  "success": true,
  "message": "Password reset successfully"
}
```

## Support

For issues with password reset:

1. Check that environment variables are properly configured
2. Verify email service is working (test send)
3. Check browser console for errors
4. Review server logs for API errors
5. Verify database schema has reset fields

---

**Status**: ✅ Ready for Production
**Last Updated**: January 15, 2025
