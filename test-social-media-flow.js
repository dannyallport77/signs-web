// const fetch = require('node-fetch'); // Using global fetch in Node 18+

const BASE_URL = 'http://127.0.0.1:3000';

const queries = [
  'Portman Doors Bolton',
  'Greggs Manchester Arndale',
  'Dishoom Manchester',
  'The Ivy Manchester'
];

async function testBusiness(query) {
  console.log(`\n--------------------------------------------------`);
  console.log(`🔎 Searching for: "${query}"`);
  
  try {
    // Step 1: Search for the place
    const searchUrl = `${BASE_URL}/api/places/text-search?query=${encodeURIComponent(query)}`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    if (!searchData.success || searchData.data.length === 0) {
      console.log('❌ No results found for query.');
      return;
    }

    const place = searchData.data[0];
    console.log(`📍 Found Place: ${place.name}`);
    console.log(`   Address: ${place.address}`);
    console.log(`   Place ID: ${place.placeId}`);

    // Step 2: Get Social Media Links
    console.log(`\n🕵️  Finding Social Media Links...`);
    const socialUrl = `${BASE_URL}/api/places/social-media?businessName=${encodeURIComponent(place.name)}&address=${encodeURIComponent(place.address)}&placeId=${place.placeId}`;
    
    const startTime = Date.now();
    const socialRes = await fetch(socialUrl);
    const socialData = await socialRes.json();
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    if (socialData.success) {
      console.log(`✅ Success (${duration}s)`);
      console.log(`   Cached: ${socialData.cached}`);
      
      const links = socialData.data;
      if (links.facebook) console.log(`   📘 Facebook: ${links.facebook.profileUrl} ${links.facebook.verified ? '(Verified)' : ''}`);
      if (links.instagram) console.log(`   📸 Instagram: ${links.instagram.profileUrl} ${links.instagram.verified ? '(Verified)' : ''}`);
      if (links.linkedin) console.log(`   💼 LinkedIn: ${links.linkedin.profileUrl} ${links.linkedin.verified ? '(Verified)' : ''}`);
      if (links.twitter) console.log(`   🐦 Twitter: ${links.twitter.profileUrl} ${links.twitter.verified ? '(Verified)' : ''}`);
      if (links.tiktok) console.log(`   🎵 TikTok: ${links.tiktok.profileUrl} ${links.tiktok.verified ? '(Verified)' : ''}`);
      if (links.youtube) console.log(`   ▶️ YouTube: ${links.youtube.profileUrl} ${links.youtube.verified ? '(Verified)' : ''}`);
      
      if (!links.facebook && !links.instagram && !links.linkedin && !links.twitter && !links.tiktok && !links.youtube) {
        console.log('   ⚠️  No social links found.');
      }
    } else {
      console.log(`❌ Failed: ${socialData.error}`);
    }

  } catch (error) {
    console.error('💥 Error:', error.message);
  }
}

async function runTests() {
  for (const query of queries) {
    await testBusiness(query);
  }
}

runTests();
