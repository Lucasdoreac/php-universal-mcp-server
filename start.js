#!/usr/bin/env node

/**
 * PHP Universal MCP Server
 * Script de inicialização
 * Versão 1.12.0-dev
 */

// Importar a instância do servidor já configurada com todos os provedores
const server = require('./server-part2');
const ClaudePluginCreator = require('./integrations/claude/plugin-creator');

// Inicializar integrações Claude na instância já configurada
const claudePluginCreator = new ClaudePluginCreator(server);
claudePluginCreator.registerMethods();

console.log('🚀 PHP Universal MCP Server v1.12.0-dev');
console.log('✅ Servidor iniciado com todos os provedores e integrações');
console.log('📡 Hostinger, Shopify, WooCommerce, AWS, GCP carregados');
console.log('🤖 Integração Claude ativa');
console.log(`🔗 Escutando na porta ${process.env.MCP_PORT || 7654}`);

// Gerenciar desligamento
process.on('SIGINT', () => {
  console.log('\n🛑 Desligando o servidor...');
  if (server && typeof server.stop === 'function') {
    server.stop();
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Recebido sinal de término. Desligando...');
  if (server && typeof server.stop === 'function') {
    server.stop();
  }
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Erro não tratado:', error);
  if (server && typeof server.stop === 'function') {
    server.stop();
  }
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ Promessa rejeitada não tratada:', reason);
  // Não finaliza o processo, apenas registra o erro
});

module.exports = { server };
