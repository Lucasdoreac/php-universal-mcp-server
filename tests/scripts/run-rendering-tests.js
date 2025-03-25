#!/usr/bin/env node

/**
 * Script para execução de testes de integração do sistema avançado de renderização
 * 
 * Este script executa todos os testes de integração relacionados ao sistema
 * avançado de renderização, gera um relatório unificado e visualiza os resultados.
 * 
 * @author PHP Universal MCP Server Team
 * @version 1.0.0
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Diretórios
const PROJECT_ROOT = path.resolve(__dirname, '../..');
const TEST_DIR = path.join(PROJECT_ROOT, 'tests');
const OUTPUT_DIR = path.join(TEST_DIR, 'output');
const REPORT_DIR = path.join(OUTPUT_DIR, 'reports');

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
  }
};

// Garantir que os diretórios existam
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

if (!fs.existsSync(REPORT_DIR)) {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
}

// Cabeçalho
console.log('\n==============================================');
console.log('Sistema Avançado de Renderização - Testes de Integração');
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
  }
};

// Salvar informações do sistema
fs.writeFileSync(
  path.join(REPORT_DIR, 'system-info.json'), 
  JSON.stringify(systemInfo, null, 2)
);

// Executar testes
console.log('Executando testes de integração...\n');

// Registrar resultados
const results = {
  start: new Date().toISOString(),
  end: null,
  tests: {},
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    totalTime: 0
  }
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
      
      // Registrar resultado
      results.tests[testName] = {
        file: testFile,
        status: code === 0 ? 'passed' : 'failed',
        duration,
        output: output.trim(),
        errors: errors.trim()
      };
      
      // Atualizar sumário
      results.summary.total++;
      if (code === 0) {
        results.summary.passed++;
      } else {
        results.summary.failed++;
      }
      results.summary.totalTime += duration;
      
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

// Executar testes em sequência
const runTests = async () => {
  let failedTests = 0;
  
  for (const testFile of config.testFiles) {
    try {
      await runTest(testFile);
    } catch (error) {
      console.error(error.message);
      failedTests++;
    }
  }
  
  // Registrar fim
  results.end = new Date().toISOString();
  
  // Salvar relatório
  const reportPath = path.join(REPORT_DIR, `rendering-tests-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  
  // Resumo
  console.log('\n==============================================');
  console.log('Resumo dos Testes');
  console.log('==============================================');
  console.log(`Total de testes: ${results.summary.total}`);
  console.log(`Passou: ${results.summary.passed}`);
  console.log(`Falhou: ${results.summary.failed}`);
  console.log(`Pulou: ${results.summary.skipped}`);
  console.log(`Tempo total: ${(results.summary.totalTime/1000).toFixed(2)}s`);
  console.log('==============================================\n');
  
  // Gerar relatório HTML
  generateHtmlReport(results, reportPath);
  
  // Retornar código de saída baseado nos resultados
  return failedTests === 0 ? 0 : 1;
};

// Gerar relatório HTML
const generateHtmlReport = (results, jsonReportPath) => {
  const htmlReportPath = jsonReportPath.replace('.json', '.html');
  
  const htmlContent = `
<!DOCTYPE html>
<html lang="pt-br">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Relatório de Testes - Sistema Avançado de Renderização</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    header {
      border-bottom: 2px solid #eee;
      margin-bottom: 20px;
      padding-bottom: 10px;
    }
    h1 {
      color: #2c3e50;
    }
    .summary {
      background-color: #f8f9fa;
      padding: 15px;
      border-radius: 5px;
      margin-bottom: 20px;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 10px;
    }
    .summary-item {
      text-align: center;
      padding: 10px;
      border-radius: 5px;
    }
    .total { background-color: #e3f2fd; }
    .passed { background-color: #e8f5e9; }
    .failed { background-color: #ffebee; }
    .skipped { background-color: #fff8e1; }
    .time { background-color: #f3e5f5; }
    
    .test {
      margin-bottom: 15px;
      border: 1px solid #ddd;
      border-radius: 5px;
      overflow: hidden;
    }
    .test-header {
      display: flex;
      justify-content: space-between;
      padding: 10px;
      background-color: #f5f5f5;
      border-bottom: 1px solid #ddd;
      cursor: pointer;
    }
    .test-header.passed { background-color: #c8e6c9; }
    .test-header.failed { background-color: #ffcdd2; }
    .test-body {
      padding: 0;
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.3s ease-out;
    }
    .test-body.expanded {
      max-height: 500px;
      padding: 10px;
      overflow: auto;
    }
    .output {
      white-space: pre-wrap;
      font-family: monospace;
      font-size: 12px;
      background-color: #f8f9fa;
      padding: 10px;
      border-radius: 3px;
      overflow-x: auto;
    }
    .errors {
      white-space: pre-wrap;
      font-family: monospace;
      font-size: 12px;
      color: #d32f2f;
      background-color: #ffebee;
      padding: 10px;
      border-radius: 3px;
      margin-top: 10px;
      overflow-x: auto;
    }
    .system-info {
      margin-top: 20px;
      font-size: 14px;
      color: #666;
    }
  </style>
</head>
<body>
  <header>
    <h1>Relatório de Testes - Sistema Avançado de Renderização</h1>
    <p>
      Execução iniciada em: ${new Date(results.start).toLocaleString()}<br>
      Execução finalizada em: ${new Date(results.end).toLocaleString()}
    </p>
  </header>
  
  <div class="summary">
    <h2>Resumo</h2>
    <div class="summary-grid">
      <div class="summary-item total">
        <h3>Total</h3>
        <p>${results.summary.total}</p>
      </div>
      <div class="summary-item passed">
        <h3>Passou</h3>
        <p>${results.summary.passed}</p>
      </div>
      <div class="summary-item failed">
        <h3>Falhou</h3>
        <p>${results.summary.failed}</p>
      </div>
      <div class="summary-item skipped">
        <h3>Pulou</h3>
        <p>${results.summary.skipped}</p>
      </div>
      <div class="summary-item time">
        <h3>Tempo Total</h3>
        <p>${(results.summary.totalTime/1000).toFixed(2)}s</p>
      </div>
    </div>
  </div>
  
  <h2>Resultados Detalhados</h2>
  <div class="tests">
    ${Object.entries(results.tests).map(([testName, test]) => `
      <div class="test">
        <div class="test-header ${test.status}" onclick="toggleTest('${testName}')">
          <div><strong>${testName}</strong></div>
          <div>${test.status.toUpperCase()} (${(test.duration/1000).toFixed(2)}s)</div>
        </div>
        <div id="${testName}" class="test-body">
          <p><strong>Arquivo:</strong> ${test.file}</p>
          ${test.output ? `
            <h4>Saída:</h4>
            <div class="output">${test.output}</div>
          ` : ''}
          ${test.errors ? `
            <h4>Erros:</h4>
            <div class="errors">${test.errors}</div>
          ` : ''}
        </div>
      </div>
    `).join('')}
  </div>
  
  <div class="system-info">
    <h3>Informações do Sistema</h3>
    <p>
      Sistema operacional: ${systemInfo.os.type} ${systemInfo.os.release} (${systemInfo.os.platform}, ${systemInfo.os.arch})<br>
      Node.js: ${systemInfo.node}<br>
      CPU: ${systemInfo.cpu.model} (${systemInfo.cpu.cores} cores)<br>
      Memória: ${Math.round(systemInfo.memory.total / (1024 * 1024 * 1024))} GB total, ${Math.round(systemInfo.memory.free / (1024 * 1024 * 1024))} GB livre
    </p>
  </div>
  
  <script>
    function toggleTest(id) {
      const element = document.getElementById(id);
      element.classList.toggle('expanded');
    }
  </script>
</body>
</html>
  `;
  
  fs.writeFileSync(htmlReportPath, htmlContent);
  console.log(`Relatório HTML gerado: ${htmlReportPath}`);
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
