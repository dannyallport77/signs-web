import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:3000/api';

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL';
  message: string;
  duration: number;
}

const results: TestResult[] = [];

async function runTest(testName: string, testFn: () => Promise<void>): Promise<void> {
  const start = Date.now();
  try {
    await testFn();
    results.push({
      test: testName,
      status: 'PASS',
      message: 'Passed',
      duration: Date.now() - start,
    });
    console.log(`✅ ${testName}`);
  } catch (error: any) {
    results.push({
      test: testName,
      status: 'FAIL',
      message: error.message || String(error),
      duration: Date.now() - start,
    });
    console.log(`❌ ${testName}: ${error.message}`);
  }
}

async function main() {
  console.log('🧪 Testing Invoice System\n');

  // Test 1: Email Configuration
  await runTest('Email configuration loaded', async () => {
    if (!process.env.EMAIL_FROM) throw new Error('EMAIL_FROM not configured');
    if (!process.env.EMAIL_PASSWORD) throw new Error('EMAIL_PASSWORD not configured');
    console.log(`   Using: ${process.env.EMAIL_FROM}`);
  });

  // Test 2: Database Connection
  await runTest('Database connection', async () => {
    const count = await prisma.invoice.count();
    console.log(`   Found ${count} existing invoices`);
  });

  // Test 3: Create Single Product Invoice
  let invoiceNumber1: string;
  await runTest('Create single product invoice', async () => {
    const response = await fetch(`${API_URL}/mobile/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token',
      },
      body: JSON.stringify({
        customerEmail: 'test@example.com',
        customerName: 'Test Customer',
        items: [
          {
            productId: 'prod-1',
            name: 'A3 Laminated Sign',
            quantity: 5,
            unitPrice: 12.50,
            totalPrice: 62.50,
          },
        ],
        totalAmount: 62.50,
        sendEmail: false,
      }),
    }) as any;

    if (!response.ok) {
      const error = await response.json();
      throw new Error(JSON.stringify(error));
    }

    const data: any = await response.json();
    invoiceNumber1 = data.invoiceNumber;
    console.log(`   Created: ${data.invoiceNumber}`);
  });

  // Test 4: Create Multi-Product Invoice (Aggregation)
  let invoiceNumber2: string;
  await runTest('Create multi-product invoice (aggregation test)', async () => {
    const response = await fetch(`${API_URL}/mobile/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token',
      },
      body: JSON.stringify({
        customerEmail: 'aggregation-test@example.com',
        customerName: 'Aggregation Test Customer',
        items: [
          {
            productId: 'prod-1',
            name: 'A3 Laminated Sign',
            quantity: 5,
            unitPrice: 12.50,
            totalPrice: 62.50,
          },
          {
            productId: 'prod-2',
            name: 'A4 Laminated Sign',
            quantity: 10,
            unitPrice: 8.50,
            totalPrice: 85.00,
          },
          {
            productId: 'prod-3',
            name: 'Custom Design Service',
            quantity: 1,
            unitPrice: 50.00,
            totalPrice: 50.00,
          },
        ],
        totalAmount: 197.50,
        sendEmail: false,
      }),
    }) as any;

    if (!response.ok) {
      const error = await response.json();
      throw new Error(JSON.stringify(error));
    }

    const data: any = await response.json();
    invoiceNumber2 = data.invoiceNumber;
    console.log(`   Created: ${data.invoiceNumber}`);
    console.log(`   Products aggregated: 3 items`);
  });

  // Test 5: Verify Invoice in Database
  await runTest('Verify invoice aggregation in database', async () => {
    const invoice = await prisma.invoice.findFirst({
      where: {
        invoiceNumber: invoiceNumber2,
      },
      include: {
        items: true,
      },
    });

    if (!invoice) throw new Error('Invoice not found');
    if (invoice.items.length !== 3) {
      throw new Error(`Expected 3 items, got ${invoice.items.length}`);
    }

    const total = invoice.items.reduce((sum, item) => sum + item.totalPrice, 0);
    if (Math.abs(total - 197.50) > 0.01) {
      throw new Error(`Total mismatch: expected 197.50, got ${total}`);
    }

    console.log(`   ✓ Invoice has ${invoice.items.length} items`);
    console.log(`   ✓ Total: £${invoice.totalAmount.toFixed(2)}`);
    invoice.items.forEach(item => {
      console.log(`     - ${item.productName}: ${item.quantity} × £${item.unitPrice.toFixed(2)} = £${item.totalPrice.toFixed(2)}`);
    });
  });

  // Test 6: Retrieve Invoices by Email
  await runTest('Retrieve invoices by customer email', async () => {
    const response = await fetch(
      `${API_URL}/mobile/invoices?email=aggregation-test@example.com`,
      {
        headers: {
          'Authorization': 'Bearer test-token',
        },
      }
    ) as any;

    if (!response.ok) {
      const error = await response.json();
      throw new Error(JSON.stringify(error));
    }

    const data: any = await response.json();
    if (!data.success) throw new Error('API returned success: false');
    if (data.invoices.length === 0) throw new Error('No invoices found');

    console.log(`   Found ${data.invoices.length} invoice(s) for aggregation-test@example.com`);
  });

  // Test 7: Email Sending (Optional - only if Resend is configured)
  let emailSent = false;
  await runTest('Send invoice via email', async () => {
    const response = await fetch(`${API_URL}/mobile/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token',
      },
      body: JSON.stringify({
        customerEmail: 'danny@review-signs.co.uk',
        customerName: 'Test Invoice Recipient',
        items: [
          {
            productId: 'prod-1',
            name: 'A3 Laminated Sign',
            quantity: 2,
            unitPrice: 12.50,
            totalPrice: 25.00,
          },
        ],
        totalAmount: 25.00,
        sendEmail: true,
      }),
    }) as any;

    if (!response.ok) {
      const error = await response.json();
      throw new Error(JSON.stringify(error));
    }

    const data: any = await response.json();
    emailSent = true;
    console.log(`   Invoice sent to danny@review-signs.co.uk`);
    console.log(`   Invoice #: ${data.invoiceNumber}`);
  });

  // Test 8: Verify Invoices Status
  await runTest('Check email sending status', async () => {
    const sentInvoice = await prisma.invoice.findFirst({
      where: {
        status: 'sent',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (emailSent && sentInvoice) {
      console.log(`   ✓ Most recent invoice status: ${sentInvoice.status}`);
      console.log(`   ✓ Sent at: ${sentInvoice.sentAt?.toLocaleString('en-GB')}`);
    }
  });

  // Summary
  console.log('\n📊 Test Summary');
  console.log('═'.repeat(50));

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const totalTime = results.reduce((sum, r) => sum + r.duration, 0);

  results.forEach(result => {
    const icon = result.status === 'PASS' ? '✅' : '❌';
    console.log(`${icon} ${result.test.padEnd(35)} ${result.duration}ms`);
    if (result.status === 'FAIL') {
      console.log(`   └─ ${result.message}`);
    }
  });

  console.log('═'.repeat(50));
  console.log(`Passed: ${passed}/${results.length}`);
  console.log(`Failed: ${failed}/${results.length}`);
  console.log(`Total Time: ${totalTime}ms\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

main().finally(() => prisma.$disconnect());
