#!/usr/bin/env node

/**
 * Script unificado para execução de testes completos do Sistema Avançado de Renderização
 * 
 * Este script executa todos os testes de integração e end-to-end do sistema avançado
 * de renderização, verificando não apenas componentes individuais, mas também
 * sua integração e funcionamento conjunto.
 * 
 * @author PHP Universal MCP Server Team
 * @version 1.0.0
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Diretórios
const PROJECT_ROOT = path.resolve(__dirname, '../../..');
const TEST_DIR = path.join(PROJECT_ROOT, 'tests');
const INTEGRATION_DIR = path.join(TEST_DIR, 'integration');
const RENDERERS_DIR = path.join(INTEGRATION_DIR, 'renderers');
const OUTPUT_DIR = path.join(TEST_DIR, 'output');
const REPORT_DIR = path.join(OUTPUT_DIR, 'reports');
const METRICS_DIR = path.join(OUTPUT_DIR, 'metrics');

// Caminhos para módulos importantes
const MODULES_DIR = path.join(PROJECT_ROOT, 'modules');
const DESIGN_DIR = path.join(MODULES_DIR, 'design');
const RENDERERS_MODULE_DIR = path.join(DESIGN_DIR, 'renderers');

// Configurações
const config = {
  // Testes de componentes individuais
  componentTests: [
    {
      name: 'AdvancedEdgeCaseOptimizer',
      file: path.join(RENDERERS_DIR, 'edge-case-optimizer-advanced.test.js'),
      module: path.join(RENDERERS_MODULE_DIR, 'edge-case-optimizer-advanced.js')
    },
    {
      name: 'StreamingRenderer',
      file: path.join(RENDERERS_DIR, 'streaming-renderer.test.js'),
      module: path.join(RENDERERS_MODULE_DIR, 'streaming-renderer.js')
    },
    {
      name: 'SmartRenderer',
      file: path.join(RENDERERS_DIR, 'smart-renderer.test.js'),
      module: path.join(RENDERERS_MODULE_DIR, 'smart-renderer.js')
    }
  ],
  
  // Teste do sistema completo
  systemTest: {
    name: 'AdvancedRenderingSystem',
    file: path.join(RENDERERS_DIR, 'advanced-rendering-system.test.js')
  },
  
  // Configurações do Mocha
  mocha: {
    timeout: 180000, // 3 minutos por teste
    reporter: 'spec',
    colors: true
  },
  
  // Métricas a serem coletadas
  metrics: {
    memoryUsage: true,
    cpuUsage: true,
    renderTime: true,
    bandwidthSavings: true
  },
  
  // Configurações de templates de teste
  templates: {
    small: 'templates/test/small.html',
    medium: 'templates/test/medium.html',
    large: 'templates/test/large.html',
    complex: 'templates/test/complex.html',
    extreme: 'templates/test/extreme.html'
  }
};

// Garantir que os diretórios existam
[OUTPUT_DIR, REPORT_DIR, METRICS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Cabeçalho
console.log('\n======================================================');
console.log('Sistema Avançado de Renderização - Testes de Integração');
console.log('======================================================\n');
console.log(`Data: ${new Date().toISOString()}`);
console.log(`Sistema: ${os.type()} ${os.release()} (${os.arch()})`);
console.log(`Node.js: ${process.version}`);
console.log('======================================================\n');

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

// Estrutura de resultados
const results = {
  start: new Date().toISOString(),
  end: null,
  components: {},
  system: null,
  integrationMatrix: {},
  performance: {},
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    totalTime: 0
  }
};

// Função para executar um teste
const runTest = (testConfig) => {
  return new Promise((resolve, reject) => {
    console.log(`\n${'-'.repeat(40)}`);
    console.log(`Executando: ${testConfig.name}`);
    console.log(`Arquivo: ${testConfig.file}`);
    console.log(`${'-'.repeat(40)}`);
    
    const startTime = Date.now();
    const startMem = process.memoryUsage();
    
    // Preparar argumentos do Mocha
    const mochaArgs = [
      testConfig.file,
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
      const endMem = process.memoryUsage();
      const duration = endTime - startTime;
      
      // Extrair métricas de desempenho do resultado
      const perfMetrics = extractPerformanceMetrics(output);
      
      // Registrar resultado
      const testResult = {
        name: testConfig.name,
        file: testConfig.file,
        status: code === 0 ? 'passed' : 'failed',
        duration,
        output: output.trim(),
        errors: errors.trim(),
        memoryDelta: {
          rss: endMem.rss - startMem.rss,
          heapTotal: endMem.heapTotal - startMem.heapTotal,
          heapUsed: endMem.heapUsed - startMem.heapUsed,
          external: endMem.external - startMem.external
        },
        metrics: perfMetrics
      };
      
      // Atualizar resultados do teste específico
      if (testConfig.name === config.systemTest.name) {
        results.system = testResult;
      } else {
        results.components[testConfig.name] = testResult;
      }
      
      // Atualizar sumário
      results.summary.total++;
      if (code === 0) {
        results.summary.passed++;
      } else {
        results.summary.failed++;
      }
      results.summary.totalTime += duration;
      
      console.log(`\n${testConfig.name}: ${code === 0 ? 'PASSOU' : 'FALHOU'} (${(duration/1000).toFixed(2)}s)`);
      
      // Resolver ou rejeitar promessa
      if (code === 0) {
        resolve(testResult);
      } else {
        // Mesmo em caso de falha, retornamos o resultado para análise
        resolve(testResult);
      }
    });
  });
};

// Extrair métricas de desempenho da saída do teste
const extractPerformanceMetrics = (output) => {
  const metrics = {
    renderTimes: {},
    memoryUsage: {},
    optimizationStats: {}
  };
  
  // Expressões regulares para extrair métricas da saída
  const regexPatterns = {
    renderTime: /Render time for ([a-z]+) template: (\d+\.?\d*)ms/gi,
    memoryUsage: /Memory usage for ([a-z]+) template: (\d+\.?\d*) MB/gi,
    optimizationStat: /Optimization ([a-z]+): (\d+\.?\d*)%/gi
  };
  
  // Extrair tempos de renderização
  let match;
  while ((match = regexPatterns.renderTime.exec(output)) !== null) {
    const template = match[1];
    const time = parseFloat(match[2]);
    metrics.renderTimes[template] = time;
  }
  
  // Extrair uso de memória
  while ((match = regexPatterns.memoryUsage.exec(output)) !== null) {
    const template = match[1];
    const memory = parseFloat(match[2]);
    metrics.memoryUsage[template] = memory;
  }
  
  // Extrair estatísticas de otimização
  while ((match = regexPatterns.optimizationStat.exec(output)) !== null) {
    const stat = match[1];
    const value = parseFloat(match[2]);
    metrics.optimizationStats[stat] = value;
  }
  
  return metrics;
};

// Função para avaliar integração entre componentes
const evaluateIntegration = (componentResults) => {
  // Matriz de integração para verificar compatibilidade entre componentes
  const components = Object.keys(componentResults);
  const integrationMatrix = {};
  
  // Algoritmo simples para avaliar integração
  for (const c1 of components) {
    integrationMatrix[c1] = {};
    
    for (const c2 of components) {
      if (c1 === c2) {
        // Componente com ele mesmo sempre é compatível
        integrationMatrix[c1][c2] = {
          compatible: true,
          score: 1.0,
          reason: 'Componente identico'
        };
        continue;
      }
      
      // Verificar se ambos os testes passaram
      const bothPassed = componentResults[c1].status === 'passed' && 
                          componentResults[c2].status === 'passed';
      
      // Componentes com falha não são compatíveis
      if (!bothPassed) {
        integrationMatrix[c1][c2] = {
          compatible: false,
          score: 0.0,
          reason: 'Um ou ambos os componentes falharam nos testes'
        };
        continue;
      }
      
      // Comparar métricas de desempenho
      // (Simplificado - em produção, usaria uma análise mais complexa)
      let compatibilityScore = 0.85; // Compatibilidade base para testes que passaram
      
      // Smart Renderer deve ser compatível com todos os outros renderizadores
      if (c1 === 'SmartRenderer' || c2 === 'SmartRenderer') {
        compatibilityScore = 0.95;
      }
      
      // Advanced Edge Case Optimizer deve aumentar performance de todos
      if (c1 === 'AdvancedEdgeCaseOptimizer' || c2 === 'AdvancedEdgeCaseOptimizer') {
        compatibilityScore = Math.min(compatibilityScore + 0.1, 1.0);
      }
      
      integrationMatrix[c1][c2] = {
        compatible: true,
        score: compatibilityScore,
        reason: 'Componentes compatíveis baseado em testes individuais'
      };
    }
  }
  
  return integrationMatrix;
};

// Função para executar análise de performance comparativa
const analyzePerformance = (componentResults, systemResult) => {
  const performance = {
    comparison: {},
    systemVsComponents: {},
    recommendations: []
  };
  
  // Comparar métricas entre componentes
  const components = Object.keys(componentResults);
  
  // Comparar tempos de renderização
  for (const template of Object.keys(config.templates)) {
    performance.comparison[template] = {};
    
    for (const component of components) {
      const result = componentResults[component];
      if (result.metrics && result.metrics.renderTimes && result.metrics.renderTimes[template]) {
        performance.comparison[template][component] = result.metrics.renderTimes[template];
      }
    }
  }
  
  // Comparar sistema versus componentes individuais
  if (systemResult && systemResult.metrics) {
    // Verificar se a soma dos componentes é mais rápida que o sistema integrado
    for (const template of Object.keys(config.templates)) {
      if (systemResult.metrics.renderTimes && systemResult.metrics.renderTimes[template]) {
        const systemTime = systemResult.metrics.renderTimes[template];
        let componentsTime = 0;
        
        for (const component of components) {
          const result = componentResults[component];
          if (result.metrics && result.metrics.renderTimes && result.metrics.renderTimes[template]) {
            componentsTime += result.metrics.renderTimes[template];
          }
        }
        
        // Registrar a eficiência do sistema integrado
        // (se menor que 1, o sistema integrado é mais eficiente que a soma)
        performance.systemVsComponents[template] = systemTime / Math.max(componentsTime, 1);
        
        // Adicionar recomendações baseadas na análise
        if (performance.systemVsComponents[template] < 0.8) {
          performance.recommendations.push(
            `Sistema integrado é significativamente mais eficiente para template '${template}'`
          );
        } else if (performance.systemVsComponents[template] > 1.2) {
          performance.recommendations.push(
            `Sistema integrado é menos eficiente para template '${template}' - verificar sobrecargas de integração`
          );
        }
      }
    }
  }
  
  // Identificar o melhor componente para cada tipo de template
  for (const template of Object.keys(config.templates)) {
    if (performance.comparison[template]) {
      const comp = performance.comparison[template];
      const times = Object.values(comp).filter(t => typeof t === 'number');
      
      if (times.length > 0) {
        const minTime = Math.min(...times);
        const bestComponent = Object.keys(comp).find(c => comp[c] === minTime);
        
        if (bestComponent) {
          performance.recommendations.push(
            `${bestComponent} é o mais eficiente para template '${template}' (${minTime.toFixed(2)}ms)`
          );
        }
      }
    }
  }
  
  return performance;
};

// Gerar relatório HTML
const generateHtmlReport = (results, reportPath) => {
  const htmlReportPath = reportPath.replace('.json', '.html');
  
  const componentRows = Object.entries(results.components).map(([name, result]) => `
    <tr class="${result.status}">
      <td>${name}</td>
      <td>${result.status.toUpperCase()}</td>
      <td>${(result.duration/1000).toFixed(2)}s</td>
      <td>${(result.memoryDelta.heapUsed / (1024 * 1024)).toFixed(2)} MB</td>
      <td><button onclick="toggleDetails('${name}')">Detalhes</button></td>
    </tr>
    <tr id="${name}-details" class="details-row">
      <td colspan="5">
        <div class="details-content">
          <h4>Métricas:</h4>
          <pre>${JSON.stringify(result.metrics, null, 2)}</pre>
          ${result.errors ? `<h4>Erros:</h4><pre class="errors">${result.errors}</pre>` : ''}
        </div>
      </td>
    </tr>
  `).join('');
  
  const systemRow = results.system ? `
    <tr class="${results.system.status}">
      <td>${results.system.name}</td>
      <td>${results.system.status.toUpperCase()}</td>
      <td>${(results.system.duration/1000).toFixed(2)}s</td>
      <td>${(results.system.memoryDelta.heapUsed / (1024 * 1024)).toFixed(2)} MB</td>
      <td><button onclick="toggleDetails('system')">Detalhes</button></td>
    </tr>
    <tr id="system-details" class="details-row">
      <td colspan="5">
        <div class="details-content">
          <h4>Métricas:</h4>
          <pre>${JSON.stringify(results.system.metrics, null, 2)}</pre>
          ${results.system.errors ? `<h4>Erros:</h4><pre class="errors">${results.system.errors}</pre>` : ''}
        </div>
      </td>
    </tr>
  ` : '';
  
  const integrationMatrix = Object.keys(results.integrationMatrix).length > 0 ? `
    <h3>Matriz de Integração</h3>
    <table class="integration-matrix">
      <tr>
        <th></th>
        ${Object.keys(results.integrationMatrix).map(c => `<th>${c}</th>`).join('')}
      </tr>
      ${Object.entries(results.integrationMatrix).map(([c1, row]) => `
        <tr>
          <th>${c1}</th>
          ${Object.entries(row).map(([c2, result]) => `
            <td class="${result.compatible ? 'compatible' : 'incompatible'}" 
                title="${result.reason}">
              ${(result.score * 100).toFixed(0)}%
            </td>
          `).join('')}
        </tr>
      `).join('')}
    </table>
  ` : '';
  
  const performanceRecommendations = results.performance.recommendations && 
    results.performance.recommendations.length > 0 ? `
    <h3>Recomendações de Performance</h3>
    <ul>
      ${results.performance.recommendations.map(rec => `<li>${rec}</li>`).join('')}
    </ul>
  ` : '';
  
  const perfComparison = results.performance.comparison ? `
    <h3>Comparação de Performance por Template</h3>
    <table class="performance-table">
      <tr>
        <th>Template</th>
        ${Object.keys(results.components).map(c => `<th>${c}</th>`).join('')}
        ${results.system ? `<th>${results.system.name}</th>` : ''}
      </tr>
      ${Object.entries(results.performance.comparison).map(([template, comps]) => `
        <tr>
          <th>${template}</th>
          ${Object.keys(results.components).map(c => `
            <td>${comps[c] ? `${comps[c].toFixed(2)}ms` : 'N/A'}</td>
          `).join('')}
          ${results.system && results.system.metrics && 
            results.system.metrics.renderTimes && 
            results.system.metrics.renderTimes[template] ? 
            `<td>${results.system.metrics.renderTimes[template].toFixed(2)}ms</td>` : 
            '<td>N/A</td>'}
        </tr>
      `).join('')}
    </table>
  ` : '';
  
  const htmlContent = `
<!DOCTYPE html>
<html lang="pt-br">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Relatório Completo - Sistema Avançado de Renderização</title>
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
    h1, h2, h3 {
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
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th, td {
      padding: 8px;
      border: 1px solid #ddd;
      text-align: left;
    }
    th {
      background-color: #f5f5f5;
    }
    tr.passed td:nth-child(2) {
      background-color: #c8e6c9;
    }
    tr.failed td:nth-child(2) {
      background-color: #ffcdd2;
    }
    
    .details-row {
      display: none;
    }
    .details-content {
      padding: 10px;
      background-color: #f9f9f9;
    }
    
    pre {
      white-space: pre-wrap;
      font-family: monospace;
      font-size: 12px;
      background-color: #f8f9fa;
      padding: 10px;
      border-radius: 3px;
      overflow-x: auto;
    }
    .errors {
      color: #d32f2f;
      background-color: #ffebee;
    }
    
    .integration-matrix td {
      text-align: center;
    }
    .compatible {
      background-color: #c8e6c9;
    }
    .incompatible {
      background-color: #ffcdd2;
    }
    
    .performance-table td {
      text-align: right;
    }
    
    button {
      padding: 5px 10px;
      background-color: #2196F3;
      color: white;
      border: none;
      border-radius: 3px;
      cursor: pointer;
    }
    button:hover {
      background-color: #0b7dda;
    }
  </style>
</head>
<body>
  <header>
    <h1>Relatório Completo - Sistema Avançado de Renderização</h1>
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
  
  <h2>Componentes Individuais</h2>
  <table>
    <tr>
      <th>Componente</th>
      <th>Status</th>
      <th>Tempo</th>
      <th>Memória</th>
      <th>Ações</th>
    </tr>
    ${componentRows}
  </table>
  
  <h2>Sistema Integrado</h2>
  <table>
    <tr>
      <th>Sistema</th>
      <th>Status</th>
      <th>Tempo</th>
      <th>Memória</th>
      <th>Ações</th>
    </tr>
    ${systemRow}
  </table>
  
  ${integrationMatrix}
  
  <h2>Análise de Performance</h2>
  ${perfComparison}
  ${performanceRecommendations}
  
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
    function toggleDetails(id) {
      const element = document.getElementById(id + '-details');
      if (element.style.display === 'table-row') {
        element.style.display = 'none';
      } else {
        element.style.display = 'table-row';
      }
    }
  </script>
</body>
</html>
  `;
  
  fs.writeFileSync(htmlReportPath, htmlContent);
  console.log(`Relatório HTML gerado: ${htmlReportPath}`);
};

// Função principal para executar todos os testes
const runAllTests = async () => {
  try {
    console.log('Executando testes de componentes individuais...\n');
    
    // 1. Executar testes de componentes individuais
    for (const component of config.componentTests) {
      await runTest(component);
    }
    
    // 2. Analisar integração entre componentes
    console.log('\nAnalisando integração entre componentes...');
    results.integrationMatrix = evaluateIntegration(results.components);
    
    // 3. Executar teste do sistema completo
    console.log('\nExecutando teste do sistema integrado...');
    await runTest(config.systemTest);
    
    // 4. Analisar performance comparativa
    console.log('\nAnalisando performance comparativa...');
    results.performance = analyzePerformance(results.components, results.system);
    
    // 5. Finalizar e gerar relatórios
    results.end = new Date().toISOString();
    
    // Salvar relatório JSON
    const timestamp = Date.now();
    const jsonReportPath = path.join(REPORT_DIR, `advanced-rendering-system-${timestamp}.json`);
    fs.writeFileSync(jsonReportPath, JSON.stringify(results, null, 2));
    console.log(`\nRelatório JSON gerado: ${jsonReportPath}`);
    
    // Gerar relatório HTML
    generateHtmlReport(results, jsonReportPath);
    
    // Resumo
    console.log('\n======================================================');
    console.log('Resumo Final dos Testes');
    console.log('======================================================');
    console.log(`Total de testes: ${results.summary.total}`);
    console.log(`Passou: ${results.summary.passed}`);
    console.log(`Falhou: ${results.summary.failed}`);
    console.log(`Pulou: ${results.summary.skipped}`);
    console.log(`Tempo total: ${(results.summary.totalTime/1000).toFixed(2)}s`);
    
    if (results.performance.recommendations && results.performance.recommendations.length > 0) {
      console.log('\nRecomendações de Performance:');
      results.performance.recommendations.forEach(rec => {
        console.log(`- ${rec}`);
      });
    }
    
    console.log('======================================================\n');
    
    // Retornar código de saída
    return results.summary.failed === 0 ? 0 : 1;
  } catch (error) {
    console.error('\nErro durante a execução dos testes:', error);
    return 1;
  }
};

// Executar testes e sair com código apropriado
runAllTests()
  .then(exitCode => {
    console.log(`\nTodos os testes concluídos com código de saída: ${exitCode}`);
    process.exit(exitCode);
  })
  .catch(error => {
    console.error('\nErro fatal durante os testes:', error);
    process.exit(1);
  });
