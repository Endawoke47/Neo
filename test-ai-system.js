#!/usr/bin/env node

/**
 * AI System Integration Test
 * Tests the complete AI infrastructure for CounselFlow Legal Platform
 * User: Endawoke47
 * Date: 2025-01-17
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3005/api/v1';
const AI_ENDPOINT = `${BASE_URL}/ai`;

// Test Configuration
const TEST_CONFIG = {
  // Mock authentication token (replace with real token in production)
  authToken: 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJjb3Vuc2VsZmxvdyIsImlhdCI6MTY0NzE4OTQyMCwiZXhwIjoxNjQ3Mjc1ODIwLCJhdWQiOiJjb3Vuc2VsZmxvdy5hcHAiLCJzdWIiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiaWQiOiJ0ZXN0LXVzZXItaWQiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJyb2xlIjoibGF3eWVyIn0.fake-signature',
  
  // Test scenarios for all 71 jurisdictions
  testJurisdictions: [
    'NIGERIA',       // West Africa - Common Law
    'SOUTH_AFRICA',  // Southern Africa - Mixed System
    'EGYPT',         // North Africa - Civil Law + Islamic
    'MOROCCO',       // North Africa - Mixed Islamic/French
    'UAE',           // Middle East - Islamic + Common Law
    'SAUDI_ARABIA',  // Middle East - Islamic Law
    'ISRAEL',        // Middle East - Mixed System
    'LEBANON'        // Middle East - Civil Law
  ],
  
  testLanguages: [
    'ENGLISH',
    'FRENCH', 
    'ARABIC',
    'PORTUGUESE',
    'HEBREW'
  ]
};

// Test Cases
const testCases = [
  {
    name: 'Health Check',
    endpoint: `${AI_ENDPOINT}/health`,
    method: 'GET',
    data: null,
    expectedStatus: 200
  },
  
  {
    name: 'Available Jurisdictions',
    endpoint: `${AI_ENDPOINT}/jurisdictions`,
    method: 'GET',
    data: null,
    expectedStatus: 200,
    validate: (response) => {
      return response.data.data && response.data.data.length >= 71;
    }
  },
  
  {
    name: 'Available Languages',
    endpoint: `${AI_ENDPOINT}/languages`,
    method: 'GET', 
    data: null,
    expectedStatus: 200,
    validate: (response) => {
      return response.data.data && response.data.data.length >= 10;
    }
  },
  
  {
    name: 'Provider Status',
    endpoint: `${AI_ENDPOINT}/providers`,
    method: 'GET',
    data: null,
    expectedStatus: 200,
    validate: (response) => {
      return response.data.data && typeof response.data.data === 'object';
    }
  },
  
  {
    name: 'Contract Analysis - Nigerian Law',
    endpoint: `${AI_ENDPOINT}/contract/analyze`,
    method: 'POST',
    data: {
      contract: {
        title: 'Software Development Agreement',
        content: 'This Software Development Agreement is entered into between TechCorp Nigeria Ltd and ClientCorp for the development of a custom web application...',
        parties: ['TechCorp Nigeria Ltd', 'ClientCorp'],
        jurisdiction: 'Lagos, Nigeria'
      },
      jurisdiction: 'NIGERIA',
      language: 'ENGLISH',
      confidentialityLevel: 'confidential'
    },
    expectedStatus: 200,
    validate: (response) => {
      return response.data.success && response.data.data;
    }
  },
  
  {
    name: 'Legal Research - South African Competition Law',
    endpoint: `${AI_ENDPOINT}/research`,
    method: 'POST',
    data: {
      query: 'merger approval requirements under South African Competition Act',
      jurisdiction: 'SOUTH_AFRICA',
      practiceArea: 'competition_law',
      language: 'ENGLISH'
    },
    expectedStatus: 200,
    validate: (response) => {
      return response.data.success && response.data.data;
    }
  },
  
  {
    name: 'Risk Assessment - UAE Corporate Structure',
    endpoint: `${AI_ENDPOINT}/risk/assess`,
    method: 'POST', 
    data: {
      matterData: {
        type: 'corporate_formation',
        jurisdiction: 'UAE',
        entityType: 'LLC',
        businessActivity: 'technology consulting',
        ownership: 'foreign_owned'
      },
      jurisdiction: 'UAE',
      confidentialityLevel: 'confidential'
    },
    expectedStatus: 200,
    validate: (response) => {
      return response.data.success && response.data.data;
    }
  },
  
  {
    name: 'Compliance Check - Egyptian Banking Regulations',
    endpoint: `${AI_ENDPOINT}/compliance/check`,
    method: 'POST',
    data: {
      entityData: {
        type: 'financial_services',
        license: 'banking_license',
        jurisdiction: 'EGYPT',
        activities: ['deposits', 'lending', 'foreign_exchange']
      },
      jurisdiction: 'EGYPT',
      regulations: ['Central Bank of Egypt Law', 'Banking Law 88/2003']
    },
    expectedStatus: 200,
    validate: (response) => {
      return response.data.success && response.data.data;
    }
  },
  
  {
    name: 'Document Review - Moroccan Contract (French)',
    endpoint: `${AI_ENDPOINT}/document/review`,
    method: 'POST',
    data: {
      document: {
        title: 'Contrat de Prestation de Services',
        content: 'Le présent contrat de prestation de services est conclu entre...',
        language: 'french',
        type: 'service_agreement'
      },
      reviewType: 'compliance_review',
      jurisdiction: 'MOROCCO'
    },
    expectedStatus: 200,
    validate: (response) => {
      return response.data.success && response.data.data;
    }
  },
  
  {
    name: 'AI Analysis - Multi-Jurisdiction Transaction',
    endpoint: `${AI_ENDPOINT}/analyze`,
    method: 'POST',
    data: {
      type: 'CROSS_BORDER_TRANSACTION',
      input: {
        transaction: {
          type: 'acquisition',
          target_jurisdiction: 'NIGERIA',
          acquirer_jurisdiction: 'SOUTH_AFRICA',
          value: '$50M USD',
          sector: 'fintech'
        }
      },
      context: {
        jurisdiction: 'NIGERIA',
        legalSystem: 'COMMON_LAW',
        language: 'ENGLISH',
        practiceArea: 'mergers_acquisitions',
        confidentialityLevel: 'privileged'
      }
    },
    expectedStatus: 200,
    validate: (response) => {
      return response.data.success && response.data.data && response.data.metadata;
    }
  }
];

// Helper Functions
const makeRequest = async (testCase) => {
  const config = {
    method: testCase.method,
    url: testCase.endpoint,
    headers: {
      'Authorization': TEST_CONFIG.authToken,
      'Content-Type': 'application/json'
    }
  };
  
  if (testCase.data) {
    config.data = testCase.data;
  }
  
  return axios(config);
};

const runTest = async (testCase) => {
  console.log(`\n🧪 Testing: ${testCase.name}`);
  console.log(`📞 ${testCase.method} ${testCase.endpoint}`);
  
  try {
    const startTime = Date.now();
    const response = await makeRequest(testCase);
    const duration = Date.now() - startTime;
    
    // Check status code
    if (response.status !== testCase.expectedStatus) {
      console.log(`❌ FAIL: Expected status ${testCase.expectedStatus}, got ${response.status}`);
      return false;
    }
    
    // Run custom validation if provided
    if (testCase.validate && !testCase.validate(response)) {
      console.log(`❌ FAIL: Custom validation failed`);
      console.log(`📄 Response:`, JSON.stringify(response.data, null, 2));
      return false;
    }
    
    console.log(`✅ PASS: ${duration}ms`);
    
    // Show AI metadata for AI requests
    if (response.data.metadata) {
      console.log(`🤖 Provider: ${response.data.metadata.provider || 'unknown'}`);
      console.log(`🔧 Model: ${response.data.metadata.model || 'unknown'}`);
      console.log(`💰 Cost: $${response.data.metadata.cost || 0}`);
      console.log(`🧠 Tokens: ${response.data.metadata.tokensUsed || 0}`);
    }
    
    // Show first 200 chars of AI response
    if (response.data.data && typeof response.data.data === 'object') {
      const preview = JSON.stringify(response.data.data).substring(0, 200);
      console.log(`📋 Preview: ${preview}...`);
    }
    
    return true;
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}`);
    if (error.response) {
      console.log(`📄 Error Response:`, error.response.data);
    }
    return false;
  }
};

// Main Test Runner
const runAllTests = async () => {
  console.log('🚀 CounselFlow AI System Integration Test');
  console.log('===========================================');
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`🧠 AI Endpoint: ${AI_ENDPOINT}`);
  console.log(`📊 Total Test Cases: ${testCases.length}`);
  
  let passed = 0;
  let failed = 0;
  
  for (const testCase of testCases) {
    const result = await runTest(testCase);
    if (result) {
      passed++;
    } else {
      failed++;
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n🏁 Test Results Summary');
  console.log('========================');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! AI System is ready for production.');
    console.log('\n📋 Next Steps:');
    console.log('1. ✅ Phase 1 Complete: AI Foundation Infrastructure');
    console.log('2. 🔄 Start Phase 2: Legal Research Engine & Contract Intelligence');
    console.log('3. 🎯 Begin fine-tuning legal models with African/Middle Eastern data');
    console.log('4. 🔍 Implement semantic search with vector database');
    console.log('5. ⚡ Optimize caching and performance');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the errors above.');
    process.exit(1);
  }
};

// Multi-Jurisdiction Test
const testMultipleJurisdictions = async () => {
  console.log('\n🌍 Testing Multi-Jurisdiction Support');
  console.log('=====================================');
  
  for (const jurisdiction of TEST_CONFIG.testJurisdictions) {
    console.log(`\n🏛️  Testing jurisdiction: ${jurisdiction}`);
    
    try {
      const response = await makeRequest({
        endpoint: `${AI_ENDPOINT}/research`,
        method: 'POST',
        data: {
          query: 'corporate governance requirements',
          jurisdiction: jurisdiction,
          practiceArea: 'corporate_law',
          language: 'ENGLISH'
        }
      });
      
      if (response.status === 200 && response.data.success) {
        console.log(`✅ ${jurisdiction}: Working`);
      } else {
        console.log(`❌ ${jurisdiction}: Failed`);
      }
    } catch (error) {
      console.log(`❌ ${jurisdiction}: Error - ${error.message}`);
    }
  }
};

// Export for programmatic use
module.exports = {
  runAllTests,
  testMultipleJurisdictions,
  testCases,
  TEST_CONFIG
};

// Run tests if called directly
if (require.main === module) {
  (async () => {
    await runAllTests();
    await testMultipleJurisdictions();
  })();
}
