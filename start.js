#!/usr/bin/env node

/**
 * Script de inicialização do PHP Universal MCP Server
 * Versão 1.7.2
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const os = require('os');

// Pasta de configuração global
const configDir = path.join(os.homedir(), '.config', 'php-universal-mcp-server');
const globalConfigFile = path.join(configDir, 'config.json');

// Verificar se o diretório de configuração existe
if (!fs.existsSync(configDir)) {
  console.log('Creating configuration directory...');
  fs.mkdirSync(configDir, { recursive: true });
}

// Verificar se o arquivo de configuração local existe
const localConfigFile = path.join(__dirname, 'config.json');
const configExampleFile = path.join(__dirname, 'config.example.json');

// Inicializar configuração
let configPath;

// Priorizar configuração global
if (fs.existsSync(globalConfigFile)) {
  configPath = globalConfigFile;
  console.log('Using global configuration from:', globalConfigFile);
} 
// Em seguida, verificar configuração local
else if (fs.existsSync(localConfigFile)) {
  configPath = localConfigFile;
  console.log('Using local configuration from:', localConfigFile);
} 
// Se nenhuma existir, criar do exemplo
else if (fs.existsSync(configExampleFile)) {
  console.log('Config file not found. Creating from example...');
  
  // Copiar para ambos os locais
  fs.copyFileSync(configExampleFile, localConfigFile);
  
  // Também criar configuração global
  fs.copyFileSync(configExampleFile, globalConfigFile);
  
  configPath = globalConfigFile;
  console.log('Created config files. Using global configuration.');
} else {
  console.error('No configuration template found. Using defaults.');
  configPath = null;
}

// Processar argumentos de linha de comando
const args = process.argv.slice(2);

// Comandos especiais
if (args.length > 0) {
  switch (args[0]) {
    case '--version':
    case '-v':
      console.log('PHP Universal MCP Server v1.7.2');
      process.exit(0);
      break;
    
    case '--info':
      console.log('PHP Universal MCP Server v1.7.2');
      console.log('Default port: 3100');
      console.log('Config path:', configPath || 'Using defaults');
      
      if (configPath && fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        console.log('Server port:', config.server?.tcpPort || 3100);
        console.log('Cache enabled:', config.cache?.enabled !== false ? 'Yes' : 'No');
        console.log('Template editor:', config.design?.editor?.enabled !== false ? 'Enabled' : 'Disabled');
        console.log('Supported providers:', [
          config.hosting?.providers?.hostinger ? 'Hostinger' : null,
          config.ecommerce?.providers?.shopify ? 'Shopify' : null,
          config.ecommerce?.providers?.woocommerce ? 'WooCommerce' : null
        ].filter(Boolean).join(', '));
      }
      
      process.exit(0);
      break;
    
    case 'configure':
      if (args[1] === '--provider') {
        const provider = args[2];
        const providerArgs = args.slice(3);
        
        // Processar argumentos para configuração do provedor
        const providerConfig = {};
        for (let i = 0; i < providerArgs.length; i += 2) {
          if (providerArgs[i].startsWith('--')) {
            providerConfig[providerArgs[i].slice(2)] = providerArgs[i+1];
          }
        }
        
        // Salvar a configuração
        if (configPath && fs.existsSync(configPath)) {
          const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          
          // Atualizar configuração para o provedor específico
          if (provider === 'hostinger') {
            config.hosting = config.hosting || {};
            config.hosting.providers = config.hosting.providers || {};
            config.hosting.providers.hostinger = { 
              ...config.hosting.providers.hostinger,
              ...providerConfig 
            };
            config.hosting.defaultProvider = 'hostinger';
          } 
          else if (provider === 'shopify') {
            config.ecommerce = config.ecommerce || {};
            config.ecommerce.providers = config.ecommerce.providers || {};
            config.ecommerce.providers.shopify = { 
              ...config.ecommerce.providers.shopify,
              ...providerConfig 
            };
            config.ecommerce.defaultProvider = 'shopify';
          }
          else if (provider === 'woocommerce') {
            config.ecommerce = config.ecommerce || {};
            config.ecommerce.providers = config.ecommerce.providers || {};
            config.ecommerce.providers.woocommerce = { 
              ...config.ecommerce.providers.woocommerce,
              ...providerConfig 
            };
            config.ecommerce.defaultProvider = 'woocommerce';
          }
          
          // Salvar a configuração atualizada
          fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
          console.log(`Configuration for ${provider} saved successfully.`);
        } else {
          console.error('Configuration file not found.');
        }
        
        process.exit(0);
      }
      else if (args[1] === '--interactive') {
        console.log('Interactive configuration mode not implemented yet.');
        console.log('Use --provider option instead.');
        process.exit(0);
      }
      break;
      
    case 'config':
      if (args[1] === 'set' && args.length >= 3) {
        const keyPath = args[2];
        const value = args[3];
        
        if (configPath && fs.existsSync(configPath)) {
          const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          
          // Converter string para valores adequados
          let parsedValue;
          try {
            parsedValue = JSON.parse(value);
          } catch (e) {
            // Se não for JSON válido, usar como string
            parsedValue = value;
          }
          
          // Atualizar configuração usando o caminho aninhado
          const keys = keyPath.split('.');
          let current = config;
          
          for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) {
              current[keys[i]] = {};
            }
            current = current[keys[i]];
          }
          
          current[keys[keys.length - 1]] = parsedValue;
          
          // Salvar a configuração atualizada
          fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
          console.log(`Configuration ${keyPath} set to ${value}`);
        } else {
          console.error('Configuration file not found.');
        }
        
        process.exit(0);
      }
      break;
  }
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
    startServer(configPath);
  });
} else {
  startServer(configPath);
}

// Iniciar o servidor
function startServer(configFile) {
  console.log('Starting PHP Universal MCP Server v1.7.2...');
  
  try {
    // Definir variável de ambiente para o caminho da configuração
    if (configFile) {
      process.env.CONFIG_PATH = configFile;
      
      // Carregar configuração
      const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
      
      // Definir variáveis de ambiente
      if (config.server?.debug) {
        process.env.DEBUG = 'true';
      }
      
      if (config.server?.tcpPort) {
        process.env.MCP_PORT = config.server.tcpPort;
      } else {
        process.env.MCP_PORT = 3100; // Porto padrão para acesso via Claude
      }
      
      if (config.server?.logLevel) {
        process.env.LOG_LEVEL = config.server.logLevel;
      }
    } else {
      // Valores padrão se não houver configuração
      process.env.MCP_PORT = 3100;
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
