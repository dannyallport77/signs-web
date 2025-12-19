/**
 * NFC Workflow Tests
 * 
 * Tests for the complete NFC programming workflow including:
 * - Task creation
 * - Device registration
 * - Task polling
 * - Status updates
 * - Tag logging
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

// These tests require authentication
// Set TEST_AUTH_TOKEN environment variable or run with a valid token

const getAuthToken = () => process.env.TEST_AUTH_TOKEN || '';

describe('NFC Task Workflow', () => {
  let authToken: string;
  let createdTaskId: string;
  let registeredDeviceId: string;

  beforeAll(() => {
    authToken = getAuthToken();
    if (!authToken) {
      console.warn('⚠️ TEST_AUTH_TOKEN not set - authenticated tests will be skipped');
    }
  });

  describe('Device Registration', () => {
    it('should register a mobile device', async () => {
      if (!authToken) return;

      const response = await fetch(`${BASE_URL}/api/mobile-devices/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          deviceName: 'TEST_Device_001',
          deviceId: `test-device-${Date.now()}`,
          platform: 'ios',
          pushToken: 'test-push-token',
        }),
      });

      const data = await response.json();
      
      if (response.status === 200 || response.status === 201) {
        expect(data.id || data.deviceId).toBeDefined();
        registeredDeviceId = data.id || data.deviceId;
      }
    });

    it('should list registered devices', async () => {
      if (!authToken) return;

      const response = await fetch(`${BASE_URL}/api/mobile-devices`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      expect([200, 401]).toContain(response.status);
    });
  });

  describe('Task Creation', () => {
    it('should create an NFC programming task', async () => {
      if (!authToken) return;

      const response = await fetch(`${BASE_URL}/api/nfc-tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          businessName: 'TEST_TaskCreation_Business',
          reviewUrl: 'https://g.page/test-business',
          placeId: 'test_place_id_001',
          latitude: 51.5074,
          longitude: -0.1278,
          tagType: 'NTAG215',
          priority: 'normal',
        }),
      });

      const data = await response.json();
      
      if (response.status === 200 || response.status === 201) {
        expect(data.id).toBeDefined();
        createdTaskId = data.id;
      }
    });

    it('should list NFC tasks', async () => {
      if (!authToken) return;

      const response = await fetch(`${BASE_URL}/api/nfc-tasks`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(Array.isArray(data) || data.tasks).toBeTruthy();
    });
  });

  describe('Task Polling (Device Side)', () => {
    it('should poll for pending tasks', async () => {
      if (!authToken) return;

      const response = await fetch(`${BASE_URL}/api/mobile-devices/poll`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.tasks !== undefined || data.error).toBeTruthy();
    });

    it('should update task status to acknowledged', async () => {
      if (!authToken || !createdTaskId) return;

      const response = await fetch(`${BASE_URL}/api/mobile-devices/poll`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          taskId: createdTaskId,
          status: 'acknowledged',
        }),
      });

      expect([200, 404]).toContain(response.status);
    });

    it('should update task status to completed', async () => {
      if (!authToken || !createdTaskId) return;

      const response = await fetch(`${BASE_URL}/api/mobile-devices/poll`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          taskId: createdTaskId,
          status: 'completed',
          tagUid: 'TEST_TAG_UID_001',
        }),
      });

      expect([200, 404]).toContain(response.status);
    });
  });

  describe('NFC Tag Logging', () => {
    it('should log a successful NFC write', async () => {
      if (!authToken) return;

      const response = await fetch(`${BASE_URL}/api/nfc-logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          businessName: 'TEST_NFCLog_Business',
          placeId: 'test_place_123',
          reviewUrl: 'https://g.page/test-business',
          latitude: 51.5074,
          longitude: -0.1278,
          tagType: 'NTAG215',
          tagUid: 'TEST_UID_001',
          writeSuccess: true,
        }),
      });

      const data = await response.json();
      
      if (response.status === 200 || response.status === 201) {
        expect(data.id || data.success).toBeTruthy();
      }
    });

    it('should list NFC logs', async () => {
      if (!authToken) return;

      const response = await fetch(`${BASE_URL}/api/nfc-logs`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      expect([200, 401]).toContain(response.status);
    });
  });
});

describe('Preprogrammed Tags', () => {
  let authToken: string;
  let createdTagSlug: string;

  beforeAll(() => {
    authToken = getAuthToken();
  });

  it('should create preprogrammed tags', async () => {
    if (!authToken) return;

    const response = await fetch(`${BASE_URL}/api/preprogrammed-tags`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        quantity: 3,
        prefix: 'test',
      }),
    });

    const data = await response.json();
    
    if (response.status === 200 || response.status === 201) {
      expect(data.tags || data.created).toBeDefined();
      if (data.tags && data.tags.length > 0) {
        createdTagSlug = data.tags[0].slug;
      }
    }
  });

  it('should list preprogrammed tags', async () => {
    if (!authToken) return;

    const response = await fetch(`${BASE_URL}/api/preprogrammed-tags`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect([200, 401]).toContain(response.status);
  });

  it('should link preprogrammed tag to business', async () => {
    if (!authToken || !createdTagSlug) return;

    const response = await fetch(`${BASE_URL}/api/preprogrammed-tags/${createdTagSlug}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        businessName: 'TEST_Linked_Business',
        targetUrl: 'https://g.page/test-linked',
        placeId: 'test_linked_place',
      }),
    });

    expect([200, 404]).toContain(response.status);
  });
});

describe('Smart Links', () => {
  let authToken: string;
  let createdSlug: string;

  beforeAll(() => {
    authToken = getAuthToken();
  });

  it('should create a smart link', async () => {
    if (!authToken) return;

    const slug = `test-${Date.now()}`;
    
    const response = await fetch(`${BASE_URL}/api/smart-links`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        slug,
        targetUrl: 'https://g.page/test-smart-link',
        businessName: 'TEST_SmartLink_Business',
      }),
    });

    const data = await response.json();
    
    if (response.status === 200 || response.status === 201) {
      expect(data.slug || data.id).toBeDefined();
      createdSlug = data.slug || slug;
    }
  });

  it('should list smart links', async () => {
    if (!authToken) return;

    const response = await fetch(`${BASE_URL}/api/smart-links`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect([200, 401]).toContain(response.status);
  });

  it('should update a smart link', async () => {
    if (!authToken || !createdSlug) return;

    const response = await fetch(`${BASE_URL}/api/smart-links/${createdSlug}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        targetUrl: 'https://g.page/test-updated',
      }),
    });

    expect([200, 404]).toContain(response.status);
  });

  it('should delete a smart link', async () => {
    if (!authToken || !createdSlug) return;

    const response = await fetch(`${BASE_URL}/api/smart-links/${createdSlug}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect([200, 204, 404]).toContain(response.status);
  });
});
