#!/usr/bin/env node

/**
 * PHP Universal MCP Server - Servidor HTTP
 * Implementa um servidor HTTP para atender requisições do protocolo MCP
 */

const http = require('http');
const url = require('url');
const { createServer } = require('./index');
const MCPAdapter = require('./sdk-mcp');
const fs = require('fs');
const path = require('path');

// Configurações padrão
const DEFAULT_PORT = 7432;
const DEFAULT_HOST = '127.0.0.1';

/**
 * Inicia o servidor HTTP para o protocolo MCP
 * @param {Object} options - Opções de configuração
 * @returns {http.Server} Instância do servidor HTTP
 */
function startServer(options = {}) {
  const config = {
    port: options.port || process.env.MCP_PORT || DEFAULT_PORT,
    host: options.host || process.env.MCP_HOST || DEFAULT_HOST,
    mcpConfig: options.mcpConfig || {}
  };

  // Cria o servidor MCP
  const mcpServer = createServer(config.mcpConfig);
  mcpServer.start();

  // Cria o adaptador MCP
  const mcpAdapter = new MCPAdapter(mcpServer);
  mcpAdapter.initialize();

  // Manipulador de requisições HTTP
  const requestListener = (req, res) => {
    // Habilita CORS para facilitar o desenvolvimento
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Responde imediatamente a requisições OPTIONS
    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    // Processa a URL e o path
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    // Rota de status do servidor
    if (pathname === '/status' && req.method === 'GET') {
      const status = mcpServer.processCommand({ type: 'status' });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(status));
      return;
    }

    // Rota principal MCP
    if (pathname === '/mcp' && req.method === 'POST') {
      let body = '';
      
      req.on('data', chunk => {
        body += chunk.toString();
      });
      
      req.on('end', () => {
        try {
          const message = JSON.parse(body);
          const response = mcpAdapter.processMessage(message);
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(response));
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            error: error.message,
            status: 'error',
            timestamp: new Date().toISOString() 
          }));
        }
      });
      
      return;
    }

    // Rota de streaming via SSE (Server-Sent Events)
    if (pathname === '/mcp/stream' && req.method === 'GET') {
      const sessionId = parsedUrl.query.sessionId;
      
      if (!sessionId) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          error: 'Missing sessionId parameter',
          status: 'error',
          timestamp: new Date().toISOString() 
        }));
        return;
      }
      
      // Configura cabeçalhos para SSE
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      });
      
      // Função para enviar eventos para o cliente
      const sendEvent = (event, data) => {
        res.write(`event: ${event}\n`);
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      };
      
      // Envia evento inicial de conexão
      sendEvent('connected', { 
        sessionId,
        timestamp: new Date().toISOString() 
      });
      
      // Configura handlers para eventos de stream
      const onData = (data) => {
        sendEvent('data', data);
      };
      
      const onEnd = (data) => {
        sendEvent('end', data);
        // Limpa os listeners e encerra a sessão
        mcpAdapter.endSession(sessionId);
        // Fecha a conexão
        res.end();
      };
      
      const onError = (error) => {
        sendEvent('error', { 
          error: error.message,
          timestamp: new Date().toISOString() 
        });
        // Limpa os listeners e encerra a sessão
        mcpAdapter.endSession(sessionId);
        // Fecha a conexão
        res.end();
      };
      
      // Registra os listeners
      mcpAdapter.eventEmitter.on('data', onData);
      mcpAdapter.eventEmitter.on('end', onEnd);
      mcpAdapter.eventEmitter.on('error', onError);
      
      // Limpa os listeners quando o cliente desconecta
      req.on('close', () => {
        mcpAdapter.eventEmitter.off('data', onData);
        mcpAdapter.eventEmitter.off('end', onEnd);
        mcpAdapter.eventEmitter.off('error', onError);
        mcpAdapter.endSession(sessionId);
      });
      
      return;
    }

    // Rota de documentação
    if (pathname === '/' || pathname === '/index.html') {
      try {
        const docPath = path.join(__dirname, '../docs/index.html');
        if (fs.existsSync(docPath)) {
          const content = fs.readFileSync(docPath, 'utf8');
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(content);
        } else {
          // Página simples caso a documentação não exista
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(`
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <title>PHP Universal MCP Server</title>
                <style>
                  body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
                  h1 { color: #2c3e50; }
                  code { background: #f8f8f8; padding: 2px 4px; border-radius: 3px; }
                </style>
              </head>
              <body>
                <h1>PHP Universal MCP Server</h1>
                <p>Um servidor MCP (Model Context Protocol) universal para desenvolvimento PHP, compatível com diversos provedores de hospedagem e nuvem.</p>
                <p>Status do servidor: <code>Ativo</code></p>
                <p>Endpoints disponíveis:</p>
                <ul>
                  <li><code>GET /status</code> - Status do servidor</li>
                  <li><code>POST /mcp</code> - Endpoint principal MCP</li>
                  <li><code>GET /mcp/stream?sessionId=...</code> - Streaming via SSE</li>
                </ul>
              </body>
            </html>
          `);
        }
        return;
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          error: error.message,
          status: 'error',
          timestamp: new Date().toISOString() 
        }));
        return;
      }
    }

    // Rota não encontrada
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      error: 'Not Found',
      status: 'error',
      timestamp: new Date().toISOString() 
    }));
  };

  // Cria o servidor HTTP
  const server = http.createServer(requestListener);
  
  // Inicia o servidor
  server.listen(config.port, config.host, () => {
    console.log(`Servidor MCP rodando em http://${config.host}:${config.port}`);
    console.log('Provedor ativo:', mcpServer.provider.getName());
    console.log('Modo:', config.mcpConfig.mode || 'auto');
  });
  
  // Manipula erros do servidor
  server.on('error', (error) => {
    console.error('Erro no servidor MCP:', error.message);
    
    if (error.code === 'EADDRINUSE') {
      console.error(`A porta ${config.port} já está em uso. Tente usar outra porta.`);
    }
  });

  return server;
}

// Exporta a função para iniciar o servidor
module.exports = {
  startServer
};

// Se o arquivo for executado diretamente, inicia o servidor
if (require.main === module) {
  startServer();
}