const API_URL = 'http://localhost:3000/api';

interface TestCase {
  businessName: string;
  address?: string;
  expectedPlatforms: string[];
  type: string;
}

const testCases: TestCase[] = [
  {
    businessName: 'Starbucks',
    address: 'London',
    expectedPlatforms: ['google', 'facebook', 'instagram', 'tripadvisor'],
    type: 'Chain Restaurant',
  },
  {
    businessName: 'McDonald\'s',
    address: 'Manchester',
    expectedPlatforms: ['google', 'facebook', 'instagram', 'tripadvisor'],
    type: 'Chain Restaurant',
  },
  {
    businessName: 'Pimlico Plumbers',
    address: 'London',
    expectedPlatforms: ['google', 'facebook', 'trustpilot', 'checkatrade', 'yell'],
    type: 'Tradesman',
  },
  {
    businessName: 'MyBuilder',
    address: 'UK',
    expectedPlatforms: ['google', 'trustpilot', 'facebook'],
    type: 'Trade Platform',
  },
];

async function testPlatformVerification(testCase: TestCase) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`Testing: ${testCase.businessName} (${testCase.type})`);
  console.log(`Address: ${testCase.address || 'N/A'}`);
  console.log(`Expected platforms: ${testCase.expectedPlatforms.join(', ')}`);
  console.log('='.repeat(80));

  try {
    const url = `${API_URL}/places/social-media?businessName=${encodeURIComponent(testCase.businessName)}${testCase.address ? `&address=${encodeURIComponent(testCase.address)}` : ''}`;
    
    console.log(`\nFetching: ${url}`);
    const startTime = Date.now();
    
    const response = await fetch(url);
    const data = await response.json();
    
    const duration = Date.now() - startTime;
    console.log(`Response time: ${duration}ms`);

    if (!data.success || !data.data) {
      console.error('❌ Failed to fetch data:', data.error || 'Unknown error');
      return;
    }

    const platforms = data.data;
    console.log('\n📊 Platform Results:');
    console.log('-'.repeat(80));

    const platformKeys = [
      'google',
      'facebook', 
      'instagram',
      'twitter',
      'tiktok',
      'linkedin',
      'tripadvisor',
      'trustpilot',
      'yell',
      'checkatrade',
      'ratedpeople',
      'trustatrader',
    ];

    let foundCount = 0;
    let verifiedCount = 0;

    for (const key of platformKeys) {
      const platform = platforms[key];
      
      if (!platform) {
        console.log(`⚪ ${key.padEnd(15)} - Not returned`);
        continue;
      }

      const hasReviewUrl = !!platform.reviewUrl;
      const hasProfileUrl = !!platform.profileUrl;
      const verified = platform.verified === true;

      if (hasReviewUrl || hasProfileUrl) foundCount++;
      if (verified) verifiedCount++;

      let status = '❌';
      let details = '';

      if (hasReviewUrl && verified) {
        status = '✅';
        details = `Verified - ${platform.reviewUrl}`;
      } else if (hasReviewUrl && !verified) {
        status = '🟠';
        details = `Found (search) - ${platform.reviewUrl}`;
      } else if (hasProfileUrl) {
        status = '🔵';
        details = `Profile only - ${platform.profileUrl}`;
      } else {
        status = '⚪';
        details = 'No URL';
      }

      console.log(`${status} ${key.padEnd(15)} - ${details}`);
    }

    console.log('-'.repeat(80));
    console.log(`Summary: ${foundCount} platforms found, ${verifiedCount} verified`);
    
    // Check if expected platforms were found
    console.log('\n✓ Expected Platform Check:');
    let allFound = true;
    for (const expected of testCase.expectedPlatforms) {
      const platform = platforms[expected];
      const hasUrl = platform?.reviewUrl || platform?.profileUrl;
      if (hasUrl) {
        console.log(`  ✅ ${expected} - Found`);
      } else {
        console.log(`  ❌ ${expected} - NOT FOUND (expected)`);
        allFound = false;
      }
    }

    if (allFound) {
      console.log('\n🎉 All expected platforms found!');
    } else {
      console.log('\n⚠️  Some expected platforms missing');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

async function runTests() {
  console.log('🧪 Starting Platform Verification Tests');
  console.log('Make sure the dev server is running on http://localhost:3000\n');

  for (const testCase of testCases) {
    await testPlatformVerification(testCase);
    // Wait a bit between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ All tests completed!');
  console.log('='.repeat(80));
}

runTests().catch(console.error);
