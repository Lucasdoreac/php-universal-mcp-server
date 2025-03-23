/**
 * PHP Universal MCP Server
 * Implementação universal do MCP para desenvolvimento PHP em diferentes ambientes de hospedagem
 */

const MCPServer = require('./MCPServer');
const BaseProvider = require('./providers/BaseProvider');
const MockProvider = require('./providers/MockProvider');
const HostingerProvider = require('./providers/HostingerProvider');
const CPanelProvider = require('./providers/CPanelProvider');
const PleskProvider = require('./providers/PleskProvider');
const AWSProvider = require('./providers/AWSProvider');
const AzureProvider = require('./providers/AzureProvider');
const GCPProvider = require('./providers/GCPProvider');

// Exporta todos os componentes
module.exports = {
  MCPServer,
  providers: {
    BaseProvider,
    MockProvider,
    HostingerProvider,
    CPanelProvider,
    PleskProvider,
    AWSProvider,
    AzureProvider,
    GCPProvider
  },
  
  /**
   * Cria uma nova instância do servidor MCP
   * @param {Object} config - Configuração do servidor
   * @returns {MCPServer} Instância do servidor MCP
   */
  createServer: (config = {}) => {
    return new MCPServer(config);
  }
};