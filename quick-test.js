// Quick test to show SMS functionality without Twilio
const { sendOTPSMS, sendOTPSMSAlternative } = require('./lib/sms.ts');

async function quickTest() {
  console.log('🧪 Testing SMS System Without Twilio...\n');
  
  const phone = '+919876543210';
  const otp = '123456';
  
  console.log('1️⃣ Attempting Primary SMS (Twilio)...');
  const primaryResult = await sendOTPSMS(phone, otp);
  console.log('Primary result:', primaryResult);
  
  console.log('\n2️⃣ Using Alternative SMS (Console)...');
  const altResult = await sendOTPSMSAlternative(phone, otp);
  console.log('Alternative result:', altResult);
  
  console.log('\n✅ This is exactly what happens in your signup flow!');
}

quickTest(); 