/**
 * API Test Script for LearnFlow Enhancements
 * Tests the key improvements made to the API
 */

const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';
let authToken = null;
let userId = null;

// Helper function to log test results
function logTest(name, passed, message = '') {
  console.log(`${passed ? '✅' : '❌'} ${name}: ${message}`);
  return passed;
}

// Test 1: Health Check
async function testHealthCheck() {
  try {
    const response = await axios.get(`${API_BASE}/health`);
    return logTest('Health Check', 
      response.data.status === 'ok' && response.data.service === 'LearnFlow API',
      `Service: ${response.data.service}, Status: ${response.data.status}`
    );
  } catch (error) {
    return logTest('Health Check', false, error.message);
  }
}

// Test 2: API Documentation Endpoint
async function testApiDocumentation() {
  try {
    const response = await axios.get(`${API_BASE}/`);
    return logTest('API Documentation', 
      response.data.message === 'Welcome to LearnFlow API' && response.data.endpoints,
      response.data.message
    );
  } catch (error) {
    return logTest('API Documentation', false, error.message);
  }
}

// Test 3: Register User with Validation
async function testUserRegistration() {
  try {
    const userData = {
      name: 'Test User',
      email: 'test' + Date.now() + '@example.com',
      password: 'password123'
    };

    const response = await axios.post(`${API_BASE}/auth/register`, userData);
    const passed = response.data.success === true && response.data.token && response.data.user;
    
    if (passed) {
      authToken = response.data.token;
      userId = response.data.user.id;
    }
    
    return logTest('User Registration', 
      passed,
      passed ? `User created: ${userData.email}` : 'Registration failed'
    );
  } catch (error) {
    if (error.response) {
      return logTest('User Registration', false, `Validation: ${error.response.data.message}`);
    }
    return logTest('User Registration', false, error.message);
  }
}

// Test 4: Invalid Registration (validation test)
async function testInvalidRegistration() {
  try {
    const invalidData = {
      name: '', // Empty name
      email: 'invalid-email',
      password: '123' // Too short
    };

    await axios.post(`${API_BASE}/auth/register`, invalidData);
    return logTest('Invalid Registration', false, 'Should have failed validation');
  } catch (error) {
    if (error.response && error.response.status === 400) {
      return logTest('Invalid Registration', true, 'Properly rejected invalid data');
    }
    return logTest('Invalid Registration', false, `Unexpected error: ${error.message}`);
  }
}

// Test 5: User Login
async function testUserLogin() {
  try {
    const loginData = {
      email: 'test@example.com',
      password: 'password123'
    };

    const response = await axios.post(`${API_BASE}/auth/login`, loginData);
    const passed = response.data.success === true && response.data.token;
    
    if (passed && !authToken) {
      authToken = response.data.token;
      userId = response.data.user.id;
    }
    
    return logTest('User Login', 
      passed,
      passed ? 'Login successful' : 'Login failed'
    );
  } catch (error) {
    if (error.response && error.response.status === 401) {
      return logTest('User Login', true, 'Properly rejected invalid credentials');
    }
    return logTest('User Login', false, error.message);
  }
}

// Test 6: Get Subjects (public endpoint)
async function testGetSubjects() {
  try {
    const response = await axios.get(`${API_BASE}/subjects`);
    const passed = response.data.success === true && Array.isArray(response.data.data);
    
    return logTest('Get Subjects', 
      passed,
      passed ? `Found ${response.data.count} subjects` : 'Failed to get subjects'
    );
  } catch (error) {
    return logTest('Get Subjects', false, error.message);
  }
}

// Test 7: Get Books with Pagination
async function testGetBooksWithPagination() {
  try {
    const response = await axios.get(`${API_BASE}/books?page=1&limit=5`);
    const passed = response.data.success === true && 
                   response.data.page === 1 && 
                   response.data.limit === 5 &&
                   Array.isArray(response.data.data);
    
    return logTest('Get Books with Pagination', 
      passed,
      passed ? `Page ${response.data.page} of ${response.data.totalPages}` : 'Failed'
    );
  } catch (error) {
    return logTest('Get Books with Pagination', false, error.message);
  }
}

// Test 8: Protected Route Access (without token)
async function testProtectedRouteWithoutToken() {
  try {
    await axios.get(`${API_BASE}/progress/${userId}`);
    return logTest('Protected Route (no token)', false, 'Should have been blocked');
  } catch (error) {
    if (error.response && error.response.status === 401) {
      return logTest('Protected Route (no token)', true, 'Properly blocked unauthorized access');
    }
    return logTest('Protected Route (no token)', false, `Unexpected error: ${error.message}`);
  }
}

// Test 9: Test 404 Route Handling
async function test404Handling() {
  try {
    await axios.get(`${API_BASE}/nonexistent`);
    return logTest('404 Handling', false, 'Should have returned 404');
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return logTest('404 Handling', true, 'Properly handled non-existent route');
    }
    return logTest('404 Handling', false, `Unexpected error: ${error.message}`);
  }
}

// Test 10: Test Validation Middleware with Invalid IDs
async function testInvalidIdValidation() {
  try {
    await axios.get(`${API_BASE}/books/invalid-object-id`);
    return logTest('Invalid ID Validation', false, 'Should have rejected invalid ObjectId');
  } catch (error) {
    if (error.response && error.response.status === 400) {
      return logTest('Invalid ID Validation', true, 'Properly rejected invalid ObjectId');
    }
    return logTest('Invalid ID Validation', false, `Unexpected error: ${error.message}`);
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting LearnFlow API Tests\n');
  console.log('='.repeat(50));

  const tests = [
    testHealthCheck,
    testApiDocumentation,
    testInvalidRegistration, // Test validation first
    testUserRegistration,    // Then try valid registration
    testUserLogin,           // Test login
    testGetSubjects,         // Test public endpoints
    testGetBooksWithPagination,
    testInvalidIdValidation, // Test validation middleware
    test404Handling,         // Test error handling
    testProtectedRouteWithoutToken // Test auth middleware
  ];

  let passed = 0;
  let total = tests.length;

  for (const test of tests) {
    const result = await test();
    if (result) passed++;
  }

  console.log('\n' + '='.repeat(50));
  console.log(`📊 Test Results: ${passed}/${total} passed`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! The API enhancements are working correctly.');
  } else {
    console.log('⚠️ Some tests failed. Review the errors above.');
  }
  
  return passed === total;
}

// Check if server is running and run tests
async function main() {
  try {
    // First check if server is reachable
    await axios.get('http://localhost:5000/api/health', { timeout: 5000 });
    console.log('✅ Server is running. Starting tests...\n');
    await runAllTests();
  } catch (error) {
    console.log('❌ Server is not running or not reachable.');
    console.log('Please start the server with:');
    console.log('cd server && npm run dev');
    console.log('\nThen run this test again.');
  }
}

// Run the tests
main().catch(error => {
  console.error('Test runner error:', error.message);
  process.exit(1);
});