#!/usr/bin/env node

/**
 * Simple script to call the populate sample images API endpoint
 */

// Use built-in fetch (Node.js 18+)

const API_BASE_URL = 'https://kisigua.com';
const ADMIN_EMAIL = 'admin@kisigua.com';
const ADMIN_PASSWORD = 'admin123';

async function main() {
  try {
    console.log('Authenticating as admin...');
    
    // Step 1: Login as admin
    const loginResponse = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD
      })
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.statusText}`);
    }

    const loginData = await loginResponse.json();
    if (!loginData.success || !loginData.token) {
      throw new Error('Login failed: No token received');
    }

    const token = loginData.token;
    console.log('Authentication successful');

    // Step 2: Call the populate images endpoint
    console.log('Populating sample images...');
    
    const populateResponse = await fetch(`${API_BASE_URL}/api/admin/populate-sample-images`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!populateResponse.ok) {
      const errorText = await populateResponse.text();
      throw new Error(`Populate images failed: ${populateResponse.statusText} - ${errorText}`);
    }

    const result = await populateResponse.json();
    console.log('Success!', result);

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Run the script
main();
