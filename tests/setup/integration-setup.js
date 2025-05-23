/**
 * Integration Test Setup
 * PHP Universal MCP Server v1.12.0-dev
 * 
 * This file sets up the testing environment for integration tests
 */

const path = require('path');
const { MCPServer } = require('../../server-part1');

// Global test configuration
global.TEST_CONFIG = {
  server: {
    port: process.env.MCP_SERVER_PORT || 7655,
    host: '127.0.0.1',
    timeout: 30000
  },
  providers: {
    mock: true, // Use mock providers for testing
    hostinger: {
      enabled: false,
      apiKey: 'test-key'
    },
    shopify: {
      enabled: false,
      apiKey: 'test-key',
      apiSecret: 'test-secret'
    },
    woocommerce: {
      enabled: false,
      consumerKey: 'test-key',
      consumerSecret: 'test-secret'
    }
  }
};

// Global test utilities
global.testUtils = {
  /**
   * Wait for a specified amount of time
   * @param {number} ms - Milliseconds to wait
   */
  delay: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  /**
   * Create a test MCP server instance
   * @param {Object} options - Server options
   * @returns {MCPServer} Server instance
   */
  createTestServer: (options = {}) => {
    return new MCPServer({
      ...global.TEST_CONFIG.server,
      ...options,
      logger: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn()
      }
    });
  },
  
  /**
   * Generate a random test ID
   * @param {string} prefix - Prefix for the ID
   * @returns {string} Random test ID
   */
  generateTestId: (prefix = 'test') => {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },
  
  /**
   * Clean up test data and resources
   * @param {Array} resources - Array of resources to clean up
   */
  cleanup: async (resources = []) => {
    for (const resource of resources) {
      try {
        if (typeof resource.cleanup === 'function') {
          await resource.cleanup();
        } else if (typeof resource.stop === 'function') {
          await resource.stop();
        } else if (typeof resource.close === 'function') {
          await resource.close();
        }
      } catch (error) {
        console.warn('Cleanup warning:', error.message);
      }
    }
  }
};

// Global variables for test state
global.testServers = new Set();
global.testResources = new Set();

// Setup before all tests
beforeAll(async () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.MCP_LOG_LEVEL = 'error'; // Reduce log noise during tests
  
  console.log('🧪 Integration test environment initialized');
  console.log(`📡 Test server will use port: ${global.TEST_CONFIG.server.port}`);
});

// Cleanup after all tests
afterAll(async () => {
  // Cleanup all test servers
  for (const server of global.testServers) {
    try {
      if (server && typeof server.stop === 'function') {
        await server.stop();
      }
    } catch (error) {
      console.warn('Server cleanup warning:', error.message);
    }
  }
  
  // Cleanup all test resources
  await global.testUtils.cleanup([...global.testResources]);
  
  // Clear collections
  global.testServers.clear();
  global.testResources.clear();
  
  console.log('🧹 Integration test cleanup completed');
});

// Setup before each test
beforeEach(() => {
  // Reset mock calls if any
  jest.clearAllMocks();
});

// Cleanup after each test
afterEach(() => {
  // Additional per-test cleanup if needed
});

// Error handling for unhandled promises
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process during tests
});

console.log('✅ Integration test setup completed');
