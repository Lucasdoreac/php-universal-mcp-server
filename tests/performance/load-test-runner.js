/**
 * Load Test Runner para Renderizador Progressivo
 * 
 * Este script executa testes de carga sistemáticos no renderizador progressivo
 * utilizando templates de diferentes complexidades para identificar gargalos
 * e oportunidades de otimização.
 * 
 * @author PHP Universal MCP Server Team
 * @version 1.0.0
 */

const fs = require('fs').promises;
const path = require('path');
const { performance } = require('perf_hooks');
const ProgressiveRenderer = require('../../modules/design/renderers/progressive-renderer');
const PerformanceOptimizer = require('../../modules/design/renderers/performance-optimizer');
const TemplateGenerator = require('./template-generator');

// Configurar um sistema de logging
const logger = {
  info: (...args) => console.log('\x1b[36m[INFO]\x1b[0m', ...args),
  debug: (...args) => console.log('\x1b[35m[DEBUG]\x1b[0m', ...args),
  error: (...args) => console.error('\x1b[31m[ERROR]\x1b[0m', ...args),
  success: (...args) => console.log('\x1b[32m[SUCCESS]\x1b[0m', ...args),
  warn: (...args) => console.warn('\x1b[33m[WARN]\x1b[0m', ...args),
  table: (data) => console.table(data)
};

/**
 * Executor de testes de carga para o renderizador progressivo
 */
class LoadTestRunner {
  constructor(options = {}) {
    this.options = {
      templatesDir: path.join(__dirname, 'generated-templates'),
      outputDir: path.join(__dirname, 'test-results'),
      iterations: 3,  // Número de vezes que cada teste será executado para média
      testTimeout: 60000,  // Timeout para cada teste (ms)
      memorySnapshotEnabled: true,  // Habilitar capturas de uso de memória
      compareWithStandardRenderer: true,  // Comparar com renderizador padrão
      ...options
    };

    // Inicializar renderizadores
    this.progressiveRenderer = new ProgressiveRenderer();
    this.standardRenderer = new PerformanceOptimizer();
    
    // Armazenar resultados dos testes
    this.results = {};
  }

  /**
   * Inicializa o runner de testes
   */
  async initialize() {
    // Criar diretório de saída se não existir
    await fs.mkdir(this.options.outputDir, { recursive: true });
    
    logger.success('LoadTestRunner inicializado');
  }

  /**
   * Executa todos os testes de carga
   */
  async runAllTests() {
    try {
      logger.info('Iniciando execução de todos os testes de carga...');
      
      // Verificar se os templates existem ou precisam ser gerados
      await this._ensureTemplatesExist();
      
      // Carregar templates disponíveis
      const templates = await this._loadTemplates();
      
      if (templates.length === 0) {
        throw new Error('Nenhum template encontrado para testes.');
      }

      logger.info(`${templates.length} templates encontrados para testes.`);
      
      // Executar testes em cada template
      for (const template of templates) {
        await this._runTestsForTemplate(template);
      }
      
      // Comparar resultados
      this._analyzeResults();
      
      // Gerar relatório final
      await this._generateReport();
      
      logger.success('Todos os testes concluídos com sucesso!');
      return this.results;
    } catch (error) {
      logger.error(`Erro ao executar testes: ${error.message}`);
      throw error;
    }
  }

