const BaseProvider = require('./BaseProvider');
const MockProvider = require('./MockProvider');
const { EventEmitter } = require('events');

/**
 * Provider para integração com a Hostinger
 */
class HostingerProvider extends BaseProvider {
  constructor(config = {}) {
    super(config);
    
    // API Key para Hostinger
    this.apiKey = config.apiKey || '';
    
    // Base URL da API
    this.apiBaseUrl = config.apiBaseUrl || 'https://api.hostinger.com/v1';
    
    // Instancia um MockProvider para fallback
    this.mockProvider = new MockProvider(config);
    
    // Mantém registro de requisições/respostas para análise
    this.requestLog = [];
    
    // Streams ativos
    this.activeStreams = new Map();
  }
  
  /**
   * Retorna o nome do provider
   */
  getName() {
    return 'hostinger';
  }
  
  /**
   * Executa um comando na API da Hostinger
   */
  execute(payload) {
    // Se não tiver API key, usa o mock provider
    if (!this.apiKey && this.config.fallbackEnabled) {
      return this.mockProvider.execute(payload);
    }
    
    try {
      // Loga a requisição
      this._logRequest('execute', payload);
      
      // Executa a requisição real para a API da Hostinger
      const response = this._makeApiRequest(payload);
      
      // Loga a resposta
      this._logResponse('execute', response);
      
      return response;
    } catch (error) {
      // Se ocorrer um erro e fallback estiver habilitado, usa o mock
      if (this.config.fallbackEnabled) {
        console.warn(`Falling back to mock provider: ${error.message}`);
        return this.mockProvider.execute(payload);
      }
      
      // Caso contrário, propaga o erro
      throw error;
    }
  }
  
  /**
   * Cria um stream para operações assíncronas
   */
  createStream(payload) {
    // Se não tiver API key, usa o mock provider
    if (!this.apiKey && this.config.fallbackEnabled) {
      return this.mockProvider.createStream(payload);
    }
    
    try {
      const streamId = crypto.randomUUID();
      const emitter = new EventEmitter();
      
      // Armazena o stream
      this.activeStreams.set(streamId, {
        id: streamId,
        emitter: emitter,
        payload: payload,
        startTime: new Date()
      });
      
      // Loga a requisição
      this._logRequest('stream', payload);
      
      // Inicia a operação assíncrona
      this._startStreamOperation(streamId, payload);
      
      return {
        id: streamId,
        emitter: emitter
      };
    } catch (error) {
      // Se ocorrer um erro e fallback estiver habilitado, usa o mock
      if (this.config.fallbackEnabled) {
        console.warn(`Falling back to mock provider for stream: ${error.message}`);
        return this.mockProvider.createStream(payload);
      }
      
      // Caso contrário, propaga o erro
      throw error;
    }
  }
  
  /**
   * Fecha um stream ativo
   */
  closeStream(stream) {
    if (!stream || !stream.id) return;
    
    const streamId = stream.id;
    
    // Verifica se é um stream gerenciado por este provider
    if (this.activeStreams.has(streamId)) {
      const activeStream = this.activeStreams.get(streamId);
      
      // Emite evento de fechamento
      activeStream.emitter.emit('close', { 
        id: streamId, 
        reason: 'user_closed', 
        timestamp: new Date().toISOString() 
      });
      
      // Remove o stream da lista de ativos
      this.activeStreams.delete(streamId);
    } else {
      // Tenta fechar no mock provider como fallback
      this.mockProvider.closeStream(stream);
    }
  }
  
  /**
   * Cancela a execução de um comando
   */
  cancel(sessionId) {
    // Verifica se é um stream ativo
    if (this.activeStreams.has(sessionId)) {
      const stream = this.activeStreams.get(sessionId);
      
      // Emite evento de cancelamento
      stream.emitter.emit('cancel', { 
        id: sessionId, 
        reason: 'user_canceled', 
        timestamp: new Date().toISOString() 
      });
      
      // Remove o stream da lista de ativos
      this.activeStreams.delete(sessionId);
      
      return {
        success: true,
        message: `Canceled session ${sessionId}`,
        timestamp: new Date().toISOString()
      };
    }
    
    // Tenta cancelar no mock provider como fallback
    return this.mockProvider.cancel(sessionId);
  }
  
