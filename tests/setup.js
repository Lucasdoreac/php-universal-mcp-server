/**
 * Configuração global para os testes do PHP Universal MCP Server
 */

// Aumentar o timeout para testes de integração
jest.setTimeout(30000);

// Suprimir logs durante os testes, a menos que a variável de ambiente DEBUG esteja definida
if (!process.env.DEBUG) {
  global.console = {
    ...console,
    log: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn()
  };
}

// Mock para setTimeout/setInterval
jest.useFakeTimers();

// Limpar todos os mocks após cada teste
afterEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
});

// Configuração global para operações assíncronas
global.waitFor = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helpers para testes
global.testUtils = {
  // Gera uma string aleatória para uso em testes
  randomString: (length = 8) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  // Cria um mock do logger para uso em testes
  createMockLogger: () => ({
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn()
  }),

  // Gera dados fictícios básicos para testes
  generateTestData: (type) => {
    switch (type) {
      case 'plugin':
        return {
          id: `plugin-${global.testUtils.randomString()}`,
          name: 'Test Plugin',
          version: '1.0.0',
          description: 'Plugin for testing',
          author: 'Test Author',
          category: 'utility',
          tags: ['test', 'utility'],
          isPaid: false,
          rating: 4.5,
          downloads: 100,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      case 'storage':
        return {
          bucketName: `test-bucket-${global.testUtils.randomString().toLowerCase()}`,
          fileName: `test-file-${global.testUtils.randomString().toLowerCase()}.txt`,
          fileContent: 'This is test content for the file'
        };
      case 'appEngine':
        return {
          serviceId: 'default',
          versionId: `v-${Date.now()}`,
          runtime: 'php81'
        };
      default:
        return {};
    }
  }
};
