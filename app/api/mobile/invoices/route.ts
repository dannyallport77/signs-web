import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';
import { generateInvoicePDF } from '@/lib/invoiceGenerator';

const prisma = new PrismaClient();

interface InvoiceItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface CreateInvoiceRequest {
  customerEmail: string;
  customerName: string;
  items: InvoiceItem[];
  totalAmount: number;
  notes?: string;
  sendEmail?: boolean;
}

// Helper function to generate unique invoice number
function generateInvoiceNumber(): string {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `INV-${timestamp}-${random}`;
}

// Helper function to send email with invoice
async function sendInvoiceEmail(
  toEmail: string,
  customerName: string,
  invoiceNumber: string,
  pdfBuffer: Buffer
): Promise<boolean> {
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
      to: toEmail,
      subject: `Invoice ${invoiceNumber} - Review Signs`,
      html: `
        <h2>Hello ${customerName},</h2>
        <p>Please find your invoice attached.</p>
        <p>Invoice Number: <strong>${invoiceNumber}</strong></p>
        <p>Thank you for your business!</p>
        <p>Best regards,<br/>Review Signs Team</p>
      `,
      attachments: [
        {
          filename: `${invoiceNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });

    return true;
  } catch (error) {
    console.error('Failed to send invoice email:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: CreateInvoiceRequest = await request.json();

    // Validate required fields
    if (!body.customerEmail || !body.customerName || !body.items || body.totalAmount === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: customerEmail, customerName, items, totalAmount' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.customerEmail)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Generate invoice number
    const invoiceNumber = generateInvoiceNumber();

    // Create invoice in database
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        customerEmail: body.customerEmail,
        customerName: body.customerName,
        totalAmount: body.totalAmount,
        notes: body.notes,
        items: {
          create: body.items.map((item) => ({
            productId: item.productId,
            productName: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    // Generate PDF
    const pdfBuffer = await generateInvoicePDF({
      invoiceNumber: invoice.invoiceNumber,
      customerName: invoice.customerName,
      items: invoice.items.map((item) => ({
        name: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
      })),
      totalAmount: invoice.totalAmount,
      createdAt: invoice.createdAt,
    });

    // Send email if requested
    if (body.sendEmail !== false) {
      try {
        await sendInvoiceEmail(
          body.customerEmail,
          body.customerName,
          invoiceNumber,
          pdfBuffer
        );

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
    }

    return NextResponse.json(
      {
        success: true,
        invoiceNumber: invoice.invoiceNumber,
        invoiceId: invoice.id,
        customerEmail: invoice.customerEmail,
        message: 'Invoice created successfully',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Invoice creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create invoice' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get invoices for a customer email (if provided)
    const email = request.nextUrl.searchParams.get('email');

    let invoices;
    if (email) {
      invoices = await prisma.invoice.findMany({
        where: { customerEmail: email },
        include: { items: true },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      invoices = await prisma.invoice.findMany({
        include: { items: true },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    }

    return NextResponse.json({
      success: true,
      count: invoices.length,
      invoices,
    });
  } catch (error: any) {
    console.error('Invoice retrieval error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to retrieve invoices' },
      { status: 500 }
    );
  }
}
