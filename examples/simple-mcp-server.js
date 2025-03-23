/**
 * @file simple-mcp-server.js
 * @description Exemplo simples de uso do servidor MCP
 */

const MCPServer = require('../core/mcp-protocol/server');
const { MCPHandler } = require('../core/mcp-protocol/handlers/handler');
const { createJsonRpcResponse } = require('../core/mcp-protocol/utils/json-rpc');

// Exemplo de handler personalizado para método ping
class PingHandler extends MCPHandler {
  constructor(options = {}) {
    super(options);
  }
  
  async handle(params, context, request) {
    // Responder com timestamp e dados do cliente
    return createJsonRpcResponse(request.id, {
      message: 'pong',
      timestamp: new Date().toISOString(),
      clientInfo: {
        id: context.clientId,
        name: context.clientName,
        requestCount: context.requestCount
      }
    });
  }
}

// Exemplo de handler para executar código PHP
class ExecutePhpHandler extends MCPHandler {
  constructor(options = {}) {
    super(options);
  }
  
  async handle(params, context, request) {
    // Verificar parâmetros
    if (!params.code) {
      return createJsonRpcError(request.id, ErrorCode.INVALID_PARAMS, 'Missing PHP code');
    }
    
    // Para simplificar o exemplo, simulamos a execução
    this.logger.info(`Executing PHP code for client ${context.clientId}`);
    
    // Em uma implementação real, executaríamos o código PHP usando child_process.spawn
    // e retornaríamos a saída. Aqui, retornamos uma resposta simulada.
    
    return createJsonRpcResponse(request.id, {
      output: 'PHP execution result would be here',
      exitCode: 0
    });
  }
}

// Criar e iniciar o servidor MCP
async function startServer() {
  try {
    // Criar instância do servidor
    const server = new MCPServer({
      port: 7654,
      serverCapabilities: {
        supportedFeatures: {
          php: true,
          // Outros recursos suportados
        }
      }
    });
    
    // Registrar handlers adicionais
    server.registerHandler('ping', new PingHandler({ logger: server.logger }));
    server.registerHandler('executePhp', new ExecutePhpHandler({ logger: server.logger }));
    
    // Assinar eventos do servidor
    server.on('started', (info) => {
      console.log(`Server started on ${info.host}:${info.port}`);
    });
    
    server.on('client-connected', (info) => {
      console.log(`Client connected: ${info.clientId}`);
    });
    
    server.on('client-disconnected', (info) => {
      console.log(`Client disconnected: ${info.clientId}`);
    });
    
    server.on('message-processed', (info) => {
      console.log(`Processed message: ${info.method} (id: ${info.id}, success: ${info.success})`);
    });
    
    // Iniciar o servidor
    await server.start();
    
    console.log('Server is running. Press Ctrl+C to stop.');
    
    // Configurar manejador para encerramento
    process.on('SIGINT', async () => {
      console.log('Stopping server...');
      await server.stop();
      console.log('Server stopped.');
      process.exit(0);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Executar o servidor
startServer();
