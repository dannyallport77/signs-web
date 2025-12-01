import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';

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
  showPaidStamp?: boolean;
}

export async function generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const chunks: Buffer[] = [];
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40, // Reduced margin to save space
      });

      // Collect PDF data
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Brand Colors
      const primaryColor = '#4f46e5'; // Indigo
      const accentColor = '#818cf8'; // Light indigo
      const textColor = '#1f2937'; // Dark gray
      const lightGray = '#f3f4f6';

      // PAID Stamp
      if (data.showPaidStamp) {
        doc.save();
        doc.translate(400, 100);
        doc.rotate(-15);
        
        // Outer Border
        doc.rect(0, 0, 120, 50)
           .lineWidth(3)
           .strokeColor('#dc2626') // Red
           .strokeOpacity(0.6)
           .stroke();
           
        // Inner Border
        doc.rect(3, 3, 114, 44)
           .lineWidth(1)
           .strokeColor('#dc2626')
           .strokeOpacity(0.6)
           .stroke();

        // Text
        doc.fontSize(24)
           .font('Helvetica-Bold')
           .fillColor('#dc2626')
           .fillOpacity(0.6)
           .text('PAID', 0, 13, {
             width: 120,
             align: 'center'
           });
           
        doc.restore();
        
        // Reset opacity for subsequent elements
        doc.fillOpacity(1);
        doc.strokeOpacity(1);
      }

      // Draw Vector Logo (Grayscale/Monochrome as requested)
      doc.save();
      doc.translate(40, 35);
      doc.scale(0.4); // Scale down 100x100 SVG to 40x40 approx

      // Circle
      doc.circle(50, 50, 45)
         .lineWidth(8)
         .strokeColor('#e5e7eb') // Light gray
         .stroke();
      
      // Swoosh
      doc.path('M 20 55 Q 50 80 80 45')
         .lineWidth(8)
         .lineCap('round')
         .strokeColor('#9ca3af') // Medium gray
         .stroke();
      
      // Paper Plane
      doc.path('M 30 60 L 75 25 L 55 75 L 45 55 Z')
         .fillColor('#4b5563') // Dark gray
         .fill();
      
      doc.restore();

      // Header Section with Branding
      const headerY = 35;
      const textX = 100; // Moved right to accommodate logo

      doc.fontSize(28).font('Helvetica-Bold').fillColor(primaryColor);
      doc.text('INVOICE', textX, headerY);
      
      // Company Info
      doc.moveDown(0.2);
      doc.fontSize(14).font('Helvetica-Bold').fillColor(textColor);
      doc.text('Review Signs', textX);
      
      doc.fontSize(10).font('Helvetica').fillColor('#6b7280');
      doc.text('Professional NFC Review Tag Systems', textX);
      doc.text('https://www.review-signs.co.uk', textX);

      // Reset Y for divider
      doc.y = 100;

      // Horizontal divider
      doc.moveDown(0.5);
      doc.strokeColor(accentColor).lineWidth(2);
      doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
      doc.moveDown(0.5);

      // Two-column layout: Invoice details (left) and Customer info (right)
      const leftX = 40;
      const rightX = 330;
      const detailsY = doc.y;

      // Left Column: Invoice Details
      doc.fontSize(11).font('Helvetica-Bold').fillColor(textColor);
      doc.text('Invoice Details', leftX, detailsY);
      
      doc.fontSize(10).font('Helvetica').fillColor(textColor);
      doc.moveDown(0.3);
      doc.text(`Invoice Number: ${data.invoiceNumber}`, leftX);
      doc.text(`Date: ${data.createdAt.toLocaleDateString('en-GB')}`, leftX);
      doc.text(`Time: ${data.createdAt.toLocaleTimeString('en-GB')}`, leftX);

      // Right Column: Customer Info
      const currentY = detailsY;
      doc.fontSize(11).font('Helvetica-Bold').fillColor(textColor);
      doc.text('Bill To', rightX, currentY);
      
      doc.fontSize(10).font('Helvetica').fillColor(textColor);
      doc.moveDown(0.3);
      doc.text(data.customerName, rightX);

      // Reset to left column for items
      doc.moveDown(1.5);

      // Items Table Header with background
      const tableTopY = doc.y;
      const itemX = 45;
      const quantityX = 300;
      const priceX = 390;
      const totalX = 470;

      // Table header background
      doc.fillColor(lightGray);
      doc.rect(40, tableTopY - 5, 515, 25).fill();

      // Table header text
      doc.fillColor(textColor);
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('Description', itemX, tableTopY);
      doc.text('Qty', quantityX, tableTopY);
      doc.text('Unit Price', priceX, tableTopY);
      doc.text('Total', totalX, tableTopY);

      // Table rows
      let currentY_rows = tableTopY + 25;
      doc.font('Helvetica').fontSize(10).fillColor(textColor);

      data.items.forEach((item, index) => {
        // Alternating row backgrounds
        if (index % 2 === 0) {
          doc.fillColor('#fafafa');
          doc.rect(40, currentY_rows - 3, 515, 20).fill();
        }

        doc.fillColor(textColor);
        doc.text(item.name, itemX, currentY_rows);
        doc.text(item.quantity.toString(), quantityX, currentY_rows, { align: 'center' });
        doc.text(`£${item.unitPrice.toFixed(2)}`, priceX, currentY_rows, { align: 'right' });
        doc.text(`£${item.totalPrice.toFixed(2)}`, totalX, currentY_rows, { align: 'right' });
        currentY_rows += 20;
      });

      // Summary section
      doc.moveDown(1);
      const summaryY = doc.y;

      // Subtotal
      doc.fontSize(10).font('Helvetica').fillColor('#6b7280');
      doc.text('Subtotal:', 350, summaryY);
      doc.text(`£${data.totalAmount.toFixed(2)}`, 470, summaryY, { align: 'right' });

      // Total (highlighted)
      doc.moveDown(0.5);
      const totalY = doc.y;
      doc.fillColor(primaryColor);
      doc.rect(300, totalY - 8, 255, 40).fill(); // Reduced height, wider box

      doc.fontSize(14).font('Helvetica-Bold').fillColor('white');
      doc.text('TOTAL DUE:', 320, totalY);
      doc.fontSize(16).font('Helvetica-Bold');
      doc.text(`£${data.totalAmount.toFixed(2)}`, 320, totalY, { width: 215, align: 'right' });

      // Marketing Section
      doc.moveDown(1); // Reduced spacing
      
      const marketingY = doc.y;
      
      // Marketing Header
      doc.fontSize(11).font('Helvetica-Bold').fillColor(primaryColor);
      doc.text('DID YOU KNOW?', 40, marketingY);
      doc.strokeColor(accentColor).lineWidth(1);
      doc.moveTo(40, marketingY + 12).lineTo(190, marketingY + 12).stroke();

      // Marketing Grid
      const startY = marketingY + 20; // Reduced spacing
      const col1X = 70;
      const col2X = 320;
      const icon1X = 40;
      const icon2X = 290;
      
      doc.fontSize(9).font('Helvetica-Bold').fillColor(textColor);
      
      // Item 1: Google Reviews
      // Icon: Star
      doc.save();
      doc.translate(icon1X + 10, startY + 5);
      doc.scale(0.8);
      doc.path('M 0 -10 L 2.5 -3 L 10 -3 L 4 1 L 6 8 L 0 4 L -6 8 L -4 1 L -10 -3 L -2.5 -3 Z')
         .fillColor(primaryColor).fill();
      doc.restore();

      doc.text('Boost Google Reviews', col1X, startY);
      doc.fontSize(8).font('Helvetica').fillColor('#6b7280'); // Reduced font size
      doc.text('Get more 5-star reviews on Google with a single tap! Our smart signs make it easy for customers to share their experience.', col1X, startY + 12, { width: 210 });

      // Item 2: WiFi Signs
      // Icon: WiFi
      doc.save();
      doc.translate(icon2X + 10, startY + 8);
      doc.lineWidth(2).strokeColor(primaryColor);
      doc.circle(0, 0, 1).fillColor(primaryColor).fill();
      doc.path('M -4 -4 Q 0 -8 4 -4').stroke();
      doc.path('M -8 -8 Q 0 -16 8 -8').stroke();
      doc.restore();

      doc.fontSize(9).font('Helvetica-Bold').fillColor(textColor);
      doc.text('Instant Wi-Fi Access', col2X, startY);
      doc.fontSize(8).font('Helvetica').fillColor('#6b7280');
      doc.text('Help customers connect instantly. No more typing long passwords - just tap to connect!', col2X, startY + 12, { width: 210 });

      const row2Y = startY + 50; // Reduced spacing

      // Item 3: Menu Tags
      // Icon: Menu
      doc.save();
      doc.translate(icon1X + 10, row2Y + 5);
      doc.lineWidth(1.5).strokeColor(primaryColor);
      doc.rect(-8, -10, 16, 20).stroke();
      doc.moveTo(-4, -5).lineTo(4, -5).stroke();
      doc.moveTo(-4, 0).lineTo(4, 0).stroke();
      doc.moveTo(-4, 5).lineTo(4, 5).stroke();
      doc.restore();

      doc.fontSize(9).font('Helvetica-Bold').fillColor(textColor);
      doc.text('Digital Menu Tags', col1X, row2Y);
      doc.fontSize(8).font('Helvetica').fillColor('#6b7280');
      doc.text('Perfect for restaurants! Place NFC tags on tables to instantly display your menu on customers\' phones.', col1X, row2Y + 12, { width: 210 });

      // Item 4: Key Rings
      // Icon: Key Ring
      doc.save();
      doc.translate(icon2X + 10, row2Y + 5);
      doc.lineWidth(2).strokeColor(primaryColor);
      doc.circle(0, 0, 8).stroke();
      doc.circle(0, -6, 2).fillColor(primaryColor).fill();
      doc.restore();

      doc.fontSize(9).font('Helvetica-Bold').fillColor(textColor);
      doc.text('Smart Key Rings', col2X, row2Y);
      doc.fontSize(8).font('Helvetica').fillColor('#6b7280');
      doc.text('Carry your review link everywhere. Durable, stylish NFC key rings for business on the go.', col2X, row2Y + 12, { width: 210 });

      // Special Offer Box
      const offerY = row2Y + 50; // Reduced spacing
      doc.fillColor('#f0fdf4'); // Light green background
      doc.rect(40, offerY, 515, 35).fill();
      doc.strokeColor('#16a34a').lineWidth(1); // Green border
      doc.rect(40, offerY, 515, 35).stroke();

      doc.fontSize(9).font('Helvetica-Bold').fillColor('#15803d'); // Dark green text
      doc.text('SPECIAL OFFER: Get 10% off your next order of Multi-Platform Signs!', 40, offerY + 10, { align: 'center', width: 515 });
      doc.fontSize(8).font('Helvetica').text('Use code: UPGRADE10', 40, offerY + 22, { align: 'center', width: 515 });

      // Footer & Logos
      // Calculate available space
      const pageHeight = 841.89; // A4 height in points
      const footerHeight = 120; // Increased footer height to move it up
      const footerTop = pageHeight - footerHeight; 
      
      // Platform Logos Section
      const logoY = footerTop - 30;
      const centerX = 300;

      doc.save();
      
      // Google Logo (Center) - Solid Fill
      doc.translate(centerX - 12, logoY + 5); // Centered (24px width / 2)
      doc.scale(1.0); 
      doc.path('M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z')
         .fillColor('#4b5563').fill();
      doc.restore();

      // Footer Background
      doc.fillColor('#f9fafb'); // Very light gray
      doc.rect(0, footerTop, 600, footerHeight + 40).fill(); // Extend background to bottom

      // Footer Text
      doc.fontSize(9).font('Helvetica-Bold').fillColor(textColor);
      doc.text('Review Signs', 0, footerTop + 20, { align: 'center' });
      
      doc.fontSize(8).font('Helvetica').fillColor('#6b7280');
      doc.text('Professional NFC Review Tag Systems', 0, footerTop + 35, { align: 'center' });
      doc.text('Web: www.review-signs.co.uk | Email: invoices@review-signs.co.uk', 0, footerTop + 50, { align: 'center' });
      doc.text('© 2025 Review Signs. All rights reserved.', 0, footerTop + 65, { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
