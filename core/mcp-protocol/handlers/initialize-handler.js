/**
 * @file initialize-handler.js
 * @description Handler para o método de inicialização do MCP
 * @module core/mcp-protocol/handlers/initialize-handler
 */

const { MCPHandler } = require('./handler');
const { createJsonRpcResponse } = require('../utils/json-rpc');
const pkg = require('../../../package.json');

// Schema para validação de parâmetros do método initialize
const initializeParamSchema = {
  type: 'object',
  properties: {
    clientCapabilities: {
      type: 'object'
    },
    clientName: {
      type: 'string'
    },
    clientVersion: {
      type: 'string'
    }
  },
  required: ['clientCapabilities']
};

/**
 * Handler para o método initialize
 * @class InitializeHandler
 * @extends MCPHandler
 */
class InitializeHandler extends MCPHandler {
  /**
   * @constructor
   * @param {Object} options - Opções para o handler
   * @param {Object} options.logger - Logger para registrar operações
   * @param {Object} [options.serverCapabilities] - Capacidades adicionais do servidor
   */
  constructor(options = {}) {
    super({
      ...options,
      paramSchema: initializeParamSchema
    });
    
    this.serverCapabilities = options.serverCapabilities || {};
  }
  
  /**
   * Processa o método initialize
   * @param {Object} params - Parâmetros da requisição
   * @param {Object} context - Contexto da requisição
   * @param {Object} request - Requisição JSON-RPC completa
   * @returns {Promise<Object>} Resposta JSON-RPC com capacidades do servidor
   */
  async handle(params, context, request) {
    this.logger.info('Initializing connection', {
      clientName: params.clientName,
      clientVersion: params.clientVersion
    });
    
    // Registrar capacidades do cliente
    context.clientCapabilities = params.clientCapabilities;
    context.clientName = params.clientName || 'unknown';
    context.clientVersion = params.clientVersion || 'unknown';
    
    // Preparar capacidades básicas do servidor
    const serverCapabilities = {
      serverName: 'PHP Universal MCP Server',
      serverVersion: pkg.version || '1.0.0',
      supportedProviders: ['hostinger', 'woocommerce', 'shopify'],
      supportedFeatures: {
        siteManagement: true,
        ecommerce: true,
        hosting: true,
        design: true,
        asyncOperations: true
      },
      ...this.serverCapabilities
    };
    
    // Guardar estado de inicialização no contexto
    context.initialized = true;
    context.initTime = new Date().toISOString();
    
    return createJsonRpcResponse(request.id, {
      capabilities: serverCapabilities
    });
  }
}

module.exports = {
  InitializeHandler
};
