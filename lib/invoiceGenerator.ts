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

      // Try to load custom fonts, fallback to built-in if they don't exist
      try {
        const regularFontPath = path.join(process.cwd(), 'public/fonts/Roboto-Regular.ttf');
        const boldFontPath = path.join(process.cwd(), 'public/fonts/Roboto-Bold.ttf');

        if (fs.existsSync(regularFontPath) && fs.existsSync(boldFontPath)) {
          doc.registerFont('Roboto', regularFontPath);
          doc.registerFont('Roboto-Bold', boldFontPath);
        } else {
          // Fallback to built-in fonts
          throw new Error('Font files not found, using built-in fonts');
        }
      } catch (fontError) {
        console.warn('Font loading warning:', fontError instanceof Error ? fontError.message : 'Unknown error');
        // Continue with built-in fonts (Helvetica)
      }

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

      // Company logo in top right
      const logoSize = 60;
      const logoX = 555 - logoSize; // Right aligned
      const logoY = 40;
      
      const logoCandidates = [
        path.join(process.cwd(), 'public', 'logo.png'),
        path.join(process.cwd(), 'public', 'brand-logos', 'logo.png'),
        path.join(process.cwd(), 'public', 'icon.png'),
      ];
      
      const companyLogoPath = logoCandidates.find((p) => fs.existsSync(p));
      if (companyLogoPath) {
        try {
          doc.image(companyLogoPath, logoX, logoY, { fit: [logoSize, logoSize] });
        } catch (e) {
          console.warn('[invoiceGenerator] Failed to load company logo, using text fallback');
        }
      }

      // Header Section with Branding
      const headerY = 50;
      const textX = 40;

      doc.fontSize(28).font('Helvetica-Bold').fillColor(primaryColor);
      doc.text('INVOICE', textX, headerY);
      
      // Company Info
      doc.moveDown(0.5);
      doc.fontSize(14).font('Helvetica-Bold').fillColor(textColor);
      doc.text('Review Signs', textX);
      
      doc.moveDown(0.2);
      doc.fontSize(10).font('Helvetica').fillColor('#6b7280');
      doc.text('Professional NFC Review Tag Systems', textX);
      doc.moveDown(0.1);
      doc.text('https://www.review-signs.co.uk', textX);

      // Reset Y for divider
      doc.y = 140;

      // Horizontal divider
      doc.moveDown(0.8);
      doc.strokeColor(accentColor).lineWidth(2);
      doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
      doc.moveDown(0.8);

      // Two-column layout: Invoice details (left) and Customer info (right)
      const leftX = 40;
      const rightX = 330;
      const detailsY = doc.y;

      // Left Column: Invoice Details
      doc.fontSize(11).font('Helvetica-Bold').fillColor(textColor);
      doc.text('Invoice Details', leftX, detailsY);
      
      doc.fontSize(10).font('Helvetica').fillColor(textColor);
      doc.moveDown(0.4);
      doc.text(`Invoice Number: ${data.invoiceNumber}`, leftX);
      doc.moveDown(0.25);
      doc.text(`Date: ${data.createdAt.toLocaleDateString('en-GB')}`, leftX);
      doc.moveDown(0.25);
      doc.text(`Time: ${data.createdAt.toLocaleTimeString('en-GB')}`, leftX);

      // Right Column: Customer Info
      const currentY = detailsY;
      doc.fontSize(11).font('Helvetica-Bold').fillColor(textColor);
      doc.text('Bill To', rightX, currentY);
      
      doc.fontSize(10).font('Helvetica').fillColor(textColor);
      doc.moveDown(0.4);
      doc.text(data.customerName, rightX);

      // Ensure the table starts below both columns (avoid overlap when names are long)
      const afterDetailsY = Math.max(doc.y, detailsY + 60);
      doc.y = afterDetailsY + 12;

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
          doc.rect(40, currentY_rows - 3, 515, 25).fill();
        }

        doc.fillColor(textColor);
        doc.text(item.name, itemX, currentY_rows);
        doc.text(item.quantity.toString(), quantityX, currentY_rows, { align: 'center' });
        doc.text(`£${item.unitPrice.toFixed(2)}`, priceX, currentY_rows, { align: 'right' });
        doc.text(`£${item.totalPrice.toFixed(2)}`, totalX, currentY_rows, { align: 'right' });
        currentY_rows += 25;
      });

      // Summary section
      doc.moveDown(1.2);
      const summaryY = doc.y;

      // Subtotal
      doc.fontSize(10).font('Helvetica').fillColor('#6b7280');
      doc.text('Subtotal:', 350, summaryY);
      doc.text(`£${data.totalAmount.toFixed(2)}`, 470, summaryY, { align: 'right' });

      // Total (highlighted)
      doc.moveDown(0.7);
      const totalY = doc.y;
      doc.fillColor(primaryColor);
      doc.rect(300, totalY - 8, 255, 40).fill(); // Reduced height, wider box

      doc.fontSize(14).font('Helvetica-Bold').fillColor('white');
      doc.text('TOTAL DUE:', 320, totalY);
      doc.fontSize(16).font('Helvetica-Bold');
      doc.text(`£${data.totalAmount.toFixed(2)}`, 320, totalY, { width: 215, align: 'right' });

      // Position logos and footer at bottom of page
      const pageHeight = 841.89; // A4 height in points
      const bottomMargin = 40;
      const logoHeight = 22;
      const logoWidth = 50;
      const gap = 8;
      const availableWidth = 555 - 40;
      const logosPerRow = Math.floor((availableWidth + gap) / (logoWidth + gap));
      
      const logos = [
        { name: 'Google', file: 'google.png' },
        { name: 'Facebook', file: 'facebook.png' },
        { name: 'Instagram', file: 'instagram.png' },
        { name: 'Checkatrade', file: 'checkatrade.png' },
        { name: 'TrustATrader', file: 'trustatrader.png' },
        { name: 'RatedPeople', file: 'ratedpeople.png' },
        { name: 'Trustpilot', file: 'trustpilot.png' },
        { name: 'Tripadvisor', file: 'tripadvisor.png' },
        { name: 'TikTok', file: 'tiktok.png' },
      ];

      const brandColors: Record<string, string> = {
        Google: '#4285F4',
        Facebook: '#1877F2',
        Instagram: '#E1306C',
        Checkatrade: '#00A7E0',
        TrustATrader: '#1B75BB',
        RatedPeople: '#00A88F',
        Trustpilot: '#00B67A',
        Tripadvisor: '#34E0A1',
        TikTok: '#000000',
      };

      // Calculate space needed
      const numRows = Math.ceil(logos.length / logosPerRow);
      const rowSpacing = 6;
      const totalLogosHeight = numRows * logoHeight + (numRows - 1) * rowSpacing;
      const footerTextHeight = 45; // Space for 4 lines of footer text
      const totalBottomHeight = totalLogosHeight + footerTextHeight + 10; // 10pt gap between logos and footer
      
      // Start logos this far from bottom
      const logosStartY = pageHeight - bottomMargin - totalBottomHeight;

      logos.forEach((logo, idx) => {
        const row = Math.floor(idx / logosPerRow);
        const col = idx % logosPerRow;
        
        // Center each row
        const logosInThisRow = Math.min(logosPerRow, logos.length - row * logosPerRow);
        const rowWidth = logosInThisRow * logoWidth + (logosInThisRow - 1) * gap;
        const rowStartX = 40 + (availableWidth - rowWidth) / 2;
        
        const x = rowStartX + col * (logoWidth + gap);
        const y = logosStartY + row * (logoHeight + rowSpacing);
        
        const candidates = [
          path.join(process.cwd(), 'public/brand-logos', logo.file),
          path.join(process.cwd(), 'public/platform-logos', logo.file),
          path.join(process.cwd(), '..', 'signs-mobile', 'assets', 'platform-logos', logo.file),
        ];
        const imagePath = candidates.find((p) => fs.existsSync(p));
        if (imagePath) {
          console.log(`[invoiceGenerator] Using logo file for ${logo.name}: ${path.relative(process.cwd(), imagePath)}`);
        } else {
          console.warn(`[invoiceGenerator] Missing logo file for ${logo.name}. Checked: ${candidates.map(c => path.relative(process.cwd(), c)).join(', ')}`);
        }
        if (imagePath) {
          try {
            // Center image vertically and horizontally within the box
            doc.image(imagePath, x, y, { 
              fit: [logoWidth, logoHeight],
              align: 'center',
              valign: 'center'
            });
            return;
          } catch (e) {
            console.warn(`[invoiceGenerator] Failed to render image for ${logo.name} at ${path.relative(process.cwd(), imagePath)}. Falling back to badge.`, e instanceof Error ? e.message : e);
            // fall through to fallback badge
          }
        }

        // Fallback: visible brand badge - vertically centered
        const color = brandColors[logo.name] || '#374151';
        doc.roundedRect(x, y, logoWidth, logoHeight, 4)
           .fillColor('#ffffff')
           .strokeColor(color)
           .lineWidth(1.5)
           .stroke();
        doc.fillColor(color)
           .font('Helvetica-Bold')
           .fontSize(7)
           .text(logo.name, x + 2, y + 7.5, { width: logoWidth - 4, align: 'center' });
      });

      // Footer text below logos
      const footerStartY = logosStartY + totalLogosHeight + 10;
      
      doc.fontSize(8).font('Helvetica-Bold').fillColor(textColor);
      doc.text('Review Signs', 40, footerStartY, { align: 'center', width: 515 });
      
      doc.fontSize(7).font('Helvetica').fillColor('#6b7280');
      doc.text('Professional NFC Review Tag Systems', 40, footerStartY + 12, { align: 'center', width: 515 });
      doc.text('www.review-signs.co.uk | invoices@review-signs.co.uk', 40, footerStartY + 24, { align: 'center', width: 515 });
      doc.text('© 2025 Review Signs. All rights reserved.', 40, footerStartY + 36, { align: 'center', width: 515 });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
