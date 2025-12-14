import { NextResponse } from 'next/server';
import { generateInvoicePDF } from '@/lib/invoiceGenerator';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const preset = searchParams.get('preset') || 'default';
    const now = new Date();

    let data;
    if (preset === 'long-names') {
      const items = [
        { name: 'Extremely Long Product Name For Google Review NFC Sign Positioned At The Front Desk Beside The Bell', quantity: 1, unitPrice: 39.99, totalPrice: 39.99 },
        { name: 'Another Very Long Descriptive Name For Trustpilot Review NFC Sign Located At Main Entrance Next To Poster Stand', quantity: 1, unitPrice: 42.5, totalPrice: 42.5 },
      ];
      data = {
        invoiceNumber: `DEMO-LONG-${now.getTime()}`,
        customerName: 'Long Names Incorporated With Many Characters In Legal Name',
        items,
        totalAmount: items.reduce((s, i) => s + i.totalPrice, 0),
        createdAt: now,
        showPaidStamp: false,
      };
    } else if (preset === 'many-items') {
      const items = Array.from({ length: 12 }).map((_, i) => ({
        name: `NFC Review Sign Variant ${i + 1}`,
        quantity: (i % 3) + 1,
        unitPrice: 29.99 + i,
        totalPrice: ((i % 3) + 1) * (29.99 + i),
      }));
      data = {
        invoiceNumber: `DEMO-MANY-${now.getTime()}`,
        customerName: 'Bulk Buyer Ltd',
        items,
        totalAmount: items.reduce((s, i) => s + i.totalPrice, 0),
        createdAt: now,
        showPaidStamp: false,
      };
    } else if (preset === 'paid') {
      const items = [
        { name: 'Trustpilot Review NFC Sign', quantity: 3, unitPrice: 41.0, totalPrice: 123.0 },
      ];
      data = {
        invoiceNumber: `DEMO-PAID-${now.getTime()}`,
        customerName: 'Paid Example Ltd',
        items,
        totalAmount: items.reduce((s, i) => s + i.totalPrice, 0),
        createdAt: now,
        showPaidStamp: true,
      };
    } else {
      const items = [
        { name: 'Google Review NFC Sign (Front Desk)', quantity: 2, unitPrice: 39.99, totalPrice: 79.98 },
        { name: 'Trustpilot Review NFC Sign (Entrance)', quantity: 1, unitPrice: 42.5, totalPrice: 42.5 },
        { name: 'Tripadvisor Review NFC Sign (Reception)', quantity: 1, unitPrice: 41.0, totalPrice: 41.0 },
      ];
      data = {
        invoiceNumber: `DEMO-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
        customerName: 'Demo Customer Ltd',
        items,
        totalAmount: items.reduce((s, i) => s + i.totalPrice, 0),
        createdAt: now,
        showPaidStamp: false,
      };
    }

    const buffer = await generateInvoicePDF(data);

    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="invoice-demo.pdf"',
      },
    });
  } catch (error: any) {
    console.error('Demo invoice PDF error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}
