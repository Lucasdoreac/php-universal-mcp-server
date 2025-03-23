/**
 * @file handler.js
 * @description Classe base para handlers de métodos MCP
 * @module core/mcp-protocol/handlers/handler
 */

const { validateMethodParams } = require('../utils/validator');
const { ErrorCode, createJsonRpcError } = require('../utils/json-rpc');

/**
 * Classe base abstrata para handlers de métodos MCP
 * @class MCPHandler
 */
class MCPHandler {
  /**
   * @constructor
   * @param {Object} options - Opções para o handler
   * @param {Object} options.logger - Logger para registrar operações
   * @param {Object} [options.paramSchema] - Schema para validação de parâmetros
   */
  constructor(options = {}) {
    this.logger = options.logger;
    this.paramSchema = options.paramSchema || null;
    
    // Assegurar que o método handle seja implementado nas subclasses
    if (this.constructor === MCPHandler) {
      throw new Error('MCPHandler é uma classe abstrata e não pode ser instanciada diretamente');
    }
    
    if (typeof this.handle !== 'function') {
      throw new Error('Classes que estendem MCPHandler devem implementar o método handle');
    }
  }
  
  /**
   * Executa o handler com validação de parâmetros
   * @param {Object} request - Requisição JSON-RPC completa
   * @param {Object} context - Contexto da requisição
   * @returns {Promise<Object>} Resposta JSON-RPC
   */
  async execute(request, context) {
    try {
      // Validar parâmetros se houver schema
      if (this.paramSchema) {
        const validation = validateMethodParams(request.method, request.params, this.paramSchema);
        if (!validation.isValid) {
          this.logger.warn(`Validation failed for method ${request.method}`, validation.error);
          return createJsonRpcError(request.id, validation.error.code, validation.error.message, validation.error.data);
        }
      }
      
      // Executar handler
      const result = await this.handle(request.params, context, request);
      return result;
    } catch (error) {
      this.logger.error(`Error executing handler for method ${request.method}:`, error);
      
      // Determinar código de erro apropriado
      let code = ErrorCode.INTERNAL_ERROR;
      let message = 'Internal server error';
      let data = { errorType: error.name };
      
      if (error.code) {
        code = error.code;
        message = error.message || message;
        data = { ...data, ...error.data };
      }
      
      return createJsonRpcError(request.id, code, message, data);
    }
  }
  
  /**
   * Método abstrato que deve ser implementado pelas subclasses
   * @abstract
   * @param {Object} params - Parâmetros da requisição
   * @param {Object} context - Contexto da requisição
   * @param {Object} request - Requisição JSON-RPC completa
   * @returns {Promise<Object>} Resultado da operação
   */
  async handle(params, context, request) {
    throw new Error('O método handle deve ser implementado pelas subclasses');
  }
  
  /**
   * Cria um erro específico para o handler
   * @param {number} code - Código de erro
   * @param {string} message - Mensagem de erro
   * @param {Object} [data] - Dados adicionais do erro
   * @returns {Error} Erro com propriedades adicionais
   */
  createError(code, message, data) {
    const error = new Error(message);
    error.code = code;
    error.data = data;
    return error;
  }
}

module.exports = {
  MCPHandler
};
