# Free Tier Web Scraping & Search APIs

This document outlines all the free tier services integrated into the review platform scraper.

## 📊 Quick Comparison

| Service | Free Tier | Best For | Setup |
|---------|-----------|----------|-------|
| **SearchAPI** | 100/month | Quick search results | API key |
| **SerpAPI** | 100/month | Google search results | API key |
| **Google CSE** | 100/day | Broad search | Free account |
| **Bright Data** | 500MB/mo | Rotating IPs | Free trial |
| **Scrapingbee** | 1000/month | Page rendering | API key |
| **ManyRequests** | 100/month | Rotating proxies | API key |
| **Apify** | 50 runs/month | Scheduled tasks | Free actors |
| **Oxylabs** | 1000 requests | Enterprise scraping | Free trial |

---

## 🔧 Service Details & Setup

### 1. **SearchAPI** ⭐ Recommended
- **Free Tier:** 100 API calls/month
- **What it does:** Returns structured search results
- **Best for:** Finding business profiles across platforms
- **Signup:** https://www.searchapi.io/pricing
- **Implementation:**
  ```typescript
  const apiKey = process.env.SEARCHAPI_KEY;
  const results = await findViaSearchAPI('Business Name', apiKey);
  ```
- **Pros:** Simple, reliable, includes rich snippets
- **Cons:** Limited monthly quota

---

### 2. **SerpAPI** ⭐ Recommended
- **Free Tier:** 100 API calls/month
- **What it does:** Scrapes Google, Bing, Baidu, etc.
- **Best for:** Finding exact business URLs
- **Signup:** https://serpapi.com/pricing
- **Implementation:**
  ```typescript
  const apiKey = process.env.SERPAPI_KEY;
  const results = await findViaSerpAPI('Business Name', apiKey);
  ```
- **Pros:** Multiple search engines, fast, structured output
- **Cons:** Limited quota

---

### 3. **Google Custom Search Engine (CSE)** ⭐ Best Free Option
- **Free Tier:** 100 searches/day (unlimited with API key)
- **What it does:** Search within specific domains
- **Best for:** Finding platforms like "site:trustpilot.com"
- **Signup:** https://cse.google.com
- **Implementation:**
  ```typescript
  const cseId = process.env.GOOGLE_CSE_ID;
  const apiKey = process.env.GOOGLE_API_KEY; // 1000/day free
  const results = await findViaGoogleCSE(businessName, cseId, apiKey);
  ```
- **Pros:** Most generous free tier, reliable, no billing required
- **Cons:** Requires setup (10 min), slower than paid APIs

---

### 4. **Scrapingbee** ✅ Great for JavaScript Sites
- **Free Tier:** 1000 requests/month
- **What it does:** Renders JavaScript and returns HTML
- **Best for:** Modern single-page apps, dynamic content
- **Signup:** https://www.scrapingbee.com/pricing
- **Implementation:**
  ```typescript
  const apiKey = process.env.SCRAPINGBEE_KEY;
  const html = await scrapeWithScrapingBee(url, apiKey);
  ```
- **Pros:** Handles JS rendering, rotating IPs included
- **Cons:** Slower than simple HTTP requests

---

### 5. **Bright Data (formerly Luminati)** 💪 Advanced
- **Free Tier:** 500MB/month + 100 IP rotations
- **What it does:** Residential proxy network + Web Unlocker
- **Best for:** Bypassing IP bans, accessing blocked content
- **Signup:** https://brightdata.com/free-trial
- **Implementation:**
  ```typescript
  const apiKey = process.env.BRIGHTDATA_KEY;
  const html = await scrapeWithBrightData(url, apiKey);
  ```
- **Pros:** Powerful, handles blocks, large free allocation
- **Cons:** Setup complex, overkill for simple cases

---

### 6. **Apify** 🤖 Task Automation
- **Free Tier:** 50 task runs/month (unlimited free actors)
- **What it does:** Pre-built scraping tasks & custom actors
- **Best for:** Scheduled scraping, complex extraction
- **Signup:** https://apify.com
- **Implementation:**
  ```typescript
  const apiKey = process.env.APIFY_KEY;
  const results = await findViaApify(businessName, apiKey);
  ```
- **Pre-built Actors:**
  - Google Search Results (free)
  - Web page scraper (free)
  - Google Maps scraper (free)
- **Pros:** Low-code, powerful, great documentation
- **Cons:** Learning curve, limited monthly quota

---

### 7. **ManyRequests** 🔄 Rotating IPs
- **Free Tier:** 100 requests/month with rotating IPs
- **What it does:** Simple proxy service for web requests
- **Best for:** Avoiding IP bans
- **Signup:** https://manyrequests.com
- **Implementation:**
  ```typescript
  const apiKey = process.env.MANYREQUESTS_KEY;
  const html = await scrapeWithManyRequests(url, apiKey);
  ```
- **Pros:** Simple, rotating IPs, cheap paid plans
- **Cons:** Very limited free tier

---

### 8. **Oxylabs** 🏢 Enterprise
- **Free Trial:** 1000 requests/month (1 month trial)
- **What it does:** Enterprise-grade scraping with residential IPs
- **Best for:** Large-scale scraping
- **Signup:** https://oxylabs.io/free-trial
- **Implementation:**
  ```typescript
  const html = await findViaOxylabs(url, username, password);
  ```
