import PDFDocument from 'pdfkit';

interface InvoiceItem {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface InvoiceData {
  invoiceNumber: string;
  customerName: string;
  items: InvoiceItem[];
  totalAmount: number;
  createdAt: Date;
}

export async function generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const chunks: Buffer[] = [];
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
      });

      // Collect PDF data
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(24).font('Helvetica-Bold').text('INVOICE', { align: 'center' });
      doc.moveDown(0.3);
      doc.fontSize(12).font('Helvetica').text('Review Signs', { align: 'center' });
      doc.fontSize(10).text('https://www.review-signs.co.uk', { align: 'center' });

      // Invoice details
      doc.moveDown(1);
      doc.fontSize(11).font('Helvetica-Bold').text('Invoice Details');
      doc.fontSize(10).font('Helvetica');
      doc.text(`Invoice Number: ${data.invoiceNumber}`);
      doc.text(`Date: ${data.createdAt.toLocaleDateString('en-GB')}`);
      doc.text(`Customer: ${data.customerName}`);

      // Items table
      doc.moveDown(1);
      doc.fontSize(11).font('Helvetica-Bold').text('Items');

      const tableTop = doc.y + 10;
      const itemX = 50;
      const quantityX = 280;
      const priceX = 360;
      const totalX = 450;

      // Table header
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('Description', itemX, tableTop);
      doc.text('Qty', quantityX, tableTop);
      doc.text('Unit Price', priceX, tableTop);
      doc.text('Total', totalX, tableTop);

      // Table rows
      let currentY = tableTop + 20;
      doc.font('Helvetica').fontSize(9);

      data.items.forEach((item) => {
        doc.text(item.name, itemX, currentY);
        doc.text(item.quantity.toString(), quantityX, currentY);
        doc.text(`£${item.unitPrice.toFixed(2)}`, priceX, currentY);
        doc.text(`£${item.totalPrice.toFixed(2)}`, totalX, currentY);
        currentY += 20;
      });

      // Horizontal line
      doc.moveTo(50, currentY).lineTo(550, currentY).stroke();

      // Total
      currentY += 10;
      doc.fontSize(12).font('Helvetica-Bold');
      doc.text('TOTAL', itemX, currentY);
      doc.text(`£${data.totalAmount.toFixed(2)}`, totalX, currentY);

      // Footer
      doc.moveDown(2);
      doc.fontSize(9).font('Helvetica').text(
        'Thank you for your business!',
        { align: 'center' }
      );
      doc.text('This is an automatically generated invoice.', { align: 'center' });

      // Finalize
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
