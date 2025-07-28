// Script to check database content
async function checkDatabase() {
  try {
    console.log('🔍 Checking database content...');
    
    const response = await fetch('https://kisigua.com/api/debug/check-db-users');
    const result = await response.json();
    
    console.log('📊 Response Status:', response.status);
    console.log('📋 Database Content:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('✅ Database check successful!');
      console.log(`👥 Total users: ${result.totalUsers}`);
      console.log('🔑 User details:');
      result.users.forEach(user => {
        console.log(`  - ${user.email} (${user.role})`);
        console.log(`    ID: ${user.id}`);
        console.log(`    Hash: ${user.password_hash}`);
        console.log(`    Active: ${user.isActive}`);
        console.log(`    Updated: ${user.updatedAt}`);
        console.log('');
      });
    } else {
      console.log('❌ Database check failed:', result.error);
    }
    
  } catch (error) {
    console.error('🚨 Error checking database:', error);
  }
}

// Run the function
checkDatabase();
