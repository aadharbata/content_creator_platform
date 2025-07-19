const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Test SMS functionality
async function testSMSFunctionality() {
  console.log('🚀 Testing SMS OTP Functionality...\n');

  try {
    // Test 1: Phone signup with SMS
    console.log('1️⃣ Testing phone signup with SMS...');
    const signupResponse = await axios.post(`${BASE_URL}/api/auth/signup`, {
      name: 'SMS Test User',
      phone: '9876543210', // Replace with your phone number
      countryCode: '+91',
      password: 'testpass123',
      role: 'CONSUMER',
      signupMethod: 'phone'
    });

    console.log('✅ Phone signup response received!');
    console.log('Response:', signupResponse.data);
    
    const { phone, otp, user, smsStatus } = signupResponse.data;
    console.log(`📱 Phone: ${phone}`);
    console.log(`🔐 OTP: ${otp || 'Check your phone!'}`);
    console.log(`📤 SMS Status: ${smsStatus}`);
    console.log(`👤 User ID: ${user.id}`);

    if (smsStatus === 'sent') {
      console.log('\n🎉 SMS sent successfully! Check your phone for the OTP.');
      console.log('📝 Note: If you don\'t receive the SMS, check:');
      console.log('   - Twilio Console logs');
      console.log('   - Phone number format');
      console.log('   - Twilio account verification');
    } else {
      console.log('\n⚠️  SMS sending failed. OTP is logged to console for development.');
    }

    // Test 2: OTP verification
    console.log('\n2️⃣ Testing OTP verification...');
    const otpToVerify = otp || prompt('Enter the OTP you received via SMS: ');
    
    if (otpToVerify) {
      const otpResponse = await axios.post(`${BASE_URL}/api/auth/verify-otp`, {
        phone: phone,
        otp: otpToVerify
      });

      console.log('✅ OTP verification successful!');
      console.log('Response:', otpResponse.data);
    } else {
      console.log('⏭️  Skipping OTP verification test');
    }

    // Test 3: OTP resend
    console.log('\n3️⃣ Testing OTP resend...');
    const resendResponse = await axios.post(`${BASE_URL}/api/delivery/send-otp`, {
      phone: phone,
      purpose: 'PHONE_VERIFICATION'
    });

    console.log('✅ OTP resend response received!');
    console.log('Response:', resendResponse.data);
    console.log(`📤 SMS Status: ${resendResponse.data.smsStatus}`);

    if (resendResponse.data.smsStatus === 'sent') {
      console.log('\n🎉 Resend SMS sent successfully!');
    } else {
      console.log('\n⚠️  Resend SMS failed. Check console logs.');
    }

    console.log('\n🎯 SMS Testing Summary:');
    console.log('='.repeat(50));
    console.log(`📱 Phone Number: ${phone}`);
    console.log(`📤 Initial SMS Status: ${smsStatus}`);
    console.log(`🔄 Resend SMS Status: ${resendResponse.data.smsStatus}`);
    console.log('='.repeat(50));

    if (smsStatus === 'sent' || resendResponse.data.smsStatus === 'sent') {
      console.log('✅ SMS functionality is working correctly!');
      console.log('📱 Users should receive OTPs on their phones.');
    } else {
      console.log('⚠️  SMS functionality needs configuration.');
      console.log('📖 Please check SMS_SETUP_GUIDE.md for setup instructions.');
    }

  } catch (error) {
    console.error('❌ SMS test failed:', error.response?.data || error.message);
    console.error('📖 Please check SMS_SETUP_GUIDE.md for troubleshooting.');
  }
}

// Alternative test with user input
async function testWithUserPhone() {
  console.log('📱 SMS Test with Your Phone Number');
  console.log('='.repeat(40));
  
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  readline.question('Enter your phone number (e.g., 9876543210): ', async (phoneNumber) => {
    if (!phoneNumber) {
      console.log('❌ Phone number is required');
      readline.close();
      return;
    }

    try {
      console.log(`\n🔄 Sending OTP to ${phoneNumber}...`);
      
      const response = await axios.post(`${BASE_URL}/api/delivery/send-otp`, {
        phone: phoneNumber,
        purpose: 'PHONE_VERIFICATION'
      });

      console.log('✅ OTP request sent!');
      console.log('Response:', response.data);
      
      if (response.data.smsStatus === 'sent') {
        console.log('🎉 SMS sent successfully! Check your phone.');
      } else {
        console.log('⚠️  SMS sending failed. OTP logged to console.');
        console.log('🔐 OTP:', response.data.otp);
      }

    } catch (error) {
      console.error('❌ Failed to send OTP:', error.response?.data || error.message);
    }

    readline.close();
  });
}

// Check command line arguments
const args = process.argv.slice(2);

if (args.includes('--interactive') || args.includes('-i')) {
  testWithUserPhone();
} else {
  testSMSFunctionality();
} 