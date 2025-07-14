const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:3000';

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  errors: []
};

const logTest = (testName, success, error = null) => {
  if (success) {
    console.log(`✅ ${testName} - PASSED`);
    testResults.passed++;
  } else {
    console.log(`❌ ${testName} - FAILED`);
    if (error) {
      console.log(`   Error: ${error.message || error}`);
      testResults.errors.push({ test: testName, error: error.message || error });
    }
    testResults.failed++;
  }
};

// Test functions
const testPublicRoutes = async () => {
  try {
    console.log('\n🌐 Testing Public Routes...');
    
    // Test GET /api/posts
    const postsResponse = await axios.get(`${BASE_URL}/api/posts`);
    logTest('GET /api/posts', postsResponse.status === 200);
    
    // Test GET /api/creators
    const creatorsResponse = await axios.get(`${BASE_URL}/api/creators`);
    logTest('GET /api/creators', creatorsResponse.status === 200);
    
    // Test GET /api/courses
    const coursesResponse = await axios.get(`${BASE_URL}/api/courses`);
    logTest('GET /api/courses', coursesResponse.status === 200);
    
    // Test GET /api/courses/allcourses
    const allCoursesResponse = await axios.get(`${BASE_URL}/api/courses/allcourses`);
    logTest('GET /api/courses/allcourses', allCoursesResponse.status === 200);
    
    // Test GET /api/courses/topcourses
    const topCoursesResponse = await axios.get(`${BASE_URL}/api/courses/topcourses`);
    logTest('GET /api/courses/topcourses', topCoursesResponse.status === 200);
    
    return true;
  } catch (error) {
    logTest('Public Routes', false, error.response?.data || error.message);
    return false;
  }
};

const testSignup = async () => {
  try {
    console.log('\n🔐 Testing User Signup...');
    
    // Test Creator Signup
    const creatorResponse = await axios.post(`${BASE_URL}/api/auth/signup`, {
      name: 'Test Creator',
      email: 'testcreator@test.com',
      password: 'testpass123',
      role: 'CREATOR'
    });
    logTest('Creator Signup', creatorResponse.status === 200);
    
    // Test Consumer Signup
    const consumerResponse = await axios.post(`${BASE_URL}/api/auth/signup`, {
      name: 'Test Consumer',
      email: 'testconsumer@test.com',
      password: 'testpass123',
      role: 'CONSUMER'
    });
    logTest('Consumer Signup', consumerResponse.status === 200);
    
    return true;
  } catch (error) {
    logTest('User Signup', false, error.response?.data || error.message);
    return false;
  }
};

const testLogin = async () => {
  try {
    console.log('\n🔑 Testing User Login...');
    
    // Test Creator Login
    const creatorLoginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'testcreator@test.com',
      password: 'testpass123'
    });
    
    if (creatorLoginResponse.status === 200) {
      console.log('✅ Creator Login - PASSED');
      testResults.passed++;
      return creatorLoginResponse.data.accessToken;
    } else {
      console.log('❌ Creator Login - FAILED');
      testResults.failed++;
      return null;
    }
  } catch (error) {
    console.log('❌ Creator Login - FAILED');
    console.log(`   Error: ${error.response?.data || error.message}`);
    testResults.failed++;
    return null;
  }
};

const testAuthenticatedRoutes = async (token) => {
  try {
    console.log('\n🔒 Testing Authenticated Routes...');
    
    if (!token) {
      console.log('❌ No token available for authenticated routes');
      return false;
    }
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // Test GET /api/conversations
    const conversationsResponse = await axios.get(`${BASE_URL}/api/conversations`, { headers });
    logTest('GET /api/conversations', conversationsResponse.status === 200);
    
    // Test GET /api/communities
    const communitiesResponse = await axios.get(`${BASE_URL}/api/communities`, { headers });
    logTest('GET /api/communities', communitiesResponse.status === 200);
    
    // Test GET /api/communities/my-communities
    const myCommunitiesResponse = await axios.get(`${BASE_URL}/api/communities/my-communities`, { headers });
    logTest('GET /api/communities/my-communities', myCommunitiesResponse.status === 200);
    
    return true;
  } catch (error) {
    logTest('Authenticated Routes', false, error.response?.data || error.message);
    return false;
  }
};

// Main test runner
const runTests = async () => {
  console.log('🚀 Starting API Route Testing...\n');
  
  // Step 1: Test public routes
  await testPublicRoutes();
  
  // Step 2: Test user signup
  await testSignup();
  
  // Step 3: Test user login
  const token = await testLogin();
  
  // Step 4: Test authenticated routes
  if (token) {
    await testAuthenticatedRoutes(token);
  }
  
  // Final Results
  console.log('\n📊 Test Results Summary:');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
  
  if (testResults.errors.length > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.errors.forEach(({ test, error }) => {
      console.log(`   - ${test}: ${error}`);
    });
  }
  
  console.log('\n🎉 Testing Complete!');
};

// Run the tests
runTests().catch(console.error); 