  /**
   * Executa testes específicos em um template
   * @param {string} templateName - Nome do template para testar
   */
  async runTestForTemplate(templateName) {
    try {
      // Verificar se o template existe
      const templatePath = path.join(this.options.templatesDir, `${templateName}.html`);
      await fs.access(templatePath);
      
      // Executar testes para o template específico
      await this._runTestsForTemplate({ name: templateName, path: templatePath });
      
      // Analisar resultados deste teste
      this._analyzeResults(templateName);
      
      // Gerar relatório parcial
      await this._generateReport(templateName);
      
      logger.success(`Testes para o template ${templateName} concluídos com sucesso!`);
      return this.results[templateName];
    } catch (error) {
      logger.error(`Erro ao executar teste para template ${templateName}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Garante que os templates existam, gerando-os se necessário
   * @private
   */
  async _ensureTemplatesExist() {
    try {
      await fs.access(this.options.templatesDir);
      
      // Verificar se há templates gerados
      const files = await fs.readdir(this.options.templatesDir);
      const htmlFiles = files.filter(file => file.endsWith('.html'));
      
      if (htmlFiles.length === 0) {
        logger.warn('Nenhum template encontrado. Gerando templates para testes...');
        await this._generateTemplates();
      } else {
        logger.info(`${htmlFiles.length} templates encontrados. Prosseguindo com os testes.`);
      }
    } catch (error) {
      logger.warn('Diretório de templates não encontrado. Gerando templates para testes...');
      await this._generateTemplates();
    }
  }

  /**
   * Gera templates para testes
   * @private
   */
  async _generateTemplates() {
    logger.info('Gerando templates para testes de carga...');
    
    const generator = new TemplateGenerator({
      outputDir: this.options.templatesDir
    });
    
    await generator.initialize();
    
    // Gerar templates de diferentes tamanhos
    await generator.generateLargeTemplate('extreme-large', 500);
    await generator.generateLargeTemplate('ultra-large', 1000);
    await generator.generateLargeTemplate('monster-large', 2000);
    await generator.generateLargeTemplate('edge-cases', 500);
    
    logger.success('Templates gerados com sucesso!');
  }

  /**
   * Carrega os templates disponíveis para teste
   * @private
   * @returns {Array} Lista de templates disponíveis
   */
  async _loadTemplates() {
    const files = await fs.readdir(this.options.templatesDir);
    const htmlFiles = files.filter(file => file.endsWith('.html'));
    
    return htmlFiles.map(file => ({
      name: file.replace('.html', ''),
      path: path.join(this.options.templatesDir, file)
    }));
  }

  /**
   * Executa testes para um template específico
   * @private
   * @param {Object} template - Informações do template
   */
  async _runTestsForTemplate(template) {
    logger.info(`Iniciando testes para template: ${template.name}`);
    
    // Carregar conteúdo do template
    const templateContent = await fs.readFile(template.path, 'utf8');
    
    // Carregar estatísticas do template
    let templateStats = {};
    try {
      const statsPath = path.join(this.options.templatesDir, `${template.name}-stats.json`);
      const statsContent = await fs.readFile(statsPath, 'utf8');
      templateStats = JSON.parse(statsContent);
    } catch (error) {
      logger.warn(`Estatísticas do template ${template.name} não encontradas. Usando valores padrão.`);
      templateStats = {
        approximateComponentCount: 'N/A',
        fileSizeBytes: templateContent.length,
        fileSizeKb: (templateContent.length / 1024).toFixed(2)
      };
    }
    
    // Dados de mock para renderização
    const mockData = {
      title: `Teste de Carga - ${template.name}`,
      currentTime: new Date().toISOString(),
      random: Math.random()
    };
    
    // Inicializar resultados para este template
    this.results[template.name] = {
      templateInfo: {
        name: template.name,
        size: templateStats.fileSizeBytes,
        sizeKb: templateStats.fileSizeKb,
        componentCount: templateStats.approximateComponentCount
      },
      progressiveRenderer: {
        times: [],
        averageTime: 0,
        peakMemoryUsage: 0
      },
      standardRenderer: this.options.compareWithStandardRenderer ? {
        times: [],
        averageTime: 0,
        peakMemoryUsage: 0
      } : null,
      comparison: {
        timeDifference: 0,
        percentageDifference: 0,
        memoryDifference: 0
      }
    };
    
    // Executar testes com renderizador progressivo
    await this._testRenderer(
      'progressiveRenderer',
      this.progressiveRenderer.render.bind(this.progressiveRenderer),
      templateContent,
      mockData,
      template.name
    );
    
    // Executar testes com renderizador padrão para comparação
    if (this.options.compareWithStandardRenderer) {
      await this._testRenderer(
        'standardRenderer',
        this.standardRenderer.optimizeTemplate.bind(this.standardRenderer),
        templateContent,
        mockData,
        template.name
      );
    }
    
    // Calcular médias e diferenças
    this._calculateAverages(template.name);
    
    logger.success(`Testes concluídos para template: ${template.name}`);
  }

  /**
   * Testa um renderizador específico
   * @private
   * @param {string} rendererType - Tipo de renderizador (progressive ou standard)
   * @param {Function} renderFunction - Função de renderização
   * @param {string} templateContent - Conteúdo do template
   * @param {Object} data - Dados para renderização
   * @param {string} templateName - Nome do template
   */
  async _testRenderer(rendererType, renderFunction, templateContent, data, templateName) {
    logger.info(`Executando testes de ${rendererType} para ${templateName}...`);
    
    for (let i = 0; i < this.options.iterations; i++) {
      // Reset da memória antes do teste
      if (global.gc) {
        global.gc();
      }
      
      const memoryBefore = this.options.memorySnapshotEnabled ? process.memoryUsage() : null;
      const startTime = performance.now();
      
      try {
        // Configurar timeout para o teste
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error(`Timeout executando ${rendererType}`)), this.options.testTimeout);
        });
        
        // Executar renderização com timeout
        const renderedHTML = await Promise.race([
          renderFunction(templateContent, data),
          timeoutPromise
        ]);
        
        const endTime = performance.now();
        const executionTime = endTime - startTime;
        
        // Coletar métricas de memória após o teste
        const memoryAfter = this.options.memorySnapshotEnabled ? process.memoryUsage() : null;
        const memoryDelta = memoryAfter ? memoryAfter.heapUsed - memoryBefore.heapUsed : 0;
        
        // Registrar resultados
        this.results[templateName][rendererType].times.push(executionTime);
        
        if (memoryAfter) {
          const peakMemory = memoryAfter.heapUsed / 1024 / 1024; // MB
          this.results[templateName][rendererType].peakMemoryUsage = 
            Math.max(this.results[templateName][rendererType].peakMemoryUsage || 0, peakMemory);
        }
        
        // Salvar amostra do HTML renderizado para verificação
        const sampleDir = path.join(this.options.outputDir, 'samples');
        await fs.mkdir(sampleDir, { recursive: true });
        
        // Salvar apenas os primeiros 10000 caracteres para não ocupar muito espaço
        const sampleHTML = renderedHTML.substring(0, 10000) + '\n... (truncado para amostra)';
        await fs.writeFile(
          path.join(sampleDir, `${templateName}-${rendererType}-sample-${i}.html`),
          sampleHTML
        );
        
        logger.debug(`Iteração ${i + 1}/${this.options.iterations}: ${executionTime.toFixed(2)}ms, Memória: ${(memoryDelta / 1024 / 1024).toFixed(2)}MB`);
      } catch (error) {
        logger.error(`Erro na iteração ${i + 1} para ${rendererType}: ${error.message}`);
        // Registrar erro nos resultados
        this.results[templateName][rendererType].errors = this.results[templateName][rendererType].errors || [];
        this.results[templateName][rendererType].errors.push(error.message);
      }
    }
  }

  /**
   * Calcula médias dos tempos de execução e diferenças entre renderizadores
   * @private
   * @param {string} templateName - Nome do template
   */
  _calculateAverages(templateName) {
    const result = this.results[templateName];
    
    // Calcular média para o renderizador progressivo
    const progressiveTimes = result.progressiveRenderer.times;
    result.progressiveRenderer.averageTime = progressiveTimes.length > 0 
      ? progressiveTimes.reduce((a, b) => a + b, 0) / progressiveTimes.length 
      : 0;
    
    // Calcular média para o renderizador padrão
    if (result.standardRenderer) {
      const standardTimes = result.standardRenderer.times;
      result.standardRenderer.averageTime = standardTimes.length > 0 
        ? standardTimes.reduce((a, b) => a + b, 0) / standardTimes.length 
        : 0;
      
      // Calcular diferenças
      const timeDiff = result.progressiveRenderer.averageTime - result.standardRenderer.averageTime;
      result.comparison.timeDifference = timeDiff;
      
      // Porcentagem de diferença relativa ao renderizador padrão
      result.comparison.percentageDifference = result.standardRenderer.averageTime !== 0 
        ? (timeDiff / result.standardRenderer.averageTime) * 100 
        : 0;
      
      // Diferença de memória
      result.comparison.memoryDifference = 
        result.progressiveRenderer.peakMemoryUsage - result.standardRenderer.peakMemoryUsage;
    }
  }

  /**
   * Analisa os resultados para identificar gargalos e oportunidades de otimização
   * @private
   * @param {string} [templateName] - Nome do template específico para análise
   */
  _analyzeResults(templateName = null) {
    const templateNames = templateName ? [templateName] : Object.keys(this.results);
    
    for (const name of templateNames) {
      const result = this.results[name];
      
      // Identificar gargalos de desempenho
      const progressiveAvgTime = result.progressiveRenderer.averageTime;
      const standardAvgTime = result.standardRenderer?.averageTime || 0;
      
      logger.info(`\nAnálise para template: ${name}`);
      logger.info(`Componentes: ${result.templateInfo.componentCount}, Tamanho: ${result.templateInfo.sizeKb}KB`);
      logger.info(`Tempo médio (Progressivo): ${progressiveAvgTime.toFixed(2)}ms`);
      
      if (result.standardRenderer) {
        logger.info(`Tempo médio (Padrão): ${standardAvgTime.toFixed(2)}ms`);
        logger.info(`Diferença: ${result.comparison.timeDifference.toFixed(2)}ms (${result.comparison.percentageDifference.toFixed(2)}%)`);
      }
      
      // Identificar problemas e recomendar otimizações
      result.recommendations = [];
      
      // Verificar se o renderizador progressivo é mais lento que o padrão
      if (result.standardRenderer && result.comparison.percentageDifference > 10) {
        result.recommendations.push(
          "O renderizador progressivo está significativamente mais lento que o padrão. " +
          "Considere otimizar a análise de prioridade e reduzir operações síncronas."
        );
      }
      
      // Verificar uso excessivo de memória
      if (result.progressiveRenderer.peakMemoryUsage > 200) { // 200MB é considerado alto
        result.recommendations.push(
          `Uso de memória alto (${result.progressiveRenderer.peakMemoryUsage.toFixed(2)}MB). ` +
          "Considere implementar divisão de templates grandes em chunks ou streaming de renderização."
        );
      }
      
      // Analisar erros se houver
      if (result.progressiveRenderer.errors && result.progressiveRenderer.errors.length > 0) {
        result.recommendations.push(
          `Erros encontrados durante renderização: ${result.progressiveRenderer.errors.length}. ` +
          "Revise o tratamento de erros e casos extremos no renderizador."
        );
      }
      
      // Mostrar recomendações
      if (result.recommendations.length > 0) {
        logger.warn("Recomendações para otimização:");
        result.recommendations.forEach((rec, index) => {
          logger.warn(`${index + 1}. ${rec}`);
        });
      } else {
        logger.success("O renderizador está performando bem para este template.");
      }
    }
  }

  /**
   * Gera um relatório detalhado dos testes
   * @private
   * @param {string} [templateName] - Nome do template específico para relatório
   */
  async _generateReport(templateName = null) {
    const reportData = templateName ? { [templateName]: this.results[templateName] } : this.results;
    
    // Formatar dados para relatório
    const formattedData = Object.entries(reportData).map(([name, data]) => {
      return {
        Template: name,
        Components: data.templateInfo.componentCount,
        Size: `${data.templateInfo.sizeKb} KB`,
        'Progressive (ms)': data.progressiveRenderer.averageTime.toFixed(2),
        'Standard (ms)': data.standardRenderer ? data.standardRenderer.averageTime.toFixed(2) : 'N/A',
        'Diff %': data.standardRenderer ? data.comparison.percentageDifference.toFixed(2) + '%' : 'N/A',
        'Prog. Memory (MB)': data.progressiveRenderer.peakMemoryUsage.toFixed(2),
        'Std. Memory (MB)': data.standardRenderer ? data.standardRenderer.peakMemoryUsage.toFixed(2) : 'N/A',
        'Issues': data.recommendations ? data.recommendations.length : 0
      };
    });
    
    // Exibir tabela resumida
    logger.info("\nResumo dos Testes de Carga:");
    logger.table(formattedData);
    
    // Gerar arquivo de relatório JSON
    const reportPath = path.join(
      this.options.outputDir, 
      templateName ? `report-${templateName}.json` : 'full-report.json'
    );
    
    await fs.writeFile(reportPath, JSON.stringify(reportData, null, 2));
    
    // Gerar relatório HTML
    const htmlReportPath = path.join(
      this.options.outputDir, 
      templateName ? `report-${templateName}.html` : 'full-report.html'
    );
    
    const htmlReport = this._generateHTMLReport(reportData);
    await fs.writeFile(htmlReportPath, htmlReport);
    
    logger.success(`Relatório gerado em: ${reportPath}`);
    logger.success(`Relatório HTML gerado em: ${htmlReportPath}`);
  }

  /**
   * Gera um relatório HTML detalhado
   * @private
   * @param {Object} reportData - Dados do relatório
   * @returns {string} Conteúdo HTML do relatório
   */
  _generateHTMLReport(reportData) {
    const currentDate = new Date().toLocaleString();
    
    let tableRows = '';
    
    Object.entries(reportData).forEach(([templateName, data]) => {
      const diffClass = data.standardRenderer && data.comparison.percentageDifference > 0 
        ? 'text-danger' 
        : 'text-success';
      
      tableRows += `
        <tr>
          <td>${templateName}</td>
          <td>${data.templateInfo.componentCount}</td>
          <td>${data.templateInfo.sizeKb} KB</td>
          <td>${data.progressiveRenderer.averageTime.toFixed(2)} ms</td>
          <td>${data.standardRenderer ? data.standardRenderer.averageTime.toFixed(2) + ' ms' : 'N/A'}</td>
          <td class="${diffClass}">${data.standardRenderer ? data.comparison.percentageDifference.toFixed(2) + '%' : 'N/A'}</td>
          <td>${data.progressiveRenderer.peakMemoryUsage.toFixed(2)} MB</td>
          <td>${data.recommendations ? data.recommendations.length : 0}</td>
        </tr>
      `;
    });
    
    // Gerar gráficos e visualizações (versão básica)
    let chartData = 'const data = ' + JSON.stringify(Object.entries(reportData).map(([name, data]) => {
      return {
        name,
        progressive: data.progressiveRenderer.averageTime,
        standard: data.standardRenderer ? data.standardRenderer.averageTime : 0,
        components: data.templateInfo.componentCount,
        sizeKb: parseFloat(data.templateInfo.sizeKb)
      };
    })) + ';';
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Relatório de Testes de Carga - Renderizador Progressivo</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
      </head>
      <body>
        <div class="container py-4">
          <h1 class="mb-4">Relatório de Testes de Carga - Renderizador Progressivo</h1>
          <p class="text-muted">Gerado em: ${currentDate}</p>
          
          <div class="card mb-4">
            <div class="card-header bg-primary text-white">
              <h5 class="m-0">Resumo dos Testes</h5>
            </div>
            <div class="card-body">
              <div class="table-responsive">
                <table class="table table-striped table-hover">
                  <thead>
                    <tr>
                      <th>Template</th>
                      <th>Componentes</th>
                      <th>Tamanho</th>
                      <th>Tempo Progressivo</th>
                      <th>Tempo Padrão</th>
                      <th>Diferença %</th>
                      <th>Memória Pico</th>
                      <th>Problemas</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${tableRows}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          <div class="row mb-4">
            <div class="col-md-6">
              <div class="card">
                <div class="card-header bg-primary text-white">
                  <h5 class="m-0">Comparação de Tempos de Renderização</h5>
                </div>
                <div class="card-body">
                  <canvas id="renderTimeChart"></canvas>
                </div>
              </div>
            </div>
            <div class="col-md-6">
              <div class="card">
                <div class="card-header bg-primary text-white">
                  <h5 class="m-0">Correlação: Componentes vs. Tempo</h5>
                </div>
                <div class="card-body">
                  <canvas id="correlationChart"></canvas>
                </div>
              </div>
            </div>
          </div>
          
          <div class="card mb-4">
            <div class="card-header bg-warning text-dark">
              <h5 class="m-0">Recomendações de Otimização</h5>
            </div>
            <div class="card-body">
              <ul class="list-group">
                ${Object.entries(reportData).flatMap(([name, data]) => {
                  if (!data.recommendations || data.recommendations.length === 0) {
                    return [`<li class="list-group-item list-group-item-success"><strong>${name}:</strong> Nenhuma recomendação necessária</li>`];
                  }
                  return data.recommendations.map(rec => 
                    `<li class="list-group-item list-group-item-warning"><strong>${name}:</strong> ${rec}</li>`
                  );
                }).join('')}
              </ul>
            </div>
          </div>
        </div>
        
        <script>
          // Dados para os gráficos
          ${chartData}
          
          // Renderizar gráficos
          document.addEventListener('DOMContentLoaded', function() {
            // Gráfico de tempos de renderização
            const renderTimeCtx = document.getElementById('renderTimeChart').getContext('2d');
            new Chart(renderTimeCtx, {
              type: 'bar',
              data: {
                labels: data.map(d => d.name),
                datasets: [
                  {
                    label: 'Renderizador Progressivo (ms)',
                    data: data.map(d => d.progressive),
                    backgroundColor: 'rgba(54, 162, 235, 0.7)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                  },
                  {
                    label: 'Renderizador Padrão (ms)',
                    data: data.map(d => d.standard),
                    backgroundColor: 'rgba(255, 99, 132, 0.7)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                  }
                ]
              },
              options: {
                responsive: true,
                scales: {
                  y: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: 'Tempo (ms)'
                    }
                  }
                }
              }
            });
            
            // Gráfico de correlação
            const correlationCtx = document.getElementById('correlationChart').getContext('2d');
            new Chart(correlationCtx, {
              type: 'scatter',
              data: {
                datasets: [
                  {
                    label: 'Renderizador Progressivo',
                    data: data.map(d => ({ x: d.components, y: d.progressive })),
                    backgroundColor: 'rgba(54, 162, 235, 0.7)'
                  },
                  {
                    label: 'Renderizador Padrão',
                    data: data.map(d => ({ x: d.components, y: d.standard })),
                    backgroundColor: 'rgba(255, 99, 132, 0.7)'
                  }
                ]
              },
              options: {
                responsive: true,
                scales: {
                  x: {
                    type: 'linear',
                    position: 'bottom',
                    title: {
                      display: true,
                      text: 'Número de Componentes'
                    }
                  },
                  y: {
                    title: {
                      display: true,
                      text: 'Tempo (ms)'
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
  }
}

/**
 * Função principal para executar os testes de carga
 */
async function runLoadTests() {
  try {
    logger.info('Iniciando testes de carga para o renderizador progressivo...');
    
    const testRunner = new LoadTestRunner();
    await testRunner.initialize();
    
    // Executar todos os testes
    await testRunner.runAllTests();
    
    logger.success('Testes de carga concluídos com sucesso!');
  } catch (error) {
    logger.error('Erro ao executar testes de carga:', error);
  }
}

// Executar testes de carga
if (require.main === module) {
  runLoadTests();
}

module.exports = LoadTestRunner;