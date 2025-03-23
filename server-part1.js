/**
 * PHP Universal MCP Server
 * 
 * Servidor MCP para gerenciamento de sites e e-commerces através do Claude Desktop
 * Versão 1.7.2
 */

const net = require('net');
const fs = require('fs');
const path = require('path');
const NodeCache = require('node-cache');
const zlib = require('zlib');

// Módulos principais
const { DesignSystem } = require('./modules/design/index');
const { ExportManager } = require('./modules/export/index');
const { TemplateEditor } = require('./modules/design/editor');

// Configurações
const DEFAULT_PORT = process.env.MCP_PORT || 7654;
const DEBUG = process.env.DEBUG === 'true';
const CONFIG_PATH = process.env.CONFIG_PATH || path.join(process.env.HOME || process.env.USERPROFILE, '.config', 'php-universal-mcp-server', 'config.json');

// Carrega a configuração
let config = {};
try {
  if (fs.existsSync(CONFIG_PATH)) {
    config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  }
} catch (err) {
  console.error('Error loading config:', err.message);
  config = {};
}

// Sistema de cache avançado
class CacheManager {
  constructor(options = {}) {
    this.options = {
      enabled: true,
      ttl: 3600,
      typeTTL: {
        products: 1800,
        orders: 300,
        analytics: 7200,
        templates: 86400
      },
      storage: 'memory',
      compression: true,
      ...options
    };

    this.cache = new NodeCache({
      stdTTL: this.options.ttl,
      checkperiod: 120,
      useClones: false,
      maxKeys: -1
    });
    
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      compressionSavings: 0
    };
  }

  get(key, type = 'default') {
    if (!this.options.enabled) return null;
    
    try {
      const item = this.cache.get(key);
      if (!item) {
        this.stats.misses++;
        return null;
      }
      
      if (this.options.compression && item.compressed) {
        const decompressed = zlib.gunzipSync(Buffer.from(item.value, 'base64')).toString();
        item.value = JSON.parse(decompressed);
      }
      
      this.stats.hits++;
      return item.value;
    } catch (error) {
      console.error(`Cache get error: ${error.message}`);
      return null;
    }
  }

  set(key, value, ttl = null, type = 'default') {
    if (!this.options.enabled) return;
    
    try {
      // Determine TTL based on type or default
      const effectiveTTL = ttl || (this.options.typeTTL[type] || this.options.ttl);
      
      let storeValue = value;
      let compressed = false;
      
      // Compress large objects if enabled
      if (this.options.compression && typeof value === 'object') {
        const stringValue = JSON.stringify(value);
        if (stringValue.length > 1024) { // Only compress if larger than 1KB
          const originalSize = stringValue.length;
          const compressedBuffer = zlib.gzipSync(stringValue);
          const compressedSize = compressedBuffer.length;
          
          this.stats.compressionSavings += (originalSize - compressedSize);
          
          storeValue = compressedBuffer.toString('base64');
          compressed = true;
        }
      }
      
      this.cache.set(key, { value: storeValue, compressed }, effectiveTTL);
      this.stats.sets++;
    } catch (error) {
      console.error(`Cache set error: ${error.message}`);
    }
  }

  clear(pattern = null) {
    if (pattern) {
      const keys = this.cache.keys();
      const matchingKeys = keys.filter(key => key.includes(pattern));
      matchingKeys.forEach(key => this.cache.del(key));
      return matchingKeys.length;
    }
    return this.cache.flushAll();
  }
  
  getStats() {
    return {
      ...this.stats,
      keys: this.cache.keys().length,
      hitRatio: this.stats.hits / (this.stats.hits + this.stats.misses) || 0,
      compressionSavingsMB: Math.round(this.stats.compressionSavings / (1024 * 1024) * 100) / 100
    };
  }
}

// Inicializar sistema de cache
const cacheManager = new CacheManager(config.cache || {});

// Inicializar Design System
const designSystem = new DesignSystem({
  enableBootstrap: config.bootstrap?.enabled !== false,
  bootstrapVersion: config.bootstrap?.version || '5.3.0',
  responsive: config.bootstrap?.responsive !== false,
  cache: cacheManager
});

// Inicializar Editor de Templates
const templateEditor = new TemplateEditor({
  components: config.design?.editor?.components || ['header', 'footer', 'products', 'gallery'],
  responsive: config.design?.templateOptions?.responsiveBreakpoints || {},
  cache: cacheManager
});

