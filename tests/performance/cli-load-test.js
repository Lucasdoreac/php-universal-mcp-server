#!/usr/bin/env node

/**
 * CLI para Testes de Carga do PHP Universal MCP Server
 * 
 * Script de linha de comando para facilitar a execução de testes de carga em templates
 * extremamente grandes, com configurações personalizáveis e relatórios detalhados.
 * 
 * @author PHP Universal MCP Server Team
 * @version 1.0.0
 */

const path = require('path');
const fs = require('fs').promises;
const { program } = require('commander');
const ExtremeTemplateTestRunner = require('./extreme-template-test-runner');
const LoadTestRunner = require('./load-test-runner');
const LoadTestAnalyzer = require('./load-test-analyzer');

// Configurar sistema de logging colorido
const logger = {
  info: (...args) => console.log('\x1b[36m[INFO]\x1b[0m', ...args),
  debug: (...args) => console.log('\x1b[35m[DEBUG]\x1b[0m', ...args),
  error: (...args) => console.error('\x1b[31m[ERROR]\x1b[0m', ...args),
  success: (...args) => console.log('\x1b[32m[SUCCESS]\x1b[0m', ...args),
  warn: (...args) => console.warn('\x1b[33m[WARN]\x1b[0m', ...args),
  header: (title) => {
    const separator = '='.repeat(title.length + 10);
    console.log('\n\x1b[1m\x1b[33m%s\x1b[0m', separator);
    console.log('\x1b[1m\x1b[33m     %s     \x1b[0m', title);
    console.log('\x1b[1m\x1b[33m%s\x1b[0m\n', separator);
  }
};

// Configurar CLI com Commander
program
  .version('1.0.0')
  .description('CLI para testes de carga do PHP Universal MCP Server')
  .option('-m, --mode <mode>', 'Modo de teste (extreme, standard, analyze)', 'standard')
  .option('-t, --template <name>', 'Nome específico de template para testar')
  .option('-o, --output <dir>', 'Diretório de saída para resultados')
  .option('-i, --iterations <num>', 'Número de iterações para cada teste', parseInt, 3)
  .option('-f, --force-regenerate', 'Forçar regeneração de templates', false)
  .option('-v, --verbose', 'Saída detalhada', false)
  .option('-c, --compare', 'Comparar diferentes estratégias de renderização', true)
  .option('--memory-test', 'Executar testes específicos de consumo de memória', false)
  .option('--concurrency <num>', 'Número de execuções concorrentes para testes de carga', parseInt, 2)
  .option('--load-only', 'Apenas carregar e analisar resultados existentes sem executar novos testes', false)
  .parse(process.argv);

const options = program.opts();

/**
 * Cria o diretório de saída se não existir
 * @param {string} outputDir - Caminho do diretório de saída
 */
async function ensureOutputDirectory(outputDir) {
  try {
    await fs.mkdir(outputDir, { recursive: true });
    logger.debug(`Diretório de saída garantido: ${outputDir}`);
  } catch (error) {
    throw new Error(`Falha ao criar diretório de saída: ${error.message}`);
  }
}

/**
 * Executa testes de carga no modo padrão
 */
async function runStandardTests() {
  logger.header('TESTES DE CARGA - MODO PADRÃO');
  
  const outputDir = options.output || path.join(__dirname, 'test-results', `run-${Date.now()}`);
  await ensureOutputDirectory(outputDir);
  
  const testRunner = new LoadTestRunner({
    outputDir,
    iterations: options.iterations,
    compareRenderers: options.compare,
    templateDir: path.join(__dirname, 'generated-templates'),
    testEdgeCases: options.memoryTest,
    logMemoryUsage: options.verbose
  });
  
  try {
    await testRunner.initialize();
    
    if (options.template) {
      // Testar apenas um template específico
      await testRunner.testTemplatePerformance(`${options.template}.html`);
    } else {
      // Executar todos os testes
      await testRunner.runAllTests();
    }
    
    // Analisar resultados
    logger.header('ANÁLISE DE RESULTADOS');
    
    const analyzer = new LoadTestAnalyzer({
      inputDir: outputDir,
      outputDir: path.join(outputDir, 'analysis')
    });
    
    await analyzer.initialize();
    const analysis = await analyzer.analyzeResults();
    
    logger.success('Análise concluída. Consulte os relatórios em:');
    logger.info(`- ${path.join(outputDir, 'analysis', 'analysis-dashboard.html')}`);
    logger.info(`- ${path.join(outputDir, 'analysis', 'analysis-summary.md')}`);
    
    return analysis;
  } catch (error) {
    logger.error(`Falha nos testes de carga: ${error.message}`);
    if (options.verbose) {
      console.error(error);
    }
    throw error;
  }
}

/**
 * Executa testes de carga extremos
 */
