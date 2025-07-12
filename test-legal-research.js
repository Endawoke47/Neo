// Legal Research Engine Test Suite
// Phase 2 Feature 1 - Comprehensive Testing

const axios = require('axios');
const colors = require('colors');

// Test configuration
const API_BASE_URL = 'http://localhost:3005/api/v2/legal';
const TEST_CASES = [
  {
    name: 'Basic Contract Law Research - Nigeria',
    request: {
      query: 'contract formation requirements and validity',
      jurisdictions: ['NG'],
      legalAreas: ['contract'],
      documentTypes: ['case_law', 'statute'],
      maxResults: 10,
      includeAnalysis: true,
      includeCitations: true,
      semanticSearch: true
    },
    expectedMinResults: 1
  },
  {
    name: 'Multi-jurisdiction Corporate Law Research',
    request: {
      query: 'corporate governance and director duties',
      jurisdictions: ['ZA', 'NG', 'KE'],
      legalAreas: ['corporate'],
      documentTypes: ['case_law', 'statute', 'regulation'],
      maxResults: 20,
      includeAnalysis: true,
      complexity: 'advanced',
      semanticSearch: true,
      includeRelatedCases: true
    },
    expectedMinResults: 3
  },
  {
    name: 'Middle East IP Law Research',
    request: {
      query: 'trademark registration and protection',
      jurisdictions: ['AE', 'SA', 'IL'],
      legalAreas: ['intellectual_property'],
      documentTypes: ['statute', 'regulation'],
      maxResults: 15,
      includeAnalysis: true,
      languages: ['EN', 'AR'],
      citationFormat: 'harvard'
    },
    expectedMinResults: 2
  },
  {
    name: 'Complex International Trade Research',
    request: {
      query: 'international trade agreements and dispute resolution',
      jurisdictions: ['INTL', 'EG', 'MA', 'TR'],
      legalAreas: ['international', 'regulatory'],
      documentTypes: ['treaty', 'case_law', 'academic_paper'],
      maxResults: 25,
      includeAnalysis: true,
      complexity: 'expert',
      confidenceThreshold: 0.8,
      dateRange: {
        from: '2020-01-01',
        to: '2024-12-31'
      }
    },
    expectedMinResults: 5
  },
  {
    name: 'Employment Law Research - East Africa',
    request: {
      query: 'employment termination and severance pay',
      jurisdictions: ['KE', 'UG', 'TZ', 'RW'],
      legalAreas: ['employment'],
      documentTypes: ['statute', 'case_law', 'regulation'],
      maxResults: 12,
      includeAnalysis: true,
      complexity: 'intermediate',
      semanticSearch: true
    },
    expectedMinResults: 2
  }
];

// Utility functions
function logSuccess(message) {
  console.log(`✅ ${message}`.green);
}

function logError(message) {
  console.log(`❌ ${message}`.red);
}

function logWarning(message) {
  console.log(`⚠️  ${message}`.yellow);
}

function logInfo(message) {
  console.log(`ℹ️  ${message}`.blue);
}

function logHeader(message) {
  console.log(`\n${'='.repeat(60)}`.cyan);
  console.log(`🔬 ${message}`.cyan.bold);
  console.log(`${'='.repeat(60)}`.cyan);
}

function formatTime(ms) {
  return ms < 1000 ? `${ms}ms` : `${(ms/1000).toFixed(2)}s`;
}

