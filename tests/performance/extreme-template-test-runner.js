/**
 * Extreme Template Test Runner
 * 
 * Este script executa testes de carga específicos para templates extremamente grandes,
 * integra o gerador de templates com o executor de testes, e fornece análises detalhadas
 * para identificar gargalos de desempenho e otimizações possíveis.
 * 
 * @author PHP Universal MCP Server Team
 * @version 1.0.0
 */

const fs = require('fs').promises;
const path = require('path');
const { performance } = require('perf_hooks');
const TemplateGenerator = require('./template-generator');
const LoadTestRunner = require('./load-test-runner');
const LoadTestAnalyzer = require('./load-test-analyzer');

// Configurar um sistema de logging
const logger = {
  info: (...args) => console.log('\x1b[36m[INFO]\x1b[0m', ...args),
  debug: (...args) => console.log('\x1b[35m[DEBUG]\x1b[0m', ...args),
  error: (...args) => console.error('\x1b[31m[ERROR]\x1b[0m', ...args),
  success: (...args) => console.log('\x1b[32m[SUCCESS]\x1b[0m', ...args),
  warn: (...args) => console.warn('\x1b[33m[WARN]\x1b[0m', ...args),
  result: (...args) => console.log('\x1b[34m[RESULT]\x1b[0m', ...args),
  table: (data) => console.table(data)
};

/**
 * Executor de testes para templates extremamente grandes
 */
class ExtremeTemplateTestRunner {
  constructor(options = {}) {
    this.options = {
      baseDir: __dirname,
      templatesDir: path.join(__dirname, 'generated-templates'),
      resultsDir: path.join(__dirname, 'extreme-test-results'),
      forceRegenerate: false, // Se true, gera novos templates mesmo se já existirem
      testConfigs: [
        {
          name: 'standard',
          templateSize: 500, // ~500 componentes (extreme-large)
          iterations: 3
        },
        {
          name: 'large',
          templateSize: 1000, // ~1000 componentes (ultra-large)
          iterations: 3
        },
        {
          name: 'extreme',
          templateSize: 2000, // ~2000 componentes (monster-large)
          iterations: 2 // Menos iterações para templates extremos para evitar timeout
        },
        {
          name: 'edge-cases',
          templateSize: 500, // ~500 componentes com edge cases
          iterations: 3
        }
      ],
      optimizationVariants: ['basic', 'chunked', 'progressive', 'streaming'],
      ...options
    };

    // Inicializar resultados
    this.results = {};
    this.summaryMetrics = {};
  }

  /**
   * Inicializa o executor de testes
   */
  async initialize() {
    try {
      // Criar diretórios
      await fs.mkdir(this.options.templatesDir, { recursive: true });
      await fs.mkdir(this.options.resultsDir, { recursive: true });
      
      // Verificar se precisa gerar templates
      await this._ensureTemplatesExist();
      
      logger.success('ExtremeTemplateTestRunner inicializado');
    } catch (error) {
      logger.error(`Erro ao inicializar: ${error.message}`);
      throw error;
    }
  }

  /**
   * Garante que os templates extremos existam ou sejam gerados
   * @private
   */
  async _ensureTemplatesExist() {
    try {
      const files = await fs.readdir(this.options.templatesDir);
      const templateFiles = files.filter(file => file.endsWith('.html'));
      
      // Se não existirem templates suficientes ou forceRegenerate for true, gerar novos
      if (this.options.forceRegenerate || templateFiles.length < this.options.testConfigs.length) {
        logger.info('Gerando templates extremamente grandes para testes...');
        
        const generator = new TemplateGenerator({
          outputDir: this.options.templatesDir
        });
        
        await generator.initialize();
        
        // Gerar todos os templates configurados
        for (const config of this.options.testConfigs) {
          const templateName = config.name === 'edge-cases' 
            ? 'edge-cases' 
            : `${config.name}-${config.templateSize}`;
          
          await generator.generateLargeTemplate(templateName, config.templateSize);
        }
        
        logger.success('Templates gerados com sucesso');
      } else {
        logger.info(`${templateFiles.length} templates encontrados, prosseguindo com os testes`);
      }
    } catch (error) {
      logger.error(`Erro ao verificar/gerar templates: ${error.message}`);
      throw error;
    }
  }

