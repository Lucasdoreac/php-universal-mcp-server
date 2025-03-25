#!/usr/bin/env node

/**
 * Script Avançado para Execução de Testes de Integração do Sistema de Renderização
 * 
 * Este script executa testes de integração para o sistema avançado de renderização,
 * incluindo comparação com execuções anteriores, detecção de regressões e
 * geração de relatórios detalhados em múltiplos formatos.
 * 
 * Características:
 * - Execução de testes de integração em sequência ou paralelamente
 * - Coleta de métricas detalhadas de desempenho
 * - Comparação com resultados anteriores para detecção de regressões
 * - Geração de relatórios em múltiplos formatos (JSON, HTML, CSV)
 * - Visualizações interativas para análise rápida
 * - Exportação de histórico para acompanhamento de tendências
 * 
 * @author PHP Universal MCP Server Team
 * @version 2.0.0
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');

// Diretórios
const PROJECT_ROOT = path.resolve(__dirname, '../..');
const TEST_DIR = path.join(PROJECT_ROOT, 'tests');
const OUTPUT_DIR = path.join(TEST_DIR, 'output');
const REPORT_DIR = path.join(OUTPUT_DIR, 'reports');
const HISTORY_DIR = path.join(REPORT_DIR, 'history');
const COMPARISON_DIR = path.join(REPORT_DIR, 'comparison');

// Configurações
const config = {
  testFiles: [
    'tests/integration/renderers/advanced-rendering-system.test.js',
    'tests/integration/renderers/edge-case-optimizer-advanced.test.js',
    'tests/integration/renderers/smart-renderer.test.js',
    'tests/integration/renderers/streaming-renderer.test.js'
  ],
  mocha: {
    timeout: 120000, // 2 minutos por teste
    reporter: 'spec',
    colors: true
  },
  parallel: false, // Executar testes em paralelo (experimental)
  maxParallel: 2, // Número máximo de testes executados simultaneamente
  compareWithLastRun: true, // Comparar com a última execução
  historyLimit: 10, // Manter apenas as últimas N execuções
  reportFormats: ['json', 'html', 'csv'], // Formatos de relatório
  performanceThresholds: {
    warning: 10, // Alerta se o tempo aumentar mais de 10%
    critical: 25 // Crítico se o tempo aumentar mais de 25%
  }
};

// Garantir que os diretórios existam
[OUTPUT_DIR, REPORT_DIR, HISTORY_DIR, COMPARISON_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Cabeçalho
console.log('\n==============================================');
console.log('Sistema Avançado de Renderização - Testes de Integração v2.0');
console.log('==============================================\n');
console.log(`Data: ${new Date().toISOString()}`);
console.log(`Sistema: ${os.type()} ${os.release()} (${os.arch()})`);
console.log(`Node.js: ${process.version}`);
console.log('==============================================\n');

// Registrar informações do sistema
const systemInfo = {
  date: new Date().toISOString(),
  os: {
    type: os.type(),
    release: os.release(),
    platform: os.platform(),
    arch: os.arch()
  },
  node: process.version,
  cpu: {
    model: os.cpus()[0].model,
    cores: os.cpus().length
  },
  memory: {
    total: os.totalmem(),
    free: os.freemem()
  },
  config: {
    parallel: config.parallel,
    maxParallel: config.maxParallel,
    compareWithLastRun: config.compareWithLastRun
  }
};

// Salvar informações do sistema
fs.writeFileSync(
  path.join(REPORT_DIR, 'system-info.json'), 
  JSON.stringify(systemInfo, null, 2)
);

// Gerar ID único para esta execução
const runId = crypto.randomBytes(4).toString('hex');
const timestamp = Date.now();
const runTimestamp = new Date().toISOString().replace(/:/g, '-').replace(/\./g, '-');
const runIdentifier = `${runTimestamp}-${runId}`;

// Registrar resultados
const results = {
  runId,
  timestamp,
  start: new Date().toISOString(),
  end: null,
  tests: {},
  metrics: {},
  regressions: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    totalTime: 0,
    averageTime: 0,
    maxTime: 0,
    minTime: Infinity
  }
};

// Obter últimos resultados para comparação
const getLastResults = () => {
  try {
    const historyFiles = fs.readdirSync(HISTORY_DIR)
      .filter(file => file.endsWith('.json'))
      .sort((a, b) => {
        const timestampA = parseInt(a.split('-')[0]);
        const timestampB = parseInt(b.split('-')[0]);
        return timestampB - timestampA; // Ordem decrescente (mais recente primeiro)
      });

    if (historyFiles.length === 0) {
      return null;
    }

    const lastResultFile = path.join(HISTORY_DIR, historyFiles[0]);
    const lastResults = JSON.parse(fs.readFileSync(lastResultFile, 'utf8'));
    return lastResults;
  } catch (error) {
    console.warn(`Aviso: Não foi possível carregar resultados anteriores: ${error.message}`);
    return null;
  }
};

// Analisar performance para detectar regressões
const analyzePerformance = (currentResults, previousResults) => {
  if (!previousResults) {
    console.log('Não há resultados anteriores para comparação.');
    return;
  }

  const regressions = [];
  const improvements = [];

  Object.entries(currentResults.tests).forEach(([testName, currentTest]) => {
    if (previousResults.tests[testName]) {
      const previousTest = previousResults.tests[testName];
      const previousDuration = previousTest.duration;
      const currentDuration = currentTest.duration;
      const diff = currentDuration - previousDuration;
      const percentChange = (diff / previousDuration) * 100;

      const comparisonResult = {
        testName,
        current: currentDuration,
        previous: previousDuration,
        diff,
        percentChange
      };

      if (percentChange > config.performanceThresholds.critical) {
        comparisonResult.severity = 'critical';
        regressions.push(comparisonResult);
      } else if (percentChange > config.performanceThresholds.warning) {
        comparisonResult.severity = 'warning';
        regressions.push(comparisonResult);
      } else if (percentChange < -config.performanceThresholds.warning) {
        comparisonResult.type = 'improvement';
        comparisonResult.severity = 'significant';
        improvements.push(comparisonResult);
      }
    }
  });

  results.metrics.regressions = regressions;
  results.metrics.improvements = improvements;

  // Exibir resultados da comparação
  if (regressions.length > 0) {
    console.log('\n==============================================');
    console.log(`ATENÇÃO: ${regressions.length} regressões detectadas!`);
    console.log('==============================================');
    regressions.forEach(reg => {
      console.log(`${reg.testName}: ${reg.percentChange.toFixed(2)}% mais lento (${(reg.previous/1000).toFixed(2)}s → ${(reg.current/1000).toFixed(2)}s)`);
    });
  }

  if (improvements.length > 0) {
    console.log('\n==============================================');
    console.log(`${improvements.length} melhorias significativas detectadas!`);
    console.log('==============================================');
    improvements.forEach(imp => {
      console.log(`${imp.testName}: ${Math.abs(imp.percentChange).toFixed(2)}% mais rápido (${(imp.previous/1000).toFixed(2)}s → ${(imp.current/1000).toFixed(2)}s)`);
    });
  }

  return {
    regressions,
    improvements
  };
};

// Salvar histórico de execuções
const saveHistory = () => {
  // Salvar resultados atuais no histórico
  const historyFile = path.join(HISTORY_DIR, `${timestamp}-${runId}.json`);
  fs.writeFileSync(historyFile, JSON.stringify(results, null, 2));

  // Limitar histórico ao número definido em config.historyLimit
  const historyFiles = fs.readdirSync(HISTORY_DIR)
    .filter(file => file.endsWith('.json'))
    .sort((a, b) => {
      const timestampA = parseInt(a.split('-')[0]);
      const timestampB = parseInt(b.split('-')[0]);
      return timestampB - timestampA; // Ordem decrescente (mais recente primeiro)
    });

  if (historyFiles.length > config.historyLimit) {
    const filesToRemove = historyFiles.slice(config.historyLimit);
    filesToRemove.forEach(file => {
      fs.unlinkSync(path.join(HISTORY_DIR, file));
    });
  }

  console.log(`Histórico salvo: ${historyFile}`);
};

// Função para executar um arquivo de teste
const runTest = (testFile) => {
  return new Promise((resolve, reject) => {
    console.log(`\nExecutando: ${testFile}`);
    
    const testName = path.basename(testFile, '.js');
    const startTime = Date.now();
    
    // Preparar argumentos do Mocha
    const mochaArgs = [
      testFile,
      '--timeout', config.mocha.timeout.toString(),
      '--reporter', config.mocha.reporter,
      '--colors'
    ];
    
    // Executar Mocha
    const mochaProcess = spawn('npx', ['mocha', ...mochaArgs], {
      cwd: PROJECT_ROOT,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    
    let output = '';
    let errors = '';
    
    mochaProcess.stdout.on('data', (data) => {
      const chunk = data.toString();
      output += chunk;
      process.stdout.write(chunk);
    });
    
    mochaProcess.stderr.on('data', (data) => {
      const chunk = data.toString();
      errors += chunk;
      process.stderr.write(chunk);
    });
    
    mochaProcess.on('close', (code) => {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Extrair informações detalhadas dos testes
      const testDetails = parseTestOutput(output);
      
      // Registrar resultado
      results.tests[testName] = {
        file: testFile,
        status: code === 0 ? 'passed' : 'failed',
        duration,
        output: output.trim(),
        errors: errors.trim(),
        details: testDetails,
        timestamp: new Date().toISOString()
      };
      
      // Atualizar sumário
      results.summary.total++;
      if (code === 0) {
        results.summary.passed++;
      } else {
        results.summary.failed++;
      }
      results.summary.totalTime += duration;
      results.summary.minTime = Math.min(results.summary.minTime, duration);
      results.summary.maxTime = Math.max(results.summary.maxTime, duration);
      
      console.log(`\n${testName}: ${code === 0 ? 'PASSOU' : 'FALHOU'} (${(duration/1000).toFixed(2)}s)`);
      
      // Resolver ou rejeitar promessa
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Teste falhou: ${testName}`));
      }
    });
  });
};

// Analisar saída do teste para extrair detalhes
const parseTestOutput = (output) => {
  const details = {
    testCount: 0,
    passedTests: 0,
    failedTests: 0,
    skippedTests: 0,
    testCases: []
  };

  // Extrair resultados individuais dos testes
  const testRegex = /✓|✖|⚠️|✗|✔ (?:-|\()([^)]+)(?:-|\)): ([^\n]+)/g;
  let match;
  
  while ((match = testRegex.exec(output)) !== null) {
    const status = match[0].startsWith('✓') || match[0].startsWith('✔') ? 'passed' : 
                  match[0].startsWith('⚠️') ? 'skipped' : 'failed';
    const suite = match[1].trim();
    const name = match[2].trim();
    
    details.testCount++;
    if (status === 'passed') details.passedTests++;
    else if (status === 'failed') details.failedTests++;
    else if (status === 'skipped') details.skippedTests++;
    
    details.testCases.push({
      suite,
      name,
      status
    });
  }

  return details;
};

// Executar testes em sequência
const runTestsSequential = async () => {
  let failedTests = 0;
  
  for (const testFile of config.testFiles) {
    try {
      await runTest(testFile);
    } catch (error) {
      console.error(error.message);
      failedTests++;
    }
  }
  
  return failedTests;
};

// Executar testes em paralelo
const runTestsParallel = async () => {
  const chunks = [];
  for (let i = 0; i < config.testFiles.length; i += config.maxParallel) {
    chunks.push(config.testFiles.slice(i, i + config.maxParallel));
  }
  
  let failedTests = 0;
  
  for (const chunk of chunks) {
    const promises = chunk.map(testFile => 
      runTest(testFile).catch(error => {
        console.error(error.message);
        failedTests++;
      })
    );
    
    await Promise.all(promises);
  }
  
  return failedTests;
};

// Gerar relatório HTML
const generateHtmlReport = (results, comparisonResults) => {
  const htmlReportPath = path.join(REPORT_DIR, `rendering-tests-${runIdentifier}.html`);
  
  // Função para formatar duração legível
  const formatDuration = (ms) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms/1000).toFixed(2)}s`;
  };

  // Funções para determinar classes CSS com base no status
  const getStatusClass = (status) => {
    return status === 'passed' ? 'passed' : 
           status === 'skipped' ? 'skipped' : 'failed';
  };
  
  const getChangeBadge = (percentChange) => {
    if (!percentChange) return '';
    
    const abs = Math.abs(percentChange);
    let badgeClass = '';
    let icon = '';
    
    if (percentChange > 0) {
      // Pior desempenho (tempo maior)
      if (percentChange > config.performanceThresholds.critical) {
        badgeClass = 'badge-danger';
        icon = '&#x25B2;'; // Triângulo para cima
      } else if (percentChange > config.performanceThresholds.warning) {
        badgeClass = 'badge-warning';
        icon = '&#x25B2;';
      } else {
        badgeClass = 'badge-secondary';
        icon = '&#x25B2;';
      }
    } else {
      // Melhor desempenho (tempo menor)
      if (abs > config.performanceThresholds.critical) {
        badgeClass = 'badge-success';
        icon = '&#x25BC;'; // Triângulo para baixo
      } else if (abs > config.performanceThresholds.warning) {
        badgeClass = 'badge-success';
        icon = '&#x25BC;';
      } else {
        badgeClass = 'badge-info';
        icon = '&#x25BC;';
      }
    }
    
    return `<span class="badge ${badgeClass}">${icon} ${percentChange.toFixed(2)}%</span>`;
  };

  const htmlContent = `
<!DOCTYPE html>
<html lang="pt-br">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Relatório de Testes - Sistema Avançado de Renderização</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      padding: 30px;
      color: #333;
    }
    .header {
      border-bottom: 2px solid #eee;
      margin-bottom: 20px;
      padding-bottom: 10px;
    }
    .summary-container {
      margin-bottom: 30px;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-bottom: 20px;
    }
    .summary-item {
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      color: white;
      font-weight: bold;
    }
    .card-passed { background-color: #28a745; }
    .card-failed { background-color: #dc3545; }
    .card-skipped { background-color: #ffc107; color: #343a40; }
    .card-total { background-color: #17a2b8; }
    .card-time { background-color: #6f42c1; }
    
    .test {
      margin-bottom: 15px;
      border: 1px solid #ddd;
      border-radius: 8px;
      overflow: hidden;
    }
    .test-header {
      display: flex;
      justify-content: space-between;
      padding: 12px 15px;
      background-color: #f8f9fa;
      border-bottom: 1px solid #ddd;
      cursor: pointer;
    }
    .test-header.passed { background-color: #d4edda; }
    .test-header.failed { background-color: #f8d7da; }
    .test-body {
      padding: 0;
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.4s ease-out;
    }
    .test-body.expanded {
      max-height: 2000px;
      padding: 15px;
    }
    .test-metrics {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-bottom: 15px;
      padding: 10px;
      background-color: #f8f9fa;
      border-radius: 5px;
    }
    .test-metric {
      padding: 5px 10px;
      border-radius: 4px;
      font-size: 0.9rem;
      background-color: #e9ecef;
    }
    .output {
      white-space: pre-wrap;
      font-family: monospace;
      font-size: 12px;
      background-color: #f8f9fa;
      padding: 15px;
      border-radius: 5px;
      overflow-x: auto;
      max-height: 500px;
      overflow-y: auto;
    }
    .errors {
      white-space: pre-wrap;
      font-family: monospace;
      font-size: 12px;
      color: #d32f2f;
      background-color: #ffebee;
      padding: 15px;
      border-radius: 5px;
      margin-top: 15px;
      overflow-x: auto;
    }
    .badge {
      padding: 5px 8px;
      border-radius: 4px;
      font-weight: normal;
      margin-left: 8px;
    }
    .badge-success { background-color: #28a745; color: white; }
    .badge-danger { background-color: #dc3545; color: white; }
    .badge-warning { background-color: #ffc107; color: #343a40; }
    .badge-info { background-color: #17a2b8; color: white; }
    .badge-secondary { background-color: #6c757d; color: white; }
    
    .regression-section {
      margin-top: 30px;
      padding: 15px;
      border-radius: 8px;
      background-color: #ffe5e5;
      border: 1px solid #ffcccc;
    }
    .improvement-section {
      margin-top: 20px;
      padding: 15px;
      border-radius: 8px;
      background-color: #e5ffe5;
      border: 1px solid #ccffcc;
    }
    .tab-container {
      margin: 30px 0;
    }
    .tab-buttons {
      display: flex;
      gap: 10px;
      border-bottom: 1px solid #ddd;
      margin-bottom: 20px;
    }
    .tab-button {
      padding: 10px 15px;
      cursor: pointer;
      background-color: #f8f9fa;
      border: 1px solid #ddd;
      border-bottom: none;
      border-radius: 5px 5px 0 0;
    }
    .tab-button.active {
      background-color: white;
      border-bottom: 2px solid white;
      margin-bottom: -1px;
      font-weight: bold;
    }
    .tab-content {
      display: none;
      padding: 20px;
      border: 1px solid #ddd;
      border-top: none;
      border-radius: 0 0 5px 5px;
    }
    .tab-content.active {
      display: block;
    }
    .timeline {
      margin-top: 30px;
    }
    .test-case {
      padding: 8px 12px;
      margin: 5px 0;
      border-radius: 4px;
      font-size: 0.9rem;
    }
    .test-case.passed { background-color: #d4edda; }
    .test-case.failed { background-color: #f8d7da; }
    .test-case.skipped { background-color: #fff3cd; }
  </style>
</head>
<body>
  <div class="container-fluid">
    <header class="header">
      <h1>Relatório de Testes - Sistema Avançado de Renderização</h1>
      <p>
        <strong>Execução:</strong> ${runIdentifier}<br>
        <strong>Iniciada em:</strong> ${new Date(results.start).toLocaleString()}<br>
        <strong>Finalizada em:</strong> ${new Date(results.end).toLocaleString()}<br>
        <strong>Modo:</strong> ${config.parallel ? 'Paralelo' : 'Sequencial'}${config.parallel ? ` (máx. ${config.maxParallel} simultâneos)` : ''}
      </p>
    </header>
    
    <div class="tab-container">
      <div class="tab-buttons">
        <div class="tab-button active" onclick="switchTab('summary-tab')">Resumo</div>
        <div class="tab-button" onclick="switchTab('tests-tab')">Testes Detalhados</div>
        <div class="tab-button" onclick="switchTab('performance-tab')">Performance</div>
        <div class="tab-button" onclick="switchTab('system-tab')">Informações do Sistema</div>
      </div>
      
      <div id="summary-tab" class="tab-content active">
        <div class="summary-container">
          <h2>Resumo</h2>
          <div class="summary-grid">
            <div class="summary-item card-total">
              <h3>Total de Testes</h3>
              <h1>${results.summary.total}</h1>
            </div>
            <div class="summary-item card-passed">
              <h3>Passou</h3>
              <h1>${results.summary.passed}</h1>
            </div>
            <div class="summary-item card-failed">
              <h3>Falhou</h3>
              <h1>${results.summary.failed}</h1>
            </div>
            <div class="summary-item card-skipped">
              <h3>Pulou</h3>
              <h1>${results.summary.skipped}</h1>
            </div>
            <div class="summary-item card-time">
              <h3>Tempo Total</h3>
              <h1>${formatDuration(results.summary.totalTime)}</h1>
            </div>
          </div>
          
          <table class="table table-striped table-bordered">
            <thead>
              <tr>
                <th>Métrica</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Tempo Médio por Teste</td>
                <td>${formatDuration(results.summary.averageTime)}</td>
              </tr>
              <tr>
                <td>Teste Mais Rápido</td>
                <td>${formatDuration(results.summary.minTime)}</td>
              </tr>
              <tr>
                <td>Teste Mais Lento</td>
                <td>${formatDuration(results.summary.maxTime)}</td>
              </tr>
              <tr>
                <td>Taxa de Sucesso</td>
                <td>${(results.summary.passed / results.summary.total * 100).toFixed(2)}%</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        ${results.metrics.regressions && results.metrics.regressions.length > 0 ? `
        <div class="regression-section">
          <h3>⚠️ Regressões Detectadas (${results.metrics.regressions.length})</h3>
          <div class="table-responsive">
            <table class="table table-sm">
              <thead>
                <tr>
                  <th>Teste</th>
                  <th>Anterior</th>
                  <th>Atual</th>
                  <th>Diferença</th>
                  <th>Mudança</th>
                  <th>Severidade</th>
                </tr>
              </thead>
              <tbody>
                ${results.metrics.regressions.map(reg => `
                <tr>
                  <td>${reg.testName}</td>
                  <td>${formatDuration(reg.previous)}</td>
                  <td>${formatDuration(reg.current)}</td>
                  <td>${formatDuration(reg.diff)}</td>
                  <td>${getChangeBadge(reg.percentChange)}</td>
                  <td>${reg.severity === 'critical' ? 
                    '<span class="badge badge-danger">Crítica</span>' : 
                    '<span class="badge badge-warning">Alerta</span>'}</td>
                </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
        ` : ''}
        
        ${results.metrics.improvements && results.metrics.improvements.length > 0 ? `
        <div class="improvement-section">
          <h3>✅ Melhorias Detectadas (${results.metrics.improvements.length})</h3>
          <div class="table-responsive">
            <table class="table table-sm">
              <thead>
                <tr>
                  <th>Teste</th>
                  <th>Anterior</th>
                  <th>Atual</th>
                  <th>Diferença</th>
                  <th>Mudança</th>
                </tr>
              </thead>
              <tbody>
                ${results.metrics.improvements.map(imp => `
                <tr>
                  <td>${imp.testName}</td>
                  <td>${formatDuration(imp.previous)}</td>
                  <td>${formatDuration(imp.current)}</td>
                  <td>${formatDuration(imp.diff)}</td>
                  <td>${getChangeBadge(imp.percentChange)}</td>
                </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
        ` : ''}
      </div>
      
      <div id="tests-tab" class="tab-content">
        <h2>Resultados Detalhados</h2>
        <div class="tests">
          ${Object.entries(results.tests).map(([testName, test]) => `
            <div class="test">
              <div class="test-header ${getStatusClass(test.status)}" onclick="toggleTest('${testName}')">
                <div>
                  <strong>${testName}</strong>
                  ${test.details && test.details.testCount ? 
                    `<span class="badge badge-secondary">${test.details.testCount} cases</span>` : ''}
                </div>
                <div>
                  <span class="badge ${test.status === 'passed' ? 'badge-success' : 'badge-danger'}">${test.status.toUpperCase()}</span>
                  <span class="badge badge-secondary">${formatDuration(test.duration)}</span>
                  ${comparisonResults && comparisonResults.testComparisons && comparisonResults.testComparisons[testName] ? 
                    getChangeBadge(comparisonResults.testComparisons[testName].percentChange) : ''}
                </div>
              </div>
              <div id="${testName}" class="test-body">
                <div class="test-metrics">
                  <div class="test-metric"><strong>Arquivo:</strong> ${test.file}</div>
                  <div class="test-metric"><strong>Duração:</strong> ${formatDuration(test.duration)}</div>
                  <div class="test-metric"><strong>Status:</strong> ${test.status}</div>
                  ${test.details && test.details.passedTests !== undefined ? 
                    `<div class="test-metric"><strong>Passou:</strong> ${test.details.passedTests}</div>` : ''}
                  ${test.details && test.details.failedTests !== undefined ? 
                    `<div class="test-metric"><strong>Falhou:</strong> ${test.details.failedTests}</div>` : ''}
                  ${test.details && test.details.skippedTests !== undefined ? 
                    `<div class="test-metric"><strong>Pulou:</strong> ${test.details.skippedTests}</div>` : ''}
                </div>
                
                ${test.details && test.details.testCases && test.details.testCases.length > 0 ? `
                <div class="timeline">
                  <h4>Casos de Teste</h4>
                  ${test.details.testCases.map(tc => `
                    <div class="test-case ${tc.status}">
                      <strong>${tc.suite}</strong> - ${tc.name}
                    </div>
                  `).join('')}
                </div>
                ` : ''}
                
                ${test.output ? `
                  <h4>Saída:</h4>
                  <div class="output">${test.output.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
                ` : ''}
                
                ${test.errors ? `
                  <h4>Erros:</h4>
                  <div class="errors">${test.errors.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
                ` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      
      <div id="performance-tab" class="tab-content">
        <h2>Análise de Performance</h2>
        
        <div class="chart-container" style="position: relative; height:400px; width:100%">
          <canvas id="performanceChart"></canvas>
        </div>
        
        <div class="table-responsive mt-4">
          <table class="table table-striped table-bordered">
            <thead>
              <tr>
                <th>Teste</th>
                <th>Duração</th>
                <th>% do Total</th>
                ${comparisonResults ? '<th>Comparação</th>' : ''}
              </tr>
            </thead>
            <tbody>
              ${Object.entries(results.tests).map(([testName, test]) => `
              <tr>
                <td>${testName}</td>
                <td>${formatDuration(test.duration)}</td>
                <td>${(test.duration / results.summary.totalTime * 100).toFixed(2)}%</td>
                ${comparisonResults && comparisonResults.testComparisons && comparisonResults.testComparisons[testName] ? 
                  `<td>${getChangeBadge(comparisonResults.testComparisons[testName].percentChange)}</td>` : 
                  comparisonResults ? '<td>-</td>' : ''}
              </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
      
      <div id="system-tab" class="tab-content">
        <h2>Informações do Sistema</h2>
        
        <div class="card mb-4">
          <div class="card-header">
            Ambiente de Execução
          </div>
          <div class="card-body">
            <table class="table table-sm">
              <tbody>
                <tr>
                  <th>Sistema operacional</th>
                  <td>${systemInfo.os.type} ${systemInfo.os.release} (${systemInfo.os.platform}, ${systemInfo.os.arch})</td>
                </tr>
                <tr>
                  <th>Node.js</th>
                  <td>${systemInfo.node}</td>
                </tr>
                <tr>
                  <th>CPU</th>
                  <td>${systemInfo.cpu.model} (${systemInfo.cpu.cores} cores)</td>
                </tr>
                <tr>
                  <th>Memória</th>
                  <td>${Math.round(systemInfo.memory.total / (1024 * 1024 * 1024))} GB total, ${Math.round(systemInfo.memory.free / (1024 * 1024 * 1024))} GB livre</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <div class="card">
          <div class="card-header">
            Configurações de Teste
          </div>
          <div class="card-body">
            <table class="table table-sm">
              <tbody>
                <tr>
                  <th>Modo de execução</th>
                  <td>${config.parallel ? 'Paralelo' : 'Sequencial'}</td>
                </tr>
                ${config.parallel ? `
                <tr>
                  <th>Máximo de testes paralelos</th>
                  <td>${config.maxParallel}</td>
                </tr>
                ` : ''}
                <tr>
                  <th>Timeout por teste</th>
                  <td>${formatDuration(config.mocha.timeout)}</td>
                </tr>
                <tr>
                  <th>Comparação com execução anterior</th>
                  <td>${config.compareWithLastRun ? 'Ativada' : 'Desativada'}</td>
                </tr>
                <tr>
                  <th>Limites de alerta de regressão</th>
                  <td>Aviso: ${config.performanceThresholds.warning}%, Crítico: ${config.performanceThresholds.critical}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <script>
    function toggleTest(id) {
      const element = document.getElementById(id);
      element.classList.toggle('expanded');
    }
    
    function switchTab(tabId) {
      // Desativar todas as tabs
      document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
      });
      
      document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
      });
      
      // Ativar a tab clicada
      document.getElementById(tabId).classList.add('active');
      document.querySelector(`.tab-button[onclick="switchTab('${tabId}')"]`).classList.add('active');
    }
    
    // Inicializar gráfico de performance
    document.addEventListener('DOMContentLoaded', function() {
      const ctx = document.getElementById('performanceChart').getContext('2d');
      
      const testNames = ${JSON.stringify(Object.keys(results.tests))};
      const durations = ${JSON.stringify(Object.values(results.tests).map(test => test.duration / 1000))};
      
      ${comparisonResults && comparisonResults.testComparisons ? `
      const previousDurations = ${JSON.stringify(Object.values(results.tests).map(test => {
        const comparison = comparisonResults.testComparisons[Object.keys(results.tests).find(name => results.tests[name] === test)];
        return comparison ? comparison.previous / 1000 : null;
      }))};
      ` : ''}
      
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: testNames,
          datasets: [
            {
              label: 'Duração Atual (s)',
              backgroundColor: 'rgba(54, 162, 235, 0.8)',
              data: durations
            }
            ${comparisonResults && comparisonResults.testComparisons ? `,
            {
              label: 'Duração Anterior (s)',
              backgroundColor: 'rgba(255, 99, 132, 0.8)',
              data: previousDurations
            }
            ` : ''}
          ]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'top',
            },
            title: {
              display: true,
              text: 'Duração dos Testes (segundos)'
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Duração (segundos)'
              }
            }
          }
        }
      });
    });
  </script>
</body>
</html>
  `;
  
  fs.writeFileSync(htmlReportPath, htmlContent);
  console.log(`Relatório HTML gerado: ${htmlReportPath}`);
  return htmlReportPath;
};

// Gerar relatório CSV
const generateCsvReport = (results) => {
  const csvReportPath = path.join(REPORT_DIR, `rendering-tests-${runIdentifier}.csv`);
  
  // Cabeçalho do CSV
  let csvContent = 'Test Name,Status,Duration (ms),Duration (s),File,Passed Cases,Failed Cases,Skipped Cases,Total Cases\n';
  
  // Linhas de dados
  Object.entries(results.tests).forEach(([testName, test]) => {
    csvContent += [
      testName,
      test.status,
      test.duration,
      (test.duration / 1000).toFixed(2),
      test.file,
      test.details?.passedTests || 0,
      test.details?.failedTests || 0,
      test.details?.skippedTests || 0,
      test.details?.testCount || 0
    ].join(',') + '\n';
  });
  
  // Adicionar linha de sumário
  csvContent += `\nSummary,${results.summary.passed}/${results.summary.total} passed,${results.summary.totalTime},${(results.summary.totalTime / 1000).toFixed(2)},,,,`;
  
  fs.writeFileSync(csvReportPath, csvContent);
  console.log(`Relatório CSV gerado: ${csvReportPath}`);
  return csvReportPath;
};

// Executar testes e gerar relatórios
const runTests = async () => {
  console.log(`Iniciando execução de testes em modo ${config.parallel ? 'paralelo' : 'sequencial'}...`);
  
  const failedTests = config.parallel ? 
    await runTestsParallel() : 
    await runTestsSequential();
  
  // Calcular métricas adicionais
  results.end = new Date().toISOString();
  results.summary.averageTime = results.summary.total > 0 ? 
    results.summary.totalTime / results.summary.total : 0;
  
  // Ajustar valor mínimo (caso não tenha sido definido por não ter testes)
  if (results.summary.minTime === Infinity) {
    results.summary.minTime = 0;
  }
  
  // Salvar relatório JSON
  const jsonReportPath = path.join(REPORT_DIR, `rendering-tests-${runIdentifier}.json`);
  fs.writeFileSync(jsonReportPath, JSON.stringify(results, null, 2));
  console.log(`Relatório JSON gerado: ${jsonReportPath}`);
  
  // Comparar com execução anterior, se configurado
  let comparisonResults = null;
  if (config.compareWithLastRun) {
    const lastResults = getLastResults();
    if (lastResults) {
      console.log('\nComparando com execução anterior...');
      comparisonResults = {
        testComparisons: {}
      };
      
      // Comparar cada teste
      Object.entries(results.tests).forEach(([testName, currentTest]) => {
        if (lastResults.tests[testName]) {
          const previousTest = lastResults.tests[testName];
          const previousDuration = previousTest.duration;
          const currentDuration = currentTest.duration;
          const diff = currentDuration - previousDuration;
          const percentChange = (diff / previousDuration) * 100;
          
          comparisonResults.testComparisons[testName] = {
            current: currentDuration,
            previous: previousDuration,
            diff,
            percentChange
          };
        }
      });
      
      // Analisar performance e detectar regressões
      const performanceResults = analyzePerformance(results, lastResults);
      
      // Salvar comparação
      const comparisonPath = path.join(COMPARISON_DIR, `comparison-${runIdentifier}.json`);
      fs.writeFileSync(comparisonPath, JSON.stringify({
        currentRun: runIdentifier,
        previousRun: lastResults.runId,
        comparisons: comparisonResults.testComparisons,
        regressions: performanceResults?.regressions || [],
        improvements: performanceResults?.improvements || []
      }, null, 2));
    }
  }
  
  // Gerar relatórios em formatos diferentes
  if (config.reportFormats.includes('html')) {
    generateHtmlReport(results, comparisonResults);
  }
  
  if (config.reportFormats.includes('csv')) {
    generateCsvReport(results);
  }
  
  // Salvar no histórico
  saveHistory();
  
  // Resumo
  console.log('\n==============================================');
  console.log('Resumo dos Testes');
  console.log('==============================================');
  console.log(`Total de testes: ${results.summary.total}`);
  console.log(`Passou: ${results.summary.passed}`);
  console.log(`Falhou: ${results.summary.failed}`);
  console.log(`Pulou: ${results.summary.skipped}`);
  console.log(`Tempo total: ${(results.summary.totalTime/1000).toFixed(2)}s`);
  console.log(`Tempo médio: ${(results.summary.averageTime/1000).toFixed(2)}s`);
  console.log('==============================================\n');
  
  // Relatórios gerados
  console.log('Relatórios gerados:');
  console.log(`- JSON: ${jsonReportPath}`);
  if (config.reportFormats.includes('html')) {
    console.log(`- HTML: ${path.join(REPORT_DIR, `rendering-tests-${runIdentifier}.html`)}`);
  }
  if (config.reportFormats.includes('csv')) {
    console.log(`- CSV: ${path.join(REPORT_DIR, `rendering-tests-${runIdentifier}.csv`)}`);
  }
  console.log('==============================================\n');
  
  return failedTests === 0 ? 0 : 1;
};

// Executar testes e sair com código apropriado
runTests()
  .then(exitCode => {
    process.exit(exitCode);
  })
  .catch(error => {
    console.error('Erro ao executar testes:', error);
    process.exit(1);
  });
