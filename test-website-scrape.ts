// Test if we can scrape social media links from Pizza Corner website
import * as cheerio from 'cheerio';

async function scrapeWebsiteForSocialMedia(websiteUrl: string) {
  const links: any = {};
  
  try {
    console.log(`Fetching ${websiteUrl}...`);
    
    const response = await fetch(websiteUrl, {
      signal: AbortSignal.timeout(5000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      console.log(`❌ Response not OK: ${response.status}`);
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

    console.log(`\n✅ Found ${allLinks.size} links on page:`);
    
    const socialPlatforms = [
      'facebook.com', 'fb.com',
      'instagram.com',
      'twitter.com', 'x.com',
      'youtube.com',
      'tiktok.com',
      'linkedin.com',
      'tripadvisor.com', 'tripadvisor.co.uk',
      'trustpilot.com',
      'yelp.com', 'yelp.co.uk',
      'yell.com'
    ];
    
    for (const link of allLinks) {
      for (const platform of socialPlatforms) {
        if (link.includes(platform)) {
          console.log(`  - ${link}`);
          links[platform.split('.')[0]] = link;
          break;
        }
      }
    }
    
    if (Object.keys(links).length === 0) {
      console.log('  ❌ No social media links found');
      console.log('\nAll links found:');
      Array.from(allLinks).slice(0, 20).forEach(link => console.log(`  - ${link}`));
    }

    return links;
  } catch (error: any) {
    console.error(`❌ Error scraping website:`, error.message);
    return links;
  }
}

async function main() {
  console.log('🍕 Testing Pizza Corner Bolton website scraping\n');
  
  const website = 'https://pizzacornerbolton.com';
  const results = await scrapeWebsiteForSocialMedia(website);
  
  console.log('\n📊 Results:');
  console.log(JSON.stringify(results, null, 2));
}

main().catch(console.error);
