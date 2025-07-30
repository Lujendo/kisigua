#!/usr/bin/env node

/**
 * Script to populate sample images for listings in R2 storage
 * This script downloads sample images and uploads them to R2, then updates the database
 */

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// Sample images for different categories
const SAMPLE_IMAGES = {
  organic_farm: [
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&h=600&fit=crop&q=80',
    'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=600&fit=crop&q=80',
    'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800&h=600&fit=crop&q=80'
  ],
  local_product: [
    'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&h=600&fit=crop&q=80',
    'https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=800&h=600&fit=crop&q=80',
    'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800&h=600&fit=crop&q=80'
  ],
  water_source: [
    'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=600&fit=crop&q=80',
    'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&h=600&fit=crop&q=80',
    'https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=800&h=600&fit=crop&q=80'
  ],
  vending_machine: [
    'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&h=600&fit=crop&q=80',
    'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&h=600&fit=crop&q=80'
  ],
  craft: [
    'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=800&h=600&fit=crop&q=80',
    'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800&h=600&fit=crop&q=80',
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&q=80'
  ],
  sustainable_good: [
    'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&h=600&fit=crop&q=80',
    'https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=800&h=600&fit=crop&q=80',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop&q=80'
  ]
};

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'https://kisigua.com';
const ADMIN_EMAIL = 'admin@kisigua.com';
const ADMIN_PASSWORD = 'admin123';

let authToken = null;

async function downloadImage(url, filename) {
  console.log(`Downloading ${filename} from ${url}`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.statusText}`);
  }
  
  const buffer = await response.buffer();
  const tempPath = path.join(__dirname, 'temp', filename);
  
  // Ensure temp directory exists
  const tempDir = path.dirname(tempPath);
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  fs.writeFileSync(tempPath, buffer);
  return { buffer, tempPath };
}

async function authenticate() {
  console.log('Authenticating as admin...');
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    })
  });

  if (!response.ok) {
    throw new Error(`Authentication failed: ${response.statusText}`);
  }

  const data = await response.json();
  if (!data.success || !data.token) {
    throw new Error('Authentication failed: No token received');
  }

  authToken = data.token;
  console.log('Authentication successful');
}

async function uploadImageToR2(imageBuffer, filename, listingId) {
  console.log(`Uploading ${filename} to R2 for listing ${listingId}`);
  
  // Step 1: Get signed upload URL
  const signedUrlResponse = await fetch(`${API_BASE_URL}/api/upload/signed-url`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify({
      fileName: filename,
      fileType: 'image/jpeg',
      fileSize: imageBuffer.length
    })
  });

  if (!signedUrlResponse.ok) {
    throw new Error(`Failed to get signed URL: ${signedUrlResponse.statusText}`);
  }

  const { uploadUrl } = await signedUrlResponse.json();

  // Step 2: Upload to R2
  const formData = new FormData();
  const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
  formData.append('file', blob, filename);

  const uploadResponse = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'x-file-name': filename
    },
    body: formData
  });

  if (!uploadResponse.ok) {
    throw new Error(`Failed to upload to R2: ${uploadResponse.statusText}`);
  }

  const uploadResult = await uploadResponse.json();
  console.log(`Successfully uploaded ${filename}: ${uploadResult.url}`);
  return uploadResult.url;
}

async function getListings() {
  console.log('Fetching existing listings...');
  const response = await fetch(`${API_BASE_URL}/api/listings/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify({
      query: '',
      filters: {},
      page: 1,
      limit: 100
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch listings: ${response.statusText}`);
  }

  const data = await response.json();
  return data.listings || [];
}

async function updateListingImages(listingId, imageUrls) {
  console.log(`Updating listing ${listingId} with ${imageUrls.length} images`);
  
  // For now, we'll update the listing with the image URLs
  // In a real implementation, you'd want to add these to the listing_images table
  const response = await fetch(`${API_BASE_URL}/api/listings/${listingId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify({
      images: imageUrls
    })
  });

  if (!response.ok) {
    console.warn(`Failed to update listing ${listingId}: ${response.statusText}`);
    return false;
  }

  console.log(`Successfully updated listing ${listingId} with images`);
  return true;
}

async function main() {
  try {
    console.log('Starting sample image population...');
    
    // Authenticate
    await authenticate();
    
    // Get existing listings
    const listings = await getListings();
    console.log(`Found ${listings.length} listings to update`);

    if (listings.length === 0) {
      console.log('No listings found. Please create some listings first.');
      return;
    }

    // Process each listing
    for (const listing of listings) {
      console.log(`\nProcessing listing: ${listing.title} (${listing.category})`);
      
      const categoryImages = SAMPLE_IMAGES[listing.category] || SAMPLE_IMAGES.sustainable_good;
      const imagesToUpload = categoryImages.slice(0, 3); // Upload up to 3 images per listing
      
      const uploadedUrls = [];
      
      for (let i = 0; i < imagesToUpload.length; i++) {
        const imageUrl = imagesToUpload[i];
        const filename = `${listing.category}_${listing.id}_${i + 1}.jpg`;
        
        try {
          const { buffer } = await downloadImage(imageUrl, filename);
          const uploadedUrl = await uploadImageToR2(buffer, filename, listing.id);
          uploadedUrls.push(uploadedUrl);
        } catch (error) {
          console.error(`Failed to process image ${i + 1} for listing ${listing.id}:`, error.message);
        }
      }
      
      if (uploadedUrls.length > 0) {
        await updateListingImages(listing.id, uploadedUrls);
      }
    }

    console.log('\nSample image population completed!');
    
    // Cleanup temp directory
    const tempDir = path.join(__dirname, 'temp');
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { main };
