// Test script to check why Pizza Corner Farnworth isn't being found
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const businessName = 'Pizza Corner Farnworth';
const address = 'Bolton, Greater Manchester';

async function testSerpAPI(platform: string, query: string) {
  const serpApiKey = process.env.SERPAPI_KEY;
  
  if (!serpApiKey) {
    console.log('❌ SERPAPI_KEY not configured');
    return;
  }

  console.log(`\n🔍 Testing ${platform} search with query: "${query}"`);
  
  try {
    const url = `https://serpapi.com/search?engine=google&q=${encodeURIComponent(query)}&api_key=${serpApiKey}`;
    
    const response = await fetch(url, {
      signal: AbortSignal.timeout(8000),
    });
    
    if (!response.ok) {
      console.log(`❌ API response not OK: ${response.status}`);
      const text = await response.text();
      console.log('Response:', text.substring(0, 500));
      return;
    }
    
    const data = await response.json();
    
    console.log(`✅ Got ${data.organic_results?.length || 0} organic results`);
    
    if (data.organic_results && data.organic_results.length > 0) {
      console.log('\n📋 First 5 results:');
      data.organic_results.slice(0, 5).forEach((result: any, i: number) => {
        console.log(`\n${i + 1}. ${result.title}`);
        console.log(`   Link: ${result.link}`);
        console.log(`   Snippet: ${result.snippet?.substring(0, 100)}...`);
      });
    }
    
    // Check for rate limit info
    if (data.search_metadata) {
      console.log('\n📊 Search metadata:');
      console.log(`   Status: ${data.search_metadata.status}`);
      if (data.search_metadata.total_time_taken) {
        console.log(`   Time: ${data.search_metadata.total_time_taken}s`);
      }
    }
    
    // Check if we're rate limited
    if (data.error) {
      console.log('\n⚠️  Error from SerpAPI:', data.error);
    }
    
  } catch (error: any) {
    console.log(`❌ Error: ${error.message}`);
  }
}

async function main() {
  console.log('🍕 Testing Pizza Corner Farnworth social media detection\n');
  console.log('Expected links:');
  console.log('- TripAdvisor: https://www.tripadvisor.co.uk/Restaurant_Review-g187053-d27878804-Reviews-Pizza_Corner-Bolton_Greater_Manchester_England.html');
  console.log('- Website: https://pizzacornerbolton.com/storemenu');
  console.log('- Yelp: https://www.yelp.com/biz/pizza-corner-bolton');
  console.log('- Facebook: https://www.facebook.com/profile.php?id=100063675421770');
  
  // Test various search queries
  await testSerpAPI('TripAdvisor', `${businessName} tripadvisor ${address}`);
  await testSerpAPI('Yelp', `${businessName} yelp ${address}`);
  await testSerpAPI('Facebook', `${businessName} facebook ${address}`);
  
  // Test if we can access account info
  console.log('\n\n🔑 Checking SerpAPI account status...');
  try {
    const accountUrl = `https://serpapi.com/account?api_key=${process.env.SERPAPI_KEY}`;
    const response = await fetch(accountUrl);
    const data = await response.json();
    
    if (data.account_email) {
      console.log(`✅ Account: ${data.account_email}`);
      console.log(`   Plan: ${data.plan || 'free'}`);
      console.log(`   Searches this month: ${data.this_month_usage || 0} / ${data.plan_searches_left !== undefined ? data.plan_searches_left + data.this_month_usage : '100'}`);
      console.log(`   Searches remaining: ${data.plan_searches_left !== undefined ? data.plan_searches_left : 'unknown'}`);
    } else {
      console.log('⚠️  Could not get account info');
      console.log('Response:', JSON.stringify(data, null, 2));
    }
  } catch (error: any) {
    console.log(`❌ Error checking account: ${error.message}`);
  }
}

main().catch(console.error);
