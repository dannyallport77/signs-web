/**
 * Interactive Test Runner
 * 
 * Run: npx ts-node __tests__/interactive-test-runner.ts
 * 
 * This provides an interactive CLI for testing NFC programming workflows
 * and other functionality that requires user interaction.
 */

import * as readline from 'readline';
import { BASE_URL, authenticatedFetch, sleep } from './setup';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function prompt(question: string): Promise<string> {
  return new Promise(resolve => {
    rl.question(question, answer => resolve(answer.trim()));
  });
}

function printHeader(title: string) {
  console.log('\n' + '='.repeat(60));
  console.log(`  ${title}`);
  console.log('='.repeat(60) + '\n');
}

function printSuccess(message: string) {
  console.log(`✅ ${message}`);
}

function printError(message: string) {
  console.log(`❌ ${message}`);
}

function printInfo(message: string) {
  console.log(`ℹ️  ${message}`);
}

// ============================================================================
// TEST FUNCTIONS
// ============================================================================

async function testDatabaseConnection() {
  printHeader('Testing Database Connection');
  
  try {
    const response = await fetch(`${BASE_URL}/api/db-ping`);
    const data = await response.json();
    
    if (data.ok) {
      printSuccess('Database connection successful');
      return true;
    } else {
      printError('Database connection failed');
      return false;
    }
  } catch (error) {
    printError(`Database test failed: ${error}`);
    return false;
  }
}

async function testHealthEndpoint() {
  printHeader('Testing Health Endpoint');
  
  try {
    const response = await fetch(`${BASE_URL}/api/health`);
    const data = await response.json();
    
    console.log('Health status:', JSON.stringify(data, null, 2));
    
    if (data.status === 'healthy') {
      printSuccess('Health check passed');
      return true;
    } else {
      printError('Health check failed');
      return false;
    }
  } catch (error) {
    printError(`Health test failed: ${error}`);
    return false;
  }
}