// Test functions
async function testAPIHealth() {
  logHeader('LEGAL RESEARCH ENGINE - HEALTH CHECKS');
  
  try {
    // Test jurisdictions endpoint
    logInfo('Testing jurisdictions endpoint...');
    const jurisdictionsResponse = await axios.get(`${API_BASE_URL}/jurisdictions`);
    
    if (jurisdictionsResponse.data.success) {
      logSuccess(`Jurisdictions endpoint: ${jurisdictionsResponse.data.data.total} jurisdictions available`);
      logInfo(`Africa: ${jurisdictionsResponse.data.data.regions.africa} countries`);
      logInfo(`Middle East: ${jurisdictionsResponse.data.data.regions.middleEast} countries`);
    } else {
      logError('Jurisdictions endpoint failed');
    }

    // Test legal areas endpoint
    logInfo('Testing legal areas endpoint...');
    const areasResponse = await axios.get(`${API_BASE_URL}/areas`);
    
    if (areasResponse.data.success) {
      logSuccess(`Legal areas endpoint: ${areasResponse.data.data.total} areas available`);
    } else {
      logError('Legal areas endpoint failed');
    }

    // Test document types endpoint
    logInfo('Testing document types endpoint...');
    const typesResponse = await axios.get(`${API_BASE_URL}/document-types`);
    
    if (typesResponse.data.success) {
      logSuccess(`Document types endpoint: ${typesResponse.data.data.total} types available`);
    } else {
      logError('Document types endpoint failed');
    }

    return true;
  } catch (error) {
    logError(`Health check failed: ${error.message}`);
    return false;
  }
}

async function testResearchSuggestions() {
  logHeader('RESEARCH SUGGESTIONS TESTING');
  
  const testQueries = [
    'contract law',
    'corporate governance',
    'intellectual property',
    'employment rights',
    'international trade'
  ];

  let passedTests = 0;

  for (const query of testQueries) {
    try {
      logInfo(`Testing suggestions for: "${query}"`);
      
      const response = await axios.get(`${API_BASE_URL}/research/suggestions`, {
        params: { q: query }
      });

      if (response.data.success && response.data.data.suggestions.length > 0) {
        logSuccess(`Generated ${response.data.data.suggestions.length} suggestions`);
        passedTests++;
      } else {
        logError(`No suggestions generated for "${query}"`);
      }
    } catch (error) {
      logError(`Suggestion test failed for "${query}": ${error.message}`);
    }
  }

  logInfo(`Suggestions tests: ${passedTests}/${testQueries.length} passed`);
  return passedTests === testQueries.length;
}

async function testRequestValidation() {
  logHeader('REQUEST VALIDATION TESTING');
  
  const invalidRequests = [
    {
      name: 'Empty query',
      request: {
        query: '',
        jurisdictions: ['NG'],
        legalAreas: ['contract'],
        documentTypes: ['case_law'],
        maxResults: 10
      }
    },
    {
      name: 'Invalid jurisdiction',
      request: {
        query: 'test query',
        jurisdictions: ['INVALID'],
        legalAreas: ['contract'],
        documentTypes: ['case_law'],
        maxResults: 10
      }
    },
    {
      name: 'Too many results',
      request: {
        query: 'test query',
        jurisdictions: ['NG'],
        legalAreas: ['contract'],
        documentTypes: ['case_law'],
        maxResults: 150
      }
    }
  ];

  let validationTests = 0;

  for (const test of invalidRequests) {
    try {
      logInfo(`Testing validation: ${test.name}`);
      
      const response = await axios.post(`${API_BASE_URL}/validate`, test.request);
      
      if (!response.data.valid) {
        logSuccess(`Validation correctly rejected: ${test.name}`);
        validationTests++;
      } else {
        logError(`Validation incorrectly accepted: ${test.name}`);
      }
    } catch (error) {
      if (error.response && error.response.status === 400) {
        logSuccess(`Validation correctly rejected: ${test.name}`);
        validationTests++;
      } else {
        logError(`Unexpected error for ${test.name}: ${error.message}`);
      }
    }
  }

  logInfo(`Validation tests: ${validationTests}/${invalidRequests.length} passed`);
  return validationTests === invalidRequests.length;
}

