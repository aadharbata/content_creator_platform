// Debug Google OAuth Flow - Check what's happening step by step
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function debugGoogleOAuth() {
  console.log('🔍 Debugging Google OAuth Flow...\n');

  try {
    // Test 1: Check providers
    console.log('1️⃣ Testing providers...');
    const providersResponse = await axios.get(`${BASE_URL}/api/auth/providers`);
    console.log('✅ Providers available:', Object.keys(providersResponse.data));

    // Test 2: Check session (should be empty)
    console.log('\n2️⃣ Testing session (should be empty)...');
    const sessionResponse = await axios.get(`${BASE_URL}/api/auth/session`);
    console.log('Session data:', sessionResponse.data);

    // Test 3: Test role selection page (should require auth)
    console.log('\n3️⃣ Testing role selection page...');
    try {
      const roleResponse = await axios.get(`${BASE_URL}/role-selection`);
      console.log('Role selection page status:', roleResponse.status);
    } catch (error) {
      console.log('Role selection page requires auth (expected)');
    }

    // Test 4: Test update role API (should require auth)
    console.log('\n4️⃣ Testing update role API...');
    try {
      const updateResponse = await axios.post(`${BASE_URL}/api/auth/update-role`, {
        userId: 'test',
        role: 'CREATOR'
      });
      console.log('❌ Update role API should require auth');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Update role API requires auth (expected)');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }

    console.log('\n📋 Next Steps:');
    console.log('1. Start your server: npm run dev');
    console.log('2. Go to: http://localhost:3000/login');
    console.log('3. Click "Login with Google"');
    console.log('4. Watch the browser console for debug logs');
    console.log('5. Watch the server console for authentication logs');
    console.log('6. Should see:');
    console.log('   - "✅ New Google user created: { isNewUser: true }"');
    console.log('   - "🔐 JWT callback - User data: { isNewUser: true }"');
    console.log('   - "🔐 Session callback - Final session data: { isNewUser: true }"');
    console.log('   - "🆕 New Google user detected, redirecting to role selection!"');

    console.log('\n🔧 If you see redirect loops:');
    console.log('- Check if isNewUser is true in session');
    console.log('- Check if role-selection page loads correctly');
    console.log('- Check if update-role API is accessible');
    console.log('- Verify environment variables are set');

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugGoogleOAuth(); 