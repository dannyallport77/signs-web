import fetch from 'node-fetch';

const API_URL = 'http://localhost:3000/api';

async function testTagsCreate() {
  try {
    console.log('Testing /api/tags/create endpoint...\n');

    const testData = {
      businessName: 'Test Business',
      businessAddress: '123 Test St',
      placeId: 'test-place-123',
      tagType: 'multiplatform',
      platforms: [
        {
          platform: 'Google Review',
          url: 'https://www.google.com/business'
        },
        {
          platform: 'Facebook',
          url: 'https://www.facebook.com/business'
        },
        {
          platform: 'Instagram',
          url: 'https://www.instagram.com/business'
        }
      ]
    };

    console.log('Request data:', JSON.stringify(testData, null, 2));
    console.log('\nSending POST request...\n');

    const response = await fetch(`${API_URL}/tags/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });

    console.log(`Status: ${response.status}\n`);

    const result = await response.json();
    console.log('Response:', JSON.stringify(result, null, 2));

    if (response.ok) {
      console.log('\n✅ Test passed!');
    } else {
      console.log('\n❌ Test failed!');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testTagsCreate();