- **Pros:** Most reliable, enterprise support
- **Cons:** Requires trial setup

---

## 🎯 Recommended Setup (Free)

For a business with minimal API costs:

```typescript
// .env.local
GOOGLE_API_KEY=your_key           # 1000 searches/day free
GOOGLE_CSE_ID=your_cse_id         # Set up free CSE
SEARCHAPI_KEY=your_key            # 100/month
SERPAPI_KEY=your_key              # 100/month
SCRAPINGBEE_KEY=your_key          # 1000/month
```

### Usage Order (Most to Least Effective):
1. **Extract from website** (free, instant)
2. **Google CSE** (free, generous quota)
3. **SearchAPI** (100/month)
4. **SerpAPI** (100/month)
5. **Scrapingbee** (1000/month, for JS-heavy sites)

---

## 📈 Quota Management

Track your API usage:

```typescript
// Create a simple quota tracker
const quotaTracker = {
  google_cse: { used: 0, limit: 100 }, // per day
  searchapi: { used: 0, limit: 100 },   // per month
  serpapi: { used: 0, limit: 100 },     // per month
};

// Log each API call
function logApiCall(service: string) {
  quotaTracker[service as keyof typeof quotaTracker].used++;
}
```

---

## 🔑 Getting API Keys

### Quick Setup Checklist

- [ ] **Google API Key**
  - Go to https://console.cloud.google.com
  - Create new project → Enable Custom Search API
  - Create API key credential (free tier: 1000/day)

- [ ] **Google CSE**
  - Go to https://cse.google.com
  - Create search engine with business review platforms
  - Get CSE ID (starts with "0173..." or similar)

- [ ] **SearchAPI**
  - Sign up at https://www.searchapi.io
  - Copy API key from dashboard
  - 100 calls/month free

- [ ] **SerpAPI**
  - Sign up at https://serpapi.com
  - Copy API key from settings
  - 100 calls/month free

- [ ] **ScrapingBee**
  - Sign up at https://www.scrapingbee.com
  - Copy API key
  - 1000 requests/month free

---

## 🚀 Usage Examples

### Find All Platforms for a Business

```typescript
import { findBusinessPlatforms } from '@/lib/scrapers/review-platform-scraper';

const platforms = await findBusinessPlatforms('Coffee Shop XYZ', {
  website: 'https://coffeeshopxyz.com',
  googleCseId: process.env.GOOGLE_CSE_ID,
  googleApiKey: process.env.GOOGLE_API_KEY,
  searchApiKey: process.env.SEARCHAPI_KEY,
  serpApiKey: process.env.SERPAPI_KEY,
  scrapingBeeKey: process.env.SCRAPINGBEE_KEY,
});

console.log(platforms);
// Output:
// {
//   trustpilot: { url: '...', verified: true, foundVia: 'google_cse' },
//   facebook: { url: '...', verified: true, foundVia: 'website' },
//   google: { url: '...', verified: true, foundVia: 'google_cse' },
//   ...
// }
```

### Extract Links from Website Only

```typescript
import { extractLinksFromWebsite } from '@/lib/scrapers/review-platform-scraper';

const links = await extractLinksFromWebsite('https://example.com');
// Instantly returns any review/social links found on the site
```

### Verify URL Works

```typescript
import { verifyUrl } from '@/lib/scrapers/review-platform-scraper';

const isValid = await verifyUrl('https://trustpilot.com/review/...');
// Returns true/false
```

---

## 💰 Cost Analysis (Monthly)

| Usage Level | Google CSE | SearchAPI | SerpAPI | ScrapingBee | Estimated Cost |
|------------|-----------|-----------|---------|-------------|-----------------|
| **Light** | Free* | Free | Free | Free | $0 |
| **Medium** | Free* | Free | Free | Free | $0 |
| **Heavy** | $0 | ~$15 | ~$15 | ~$35 | ~$65 |

*100/day = 3000/month free

---

## 🎁 Bonus: Free Data Sources

1. **Google Maps API** - Free for up to 28,000 requests/month
2. **TrustPilot API** - Free for research (rate limited)
3. **Open Street Map** - Completely free business data
4. **Wikidata** - Free business information
5. **DBpedia** - Free structured data extraction

---

## ⚠️ Rate Limiting & Ethical Scraping

Always:
- Respect `robots.txt`
- Add delays between requests
- Identify your scraper in User-Agent
- Check Terms of Service
- Use official APIs when available
- Rotate IPs to avoid blocks

```typescript
// Example: Add delay between requests
async function delayMs(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

for (const business of businesses) {
  const platforms = await findBusinessPlatforms(business.name, options);
  await delayMs(1000); // Wait 1 second between requests
}
```

---

## 🐛 Troubleshooting

**"403 Forbidden" errors?**
- Use ScrapingBee or Bright Data
- Add rotating IP service
- Check robots.txt

**"Rate limited"?**
- Add delays between requests
- Use multiple API keys
- Queue requests with a job system

**"Results are empty"?**
- Check API key is valid
- Verify website/business exists
- Try Google CSE first (most reliable)
- Fall back to Scrapingbee for JS-heavy sites