async function runExtremeTests() {
  logger.header('TESTES DE CARGA - MODO EXTREMO');
  
  const outputDir = options.output || path.join(__dirname, 'extreme-test-results', `run-${Date.now()}`);
  await ensureOutputDirectory(outputDir);
  
  const testRunner = new ExtremeTemplateTestRunner({
    resultsDir: outputDir,
    forceRegenerate: options.forceRegenerate
  });
  
  try {
    await testRunner.initialize();
    
    if (options.template) {
      // Configuração para testar apenas um template específico
      const config = {
        name: options.template,
        templateSize: options.template.includes('monster') ? 2000 :
                      options.template.includes('ultra') ? 1000 : 500,
        iterations: options.iterations
      };
      
      await testRunner._runTestConfig(config);
    } else {
      // Executar todos os testes extremos
      await testRunner.runAllTests();
    }
    
    logger.success('Testes extremos concluídos. Consulte os relatórios em:');
    logger.info(`- ${path.join(outputDir, 'extreme-template-report.html')}`);
    logger.info(`- ${path.join(outputDir, 'extreme-template-report.md')}`);
    
    return testRunner.results;
  } catch (error) {
    logger.error(`Falha nos testes extremos: ${error.message}`);
    if (options.verbose) {
      console.error(error);
    }
    throw error;
  }
}

/**
 * Executa análise de resultados existentes
 */
async function analyzeExistingResults() {
  logger.header('ANÁLISE DE RESULTADOS EXISTENTES');
  
  const inputDir = options.output || path.join(__dirname, 'test-results');
  const outputDir = path.join(inputDir, 'analysis-rerun');
  
  await ensureOutputDirectory(outputDir);
  
  try {
    // Encontrar o relatório mais recente se não foi especificado
    let reportPath = null;
    
    if (options.template) {
      reportPath = path.join(inputDir, `${options.template}-result.json`);
    } else {
      // Procurar o arquivo full-report.json ou consolidated-results.json
      try {
        const fullReportPath = path.join(inputDir, 'full-report.json');
        await fs.access(fullReportPath);
        reportPath = fullReportPath;
      } catch {
        try {
          const consolidatedPath = path.join(inputDir, 'consolidated-results.json');
          await fs.access(consolidatedPath);
          reportPath = consolidatedPath;
        } catch {
          logger.warn('Não foi encontrado um relatório consolidado, buscando resultados individuais');
        }
      }
    }
    
    const analyzer = new LoadTestAnalyzer({
      inputDir,
      outputDir
    });
    
    await analyzer.initialize();
    
    if (reportPath) {
      await analyzer.loadResults(reportPath);
    } else {
      logger.warn('Carregando resultados individuais do diretório...');
      // Simular carregamento de resultados individuais
      const resultsObj = {};
      
      const files = await fs.readdir(inputDir);
      const resultFiles = files.filter(f => f.endsWith('-result.json'));
      
      if (resultFiles.length === 0) {
        throw new Error('Nenhum arquivo de resultado encontrado no diretório especificado');
      }
      
      for (const file of resultFiles) {
        try {
          const filePath = path.join(inputDir, file);
          const content = await fs.readFile(filePath, 'utf8');
          const result = JSON.parse(content);
          
          const templateName = file.replace('-result.json', '');
          resultsObj[templateName] = result;
        } catch (error) {
          logger.warn(`Erro ao carregar arquivo ${file}: ${error.message}`);
        }
      }
      
      analyzer.results = resultsObj;
    }
    
    const analysis = await analyzer.analyzeResults();
    
    logger.success('Análise concluída. Consulte os relatórios em:');
    logger.info(`- ${path.join(outputDir, 'analysis-dashboard.html')}`);
    logger.info(`- ${path.join(outputDir, 'analysis-summary.md')}`);
    
    return analysis;
  } catch (error) {
    logger.error(`Falha na análise dos resultados: ${error.message}`);
    if (options.verbose) {
      console.error(error);
    }
    throw error;
  }
}

/**
 * Função principal
 */
async function main() {
  try {
    // Exibir configuração
    if (options.verbose) {
      logger.debug('Configurações:');
      console.table(options);
    }
    
    // Se a opção --load-only estiver ativada, apenas carregar e analisar resultados existentes
    if (options.loadOnly) {
      await analyzeExistingResults();
      return;
    }
    
    // Executar modo de teste especificado
    switch (options.mode.toLowerCase()) {
      case 'extreme':
        await runExtremeTests();
        break;
      case 'analyze':
        await analyzeExistingResults();
        break;
      case 'standard':
      default:
        await runStandardTests();
        break;
    }
    
    logger.success('CLI de testes de carga executada com sucesso');
  } catch (error) {
    logger.error('Falha na execução da CLI:', error.message);
    process.exit(1);
  }
}

// Executar o programa
main();
