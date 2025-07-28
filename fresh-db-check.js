// Script to check fresh database query
async function checkFreshDatabase() {
  try {
    console.log('🔍 Checking fresh database query...');
    
    const response = await fetch('https://kisigua.com/api/debug/fresh-db-check');
    const result = await response.json();
    
    console.log('📊 Response Status:', response.status);
    console.log('📋 Fresh Database Results:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('✅ Fresh database query successful!');
      console.log(`⏰ Timestamp: ${result.timestamp}`);
      console.log('🔑 User details from fresh query:');
      result.users.forEach(user => {
        console.log(`  - ${user.email} (${user.role})`);
        console.log(`    ID: ${user.id}`);
        console.log(`    Hash: ${user.password_hash}`);
        console.log(`    Active: ${user.isActive}`);
        console.log(`    Updated: ${user.updatedAt}`);
        console.log('');
      });
    } else {
      console.log('❌ Fresh database query failed:', result.error);
    }
    
  } catch (error) {
    console.error('🚨 Error checking fresh database:', error);
  }
}

// Run the function
checkFreshDatabase();
