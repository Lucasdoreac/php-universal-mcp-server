/**
 * MCP (Model Context Protocol) SDK Adapter
 * Implementa a interface necessária para comunicação com o Claude Desktop
 * usando o protocolo MCP
 */

const EventEmitter = require('events');

class MCPAdapter {
  constructor(server) {
    this.server = server;
    this.eventEmitter = new EventEmitter();
    this.sessions = new Map();
  }

  /**
   * Inicializa o adaptador MCP
   */
  initialize() {
    // Registra handlers para os eventos MCP
    this.eventEmitter.on('status', this.handleStatus.bind(this));
    this.eventEmitter.on('execute', this.handleExecute.bind(this));
    this.eventEmitter.on('stream', this.handleStream.bind(this));
    this.eventEmitter.on('cancel', this.handleCancel.bind(this));
    this.eventEmitter.on('terminate', this.handleTerminate.bind(this));
  }

  /**
   * Processa uma mensagem MCP
   * @param {Object} message - Mensagem MCP
   * @returns {Object} Resposta da operação
   */
  processMessage(message) {
    if (!message || !message.type) {
      return {
        error: 'Invalid MCP message',
        status: 'error'
      };
    }

    // Emite o evento correspondente ao tipo de mensagem
    this.eventEmitter.emit(message.type, message);

    // Para mensagens síncronas, execute diretamente
    if (message.type === 'status' || message.type === 'terminate') {
      return this.server.processCommand(message);
    }

    // Para execute, stream e cancel, use o ID de sessão
    const sessionId = message.sessionId || crypto.randomUUID();
    
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, {
        id: sessionId,
        type: message.type,
        message: message,
        startTime: new Date()
      });
    }

    return {
      sessionId,
      status: 'accepted',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Lida com o comando de status
   * @param {Object} message - Mensagem MCP de status
   */
  handleStatus(message) {
    return this.server.processCommand({
      type: 'status',
      payload: message.payload || {}
    });
  }

  /**
   * Lida com o comando de execução
   * @param {Object} message - Mensagem MCP de execução
   */
  handleExecute(message) {
    return this.server.processCommand({
      type: 'execute',
      payload: message.payload || {}
    });
  }

  /**
   * Lida com o comando de stream
   * @param {Object} message - Mensagem MCP de stream
   */
  handleStream(message) {
    return this.server.processCommand({
      type: 'stream',
      payload: message.payload || {}
    });
  }

  /**
   * Lida com o comando de cancelamento
   * @param {Object} message - Mensagem MCP de cancelamento
   */
  handleCancel(message) {
    return this.server.processCommand({
      type: 'cancel',
      payload: {
        sessionId: message.sessionId,
        ...(message.payload || {})
      }
    });
  }

  /**
   * Lida com o comando de terminação
   * @param {Object} message - Mensagem MCP de terminação
   */
  handleTerminate(message) {
    return this.server.processCommand({
      type: 'terminate',
      payload: message.payload || {}
    });
  }

  /**
   * Implementação do método MCP para monitorar status
   * @param {Object} options - Opções de monitoramento
   * @returns {EventEmitter} Emissor de eventos para monitoramento
   */
  monitor(options = {}) {
    const emitter = new EventEmitter();
    
    // Registra o emissor para notificações
    this.eventEmitter.on('notification', (data) => {
      emitter.emit('data', data);
    });
    
    return emitter;
  }

  /**
   * Encerra uma sessão MCP
   * @param {string} sessionId - ID da sessão a ser encerrada
   */
  endSession(sessionId) {
    if (this.sessions.has(sessionId)) {
      this.sessions.delete(sessionId);
    }
  }
}

module.exports = MCPAdapter;