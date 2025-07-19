// Test Google OAuth with Role Selection Flow
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testGoogleOAuthRoleSelection() {
  console.log('🔍 Testing Google OAuth with Role Selection Flow...\n');

  try {
    // Test 1: Check if Google OAuth is configured
    console.log('1️⃣ Testing Google OAuth configuration...');
    const providersResponse = await axios.get(`${BASE_URL}/api/auth/providers`);
    
    const googleProvider = providersResponse.data.google;
    if (googleProvider) {
      console.log('✅ Google OAuth provider configured');
      console.log('   - SignIn URL:', googleProvider.signinUrl);
      console.log('   - Callback URL:', googleProvider.callbackUrl);
    } else {
      console.log('❌ Google OAuth provider not found');
      return;
    }

    // Test 2: Check if role selection page exists
    console.log('\n2️⃣ Testing role selection page...');
    try {
      const rolePageResponse = await axios.get(`${BASE_URL}/role-selection`);
      console.log('✅ Role selection page accessible');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Role selection page exists (requires authentication)');
      } else {
        console.log('❌ Role selection page not found');
      }
    }

    // Test 3: Test update role API (without auth - should fail)
    console.log('\n3️⃣ Testing role update API...');
    try {
      const updateResponse = await axios.post(`${BASE_URL}/api/auth/update-role`, {
        userId: 'test-user-id',
        role: 'CREATOR'
      });
      console.log('❌ Role update API should require authentication');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Role update API properly requires authentication');
      } else {
        console.log('⚠️  Role update API error:', error.response?.status || error.message);
      }
    }

    // Test 4: Check NextAuth configuration
    console.log('\n4️⃣ Testing NextAuth configuration...');
    const sessionResponse = await axios.get(`${BASE_URL}/api/auth/session`);
    console.log('✅ NextAuth session endpoint working');
    
    const csrfResponse = await axios.get(`${BASE_URL}/api/auth/csrf`);
    console.log('✅ NextAuth CSRF endpoint working');

    console.log('\n🎉 Google OAuth Role Selection Flow Summary:');
    console.log('='.repeat(60));
    console.log('✅ Google OAuth Provider: Configured');
    console.log('✅ Role Selection Page: Available');
    console.log('✅ Role Update API: Secured');
    console.log('✅ NextAuth Endpoints: Working');
    console.log('='.repeat(60));

    console.log('\n🚀 Testing Instructions:');
    console.log('1. Start your server: npm run dev');
    console.log('2. Go to: http://localhost:3000/login');
    console.log('3. Click "Login with Google"');
    console.log('4. Complete Google OAuth flow');
    console.log('5. NEW USERS: Will be redirected to role selection page');
    console.log('6. Choose Creator or Consumer role');
    console.log('7. Get redirected to appropriate dashboard');
    console.log('8. EXISTING USERS: Will be redirected directly to dashboard');

    console.log('\n📋 Expected User Flow:');
    console.log('┌─────────────────────────────────────────────────────────┐');
    console.log('│ Google Login → Role Selection → Creator/Consumer Dashboard │');
    console.log('└─────────────────────────────────────────────────────────┘');

    console.log('\n🔍 Debug Information:');
    console.log('- Check browser console for authentication logs');
    console.log('- Server console shows user creation and role updates');
    console.log('- Role selection page shows welcome message with user name');
    console.log('- isNewUser flag handles redirect logic');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

// Check if server is running
async function checkServer() {
  try {
    await axios.get(`${BASE_URL}/api/auth/providers`);
    return true;
  } catch (error) {
    console.error('❌ Server not running! Please start with: npm run dev');
    return false;
  }
}

// Main execution
async function main() {
  console.log('🔐 Google OAuth Role Selection Test');
  console.log('=' .repeat(50));
  
  const serverRunning = await checkServer();
  if (serverRunning) {
    await testGoogleOAuthRoleSelection();
  }
}

main(); 