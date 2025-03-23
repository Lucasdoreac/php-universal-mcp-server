const BaseProvider = require('./BaseProvider');
const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');
const crypto = require('crypto');

/**
 * Provider simulado para uso sem API externa
 * Implementa todas as funcionalidades usando dados locais simulados
 */
class MockProvider extends BaseProvider {
  constructor(config = {}) {
    super(config);
    
    // Diretório para armazenamento local simulado
    this.dataDir = config.mockDataDir || path.join(process.cwd(), 'mock-data');
    this.ensureDataDir();
    
    // Cache de respostas simuladas
    this.responseCache = new Map();
    
    // Streams ativos
    this.activeStreams = new Map();
    
    // Carrega dados simulados pré-definidos
    this.loadMockData();
  }
  
  /**
   * Retorna o nome do provider
   */
  getName() {
    return 'mock-provider';
  }
  
  /**
   * Garante que o diretório de dados simulados existe
   */
  ensureDataDir() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
    } catch (error) {
      console.warn(`Failed to create mock data directory: ${error.message}`);
    }
  }
  
  /**
   * Carrega dados simulados pré-definidos
   */
  loadMockData() {
    try {
      // Carregar dados padrão
      const defaultDataPath = path.join(__dirname, 'mock-data', 'default.json');
      if (fs.existsSync(defaultDataPath)) {
        const data = JSON.parse(fs.readFileSync(defaultDataPath, 'utf8'));
        Object.entries(data).forEach(([key, value]) => {
          this.responseCache.set(key, value);
        });
      }
      
      // Carregar dados personalizados
      const customDataPath = path.join(this.dataDir, 'custom.json');
      if (fs.existsSync(customDataPath)) {
        const data = JSON.parse(fs.readFileSync(customDataPath, 'utf8'));
        Object.entries(data).forEach(([key, value]) => {
          this.responseCache.set(key, value);
        });
      }
    } catch (error) {
      console.warn(`Failed to load mock data: ${error.message}`);
    }
  }
  
  /**
   * Executa um comando usando dados simulados
   */
  execute(payload) {
    // Gera uma chave de cache baseada no payload
    const cacheKey = this._getCacheKey(payload);
    
    // Verifica se há uma resposta em cache
    if (this.responseCache.has(cacheKey)) {
      return this.responseCache.get(cacheKey);
    }
    
    // Gera uma resposta simulada
    const mockResponse = this._generateMockResponse(payload);
    
    // Armazena no cache para uso futuro
    this.responseCache.set(cacheKey, mockResponse);
    
    return mockResponse;
  }
  
  /**
   * Cria um stream simulado
   */
  createStream(payload) {
    const streamId = crypto.randomUUID();
    const emitter = new EventEmitter();
    
    // Armazena o stream
    this.activeStreams.set(streamId, {
      id: streamId,
      emitter: emitter,
      payload: payload,
      startTime: new Date()
    });
    
    // Simula evento de início
    setTimeout(() => {
      emitter.emit('start', { id: streamId, timestamp: new Date().toISOString() });
    }, 100);
    
    // Simula eventos de dados
    this._simulateStreamEvents(streamId, payload);
    
    return {
      id: streamId,
      emitter: emitter
    };
  }
  
  /**
   * Simula eventos em um stream
   */
  _simulateStreamEvents(streamId, payload) {
    const stream = this.activeStreams.get(streamId);
    if (!stream) return;
    
    // Determina o número de eventos a enviar
    const eventCount = Math.floor(Math.random() * 10) + 2;
    
    // Gera e envia eventos
    for (let i = 0; i < eventCount; i++) {
      setTimeout(() => {
        // Verifica se o stream ainda está ativo
        if (!this.activeStreams.has(streamId)) return;
        
        // Gera dados simulados para o evento
        const eventData = this._generateMockData(payload, i, eventCount);
        
        // Emite o evento
        stream.emitter.emit('data', eventData);
        
        // Se for o último evento, emite 'end'
        if (i === eventCount - 1) {
          stream.emitter.emit('end', { 
            id: streamId, 
            completed: true, 
            timestamp: new Date().toISOString() 
          });
          
          // Remove o stream da lista de ativos
          this.activeStreams.delete(streamId);
        }
      }, 500 * (i + 1)); // Espaçamento de 500ms entre eventos
    }
  }
  
  /**
   * Fecha um stream ativo
   */
  closeStream(stream) {
    if (!stream || !stream.id) return;
    
    const streamId = stream.id;
    const activeStream = this.activeStreams.get(streamId);
    
    if (activeStream) {
      // Emite evento de fechamento
      activeStream.emitter.emit('close', { 
        id: streamId, 
        reason: 'user_closed', 
        timestamp: new Date().toISOString() 
      });
      
      // Remove o stream da lista de ativos
      this.activeStreams.delete(streamId);
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
    }
    
    return {
      success: true,
      message: `Canceled session ${sessionId}`,
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Verifica se o provider está disponível
   */
  isAvailable() {
    return true; // O mock provider está sempre disponível
  }
  
  /**
   * Gera uma chave de cache com base no payload
   */
  _getCacheKey(payload) {
    try {
      // Usa uma versão simplificada do payload como chave
      const keyParts = [];
      
      if (payload.action) {
        keyParts.push(`action:${payload.action}`);
      }
      
      if (payload.target) {
        keyParts.push(`target:${payload.target}`);
      }
      
      if (payload.id) {
        keyParts.push(`id:${payload.id}`);
      }
      
      return keyParts.join('|') || 'default';
    } catch (error) {
      return 'default';
    }
  }
  
  /**
   * Gera uma resposta simulada com base no payload
   */
  _generateMockResponse(payload) {
    // Resposta básica padrão
    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      data: {}
    };
    
    // Adiciona dados específicos com base na ação
    if (payload.action) {
      switch (payload.action) {
        case 'createSite':
          response.data = {
            siteId: `site_${Math.floor(Math.random() * 10000)}`,
            domain: payload.domain || 'example.com',
            status: 'created',
            createdAt: new Date().toISOString()
          };
          break;
          
        case 'uploadFile':
          response.data = {
            fileId: `file_${Math.floor(Math.random() * 10000)}`,
            path: payload.path || '/unknown/path',
            size: Math.floor(Math.random() * 1000000),
            uploadedAt: new Date().toISOString()
          };
          break;
          
        case 'getDomainInfo':
          response.data = {
            domain: payload.domain || 'example.com',
            registered: true,
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            nameservers: [
              'ns1.mockprovider.com',
              'ns2.mockprovider.com'
            ]
          };
          break;
          
        default:
          response.data = {
            message: 'Operation simulated successfully',
            details: 'This is a simulated response'
          };
      }
    }
    
    return response;
  }
  
  /**
   * Gera dados simulados para eventos de stream
   */
  _generateMockData(payload, index, total) {
    return {
      id: `event_${index}`,
      progress: Math.round((index + 1) / total * 100),
      data: {
        message: `Processing step ${index + 1} of ${total}`,
        details: `Simulated data for event ${index + 1}`
      },
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = MockProvider;