// Inicializar Export Manager
const exportManager = new ExportManager({
  formats: config.export?.formats || ['csv', 'pdf', 'json'],
  config: config.export || {}
});

// Classe principal do servidor MCP
class MCPServer {
  constructor() {
    this.methods = {};
    this.tcpServer = null;
    this.clients = new Set();
    this.cacheManager = cacheManager;
    this.config = config;
    
    // Registrar métodos de API
    this._registerMethods();
  }
  
  _registerMethods() {
    // Registrar métodos do Design System
    designSystem.registerApiMethods(this);
    
    // Registrar métodos do Editor de Templates
    templateEditor.registerApiMethods(this);
    
    // Registrar métodos do Export Manager
    exportManager.registerApiMethods(this);
    
    // Registrar método de eco para testes
    this.registerMethod('echo', async (params) => {
      return {
        success: true,
        data: params
      };
    });
    
    // Registrar método para informações do sistema
    this.registerMethod('system.info', async () => {
      return {
        success: true,
        data: {
          name: 'PHP Universal MCP Server',
          version: '1.7.2',
          bootstrap: designSystem.isBootstrapEnabled(),
          caching: this.cacheManager.options.enabled,
          templateEditor: config.design?.editor?.enabled !== false,
          responsive: config.bootstrap?.responsive !== false,
          exportFormats: config.export?.formats || ['csv', 'pdf', 'json']
        }
      };
    });
    
    // Registrar método para estatísticas de cache
    this.registerMethod('cache.stats', async () => {
      return {
        success: true,
        data: this.cacheManager.getStats()
      };
    });
    
    // Registrar método para limpar cache
    this.registerMethod('cache.clear', async (params) => {
      const cleared = this.cacheManager.clear(params?.pattern || null);
      return {
        success: true,
        data: { cleared }
      };
    });
  }
  
  registerMethod(name, handler) {
    this.methods[name] = handler;
    if (DEBUG) console.log(`Registered method: ${name}`);
  }
  
  async processRequest(request) {
    if (!request || request.jsonrpc !== '2.0') {
      return {
        jsonrpc: '2.0',
        error: { code: -32600, message: 'Invalid Request' },
        id: request?.id || null
      };
    }
    
    const { method, params, id } = request;
    
    if (!this.methods[method]) {
      return {
        jsonrpc: '2.0',
        error: { code: -32601, message: 'Method not found' },
        id
      };
    }
    
    try {
      const result = await this.methods[method](params);
      return { jsonrpc: '2.0', result, id };
    } catch (error) {
      console.error(`Error processing request: ${error.message}`, error.stack);
      return {
        jsonrpc: '2.0',
        error: { code: -32603, message: error.message, stack: DEBUG ? error.stack : undefined },
        id
      };
    }
  }
  
  startServer(port = DEFAULT_PORT) {
    this.tcpServer = net.createServer((socket) => {
      console.log('Client connected');
      this.clients.add(socket);
      
      let buffer = '';
      
      socket.on('data', async (data) => {
        buffer += data.toString();
        
        const lines = buffer.split('\n');
        buffer = lines.pop();
        
        for (const line of lines) {
          if (!line.trim()) continue;
          
          try {
            const request = JSON.parse(line);
            const response = await this.processRequest(request);
            socket.write(JSON.stringify(response) + '\n');
          } catch (error) {
            socket.write(JSON.stringify({
              jsonrpc: '2.0',
              error: { code: -32700, message: 'Parse error' },
              id: null
            }) + '\n');
          }
        }
      });
      
      socket.on('close', () => {
        console.log('Client disconnected');
        this.clients.delete(socket);
      });
      
      socket.on('error', (error) => {
        console.error('Socket error:', error);
        this.clients.delete(socket);
      });
    });
    
    this.tcpServer.listen(port, () => {
      console.log(`PHP Universal MCP Server v1.7.2 listening on port ${port}`);
      console.log(`Cache: ${this.cacheManager.options.enabled ? 'Enabled' : 'Disabled'}`);
      console.log(`Bootstrap: ${designSystem.isBootstrapEnabled() ? 'Enabled' : 'Disabled'}`);
      console.log(`Template Editor: ${config.design?.editor?.enabled !== false ? 'Enabled' : 'Disabled'}`);
      console.log(`Export formats: ${config.export?.formats?.join(', ') || 'csv, pdf, json'}`);
    });
  }
  
  stop() {
    if (this.tcpServer) {
      this.tcpServer.close();
      console.log('Server stopped');
    }
  }
}