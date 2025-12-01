const fetch = require('node-fetch');

async function testDashboardInvoice() {
  const API_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  console.log('📧 Testing dashboard invoice endpoint\n');
  console.log(`API URL: ${API_URL}`);
  
  const payload = {
    customerName: 'Danny Allport',
    customerEmail: 'dannyallport@icloud.com',
    items: [
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
    ],
  };

  try {
    console.log('\n📤 Sending request to /api/invoices/create...\n');
    
    const response = await fetch(`${API_URL}/api/invoices/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Success!\n');
      console.log('📋 Invoice Details:');
      console.log(`   Invoice #: ${data.invoice.invoiceNumber}`);
      console.log(`   Customer: ${data.invoice.customerName}`);
      console.log(`   Email: ${data.invoice.customerEmail}`);
      console.log(`   Status: ${data.invoice.status}`);
      console.log(`   Total: £${data.invoice.totalAmount.toFixed(2)}`);
      console.log('\n📧 Items:');
      data.invoice.items.forEach(item => {
        console.log(`   - ${item.productName}: ${item.quantity} × £${item.unitPrice.toFixed(2)} = £${item.totalPrice.toFixed(2)}`);
      });
      console.log(`\n✨ Check your inbox at ${payload.customerEmail}`);
    } else {
      console.log('❌ Error:\n');
      console.log(`Status: ${response.status}`);
      console.log(`Error: ${data.error}`);
    }
  } catch (error) {
    console.error('❌ Failed to send request:', error.message);
  }
}

testDashboardInvoice();
