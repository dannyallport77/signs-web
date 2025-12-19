/**
 * Test Suite Setup
 * 
 * This file configures the test environment and provides shared utilities.
 */

import { PrismaClient } from '@prisma/client';

// Test database client
export const prisma = new PrismaClient();

// Test user credentials
export const TEST_USER = {
  email: 'test@review-signs.co.uk',
  password: 'TestPassword123!',
  name: 'Test User',
};

// Test admin credentials
export const TEST_ADMIN = {
  email: 'admin@review-signs.co.uk',
  password: 'AdminPassword123!',
  name: 'Test Admin',
  role: 'ADMIN',
};

// Base URL for API tests
export const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

// Helper to create authenticated fetch
export async function authenticatedFetch(url: string, options: RequestInit = {}, token?: string) {
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };
  
  return fetch(`${BASE_URL}${url}`, {
    ...options,
    headers,
  });
}

// Helper to wait for async operations
export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Clean up test data
export async function cleanupTestData() {
  // Delete test records in reverse order of dependencies
  await prisma.nFCTag.deleteMany({ where: { businessName: { startsWith: 'TEST_' } } });
  await prisma.nFCProgrammingTask.deleteMany({ where: { businessName: { startsWith: 'TEST_' } } });
  await prisma.preprogrammedTag.deleteMany({ where: { slug: { startsWith: 'test-' } } });
  await prisma.smartLink.deleteMany({ where: { slug: { startsWith: 'test-' } } });
  await prisma.mobileDevice.deleteMany({ where: { deviceName: { startsWith: 'TEST_' } } });
}

// Setup before all tests
export async function globalSetup() {
  console.log('🧪 Setting up test environment...');
  await cleanupTestData();
}

// Teardown after all tests
export async function globalTeardown() {
  console.log('🧹 Cleaning up test environment...');
  await cleanupTestData();
  await prisma.$disconnect();
}
