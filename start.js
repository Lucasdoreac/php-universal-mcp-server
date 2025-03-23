#!/usr/bin/env node

/**
 * Script de inicialização rápida do PHP Universal MCP Server
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Verificar se o arquivo de configuração existe
const configFile = path.join(__dirname, 'config.json');
const configExampleFile = path.join(__dirname, 'config.example.json');

if (!fs.existsSync(configFile) && fs.existsSync(configExampleFile)) {
  console.log('Config file not found. Creating from example...');
  fs.copyFileSync(configExampleFile, configFile);
  console.log('Created config.json from example. Please edit it if needed.');
}

// Verificar se as dependências estão instaladas
if (!fs.existsSync(path.join(__dirname, 'node_modules'))) {
  console.log('Dependencies not installed. Installing...');
  
  exec('npm install', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error installing dependencies: ${error.message}`);
      return;
    }
    
    if (stderr) {
      console.error(`Dependency installation warnings: ${stderr}`);
    }
    
    console.log('Dependencies installed successfully.');
    startServer();
  });
} else {
  startServer();
}

// Iniciar o servidor
function startServer() {
  console.log('Starting PHP Universal MCP Server...');
  
  try {
    // Carregar configuração
    const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
    
    // Definir variáveis de ambiente
    if (config.server?.debug) {
      process.env.DEBUG = 'true';
    }
    
    if (config.server?.tcpPort) {
      process.env.MCP_PORT = config.server.tcpPort;
    }
    
    // Iniciar o servidor
    const server = require('./server-part2');
    
    console.log('Server started successfully.');
    console.log('Press Ctrl+C to stop the server.');
  } catch (error) {
    console.error(`Error starting server: ${error.message}`);
    process.exit(1);
  }
}
