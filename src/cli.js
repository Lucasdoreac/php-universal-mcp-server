#!/usr/bin/env node

/**
 * PHP Universal MCP Server - CLI
 * Interface de linha de comando para o servidor MCP universal
 */

const { createServer } = require('./index');
const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  mode: 'auto',
  provider: 'auto',
  config: null,
  help: false,
  version: false
};

// Parse arguments
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  
  if (arg === '--help' || arg === '-h') {
    options.help = true;
  } else if (arg === '--version' || arg === '-v') {
    options.version = true;
  } else if (arg === '--mode' || arg === '-m') {
    if (i + 1 < args.length) {
      options.mode = args[++i];
    }
  } else if (arg === '--provider' || arg === '-p') {
    if (i + 1 < args.length) {
      options.provider = args[++i];
    }
  } else if (arg === '--config' || arg === '-c') {
    if (i + 1 < args.length) {
      options.config = args[++i];
    }
  }
}

// Show help
if (options.help) {
  console.log(`
PHP Universal MCP Server
Uma implementação universal do protocolo MCP para desenvolvimento PHP

USAGE:
  php-universal-mcp-server [OPTIONS]

OPTIONS:
  --help, -h          Mostra esta mensagem de ajuda
  --version, -v       Mostra a versão do servidor
  --mode, -m MODE     Define o modo de operação (auto, online, offline)
  --provider, -p TYPE Define o tipo de provider (auto, hostinger, cpanel, plesk, aws, azure, gcp, mock)
  --config, -c FILE   Carrega a configuração de um arquivo JSON

EXAMPLES:
  # Iniciar o servidor no modo padrão
  php-universal-mcp-server

  # Iniciar em modo offline
  php-universal-mcp-server --mode offline

  # Usar um provedor específico
  php-universal-mcp-server --provider azure

  # Usar um arquivo de configuração
  php-universal-mcp-server --config ./config.json
  `);
  process.exit(0);
}

// Show version
if (options.version) {
  const packageJson = require('../package.json');
  console.log(`PHP Universal MCP Server v${packageJson.version}`);
  process.exit(0);
}

// Load configuration from file if specified
let config = {};
if (options.config) {
  try {
    const configPath = path.resolve(process.cwd(), options.config);
    const configData = fs.readFileSync(configPath, 'utf8');
    config = JSON.parse(configData);
    console.log(`Configuração carregada de ${configPath}`);
  } catch (error) {
    console.error(`Erro ao carregar arquivo de configuração: ${error.message}`);
    process.exit(1);
  }
}

// Override config with command line arguments
if (options.mode !== 'auto') {
  config.mode = options.mode;
}
if (options.provider !== 'auto') {
  config.providerType = options.provider;
}

// Include environment variables
if (process.env.API_KEY) {
  config.apiKey = process.env.API_KEY;
}

// Create and start server
try {
  const server = createServer(config);
  const result = server.start();
  
  console.log(`PHP Universal MCP Server iniciado!`);
  console.log(`- Provider: ${result.provider}`);
  console.log(`- Modo: ${result.mode}`);
  console.log(`- Timestamp: ${result.timestamp}`);
  
  // Configurar manipuladores de eventos de processo
  process.on('SIGINT', () => {
    console.log('\nDesligando servidor MCP...');
    server.stop();
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    console.log('\nDesligando servidor MCP...');
    server.stop();
    process.exit(0);
  });
  
  // Expondo o servidor para uso externo
  module.exports = server;
  
} catch (error) {
  console.error(`Erro ao iniciar o servidor MCP: ${error.message}`);
  process.exit(1);
}