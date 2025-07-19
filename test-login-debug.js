const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testLoginFlow() {
  console.log('🔍 Testing Login Flow Debug...\n');

  try {
    // Test 1: Phone signup first
    console.log('1️⃣ Testing phone signup...');
    const signupResponse = await axios.post(`${BASE_URL}/api/auth/signup`, {
      name: 'Test Login User',
      phone: '9876543210',
      countryCode: '+91',
      password: 'testpass123',
      role: 'CONSUMER',
      signupMethod: 'phone'
    });

    console.log('✅ Phone signup successful!');
    console.log('Signup response:', signupResponse.data);
    
    const { phone, otp } = signupResponse.data;
    console.log(`📱 Phone: ${phone}`);
    console.log(`🔐 OTP: ${otp}`);

    // Test 2: OTP verification
    console.log('\n2️⃣ Testing OTP verification...');
    const verifyResponse = await axios.post(`${BASE_URL}/api/auth/verify-otp`, {
      phone: phone,
      otp: otp
    });

    console.log('✅ OTP verification successful!');
    console.log('Verify response:', verifyResponse.data);

    // Test 3: Login with phone number (different formats)
    console.log('\n3️⃣ Testing login with phone number...');
    
    const loginTests = [
      { identifier: '9876543210', description: '10 digits without +91' },
      { identifier: '+919876543210', description: 'with +91' },
      { identifier: '919876543210', description: 'with 91 prefix' }
    ];

    for (const test of loginTests) {
      console.log(`\n🔐 Testing login with ${test.description}: ${test.identifier}`);
      
      try {
        const loginResponse = await axios.post(`${BASE_URL}/api/auth/callback/credentials`, {
          identifier: test.identifier,
          password: 'testpass123',
          redirect: 'false'
        }, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          maxRedirects: 0,
          validateStatus: (status) => status < 500
        });

        console.log(`✅ Login test ${test.description} - Status: ${loginResponse.status}`);
        if (loginResponse.data) {
          console.log('Response data:', loginResponse.data);
        }
      } catch (loginError) {
        console.log(`❌ Login test ${test.description} failed:`, loginError.response?.data || loginError.message);
      }
    }

    console.log('\n🎉 All login tests completed! Check the server logs for detailed information.');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    console.error('Error details:', error.response?.status, error.response?.statusText);
  }
}

// Run the test
testLoginFlow(); 