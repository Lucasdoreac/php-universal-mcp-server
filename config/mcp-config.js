/**
 * @file mcp-config.js
 * @description Configurações para o servidor MCP (Model Context Protocol)
 * @module config/mcp-config
 */

module.exports = {
  // Configurações do servidor
  server: {
    port: process.env.MCP_PORT || 7654,
    host: process.env.MCP_HOST || '127.0.0.1',
    maxConnections: process.env.MCP_MAX_CONNECTIONS || 10,
  },
  
  // Configurações de logging
  logging: {
    level: process.env.MCP_LOG_LEVEL || 'info',
    file: process.env.MCP_LOG_FILE || 'mcp-server.log',
    maxSize: process.env.MCP_LOG_MAX_SIZE || '10m',
    maxFiles: process.env.MCP_LOG_MAX_FILES || 5,
  },
  
  // Limites e timeouts
  limits: {
    maxMessageSize: process.env.MCP_MAX_MESSAGE_SIZE || 1024 * 1024, // 1MB por padrão
    requestTimeout: process.env.MCP_REQUEST_TIMEOUT || 30000, // 30 segundos por padrão
    asyncOperationTimeout: process.env.MCP_ASYNC_TIMEOUT || 5 * 60 * 1000, // 5 minutos por padrão
  },
  
  // Configurações de segurança
  security: {
    validateInput: process.env.MCP_VALIDATE_INPUT !== 'false', // true por padrão
    maxRequestsPerMinute: process.env.MCP_MAX_REQUESTS_PER_MINUTE || 100,
  },
};