  /**
   * Verifica se o provider está disponível
   */
  isAvailable() {
    // Verifica se tem API key e se a API está respondendo
    if (!this.apiKey) return false;
    
    try {
      // Tenta fazer uma chamada simples para verificar disponibilidade
      const testResponse = this._makeApiRequest({ action: 'ping' });
      return testResponse.success === true;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Faz uma requisição para a API da Hostinger
   * @private
   */
  _makeApiRequest(payload) {
    // Implementação real da chamada de API da Hostinger usando fetch/axios/etc
    // Esta é uma implementação simulada para exemplo
    
    // Simula uma chamada de API
    if (Math.random() > 0.9) {
      // Simula falha ocasional para testar fallback
      throw new Error('API request failed');
    }
    
    // Simula resposta de API
    return {
      success: true,
      requestId: `req_${Math.floor(Math.random() * 1000000)}`,
      timestamp: new Date().toISOString(),
      data: {
        // Dados específicos com base no payload
        message: 'API request successful',
        action: payload.action,
        result: {}
      }
    };
  }
  
  /**
   * Inicia uma operação de stream com a API da Hostinger
   * @private
   */
  _startStreamOperation(streamId, payload) {
    const stream = this.activeStreams.get(streamId);
    if (!stream) return;
    
    // Emite evento de início
    stream.emitter.emit('start', { 
      id: streamId, 
      timestamp: new Date().toISOString() 
    });
    
    // Implementação real de polling/websocket/etc para operação de longa duração
    // Esta é uma implementação simulada para exemplo
    
    // Simula eventos em intervalos
    const eventCount = Math.floor(Math.random() * 5) + 3;
    
    for (let i = 0; i < eventCount; i++) {
      setTimeout(() => {
        // Verifica se o stream ainda está ativo
        if (!this.activeStreams.has(streamId)) return;
        
        // Gera dados de evento
        const eventData = {
          id: `host_event_${i}`,
          progress: Math.round((i + 1) / eventCount * 100),
          data: {
            action: payload.action,
            step: `Step ${i + 1} of ${eventCount}`,
            details: `Processing ${payload.action} on Hostinger`
          },
          timestamp: new Date().toISOString()
        };
        
        // Emite o evento
        stream.emitter.emit('data', eventData);
        
        // Se for o último evento, emite 'end'
        if (i === eventCount - 1) {
          stream.emitter.emit('end', { 
            id: streamId, 
            completed: true, 
            timestamp: new Date().toISOString(),
            result: {
              action: payload.action,
              status: 'completed',
              message: `Operation ${payload.action} completed successfully`
            }
          });
          
          // Remove o stream da lista de ativos
          this.activeStreams.delete(streamId);
        }
      }, 1000 * (i + 1)); // Intervalos de 1 segundo
    }
  }
  
  /**
   * Loga uma requisição para análise
   * @private
   */
  _logRequest(type, payload) {
    this.requestLog.push({
      type: type,
      direction: 'request',
      payload: payload,
      timestamp: new Date().toISOString()
    });
    
    // Limita o tamanho do log
    if (this.requestLog.length > 100) {
      this.requestLog.shift();
    }
  }
  
  /**
   * Loga uma resposta para análise
   * @private
   */
  _logResponse(type, response) {
    this.requestLog.push({
      type: type,
      direction: 'response',
      response: response,
      timestamp: new Date().toISOString()
    });
    
    // Limita o tamanho do log
    if (this.requestLog.length > 100) {
      this.requestLog.shift();
    }
  }
}

module.exports = HostingerProvider;