/**
 * Load Test Runner para o Renderizador Progressivo
 * 
 * Este script executa testes de carga no renderizador progressivo usando
 * templates de diferentes complexidades e características, analisando o desempenho
 * em várias condições e gerando relatórios detalhados.
 * 
 * @author PHP Universal MCP Server Team
 * @version 1.0.0
 */

const fs = require('fs').promises;
const path = require('path');
const { performance } = require('perf_hooks');
const os = require('os');
const v8 = require('v8');

// Importar componentes necessários
const TemplateGenerator = require('./template-generator');
const ProgressiveRenderer = require('../../modules/design/renderers/progressive-renderer');
const PerformanceOptimizer = require('../../modules/design/renderers/performance-optimizer');
const MemoryOptimizer = require('../../modules/design/renderers/memory-optimizer');
const EnhancedProgressiveRenderer = require('../../modules/design/renderers/enhanced-progressive-renderer');

// Configurar sistema de logging
const logger = {
  info: (...args) => console.log('\x1b[36m[INFO]\x1b[0m', ...args),
  debug: (...args) => console.log('\x1b[35m[DEBUG]\x1b[0m', ...args),
  error: (...args) => console.error('\x1b[31m[ERROR]\x1b[0m', ...args),
  success: (...args) => console.log('\x1b[32m[SUCCESS]\x1b[0m', ...args),
  warn: (...args) => console.warn('\x1b[33m[WARN]\x1b[0m', ...args),
  metric: (...args) => console.log('\x1b[34m[METRIC]\x1b[0m', ...args)
};

/**
 * Executor de testes de carga
 */
class LoadTestRunner {
  constructor(options = {}) {
    this.options = {
      outputDir: path.join(__dirname, 'test-results'),
      templateDir: path.join(__dirname, 'generated-templates'),
      iterations: 5, // Número de iterações para cada teste
      timeoutMs: 60000, // Timeout máximo para cada teste (1 minuto)
      logMemoryUsage: true,
      generateHtmlReport: true,
      testEdgeCases: true,
      compareRenderers: true, // Comparar diferentes renderizadores
      ...options
    };

    this.testResults = [];
    this.renderer = new ProgressiveRenderer();
    this.enhancedRenderer = new EnhancedProgressiveRenderer();
    this.performanceOptimizer = new PerformanceOptimizer();
    this.memoryOptimizer = new MemoryOptimizer();
    this.templateGenerator = new TemplateGenerator({
      outputDir: this.options.templateDir
    });
  }

  /**
   * Inicializa o executor de testes
   */
  async initialize() {
    try {
      // Garantir que os diretórios existam
      await fs.mkdir(this.options.outputDir, { recursive: true });
      
      // Inicializar gerador de templates
      await this.templateGenerator.initialize();
      
      logger.success('LoadTestRunner inicializado com sucesso');
    } catch (error) {
      logger.error('Erro ao inicializar LoadTestRunner:', error);
      throw error;
    }
  }

  /**
   * Executa todos os testes de carga
   */
  async runAllTests() {
    logger.info('Iniciando testes de carga para o renderizador progressivo');
    const startTime = performance.now();
    
    try {
      // Gerar templates se necessário
      await this.ensureTemplatesExist();
      
      // Executar testes para cada template
      await this.testTemplatePerformance('extreme-large.html');
      await this.testTemplatePerformance('ultra-large.html');
      await this.testTemplatePerformance('monster-large.html');
      
      // Testes adicionais para casos extremos
      if (this.options.testEdgeCases) {
        await this.testTemplatePerformance('edge-cases.html');
        await this.testMemoryConsumption();
        await this.testConcurrentRendering();
      }
      
      // Comparar diferentes renderizadores
      if (this.options.compareRenderers) {
        await this.compareRenderers();
      }
      
      // Gerar relatório final
      await this.generateReport();
      
      const endTime = performance.now();
      logger.success(`Testes de carga concluídos em ${((endTime - startTime) / 1000).toFixed(2)} segundos`);
    } catch (error) {
      logger.error('Erro ao executar testes de carga:', error);
      throw error;
    }
  }

