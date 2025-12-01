import { prisma } from '@/lib/prisma';
import { generateInvoicePDF } from '@/lib/invoiceGenerator';
import nodemailer from 'nodemailer';

async function testDashboardInvoice() {
  console.log('📧 Testing dashboard invoice creation and sending\n');

  try {
    const customerName = 'Danny Allport';
    const customerEmail = 'dannyallport@icloud.com';
    const items = [
      {
        name: 'A3 Laminated Sign',
        quantity: 2,
        unitPrice: 15.99,
      },
      {
        name: 'Custom Design Service',
        quantity: 1,
        unitPrice: 25.00,
      },
    ];

    // Calculate totals
    const invoiceItems = items.map((item: any) => ({
      productId: 'custom-item',
      productName: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.quantity * item.unitPrice,
    }));

    const totalAmount = invoiceItems.reduce((sum: number, item: any) => sum + item.totalPrice, 0);

    // Create invoice in database
    console.log('📝 Creating invoice in database...');
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: `INV-${Date.now()}`,
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

    console.log(`✅ Invoice created: ${invoice.invoiceNumber}\n`);

    // Generate PDF
    console.log('📄 Generating PDF...');
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
      showPaidStamp: false
    });

    console.log('✅ PDF generated\n');

    // Send email
    console.log('📧 Sending email...');
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

    // Update status
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { status: 'sent', sentAt: new Date() },
    });

    console.log('✅ Email sent successfully!\n');
    console.log('📋 Invoice Details:');
    console.log(`   Invoice #: ${invoice.invoiceNumber}`);
    console.log(`   Customer: ${invoice.customerName}`);
    console.log(`   Email: ${invoice.customerEmail}`);
    console.log(`   Status: sent`);
    console.log(`   Total: £${invoice.totalAmount.toFixed(2)}`);
    console.log('\n📧 Items:');
    invoice.items.forEach(item => {
      console.log(`   - ${item.productName}: ${item.quantity} × £${item.unitPrice.toFixed(2)} = £${item.totalPrice.toFixed(2)}`);
    });
    console.log(`\n📬 Check your inbox at ${customerEmail}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDashboardInvoice();
