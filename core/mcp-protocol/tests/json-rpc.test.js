/**
 * @file json-rpc.test.js
 * @description Testes para os utilitários JSON-RPC
 */

const { 
  ErrorCode,
  createJsonRpcResponse,
  createJsonRpcError, 
  createJsonRpcNotification,
  isValidJsonRpcRequest,
  stringifyJsonRpc,
  parseJsonRpcMessages
} = require('../utils/json-rpc');

describe('JSON-RPC Utilities', () => {
  describe('createJsonRpcResponse', () => {
    test('should create a valid JSON-RPC response', () => {
      const response = createJsonRpcResponse('test-id', { success: true });
      
      expect(response).toEqual({
        jsonrpc: '2.0',
        id: 'test-id',
        result: { success: true }
      });
    });
    
    test('should accept numeric IDs', () => {
      const response = createJsonRpcResponse(123, { success: true });
      
      expect(response).toEqual({
        jsonrpc: '2.0',
        id: 123,
        result: { success: true }
      });
    });
  });
  
  describe('createJsonRpcError', () => {
    test('should create a valid JSON-RPC error response', () => {
      const error = createJsonRpcError('test-id', ErrorCode.INVALID_REQUEST, 'Invalid request');
      
      expect(error).toEqual({
        jsonrpc: '2.0',
        id: 'test-id',
        error: {
          code: ErrorCode.INVALID_REQUEST,
          message: 'Invalid request'
        }
      });
    });
    
    test('should include error data if provided', () => {
      const errorData = { field: 'method', reason: 'not found' };
      const error = createJsonRpcError('test-id', ErrorCode.METHOD_NOT_FOUND, 'Method not found', errorData);
      
      expect(error).toEqual({
        jsonrpc: '2.0',
        id: 'test-id',
        error: {
          code: ErrorCode.METHOD_NOT_FOUND,
          message: 'Method not found',
          data: errorData
        }
      });
    });
  });
  
  describe('createJsonRpcNotification', () => {
    test('should create a valid JSON-RPC notification', () => {
      const notification = createJsonRpcNotification('update', { status: 'processing' });
      
      expect(notification).toEqual({
        jsonrpc: '2.0',
        method: 'update',
        params: { status: 'processing' }
      });
    });
  });
  
  describe('isValidJsonRpcRequest', () => {
    test('should validate a correct JSON-RPC request', () => {
      const request = {
        jsonrpc: '2.0',
        method: 'test',
        id: 'test-id',
        params: { test: true }
      };
      
      expect(isValidJsonRpcRequest(request)).toBe(true);
    });
    
    test('should validate a JSON-RPC notification (without id)', () => {
      const notification = {
        jsonrpc: '2.0',
        method: 'test',
        params: { test: true }
      };
      
      expect(isValidJsonRpcRequest(notification)).toBe(true);
    });
    
    test('should reject a request with wrong jsonrpc version', () => {
      const request = {
        jsonrpc: '1.0',
        method: 'test',
        id: 'test-id'
      };
      
      expect(isValidJsonRpcRequest(request)).toBe(false);
    });
    
    test('should reject a request without method', () => {
      const request = {
        jsonrpc: '2.0',
        id: 'test-id'
      };
      
      expect(isValidJsonRpcRequest(request)).toBe(false);
    });
  });
  
  describe('stringifyJsonRpc', () => {
    test('should stringify a JSON-RPC object with newline', () => {
      const request = {
        jsonrpc: '2.0',
        method: 'test',
        id: 'test-id'
      };
      
      const result = stringifyJsonRpc(request);
      
      expect(result).toEqual(JSON.stringify(request) + '\n');
    });
  });
  
  describe('parseJsonRpcMessages', () => {
    test('should parse a single JSON-RPC message', () => {
      const message = {
        jsonrpc: '2.0',
        method: 'test',
        id: 'test-id'
      };
      
      const buffer = JSON.stringify(message) + '\n';
      const result = parseJsonRpcMessages(buffer);
      
      expect(result.messages).toHaveLength(1);
      expect(result.messages[0]).toEqual(message);
      expect(result.remainingBuffer).toEqual('');
    });
    
    test('should parse multiple JSON-RPC messages', () => {
      const message1 = {
        jsonrpc: '2.0',
        method: 'test1',
        id: 'id1'
      };
      
      const message2 = {
        jsonrpc: '2.0',
        method: 'test2',
        id: 'id2'
      };
      
      const buffer = JSON.stringify(message1) + '\n' + JSON.stringify(message2) + '\n';
      const result = parseJsonRpcMessages(buffer);
      
      expect(result.messages).toHaveLength(2);
      expect(result.messages[0]).toEqual(message1);
      expect(result.messages[1]).toEqual(message2);
      expect(result.remainingBuffer).toEqual('');
    });
    
    test('should handle incomplete messages', () => {
      const message = {
        jsonrpc: '2.0',
        method: 'test',
        id: 'test-id'
      };
      
      const incompleteMessage = '{"jsonrpc":"2.0","method":"incomplete"';
      
      const buffer = JSON.stringify(message) + '\n' + incompleteMessage;
      const result = parseJsonRpcMessages(buffer);
      
      expect(result.messages).toHaveLength(1);
      expect(result.messages[0]).toEqual(message);
      expect(result.remainingBuffer).toEqual(incompleteMessage);
    });
  });
});
