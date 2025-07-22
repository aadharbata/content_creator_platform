const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Test phone-based signup and login flow
async function testPhoneAuth() {
  console.log('🧪 Testing Phone-Based Authentication Flow...\n');

  try {
    // Step 1: Test phone signup
    console.log('1️⃣ Testing phone signup...');
    const signupResponse = await axios.post(`${BASE_URL}/api/auth/signup`, {
      name: 'Test Phone User',
      phone: '9876543210',
      countryCode: '+91',
      password: 'testpass123',
      role: 'CONSUMER',
      signupMethod: 'phone'
    });

    console.log('✅ Phone signup successful!');
    console.log('Response:', signupResponse.data);
    
    const { phone, otp, user } = signupResponse.data;
    console.log(`📱 Phone: ${phone}`);
    console.log(`🔐 OTP: ${otp}`);
    console.log(`👤 User ID: ${user.id}`);

    // Step 2: Test OTP verification
    console.log('\n2️⃣ Testing OTP verification...');
    const otpResponse = await axios.post(`${BASE_URL}/api/auth/verify-otp`, {
      phone: phone,
      otp: otp
    });

    console.log('✅ OTP verification successful!');
    console.log('Response:', otpResponse.data);

    // Step 3: Test phone login
    console.log('\n3️⃣ Testing phone login...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/signin`, {
      identifier: phone,
      password: 'testpass123'
    });

    console.log('✅ Phone login successful!');
    console.log('Response:', loginResponse.data);

    console.log('\n🎉 All tests passed! Phone-based authentication is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testPhoneAuth(); 