  /**
   * Garante que os templates necessários existam, gerando-os se necessário
   */
  async ensureTemplatesExist() {
    const requiredTemplates = [
      'extreme-large.html',
      'ultra-large.html',
      'monster-large.html',
      'edge-cases.html'
    ];
    
    try {
      // Verificar se os templates já existem
      const existingFiles = await fs.readdir(this.options.templateDir).catch(() => []);
      const missingTemplates = requiredTemplates.filter(name => 
        !existingFiles.includes(name));
      
      if (missingTemplates.length === 0) {
        logger.info('Todos os templates necessários já existem');
        return;
      }
      
      // Gerar templates faltantes
      logger.info(`Gerando ${missingTemplates.length} templates faltantes...`);
      
      if (missingTemplates.includes('extreme-large.html')) {
        await this.templateGenerator.generateLargeTemplate('extreme-large', 500);
      }
      
      if (missingTemplates.includes('ultra-large.html')) {
        await this.templateGenerator.generateLargeTemplate('ultra-large', 1000);
      }
      
      if (missingTemplates.includes('monster-large.html')) {
        await this.templateGenerator.generateLargeTemplate('monster-large', 2000);
      }
      
      if (missingTemplates.includes('edge-cases.html')) {
        await this.templateGenerator.generateLargeTemplate('edge-cases', 500);
      }
      
      logger.success('Todos os templates necessários foram gerados');
    } catch (error) {
      logger.error('Erro ao verificar ou gerar templates:', error);
      throw error;
    }
  }

