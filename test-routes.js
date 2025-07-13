import axios from 'axios';

// Test configuration
const BASE_URL = 'http://localhost:3001';
const TEST_CREATOR = {
  name: 'Test Creator',
  email: 'testcreator@test.com',
  password: 'testpass123',
  role: 'CREATOR'
};

const TEST_CONSUMER = {
  name: 'Test Consumer',
  email: 'testconsumer@test.com',
  password: 'testpass123',
  role: 'CONSUMER'
};

let creatorToken = null;
let consumerToken = null;
let creatorId = null;
let consumerId = null;
let testPostId = null;

// Helper function to make authenticated requests
const authRequest = (token) => ({
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

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
const testSignup = async () => {
  try {
    console.log('\n🔐 Testing User Signup...');
    
    // Test Creator Signup
    const creatorResponse = await axios.post(`${BASE_URL}/api/auth/signup`, TEST_CREATOR);
    logTest('Creator Signup', creatorResponse.status === 200);
    
    // Test Consumer Signup
    const consumerResponse = await axios.post(`${BASE_URL}/api/auth/signup`, TEST_CONSUMER);
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
      email: TEST_CREATOR.email,
      password: TEST_CREATOR.password
    });
    
    if (creatorLoginResponse.status === 200) {
      creatorToken = creatorLoginResponse.data.accessToken;
      creatorId = creatorLoginResponse.data.user.id;
      logTest('Creator Login', true);
    } else {
      logTest('Creator Login', false);
    }
    
    // Test Consumer Login
    const consumerLoginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: TEST_CONSUMER.email,
      password: TEST_CONSUMER.password
    });
    
    if (consumerLoginResponse.status === 200) {
      consumerToken = consumerLoginResponse.data.accessToken;
      consumerId = consumerLoginResponse.data.user.id;
      logTest('Consumer Login', true);
    } else {
      logTest('Consumer Login', false);
    }
    
    return creatorToken && consumerToken;
  } catch (error) {
    logTest('User Login', false, error.response?.data || error.message);
    return false;
  }
};

