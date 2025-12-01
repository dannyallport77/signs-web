import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateInvoicePDF } from '@/lib/invoiceGenerator';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customerName, customerEmail, items } = body;

    if (!customerName || !customerEmail || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Calculate totals
    const invoiceItems = items.map((item: any) => ({
      productId: 'custom-item', // Placeholder for custom items
      productName: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.quantity * item.unitPrice,
    }));

    const totalAmount = invoiceItems.reduce((sum: number, item: any) => sum + item.totalPrice, 0);

    // Create invoice in database
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: `INV-${Date.now()}`, // Simple ID generation
        customerEmail,
        customerName,
        totalAmount,
        status: 'pending',
        items: {
          create: invoiceItems,
        },
      },
      include: {
        items: true,
      },
    });

    // Generate PDF
    // Map prisma items to the format expected by generateInvoicePDF
    const pdfItems = invoice.items.map(item => ({
      name: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice
    }));

    const pdfBuffer = await generateInvoicePDF({
      invoiceNumber: invoice.invoiceNumber,
      customerName: invoice.customerName,
      items: pdfItems,
      totalAmount: invoice.totalAmount,
      createdAt: invoice.createdAt,
      showPaidStamp: false // Default to false for new invoices
    });

    // Send email - don't fail if it doesn't work, similar to mobile endpoint
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      });

      await transporter.sendMail({
        from: process.env.EMAIL_FROM || 'invoices@review-signs.co.uk',
        to: customerEmail,
        subject: `Invoice ${invoice.invoiceNumber} - Review Signs`,
        html: `
          <h2>Hello ${customerName},</h2>
          <p>Please find your invoice attached.</p>
          <p><strong>Invoice Number:</strong> ${invoice.invoiceNumber}</p>
          <p><strong>Total Amount:</strong> £${totalAmount.toFixed(2)}</p>
          <h3>Items:</h3>
          <ul>
            ${invoiceItems.map((item: any) => `<li>${item.productName}: ${item.quantity} × £${item.unitPrice.toFixed(2)} = £${item.totalPrice.toFixed(2)}</li>`).join('')}
          </ul>
          <p>Thank you for your business!</p>
          <p>Best regards,<br/><strong>Review Signs Team</strong></p>
        `,
        attachments: [
          {
            filename: `${invoice.invoiceNumber}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ],
      });

      // Update invoice status to sent
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { status: 'sent', sentAt: new Date() },
      });
    } catch (emailError) {
      console.error('Failed to send invoice email, but invoice was created:', emailError);
      // Don't fail the entire request if email fails
      // Invoice is still created and can be accessed later
    }

    return NextResponse.json({ 
      success: true, 
      invoice,
      message: 'Invoice created successfully'
    });
  } catch (error: any) {
    console.error('Error creating invoice:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create invoice' },
      { status: 500 }
    );
  }
}
