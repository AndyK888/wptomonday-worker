#!/usr/bin/env node

/**
 * Test script for the WordPress to Monday.com Worker
 * Run with: node test-worker.js [worker-url]
 */

const WORKER_URL = process.argv[2] || 'http://localhost:8787';

async function testEndpoint(method, path, body = null, expectedStatus = 200) {
  const url = `${WORKER_URL}${path}`;
  console.log(`\n🧪 Testing ${method} ${path}`);
  
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(url, options);
    const data = await response.json();
    
    const status = response.status === expectedStatus ? '✅' : '❌';
    console.log(`${status} Status: ${response.status} (expected: ${expectedStatus})`);
    
    if (response.status !== expectedStatus) {
      console.log('❌ Response:', JSON.stringify(data, null, 2));
    } else {
      console.log('✅ Success:', data.message || 'OK');
      if (data.data && typeof data.data === 'object') {
        console.log('📊 Data keys:', Object.keys(data.data).join(', '));
      }
    }
    
    return { success: response.status === expectedStatus, data };
  } catch (error) {
    console.log('❌ Error:', error.message);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🚀 Testing WordPress to Monday.com Worker');
  console.log('🔗 Worker URL:', WORKER_URL);
  
  const tests = [
    // Basic endpoints
    ['GET', '/', null, 200],
    ['GET', '/health', null, 200],
    
    // Test endpoints that don't require Monday.com API
    ['GET', '/api/test-phone', null, 200],
    ['GET', '/api/monday/boards', null, 200],
    ['GET', '/api/content', null, 200],
    
    // CORS preflight
    ['OPTIONS', '/webhook/cf7', null, 200],
    
    // Error cases
    ['GET', '/nonexistent', null, 404],
    ['GET', '/webhook/cf7', null, 405], // Wrong method
    
    // Data validation tests
    ['POST', '/api/monday/create-lead', {}, 400], // Missing required fields
    ['POST', '/api/monday/create-lead', { name: 'Test' }, 400], // Missing email
    
    // Content scheduling test
    ['POST', '/api/schedule', {}, 400], // Missing required fields
    ['POST', '/api/schedule', {
      title: 'Test Content',
      content: 'Test content body',
      scheduledDate: '2024-01-15T10:00:00Z',
      mondayBoardId: 'board123'
    }, 200],
    
    // Sync test
    ['POST', '/api/sync', {}, 200],
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const [method, path, body, expectedStatus] of tests) {
    const result = await testEndpoint(method, path, body, expectedStatus);
    if (result.success) {
      passed++;
    } else {
      failed++;
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n📊 Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
  
  if (failed > 0) {
    console.log('\n⚠️  Some tests failed. Check the output above for details.');
    process.exit(1);
  } else {
    console.log('\n🎉 All tests passed!');
  }
}

// Check if fetch is available (Node.js 18+)
if (typeof fetch === 'undefined') {
  console.error('❌ This script requires Node.js 18+ with built-in fetch support');
  console.error('💡 Alternatively, install node-fetch: npm install node-fetch');
  process.exit(1);
}

runTests().catch(console.error);