const testPostsRoutes = async () => {
  try {
    console.log('\n📝 Testing Posts Routes...');
    
    // Test GET /api/posts (should work without auth)
    const postsResponse = await axios.get(`${BASE_URL}/api/posts`);
    logTest('GET /api/posts', postsResponse.status === 200);
    
    if (creatorToken) {
      // Test POST /api/posts (create post)
      const formData = new FormData();
      formData.append('creatorId', creatorId);
      formData.append('title', 'Test Post');
      formData.append('content', 'This is a test post content');
      formData.append('isPaidOnly', 'false');
      
      const createPostResponse = await axios.post(`${BASE_URL}/api/posts`, formData, {
        headers: {
          'Authorization': `Bearer ${creatorToken}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      logTest('POST /api/posts (Create Post)', createPostResponse.status === 200);
      
      // Get posts again to find our test post
      const postsResponse2 = await axios.get(`${BASE_URL}/api/posts`);
      if (postsResponse2.status === 200 && postsResponse2.data.posts.length > 0) {
        testPostId = postsResponse2.data.posts[0].id;
      }
    }
    
    return true;
  } catch (error) {
    logTest('Posts Routes', false, error.response?.data || error.message);
    return false;
  }
};

const testLikeRoutes = async () => {
  try {
    console.log('\n❤️ Testing Like Routes...');
    
    if (!testPostId || !consumerToken) {
      logTest('Like Routes', false, 'Missing post ID or consumer token');
      return false;
    }
    
    // Test POST /api/posts/[postId]/like
    const likeResponse = await axios.post(
      `${BASE_URL}/api/posts/${testPostId}/like`,
      {},
      authRequest(consumerToken)
    );
    
    logTest('POST /api/posts/[postId]/like', likeResponse.status === 200);
    
    return true;
  } catch (error) {
    logTest('Like Routes', false, error.response?.data || error.message);
    return false;
  }
};

const testCommentRoutes = async () => {
  try {
    console.log('\n💬 Testing Comment Routes...');
    
    if (!testPostId || !consumerToken) {
      logTest('Comment Routes', false, 'Missing post ID or consumer token');
      return false;
    }
    
    // Test GET /api/posts/[postId]/comment
    const getCommentsResponse = await axios.get(
      `${BASE_URL}/api/posts/${testPostId}/comment`,
      authRequest(consumerToken)
    );
    
    logTest('GET /api/posts/[postId]/comment', getCommentsResponse.status === 200);
    
    // Test POST /api/posts/[postId]/comment
    const createCommentResponse = await axios.post(
      `${BASE_URL}/api/posts/${testPostId}/comment`,
      { content: 'This is a test comment' },
      authRequest(consumerToken)
    );
    
    logTest('POST /api/posts/[postId]/comment', createCommentResponse.status === 200);
    
    return true;
  } catch (error) {
    logTest('Comment Routes', false, error.response?.data || error.message);
    return false;
  }
};

const testSubscribeRoutes = async () => {
  try {
    console.log('\n📧 Testing Subscribe Routes...');
    
    if (!creatorId || !consumerToken) {
      logTest('Subscribe Routes', false, 'Missing creator ID or consumer token');
      return false;
    }
    
    // Test GET /api/subscribe/check
    const checkResponse = await axios.get(
      `${BASE_URL}/api/subscribe/check?creatorId=${creatorId}`,
      authRequest(consumerToken)
    );
    
    logTest('GET /api/subscribe/check', checkResponse.status === 200);
    
    // Test POST /api/subscribe
    const subscribeResponse = await axios.post(
      `${BASE_URL}/api/subscribe`,
      { creatorId: creatorId },
      authRequest(consumerToken)
    );
    
    logTest('POST /api/subscribe', subscribeResponse.status === 200);
    
    return true;
  } catch (error) {
    logTest('Subscribe Routes', false, error.response?.data || error.message);
    return false;
  }
};

const testCreatorRoutes = async () => {
  try {
    console.log('\n👨‍🎨 Testing Creator Routes...');
    
    if (!creatorId) {
      logTest('Creator Routes', false, 'Missing creator ID');
      return false;
    }
    
    // Test GET /api/creator/[id]
    const creatorResponse = await axios.get(`${BASE_URL}/api/creator/${creatorId}`);
    logTest('GET /api/creator/[id]', creatorResponse.status === 200);
    
    // Test GET /api/creator/[id]/posts
    const creatorPostsResponse = await axios.get(
      `${BASE_URL}/api/creator/${creatorId}/posts`,
      authRequest(consumerToken)
    );
    
    logTest('GET /api/creator/[id]/posts', creatorPostsResponse.status === 200);
    
    return true;
  } catch (error) {
    logTest('Creator Routes', false, error.response?.data || error.message);
    return false;
  }
};

const testCreatorsRoutes = async () => {
  try {
    console.log('\n👥 Testing Creators Routes...');
    
    // Test GET /api/creators
    const creatorsResponse = await axios.get(`${BASE_URL}/api/creators`);
    logTest('GET /api/creators', creatorsResponse.status === 200);
    
    return true;
  } catch (error) {
    logTest('Creators Routes', false, error.response?.data || error.message);
    return false;
  }
};

const testCoursesRoutes = async () => {
  try {
    console.log('\n📚 Testing Courses Routes...');
    
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
    logTest('Courses Routes', false, error.response?.data || error.message);
    return false;
  }
};

const testPaymentRoutes = async () => {
  try {
    console.log('\n💳 Testing Payment Routes...');
    
    if (!creatorId || !consumerToken) {
      logTest('Payment Routes', false, 'Missing creator ID or consumer token');
      return false;
    }
    
    // Test POST /api/payment/create
    const createPaymentResponse = await axios.post(
      `${BASE_URL}/api/payment/create`,
      {
        amount: 100,
        currency: 'INR',
        creatorId: creatorId
      },
      authRequest(consumerToken)
    );
    
    logTest('POST /api/payment/create', createPaymentResponse.status === 200);
    
    return true;
  } catch (error) {
    logTest('Payment Routes', false, error.response?.data || error.message);
    return false;
  }
};

const testDeliveryRoutes = async () => {
  try {
    console.log('\n📦 Testing Delivery Routes...');
    
    if (!consumerToken) {
      logTest('Delivery Routes', false, 'Missing consumer token');
      return false;
    }
    
    // Test POST /api/delivery/send-otp
    const sendOtpResponse = await axios.post(
      `${BASE_URL}/api/delivery/send-otp`,
      {
        phone: '+919876543210',
        purpose: 'TEST'
      }
    );
    
    logTest('POST /api/delivery/send-otp', sendOtpResponse.status === 200);
    
    return true;
  } catch (error) {
    logTest('Delivery Routes', false, error.response?.data || error.message);
    return false;
  }
};

const testConversationsRoutes = async () => {
  try {
    console.log('\n💬 Testing Conversations Routes...');
    
    if (!consumerToken || !creatorId) {
      logTest('Conversations Routes', false, 'Missing tokens or creator ID');
      return false;
    }
    
    // Test GET /api/conversations
    const conversationsResponse = await axios.get(
      `${BASE_URL}/api/conversations`,
      authRequest(consumerToken)
    );
    
    logTest('GET /api/conversations', conversationsResponse.status === 200);
    
    // Test POST /api/conversations/start
    const startConversationResponse = await axios.post(
      `${BASE_URL}/api/conversations/start`,
      { otherUserId: creatorId },
      authRequest(consumerToken)
    );
    
    logTest('POST /api/conversations/start', startConversationResponse.status === 200);
    
    return true;
  } catch (error) {
    logTest('Conversations Routes', false, error.response?.data || error.message);
    return false;
  }
};

const testCommunitiesRoutes = async () => {
  try {
    console.log('\n👥 Testing Communities Routes...');
    
    if (!consumerToken) {
      logTest('Communities Routes', false, 'Missing consumer token');
      return false;
    }
    
    // Test GET /api/communities
    const communitiesResponse = await axios.get(
      `${BASE_URL}/api/communities`,
      authRequest(consumerToken)
    );
    
    logTest('GET /api/communities', communitiesResponse.status === 200);
    
    // Test GET /api/communities/my-communities
    const myCommunitiesResponse = await axios.get(
      `${BASE_URL}/api/communities/my-communities`,
      authRequest(consumerToken)
    );
    
    logTest('GET /api/communities/my-communities', myCommunitiesResponse.status === 200);
    
    return true;
  } catch (error) {
    logTest('Communities Routes', false, error.response?.data || error.message);
    return false;
  }
};

const testUserRoutes = async () => {
  try {
    console.log('\n👤 Testing User Routes...');
    
    if (!consumerToken) {
      logTest('User Routes', false, 'Missing consumer token');
      return false;
    }
    
    // Test PUT /api/user/update
    const updateUserResponse = await axios.put(
      `${BASE_URL}/api/user/update`,
      {
        name: 'Updated Test Consumer'
      },
      authRequest(consumerToken)
    );
    
    logTest('PUT /api/user/update', updateUserResponse.status === 200);
    
    return true;
  } catch (error) {
    logTest('User Routes', false, error.response?.data || error.message);
    return false;
  }
};

const testMyCoursesRoutes = async () => {
  try {
    console.log('\n📖 Testing My Courses Routes...');
    
    if (!consumerId) {
      logTest('My Courses Routes', false, 'Missing consumer ID');
      return false;
    }
    
    // Test GET /api/my-courses/[userId]
    const myCoursesResponse = await axios.get(`${BASE_URL}/api/my-courses/${consumerId}`);
    logTest('GET /api/my-courses/[userId]', myCoursesResponse.status === 200);
    
    return true;
  } catch (error) {
    logTest('My Courses Routes', false, error.response?.data || error.message);
    return false;
  }
};

// Main test runner
const runAllTests = async () => {
  console.log('🚀 Starting Comprehensive API Route Testing...\n');
  
  // Step 1: User Management
  await testSignup();
  await testLogin();
  
  // Step 2: Core Content Routes
  await testPostsRoutes();
  await testLikeRoutes();
  await testCommentRoutes();
  
  // Step 3: Creator & Subscription Routes
  await testCreatorRoutes();
  await testCreatorsRoutes();
  await testSubscribeRoutes();
  
  // Step 4: Course & Learning Routes
  await testCoursesRoutes();
  await testMyCoursesRoutes();
  
  // Step 5: Payment & Delivery Routes
  await testPaymentRoutes();
  await testDeliveryRoutes();
  
  // Step 6: Communication Routes
  await testConversationsRoutes();
  await testCommunitiesRoutes();
  
  // Step 7: User Management Routes
  await testUserRoutes();
  
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
runAllTests().catch(console.error); 