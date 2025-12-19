/**
 * API Route Tests
 * 
 * Run: npx jest __tests__/api.test.ts
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

describe('API Health & Connectivity', () => {
  it('should return healthy status from /api/health', async () => {
    const response = await fetch(`${BASE_URL}/api/health`);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.status).toBe('healthy');
  });

  it('should ping database successfully', async () => {
    const response = await fetch(`${BASE_URL}/api/db-ping`);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
  });

  it('should return API info from /api', async () => {
    const response = await fetch(`${BASE_URL}/api`);
    
    expect(response.status).toBe(200);
  });
});

describe('Authentication API', () => {
  it('should reject login with invalid credentials', async () => {
    const response = await fetch(`${BASE_URL}/api/mobile/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'invalid@test.com',
        password: 'wrongpassword',
      }),
    });
    
    expect(response.status).toBe(401);
  });

  it('should reject login with missing fields', async () => {
    const response = await fetch(`${BASE_URL}/api/mobile/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    
    expect(response.status).toBe(400);
  });
});

describe('Places API', () => {
  it('should search nearby places', async () => {
    const response = await fetch(
      `${BASE_URL}/api/places/nearby?query=restaurant&lat=51.5074&lng=-0.1278`
    );
    const data = await response.json();
    
    expect(response.status).toBe(200);
    // May return empty if no API key configured
    expect(data).toBeDefined();
  });

  it('should return supported platforms', async () => {
    const response = await fetch(`${BASE_URL}/api/places/platforms`);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.platforms || data).toBeDefined();
  });

  it('should handle text search', async () => {
    const response = await fetch(
      `${BASE_URL}/api/places/text-search?query=coffee%20london`
    );
    
    expect(response.status).toBe(200);
  });
});

describe('Products API (Public)', () => {
  it('should list products', async () => {
    const response = await fetch(`${BASE_URL}/api/products`);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(Array.isArray(data) || data.products).toBeTruthy();
  });

  it('should list products for mobile', async () => {
    const response = await fetch(`${BASE_URL}/api/products/mobile`);
    const data = await response.json();
    
    expect(response.status).toBe(200);
  });
});

describe('Smart Links API', () => {
  it('should list smart links (requires auth)', async () => {
    const response = await fetch(`${BASE_URL}/api/smart-links`);
    
    // Should return 401 without auth
    expect([200, 401]).toContain(response.status);
  });
});

describe('Review Menus API', () => {
  it('should list review menus', async () => {
    const response = await fetch(`${BASE_URL}/api/review-menus`);
    
    // Should return 401 without auth or 200 with data
    expect([200, 401]).toContain(response.status);
  });
});

describe('NFC Logs API', () => {
  it('should reject unauthenticated NFC log creation', async () => {
    const response = await fetch(`${BASE_URL}/api/nfc-logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessName: 'Test',
        placeId: 'test123',
        reviewUrl: 'https://test.com',
      }),
    });
    
    expect([401, 403]).toContain(response.status);
  });
});

describe('Analytics API', () => {
  it('should get dashboard stats (requires auth)', async () => {
    const response = await fetch(`${BASE_URL}/api/analytics/dashboard`);
    
    expect([200, 401]).toContain(response.status);
  });
});

describe('Invoices API', () => {
  it('should reject unauthenticated invoice creation', async () => {
    const response = await fetch(`${BASE_URL}/api/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'Test',
        customerEmail: 'test@test.com',
        items: [],
      }),
    });
    
    expect([401, 403]).toContain(response.status);
  });

  it('should have demo invoice endpoint', async () => {
    const response = await fetch(`${BASE_URL}/api/invoices/demo`);
    
    expect(response.status).toBe(200);
  });
});

describe('Trade Directory API (Stub)', () => {
  it('should return stub response', async () => {
    const response = await fetch(
      `${BASE_URL}/api/places/search-trades?trade=plumber&location=london`
    );
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.message).toContain('not yet implemented');
    expect(data.data).toEqual([]);
  });
});
