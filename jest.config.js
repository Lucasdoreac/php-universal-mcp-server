/**
 * Configuração do Jest para o PHP Universal MCP Server
 */

module.exports = {
  // Diretório raiz para buscar os testes
  roots: ['<rootDir>/tests'],
  
  // Padrão de arquivos de teste
  testMatch: ['**/*.test.js'],
  
  // Ambiente de teste
  testEnvironment: 'node',
  
  // Cobertura de código
  collectCoverage: true,
  collectCoverageFrom: [
    'core/**/*.js',
    'modules/**/*.js',
    'providers/**/*.js',
    'integrations/**/*.js',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/tests/**',
    '!**/vendor/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'clover'],
  
  // Tempo limite por teste
  testTimeout: 10000,
  
  // Configuração para mocks
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1'
  },
  
  // Executa código antes de cada teste
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Verbosidade
  verbose: true,
  
  // Finalizar após a execução dos testes
  forceExit: true,
  
  // Limpar mocks entre testes
  clearMocks: true,
  
  // Configurações específicas para cada módulo
  modulePathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/coverage/',
  ],
};
