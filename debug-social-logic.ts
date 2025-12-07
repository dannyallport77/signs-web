import * as cheerio from 'cheerio';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local or .env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// --- Copied Logic from app/api/places/social-media/route.ts ---

interface SocialMediaLinks {
  google?: { reviewUrl?: string; mapsUrl?: string };
  facebook?: { profileUrl?: string; reviewUrl?: string; verified?: boolean };
  instagram?: { profileUrl?: string; reviewUrl?: string; verified?: boolean };
  tiktok?: { profileUrl?: string; verified?: boolean };
  twitter?: { profileUrl?: string; verified?: boolean };
  youtube?: { profileUrl?: string; verified?: boolean };
  linkedin?: { profileUrl?: string; verified?: boolean };
  tripadvisor?: { profileUrl?: string; reviewUrl?: string; searchUrl?: string; note?: string; verified?: boolean };
  trustpilot?: { profileUrl?: string; reviewUrl?: string; searchUrl?: string; note?: string; verified?: boolean };
  yell?: { profileUrl?: string; reviewUrl?: string; searchUrl?: string; note?: string; verified?: boolean };
  checkatrade?: { profileUrl?: string; reviewUrl?: string; searchUrl?: string; note?: string; verified?: boolean };
  ratedpeople?: { profileUrl?: string; reviewUrl?: string; searchUrl?: string; note?: string; verified?: boolean };
  trustatrader?: { profileUrl?: string; reviewUrl?: string; searchUrl?: string; note?: string; verified?: boolean };
}

