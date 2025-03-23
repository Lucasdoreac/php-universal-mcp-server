/**
 * PHP Universal MCP Server - Inicialização
 * 
 * Este arquivo cria e inicia o servidor MCP
 */

const { MCPServer } = require('./server-part1');

// Criar e iniciar o servidor
const server = new MCPServer();
const DEFAULT_PORT = process.env.MCP_PORT || 7654;
server.startServer(DEFAULT_PORT);

// Tratamento de sinais
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  server.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Shutting down server...');
  server.stop();
  process.exit(0);
});

module.exports = server;