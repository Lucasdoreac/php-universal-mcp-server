#!/usr/bin/env node
/**
 * Script de linha de comando para executar testes de carga no renderizador progressivo
 * 
 * Este script fornece uma interface de linha de comando para executar testes
 * de carga no renderizador progressivo com diferentes opções
 * 
 * Uso: node run-load-tests.js [opções]
 * 
 * @author PHP Universal MCP Server Team
 * @version 1.0.0
 */

const LoadTestRunner = require('./load-test-runner');
const path = require('path');
const fs = require('fs').promises;

// Configuração de cores para o console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m'
};

/**
 * Processa argumentos da linha de comando
 * @returns {Object} Opções do teste
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    mode: 'all',
    iterations: 5,
    outputDir: path.join(__dirname, 'test-results'),
    templateDir: path.join(__dirname, 'generated-templates'),
    generateHtmlReport: true,
    compareRenderers: true,
    testEdgeCases: true,
    regenerateTemplates: false,
    verbose: false,
    help: false
  };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--help' || arg === '-h') {
      options.help = true;
      continue;
    }
    
    if (arg === '--basic' || arg === '-b') {
      options.mode = 'basic';
      options.iterations = 3;
      options.compareRenderers = false;
      options.testEdgeCases = false;
      continue;
    }
    
    if (arg === '--comprehensive' || arg === '-c') {
      options.mode = 'comprehensive';
      options.iterations = 10;
      continue;
    }
    
    if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
      continue;
    }
    
    if (arg === '--regenerate-templates') {
      options.regenerateTemplates = true;
      continue;
    }
    
    if (arg === '--iterations' || arg === '-i') {
      if (i + 1 < args.length) {
        const value = parseInt(args[++i], 10);
        if (!isNaN(value) && value > 0) {
          options.iterations = value;
        }
      }
      continue;
    }
    
    if (arg === '--output-dir' || arg === '-o') {
      if (i + 1 < args.length) {
        options.outputDir = args[++i];
      }
      continue;
    }
    
    if (arg === '--no-html-report') {
      options.generateHtmlReport = false;
      continue;
    }
    
    if (arg === '--template-dir' || arg === '-t') {
      if (i + 1 < args.length) {
        options.templateDir = args[++i];
      }
      continue;
    }
    
    if (arg === '--skip-edge-cases') {
      options.testEdgeCases = false;
      continue;
    }
    
    if (arg === '--skip-renderer-comparison') {
      options.compareRenderers = false;
      continue;
    }
  }
  
  return options;
}

/**
 * Exibe a ajuda do script
 */
function showHelp() {
  console.log(`${colors.bright}${colors.cyan}Testes de Carga do Renderizador Progressivo${colors.reset}`);
  console.log('');
  console.log(`${colors.bright}Uso:${colors.reset} node run-load-tests.js [opções]`);
  console.log('');
  console.log(`${colors.yellow}Opções:${colors.reset}`);
  console.log(`  ${colors.green}--help, -h${colors.reset}                   Exibe esta ajuda`);
  console.log(`  ${colors.green}--basic, -b${colors.reset}                  Modo básico (mais rápido, menos testes)`);
  console.log(`  ${colors.green}--comprehensive, -c${colors.reset}          Modo compreensivo (mais iterações, todos os testes)`);
  console.log(`  ${colors.green}--verbose, -v${colors.reset}                Modo verboso com mais detalhes de log`);
  console.log(`  ${colors.green}--iterations, -i <num>${colors.reset}       Define o número de iterações por teste (padrão: 5)`);
  console.log(`  ${colors.green}--output-dir, -o <dir>${colors.reset}       Define o diretório de saída para resultados`);
  console.log(`  ${colors.green}--template-dir, -t <dir>${colors.reset}     Define o diretório de templates`);
  console.log(`  ${colors.green}--regenerate-templates${colors.reset}       Força a regeração de templates`);
  console.log(`  ${colors.green}--no-html-report${colors.reset}             Não gera relatório HTML`);
  console.log(`  ${colors.green}--skip-edge-cases${colors.reset}            Pula testes de casos extremos`);
  console.log(`  ${colors.green}--skip-renderer-comparison${colors.reset}   Pula comparação entre renderizadores`);
  console.log('');
  console.log(`${colors.yellow}Exemplos:${colors.reset}`);
  console.log(`  ${colors.dim}# Executa testes básicos com 3 iterações${colors.reset}`);
  console.log(`  node run-load-tests.js --basic`);
  console.log('');
  console.log(`  ${colors.dim}# Executa testes compreensivos com 10 iterações${colors.reset}`);
  console.log(`  node run-load-tests.js --comprehensive`);
  console.log('');
  console.log(`  ${colors.dim}# Executa testes personalizados${colors.reset}`);
  console.log(`  node run-load-tests.js --iterations 7 --output-dir ./meus-resultados --verbose`);
  console.log('');
}

/**
 * Verifica se um diretório existe e cria se necessário
 * @param {string} dir - Diretório a verificar/criar
 */
