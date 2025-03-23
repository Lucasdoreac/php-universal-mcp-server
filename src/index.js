/**
 * PHP Universal MCP Server
 * Implementação universal do MCP para desenvolvimento PHP em diferentes ambientes de hospedagem
 */

const MCPServer = require('./MCPServer');
const BaseProvider = require('./providers/BaseProvider');
const MockProvider = require('./providers/MockProvider');
const PHPProvider = require('./php-provider');
const MCPAdapter = require('./sdk-mcp');
const PHPExecutor = require('./php-executor');
const { startServer } = require('./server');

// Importação condicional de outros provedores
let HostingerProvider, CPanelProvider, PleskProvider, AWSProvider, AzureProvider, GCPProvider;

try {
  HostingerProvider = require('./providers/HostingerProvider');
} catch (error) {
  HostingerProvider = BaseProvider;
}

try {
  CPanelProvider = require('./providers/CPanelProvider');
} catch (error) {
  CPanelProvider = BaseProvider;
}

try {
  PleskProvider = require('./providers/PleskProvider');
} catch (error) {
  PleskProvider = BaseProvider;
}

try {
  AWSProvider = require('./providers/AWSProvider');
} catch (error) {
  AWSProvider = BaseProvider;
}

try {
  AzureProvider = require('./providers/AzureProvider');
} catch (error) {
  AzureProvider = BaseProvider;
}

try {
  GCPProvider = require('./providers/GCPProvider');
} catch (error) {
  GCPProvider = BaseProvider;
}

// Exporta todos os componentes
module.exports = {
  MCPServer,
  providers: {
    BaseProvider,
    MockProvider,
    PHPProvider,
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
  },
  
  /**
   * Inicia o servidor HTTP para MCP
   * @param {Object} options - Opções do servidor
   */
  startServer,
  
  // Utilitários
  MCPAdapter,
  PHPExecutor
};