  /**
   * Executa todos os testes configurados
   */
  async runAllTests() {
    try {
      logger.info('Iniciando execução de todos os testes...');
      
      // Para cada configuração de teste
      for (const config of this.options.testConfigs) {
        await this._runTestConfig(config);
      }
      
      // Analisar e comparar resultados
      await this._analyzeResults();
      
      // Gerar relatório final
      await this._generateFinalReport();
      
      logger.success('Todos os testes concluídos com sucesso!');
      return this.results;
    } catch (error) {
      logger.error(`Erro ao executar testes: ${error.message}`);
      throw error;
    }
  }

  /**
   * Executa os testes para uma configuração específica
   * @param {Object} config - Configuração do teste
   * @private
   */
  async _runTestConfig(config) {
    const templateName = config.name === 'edge-cases' 
      ? 'edge-cases' 
      : `${config.name}-${config.templateSize}`;
    
    logger.info(`Executando testes para configuração "${config.name}" usando template ${templateName}...`);
    
    // Verificar se o template existe
    const templatePath = path.join(this.options.templatesDir, `${templateName}.html`);
    try {
      await fs.access(templatePath);
    } catch (error) {
      logger.error(`Template ${templateName} não encontrado em ${templatePath}`);
      throw new Error(`Template ${templateName} não encontrado`);
    }
    
    // Configurar e executar o LoadTestRunner
    const testRunner = new LoadTestRunner({
      templatesDir: this.options.templatesDir,
      outputDir: path.join(this.options.resultsDir, templateName),
      iterations: config.iterations,
      renderModes: this.options.optimizationVariants,
      browserSimulation: true,
      memorySnapshotEnabled: true
    });
    
    await testRunner.initialize();
    
    // Executar apenas para o template específico
    const results = await testRunner.runTestForTemplate(`${templateName}.html`);
    
    // Armazenar resultados
    this.results[templateName] = results;
    
    logger.success(`Testes concluídos para configuração "${config.name}"`);
  }

  /**
   * Analisa os resultados de todos os testes
   * @private
   */
  async _analyzeResults() {
    logger.info('Analisando resultados de todos os testes...');
    
    // Inicializar analisador
    const analyzer = new LoadTestAnalyzer({
      inputDir: this.options.resultsDir,
      outputDir: path.join(this.options.resultsDir, 'analysis')
    });
    
    await analyzer.initialize();
    
    // Criar objeto de resultados consolidados para o analisador
    const consolidatedResults = {};
    
    Object.entries(this.results).forEach(([templateName, result]) => {
      consolidatedResults[templateName] = result;
    });
    
    // Salvar resultados consolidados para análise
    const consolidatedPath = path.join(this.options.resultsDir, 'consolidated-results.json');
    await fs.writeFile(consolidatedPath, JSON.stringify(consolidatedResults, null, 2));
    
    // Analisar resultados
    analyzer.results = consolidatedResults;
    const analysis = await analyzer.analyzeResults();
    
    // Calcular métricas resumidas
    this._calculateSummaryMetrics(analysis);
    
    logger.success('Análise de resultados concluída');
  }