// Helper to verify URL exists and returns 200
async function verifyUrl(url: string, timeoutMs: number = 5000): Promise<boolean> {
  try {
    console.log(`Verifying URL: ${url}`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    clearTimeout(timeoutId);
    const isValid = response.status >= 200 && response.status < 400;
    console.log(`URL ${url} is ${isValid ? 'VALID' : 'INVALID'} (${response.status})`);
    return isValid;
  } catch (error) {
    console.log(`URL ${url} verification failed: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

// Scrape a website for social media links
async function scrapeWebsiteForSocialMedia(websiteUrl: string, timeoutMs: number = 5000): Promise<Partial<SocialMediaLinks>> {
  console.log(`Scraping website: ${websiteUrl}`);
  const links: Partial<SocialMediaLinks> = {};
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    const response = await fetch(websiteUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
        console.log(`Failed to fetch website: ${response.status}`);
        return links;
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Look for social media links in href attributes
    const allLinks = new Set<string>();
    $('a').each((_, el) => {
      const href = $(el).attr('href') || '';
      if (href) allLinks.add(href.toLowerCase());
    });

    console.log(`Found ${allLinks.size} links on page.`);

    // Find Facebook
    for (const link of allLinks) {
      if (link.includes('facebook.com/') || link.includes('fb.com/')) {
        try {
          const urlObj = new URL(link.startsWith('http') ? link : `https://${link}`);
          const url = urlObj.origin + urlObj.pathname;
          const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;
          console.log(`Found Facebook link: ${url}`);
          links.facebook = { 
            profileUrl: url, 
            reviewUrl: `${cleanUrl}/reviews`,
            verified: true 
          };
          break;
        } catch (e) {
          const url = link.startsWith('http') ? link : `https://${link}`;
          links.facebook = { profileUrl: url, verified: true };
        }
      }
    }

    // Find Instagram
    for (const link of allLinks) {
      if (link.includes('instagram.com/')) {
        const url = new URL(link.startsWith('http') ? link : `https://${link}`).href;
        console.log(`Found Instagram link: ${url}`);
        links.instagram = { profileUrl: url, verified: true };
        break;
      }
    }

    // Find Twitter
    for (const link of allLinks) {
      if (link.includes('twitter.com/') || link.includes('x.com/')) {
        const url = new URL(link.startsWith('http') ? link : `https://${link}`).href;
        console.log(`Found Twitter link: ${url}`);
        links.twitter = { profileUrl: url, verified: true };
        break;
      }
    }

    // Find YouTube
    for (const link of allLinks) {
      if (link.includes('youtube.com/') || link.includes('youtu.be/')) {
        if (link.includes('/channel/') || link.includes('/c/') || link.includes('/user/') || link.includes('/@')) {
          const url = new URL(link.startsWith('http') ? link : `https://${link}`).href;
          console.log(`Found YouTube link: ${url}`);
          links.youtube = { profileUrl: url, verified: true };
          break;
        }
      }
    }

    // Find TikTok
    for (const link of allLinks) {
      if (link.includes('tiktok.com/')) {
        const url = new URL(link.startsWith('http') ? link : `https://${link}`).href;
        console.log(`Found TikTok link: ${url}`);
        links.tiktok = { profileUrl: url, verified: true };
        break;
      }
    }

    // Find LinkedIn
    for (const link of allLinks) {
      if (link.includes('linkedin.com/')) {
        try {
          let cleanedUrl = link.split('?')[0].split('#')[0];
          if (!cleanedUrl.startsWith('http')) {
            cleanedUrl = `https://${cleanedUrl}`;
          }
          cleanedUrl = cleanedUrl.replace(/https?:\/\/[a-z]{2}\.linkedin\.com\//i, 'https://www.linkedin.com/');
          cleanedUrl = cleanedUrl.replace(/https?:\/\/linkedin\.com\//i, 'https://www.linkedin.com/');
          cleanedUrl = cleanedUrl.replace(/([/in|/company][/a-z0-9-]*)\/$/, '$1');
          
          const url = new URL(cleanedUrl).href;
          console.log(`Found LinkedIn link: ${url}`);
          links.linkedin = { profileUrl: url, verified: true };
          break;
        } catch (error) {
          console.error('Error parsing LinkedIn URL:', error);
        }
      }
    }

    // Find Trustpilot
    for (const link of allLinks) {
      if (link.includes('trustpilot.com/review/')) {
        const url = new URL(link.startsWith('http') ? link : `https://${link}`).href;
        console.log(`Found Trustpilot link: ${url}`);
        links.trustpilot = { profileUrl: url, reviewUrl: url, verified: true };
        break;
      }
    }

    return links;
  } catch (error) {
    console.error(`Error scraping website for social media:`, error);
    return links;
  }
}

// Search Google via SerpAPI
async function findUrlViaSerpAPI(businessName: string, platform: string, address?: string): Promise<string | null> {
  const serpApiKey = process.env.SERPAPI_KEY;
  
  if (!serpApiKey) {
    console.warn('SERPAPI_KEY not configured, skipping Google search');
    return null;
  }

  console.log(`Searching SerpAPI for ${platform}...`);

  try {
    const searchQuery = `${businessName} ${platform}${address ? ` ${address}` : ''}`;
    const url = `https://serpapi.com/search?engine=google&q=${encodeURIComponent(searchQuery)}&api_key=${serpApiKey}`;
    
    const response = await fetch(url, {
      signal: AbortSignal.timeout(5000),
    });
    
    if (!response.ok) {
        console.log(`SerpAPI failed: ${response.status}`);
        return null;
    }
    
    const data = await response.json();
    
    const organicResults = data.organic_results || [];
    const locationTokens = (address || '')
      .split(/[,\s]+/)
      .map((token: string) => token.trim().toLowerCase())
      .filter((token: string) => token.length > 2);
    
    const platformDomains: Record<string, string[]> = {
      facebook: ['facebook.com/', 'fb.com/'],
      instagram: ['instagram.com/'],
      twitter: ['twitter.com/', 'x.com/'],
      youtube: ['youtube.com/channel/', 'youtube.com/c/', 'youtube.com/user/', 'youtube.com/@'],
      tiktok: ['tiktok.com/@'],
      linkedin: ['linkedin.com/company/', 'linkedin.com/in/'],
      trustpilot: ['trustpilot.com/review/', 'uk.trustpilot.com/review/'],
      tripadvisor: ['tripadvisor.com/Restaurant_Review', 'tripadvisor.com/Hotel_Review', 'tripadvisor.com/Attraction_Review', 'tripadvisor.co.uk/Restaurant_Review', 'tripadvisor.co.uk/Hotel_Review'],
      yell: ['yell.com/biz/'],
      checkatrade: ['checkatrade.com/trades/'],
      ratedpeople: ['ratedpeople.com/tradesman/', 'ratedpeople.com/profile/'],
      trustatrader: ['trustatrader.com/trader/'],
    };
    
    const domains = platformDomains[platform.toLowerCase()];
    if (!domains) return null;
    
    for (const result of organicResults) {
      const link = (result.link || '').toLowerCase();
      const title = (result.title || '').toLowerCase();
      const snippet = (result.snippet || '').toLowerCase();

      const matchesLocation = locationTokens.length === 0 || locationTokens.some(token =>
        link.includes(token) || title.includes(token) || snippet.includes(token)
      );

      if (!matchesLocation) continue;

      for (const domain of domains) {
        if (link.includes(domain) && !link.includes('/search')) {
          const foundUrl = (result.link || '').split('?')[0].split('#')[0];
          console.log(`SerpAPI found ${platform} URL: ${foundUrl}`);
          return foundUrl;
        }
      }
    }
    
    console.log(`SerpAPI found no matching ${platform} URL.`);
    return null;
  } catch (error) {
    console.error(`Error finding ${platform} via SerpAPI:`, error);
    return null;
  }
}

// Use AI to find URL
async function findUrlViaAI(businessName: string, platform: string, address?: string, website?: string): Promise<string | null> {
  const openaiKey = process.env.OPENAI_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  
  if (!openaiKey && !geminiKey) {
    console.log('No AI keys configured.');
    return null;
  }

  console.log(`Searching AI for ${platform}...`);

  try {
    const prompt = `Find the exact ${platform} review page URL for this business:
Business Name: ${businessName}
${address ? `Address: ${address}` : ''}
${website ? `Website: ${website}` : ''}

Instructions:
- Search for their official ${platform} page
- Return ONLY the direct ${platform} review/profile URL
- For Trustpilot, it should be in format: https://www.trustpilot.com/review/domain-name
- If you cannot find a verified page, return "NOT_FOUND"
- Do not guess or make up URLs
- Verify the business actually has a ${platform} presence

Response format: Just the URL or "NOT_FOUND"`;

    let url: string | null = null;

    if (openaiKey) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.1,
            max_tokens: 200,
          }),
          signal: AbortSignal.timeout(10000),
        });

        if (response.ok) {
          const data = await response.json();
          const content = data.choices?.[0]?.message?.content?.trim();
          if (content && content !== 'NOT_FOUND' && content.startsWith('http')) {
            url = content;
            console.log(`OpenAI found URL: ${url}`);
          }
        }
      } catch (error) {
        console.error('OpenAI search failed:', error);
      }
    }

    if (!url && geminiKey) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 200,
            },
          }),
          signal: AbortSignal.timeout(10000),
        });

        if (response.ok) {
          const data = await response.json();
          const content = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (content && content !== 'NOT_FOUND' && content.startsWith('http')) {
            url = content;
            console.log(`Gemini found URL: ${url}`);
          }
        }
      } catch (error) {
        console.error('Gemini search failed:', error);
      }
    }

    if (url && await verifyUrl(url, 5000)) {
      return url;
    }

    return null;
  } catch (error) {
    console.error(`Error finding ${platform} via AI:`, error);
    return null;
  }
}

