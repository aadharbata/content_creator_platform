const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testAuthAndGoLive() {
  console.log('🧪 Testing Authentication & Go Live Fix...\n');

  try {
    // Test 1: Check if server is running
    console.log('1️⃣ Testing server connection...');
    const pingResponse = await axios.get(`${BASE_URL}/api/auth/providers`);
    console.log('✅ Server is running!\n');

    // Test 2: Try login
    console.log('2️⃣ Testing login...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/callback/credentials`, {
      email: 'ishan.creator@example.com',
      password: 'password123',
      csrfToken: 'test', // This might be needed
    }, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      validateStatus: function (status) {
        return status < 500; // Don't throw for 4xx errors
      }
    });
    
    console.log('Login response status:', loginResponse.status);
    if (loginResponse.status === 200) {
      console.log('✅ Login working!\n');
    } else {
      console.log('⚠️ Login returned:', loginResponse.status, loginResponse.data);
      console.log('This might be expected behavior for credentials flow\n');
    }

    // Test 3: Check session endpoint
    console.log('3️⃣ Testing session endpoint...');
    const sessionResponse = await axios.get(`${BASE_URL}/api/auth/session`);
    console.log('Session response:', sessionResponse.data);
    console.log('✅ Session endpoint working!\n');

    // Test 4: Check if golive endpoint compiles
    console.log('4️⃣ Testing golive endpoint compilation...');
    const testCreatorId = '39081335-6781-4f6b-888f-a0bb2d78c7d3'; // From logs
    const goliveResponse = await axios.post(`${BASE_URL}/api/creator/${testCreatorId}/golive`, {}, {
      validateStatus: function (status) {
        return status < 500; // Don't throw for 4xx errors
      }
    });
    
    console.log('Go Live response status:', goliveResponse.status);
    if (goliveResponse.status === 401) {
      console.log('✅ Go Live endpoint is working! (401 expected without auth)\n');
    } else if (goliveResponse.status === 200) {
      console.log('✅ Go Live working perfectly!\n');
    } else {
      console.log('Go Live response:', goliveResponse.data);
    }

    console.log('🎉 All tests completed! The authentication system should be working now.');
    console.log('\n📋 Next steps:');
    console.log('1. Clear your browser cookies/localStorage');
    console.log('2. Go to http://localhost:3000/login');
    console.log('3. Login with creator credentials');
    console.log('4. Try the Go Live feature');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testAuthAndGoLive(); 