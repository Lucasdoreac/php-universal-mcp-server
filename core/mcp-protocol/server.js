/**
 * @file server.js
 * @description Servidor MCP (Model Context Protocol) principal que implementa o protocolo MCP sobre JSON-RPC 2.0
 * @module core/mcp-protocol/server
 */

const net = require('net');
const crypto = require('crypto');
const winston = require('winston');
const EventEmitter = require('events');
const { InitializeHandler } = require('./handlers/initialize-handler');
const { validateJsonRpc } = require('./utils/validator');
const { 
  createJsonRpcResponse, 
  createJsonRpcError,
  createJsonRpcNotification,
  parseJsonRpcMessages,
  stringifyJsonRpc,
  ErrorCode
} = require('./utils/json-rpc');

const config = require('../../config/mcp-config');

/**
 * @class MCPServer
 * @description Implementação do servidor MCP que gerencia comunicação bidirecional entre Claude e os servidores
 * @extends EventEmitter
 */
class MCPServer extends EventEmitter {
  /**
   * @constructor
   * @param {Object} options - Opções de configuração para o servidor MCP
   * @param {number} [options.port] - Porta em que o servidor escutará (padrão: do config ou 7654)
   * @param {string} [options.host] - Host para o servidor (padrão: do config ou 127.0.0.1)
   * @param {Object} [options.logger] - Logger personalizado (se não for fornecido, será criado)
   */
  constructor(options = {}) {
    super();
    
    // Configurações do servidor
    this.port = options.port || config.server.port || 7654;
    this.host = options.host || config.server.host || '127.0.0.1';
    this.maxConnections = options.maxConnections || config.server.maxConnections || 10;
    
    // Limites e timeouts
    this.maxMessageSize = options.maxMessageSize || config.limits.maxMessageSize || 1024 * 1024;
    this.requestTimeout = options.requestTimeout || config.limits.requestTimeout || 30000;
    this.asyncOperationTimeout = options.asyncOperationTimeout || config.limits.asyncOperationTimeout || 5 * 60 * 1000;
    
    // Estado interno
    this.server = null;
    this.clients = new Map(); // clientId -> { socket, context, buffer }
    this.handlers = new Map(); // method -> handler
    this.asyncOperations = new Map(); // operationId -> { clientId, method, startTime, status, ... }
    
    // Configurar logger
    this.logger = options.logger || this._createDefaultLogger();
    
    // Registrar handlers padrão
    this.registerHandler('initialize', new InitializeHandler({ 
      logger: this.logger,
      serverCapabilities: options.serverCapabilities
    }));
    
    this.logger.info('MCP Server initialized with configuration', {
      port: this.port,
      host: this.host,
      maxConnections: this.maxConnections
    });
  }
  