async function testLegalResearch() {
  logHeader('LEGAL RESEARCH ENGINE - CORE FUNCTIONALITY');
  
  let passedTests = 0;
  const testResults = [];

  for (let i = 0; i < TEST_CASES.length; i++) {
    const testCase = TEST_CASES[i];
    const startTime = Date.now();
    
    try {
      logInfo(`Running test ${i + 1}/${TEST_CASES.length}: ${testCase.name}`);
      
      const response = await axios.post(`${API_BASE_URL}/research`, testCase.request, {
        timeout: 30000 // 30 second timeout
      });
      
      const executionTime = Date.now() - startTime;
      const result = response.data;
      
      if (result.success && result.data) {
        const research = result.data;
        
        // Validate response structure
        const hasRequiredFields = research.requestId && 
                                 research.query && 
                                 research.documents && 
                                 research.citations !== undefined &&
                                 research.precedents !== undefined;
        
        if (!hasRequiredFields) {
          logError(`Missing required fields in response`);
          continue;
        }
        
        // Check result count
        const documentCount = research.documents.length;
        if (documentCount >= testCase.expectedMinResults) {
          logSuccess(`Found ${documentCount} documents (expected min: ${testCase.expectedMinResults})`);
        } else {
          logWarning(`Found ${documentCount} documents (expected min: ${testCase.expectedMinResults})`);
        }
        
        // Validate document structure
        if (documentCount > 0) {
          const doc = research.documents[0];
          const hasDocFields = doc.id && doc.title && doc.jurisdiction && doc.relevanceScore !== undefined;
          
          if (hasDocFields) {
            logSuccess(`Document structure validated`);
          } else {
            logError(`Invalid document structure`);
            continue;
          }
        }
        
        // Check analysis if requested
        if (testCase.request.includeAnalysis && research.analysis) {
          if (research.analysis.summary) {
            logSuccess(`Analysis generated successfully`);
          } else {
            logWarning(`Analysis requested but summary missing`);
          }
        }
        
        // Check citations if requested
        if (testCase.request.includeCitations && research.citations) {
          logSuccess(`${research.citations.length} citations generated`);
        }
        
        // Performance check
        const responseTime = research.executionTime || executionTime;
        if (responseTime < 10000) { // Under 10 seconds
          logSuccess(`Response time: ${formatTime(responseTime)}`);
        } else {
          logWarning(`Slow response time: ${formatTime(responseTime)}`);
        }
        
        // Confidence check
        if (research.overallConfidence >= 0.5) {
          logSuccess(`Confidence score: ${(research.overallConfidence * 100).toFixed(1)}%`);
        } else {
          logWarning(`Low confidence score: ${(research.overallConfidence * 100).toFixed(1)}%`);
        }
        
        testResults.push({
          name: testCase.name,
          passed: true,
          documents: documentCount,
          executionTime: responseTime,
          confidence: research.overallConfidence
        });
        
        passedTests++;
        logSuccess(`Test passed: ${testCase.name}`);
        
      } else {
        logError(`Test failed: ${testCase.name} - ${result.error || 'Unknown error'}`);
        testResults.push({
          name: testCase.name,
          passed: false,
          error: result.error
        });
      }
      
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logError(`Test failed: ${testCase.name} - ${error.message}`);
      
      if (error.response) {
        logError(`Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`);
      }
      
      testResults.push({
        name: testCase.name,
        passed: false,
        error: error.message,
        executionTime
      });
    }
    
    // Add delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Summary
  logHeader('TEST RESULTS SUMMARY');
  console.log(`\nTotal Tests: ${TEST_CASES.length}`);
  console.log(`Passed: ${passedTests}`.green);
  console.log(`Failed: ${TEST_CASES.length - passedTests}`.red);
  console.log(`Success Rate: ${((passedTests / TEST_CASES.length) * 100).toFixed(1)}%`);
  
  // Detailed results
  console.log('\nDetailed Results:');
  testResults.forEach((result, index) => {
    const status = result.passed ? '✅' : '❌';
    const time = result.executionTime ? formatTime(result.executionTime) : 'N/A';
    const docs = result.documents || 0;
    const conf = result.confidence ? `${(result.confidence * 100).toFixed(1)}%` : 'N/A';
    
    console.log(`${status} ${index + 1}. ${result.name}`);
    if (result.passed) {
      console.log(`    Documents: ${docs}, Time: ${time}, Confidence: ${conf}`);
    } else {
      console.log(`    Error: ${result.error}`.red);
    }
  });
  
  return passedTests === TEST_CASES.length;
}

// Performance testing
async function testPerformance() {
  logHeader('PERFORMANCE TESTING');
  
  const performanceQuery = {
    query: 'contract formation and validity',
    jurisdictions: ['NG', 'ZA', 'KE'],
    legalAreas: ['contract'],
    documentTypes: ['case_law', 'statute'],
    maxResults: 5,
    includeAnalysis: false,
    semanticSearch: true
  };
  
  const iterations = 3;
  const times = [];
  
  for (let i = 0; i < iterations; i++) {
    try {
      logInfo(`Performance test ${i + 1}/${iterations}`);
      const startTime = Date.now();
      
      const response = await axios.post(`${API_BASE_URL}/research`, performanceQuery);
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      times.push(executionTime);
      logInfo(`Execution time: ${formatTime(executionTime)}`);
      
    } catch (error) {
      logError(`Performance test ${i + 1} failed: ${error.message}`);
    }
    
    // Brief delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  if (times.length > 0) {
    const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    
    logInfo(`Performance Summary:`);
    logInfo(`  Average: ${formatTime(avgTime)}`);
    logInfo(`  Fastest: ${formatTime(minTime)}`);
    logInfo(`  Slowest: ${formatTime(maxTime)}`);
    
    if (avgTime < 5000) {
      logSuccess('Performance test passed (average < 5s)');
      return true;
    } else {
      logWarning('Performance test warning (average >= 5s)');
      return false;
    }
  }
  
  return false;
}

// Main test runner
async function runAllTests() {
  console.log('🚀 LEGAL RESEARCH ENGINE - COMPREHENSIVE TEST SUITE'.bold.cyan);
  console.log('Phase 2 Feature 1 - Advanced Semantic Search & Legal Discovery\n');
  
  const testResults = {
    health: false,
    suggestions: false,
    validation: false,
    research: false,
    performance: false
  };
  
  try {
    // Run all test suites
    testResults.health = await testAPIHealth();
    testResults.suggestions = await testResearchSuggestions();
    testResults.validation = await testRequestValidation();
    testResults.research = await testLegalResearch();
    testResults.performance = await testPerformance();
    
    // Final summary
    logHeader('FINAL TEST SUMMARY');
    
    const passedSuites = Object.values(testResults).filter(Boolean).length;
    const totalSuites = Object.keys(testResults).length;
    
    console.log('\nTest Suite Results:');
    Object.entries(testResults).forEach(([suite, passed]) => {
      const status = passed ? '✅' : '❌';
      const suiteName = suite.charAt(0).toUpperCase() + suite.slice(1);
      console.log(`${status} ${suiteName} Tests`);
    });
    
    console.log(`\nOverall Results:`);
    console.log(`Passed Suites: ${passedSuites}/${totalSuites}`);
    console.log(`Overall Success Rate: ${((passedSuites / totalSuites) * 100).toFixed(1)}%`);
    
    if (passedSuites === totalSuites) {
      logSuccess('\n🎉 ALL TESTS PASSED! Legal Research Engine is ready for production!');
    } else {
      logWarning(`\n⚠️  ${totalSuites - passedSuites} test suite(s) failed. Review and fix issues before deployment.`);
    }
    
  } catch (error) {
    logError(`Test suite execution failed: ${error.message}`);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  runAllTests,
  testLegalResearch,
  testAPIHealth,
  testPerformance
};