  /**
   * Testa o desempenho do renderizador com um template específico
   * @param {string} templateName - Nome do arquivo de template a ser testado
   */
  async testTemplatePerformance(templateName) {
    logger.info(`Testando desempenho com template: ${templateName}`);
    
    try {
      // Carregar template
      const templatePath = path.join(this.options.templateDir, templateName);
      const templateContent = await fs.readFile(templatePath, 'utf8');
      
      // Preparar resultado do teste
      const testResult = {
        templateName,
        templateSize: templateContent.length,
        iterations: [],
        averageRenderTime: 0,
        maxRenderTime: 0,
        minRenderTime: Infinity,
        memoryUsage: []
      };
      
      // Executar múltiplas iterações para obter médias
      for (let i = 0; i < this.options.iterations; i++) {
        logger.debug(`Executando iteração ${i + 1}/${this.options.iterations}`);
        
        // Limpar cache e garbage collector antes de cada teste
        if (global.gc) {
          global.gc();
        }
        
        // Registrar uso de memória antes
        const memoryBefore = process.memoryUsage();
        
        // Executar renderização com timeout
        const startTime = performance.now();
        
        try {
          // Criar promise com timeout
          const renderPromise = this.renderer.render(templateContent, {});
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Timeout de renderização')), this.options.timeoutMs);
          });
          
          // Esperar pela primeira promise a resolver/rejeitar
          await Promise.race([renderPromise, timeoutPromise]);
          
          const endTime = performance.now();
          const renderTime = endTime - startTime;
          
          // Registrar uso de memória depois
          const memoryAfter = process.memoryUsage();
          const memoryDelta = {
            rss: memoryAfter.rss - memoryBefore.rss,
            heapTotal: memoryAfter.heapTotal - memoryBefore.heapTotal,
            heapUsed: memoryAfter.heapUsed - memoryBefore.heapUsed,
            external: memoryAfter.external - memoryBefore.external
          };
          
          // Adicionar resultados desta iteração
          testResult.iterations.push({
            iteration: i + 1,
            renderTime,
            memoryDelta
          });
          
          // Atualizar estatísticas
          testResult.minRenderTime = Math.min(testResult.minRenderTime, renderTime);
          testResult.maxRenderTime = Math.max(testResult.maxRenderTime, renderTime);
          testResult.memoryUsage.push(memoryDelta);
          
          logger.metric(`Iteração ${i + 1}: ${renderTime.toFixed(2)}ms, +${(memoryDelta.heapUsed / 1024 / 1024).toFixed(2)}MB heap`);
        } catch (error) {
          logger.error(`Erro na iteração ${i + 1}:`, error);
          
          // Registrar falha
          testResult.iterations.push({
            iteration: i + 1,
            error: error.message,
            failed: true
          });
        }
        
        // Curto intervalo entre iterações para estabilizar
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Calcular médias e estatísticas
      const successfulIterations = testResult.iterations.filter(it => !it.failed);
      if (successfulIterations.length > 0) {
        testResult.averageRenderTime = successfulIterations.reduce((sum, it) => sum + it.renderTime, 0) / successfulIterations.length;
        
        // Calcular média de uso de memória
        testResult.averageMemoryUsage = {
          rss: testResult.memoryUsage.reduce((sum, delta) => sum + delta.rss, 0) / testResult.memoryUsage.length,
          heapTotal: testResult.memoryUsage.reduce((sum, delta) => sum + delta.heapTotal, 0) / testResult.memoryUsage.length,
          heapUsed: testResult.memoryUsage.reduce((sum, delta) => sum + delta.heapUsed, 0) / testResult.memoryUsage.length,
          external: testResult.memoryUsage.reduce((sum, delta) => sum + delta.external, 0) / testResult.memoryUsage.length
        };
      }
      
      // Adicionar aos resultados gerais
      this.testResults.push(testResult);
      
      // Salvar resultados parciais
      await this.saveTestResult(testResult);
      
      logger.success(`Teste concluído para ${templateName}: ${testResult.averageRenderTime.toFixed(2)}ms (média)`);
    } catch (error) {
      logger.error(`Erro ao testar template ${templateName}:`, error);
      throw error;
    }
  }

  /**
   * Testa o consumo de memória em condições extremas
   */
  async testMemoryConsumption() {
    logger.info('Testando consumo de memória em condições extremas');
    
    try {
      // Carregar o template mais pesado
      const templatePath = path.join(this.options.templateDir, 'monster-large.html');
      const templateContent = await fs.readFile(templatePath, 'utf8');
      
      // Preparar resultado do teste
      const testResult = {
        testName: 'memory-consumption',
        iterations: [],
        maxHeapUsed: 0,
        maxRss: 0
      };
      
      // Limpar memória antes do teste
      if (global.gc) {
        global.gc();
      }
      
      // Registrar linha base de memória
      const baselineMemory = process.memoryUsage();
      testResult.baselineMemory = {
        rss: baselineMemory.rss,
        heapTotal: baselineMemory.heapTotal,
        heapUsed: baselineMemory.heapUsed,
        external: baselineMemory.external
      };
      
      // Executar teste de memória - renderizar múltiplas vezes sem liberar
      const renderPromises = [];
      for (let i = 0; i < 3; i++) {
        logger.debug(`Iniciando renderização concorrente ${i + 1}/3`);
        
        const startTime = performance.now();
        const renderPromise = this.memoryOptimizer.optimizeMemoryUsage(
          () => this.renderer.render(templateContent, {}),
          { aggressive: i === 2 } // Teste mais agressivo na última iteração
        ).then(() => {
          const endTime = performance.now();
          const currentMemory = process.memoryUsage();
          
          // Registrar resultados da iteração
          testResult.iterations.push({
            iteration: i + 1,
            renderTime: endTime - startTime,
            memoryUsage: {
              rss: currentMemory.rss,
              heapTotal: currentMemory.heapTotal,
              heapUsed: currentMemory.heapUsed,
              external: currentMemory.external
            }
          });
          
          // Atualizar máximos
          testResult.maxHeapUsed = Math.max(testResult.maxHeapUsed, currentMemory.heapUsed);
          testResult.maxRss = Math.max(testResult.maxRss, currentMemory.rss);
          
          logger.metric(`Renderização ${i + 1} concluída: ${(endTime - startTime).toFixed(2)}ms, Heap: ${(currentMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
        });
        
        renderPromises.push(renderPromise);
        
        // Pequeno intervalo para iniciar próxima renderização
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Aguardar todas as renderizações
      await Promise.all(renderPromises);
      
      // Registrar uso final de memória
      const finalMemory = process.memoryUsage();
      testResult.finalMemory = {
        rss: finalMemory.rss,
        heapTotal: finalMemory.heapTotal,
        heapUsed: finalMemory.heapUsed,
        external: finalMemory.external
      };
      
      // Estatísticas de consumo de memória
      testResult.memoryIncrease = {
        rss: finalMemory.rss - baselineMemory.rss,
        heapTotal: finalMemory.heapTotal - baselineMemory.heapTotal,
        heapUsed: finalMemory.heapUsed - baselineMemory.heapUsed,
        external: finalMemory.external - baselineMemory.external
      };
      
      // Adicionar aos resultados gerais
      this.testResults.push(testResult);
      
      // Salvar resultados
      await this.saveTestResult(testResult);
      
      logger.success(`Teste de consumo de memória concluído: Pico de ${(testResult.maxHeapUsed / 1024 / 1024).toFixed(2)}MB heap`);
    } catch (error) {
      logger.error('Erro ao testar consumo de memória:', error);
      throw error;
    }
  }

  /**
   * Testa renderização concorrente para avaliar desempenho sob carga
   */
  async testConcurrentRendering() {
    logger.info('Testando renderização concorrente para avaliar desempenho sob carga');
    
    try {
      // Carregar diferentes templates
      const templatePaths = [
        path.join(this.options.templateDir, 'extreme-large.html'),
        path.join(this.options.templateDir, 'ultra-large.html'),
        path.join(this.options.templateDir, 'edge-cases.html')
      ];
      
      const templates = await Promise.all(
        templatePaths.map(tPath => fs.readFile(tPath, 'utf8'))
      );
      
      // Preparar resultado do teste
      const testResult = {
        testName: 'concurrent-rendering',
        templateCount: templates.length,
        startTime: performance.now(),
        renderings: []
      };
      
      // Limpar memória antes do teste
      if (global.gc) {
        global.gc();
      }
      
      // Executar renderizações concorrentes
      const renderPromises = templates.map((template, index) => {
        const templateStartTime = performance.now();
        
        return this.renderer.render(template, {}).then(() => {
          const templateEndTime = performance.now();
          const renderTime = templateEndTime - templateStartTime;
          
          // Registrar resultados dessa renderização
          testResult.renderings.push({
            templateIndex: index,
            templateSize: template.length,
            renderTime,
            completed: true
          });
          
          logger.metric(`Renderização concorrente ${index + 1}/${templates.length} concluída: ${renderTime.toFixed(2)}ms`);
        }).catch(error => {
          logger.error(`Erro na renderização concorrente ${index + 1}:`, error);
          
          testResult.renderings.push({
            templateIndex: index,
            templateSize: template.length,
            error: error.message,
            completed: false
          });
        });
      });
      
      // Aguardar todas as renderizações
      await Promise.all(renderPromises);
      
      // Finalizar resultados
      testResult.endTime = performance.now();
      testResult.totalTime = testResult.endTime - testResult.startTime;
      testResult.successCount = testResult.renderings.filter(r => r.completed).length;
      testResult.failCount = testResult.renderings.filter(r => !r.completed).length;
      
      // Adicionar aos resultados gerais
      this.testResults.push(testResult);
      
      // Salvar resultados
      await this.saveTestResult(testResult);
      
      logger.success(`Teste de renderização concorrente concluído: ${testResult.successCount}/${testResult.templateCount} sucesso, tempo total: ${(testResult.totalTime).toFixed(2)}ms`);
    } catch (error) {
      logger.error('Erro ao testar renderização concorrente:', error);
      throw error;
    }
  }

  /**
   * Compara o desempenho de diferentes implementações de renderizadores
   */
  async compareRenderers() {
    logger.info('Comparando desempenho de diferentes implementações de renderizadores');
    
    try {
      // Definir renderizadores a comparar
      const renderers = [
        { name: 'ProgressiveRenderer', instance: this.renderer },
        { name: 'EnhancedProgressiveRenderer', instance: this.enhancedRenderer },
        { name: 'PerformanceOptimizer', instance: this.performanceOptimizer }
      ];
      
      // Carregar um template para teste
      const templatePath = path.join(this.options.templateDir, 'ultra-large.html');
      const templateContent = await fs.readFile(templatePath, 'utf8');
      
      // Preparar resultado do teste
      const testResult = {
        testName: 'renderer-comparison',
        templateSize: templateContent.length,
        comparisons: []
      };
      
      // Testar cada renderizador
      for (const renderer of renderers) {
        logger.debug(`Testando renderizador: ${renderer.name}`);
        
        // Limpar memória antes do teste
        if (global.gc) {
          global.gc();
        }
        
        const memoryBefore = process.memoryUsage();
        const startTime = performance.now();
        
        try {
          // Método de renderização pode variar entre implementações
          if (renderer.name === 'PerformanceOptimizer') {
            await renderer.instance.optimizeTemplate(templateContent, {});
          } else {
            await renderer.instance.render(templateContent, {});
          }
          
          const endTime = performance.now();
          const renderTime = endTime - startTime;
          
          // Registrar uso de memória depois
          const memoryAfter = process.memoryUsage();
          const memoryDelta = {
            rss: memoryAfter.rss - memoryBefore.rss,
            heapTotal: memoryAfter.heapTotal - memoryBefore.heapTotal,
            heapUsed: memoryAfter.heapUsed - memoryBefore.heapUsed,
            external: memoryAfter.external - memoryBefore.external
          };
          
          // Adicionar resultados
          testResult.comparisons.push({
            renderer: renderer.name,
            renderTime,
            memoryDelta,
            successful: true
          });
          
          logger.metric(`${renderer.name}: ${renderTime.toFixed(2)}ms, +${(memoryDelta.heapUsed / 1024 / 1024).toFixed(2)}MB heap`);
        } catch (error) {
          logger.error(`Erro ao testar ${renderer.name}:`, error);
          
          testResult.comparisons.push({
            renderer: renderer.name,
            error: error.message,
            successful: false
          });
        }
        
        // Intervalo entre testes
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Identificar o melhor renderizador por desempenho
      const successfulComparisons = testResult.comparisons.filter(c => c.successful);
      if (successfulComparisons.length > 0) {
        const fastestRenderer = successfulComparisons.reduce((fastest, current) => 
          current.renderTime < fastest.renderTime ? current : fastest, successfulComparisons[0]);
        
        const mostMemoryEfficient = successfulComparisons.reduce((efficient, current) => 
          current.memoryDelta.heapUsed < efficient.memoryDelta.heapUsed ? current : efficient, successfulComparisons[0]);
        
        testResult.fastestRenderer = fastestRenderer.renderer;
        testResult.mostMemoryEfficient = mostMemoryEfficient.renderer;
      }
      
      // Adicionar aos resultados gerais
      this.testResults.push(testResult);
      
      // Salvar resultados
      await this.saveTestResult(testResult);
      
      logger.success('Comparação de renderizadores concluída');
      if (testResult.fastestRenderer) {
        logger.info(`Renderizador mais rápido: ${testResult.fastestRenderer}`);
        logger.info(`Renderizador mais eficiente em memória: ${testResult.mostMemoryEfficient}`);
      }
    } catch (error) {
      logger.error('Erro ao comparar renderizadores:', error);
      throw error;
    }
  }

  /**
   * Salva o resultado de um teste específico
   * @param {Object} testResult - Resultado do teste a ser salvo
   */
  async saveTestResult(testResult) {
    try {
      const fileName = testResult.templateName || testResult.testName;
      const filePath = path.join(this.options.outputDir, `${fileName}-result.json`);
      
      await fs.writeFile(filePath, JSON.stringify(testResult, null, 2));
      logger.debug(`Resultados do teste salvos em: ${filePath}`);
    } catch (error) {
      logger.error('Erro ao salvar resultados do teste:', error);
    }
  }

  /**
   * Gera relatório final com resultados dos testes
   */
  async generateReport() {
    logger.info('Gerando relatório final dos testes de carga');
    
    try {
      // Preparar dados do relatório
      const reportData = {
        timestamp: new Date().toISOString(),
        systemInfo: {
          platform: os.platform(),
          arch: os.arch(),
          cpus: os.cpus().length,
          totalMemory: os.totalmem(),
          freeMemory: os.freemem(),
          nodeVersion: process.version,
          v8HeapStats: v8.getHeapStatistics()
        },
        testSummary: {
          totalTests: this.testResults.length,
          templateTests: this.testResults.filter(r => r.templateName).length,
          specialTests: this.testResults.filter(r => r.testName).length
        },
        results: this.testResults,
        performance: this.analyzePerformance(),
        recommendations: this.generateRecommendations()
      };
      
      // Salvar relatório em JSON
      const jsonPath = path.join(this.options.outputDir, 'load-test-report.json');
      await fs.writeFile(jsonPath, JSON.stringify(reportData, null, 2));
      
      // Gerar relatório HTML se necessário
      if (this.options.generateHtmlReport) {
        const htmlPath = path.join(this.options.outputDir, 'load-test-report.html');
        await fs.writeFile(htmlPath, this.generateHtmlReport(reportData));
        logger.success(`Relatório HTML gerado em: ${htmlPath}`);
      }
      
      logger.success(`Relatório final gerado em: ${jsonPath}`);
    } catch (error) {
      logger.error('Erro ao gerar relatório:', error);
      throw error;
    }
  }

  /**
   * Analisa os resultados dos testes para identificar padrões de desempenho
   * @returns {Object} Análise de desempenho
   */
  analyzePerformance() {
    const templateTests = this.testResults.filter(r => r.templateName);
    
    // Calcular relação entre tamanho do template e tempo de renderização
    const sizeVsTimeData = templateTests.map(test => ({
      templateName: test.templateName,
      size: test.templateSize,
      averageTime: test.averageRenderTime
    }));
    
    // Calcular coeficiente de correlação se houver dados suficientes
    let sizeTimeCorrelation = null;
    if (sizeVsTimeData.length >= 3) {
      const sizes = sizeVsTimeData.map(d => d.size);
      const times = sizeVsTimeData.map(d => d.averageTime);
      sizeTimeCorrelation = this.calculateCorrelation(sizes, times);
    }
    
    // Identificar possíveis gargalos
    const bottlenecks = [];
    
    // Verificar tempo médio de renderização
    const slowTemplates = templateTests.filter(t => t.averageRenderTime > 5000);
    if (slowTemplates.length > 0) {
      bottlenecks.push({
        type: 'render-time',
        description: `${slowTemplates.length} templates com tempo médio de renderização acima de 5 segundos`,
        affectedTemplates: slowTemplates.map(t => t.templateName)
      });
    }
    
    // Verificar uso de memória
    const memoryIntensiveTemplates = templateTests.filter(t => 
      t.averageMemoryUsage && t.averageMemoryUsage.heapUsed > 500 * 1024 * 1024);
    
    if (memoryIntensiveTemplates.length > 0) {
      bottlenecks.push({
        type: 'memory-usage',
        description: `${memoryIntensiveTemplates.length} templates com uso de memória acima de 500MB`,
        affectedTemplates: memoryIntensiveTemplates.map(t => t.templateName)
      });
    }
    
    // Verificar falhas de renderização
    const failedTemplates = this.testResults.filter(t => {
      if (t.iterations) {
        const failedIterations = t.iterations.filter(i => i.failed);
        return failedIterations.length > 0;
      }
      return false;
    });
    
    if (failedTemplates.length > 0) {
      bottlenecks.push({
        type: 'render-failures',
        description: `${failedTemplates.length} templates com falhas de renderização`,
        affectedTemplates: failedTemplates.map(t => t.templateName || t.testName)
      });
    }
    
    return {
      sizeVsTimeData,
      sizeTimeCorrelation,
      bottlenecks,
      averageRenderTimes: templateTests.map(t => ({
        template: t.templateName,
        average: t.averageRenderTime,
        min: t.minRenderTime,
        max: t.maxRenderTime
      })),
      memoryUsage: templateTests
        .filter(t => t.averageMemoryUsage)
        .map(t => ({
          template: t.templateName,
          heapUsed: t.averageMemoryUsage.heapUsed,
          rss: t.averageMemoryUsage.rss
        }))
    };
  }

  /**
   * Gera recomendações baseadas nos resultados dos testes
   * @returns {Array} Lista de recomendações
   */
  generateRecommendations() {
    const recommendations = [];
    const performance = this.analyzePerformance();
    
    // Recomendações baseadas em bottlenecks identificados
    if (performance.bottlenecks.length > 0) {
      for (const bottleneck of performance.bottlenecks) {
        switch (bottleneck.type) {
          case 'render-time':
            recommendations.push({
              priority: 'high',
              area: 'performance',
              description: 'Implementar divisão de template para templates grandes',
              details: 'Os templates identificados como lentos poderiam ser divididos em fragmentos menores que são renderizados de forma independente.'
            });
            
            recommendations.push({
              priority: 'medium',
              area: 'performance',
              description: 'Implementar cache por componente mais granular',
              details: 'Armazenar em cache componentes individuais pode melhorar significativamente a velocidade de renderização de templates grandes.'
            });
            break;
            
          case 'memory-usage':
            recommendations.push({
              priority: 'high',
              area: 'memory',
              description: 'Implementar estratégia de streaming para renderização de templates grandes',
              details: 'Adotar uma abordagem de streaming para templates grandes pode reduzir significativamente o uso de memória.'
            });
            
            recommendations.push({
              priority: 'medium',
              area: 'memory',
              description: 'Otimizar estruturas de dados durante a renderização',
              details: 'Revisar as estruturas de dados usadas durante a renderização para reduzir sobrecarga de memória.'
            });
            break;
            
          case 'render-failures':
            recommendations.push({
              priority: 'critical',
              area: 'reliability',
              description: 'Implementar mecanismos robustos de fallback e recuperação de erros',
              details: 'Os templates com falhas de renderização precisam de mecanismos mais robustos de fallback para garantir que algum conteúdo seja sempre renderizado.'
            });
            break;
        }
      }
    }
    
    // Recomendação baseada na correlação tamanho vs. tempo
    if (performance.sizeTimeCorrelation !== null) {
      if (performance.sizeTimeCorrelation > 0.9) {
        recommendations.push({
          priority: 'medium',
          area: 'scalability',
          description: 'O tempo de renderização escala linearmente com o tamanho do template',
          details: 'Considerar a implementação de divisão automática de templates com base no tamanho para manter tempos de renderização consistentes.'
        });
      }
    }
    
    // Verificar comparação de renderizadores
    const rendererComparison = this.testResults.find(r => r.testName === 'renderer-comparison');
    if (rendererComparison && rendererComparison.fastestRenderer) {
      if (rendererComparison.fastestRenderer !== 'ProgressiveRenderer') {
        recommendations.push({
          priority: 'high',
          area: 'implementation',
          description: `Migrar para ${rendererComparison.fastestRenderer} para melhor desempenho`,
          details: `Os testes mostraram que ${rendererComparison.fastestRenderer} teve desempenho superior ao renderizador atual.`
        });
      }
      
      if (rendererComparison.mostMemoryEfficient !== rendererComparison.fastestRenderer) {
        recommendations.push({
          priority: 'medium',
          area: 'implementation',
          description: `Considerar estratégias de otimização de memória de ${rendererComparison.mostMemoryEfficient}`,
          details: `${rendererComparison.mostMemoryEfficient} mostrou melhor eficiência de memória, considerar incorporar suas estratégias no renderizador principal.`
        });
      }
    }
    
    return recommendations;
  }

  /**
   * Calcula o coeficiente de correlação entre dois conjuntos de dados
   * @param {Array} x - Primeiro conjunto de dados
   * @param {Array} y - Segundo conjunto de dados
   * @returns {number} Coeficiente de correlação
   */
  calculateCorrelation(x, y) {
    if (x.length !== y.length) {
      return null;
    }
    
    const n = x.length;
    
    // Calcular médias
    const xMean = x.reduce((sum, val) => sum + val, 0) / n;
    const yMean = y.reduce((sum, val) => sum + val, 0) / n;
    
    // Calcular variância e covariância
    let ssxx = 0;
    let ssyy = 0;
    let ssxy = 0;
    
    for (let i = 0; i < n; i++) {
      const xDiff = x[i] - xMean;
      const yDiff = y[i] - yMean;
      
      ssxx += xDiff * xDiff;
      ssyy += yDiff * yDiff;
      ssxy += xDiff * yDiff;
    }
    
    // Calcular coeficiente de correlação
    return ssxy / Math.sqrt(ssxx * ssyy);
  }

  /**
   * Gera um relatório HTML a partir dos dados de resultados
   * @param {Object} reportData - Dados do relatório
   * @returns {string} Relatório HTML formatado
   */
  generateHtmlReport(reportData) {
    const formatBytes = (bytes) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };
    
    const formatMs = (ms) => {
      if (ms < 1000) return ms.toFixed(2) + ' ms';
      return (ms / 1000).toFixed(2) + ' s';
    };
    
    // Construir HTML do relatório
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>PHP Universal MCP Server - Relatório de Testes de Carga</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 20px;
          background-color: #f8f9fa;
        }
        
        .container {
          max-width: 1200px;
          margin: 0 auto;
          background-color: #fff;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        
        h1, h2, h3 {
          color: #0366d6;
        }
        
        .header {
          border-bottom: 1px solid #e1e4e8;
          margin-bottom: 20px;
          padding-bottom: 10px;
        }
        
        .timestamp {
          color: #6a737d;
          font-size: 0.9em;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
          font-size: 0.9em;
        }
        
        th, td {
          padding: 10px;
          border: 1px solid #e1e4e8;
          text-align: left;
        }
        
        th {
          background-color: #f6f8fa;
        }
        
        tr:nth-child(even) {
          background-color: #f8f9fa;
        }
        
        .card {
          border: 1px solid #e1e4e8;
          border-radius: 6px;
          padding: 16px;
          margin-bottom: 16px;
        }
        
        .card-title {
          margin-top: 0;
          font-size: 1.1em;
          color: #24292e;
        }
        
        .card-content {
          margin-bottom: 0;
        }
        
        .badge {
          display: inline-block;
          padding: 4px 8px;
          font-size: 0.75em;
          font-weight: 600;
          border-radius: 4px;
          margin-right: 4px;
        }
        
        .badge-critical {
          background-color: #d73a49;
          color: white;
        }
        
        .badge-high {
          background-color: #f9c513;
          color: #24292e;
        }
        
        .badge-medium {
          background-color: #0366d6;
          color: white;
        }
        
        .badge-low {
          background-color: #28a745;
          color: white;
        }
        
        .chart-container {
          height: 300px;
          margin-bottom: 20px;
        }
        
        .bottleneck-item {
          background-color: #fffbdd;
          border-left: 4px solid #f9c513;
          padding: 10px 15px;
          margin-bottom: 10px;
        }
        
        footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e1e4e8;
          text-align: center;
          font-size: 0.9em;
          color: #6a737d;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <header class="header">
          <h1>PHP Universal MCP Server</h1>
          <h2>Relatório de Testes de Carga do Renderizador Progressivo</h2>
          <p class="timestamp">Gerado em ${new Date(reportData.timestamp).toLocaleString()}</p>
        </header>
        
        <section>
          <h3>Informações do Sistema</h3>
          <table>
            <tr>
              <th>Plataforma</th>
              <td>${reportData.systemInfo.platform} (${reportData.systemInfo.arch})</td>
            </tr>
            <tr>
              <th>CPUs</th>
              <td>${reportData.systemInfo.cpus}</td>
            </tr>
            <tr>
              <th>Memória Total</th>
              <td>${formatBytes(reportData.systemInfo.totalMemory)}</td>
            </tr>
            <tr>
              <th>Memória Livre</th>
              <td>${formatBytes(reportData.systemInfo.freeMemory)}</td>
            </tr>
            <tr>
              <th>Node.js Version</th>
              <td>${reportData.systemInfo.nodeVersion}</td>
            </tr>
            <tr>
              <th>Heap Size Limit</th>
              <td>${formatBytes(reportData.systemInfo.v8HeapStats.heap_size_limit)}</td>
            </tr>
          </table>
        </section>
        
        <section>
          <h3>Resumo dos Testes</h3>
          <p>Total de ${reportData.testSummary.totalTests} testes executados, incluindo ${reportData.testSummary.templateTests} testes de templates e ${reportData.testSummary.specialTests} testes especiais.</p>
          
          <h4>Tempos Médios de Renderização</h4>
          <table>
            <thead>
              <tr>
                <th>Template</th>
                <th>Tamanho</th>
                <th>Média</th>
                <th>Mínimo</th>
                <th>Máximo</th>
              </tr>
            </thead>
            <tbody>
              ${reportData.results
                .filter(r => r.templateName)
                .map(r => `
                  <tr>
                    <td>${r.templateName}</td>
                    <td>${formatBytes(r.templateSize)}</td>
                    <td>${formatMs(r.averageRenderTime)}</td>
                    <td>${formatMs(r.minRenderTime)}</td>
                    <td>${formatMs(r.maxRenderTime)}</td>
                  </tr>
                `).join('')}
            </tbody>
          </table>
          
          ${reportData.results.find(r => r.testName === 'renderer-comparison') ? `
            <h4>Comparação de Renderizadores</h4>
            <table>
              <thead>
                <tr>
                  <th>Renderizador</th>
                  <th>Tempo</th>
                  <th>Memória</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${reportData.results
                  .find(r => r.testName === 'renderer-comparison')
                  .comparisons.map(c => `
                    <tr>
                      <td>${c.renderer}</td>
                      <td>${c.successful ? formatMs(c.renderTime) : 'N/A'}</td>
                      <td>${c.successful ? formatBytes(c.memoryDelta.heapUsed) : 'N/A'}</td>
                      <td>${c.successful ? 'Sucesso' : 'Falha'}</td>
                    </tr>
                  `).join('')}
              </tbody>
            </table>
          ` : ''}
        </section>
        
        <section>
          <h3>Gargalos Identificados</h3>
          ${reportData.performance.bottlenecks.length === 0 ? 
            '<p>Nenhum gargalo significativo identificado.</p>' : 
            reportData.performance.bottlenecks.map(b => `
              <div class="bottleneck-item">
                <h4>${b.description}</h4>
                <p>Tipo: ${b.type}</p>
                <p>Templates afetados: ${b.affectedTemplates.join(', ')}</p>
              </div>
            `).join('')}
        </section>
        
        <section>
          <h3>Recomendações</h3>
          ${reportData.recommendations.map(r => `
            <div class="card">
              <h4 class="card-title">
                <span class="badge badge-${r.priority}">${r.priority}</span>
                ${r.description}
              </h4>
              <p class="card-content">${r.details}</p>
            </div>
          `).join('')}
        </section>
        
        <footer>
          <p>PHP Universal MCP Server - Teste de carga do renderizador progressivo</p>
          <p>Gerado automaticamente pelo LoadTestRunner</p>
        </footer>
      </div>
    </body>
    </html>
    `;
  }
}

/**
 * Função principal para executar testes de carga
 */
async function runLoadTests() {
  try {
    logger.info('Iniciando testes de carga para o renderizador progressivo...');
    
    const testRunner = new LoadTestRunner();
    await testRunner.initialize();
    await testRunner.runAllTests();
    
    logger.success('Testes de carga concluídos com sucesso!');
  } catch (error) {
    logger.error('Erro ao executar testes de carga:', error);
    process.exit(1);
  }
}

// Executar os testes se este arquivo for executado diretamente
if (require.main === module) {
  runLoadTests();
}

module.exports = LoadTestRunner;