  /**
   * Calcula métricas resumidas para comparação rápida
   * @param {Object} analysis - Resultados da análise
   * @private
   */
  _calculateSummaryMetrics(analysis) {
    // Inicializar métricas por variante e template
    this.summaryMetrics = {
      byVariant: {},
      byTemplate: {},
      recommendations: analysis.optimizationPriorities.slice(0, 5) // Top 5 recomendações
    };
    
    // Preencher dados por variante de otimização
    this.options.optimizationVariants.forEach(variant => {
      this.summaryMetrics.byVariant[variant] = {
        avgTime: 0,
        avgMemory: 0,
        successRate: 0,
        templateResults: {}
      };
    });
    
    // Preencher dados por template
    Object.keys(this.results).forEach(templateName => {
      this.summaryMetrics.byTemplate[templateName] = {
        bestVariant: '',
        bestTime: Number.MAX_VALUE,
        bestMemory: Number.MAX_VALUE,
        worstVariant: '',
        worstTime: 0,
        variantResults: {}
      };
    });
    
    // Calcular médias e encontrar melhores/piores variantes
    let variantCounts = {};
    
    Object.entries(this.results).forEach(([templateName, result]) => {
      // Processar resultados de renderização
      result.renderTests.forEach(renderTest => {
        const variant = renderTest.mode;
        
        // Atualizar dados por variante
        if (!variantCounts[variant]) variantCounts[variant] = 0;
        variantCounts[variant]++;
        
        this.summaryMetrics.byVariant[variant].avgTime += renderTest.averageRenderTimeMs;
        this.summaryMetrics.byVariant[variant].avgMemory += renderTest.peakMemoryUsageMB;
        this.summaryMetrics.byVariant[variant].successRate += renderTest.successRate;
        
        // Armazenar resultado para este template
        this.summaryMetrics.byVariant[variant].templateResults[templateName] = {
          time: renderTest.averageRenderTimeMs,
          memory: renderTest.peakMemoryUsageMB,
          success: renderTest.successRate
        };
        
        // Atualizar dados por template
        this.summaryMetrics.byTemplate[templateName].variantResults[variant] = {
          time: renderTest.averageRenderTimeMs,
          memory: renderTest.peakMemoryUsageMB,
          success: renderTest.successRate
        };
        
        // Verificar se é a melhor variante para este template
        if (renderTest.averageRenderTimeMs < this.summaryMetrics.byTemplate[templateName].bestTime) {
          this.summaryMetrics.byTemplate[templateName].bestVariant = variant;
          this.summaryMetrics.byTemplate[templateName].bestTime = renderTest.averageRenderTimeMs;
        }
        
        // Verificar se é a pior variante para este template
        if (renderTest.averageRenderTimeMs > this.summaryMetrics.byTemplate[templateName].worstTime) {
          this.summaryMetrics.byTemplate[templateName].worstVariant = variant;
          this.summaryMetrics.byTemplate[templateName].worstTime = renderTest.averageRenderTimeMs;
        }
      });
    });
    
    // Calcular médias finais
    Object.keys(this.summaryMetrics.byVariant).forEach(variant => {
      if (variantCounts[variant]) {
        this.summaryMetrics.byVariant[variant].avgTime /= variantCounts[variant];
        this.summaryMetrics.byVariant[variant].avgMemory /= variantCounts[variant];
        this.summaryMetrics.byVariant[variant].successRate /= variantCounts[variant];
      }
    });
    
    // Identificar melhor variante geral
    let bestVariantTime = Number.MAX_VALUE;
    let bestVariantName = '';
    
    Object.entries(this.summaryMetrics.byVariant).forEach(([variant, metrics]) => {
      if (metrics.avgTime < bestVariantTime) {
        bestVariantTime = metrics.avgTime;
        bestVariantName = variant;
      }
    });
    
    this.summaryMetrics.bestOverallVariant = bestVariantName;
    
    logger.info(`Métricas resumidas calculadas. Melhor variante geral: ${bestVariantName}`);
  }

  /**
   * Gera um relatório final detalhado
   * @private
   */
  async _generateFinalReport() {
    try {
      logger.info('Gerando relatório final...');
      
      // Salvar métricas resumidas
      const summaryPath = path.join(this.options.resultsDir, 'summary-metrics.json');
      await fs.writeFile(summaryPath, JSON.stringify(this.summaryMetrics, null, 2));
      
      // Gerar relatório visual em HTML
      const htmlReportPath = path.join(this.options.resultsDir, 'extreme-template-report.html');
      const htmlReport = this._generateHTMLReport();
      await fs.writeFile(htmlReportPath, htmlReport);
      
      // Gerar relatório em markdown para fácil leitura
      const mdReportPath = path.join(this.options.resultsDir, 'extreme-template-report.md');
      const mdReport = this._generateMarkdownReport();
      await fs.writeFile(mdReportPath, mdReport);
      
      logger.success(`Relatórios gerados em ${this.options.resultsDir}`);
    } catch (error) {
      logger.error(`Erro ao gerar relatório final: ${error.message}`);
      throw error;
    }
  }

