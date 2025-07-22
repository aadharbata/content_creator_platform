const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testOTPFlow() {
  console.log('🔍 Testing OTP Flow Debug...\n');

  try {
    // Test 1: Direct OTP generation
    console.log('1️⃣ Testing direct OTP generation...');
    const otpResponse = await axios.post(`${BASE_URL}/api/delivery/send-otp`, {
      phone: '9876543210',
      purpose: 'PHONE_VERIFICATION'
    });

    console.log('✅ Direct OTP generation successful!');
    console.log('Response:', otpResponse.data);
    
    if (otpResponse.data.otp) {
      console.log(`🔐 Generated OTP: ${otpResponse.data.otp}`);
      
      // Test 2: OTP verification
      console.log('\n2️⃣ Testing OTP verification...');
      const verifyResponse = await axios.post(`${BASE_URL}/api/auth/verify-otp`, {
        phone: otpResponse.data.phone,
        otp: otpResponse.data.otp
      });

      console.log('✅ OTP verification successful!');
      console.log('Response:', verifyResponse.data);
    }

    // Test 3: Phone signup with OTP
    console.log('\n3️⃣ Testing phone signup with OTP...');
    const signupResponse = await axios.post(`${BASE_URL}/api/auth/signup`, {
      name: 'Test User',
      phone: '9876543211', // Different number
      countryCode: '+91',
      password: 'testpass123',
      role: 'CONSUMER',
      signupMethod: 'phone'
    });

    console.log('✅ Phone signup successful!');
    console.log('Response:', signupResponse.data);

    if (signupResponse.data.otp) {
      console.log(`🔐 Signup OTP: ${signupResponse.data.otp}`);
    }

    console.log('\n🎉 All OTP tests completed! Check the console logs for details.');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    console.error('Error details:', error.response?.status, error.response?.statusText);
  }
}

// Run the test
testOTPFlow(); 