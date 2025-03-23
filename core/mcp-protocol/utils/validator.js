/**
 * @file validator.js
 * @description Utilitários para validação de mensagens e parâmetros no protocolo MCP
 * @module core/mcp-protocol/utils/validator
 */

const { ErrorCode } = require('./json-rpc');

/**
 * Valida uma mensagem JSON-RPC 2.0
 * @param {Object} message - Mensagem JSON-RPC a ser validada
 * @returns {{isValid: boolean, error: Object|null}} Resultado da validação
 */
function validateJsonRpc(message) {
  // Verificar se é um objeto
  if (!message || typeof message !== 'object' || Array.isArray(message)) {
    return {
      isValid: false,
      error: {
        code: ErrorCode.INVALID_REQUEST,
        message: 'Invalid JSON-RPC 2.0 request: not an object'
      }
    };
  }

  // Verificar versão do protocolo
  if (message.jsonrpc !== '2.0') {
    return {
      isValid: false,
      error: {
        code: ErrorCode.INVALID_REQUEST,
        message: 'Invalid JSON-RPC version, must be exactly "2.0"'
      }
    };
  }

  // Verificar método
  if (typeof message.method !== 'string' || message.method.trim() === '') {
    return {
      isValid: false,
      error: {
        code: ErrorCode.INVALID_REQUEST,
        message: 'Method must be a non-empty string'
      }
    };
  }

  // Verificar ID (pode ser omitido em notificações)
  if ('id' in message) {
    const idType = typeof message.id;
    if (!(idType === 'string' || idType === 'number' || message.id === null)) {
      return {
        isValid: false,
        error: {
          code: ErrorCode.INVALID_REQUEST,
          message: 'ID must be string, number, or null'
        }
      };
    }
  }

  // Verificar parâmetros (podem ser omitidos)
  if ('params' in message) {
    const paramsType = typeof message.params;
    if (!(paramsType === 'object')) {
      return {
        isValid: false,
        error: {
          code: ErrorCode.INVALID_REQUEST,
          message: 'Params must be an object or array'
        }
      };
    }
  }

  return { isValid: true, error: null };
}

/**
 * Valida os parâmetros de uma requisição específica
 * @param {string} method - Nome do método
 * @param {Object} params - Parâmetros a serem validados
 * @param {Object} schema - Schema de validação
 * @returns {{isValid: boolean, error: Object|null}} Resultado da validação
 */
function validateMethodParams(method, params, schema) {
  if (!schema || typeof schema !== 'object') {
    return { isValid: true, error: null };
  }

  // Verificar parâmetros obrigatórios
  if (schema.required && Array.isArray(schema.required)) {
    for (const requiredParam of schema.required) {
      if (!(requiredParam in params)) {
        return {
          isValid: false,
          error: {
            code: ErrorCode.INVALID_PARAMS,
            message: `Missing required parameter: ${requiredParam}`,
            data: { method, parameter: requiredParam }
          }
        };
      }
    }
  }

  // Verificar tipos de parâmetros
  if (schema.properties && typeof schema.properties === 'object') {
    for (const [paramName, paramSchema] of Object.entries(schema.properties)) {
      if (paramName in params) {
        const value = params[paramName];
        
        // Verificar tipo
        if (paramSchema.type && !checkType(value, paramSchema.type)) {
          return {
            isValid: false,
            error: {
              code: ErrorCode.INVALID_PARAMS,
              message: `Invalid type for parameter: ${paramName}. Expected ${paramSchema.type}`,
              data: { method, parameter: paramName, expectedType: paramSchema.type }
            }
          };
        }
        
        // Verificar valores enum
        if (paramSchema.enum && Array.isArray(paramSchema.enum) && !paramSchema.enum.includes(value)) {
          return {
            isValid: false,
            error: {
              code: ErrorCode.INVALID_PARAMS,
              message: `Invalid value for parameter: ${paramName}. Must be one of: ${paramSchema.enum.join(', ')}`,
              data: { method, parameter: paramName, allowedValues: paramSchema.enum }
            }
          };
        }
      }
    }
  }

  return { isValid: true, error: null };
}

/**
 * Verifica se um valor corresponde ao tipo especificado
 * @param {*} value - Valor a ser verificado
 * @param {string} type - Tipo esperado
 * @returns {boolean} true se o valor corresponder ao tipo, false caso contrário
 */
function checkType(value, type) {
  switch (type) {
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number';
    case 'boolean':
      return typeof value === 'boolean';
    case 'object':
      return typeof value === 'object' && value !== null && !Array.isArray(value);
    case 'array':
      return Array.isArray(value);
    case 'null':
      return value === null;
    case 'integer':
      return typeof value === 'number' && Number.isInteger(value);
    default:
      return true; // Tipo desconhecido, aceitar qualquer valor
  }
}

/**
 * Sanitiza uma string para evitar injeção
 * @param {string} input - String a ser sanitizada
 * @returns {string} String sanitizada
 */
function sanitizeString(input) {
  if (typeof input !== 'string') {
    return '';
  }
  
  // Remover caracteres potencialmente perigosos
  return input
    .replace(/[<>]/g, '') // Remove tags HTML
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .trim();
}

/**
 * Sanitiza um objeto recursivamente
 * @param {Object} obj - Objeto a ser sanitizado
 * @returns {Object} Objeto sanitizado
 */
function sanitizeObject(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

module.exports = {
  validateJsonRpc,
  validateMethodParams,
  sanitizeString,
  sanitizeObject
};
