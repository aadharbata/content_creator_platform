const https = require('https');
const { URLSearchParams } = require('url');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

console.log('🔍 Step-by-Step OAuth Debug\n');

// Test 1: Verify credentials format
console.log('STEP 1: Credential Format Check');
const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

console.log('Client ID format:', clientId ? 'Valid format ✅' : 'Missing ❌');
console.log('Client ID ends with:', clientId ? clientId.slice(-20) : 'N/A');
console.log('Client Secret format:', clientSecret ? 'Valid format ✅' : 'Missing ❌');
console.log('Client Secret starts with:', clientSecret ? clientSecret.slice(0, 10) + '...' : 'N/A');

// Test 2: Make a direct request to Google's token endpoint to test credentials
console.log('\nSTEP 2: Testing Token Exchange (simulating NextAuth)');
console.log('This will test if Google accepts our credentials...');

// Simulate the token exchange that's failing
const testTokenExchange = () => {
  const postData = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code: 'dummy_code_for_testing',
    grant_type: 'authorization_code',
    redirect_uri: 'http://localhost:3000/api/auth/callback/google'
  });

  const options = {
    hostname: 'oauth2.googleapis.com',
    path: '/token',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': postData.toString().length,
    },
  };

  const req = https.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Response Status:', res.statusCode);
      console.log('Response:', data);
      
      if (res.statusCode === 400) {
        const response = JSON.parse(data);
        if (response.error === 'invalid_client') {
          console.log('\n❌ PROBLEM FOUND:');
          console.log('Google says "invalid_client" - This means:');
          console.log('1. Client ID is wrong');
          console.log('2. Client Secret is wrong');
          console.log('3. OAuth consent screen not properly configured');
          console.log('4. App not published or test user not added correctly');
        }
      }
      
      console.log('\nSTEP 3: Solutions to try:');
      console.log('1. Regenerate client secret in Google Console');
      console.log('2. Double-check OAuth consent screen status');
      console.log('3. Make sure app is "In production" or you are added as test user');
      console.log('4. Check if domain verification is required');
    });
  });

  req.on('error', (err) => {
    console.error('Request error:', err);
  });

  req.write(postData.toString());
  req.end();
};

// Run the test
if (clientId && clientSecret) {
  testTokenExchange();
} else {
  console.log('❌ Missing credentials - cannot test');
}

console.log('\nSTEP 4: Quick Fixes to Try:');
console.log('1. Go to Google Console > Credentials');
console.log('2. Click your OAuth client ID');
console.log('3. Click "Download JSON" and compare with your .env.local');
console.log('4. If different, update your .env.local with the downloaded values');
console.log('5. Restart your server and try again'); 