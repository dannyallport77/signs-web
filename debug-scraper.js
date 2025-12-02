const cheerio = require('cheerio');

(async () => {
  try {
    const response = await fetch('https://portmandoors.co.uk', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      console.log('Failed to fetch:', response.status);
      return;
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    console.log('\n📄 Analyzing portmandoors.co.uk');
    console.log('Total links found:', $('a').length);
    
    const patterns = {
      facebook: /facebook\.com|fb\.com/i,
      instagram: /instagram\.com/i,
      twitter: /twitter\.com|x\.com/i,
      tiktok: /tiktok\.com/i,
      linkedin: /linkedin\.com/i,
    };

    const foundLinks = {
      facebook: new Set(),
      instagram: new Set(),
      twitter: new Set(),
      tiktok: new Set(),
      linkedin: new Set(),
    };

    $('a').each((i, el) => {
      const href = $(el).attr('href') || '';
      
      for (const [platform, pattern] of Object.entries(patterns)) {
        if (pattern.test(href)) {
          foundLinks[platform].add(href);
        }
      }
    });

    console.log('\n🔍 Social Media Links Found:');
    for (const [platform, urls] of Object.entries(foundLinks)) {
      if (urls.size > 0) {
        console.log('\n' + platform.toUpperCase() + ':');
        [...urls].slice(0, 5).forEach(url => console.log('  - ' + url));
        if (urls.size > 5) console.log('  ... and ' + (urls.size - 5) + ' more');
      } else {
        console.log('\n' + platform.toUpperCase() + ': ❌ Not found');
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