async function ensureDirectoryExists(dir) {
  try {
    await fs.access(dir);
  } catch (error) {
    await fs.mkdir(dir, { recursive: true });
  }
}

/**
 * Exibe informação sobre os testes que serão executados
 * @param {Object} options - Opções de teste
 */
function displayTestInfo(options) {
  console.log('');
  console.log(`${colors.cyan}${colors.bright}===== Configuração dos Testes de Carga =====${colors.reset}`);
  console.log('');
  
  const modeColors = {
    all: colors.green,
    basic: colors.yellow,
    comprehensive: colors.magenta
  };
  
  console.log(`${colors.bright}Modo:${colors.reset} ${modeColors[options.mode]}${options.mode}${colors.reset}`);
  console.log(`${colors.bright}Iterações:${colors.reset} ${options.iterations}`);
  console.log(`${colors.bright}Diretório de saída:${colors.reset} ${options.outputDir}`);
  console.log(`${colors.bright}Diretório de templates:${colors.reset} ${options.templateDir}`);
  console.log('');
  console.log(`${colors.bright}Testar casos extremos:${colors.reset} ${options.testEdgeCases ? colors.green + 'Sim' : colors.red + 'Não'}${colors.reset}`);
  console.log(`${colors.bright}Comparar renderizadores:${colors.reset} ${options.compareRenderers ? colors.green + 'Sim' : colors.red + 'Não'}${colors.reset}`);
  console.log(`${colors.bright}Gerar relatório HTML:${colors.reset} ${options.generateHtmlReport ? colors.green + 'Sim' : colors.red + 'Não'}${colors.reset}`);
  console.log(`${colors.bright}Regenerar templates:${colors.reset} ${options.regenerateTemplates ? colors.green + 'Sim' : colors.red + 'Não'}${colors.reset}`);
  console.log(`${colors.bright}Modo verboso:${colors.reset} ${options.verbose ? colors.green + 'Sim' : colors.red + 'Não'}${colors.reset}`);
  console.log('');
  console.log(`${colors.cyan}${colors.bright}=========================================${colors.reset}`);
  console.log('');
}

/**
 * Função principal
 */
async function main() {
  // Processar argumentos
  const options = parseArgs();
  
  // Exibir ajuda se solicitado
  if (options.help) {
    showHelp();
    return;
  }
  
  // Exibir informações sobre os testes
  displayTestInfo(options);
  
  // Garantir que os diretórios existam
  await ensureDirectoryExists(options.outputDir);
  await ensureDirectoryExists(options.templateDir);
  
  // Configurar opções do runner de testes
  const runnerOptions = {
    outputDir: options.outputDir,
    templateDir: options.templateDir,
    iterations: options.iterations,
    generateHtmlReport: options.generateHtmlReport,
    testEdgeCases: options.testEdgeCases,
    compareRenderers: options.compareRenderers,
    regenerateTemplates: options.regenerateTemplates,
    logLevel: options.verbose ? 'verbose' : 'normal'
  };
  
  try {
    // Exibir banner de início
    console.log(`${colors.bright}${colors.green}Iniciando testes de carga do renderizador progressivo...${colors.reset}`);
    console.log('');
    
    // Inicializar e executar os testes
    const testRunner = new LoadTestRunner(runnerOptions);
    await testRunner.initialize();
    
    // Se a opção regenerar templates estiver ativa, remover templates existentes
    if (options.regenerateTemplates) {
      const files = await fs.readdir(options.templateDir);
      for (const file of files) {
        if (file.endsWith('.html')) {
          await fs.unlink(path.join(options.templateDir, file));
        }
      }
      console.log(`${colors.yellow}Templates removidos para regeração${colors.reset}`);
    }
    
    // Executar os testes
    const startTime = Date.now();
    console.log(`${colors.cyan}Testes iniciados em ${new Date().toLocaleTimeString()}${colors.reset}`);
    
    await testRunner.runAllTests();
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    // Exibir resumo dos resultados
    console.log('');
    console.log(`${colors.bright}${colors.green}Testes concluídos com sucesso!${colors.reset}`);
    console.log(`${colors.cyan}Duração total: ${duration} segundos${colors.reset}`);
    console.log(`${colors.cyan}Resultados salvos em: ${options.outputDir}${colors.reset}`);
    
    // Exibir caminho para o relatório HTML se gerado
    if (options.generateHtmlReport) {
      const htmlReportPath = path.join(options.outputDir, 'load-test-report.html');
      console.log(`${colors.cyan}Relatório HTML: ${htmlReportPath}${colors.reset}`);
    }
    
    console.log('');
  } catch (error) {
    console.error(`${colors.red}${colors.bright}Erro ao executar testes:${colors.reset} ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

// Executar script principal
main().catch(error => {
  console.error(`${colors.red}${colors.bright}Erro fatal:${colors.reset} ${error.message}`);
  console.error(error.stack);
  process.exit(1);
});
