#!/bin/bash
vercel env add EMAIL_HOST < <(echo "smtp.resend.com")
vercel env add EMAIL_PORT < <(echo "587")
vercel env add EMAIL_SECURE < <(echo "false")
vercel env add EMAIL_USER < <(echo "resend")
vercel env add EMAIL_FROM < <(echo "invoices@www.review-signs.co.uk")
echo "Environment variables added. Now add EMAIL_PASSWORD manually with your Resend API key:"
echo "vercel env add EMAIL_PASSWORD"
