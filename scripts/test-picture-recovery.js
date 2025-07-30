#!/usr/bin/env node

/**
 * Test script to validate Picture implementation recovery after category ID changes
 * This script tests all image-related functionality to ensure complete recovery
 */

const fetch = require('node-fetch');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8787';
const ADMIN_EMAIL = 'admin@kisigua.com';
const ADMIN_PASSWORD = 'admin123';

let authToken = null;

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(testName, passed, message = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status}: ${testName}${message ? ' - ' + message : ''}`);
  
  testResults.tests.push({ name: testName, passed, message });
  if (passed) {
    testResults.passed++;
  } else {
    testResults.failed++;
  }
}

// Authenticate as admin
async function authenticate() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD
      })
    });

    if (response.ok) {
      const data = await response.json();
      authToken = data.token;
      logTest('Authentication', true, 'Successfully logged in as admin');
      return true;
    } else {
      logTest('Authentication', false, `Login failed: ${response.status}`);
      return false;
    }
  } catch (error) {
    logTest('Authentication', false, `Login error: ${error.message}`);
    return false;
  }
}

// Test 1: Verify categories API returns correct format
async function testCategoriesAPI() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/categories`);
    
    if (!response.ok) {
      logTest('Categories API', false, `HTTP ${response.status}`);
      return;
    }

    const data = await response.json();
    const categories = data.categories;

    if (!Array.isArray(categories)) {
      logTest('Categories API', false, 'Categories is not an array');
      return;
    }

    // Check that categories have the correct format (without cat_ prefix)
    const hasCorrectFormat = categories.every(cat => 
      cat.id && !cat.id.startsWith('cat_') && cat.name && cat.slug
    );

    if (hasCorrectFormat && categories.length > 0) {
      logTest('Categories API', true, `Found ${categories.length} categories with correct format`);
    } else {
      logTest('Categories API', false, 'Categories have incorrect format or empty');
    }
  } catch (error) {
    logTest('Categories API', false, `Error: ${error.message}`);
  }
}

// Test 2: Verify listings API returns correct category format
async function testListingsAPI() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/listings/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: '',
        filters: {},
        page: 1,
        limit: 5
      })
    });

    if (!response.ok) {
      logTest('Listings API', false, `HTTP ${response.status}`);
      return;
    }

    const data = await response.json();
    const listings = data.listings;

    if (!Array.isArray(listings)) {
      logTest('Listings API', false, 'Listings is not an array');
      return;
    }

    if (listings.length === 0) {
      logTest('Listings API', true, 'No listings found (empty database)');
      return;
    }

    // Check that listings have correct category format and images
    const hasCorrectFormat = listings.every(listing => 
      listing.category && !listing.category.startsWith('cat_') && 
      Array.isArray(listing.images)
    );

    if (hasCorrectFormat) {
      logTest('Listings API', true, `Found ${listings.length} listings with correct category format`);
    } else {
      logTest('Listings API', false, 'Listings have incorrect category format');
    }
  } catch (error) {
    logTest('Listings API', false, `Error: ${error.message}`);
  }
}

// Test 3: Test sample image population
async function testSampleImagePopulation() {
  if (!authToken) {
    logTest('Sample Image Population', false, 'No auth token');
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/populate-sample-images`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      logTest('Sample Image Population', true, data.message || 'Successfully populated images');
    } else {
      const errorData = await response.json().catch(() => ({}));
      logTest('Sample Image Population', false, `HTTP ${response.status}: ${errorData.error || 'Unknown error'}`);
    }
  } catch (error) {
    logTest('Sample Image Population', false, `Error: ${error.message}`);
  }
}

// Test 4: Test category filtering in search
async function testCategoryFiltering() {
  try {
    // Test with a specific category filter
    const response = await fetch(`${API_BASE_URL}/api/listings/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: '',
        filters: {
          category: ['organic_farm']
        },
        page: 1,
        limit: 10
      })
    });

    if (!response.ok) {
      logTest('Category Filtering', false, `HTTP ${response.status}`);
      return;
    }

    const data = await response.json();
    
    // Check if filtering works (all results should have organic_farm category)
    const allCorrectCategory = data.listings.every(listing => 
      listing.category === 'organic_farm'
    );

    if (allCorrectCategory || data.listings.length === 0) {
      logTest('Category Filtering', true, `Found ${data.listings.length} organic farm listings`);
    } else {
      logTest('Category Filtering', false, 'Category filtering not working correctly');
    }
  } catch (error) {
    logTest('Category Filtering', false, `Error: ${error.message}`);
  }
}

// Test 5: Test image consistency in database
async function testImageConsistency() {
  try {
    // Get all listings and check if they have images
    const response = await fetch(`${API_BASE_URL}/api/listings/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: '',
        filters: {},
        page: 1,
        limit: 50
      })
    });

    if (!response.ok) {
      logTest('Image Consistency', false, `HTTP ${response.status}`);
      return;
    }

    const data = await response.json();
    const listings = data.listings;

    if (listings.length === 0) {
      logTest('Image Consistency', true, 'No listings to check');
      return;
    }

    const listingsWithImages = listings.filter(listing => 
      listing.images && listing.images.length > 0
    );

    const imageConsistency = listingsWithImages.every(listing =>
      listing.images.every(imageUrl => 
        typeof imageUrl === 'string' && imageUrl.length > 0
      )
    );

    if (imageConsistency) {
      logTest('Image Consistency', true, 
        `${listingsWithImages.length}/${listings.length} listings have valid images`);
    } else {
      logTest('Image Consistency', false, 'Some listings have invalid image URLs');
    }
  } catch (error) {
    logTest('Image Consistency', false, `Error: ${error.message}`);
  }
}

// Main test runner
async function runTests() {
  console.log('🧪 Starting Picture Implementation Recovery Tests...\n');

  // Authenticate first
  const authenticated = await authenticate();
  
  // Run all tests
  await testCategoriesAPI();
  await testListingsAPI();
  
  if (authenticated) {
    await testSampleImagePopulation();
  }
  
  await testCategoryFiltering();
  await testImageConsistency();

  // Print summary
  console.log('\n📊 Test Summary:');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100)}%`);

  if (testResults.failed === 0) {
    console.log('\n🎉 All tests passed! Picture implementation recovery is complete.');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the issues above.');
    process.exit(1);
  }
}

// Run the tests
runTests().catch(error => {
  console.error('❌ Test runner failed:', error);
  process.exit(1);
});
