// Simple script to call the password fix endpoint
async function fixPasswords() {
  try {
    console.log('🔧 Calling password fix endpoint...');
    
    const response = await fetch('https://kisigua.com/api/debug/fix-passwords', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    
    console.log('📊 Response Status:', response.status);
    console.log('📋 Response Data:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('✅ Password fix completed successfully!');
      console.log('🔑 Updated users:');
      result.results.forEach(user => {
        console.log(`  - ${user.email}: ${user.status}`);
        if (user.oldHash && user.newHash) {
          console.log(`    Old: ${user.oldHash}`);
          console.log(`    New: ${user.newHash}`);
        }
      });
    } else {
      console.log('❌ Password fix failed:', result.error);
    }
    
  } catch (error) {
    console.error('🚨 Error calling password fix endpoint:', error);
  }
}

// Run the function
fixPasswords();