// --- Main Execution ---

async function main() {
    const args = process.argv.slice(2);
    if (args.length < 1) {
        console.log('Usage: npx tsx debug-social-logic.ts <businessName> [address] [website] [placeId]');
        process.exit(1);
    }

    const businessName = args[0];
    const address = args[1];
    const website = args[2];
    const placeId = args[3];

    console.log('--- Debugging Social Media Logic ---');
    console.log(`Business: ${businessName}`);
    console.log(`Address: ${address || 'N/A'}`);
    console.log(`Website: ${website || 'N/A'}`);
    console.log(`Place ID: ${placeId || 'N/A'}`);
    console.log('------------------------------------');

    let links: SocialMediaLinks = {};

    // 0. Google Links (if placeId provided)
    if (placeId) {
        const googleQuery = `${businessName} reviews${address ? ` ${address}` : ''}`.trim();
        links.google = {
            reviewUrl: `https://search.google.com/local/writereview?placeid=${placeId}`,
            mapsUrl: `https://www.google.com/maps/place/?q=place_id:${placeId}`,
        };
    } else {
        const googleQuery = `${businessName} reviews${address ? ` ${address}` : ''}`.trim();
        links.google = {
            reviewUrl: `https://www.google.com/search?q=${encodeURIComponent(googleQuery)}`,
            mapsUrl: `https://www.google.com/maps/search/${encodeURIComponent(businessName + (address ? ` ${address}` : ''))}`,
        };
    }

    // 1. Scrape Website
    if (website) {
        console.log('\n[Step 1] Scraping Website...');
        const scrapedLinks = await scrapeWebsiteForSocialMedia(website, 5000);
        links = { ...links, ...scrapedLinks };
    }

    // 2. Search External (Facebook)
    if (!links.facebook) {
        console.log('\n[Step 2] Searching for Facebook...');
        let facebookUrl = await findUrlViaSerpAPI(businessName, 'facebook', address);
        if (!facebookUrl) {
            facebookUrl = await findUrlViaAI(businessName, 'facebook', address, website);
        }
        if (facebookUrl) {
            const cleanUrl = facebookUrl.endsWith('/') ? facebookUrl.slice(0, -1) : facebookUrl;
            links.facebook = { 
                profileUrl: facebookUrl, 
                reviewUrl: `${cleanUrl}/reviews`,
                verified: true 
            };
        }
    }

    // 3. Search External (Instagram)
    if (!links.instagram) {
        console.log('\n[Step 3] Searching for Instagram...');
        let instagramUrl = await findUrlViaSerpAPI(businessName, 'instagram', address);
        if (!instagramUrl) {
            instagramUrl = await findUrlViaAI(businessName, 'instagram', address, website);
        }
        if (instagramUrl) {
            links.instagram = { profileUrl: instagramUrl, verified: true };
        }
    }

    // 4. Search External (YouTube)
    if (!links.youtube) {
        console.log('\n[Step 4] Searching for YouTube...');
        let youtubeUrl = await findUrlViaSerpAPI(businessName, 'youtube', address);
        if (!youtubeUrl) {
            youtubeUrl = await findUrlViaAI(businessName, 'youtube', address, website);
        }
        if (youtubeUrl) {
            links.youtube = { profileUrl: youtubeUrl, verified: true };
        }
    }

    console.log('\n--- Final Results ---');
    console.log(JSON.stringify(links, null, 2));
}

main();
