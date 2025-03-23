/**
 * PHP Universal MCP Server
 * 
 * Servidor MCP para gerenciamento de sites e e-commerces através do Claude Desktop
 */

const net = require('net');
const fs = require('fs');
const path = require('path');

// Módulos principais
const { DesignSystem } = require('./modules/design/index');

// Configurações
const DEFAULT_PORT = process.env.MCP_PORT || 7654;
const DEBUG = process.env.DEBUG === 'true';

// Sistema de cache simples em memória
const cache = {
  data: {},
  get: function(key) {
    const item = this.data[key];
    if (!item) return null;
    if (item.expiry && Date.now() > item.expiry) {
      delete this.data[key];
      return null;
    }
    return item.value;
  },
  set: function(key, value, ttl = null) {
    const expiry = ttl ? Date.now() + ttl * 1000 : null;
    this.data[key] = { value, expiry };
  },
  clear: function() {
    this.data = {};
  }
};

// Inicializar Design System
const designSystem = new DesignSystem({
  enableBootstrap: true,
  bootstrapVersion: '5.3.0',
  cache: cache
});

// Classe principal do servidor MCP
class MCPServer {
  constructor() {
    this.methods = {};
    this.tcpServer = null;
    this.clients = new Set();
    
    // Registrar métodos de API
    this._registerMethods();
  }
  
  _registerMethods() {
    // Registrar métodos do Design System
    designSystem.registerApiMethods(this);
    
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
          version: '1.0.0',
          bootstrap: designSystem.isBootstrapEnabled()
        }
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
      return {
        jsonrpc: '2.0',
        error: { code: -32603, message: error.message },
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
      console.log(`MCP Server listening on port ${port}`);
    });
  }
  
  stop() {
    if (this.tcpServer) {
      this.tcpServer.close();
      console.log('Server stopped');
    }
  }
}