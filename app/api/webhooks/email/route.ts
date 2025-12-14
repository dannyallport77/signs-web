import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    // Resend webhook payload structure
    const payload = await request.json();
    
    // Verify webhook signature (optional but recommended)
    const signature = request.headers.get('svix-signature');
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
    
    if (webhookSecret && signature) {
      // Add signature verification here if needed
      // For now, we'll accept all requests in development
    }

    // Resend sends email data in the following format
    const { type, data } = payload;

    if (type === 'email.received') {
      const {
        from,
        to,
        subject,
        text,
        html,
        headers,
        attachments,
      } = data;

      // Parse from address (can be "Name <email@example.com>" or just "email@example.com")
      let fromEmail = from;
      let fromName = null;
      
      const fromMatch = from.match(/(.*?)\s*<(.+?)>/);
      if (fromMatch) {
        fromName = fromMatch[1].trim();
        fromEmail = fromMatch[2].trim();
      }

      // Store email in database
      const email = await prisma.email.create({
        data: {
          from: fromEmail,
          fromName,
          to: Array.isArray(to) ? to[0] : to,
          subject: subject || '(No Subject)',
          textBody: text,
          htmlBody: html,
          headers: headers || {},
          attachments: attachments || [],
          isRead: false,
          isStarred: false,
          isArchived: false,
        },
      });

      console.log(`[Email Webhook] Received email: ${email.id} from ${fromEmail}`);

      return NextResponse.json({ success: true, emailId: email.id });
    }

    // Handle other webhook types if needed
    return NextResponse.json({ success: true, message: 'Webhook received but not processed' });
  } catch (error: any) {
    console.error('Email webhook error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
