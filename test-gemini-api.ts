// Test Gemini API for finding social media links
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function testGeminiSearch(businessName: string, platform: string) {
  const geminiKey = process.env.GEMINI_API_KEY;
  
  if (!geminiKey) {
    console.log('❌ GEMINI_API_KEY not configured');
    return;
  }

  console.log(`\n🔍 Searching for ${businessName} on ${platform}...`);
  
  try {
    const prompt = `Find the official ${platform} page URL for the business "${businessName}" in Bolton, UK. 
    
Return ONLY the exact URL, nothing else. If you cannot find it with high confidence, return "NOT_FOUND".

Examples of valid responses:
- https://www.facebook.com/profile.php?id=100063675421770
- https://www.tripadvisor.co.uk/Restaurant_Review-g187053-d27878804
- NOT_FOUND`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 500,
            candidateCount: 1,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.log(`❌ API Error (${response.status}):`, error.substring(0, 200));
      return;
    }

    const data = await response.json();
    console.log('   Raw response:', JSON.stringify(data, null, 2).substring(0, 500));
    const result = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    
    if (result) {
      console.log(`✅ Result: ${result}`);
      
      // Check if it's a valid URL
      if (result !== 'NOT_FOUND' && result.startsWith('http')) {
        console.log(`   ✓ Valid URL found!`);
      } else if (result === 'NOT_FOUND') {
        console.log(`   ⚠️  Not found`);
      } else {
        console.log(`   ⚠️  Unexpected response format`);
      }
    } else {
      console.log('❌ No result returned');
    }
    
  } catch (error: any) {
    console.log(`❌ Error: ${error.message}`);
  }
}

async function main() {
  console.log('🍕 Testing Gemini API for Pizza Corner Farnworth\n');
  
  const businessName = 'Pizza Corner Farnworth';
  
  await testGeminiSearch(businessName, 'Facebook');
  await testGeminiSearch(businessName, 'TripAdvisor');
  await testGeminiSearch(businessName, 'Yelp');
  
  console.log('\n✅ Gemini API is now configured as a fallback when SerpAPI runs out!');
  console.log('The system will automatically use Gemini when SerpAPI is unavailable.');
}

main().catch(console.error);
