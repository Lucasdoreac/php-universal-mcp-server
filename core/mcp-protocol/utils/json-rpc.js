/**
 * @file json-rpc.js
 * @description Utilitários para trabalhar com mensagens JSON-RPC 2.0
 * @module core/mcp-protocol/utils/json-rpc
 */

/**
 * Códigos de erro JSON-RPC 2.0 padrão
 * @enum {number}
 */
const ErrorCode = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
  // Códigos específicos da aplicação (de -32000 a -32099)
  AUTHENTICATION_ERROR: -32000,
  AUTHORIZATION_ERROR: -32001,
  RATE_LIMIT_EXCEEDED: -32002,
  PROVIDER_ERROR: -32003,
  ASYNC_OPERATION_ERROR: -32004,
  VALIDATION_ERROR: -32005,
};

/**
 * Cria uma mensagem de resposta JSON-RPC 2.0
 * @param {string|number} id - ID da requisição
 * @param {*} result - Resultado da operação
 * @returns {Object} Objeto de resposta JSON-RPC 2.0
 */
function createJsonRpcResponse(id, result) {
  return {
    jsonrpc: '2.0',
    id: id,
    result: result
  };
}

/**
 * Cria uma mensagem de erro JSON-RPC 2.0
 * @param {string|number} id - ID da requisição
 * @param {number} code - Código de erro
 * @param {string} message - Mensagem de erro
 * @param {*} [data] - Dados adicionais do erro
 * @returns {Object} Objeto de erro JSON-RPC 2.0
 */
function createJsonRpcError(id, code, message, data) {
  return {
    jsonrpc: '2.0',
    id: id,
    error: {
      code: code,
      message: message,
      ...(data !== undefined && { data })
    }
  };
}

/**
 * Cria uma mensagem de notificação JSON-RPC 2.0 (sem ID)
 * @param {string} method - Nome do método
 * @param {*} params - Parâmetros do método
 * @returns {Object} Objeto de notificação JSON-RPC 2.0
 */
function createJsonRpcNotification(method, params) {
  return {
    jsonrpc: '2.0',
    method: method,
    params: params
  };
}

/**
 * Valida se um objeto é uma requisição JSON-RPC 2.0 válida
 * @param {Object} obj - Objeto a ser validado
 * @returns {boolean} true se for válido, false caso contrário
 */
function isValidJsonRpcRequest(obj) {
  return (
    obj &&
    obj.jsonrpc === '2.0' &&
    typeof obj.method === 'string' &&
    (obj.id === undefined || typeof obj.id === 'string' || typeof obj.id === 'number') &&
    (obj.params === undefined || typeof obj.params === 'object')
  );
}

/**
 * Converte uma mensagem JSON-RPC 2.0 para string
 * @param {Object} jsonRpcObj - Objeto JSON-RPC 2.0
 * @returns {string} Mensagem JSON-RPC 2.0 como string
 */
function stringifyJsonRpc(jsonRpcObj) {
  return JSON.stringify(jsonRpcObj) + '\n';
}

/**
 * Analisa uma string para extrair objetos JSON-RPC 2.0
 * @param {string} str - String contendo mensagens JSON-RPC 2.0
 * @returns {Array<{message: Object, remainingBuffer: string}>} Array com mensagens parseadas e buffer restante
 */
function parseJsonRpcMessages(str) {
  const messages = [];
  let buffer = str;
  
  while (buffer.includes('\n')) {
    const endOfMessage = buffer.indexOf('\n');
    const messageStr = buffer.substring(0, endOfMessage);
    
    try {
      if (messageStr.trim()) {
        const message = JSON.parse(messageStr);
        messages.push(message);
      }
    } catch (err) {
      // Ignorar mensagens inválidas
    }
    
    buffer = buffer.substring(endOfMessage + 1);
  }
  
  return { messages, remainingBuffer: buffer };
}

module.exports = {
  ErrorCode,
  createJsonRpcResponse,
  createJsonRpcError,
  createJsonRpcNotification,
  isValidJsonRpcRequest,
  stringifyJsonRpc,
  parseJsonRpcMessages
};