async function testMobileLogin() {
  printHeader('Testing Mobile Login');
  
  const email = await prompt('Enter test user email: ');
  const password = await prompt('Enter test user password: ');
  
  try {
    const response = await fetch(`${BASE_URL}/api/mobile/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    const data = await response.json();
    
    if (data.token) {
      printSuccess('Login successful');
      console.log('Token (first 50 chars):', data.token.substring(0, 50) + '...');
      return data.token;
    } else {
      printError(`Login failed: ${data.error || 'Unknown error'}`);
      return null;
    }
  } catch (error) {
    printError(`Login test failed: ${error}`);
    return null;
  }
}

async function testNFCTaskCreation(token: string) {
  printHeader('Testing NFC Task Creation');
  
  const businessName = await prompt('Enter business name (or press Enter for test): ') || 'TEST_Business';
  const reviewUrl = await prompt('Enter review URL (or press Enter for test): ') || 'https://g.page/test-business';
  
  try {
    const response = await authenticatedFetch('/api/nfc-tasks', {
      method: 'POST',
      body: JSON.stringify({
        businessName,
        reviewUrl,
        placeId: 'test_place_id',
        latitude: 51.5074,
        longitude: -0.1278,
      }),
    }, token);
    
    const data = await response.json();
    
    if (data.id) {
      printSuccess(`NFC Task created with ID: ${data.id}`);
      return data.id;
    } else {
      printError(`Task creation failed: ${JSON.stringify(data)}`);
      return null;
    }
  } catch (error) {
    printError(`Task creation test failed: ${error}`);
    return null;
  }
}

async function testNFCTaskPolling(token: string) {
  printHeader('Testing NFC Task Polling (Remote Device Simulation)');
  
  printInfo('This simulates a mobile device polling for NFC programming tasks...');
  
  const deviceId = await prompt('Enter device ID (or press Enter for test): ') || 'test-device-001';
  const pollDuration = parseInt(await prompt('Poll duration in seconds (default 30): ') || '30');
  
  printInfo(`Polling for ${pollDuration} seconds...`);
  
  const startTime = Date.now();
  let tasksFound = 0;
  
  while (Date.now() - startTime < pollDuration * 1000) {
    try {
      const response = await authenticatedFetch(`/api/mobile-devices/poll?deviceId=${deviceId}`, {
        method: 'GET',
      }, token);
      
      const data = await response.json();
      
      if (data.tasks && data.tasks.length > 0) {
        tasksFound += data.tasks.length;
        console.log(`\n📱 Found ${data.tasks.length} task(s):`);
        data.tasks.forEach((task: any, i: number) => {
          console.log(`  ${i + 1}. ${task.businessName} - ${task.status}`);
        });
      } else {
        process.stdout.write('.');
      }
      
      await sleep(2000); // Poll every 2 seconds
    } catch (error) {
      printError(`Polling error: ${error}`);
    }
  }
  
  console.log('\n');
  printInfo(`Polling complete. Found ${tasksFound} task(s) total.`);
  return tasksFound > 0;
}

async function testNFCTagLogging(token: string) {
  printHeader('Testing NFC Tag Logging');
  
  const businessName = await prompt('Enter business name: ') || 'TEST_NFCLog_Business';
  const placeId = await prompt('Enter Google Place ID: ') || 'ChIJtest123';
  const reviewUrl = await prompt('Enter review URL: ') || 'https://g.page/test';
  
  try {
    const response = await authenticatedFetch('/api/nfc-logs', {
      method: 'POST',
      body: JSON.stringify({
        businessName,
        placeId,
        reviewUrl,
        latitude: 51.5074,
        longitude: -0.1278,
        tagType: 'NTAG215',
        writeSuccess: true,
      }),
    }, token);
    
    const data = await response.json();
    
    if (data.id || data.success) {
      printSuccess('NFC tag logged successfully');
      return true;
    } else {
      printError(`Logging failed: ${JSON.stringify(data)}`);
      return false;
    }
  } catch (error) {
    printError(`NFC logging test failed: ${error}`);
    return false;
  }
}

async function testPreprogrammedTagCreation(token: string) {
  printHeader('Testing Preprogrammed Tag Creation');
  
  const quantity = parseInt(await prompt('How many tags to create (default 5): ') || '5');
  const prefix = await prompt('Tag slug prefix (default "test"): ') || 'test';
  
  try {
    const response = await authenticatedFetch('/api/preprogrammed-tags', {
      method: 'POST',
      body: JSON.stringify({
        quantity,
        prefix,
      }),
    }, token);
    
    const data = await response.json();
    
    if (data.tags && data.tags.length > 0) {
      printSuccess(`Created ${data.tags.length} preprogrammed tags:`);
      data.tags.forEach((tag: any) => {
        console.log(`  - ${tag.slug}: ${BASE_URL}/t/${tag.slug}`);
      });
      return data.tags;
    } else {
      printError(`Creation failed: ${JSON.stringify(data)}`);
      return null;
    }
  } catch (error) {
    printError(`Preprogrammed tag test failed: ${error}`);
    return null;
  }
}

async function testSmartLinkCreation(token: string) {
  printHeader('Testing Smart Link Creation');
  
  const slug = await prompt('Enter slug (or press Enter for auto): ') || `test-${Date.now()}`;
  const targetUrl = await prompt('Enter target URL: ') || 'https://g.page/test-business';
  
  try {
    const response = await authenticatedFetch('/api/smart-links', {
      method: 'POST',
      body: JSON.stringify({
        slug,
        targetUrl,
        businessName: 'Test Business',
      }),
    }, token);
    
    const data = await response.json();
    
    if (data.id || data.slug) {
      printSuccess(`Smart link created: ${BASE_URL}/go/${data.slug || slug}`);
      return data;
    } else {
      printError(`Creation failed: ${JSON.stringify(data)}`);
      return null;
    }
  } catch (error) {
    printError(`Smart link test failed: ${error}`);
    return null;
  }
}

async function testPlacesSearch() {
  printHeader('Testing Google Places Search');
  
  const query = await prompt('Enter search query: ') || 'coffee shop';
  const lat = await prompt('Enter latitude (default London): ') || '51.5074';
  const lng = await prompt('Enter longitude (default London): ') || '-0.1278';
  
  try {
    const response = await fetch(
      `${BASE_URL}/api/places/nearby?query=${encodeURIComponent(query)}&lat=${lat}&lng=${lng}`
    );
    
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      printSuccess(`Found ${data.results.length} places:`);
      data.results.slice(0, 5).forEach((place: any, i: number) => {
        console.log(`  ${i + 1}. ${place.name} - ${place.vicinity || place.formatted_address}`);
      });
      return data.results;
    } else {
      printInfo('No places found');
      return [];
    }
  } catch (error) {
    printError(`Places search failed: ${error}`);
    return null;
  }
}

async function testSocialMediaDiscovery() {
  printHeader('Testing Social Media Discovery');
  
  const businessName = await prompt('Enter business name: ');
  const location = await prompt('Enter location (city): ') || '';
  
  if (!businessName) {
    printError('Business name is required');
    return null;
  }
  
  printInfo('Searching for social media profiles (this may take a moment)...');
  
  try {
    const response = await fetch(
      `${BASE_URL}/api/places/social-media?businessName=${encodeURIComponent(businessName)}&location=${encodeURIComponent(location)}`
    );
    
    const data = await response.json();
    
    if (data.profiles && Object.keys(data.profiles).length > 0) {
      printSuccess('Found social media profiles:');
      Object.entries(data.profiles).forEach(([platform, url]) => {
        console.log(`  ${platform}: ${url}`);
      });
      return data.profiles;
    } else {
      printInfo('No social media profiles found');
      return {};
    }
  } catch (error) {
    printError(`Social media discovery failed: ${error}`);
    return null;
  }
}

async function testProductsAPI(token: string) {
  printHeader('Testing Products API');
  
  try {
    // List products
    const listResponse = await authenticatedFetch('/api/products', {
      method: 'GET',
    }, token);
    
    const products = await listResponse.json();
    
    if (Array.isArray(products) || products.products) {
      const productList = products.products || products;
      printSuccess(`Found ${productList.length} products`);
      productList.slice(0, 5).forEach((p: any) => {
        console.log(`  - ${p.name}: £${p.price}`);
      });
      return true;
    } else {
      printInfo('No products found or error occurred');
      console.log(products);
      return false;
    }
  } catch (error) {
    printError(`Products API test failed: ${error}`);
    return false;
  }
}

async function testInvoiceGeneration(token: string) {
  printHeader('Testing Invoice Generation');
  
  printInfo('This will create a test invoice...');
  
  const customerName = await prompt('Customer name: ') || 'Test Customer';
  const customerEmail = await prompt('Customer email: ') || 'test@example.com';
  
  try {
    const response = await authenticatedFetch('/api/invoices', {
      method: 'POST',
      body: JSON.stringify({
        customerName,
        customerEmail,
        items: [
          { description: 'Test NFC Sign', quantity: 1, unitPrice: 29.99 },
          { description: 'Installation', quantity: 1, unitPrice: 10.00 },
        ],
        notes: 'Test invoice - please ignore',
        sendEmail: false, // Don't actually send
      }),
    }, token);
    
    const data = await response.json();
    
    if (data.id) {
      printSuccess(`Invoice created: ${data.invoiceNumber || data.id}`);
      console.log(`  Total: £${data.total}`);
      return data;
    } else {
      printError(`Invoice creation failed: ${JSON.stringify(data)}`);
      return null;
    }
  } catch (error) {
    printError(`Invoice test failed: ${error}`);
    return null;
  }
}

// ============================================================================
// MAIN MENU
// ============================================================================

const menuOptions = [
  { key: '1', name: 'Test Database Connection', fn: testDatabaseConnection },
  { key: '2', name: 'Test Health Endpoint', fn: testHealthEndpoint },
  { key: '3', name: 'Test Mobile Login', fn: testMobileLogin, returns: 'token' },
  { key: '4', name: 'Test NFC Task Creation', fn: testNFCTaskCreation, requires: 'token' },
  { key: '5', name: 'Test NFC Task Polling (Device Simulation)', fn: testNFCTaskPolling, requires: 'token' },
  { key: '6', name: 'Test NFC Tag Logging', fn: testNFCTagLogging, requires: 'token' },
  { key: '7', name: 'Test Preprogrammed Tag Creation', fn: testPreprogrammedTagCreation, requires: 'token' },
  { key: '8', name: 'Test Smart Link Creation', fn: testSmartLinkCreation, requires: 'token' },
  { key: '9', name: 'Test Google Places Search', fn: testPlacesSearch },
  { key: '10', name: 'Test Social Media Discovery', fn: testSocialMediaDiscovery },
  { key: '11', name: 'Test Products API', fn: testProductsAPI, requires: 'token' },
  { key: '12', name: 'Test Invoice Generation', fn: testInvoiceGeneration, requires: 'token' },
  { key: 'a', name: 'Run All Basic Tests', fn: null, special: 'runAll' },
  { key: 'q', name: 'Quit', fn: null, special: 'quit' },
];

async function runAllBasicTests() {
  printHeader('Running All Basic Tests');
  
  const results: { name: string; passed: boolean }[] = [];
  
  // Database
  results.push({ name: 'Database Connection', passed: await testDatabaseConnection() });
  
  // Health
  results.push({ name: 'Health Endpoint', passed: await testHealthEndpoint() });
  
  // Places (public)
  const places = await testPlacesSearch();
  results.push({ name: 'Places Search', passed: places !== null });
  
  // Summary
  printHeader('Test Summary');
  results.forEach(r => {
    console.log(`  ${r.passed ? '✅' : '❌'} ${r.name}`);
  });
  
  const passed = results.filter(r => r.passed).length;
  console.log(`\n  Total: ${passed}/${results.length} passed`);
}

async function main() {
  let token: string | null = null;
  
  printHeader('Review Signs - Interactive Test Suite');
  console.log('Base URL:', BASE_URL);
  console.log('\nThis test suite allows you to interactively test');
  console.log('various API endpoints and NFC programming workflows.\n');
  
  while (true) {
    console.log('\n--- MENU ---');
    if (token) {
      console.log('🔐 Authenticated (token stored)');
    } else {
      console.log('🔓 Not authenticated');
    }
    console.log('');
    
    menuOptions.forEach(opt => {
      const requiresAuth = opt.requires === 'token';
      const status = requiresAuth && !token ? ' (requires login)' : '';
      console.log(`  [${opt.key}] ${opt.name}${status}`);
    });
    
    const choice = await prompt('\nSelect option: ');
    const option = menuOptions.find(o => o.key === choice);
    
    if (!option) {
      printError('Invalid option');
      continue;
    }
    
    if (option.special === 'quit') {
      console.log('\nGoodbye! 👋\n');
      break;
    }
    
    if (option.special === 'runAll') {
      await runAllBasicTests();
      continue;
    }
    
    if (option.requires === 'token' && !token) {
      printError('This test requires authentication. Please login first (option 3).');
      continue;
    }
    
    try {
      const result = await option.fn!(option.requires === 'token' ? token! : undefined);
      
      if (option.returns === 'token' && result) {
        token = result;
        printInfo('Token stored for subsequent authenticated requests');
      }
    } catch (error) {
      printError(`Test failed with error: ${error}`);
    }
  }
  
  rl.close();
}

// Run if executed directly
main().catch(console.error);
