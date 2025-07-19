#!/usr/bin/env node

/**
 * API Testing Script for CounselFlow Neo
 * Tests core authentication endpoints
 */

const axios = require('axios');

const API_BASE = 'http://localhost:8000';
const TEST_USER = {
  email: 'test@counselflow.com',
  password: 'TestPassword123!',
  firstName: 'Test',
  lastName: 'User'
};

let authToken = null;

async function makeRequest(method, endpoint, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${API_BASE}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status
    };
  }
}

async function testHealthCheck() {
  console.log('\n🔍 Testing Health Check...');
  const result = await makeRequest('GET', '/health');
  
  if (result.success) {
    console.log('✅ Health check passed');
    console.log('   Status:', result.data.status);
    console.log('   Environment:', result.data.environment);
  } else {
    console.log('❌ Health check failed:', result.error);
  }
  
  return result.success;
}

async function testAPIInfo() {
  console.log('\n🔍 Testing API Info...');
  const result = await makeRequest('GET', '/api');
  
  if (result.success) {
    console.log('✅ API info retrieved');
    console.log('   Name:', result.data.name);
    console.log('   Status:', result.data.status);
    console.log('   Features:', JSON.stringify(result.data.features, null, 2));
  } else {
    console.log('❌ API info failed:', result.error);
  }
  
  return result.success;
}

async function testUserRegistration() {
  console.log('\n🔍 Testing User Registration...');
  const result = await makeRequest('POST', '/api/auth/register', TEST_USER);
  
  if (result.success) {
    console.log('✅ User registration successful');
    console.log('   User ID:', result.data.data.user.id);
    console.log('   Email:', result.data.data.user.email);
    console.log('   Role:', result.data.data.user.role);
  } else {
    if (result.error?.error?.includes('already exists')) {
      console.log('ℹ️  User already exists, skipping registration');
      return true;
    } else {
      console.log('❌ User registration failed:', result.error);
    }
  }
  
  return result.success || (result.error?.error?.includes('already exists'));
}

async function testUserLogin() {
  console.log('\n🔍 Testing User Login...');
  const result = await makeRequest('POST', '/api/auth/login', {
    email: TEST_USER.email,
    password: TEST_USER.password
  });
  
  if (result.success) {
    console.log('✅ User login successful');
    console.log('   User ID:', result.data.data.user.id);
    console.log('   Access Token:', result.data.data.accessToken ? '✓ Present' : '❌ Missing');
    console.log('   Session ID:', result.data.data.session.id);
    
    // Store auth token for subsequent requests
    authToken = result.data.data.accessToken;
    return true;
  } else {
    console.log('❌ User login failed:', result.error);
    return false;
  }
}

async function testProtectedEndpoint() {
  console.log('\n🔍 Testing Protected Endpoint...');
  
  if (!authToken) {
    console.log('❌ No auth token available for testing');
    return false;
  }
  
  const result = await makeRequest('GET', '/api/auth/me', null, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (result.success) {
    console.log('✅ Protected endpoint access successful');
    console.log('   User:', result.data.data.firstName, result.data.data.lastName);
    console.log('   Email:', result.data.data.email);
    console.log('   Role:', result.data.data.role);
  } else {
    console.log('❌ Protected endpoint failed:', result.error);
  }
  
  return result.success;
}

async function runTests() {
  console.log('🚀 Starting CounselFlow Neo API Tests\n');
  console.log('Target API:', API_BASE);
  console.log('Test User:', TEST_USER.email);
  
  const results = [];
  
  // Run all tests
  results.push(await testHealthCheck());
  results.push(await testAPIInfo());
  results.push(await testUserRegistration());
  results.push(await testUserLogin());
  results.push(await testProtectedEndpoint());
  
  // Summary
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log('\n📊 Test Results Summary');
  console.log('=========================');
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);
  
  if (passed === total) {
    console.log('\n🎉 All tests passed! API is fully functional.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the logs above.');
  }
  
  process.exit(passed === total ? 0 : 1);
}

// Run the tests
runTests().catch(error => {
  console.error('\n💥 Test runner crashed:', error.message);
  process.exit(1);
});