  /**
   * Cria um logger padrão
   * @private
   * @returns {Object} Logger configurado
   */
  _createDefaultLogger() {
    const logLevel = config.logging.level || 'info';
    const logFormat = winston.format.combine(
      winston.format.timestamp(),
      winston.format.printf(({ level, message, timestamp, ...rest }) => {
        const meta = Object.keys(rest).length ? JSON.stringify(rest) : '';
        return `${timestamp} [MCP] ${level.toUpperCase()}: ${message} ${meta}`;
      })
    );
    
    return winston.createLogger({
      level: logLevel,
      format: logFormat,
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ 
          filename: config.logging.file || 'mcp-server.log',
          maxsize: config.logging.maxSize || 10 * 1024 * 1024, // 10MB
          maxFiles: config.logging.maxFiles || 5
        })
      ]
    });
  }
  
  /**
   * Registra um handler para um método específico
   * @param {string} method - Nome do método JSON-RPC
   * @param {Object} handler - Instância do handler para processar o método
   */
  registerHandler(method, handler) {
    if (!handler || typeof handler.execute !== 'function') {
      throw new Error(`Handler for method ${method} must have an execute method`);
    }
    
    this.handlers.set(method, handler);
    this.logger.debug(`Registered handler for method: ${method}`);
  }
  
  /**
   * Inicia o servidor MCP na porta configurada
   * @returns {Promise<void>} Promise que resolve quando o servidor estiver escutando
   */
  start() {
    return new Promise((resolve, reject) => {
      try {
        this.server = net.createServer();
        this.server.maxConnections = this.maxConnections;
        
        // Configurar eventos do servidor
        this.server.on('connection', this._handleConnection.bind(this));
        
        this.server.on('error', (err) => {
          this.logger.error('Server error:', err);
          this.emit('error', err);
          reject(err);
        });
        
        this.server.on('close', () => {
          this.logger.info('Server closed');
          this.emit('close');
        });
        
        // Iniciar escuta
        this.server.listen(this.port, this.host, () => {
          this.logger.info(`MCP Server listening on ${this.host}:${this.port}`);
          this.emit('started', { port: this.port, host: this.host });
          resolve();
        });
      } catch (err) {
        this.logger.error('Failed to start server:', err);
        reject(err);
      }
    });
  }
  
  /**
   * Para o servidor MCP
   * @returns {Promise<void>} Promise que resolve quando o servidor for parado
   */
  stop() {
    return new Promise((resolve, reject) => {
      if (!this.server) {
        this.logger.warn('Server is not running');
        resolve();
        return;
      }
      
      // Encerrar todas as conexões ativas
      for (const [clientId, client] of this.clients.entries()) {
        this._disconnectClient(clientId);
      }
      
      // Fechar servidor
      this.server.close((err) => {
        if (err) {
          this.logger.error('Error stopping server:', err);
          reject(err);
          return;
        }
        
        this.server = null;
        this.logger.info('Server stopped');
        resolve();
      });
    });
  }
  
  /**
   * Gerencia uma nova conexão com o cliente
   * @private
   * @param {net.Socket} socket - Socket de conexão com o cliente
   */
  _handleConnection(socket) {
    const clientId = `client_${crypto.randomBytes(8).toString('hex')}`;
    
    // Configurar o socket
    socket.setEncoding('utf8');
    
    // Criar contexto do cliente
    const client = {
      socket,
      buffer: '',
      context: {
        clientId,
        connectedAt: new Date().toISOString(),
        initialized: false,
        clientCapabilities: {},
        requestCount: 0
      }
    };
    
    this.clients.set(clientId, client);
    this.logger.info(`New client connected: ${clientId}`);
    this.emit('client-connected', { clientId });
    
    // Configurar eventos do socket
    socket.on('data', (data) => {
      this._handleData(clientId, data);
    });
    
    socket.on('close', () => {
      this._handleClientDisconnect(clientId);
    });
    
    socket.on('error', (err) => {
      this.logger.error(`Socket error for client ${clientId}:`, err);
      this.emit('client-error', { clientId, error: err });
    });
  }
  
  /**
   * Processa dados recebidos de um cliente
   * @private
   * @param {string} clientId - ID do cliente
   * @param {Buffer|string} data - Dados recebidos
   */
  _handleData(clientId, data) {
    const client = this.clients.get(clientId);
    if (!client) {
      this.logger.warn(`Received data for non-existent client: ${clientId}`);
      return;
    }
    
    // Adicionar dados ao buffer
    client.buffer += data.toString();
    
    // Verificar tamanho do buffer
    if (client.buffer.length > this.maxMessageSize) {
      this.logger.warn(`Client ${clientId} exceeded maximum message size`);
      this._sendError(clientId, null, ErrorCode.INTERNAL_ERROR, 'Message too large');
      client.buffer = '';
      return;
    }
    
    // Processar mensagens completas
    const { messages, remainingBuffer } = parseJsonRpcMessages(client.buffer);
    client.buffer = remainingBuffer;
    
    // Processar cada mensagem
    for (const message of messages) {
      this._processMessage(clientId, message);
    }
  }
  
  /**
   * Processa uma mensagem JSON-RPC de um cliente
   * @private
   * @param {string} clientId - ID do cliente
   * @param {Object} message - Mensagem JSON-RPC parseada
   */
  async _processMessage(clientId, message) {
    const client = this.clients.get(clientId);
    if (!client) return;
    
    // Validar mensagem JSON-RPC
    const validation = validateJsonRpc(message);
    if (!validation.isValid) {
      this._sendError(clientId, message.id, validation.error.code, validation.error.message);
      return;
    }
    
    // Incrementar contador de requisições
    client.context.requestCount++;
    
    // Log da mensagem recebida
    this.logger.debug(`Received message from client ${clientId}:`, {
      method: message.method,
      id: message.id,
      params: message.params
    });
    
    // Verificar se o método existe
    const handler = this.handlers.get(message.method);
    if (!handler) {
      this._sendError(clientId, message.id, ErrorCode.METHOD_NOT_FOUND, 
        `Method not found: ${message.method}`);
      return;
    }
    
    // Verificar estado de inicialização (exceto para o método initialize)
    if (message.method !== 'initialize' && !client.context.initialized) {
      this._sendError(clientId, message.id, ErrorCode.INVALID_REQUEST, 
        'Server not initialized. Call initialize first');
      return;
    }
    
    try {
      // Processar a mensagem com o handler apropriado
      const result = await handler.execute(message, client.context);
      
      // Enviar resposta apenas se houver ID (não é notificação)
      if (message.id !== undefined) {
        this._sendResponse(clientId, result);
      }
      
      // Emitir evento de mensagem processada
      this.emit('message-processed', {
        clientId,
        method: message.method,
        id: message.id,
        success: !result.error
      });
    } catch (error) {
      this.logger.error(`Error processing message for client ${clientId}:`, error);
      this._sendError(clientId, message.id, ErrorCode.INTERNAL_ERROR, 
        `Internal error: ${error.message}`);
    }
  }
  
  /**
   * Envia uma resposta JSON-RPC para um cliente
   * @private
   * @param {string} clientId - ID do cliente
   * @param {Object} response - Resposta JSON-RPC
   */
  _sendResponse(clientId, response) {
    const client = this.clients.get(clientId);
    if (!client || !client.socket.writable) return;
    
    try {
      const responseStr = stringifyJsonRpc(response);
      client.socket.write(responseStr);
      
      this.logger.debug(`Sent response to client ${clientId}:`, {
        id: response.id,
        hasError: !!response.error
      });
    } catch (error) {
      this.logger.error(`Error sending response to client ${clientId}:`, error);
    }
  }
  
  /**
   * Envia uma mensagem de erro JSON-RPC para um cliente
   * @private
   * @param {string} clientId - ID do cliente
   * @param {string|number|null} id - ID da requisição ou null
   * @param {number} code - Código de erro
   * @param {string} message - Mensagem de erro
   * @param {Object} [data] - Dados adicionais do erro
   */
  _sendError(clientId, id, code, message, data) {
    const errorResponse = createJsonRpcError(id, code, message, data);
    this._sendResponse(clientId, errorResponse);
  }
  
  /**
   * Envia uma notificação JSON-RPC para um cliente
   * @param {string} clientId - ID do cliente
   * @param {string} method - Nome do método
   * @param {Object} params - Parâmetros da notificação
   * @returns {boolean} true se enviado com sucesso, false caso contrário
   */
  sendNotification(clientId, method, params) {
    const client = this.clients.get(clientId);
    if (!client || !client.socket.writable) return false;
    
    try {
      const notification = createJsonRpcNotification(method, params);
      const notificationStr = stringifyJsonRpc(notification);
      client.socket.write(notificationStr);
      
      this.logger.debug(`Sent notification to client ${clientId}:`, {
        method,
        params
      });
      
      return true;
    } catch (error) {
      this.logger.error(`Error sending notification to client ${clientId}:`, error);
      return false;
    }
  }
  
  /**
   * Gerencia a desconexão de um cliente
   * @private
   * @param {string} clientId - ID do cliente
   */
  _handleClientDisconnect(clientId) {
    // Cancelar operações assíncronas pendentes
    for (const [operationId, operation] of this.asyncOperations.entries()) {
      if (operation.clientId === clientId) {
        this.asyncOperations.delete(operationId);
        this.logger.info(`Canceled async operation ${operationId} due to client disconnect`);
      }
    }
    
    // Remover cliente
    this.clients.delete(clientId);
    this.logger.info(`Client disconnected: ${clientId}`);
    this.emit('client-disconnected', { clientId });
  }
  
  /**
   * Desconecta um cliente forçadamente
   * @param {string} clientId - ID do cliente
   */
  _disconnectClient(clientId) {
    const client = this.clients.get(clientId);
    if (!client) return;
    
    try {
      client.socket.end();
      client.socket.destroy();
      this._handleClientDisconnect(clientId);
    } catch (error) {
      this.logger.error(`Error disconnecting client ${clientId}:`, error);
    }
  }
  
  /**
   * Inicia uma operação assíncrona
   * @param {string} clientId - ID do cliente
   * @param {string} method - Método sendo executado
   * @param {Object} params - Parâmetros da operação
   * @returns {string} ID da operação assíncrona
   */
  startAsyncOperation(clientId, method, params) {
    const operationId = `op_${crypto.randomBytes(8).toString('hex')}`;
    
    this.asyncOperations.set(operationId, {
      clientId,
      method,
      params,
      status: 'running',
      progress: 0,
      startTime: Date.now(),
      lastUpdateTime: Date.now()
    });
    
    this.logger.info(`Started async operation ${operationId} for client ${clientId}`);
    
    // Configurar timeout para a operação
    setTimeout(() => {
      const operation = this.asyncOperations.get(operationId);
      if (operation && operation.status === 'running') {
        this.updateAsyncOperation(operationId, {
          status: 'timeout',
          error: 'Operation timed out'
        });
      }
    }, this.asyncOperationTimeout);
    
    return operationId;
  }
  
  /**
   * Atualiza o estado de uma operação assíncrona
   * @param {string} operationId - ID da operação
   * @param {Object} update - Atualização para a operação
   * @returns {boolean} true se atualizado com sucesso, false caso contrário
   */
  updateAsyncOperation(operationId, update) {
    const operation = this.asyncOperations.get(operationId);
    if (!operation) return false;
    
    // Atualizar operação
    const updatedOperation = {
      ...operation,
      ...update,
      lastUpdateTime: Date.now()
    };
    
    this.asyncOperations.set(operationId, updatedOperation);
    
    // Enviar notificação de progresso
    if (update.status || update.progress !== undefined) {
      const client = this.clients.get(operation.clientId);
      if (client) {
        this.sendNotification(operation.clientId, 'progress', {
          operationId,
          status: updatedOperation.status,
          progress: updatedOperation.progress,
          method: operation.method,
          ...(update.result && { result: update.result }),
          ...(update.error && { error: update.error })
        });
      }
    }
    
    // Se a operação foi concluída ou falhou, removê-la do mapa
    if (update.status === 'completed' || update.status === 'failed' || update.status === 'timeout') {
      setTimeout(() => {
        this.asyncOperations.delete(operationId);
        this.logger.info(`Removed async operation ${operationId} with status ${update.status}`);
      }, 60000); // Manter por 1 minuto para referência
    }
    
    return true;
  }
}

module.exports = MCPServer;