  /**
   * Gera um relatório em formato HTML
   * @returns {string} Conteúdo HTML do relatório
   * @private
   */
  _generateHTMLReport() {
    const now = new Date().toLocaleString();
    
    // Preparar dados para os gráficos
    const templateNames = Object.keys(this.summaryMetrics.byTemplate);
    const variantNames = Object.keys(this.summaryMetrics.byVariant);
    
    const timeData = variantNames.map(variant => ({
      label: variant,
      data: templateNames.map(template => 
        this.summaryMetrics.byTemplate[template].variantResults[variant]?.time || 0
      ),
      backgroundColor: this._getColorForVariant(variant, 0.7)
    }));
    
    const memoryData = variantNames.map(variant => ({
      label: variant,
      data: templateNames.map(template => 
        this.summaryMetrics.byTemplate[template].variantResults[variant]?.memory || 0
      ),
      backgroundColor: this._getColorForVariant(variant, 0.7)
    }));
    
    // Dados para o gráfico de barras comparativo entre variantes
    const comparativeData = {
      labels: variantNames,
      datasets: [
        {
          label: 'Tempo Médio (ms)',
          data: variantNames.map(v => this.summaryMetrics.byVariant[v].avgTime),
          backgroundColor: 'rgba(54, 162, 235, 0.7)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
          yAxisID: 'y'
        },
        {
          label: 'Memória (MB)',
          data: variantNames.map(v => this.summaryMetrics.byVariant[v].avgMemory),
          backgroundColor: 'rgba(75, 192, 192, 0.7)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
          yAxisID: 'y1'
        }
      ]
    };
    
    // Gerar tabela de comparação
    let comparisonTableRows = '';
    templateNames.forEach(template => {
      const templateData = this.summaryMetrics.byTemplate[template];
      comparisonTableRows += `
        <tr>
          <td>${template}</td>
          <td>${templateData.bestVariant} (${templateData.bestTime.toFixed(2)}ms)</td>
          <td>${templateData.worstVariant} (${templateData.worstTime.toFixed(2)}ms)</td>
          <td>${((templateData.worstTime - templateData.bestTime) / templateData.worstTime * 100).toFixed(1)}%</td>
        </tr>
      `;
    });
    
    // Gerar recomendações
    let recommendationsHTML = '';
    this.summaryMetrics.recommendations.forEach((rec, index) => {
      recommendationsHTML += `
        <div class="card mb-3">
          <div class="card-header bg-warning">
            <h5 class="card-title">${index + 1}. ${rec.title}</h5>
          </div>
          <div class="card-body">
            <p>${rec.description}</p>
            <h6>Ações recomendadas:</h6>
            <ul>
              ${rec.actions.map(action => `<li>${action}</li>`).join('')}
            </ul>
          </div>
        </div>
      `;
    });
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Relatório de Testes - Templates Extremamente Grandes</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
      </head>
      <body>
        <div class="container py-4">
          <h1 class="mb-4">Relatório de Testes - Templates Extremamente Grandes</h1>
          <p class="text-muted">Gerado em: ${now}</p>
          
          <div class="alert alert-info">
            <h4 class="alert-heading">Resumo Executivo</h4>
            <p>Melhor estratégia de renderização geral: <strong>${this.summaryMetrics.bestOverallVariant}</strong></p>
            <p>As principais recomendações para otimização estão listadas na seção de Recomendações abaixo.</p>
          </div>
          
          <div class="row">
            <div class="col-md-6">
              <div class="card mb-4">
                <div class="card-header bg-primary text-white">
                  <h5 class="m-0">Comparação entre Estratégias de Renderização</h5>
                </div>
                <div class="card-body">
                  <canvas id="comparativeChart"></canvas>
                </div>
              </div>
            </div>
            <div class="col-md-6">
              <div class="card mb-4">
                <div class="card-header bg-primary text-white">
                  <h5 class="m-0">Tempo de Renderização por Template</h5>
                </div>
                <div class="card-body">
                  <canvas id="timeChart"></canvas>
                </div>
              </div>
            </div>
          </div>
          
          <div class="card mb-4">
            <div class="card-header bg-primary text-white">
              <h5 class="m-0">Comparação de Resultados por Template</h5>
            </div>
            <div class="card-body">
              <div class="table-responsive">
                <table class="table table-striped table-hover">
                  <thead>
                    <tr>
                      <th>Template</th>
                      <th>Melhor Estratégia</th>
                      <th>Pior Estratégia</th>
                      <th>Diferença (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${comparisonTableRows}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          <div class="card mb-4">
            <div class="card-header bg-warning text-dark">
              <h5 class="m-0">Recomendações</h5>
            </div>
            <div class="card-body">
              ${recommendationsHTML}
            </div>
          </div>
          
          <div class="card mb-4">
            <div class="card-header bg-primary text-white">
              <h5 class="m-0">Uso de Memória por Template</h5>
            </div>
            <div class="card-body">
              <canvas id="memoryChart"></canvas>
            </div>
          </div>
        </div>
        
        <script>
          // Configurar gráficos
          document.addEventListener('DOMContentLoaded', function() {
            // Gráfico comparativo
            const comparativeCtx = document.getElementById('comparativeChart').getContext('2d');
            new Chart(comparativeCtx, {
              type: 'bar',
              data: ${JSON.stringify(comparativeData)},
              options: {
                responsive: true,
                scales: {
                  y: {
                    type: 'linear',
                    position: 'left',
                    title: {
                      display: true,
                      text: 'Tempo (ms)'
                    }
                  },
                  y1: {
                    type: 'linear',
                    position: 'right',
                    title: {
                      display: true,
                      text: 'Memória (MB)'
                    },
                    grid: {
                      drawOnChartArea: false
                    }
                  }
                }
              }
            });
            
            // Gráfico de tempo
            const timeCtx = document.getElementById('timeChart').getContext('2d');
            new Chart(timeCtx, {
              type: 'bar',
              data: {
                labels: ${JSON.stringify(templateNames)},
                datasets: ${JSON.stringify(timeData)}
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
            
            // Gráfico de memória
            const memoryCtx = document.getElementById('memoryChart').getContext('2d');
            new Chart(memoryCtx, {
              type: 'bar',
              data: {
                labels: ${JSON.stringify(templateNames)},
                datasets: ${JSON.stringify(memoryData)}
              },
              options: {
                responsive: true,
                scales: {
                  y: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: 'Memória (MB)'
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

  /**
   * Gera um relatório em formato Markdown
   * @returns {string} Conteúdo Markdown do relatório
   * @private
   */
  _generateMarkdownReport() {
    const now = new Date().toLocaleString();
    
    let markdown = `# Relatório de Testes - Templates Extremamente Grandes\n\n`;
    markdown += `Gerado em: ${now}\n\n`;
    
    // Resumo executivo
    markdown += `## Resumo Executivo\n\n`;
    markdown += `- Melhor estratégia de renderização geral: **${this.summaryMetrics.bestOverallVariant}**\n`;
    markdown += `- Total de templates testados: ${Object.keys(this.summaryMetrics.byTemplate).length}\n`;
    markdown += `- Variantes de otimização testadas: ${Object.keys(this.summaryMetrics.byVariant).join(', ')}\n\n`;
    
    // Comparação de variantes
    markdown += `## Comparação entre Estratégias de Renderização\n\n`;
    markdown += `| Estratégia | Tempo Médio (ms) | Memória Média (MB) | Taxa de Sucesso (%) |\n`;
    markdown += `|------------|------------------|--------------------|--------------------|`;
    
    Object.entries(this.summaryMetrics.byVariant).forEach(([variant, metrics]) => {
      markdown += `\n| ${variant} | ${metrics.avgTime.toFixed(2)} | ${metrics.avgMemory.toFixed(2)} | ${metrics.successRate.toFixed(1)} |`;
    });
    
    markdown += `\n\n`;
    
    // Comparação por template
    markdown += `## Comparação de Resultados por Template\n\n`;
    markdown += `| Template | Melhor Estratégia | Pior Estratégia | Diferença (%) |\n`;
    markdown += `|----------|-------------------|-----------------|---------------|`;
    
    Object.entries(this.summaryMetrics.byTemplate).forEach(([template, data]) => {
      const diffPercent = ((data.worstTime - data.bestTime) / data.worstTime * 100).toFixed(1);
      markdown += `\n| ${template} | ${data.bestVariant} (${data.bestTime.toFixed(2)}ms) | ${data.worstVariant} (${data.worstTime.toFixed(2)}ms) | ${diffPercent} |`;
    });
    
    markdown += `\n\n`;
    
    // Recomendações
    markdown += `## Recomendações\n\n`;
    
    this.summaryMetrics.recommendations.forEach((rec, index) => {
      markdown += `### ${index + 1}. ${rec.title}\n\n`;
      markdown += `${rec.description}\n\n`;
      markdown += `**Ações recomendadas:**\n\n`;
      
      rec.actions.forEach(action => {
        markdown += `- ${action}\n`;
      });
      
      markdown += `\n`;
    });
    
    // Detalhes por variante
    markdown += `## Detalhes por Variante de Otimização\n\n`;
    
    Object.entries(this.summaryMetrics.byVariant).forEach(([variant, metrics]) => {
      markdown += `### Variante: ${variant}\n\n`;
      markdown += `- Tempo médio: ${metrics.avgTime.toFixed(2)}ms\n`;
      markdown += `- Uso de memória médio: ${metrics.avgMemory.toFixed(2)}MB\n`;
      markdown += `- Taxa de sucesso: ${metrics.successRate.toFixed(1)}%\n\n`;
      
      markdown += `**Resultados por template:**\n\n`;
      markdown += `| Template | Tempo (ms) | Memória (MB) | Sucesso (%) |\n`;
      markdown += `|----------|------------|--------------|-------------|`;
      
      Object.entries(metrics.templateResults).forEach(([template, result]) => {
        markdown += `\n| ${template} | ${result.time.toFixed(2)} | ${result.memory.toFixed(2)} | ${result.success.toFixed(1)} |`;
      });
      
      markdown += `\n\n`;
    });
    
    // Conclusão
    markdown += `## Conclusão\n\n`;
    markdown += `Com base nos testes realizados, a estratégia **${this.summaryMetrics.bestOverallVariant}** se mostrou mais eficiente para a renderização de templates extremamente grandes na maioria dos casos. `;
    
    // Adicionar observações específicas baseadas nos resultados
    if (this.summaryMetrics.byVariant['progressive'] && this.summaryMetrics.byVariant['basic']) {
      const progressiveAvg = this.summaryMetrics.byVariant['progressive'].avgTime;
      const basicAvg = this.summaryMetrics.byVariant['basic'].avgTime;
      const percentDiff = ((basicAvg - progressiveAvg) / basicAvg * 100).toFixed(1);
      
      if (progressiveAvg < basicAvg) {
        markdown += `A renderização progressiva mostrou-se ${percentDiff}% mais rápida que a renderização básica. `;
      } else {
        markdown += `Embora a renderização progressiva tenha consumido mais recursos em alguns casos, ela oferece uma melhor experiência ao usuário. `;
      }
    }
    
    markdown += `\nPara templates extremamente grandes, recomenda-se implementar as otimizações sugeridas neste relatório para garantir a melhor performance possível.`;
    
    return markdown;
  }

  /**
   * Retorna uma cor para cada variante de otimização
   * @param {string} variant - Nome da variante
   * @param {number} alpha - Valor de transparência (0-1)
   * @returns {string} Cor em formato rgba()
   * @private
   */
  _getColorForVariant(variant, alpha = 1) {
    const colorMap = {
      'basic': `rgba(54, 162, 235, ${alpha})`,       // azul
      'chunked': `rgba(255, 99, 132, ${alpha})`,     // vermelho
      'progressive': `rgba(75, 192, 192, ${alpha})`, // verde
      'streaming': `rgba(255, 159, 64, ${alpha})`,   // laranja
      'optimized': `rgba(153, 102, 255, ${alpha})`   // roxo
    };
    
    return colorMap[variant] || `rgba(201, 203, 207, ${alpha})`; // cinza para outros
  }
}

/**
 * Função principal para executar os testes
 */
async function runExtremeTests() {
  try {
    logger.info('Iniciando testes para templates extremamente grandes...');
    
    const runner = new ExtremeTemplateTestRunner({
      forceRegenerate: false // Mudar para true se quiser gerar novos templates
    });
    
    await runner.initialize();
    await runner.runAllTests();
    
    logger.success('Todos os testes concluídos com sucesso!');
  } catch (error) {
    logger.error(`Erro ao executar testes: ${error.message}`);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  runExtremeTests();
}

module.exports = ExtremeTemplateTestRunner;
