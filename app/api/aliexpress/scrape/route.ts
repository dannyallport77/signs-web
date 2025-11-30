import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url || !url.includes('aliexpress.com')) {
      return NextResponse.json({ error: 'Valid AliExpress URL required' }, { status: 400 });
    }

    console.log('Fetching URL:', url);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.aliexpress.com/',
        'Cache-Control': 'no-cache'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`);
    }

    const html = await response.text();
    
    // Save HTML for debugging (first 50000 chars)
    console.log('HTML preview (first 1000 chars):', html.substring(0, 1000));
    
    // Look for data in the HTML
    const dataMatch = html.match(/window\.runParams\s*=\s*({.+?});/);
    if (dataMatch) {
      console.log('Found runParams in HTML, length:', dataMatch[1].length);
    } else {
      console.log('No runParams found in HTML');
    }
    
    const $ = cheerio.load(html);

    const data = {
      title: '',
      description: '',
      price: 0,
      images: [] as string[],
      videoUrl: '',
      options: [] as Array<{name: string, values: string[]}>,
      specifications: [] as Array<{name: string, value: string}>,
      url
    };

    // Look for the data in script tags
    let foundData = false;
    
    $('script').each((_, el) => {
      const scriptContent = $(el).html() || '';
      
      // Try to find window.runParams
      if (scriptContent.includes('window.runParams')) {
        try {
          // Extract the entire runParams object
          const runParamsMatch = scriptContent.match(/window\.runParams\s*=\s*({[\s\S]+?});[\s\n]/);
          if (runParamsMatch) {
            const runParams = JSON.parse(runParamsMatch[1]);
            const productData = runParams.data;
            
            if (!productData || typeof productData !== 'object') {
              console.log('runParams.data is invalid:', typeof productData);
              return;
            }
            
            console.log('Extracted keys:', Object.keys(productData));
            
            // Title
            if (productData.titleModule) {
              data.title = productData.titleModule.subject || '';
              console.log('Title:', data.title);
            }
            
            // Price
            if (productData.priceModule) {
              const pm = productData.priceModule;
              const minPrice = pm.minActivityAmount?.value || pm.minAmount?.value || '0';
              data.price = parseFloat(minPrice.toString());
              console.log('Price:', data.price, pm);
            }
            
            // Images
            if (productData.imageModule) {
              const imageList = productData.imageModule.imagePathList || [];
              data.images = imageList.map((img: string) => {
                if (img.startsWith('//')) return 'https:' + img;
                if (!img.startsWith('http')) return 'https://' + img;
                return img;
              });
              
              // Video
              if (productData.imageModule.videoUid) {
                data.videoUrl = `https://cloud.video.taobao.com/play/u/${productData.imageModule.videoUid}/p/1/e/6/t/1.mp4`;
              }
              
              console.log('Images:', data.images.length);
            }
            
            // Description
            if (productData.titleModule?.subject) {
              // Use product title as base description
              data.description = productData.titleModule.subject;
            }
            if (productData.pageModule?.description) {
              data.description = productData.pageModule.description;
            }
            
            // Product Options/SKU Properties
            if (productData.skuModule?.productSKUPropertyList) {
              data.options = productData.skuModule.productSKUPropertyList.map((prop: any) => ({
                name: prop.skuPropertyName || '',
                values: (prop.skuPropertyValues || []).map((v: any) => 
                  v.propertyValueDisplayName || v.propertyValueName || ''
                ).filter(Boolean)
              }));
              console.log('Options:', data.options);
            }
            
            // Specifications
            if (productData.specsModule?.props) {
              data.specifications = productData.specsModule.props.map((prop: any) => ({
                name: prop.attrName || prop.name || '',
                value: prop.attrValue || prop.value || ''
              })).filter((s: any) => s.name && s.value);
              console.log('Specifications:', data.specifications.length);
            }
            
            foundData = true;
          }
        } catch (e) {
          console.error('Error parsing runParams:', e);
        }
      }
    });

    // Fallback: Try to extract from DOM
    if (!foundData || !data.title) {
      console.log('Falling back to DOM extraction');
      
      // Title
      data.title = data.title || $('h1').first().text().trim() || 
                   $('.product-title-text').text().trim() ||
                   $('[data-pl="product-title"]').text().trim() ||
                   $('title').text().split('-')[0].trim();
      
      // Price from DOM
      if (!data.price) {
        const priceText = $('.product-price-value').first().text() ||
                         $('[itemprop="price"]').attr('content') ||
                         $('.price').first().text();
        const priceMatch = priceText.match(/[\d,]+\.?\d*/);
        if (priceMatch) {
          data.price = parseFloat(priceMatch[0].replace(/,/g, ''));
        }
      }
      
      // Images from DOM
      if (data.images.length === 0) {
        const imageSet = new Set<string>();
        $('img[src*="alicdn.com"]').each((_, el) => {
          const src = $(el).attr('src') || '';
          if (src && !src.includes('avatar') && !src.includes('logo') && !src.includes('icon')) {
            let imgUrl = src;
            if (imgUrl.startsWith('//')) imgUrl = 'https:' + imgUrl;
            // Get larger version
            imgUrl = imgUrl.replace(/_\d+x\d+\./, '_800x800.');
            imageSet.add(imgUrl);
          }
        });
        data.images = Array.from(imageSet).slice(0, 10);
      }
    }

    console.log('=== FINAL SCRAPED DATA ===');
    console.log('Title:', data.title);
    console.log('Price:', data.price);
    console.log('Images:', data.images.length);
    console.log('Options:', data.options.length);
    console.log('Specifications:', data.specifications.length);
    console.log('Description length:', data.description.length);

    return NextResponse.json({ 
      success: true, 
      data 
    });

  } catch (error: any) {
    console.error('Scraping error:', error);
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
}
