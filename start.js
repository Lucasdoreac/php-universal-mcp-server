#!/usr/bin/env node

/**
 * PHP Universal MCP Server
 * Script de inicialização
 * Versão 1.8.0
 */

// Importar Módulos
const { MCPServer } = require('./server-part1');
const ClaudePluginCreator = require('./integrations/claude/plugin-creator');

// Criar instância do servidor
const server = new MCPServer();

// Inicializar integrações
const claudePluginCreator = new ClaudePluginCreator(server);
claudePluginCreator.registerMethods();

// Iniciar servidor
server.start().then(success => {
  if (!success) {
    console.error('Falha ao iniciar o servidor');
    process.exit(1);
  }
});

// Gerenciar desligamento
process.on('SIGINT', () => {
  console.log('\nDesligando o servidor...');
  server.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nRecebido sinal de término. Desligando...');
  server.stop();
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  console.error('Erro não tratado:', error);
  server.stop();
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Promessa rejeitada não tratada:', reason);
  // Não finaliza o processo, apenas registra o erro
});

module.exports = { server };
