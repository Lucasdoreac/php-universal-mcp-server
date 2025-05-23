// Jest Configuration for Integration Tests
// PHP Universal MCP Server v1.12.0-dev

module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Test files pattern - focusing on integration tests
  testMatch: [
    '**/tests/**/*.integration.test.js',
    '**/tests/integration/**/*.test.js',
    '**/tests/integration/**/*.spec.js'
  ],
  
  // Ignore unit tests when running integration tests
  testPathIgnorePatterns: [
    '/node_modules/',
    '/tests/unit/',
    '/modules/*/tests/', // Skip unit tests from modules
    '.unit.test.js$',
    '.unit.spec.js$'
  ],
  
  // Setup files - run before tests
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup/integration-setup.js'
  ],
  
  // Coverage settings for integration tests
  collectCoverage: false, // Integration tests focus on functionality, not coverage
  
  // Test timeout (longer for integration tests)
  testTimeout: 30000, // 30 seconds for integration tests
  
  // Module name mapping
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@core/(.*)$': '<rootDir>/core/$1',
    '^@modules/(.*)$': '<rootDir>/modules/$1',
    '^@providers/(.*)$': '<rootDir>/providers/$1'
  },
  
  // Global variables available in tests
  globals: {
    'TEST_ENV': 'integration',
    'MCP_SERVER_PORT': 7655, // Different port for testing
    'DEBUG_MODE': false
  },
  
  // Reporter configuration
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: './tests/reports/',
      outputName: 'integration-test-results.xml'
    }]
  ],
  
  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,
  
  // Verbose output for integration tests
  verbose: true,
  
  // Transform configuration
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  
  // Module directories
  moduleDirectories: [
    'node_modules',
    '<rootDir>'
  ]
};
