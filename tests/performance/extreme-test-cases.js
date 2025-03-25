/**
 * Casos de Teste Extremos para Renderizador Progressivo
 * 
 * Este módulo contém testes específicos para avaliar o desempenho do renderizador
 * progressivo em condições extremas e casos de borda.
 * 
 * @author PHP Universal MCP Server Team
 * @version 1.0.0
 */

const fs = require('fs').promises;
const path = require('path');
const { JSDOM } = require('jsdom');
const EnhancedProgressiveRenderer = require('../../modules/design/renderers/enhanced-progressive-renderer');
const ProgressiveRenderer = require('../../modules/design/renderers/progressive-renderer');
const PerformanceOptimizer = require('../../modules/design/renderers/performance-optimizer');

// Configurar logger
const logger = {
  info: (...args) => console.log('\x1b[36m[EXTREME-TEST]\x1b[0m', ...args),
  debug: (...args) => console.log('\x1b[35m[EXTREME-TEST:DEBUG]\x1b[0m', ...args),
  error: (...args) => console.error('\x1b[31m[EXTREME-TEST:ERROR]\x1b[0m', ...args),
  success: (...args) => console.log('\x1b[32m[EXTREME-TEST:SUCCESS]\x1b[0m', ...args),
  warn: (...args) => console.warn('\x1b[33m[EXTREME-TEST:WARN]\x1b[0m', ...args),
  table: (data) => console.table(data)
};

/**
 * Classe para execução de testes extremos
 */
class ExtremeTestCases {
  /**
   * Construtor da classe
   * @param {Object} options - Opções de configuração
   */
  constructor(options = {}) {
    this.options = {
      templatesDir: path.join(__dirname, 'generated-templates'),
      outputDir: path.join(__dirname, 'extreme-test-results'),
      timeoutMs: 300000, // 5 minutos
      ...options
    };
    
    // Criar instâncias dos renderizadores
    this.enhancedRenderer = new EnhancedProgressiveRenderer({
      debug: options.debug || false
    });
    
    this.standardRenderer = new ProgressiveRenderer({
      debug: options.debug || false
    });
    
    this.performanceOptimizer = new PerformanceOptimizer({
      debug: options.debug || false
    });
    
    // Resultados dos testes
    this.results = {};
  }

  /**
   * Inicializa os testes
   */
  async initialize() {
    // Criar diretório de saída
    await fs.mkdir(this.options.outputDir, { recursive: true });
    
    // Verificar se o diretório de templates existe
    try {
      await fs.access(this.options.templatesDir);
    } catch (error) {
      throw new Error(`Diretório de templates não encontrado: ${this.options.templatesDir}`);
    }
    
    logger.success('ExtremeTestCases inicializado');
  }

  /**
   * Executa todos os testes extremos
   */
  async runAllTests() {
    try {
      logger.info('Iniciando todos os testes extremos...');
      
      // Executar testes em sequência
      await this.testDeepNesting();
      await this.testLargeDataSets();
      await this.testComplexConditionals();
      await this.testNestedComponents();
      await this.testRecursiveTemplates();
      await this.testMemoryLeakScenarios();
      await this.testConcurrentRendering();
      await this.testProgressiveStreamingWithAnimation();
      
      // Gerar relatório final
      await this._saveResults();
      
      logger.success('Todos os testes extremos concluídos com sucesso!');
      return this.results;
    } catch (error) {
      logger.error(`Erro ao executar todos os testes: ${error.message}`);
      throw error;
    }
  }

  /**
   * Teste 1: Aninhamento Profundo de Elementos
   * Avalia a capacidade do renderizador de lidar com árvores DOM profundamente aninhadas
   */
  async testDeepNesting() {
    logger.info('Executando teste de aninhamento profundo...');
    
    try {
      // Gerar template com aninhamento profundo (25 níveis)
      const template = this._generateDeepNestedTemplate(25);
      
      // Salvar template para referência
      await fs.writeFile(
        path.join(this.options.outputDir, 'deep-nesting-template.html'),
        template
      );
      
      // Testar renderizador aprimorado
      const enhancedStart = process.hrtime.bigint();
      const enhancedResult = await this._renderWithTimeout(
        this.enhancedRenderer.render.bind(this.enhancedRenderer),
        template,
        {}
      );
      const enhancedEnd = process.hrtime.bigint();
      const enhancedTime = Number(enhancedEnd - enhancedStart) / 1000000; // ms
      
      // Testar renderizador padrão
      const standardStart = process.hrtime.bigint();
      const standardResult = await this._renderWithTimeout(
        this.standardRenderer.render.bind(this.standardRenderer),
        template,
        {}
      );
      const standardEnd = process.hrtime.bigint();
      const standardTime = Number(standardEnd - standardStart) / 1000000; // ms
      
      // Calcular uso de memória
      const memoryStats = this.enhancedRenderer.getStats().memory;
      
      // Registrar resultados
      this.results.deepNesting = {
        name: 'Aninhamento Profundo',
        description: 'Template com elementos aninhados a 25 níveis de profundidade',
        templateSize: template.length,
        enhancedTime,
        standardTime,
        difference: enhancedTime - standardTime,
        percentDifference: ((enhancedTime - standardTime) / standardTime) * 100,
        memoryUsage: memoryStats.peakUsage,
        success: true,
        enhancedOutputSize: enhancedResult.length,
        standardOutputSize: standardResult.length
      };
      
      logger.success(`Teste de aninhamento profundo concluído: ${enhancedTime.toFixed(2)}ms vs ${standardTime.toFixed(2)}ms`);
      return this.results.deepNesting;
    } catch (error) {
      logger.error(`Erro no teste de aninhamento profundo: ${error.message}`);
      
      this.results.deepNesting = {
        name: 'Aninhamento Profundo',
        description: 'Template com elementos aninhados a 25 níveis de profundidade',
        error: error.message,
        success: false
      };
      
      return this.results.deepNesting;
    }
  }

  /**
   * Teste 2: Conjuntos de Dados Grandes
   * Avalia o desempenho com grandes volumes de dados (10.000+ itens)
   */
  async testLargeDataSets() {
    logger.info('Executando teste de conjuntos de dados grandes...');
    
    try {
      // Gerar template com tabela grande e muitos dados
      const data = {
        items: this._generateLargeDataSet(10000)
      };
      
      const template = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Large Data Test</title>
        </head>
        <body>
          <h1>Lista de Items (${data.items.length})</h1>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome</th>
                <th>Descrição</th>
                <th>Preço</th>
                <th>Estoque</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {{#each items}}
              <tr>
                <td>{{id}}</td>
                <td>{{name}}</td>
                <td>{{description}}</td>
                <td>{{price}}</td>
                <td>{{stock}}</td>
                <td>{{status}}</td>
              </tr>
              {{/each}}
            </tbody>
          </table>
        </body>
        </html>
      `;
      
      // Testar renderizador aprimorado
      const enhancedStart = process.hrtime.bigint();
      const enhancedResult = await this._renderWithTimeout(
        this.enhancedRenderer.render.bind(this.enhancedRenderer),
        template,
        data
      );
      const enhancedEnd = process.hrtime.bigint();
      const enhancedTime = Number(enhancedEnd - enhancedStart) / 1000000; // ms
      
      // Testar renderizador padrão
      const standardStart = process.hrtime.bigint();
      const standardResult = await this._renderWithTimeout(
        this.standardRenderer.render.bind(this.standardRenderer),
        template,
        data
      );
      const standardEnd = process.hrtime.bigint();
      const standardTime = Number(standardEnd - standardStart) / 1000000; // ms
      
      // Calcular uso de memória
      const memoryStats = this.enhancedRenderer.getStats().memory;
      
      // Registrar resultados
      this.results.largeDataSets = {
        name: 'Conjuntos de Dados Grandes',
        description: 'Template com 10.000 itens em uma tabela',
        templateSize: template.length,
        enhancedTime,
        standardTime,
        difference: enhancedTime - standardTime,
        percentDifference: ((enhancedTime - standardTime) / standardTime) * 100,
        memoryUsage: memoryStats.peakUsage,
        success: true,
        enhancedOutputSize: enhancedResult.length,
        standardOutputSize: standardResult.length
      };
      
      logger.success(`Teste de conjuntos de dados grandes concluído: ${enhancedTime.toFixed(2)}ms vs ${standardTime.toFixed(2)}ms`);
      return this.results.largeDataSets;
    } catch (error) {
      logger.error(`Erro no teste de conjuntos de dados grandes: ${error.message}`);
      
      this.results.largeDataSets = {
        name: 'Conjuntos de Dados Grandes',
        description: 'Template com 10.000 itens em uma tabela',
        error: error.message,
        success: false
      };
      
      return this.results.largeDataSets;
    }
  }

  /**
   * Teste 3: Condicionais Complexos
   * Avalia o desempenho com expressões condicionais aninhadas complexas
   */
  async testComplexConditionals() {
    logger.info('Executando teste de condicionais complexos...');
    
    try {
      // Gerar template com condicionais complexos (até 10 níveis de aninhamento)
      const template = this._generateComplexConditionalsTemplate();
      
      // Salvar template para referência
      await fs.writeFile(
        path.join(this.options.outputDir, 'complex-conditionals-template.html'),
        template
      );
      
      // Dados para renderização
      const data = {
        users: this._generateUserData(500),
        settings: {
          showAdmin: true,
          enableFilters: true,
          maxItems: 100,
          theme: 'dark',
          features: {
            advancedSearch: true,
            multiSort: true,
            export: {
              csv: true,
              pdf: false,
              excel: true
            }
          }
        }
      };
      
      // Testar renderizador aprimorado
      const enhancedStart = process.hrtime.bigint();
      const enhancedResult = await this._renderWithTimeout(
        this.enhancedRenderer.render.bind(this.enhancedRenderer),
        template,
        data
      );
      const enhancedEnd = process.hrtime.bigint();
      const enhancedTime = Number(enhancedEnd - enhancedStart) / 1000000; // ms
      
      // Testar renderizador padrão
      const standardStart = process.hrtime.bigint();
      const standardResult = await this._renderWithTimeout(
        this.standardRenderer.render.bind(this.standardRenderer),
        template,
        data
      );
      const standardEnd = process.hrtime.bigint();
      const standardTime = Number(standardEnd - standardStart) / 1000000; // ms
      
      // Calcular uso de memória
      const memoryStats = this.enhancedRenderer.getStats().memory;
      
      // Registrar resultados
      this.results.complexConditionals = {
        name: 'Condicionais Complexos',
        description: 'Template com condicionais aninhados complexos',
        templateSize: template.length,
        enhancedTime,
        standardTime,
        difference: enhancedTime - standardTime,
        percentDifference: ((enhancedTime - standardTime) / standardTime) * 100,
        memoryUsage: memoryStats.peakUsage,
        success: true,
        enhancedOutputSize: enhancedResult.length,
        standardOutputSize: standardResult.length
      };
      
      logger.success(`Teste de condicionais complexos concluído: ${enhancedTime.toFixed(2)}ms vs ${standardTime.toFixed(2)}ms`);
      return this.results.complexConditionals;
    } catch (error) {
      logger.error(`Erro no teste de condicionais complexos: ${error.message}`);
      
      this.results.complexConditionals = {
        name: 'Condicionais Complexos',
        description: 'Template com condicionais aninhados complexos',
        error: error.message,
        success: false
      };
      
      return this.results.complexConditionals;
    }
  }

  /**
   * Teste 4: Componentes Aninhados
   * Avalia o desempenho com componentes aninhados recursivamente
   */
  async testNestedComponents() {
    logger.info('Executando teste de componentes aninhados...');
    
    try {
      // Gerar template com componentes aninhados
      const { template, data } = this._generateNestedComponentsTemplate();
      
      // Salvar template para referência
      await fs.writeFile(
        path.join(this.options.outputDir, 'nested-components-template.html'),
        template
      );
      
      // Testar renderizador aprimorado
      const enhancedStart = process.hrtime.bigint();
      const enhancedResult = await this._renderWithTimeout(
        this.enhancedRenderer.render.bind(this.enhancedRenderer),
        template,
        data
      );
      const enhancedEnd = process.hrtime.bigint();
      const enhancedTime = Number(enhancedEnd - enhancedStart) / 1000000; // ms
      
      // Testar renderizador padrão
      const standardStart = process.hrtime.bigint();
      const standardResult = await this._renderWithTimeout(
        this.standardRenderer.render.bind(this.standardRenderer),
        template,
        data
      );
      const standardEnd = process.hrtime.bigint();
      const standardTime = Number(standardEnd - standardStart) / 1000000; // ms
      
      // Calcular uso de memória
      const memoryStats = this.enhancedRenderer.getStats().memory;
      
      // Registrar resultados
      this.results.nestedComponents = {
        name: 'Componentes Aninhados',
        description: 'Template com componentes aninhados recursivamente',
        templateSize: template.length,
        componentCount: this._countComponents(template),
        enhancedTime,
        standardTime,
        difference: enhancedTime - standardTime,
        percentDifference: ((enhancedTime - standardTime) / standardTime) * 100,
        memoryUsage: memoryStats.peakUsage,
        success: true,
        enhancedOutputSize: enhancedResult.length,
        standardOutputSize: standardResult.length
      };
      
      logger.success(`Teste de componentes aninhados concluído: ${enhancedTime.toFixed(2)}ms vs ${standardTime.toFixed(2)}ms`);
      return this.results.nestedComponents;
    } catch (error) {
      logger.error(`Erro no teste de componentes aninhados: ${error.message}`);
      
      this.results.nestedComponents = {
        name: 'Componentes Aninhados',
        description: 'Template com componentes aninhados recursivamente',
        error: error.message,
        success: false
      };
      
      return this.results.nestedComponents;
    }
  }

  /**
   * Teste 5: Templates Recursivos
   * Avalia o desempenho com templates que geram estruturas recursivas
   */
  async testRecursiveTemplates() {
    logger.info('Executando teste de templates recursivos...');
    
    try {
      // Gerar template com estrutura recursiva (árvore de categorias)
      const { template, data } = this._generateRecursiveTemplate();
      
      // Salvar template para referência
      await fs.writeFile(
        path.join(this.options.outputDir, 'recursive-template.html'),
        template
      );
      
      // Testar renderizador aprimorado
      const enhancedStart = process.hrtime.bigint();
      const enhancedResult = await this._renderWithTimeout(
        this.enhancedRenderer.render.bind(this.enhancedRenderer),
        template,
        data
      );
      const enhancedEnd = process.hrtime.bigint();
      const enhancedTime = Number(enhancedEnd - enhancedStart) / 1000000; // ms
      
      // Testar renderizador padrão
      const standardStart = process.hrtime.bigint();
      const standardResult = await this._renderWithTimeout(
        this.standardRenderer.render.bind(this.standardRenderer),
        template,
        data
      );
      const standardEnd = process.hrtime.bigint();
      const standardTime = Number(standardEnd - standardStart) / 1000000; // ms
      
      // Calcular uso de memória
      const memoryStats = this.enhancedRenderer.getStats().memory;
      
      // Registrar resultados
      this.results.recursiveTemplates = {
        name: 'Templates Recursivos',
        description: 'Template com estrutura de dados recursiva (árvore de categorias)',
        templateSize: template.length,
        enhancedTime,
        standardTime,
        difference: enhancedTime - standardTime,
        percentDifference: ((enhancedTime - standardTime) / standardTime) * 100,
        memoryUsage: memoryStats.peakUsage,
        success: true,
        enhancedOutputSize: enhancedResult.length,
        standardOutputSize: standardResult.length
      };
      
      logger.success(`Teste de templates recursivos concluído: ${enhancedTime.toFixed(2)}ms vs ${standardTime.toFixed(2)}ms`);
      return this.results.recursiveTemplates;
    } catch (error) {
      logger.error(`Erro no teste de templates recursivos: ${error.message}`);
      
      this.results.recursiveTemplates = {
        name: 'Templates Recursivos',
        description: 'Template com estrutura de dados recursiva (árvore de categorias)',
        error: error.message,
        success: false
      };
      
      return this.results.recursiveTemplates;
    }
  }

  /**
   * Teste 6: Cenários de Vazamento de Memória
   * Avalia o comportamento em cenários propensos a vazamentos de memória
   */
  async testMemoryLeakScenarios() {
    logger.info('Executando teste de cenários de vazamento de memória...');
    
    try {
      // Gerar template que pode causar vazamentos de memória
      const template = this._generateMemoryLeakTemplate();
      
      // Salvar template para referência
      await fs.writeFile(
        path.join(this.options.outputDir, 'memory-leak-template.html'),
        template
      );
      
      // Dados com estruturas circulares (potencial problema)
      const circularData = this._generateCircularData();
      
      // Testar renderizador aprimorado (com foco no uso de memória)
      const memoryBefore = process.memoryUsage().heapUsed / 1024 / 1024;
      
      // Renderizar múltiplas vezes para avaliar vazamentos
      const iterations = 5;
      let enhancedTotalTime = 0;
      
      for (let i = 0; i < iterations; i++) {
        logger.debug(`Iteração ${i + 1}/${iterations} do teste de vazamento de memória...`);
        
        const start = process.hrtime.bigint();
        await this._renderWithTimeout(
          this.enhancedRenderer.render.bind(this.enhancedRenderer),
          template,
          circularData
        );
        const end = process.hrtime.bigint();
        enhancedTotalTime += Number(end - start) / 1000000;
        
        // Forçar coleta de lixo entre iterações, se disponível
        if (typeof global.gc === 'function') {
          global.gc();
        }
      }
      
      const memoryAfter = process.memoryUsage().heapUsed / 1024 / 1024;
      const memoryDelta = memoryAfter - memoryBefore;
      
      // Calcular uso de memória
      const memoryStats = this.enhancedRenderer.getStats().memory;
      
      // Registrar resultados
      this.results.memoryLeakScenarios = {
        name: 'Cenários de Vazamento de Memória',
        description: 'Template com potencial para vazamentos de memória',
        templateSize: template.length,
        iterations,
        averageTime: enhancedTotalTime / iterations,
        memoryBeforeMB: memoryBefore,
        memoryAfterMB: memoryAfter,
        memoryDeltaMB: memoryDelta,
        memoryPeakMB: memoryStats.peakUsage,
        success: true,
        leakDetected: memoryDelta > 50 // Considerar vazamento se crescer mais de 50MB
      };
      
      logger.success(`Teste de cenários de vazamento de memória concluído: ${memoryDelta.toFixed(2)}MB (${enhancedTotalTime / iterations}ms/iteração)`);
      return this.results.memoryLeakScenarios;
    } catch (error) {
      logger.error(`Erro no teste de cenários de vazamento de memória: ${error.message}`);
      
      this.results.memoryLeakScenarios = {
        name: 'Cenários de Vazamento de Memória',
        description: 'Template com potencial para vazamentos de memória',
        error: error.message,
        success: false
      };
      
      return this.results.memoryLeakScenarios;
    }
  }

  /**
   * Teste 7: Renderização Concorrente
   * Avalia o desempenho com múltiplas renderizações simultâneas
   */
  async testConcurrentRendering() {
    logger.info('Executando teste de renderização concorrente...');
    
    try {
      // Carregar templates existentes
      const templateFiles = await fs.readdir(this.options.templatesDir);
      const htmlFiles = templateFiles.filter(file => file.endsWith('.html')).slice(0, 3);
      
      if (htmlFiles.length === 0) {
        throw new Error('Nenhum template encontrado para teste concorrente');
      }
      
      // Carregar templates
      const templates = await Promise.all(
        htmlFiles.map(async file => {
          const content = await fs.readFile(path.join(this.options.templatesDir, file), 'utf8');
          return {
            name: file.replace('.html', ''),
            content
          };
        })
      );
      
      // Renderizar templates concorrentemente
      const start = process.hrtime.bigint();
      
      const concurrentResults = await Promise.all(
        templates.map(template => 
          this._renderWithTimeout(
            this.enhancedRenderer.render.bind(this.enhancedRenderer),
            template.content,
            {}
          )
        )
      );
      
      const end = process.hrtime.bigint();
      const totalTime = Number(end - start) / 1000000; // ms
      
      // Renderizar templates sequencialmente para comparação
      const seqStart = process.hrtime.bigint();
      
      for (const template of templates) {
        await this._renderWithTimeout(
          this.enhancedRenderer.render.bind(this.enhancedRenderer),
          template.content,
          {}
        );
      }
      
      const seqEnd = process.hrtime.bigint();
      const seqTotalTime = Number(seqEnd - seqStart) / 1000000; // ms
      
      // Calcular uso de memória
      const memoryStats = this.enhancedRenderer.getStats().memory;
      
      // Registrar resultados
      this.results.concurrentRendering = {
        name: 'Renderização Concorrente',
        description: `Renderização concorrente de ${templates.length} templates`,
        templates: templates.map(t => t.name),
        concurrentTime: totalTime,
        sequentialTime: seqTotalTime,
        timeSaved: seqTotalTime - totalTime,
        percentImprovement: ((seqTotalTime - totalTime) / seqTotalTime) * 100,
        memoryUsage: memoryStats.peakUsage,
        success: true,
        outputSizes: concurrentResults.map(r => r.length)
      };
      
      logger.success(`Teste de renderização concorrente concluído: ${totalTime.toFixed(2)}ms vs ${seqTotalTime.toFixed(2)}ms (${((seqTotalTime - totalTime) / seqTotalTime * 100).toFixed(2)}% de melhoria)`);
      return this.results.concurrentRendering;
    } catch (error) {
      logger.error(`Erro no teste de renderização concorrente: ${error.message}`);
      
      this.results.concurrentRendering = {
        name: 'Renderização Concorrente',
        description: 'Renderização concorrente de múltiplos templates',
        error: error.message,
        success: false
      };
      
      return this.results.concurrentRendering;
    }
  }

  /**
   * Teste 8: Renderização Progressiva com Animação
   * Avalia o desempenho do modo streaming com templates que incluem animações
   */
  async testProgressiveStreamingWithAnimation() {
    logger.info('Executando teste de renderização progressiva com animação...');
    
    try {
      // Gerar template com animações e transições
      const template = this._generateAnimatedTemplate();
      
      // Salvar template para referência
      await fs.writeFile(
        path.join(this.options.outputDir, 'animated-template.html'),
        template
      );
      
      // Testar renderizador aprimorado no modo streaming
      const chunks = [];
      let chunksReceived = 0;
      
      const streamStart = process.hrtime.bigint();
      
      // Usar renderização streaming
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Timeout na renderização streaming'));
        }, this.options.timeoutMs);
        
        this.enhancedRenderer.renderStreaming(
          template,
          {},
          (chunk, stats) => {
            chunks.push(chunk);
            chunksReceived++;
            
            if (stats.isLastChunk) {
              clearTimeout(timeout);
              resolve();
            }
          }
        ).catch(err => {
          clearTimeout(timeout);
          reject(err);
        });
      });
      
      const streamEnd = process.hrtime.bigint();
      const streamTime = Number(streamEnd - streamStart) / 1000000; // ms
      
      // Testar renderizador padrão para comparação
      const standardStart = process.hrtime.bigint();
      
      await this._renderWithTimeout(
        this.standardRenderer.render.bind(this.standardRenderer),
        template,
        {}
      );
      
      const standardEnd = process.hrtime.bigint();
      const standardTime = Number(standardEnd - standardStart) / 1000000; // ms
      
      // Calcular tempo até o primeiro chunk
      const firstChunkLatency = chunksReceived > 0 ? streamTime / chunksReceived : 0;
      
      // Calcular uso de memória
      const memoryStats = this.enhancedRenderer.getStats().memory;
      
      // Registrar resultados
      this.results.progressiveStreamingWithAnimation = {
        name: 'Renderização Progressiva com Animação',
        description: 'Template com animações e transições no modo streaming',
        templateSize: template.length,
        totalChunks: chunksReceived,
        streamingTime: streamTime,
        standardTime,
        timeComparison: standardTime - streamTime,
        percentDifference: ((standardTime - streamTime) / standardTime) * 100,
        firstChunkLatency,
        memoryUsage: memoryStats.peakUsage,
        success: true
      };
      
      logger.success(`Teste de renderização progressiva com animação concluído: ${streamTime.toFixed(2)}ms vs ${standardTime.toFixed(2)}ms (${chunksReceived} chunks)`);
      return this.results.progressiveStreamingWithAnimation;
    } catch (error) {
      logger.error(`Erro no teste de renderização progressiva com animação: ${error.message}`);
      
      this.results.progressiveStreamingWithAnimation = {
        name: 'Renderização Progressiva com Animação',
        description: 'Template com animações e transições no modo streaming',
        error: error.message,
        success: false
      };
      
      return this.results.progressiveStreamingWithAnimation;
    }
  }

  /**
   * Salva os resultados dos testes
   * @private
   */
  async _saveResults() {
    try {
      // Salvar JSON com todos os resultados
      await fs.writeFile(
        path.join(this.options.outputDir, 'extreme-test-results.json'),
        JSON.stringify(this.results, null, 2)
      );
      
      // Gerar relatório HTML
      const htmlReport = this._generateHtmlReport();
      await fs.writeFile(
        path.join(this.options.outputDir, 'extreme-test-report.html'),
        htmlReport
      );
      
      logger.success('Resultados dos testes salvos com sucesso');
    } catch (error) {
      logger.error(`Erro ao salvar resultados: ${error.message}`);
    }
  }

  /**
   * Gera um relatório HTML dos resultados
   * @returns {string} HTML do relatório
   * @private
   */
  _generateHtmlReport() {
    // Extrair resultados para o relatório
    const testResults = Object.values(this.results);
    
    // Calcular estatísticas gerais
    const successfulTests = testResults.filter(test => test.success);
    const enhancedVsStandard = successfulTests
      .filter(test => test.enhancedTime && test.standardTime)
      .map(test => ({
        name: test.name,
        enhancedTime: test.enhancedTime,
        standardTime: test.standardTime,
        percentDifference: test.percentDifference
      }));
    
    const avgPercentDifference = enhancedVsStandard.length > 0 ?
      enhancedVsStandard.reduce((sum, test) => sum + test.percentDifference, 0) / enhancedVsStandard.length :
      0;
    
    // Gerar HTML do relatório
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Relatório de Testes Extremos - Renderizador Progressivo</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            line-height: 1.5;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
          }
          h1, h2, h3 {
            color: #0066cc;
          }
          .summary {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 5px;
            margin-bottom: 30px;
          }
          .test-card {
            border: 1px solid #ddd;
            border-radius: 5px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          }
          .test-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #eee;
            padding-bottom: 10px;
            margin-bottom: 15px;
          }
          .test-header h3 {
            margin: 0;
          }
          .test-status {
            font-weight: bold;
            padding: 3px 8px;
            border-radius: 3px;
          }
          .success {
            background-color: #d4edda;
            color: #155724;
          }
          .failure {
            background-color: #f8d7da;
            color: #721c24;
          }
          .metrics {
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
            margin-bottom: 15px;
          }
          .metric {
            background-color: #f8f9fa;
            padding: 10px;
            border-radius: 3px;
            min-width: 180px;
          }
          .metric-label {
            font-size: 0.9em;
            color: #666;
            margin-bottom: 5px;
          }
          .metric-value {
            font-size: 1.1em;
            font-weight: bold;
          }
          .positive {
            color: #28a745;
          }
          .negative {
            color: #dc3545;
          }
          .neutral {
            color: #0066cc;
          }
          .chart-container {
            width: 100%;
            height: 400px;
            margin: 30px 0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          th, td {
            padding: 10px;
            text-align: left;
            border-bottom: 1px solid #ddd;
          }
          th {
            background-color: #f1f1f1;
          }
          tr:hover {
            background-color: #f9f9f9;
          }
        </style>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
      </head>
      <body>
        <h1>Relatório de Testes Extremos - Renderizador Progressivo</h1>
        <p>Gerado em: ${new Date().toLocaleString()}</p>
        
        <div class="summary">
          <h2>Resumo dos Resultados</h2>
          <div class="metrics">
            <div class="metric">
              <div class="metric-label">Total de Testes</div>
              <div class="metric-value neutral">${testResults.length}</div>
            </div>
            <div class="metric">
              <div class="metric-label">Testes Bem-Sucedidos</div>
              <div class="metric-value positive">${successfulTests.length}</div>
            </div>
            <div class="metric">
              <div class="metric-label">Testes Falhos</div>
              <div class="metric-value ${testResults.length - successfulTests.length > 0 ? 'negative' : 'positive'}">${testResults.length - successfulTests.length}</div>
            </div>
            <div class="metric">
              <div class="metric-label">Diferença Média</div>
              <div class="metric-value ${avgPercentDifference <= 0 ? 'positive' : 'negative'}">${avgPercentDifference.toFixed(2)}%</div>
            </div>
          </div>
          
          <h3>Comparação de Desempenho</h3>
          <canvas id="performanceChart"></canvas>
        </div>
        
        <h2>Resultados Detalhados</h2>
        
        ${testResults.map(test => `
          <div class="test-card">
            <div class="test-header">
              <h3>${test.name}</h3>
              <span class="test-status ${test.success ? 'success' : 'failure'}">${test.success ? 'Sucesso' : 'Falha'}</span>
            </div>
            
            <p>${test.description}</p>
            
            ${test.success ? `
              <div class="metrics">
                ${test.enhancedTime ? `
                  <div class="metric">
                    <div class="metric-label">Tempo Aprimorado</div>
                    <div class="metric-value neutral">${test.enhancedTime.toFixed(2)} ms</div>
                  </div>
                ` : ''}
                
                ${test.standardTime ? `
                  <div class="metric">
                    <div class="metric-label">Tempo Padrão</div>
                    <div class="metric-value neutral">${test.standardTime.toFixed(2)} ms</div>
                  </div>
                ` : ''}
                
                ${test.percentDifference !== undefined ? `
                  <div class="metric">
                    <div class="metric-label">Diferença</div>
                    <div class="metric-value ${test.percentDifference <= 0 ? 'positive' : 'negative'}">${test.percentDifference.toFixed(2)}%</div>
                  </div>
                ` : ''}
                
                ${test.memoryUsage ? `
                  <div class="metric">
                    <div class="metric-label">Uso de Memória</div>
                    <div class="metric-value neutral">${test.memoryUsage.toFixed(2)} MB</div>
                  </div>
                ` : ''}
                
                ${test.templateSize ? `
                  <div class="metric">
                    <div class="metric-label">Tamanho do Template</div>
                    <div class="metric-value neutral">${(test.templateSize / 1024).toFixed(2)} KB</div>
                  </div>
                ` : ''}
                
                ${test.componentCount ? `
                  <div class="metric">
                    <div class="metric-label">Componentes</div>
                    <div class="metric-value neutral">${test.componentCount}</div>
                  </div>
                ` : ''}
              </div>
              
              ${test.leakDetected !== undefined ? `
                <div class="metrics">
                  <div class="metric">
                    <div class="metric-label">Vazamento Detectado</div>
                    <div class="metric-value ${test.leakDetected ? 'negative' : 'positive'}">${test.leakDetected ? 'Sim' : 'Não'}</div>
                  </div>
                  <div class="metric">
                    <div class="metric-label">Crescimento de Memória</div>
                    <div class="metric-value ${test.memoryDeltaMB > 10 ? 'negative' : 'neutral'}">${test.memoryDeltaMB.toFixed(2)} MB</div>
                  </div>
                </div>
              ` : ''}
              
              ${test.totalChunks ? `
                <div class="metrics">
                  <div class="metric">
                    <div class="metric-label">Total de Chunks</div>
                    <div class="metric-value neutral">${test.totalChunks}</div>
                  </div>
                  <div class="metric">
                    <div class="metric-label">Latência do Primeiro Chunk</div>
                    <div class="metric-value neutral">${test.firstChunkLatency.toFixed(2)} ms</div>
                  </div>
                </div>
              ` : ''}
            ` : `
              <div class="error-message">
                <strong>Erro:</strong> ${test.error}
              </div>
            `}
          </div>
        `).join('')}
        
        <script>
          // Dados para os gráficos
          const performanceData = ${JSON.stringify(enhancedVsStandard)};
          
          // Renderizar gráfico de desempenho
          const performanceCtx = document.getElementById('performanceChart').getContext('2d');
          new Chart(performanceCtx, {
            type: 'bar',
            data: {
              labels: performanceData.map(d => d.name),
              datasets: [
                {
                  label: 'Renderizador Aprimorado (ms)',
                  data: performanceData.map(d => d.enhancedTime),
                  backgroundColor: 'rgba(54, 162, 235, 0.7)',
                  borderColor: 'rgba(54, 162, 235, 1)',
                  borderWidth: 1
                },
                {
                  label: 'Renderizador Padrão (ms)',
                  data: performanceData.map(d => d.standardTime),
                  backgroundColor: 'rgba(255, 99, 132, 0.7)',
                  borderColor: 'rgba(255, 99, 132, 1)',
                  borderWidth: 1
                }
              ]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
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
        </script>
      </body>
      </html>
    `;
  }

  /* Funções auxiliares para geração de templates e dados */

  /**
   * Gera um template com aninhamento profundo
   * @param {number} depth - Profundidade do aninhamento
   * @returns {string} Template HTML
   * @private
   */
  _generateDeepNestedTemplate(depth) {
    const generateNestedDivs = (currentDepth) => {
      if (currentDepth <= 0) {
        return '<div class="content">Conteúdo de nível mais profundo</div>';
      }
      
      return `<div class="level-${currentDepth}">
        <h${Math.min(currentDepth, 6)}>Nível ${currentDepth}</h${Math.min(currentDepth, 6)}>
        ${generateNestedDivs(currentDepth - 1)}
      </div>`;
    };
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Teste de Aninhamento Profundo</title>
        <style>
          div { border: 1px solid #ddd; padding: 15px; margin: 10px; }
          .level-1 { background-color: #f8f9fa; }
          .level-2 { background-color: #e9ecef; }
          .level-3 { background-color: #dee2e6; }
          .level-4 { background-color: #ced4da; }
          .level-5 { background-color: #adb5bd; }
          .content { background-color: #28a745; color: white; text-align: center; }
        </style>
      </head>
      <body>
        <h1>Teste de Aninhamento Profundo (${depth} níveis)</h1>
        ${generateNestedDivs(depth)}
      </body>
      </html>
    `;
  }

  /**
   * Gera um conjunto de dados grande
   * @param {number} count - Número de itens a gerar
   * @returns {Array} Array de objetos de dados
   * @private
   */
  _generateLargeDataSet(count) {
    const items = [];
    const statuses = ['Em estoque', 'Baixo estoque', 'Esgotado', 'Pré-venda', 'Descontinuado'];
    
    for (let i = 0; i < count; i++) {
      items.push({
        id: i + 1,
        name: `Produto ${i + 1}`,
        description: `Descrição detalhada do produto ${i + 1} com características e especificações.`,
        price: (Math.random() * 1000 + 10).toFixed(2),
        stock: Math.floor(Math.random() * 100),
        status: statuses[Math.floor(Math.random() * statuses.length)]
      });
    }
    
    return items;
  }

  /**
   * Gera dados de usuários fictícios
   * @param {number} count - Número de usuários a gerar
   * @returns {Array} Array de objetos de usuário
   * @private
   */
  _generateUserData(count) {
    const users = [];
    const roles = ['admin', 'editor', 'user', 'guest'];
    const statuses = ['active', 'inactive', 'pending', 'banned'];
    
    for (let i = 0; i < count; i++) {
      users.push({
        id: i + 1,
        name: `Usuário ${i + 1}`,
        email: `usuario${i + 1}@example.com`,
        role: roles[Math.floor(Math.random() * roles.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        lastLogin: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
        premium: Math.random() > 0.7
      });
    }
    
    return users;
  }

  /**
   * Gera um template com condicionais complexos
   * @returns {string} Template HTML
   * @private
   */
  _generateComplexConditionalsTemplate() {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Teste de Condicionais Complexos</title>
        <style>
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
          tr:nth-child(even) { background-color: #f2f2f2; }
          .premium { background-color: gold; }
          .banned { background-color: #ffcccc; }
          .admin { font-weight: bold; }
        </style>
      </head>
      <body>
        <h1>Gerenciamento de Usuários</h1>
        
        {{#if settings}}
          {{#if settings.showAdmin}}
            <div class="admin-panel">
              <h2>Painel Administrativo</h2>
              
              {{#if settings.features}}
                <div class="features">
                  {{#if settings.features.advancedSearch}}
                    <div class="search">
                      <input type="search" placeholder="Buscar usuários...">
                      
                      {{#if settings.features.multiSort}}
                        <select>
                          <option>Ordenar por Nome</option>
                          <option>Ordenar por Data</option>
                          <option>Ordenar por Status</option>
                        </select>
                      {{/if}}
                    </div>
                  {{/if}}
                  
                  {{#if settings.features.export}}
                    <div class="export-options">
                      <h3>Exportar Dados</h3>
                      
                      {{#if settings.features.export.csv}}
                        <button>Exportar CSV</button>
                      {{/if}}
                      
                      {{#if settings.features.export.pdf}}
                        <button>Exportar PDF</button>
                      {{/if}}
                      
                      {{#if settings.features.export.excel}}
                        <button>Exportar Excel</button>
                      {{/if}}
                    </div>
                  {{/if}}
                </div>
              {{/if}}
            </div>
          {{/if}}
          
          {{#if settings.enableFilters}}
            <div class="filters">
              <h3>Filtros</h3>
              
              <div class="filter-options">
                <label>
                  <input type="checkbox" checked> Mostrar Ativos
                </label>
                <label>
                  <input type="checkbox"> Mostrar Inativos
                </label>
                <label>
                  <input type="checkbox"> Mostrar Premium
                </label>
                
                {{#if settings.showAdmin}}
                  <label>
                    <input type="checkbox"> Mostrar Banidos
                  </label>
                {{/if}}
              </div>
            </div>
          {{/if}}
        {{/if}}
        
        <div class="user-list">
          <h2>Lista de Usuários</h2>
          
          {{#if users}}
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nome</th>
                  <th>Email</th>
                  <th>Função</th>
                  <th>Status</th>
                  <th>Último Login</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {{#each users}}
                  <tr class="{{#if premium}}premium{{/if}} {{#if status === 'banned'}}banned{{/if}} {{#if role === 'admin'}}admin{{/if}}">
                    <td>{{id}}</td>
                    <td>{{name}}</td>
                    <td>{{email}}</td>
                    <td>{{role}}</td>
                    <td>{{status}}</td>
                    <td>{{lastLogin}}</td>
                    <td>
                      <button>Editar</button>
                      
                      {{#if ../settings.showAdmin}}
                        {{#if role !== 'admin'}}
                          <button>Excluir</button>
                        {{/if}}
                        
                        {{#if status === 'active'}}
                          <button>Desativar</button>
                        {{else}}
                          <button>Ativar</button>
                        {{/if}}
                        
                        {{#if premium}}
                          <button>Remover Premium</button>
                        {{else}}
                          <button>Tornar Premium</button>
                        {{/if}}
                      {{/if}}
                    </td>
                  </tr>
                {{/each}}
              </tbody>
            </table>
            
            {{#if settings.maxItems}}
              {{#if users.length > settings.maxItems}}
                <div class="pagination">
                  <button>Anterior</button>
                  <span>Página 1</span>
                  <button>Próxima</button>
                </div>
              {{/if}}
            {{/if}}
          {{else}}
            <p>Nenhum usuário encontrado.</p>
          {{/if}}
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Gera um template e dados para componentes aninhados
   * @returns {Object} Template e dados
   * @private
   */
  _generateNestedComponentsTemplate() {
    // Definir estrutura de interface de usuário de e-commerce
    const template = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Teste de Componentes Aninhados</title>
        <style>
          /* Estilos omitidos para brevidade */
        </style>
      </head>
      <body>
        <header>
          <nav>
            <div class="logo">E-Commerce Demo</div>
            <ul class="menu">
              {{#each categories}}
                <li>
                  <a href="#">{{name}}</a>
                  {{#if subcategories}}
                    <ul class="submenu">
                      {{#each subcategories}}
                        <li>
                          <a href="#">{{name}}</a>
                          {{#if subcategories}}
                            <ul class="sub-submenu">
                              {{#each subcategories}}
                                <li><a href="#">{{name}}</a></li>
                              {{/each}}
                            </ul>
                          {{/if}}
                        </li>
                      {{/each}}
                    </ul>
                  {{/if}}
                </li>
              {{/each}}
            </ul>
            <div class="search">
              <input type="search" placeholder="Buscar produtos...">
              <button>Buscar</button>
            </div>
            <div class="cart">
              <span>Carrinho ({{cart.items.length}})</span>
              {{#if cart.items.length > 0}}
                <div class="cart-preview">
                  <ul>
                    {{#each cart.items}}
                      <li>
                        <span>{{name}}</span>
                        <span>{{quantity}}x</span>
                        <span>R$ {{price}}</span>
                      </li>
                    {{/each}}
                  </ul>
                  <div class="cart-total">
                    <span>Total: R$ {{cart.total}}</span>
                    <button>Finalizar Compra</button>
                  </div>
                </div>
              {{/if}}
            </div>
          </nav>
        </header>
        
        <main>
          <div class="featured-products">
            <h2>Produtos em Destaque</h2>
            <div class="product-grid">
              {{#each featuredProducts}}
                <div class="product-card">
                  <div class="product-image">
                    <img src="{{image}}" alt="{{name}}">
                    {{#if discount}}
                      <div class="discount-badge">-{{discount}}%</div>
                    {{/if}}
                  </div>
                  <div class="product-info">
                    <h3>{{name}}</h3>
                    <div class="product-price">
                      {{#if originalPrice}}
                        <span class="original-price">R$ {{originalPrice}}</span>
                      {{/if}}
                      <span class="current-price">R$ {{price}}</span>
                    </div>
                    <div class="product-rating">
                      {{#each ratingStars}}
                        <span class="star {{type}}"></span>
                      {{/each}}
                      <span class="rating-count">({{ratingCount}})</span>
                    </div>
                    <div class="product-actions">
                      <button class="add-to-cart">Adicionar ao Carrinho</button>
                      <button class="add-to-wishlist">♡</button>
                    </div>
                  </div>
                </div>
              {{/each}}
            </div>
          </div>
          
          <div class="product-categories">
            <h2>Navegue por Categoria</h2>
            <div class="category-grid">
              {{#each categories}}
                <div class="category-card">
                  <h3>{{name}}</h3>
                  {{#if subcategories}}
                    <ul class="subcategory-list">
                      {{#each subcategories}}
                        <li>
                          <a href="#">{{name}}</a>
                          {{#if subcategories}}
                            <ul class="sub-subcategory-list">
                              {{#each subcategories}}
                                <li><a href="#">{{name}}</a></li>
                              {{/each}}
                            </ul>
                          {{/if}}
                        </li>
                      {{/each}}
                    </ul>
                  {{/if}}
                </div>
              {{/each}}
            </div>
          </div>
        </main>
        
        <footer>
          <div class="footer-columns">
            <div class="footer-column">
              <h3>Sobre Nós</h3>
              <ul>
                <li><a href="#">Nossa História</a></li>
                <li><a href="#">Equipe</a></li>
                <li><a href="#">Carreiras</a></li>
              </ul>
            </div>
            <div class="footer-column">
              <h3>Atendimento</h3>
              <ul>
                <li><a href="#">Contato</a></li>
                <li><a href="#">FAQ</a></li>
                <li><a href="#">Suporte</a></li>
              </ul>
            </div>
            <div class="footer-column">
              <h3>Políticas</h3>
              <ul>
                <li><a href="#">Privacidade</a></li>
                <li><a href="#">Termos de Uso</a></li>
                <li><a href="#">Envio e Devolução</a></li>
              </ul>
            </div>
            <div class="footer-column">
              <h3>Newsletter</h3>
              <form>
                <input type="email" placeholder="Seu e-mail">
                <button>Assinar</button>
              </form>
              <div class="social-media">
                <a href="#">Facebook</a>
                <a href="#">Instagram</a>
                <a href="#">Twitter</a>
              </div>
            </div>
          </div>
          <div class="copyright">
            © 2025 E-Commerce Demo. Todos os direitos reservados.
          </div>
        </footer>
      </body>
      </html>
    `;
    
    // Gerar dados para o template
    const generateRatingStars = (rating) => {
      const stars = [];
      for (let i = 1; i <= 5; i++) {
        if (i <= Math.floor(rating)) {
          stars.push({ type: 'full' });
        } else if (i === Math.ceil(rating) && rating % 1 !== 0) {
          stars.push({ type: 'half' });
        } else {
          stars.push({ type: 'empty' });
        }
      }
      return stars;
    };
    
    const generateSubcategories = (name, depth) => {
      if (depth <= 0) return null;
      
      const count = Math.floor(Math.random() * 5) + 1;
      const subcategories = [];
      
      for (let i = 0; i < count; i++) {
        subcategories.push({
          name: `${name} Sub ${i + 1}`,
          subcategories: generateSubcategories(`${name} Sub ${i + 1}`, depth - 1)
        });
      }
      
      return subcategories;
    };
    
    // Gerar categorias com subcategorias aninhadas
    const categories = [];
    const categoryCount = 5;
    
    for (let i = 0; i < categoryCount; i++) {
      categories.push({
        name: `Categoria ${i + 1}`,
        subcategories: generateSubcategories(`Categoria ${i + 1}`, 2)
      });
    }
    
    // Gerar produtos em destaque
    const featuredProducts = [];
    const productCount = 8;
    
    for (let i = 0; i < productCount; i++) {
      const hasDiscount = Math.random() > 0.5;
      const price = (Math.random() * 1000 + 50).toFixed(2);
      const discount = hasDiscount ? Math.floor(Math.random() * 30) + 10 : 0;
      const originalPrice = hasDiscount ? (price * 100 / (100 - discount)).toFixed(2) : null;
      const rating = (Math.random() * 4 + 1).toFixed(1);
      
      featuredProducts.push({
        name: `Produto em Destaque ${i + 1}`,
        image: 'placeholder.jpg',
        price,
        discount: hasDiscount ? discount : null,
        originalPrice,
        ratingStars: generateRatingStars(rating),
        ratingCount: Math.floor(Math.random() * 500) + 10
      });
    }
    
    // Gerar itens do carrinho
    const cartItems = [];
    const cartItemCount = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < cartItemCount; i++) {
      cartItems.push({
        name: `Produto ${i + 1}`,
        quantity: Math.floor(Math.random() * 3) + 1,
        price: (Math.random() * 200 + 30).toFixed(2)
      });
    }
    
    const cartTotal = cartItems.reduce((total, item) => total + (parseFloat(item.price) * item.quantity), 0).toFixed(2);
    
    return {
      template,
      data: {
        categories,
        featuredProducts,
        cart: {
          items: cartItems,
          total: cartTotal
        }
      }
    };
  }

  /**
   * Gera template e dados para estrutura recursiva
   * @returns {Object} Template e dados
   * @private
   */
  _generateRecursiveTemplate() {
    // Template com renderização recursiva de categorias
    const template = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Teste de Templates Recursivos</title>
        <style>
          .category-tree { margin-left: 20px; }
          .category-item { margin: 5px 0; }
          .category-toggle { cursor: pointer; }
          .category-name { font-weight: bold; }
          .product-list { display: flex; flex-wrap: wrap; }
          .product-card { border: 1px solid #ddd; margin: 10px; padding: 15px; width: 250px; }
        </style>
      </head>
      <body>
        <h1>Navegação por Categorias</h1>
        
        <div class="sidebar">
          <h2>Categorias</h2>
          {{> renderCategoryTree categories}}
        </div>
        
        <main>
          <h2>Produtos</h2>
          <div class="product-list">
            {{#each products}}
              <div class="product-card">
                <h3>{{name}}</h3>
                <p>{{description}}</p>
                <div class="price">R$ {{price}}</div>
                <div class="categories">
                  Categorias:
                  <ul>
                    {{#each categories}}
                      <li>{{this}}</li>
                    {{/each}}
                  </ul>
                </div>
              </div>
            {{/each}}
          </div>
        </main>
        
        {{#*inline "renderCategoryTree"}}
          <ul class="category-tree">
            {{#each this}}
              <li class="category-item">
                <div>
                  {{#if children}}
                    <span class="category-toggle">▶</span>
                  {{/if}}
                  <span class="category-name">{{name}}</span>
                  {{#if productCount}}
                    <span class="product-count">({{productCount}})</span>
                  {{/if}}
                </div>
                
                {{#if children}}
                  {{> renderCategoryTree children}}
                {{/if}}
              </li>
            {{/each}}
          </ul>
        {{/inline}}
      </body>
      </html>
    `;
    
    // Função para gerar categorias recursivamente
    const generateCategories = (depth, prefix = '') => {
      if (depth <= 0) return null;
      
      const count = Math.max(2, Math.floor(Math.random() * 5));
      const categories = [];
      
      for (let i = 0; i < count; i++) {
        const name = prefix ? `${prefix} > Categoria ${i + 1}` : `Categoria ${i + 1}`;
        const productCount = Math.floor(Math.random() * 20) + 1;
        
        categories.push({
          name,
          productCount,
          children: generateCategories(depth - 1, name)
        });
      }
      
      return categories;
    };
    
    // Gerar produtos
    const generateProducts = (categories, count) => {
      const flattenCategories = (cats, result = [], path = []) => {
        if (!cats) return;
        
        cats.forEach(cat => {
          const currentPath = [...path, cat.name];
          result.push({
            path: currentPath,
            name: cat.name
          });
          
          if (cat.children) {
            flattenCategories(cat.children, result, currentPath);
          }
        });
        
        return result;
      };
      
      const allCategories = flattenCategories(categories);
      const products = [];
      
      for (let i = 0; i < count; i++) {
        // Escolher 1-3 categorias aleatórias
        const productCategories = [];
        const categoryCount = Math.floor(Math.random() * 3) + 1;
        
        for (let j = 0; j < categoryCount; j++) {
          const randomCategory = allCategories[Math.floor(Math.random() * allCategories.length)];
          if (!productCategories.includes(randomCategory.name)) {
            productCategories.push(randomCategory.name);
          }
        }
        
        products.push({
          name: `Produto ${i + 1}`,
          description: `Descrição do produto ${i + 1}`,
          price: (Math.random() * 1000 + 10).toFixed(2),
          categories: productCategories
        });
      }
      
      return products;
    };
    
    // Gerar dados
    const categoryData = generateCategories(4);
    const productData = generateProducts(categoryData, 30);
    
    return {
      template,
      data: {
        categories: categoryData,
        products: productData
      }
    };
  }

  /**
   * Gera template que pode provocar vazamentos de memória
   * @returns {string} Template HTML
   * @private
   */
  _generateMemoryLeakTemplate() {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Teste de Vazamento de Memória</title>
        <style>
          .memory-intensive { position: relative; }
          .memory-intensive::after { content: attr(data-content); display: none; }
        </style>
      </head>
      <body>
        <h1>Teste de Cenários de Vazamento de Memória</h1>
        
        <!-- Grande quantidade de elementos com referências estendidas -->
        <div class="container">
          {{#each items}}
            <div class="memory-intensive" data-id="{{id}}" data-content="{{description}}">
              <h3>{{title}}</h3>
              <div class="content-wrapper">
                <div class="content">{{content}}</div>
                
                {{#if children}}
                  <div class="children">
                    {{#each children}}
                      <div class="child" data-parent-id="{{../id}}" data-circular-ref="item-{{id}}">
                        <h4>{{title}}</h4>
                        <p>{{content}}</p>
                        
                        {{#if metadata}}
                          <div class="metadata">
                            {{#each metadata}}
                              <div class="meta-item" data-key="{{key}}" data-value="{{value}}">
                                {{key}}: {{value}}
                              </div>
                            {{/each}}
                          </div>
                        {{/if}}
                      </div>
                    {{/each}}
                  </div>
                {{/if}}
              </div>
            </div>
          {{/each}}
        </div>
        
        <!-- Elementos com referências circulares -->
        <div class="circular-references">
          {{#each circularItems}}
            <div class="item" id="item-{{id}}">
              <h3>{{name}}</h3>
              <p>{{description}}</p>
              
              {{#if references}}
                <div class="references">
                  <h4>Referências:</h4>
                  <ul>
                    {{#each references}}
                      <li><a href="#item-{{this}}">Referência para Item {{this}}</a></li>
                    {{/each}}
                  </ul>
                </div>
              {{/if}}
            </div>
          {{/each}}
        </div>
        
        <!-- Grande quantidade de manipulações DOM -->
        <div class="dynamic-content">
          <h2>Conteúdo Dinâmico</h2>
          <div class="dynamic-elements">
            {{#each dynamicElements}}
              <div class="dynamic-element" id="dynamic-{{id}}">
                <template id="template-{{id}}">
                  <div class="template-content">
                    <h3>{{title}}</h3>
                    <div class="template-body">{{{body}}}</div>
                  </div>
                </template>
                
                <div class="render-target" data-template-id="template-{{id}}"></div>
              </div>
            {{/each}}
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Gera dados com referências circulares
   * @returns {Object} Dados com referências circulares
   * @private
   */
  _generateCircularData() {
    // Criar itens base
    const items = [];
    
    for (let i = 0; i < 50; i++) {
      items.push({
        id: i + 1,
        title: `Item ${i + 1}`,
        content: `Conteúdo do item ${i + 1}`,
        description: `Descrição detalhada do item ${i + 1}. Esta é uma descrição longa para ocupar mais memória e potencialmente causar problemas.`.repeat(10),
        children: []
      });
    }
    
    // Adicionar filhos com referências estendidas
    items.forEach(item => {
      const childCount = Math.floor(Math.random() * 5) + 1;
      
      for (let j = 0; j < childCount; j++) {
        const metadata = [];
        const metadataCount = Math.floor(Math.random() * 10) + 5;
        
        for (let k = 0; k < metadataCount; k++) {
          metadata.push({
            key: `meta-${k}`,
            value: `valor-${k}-${Math.random().toString(36).substring(2, 15)}`
          });
        }
        
        item.children.push({
          id: `${item.id}-${j + 1}`,
          title: `Filho ${j + 1} de ${item.title}`,
          content: `Conteúdo do filho ${j + 1}`,
          metadata
        });
      }
    });
    
    // Criar itens com referências circulares
    const circularItems = [];
    
    for (let i = 0; i < 20; i++) {
      circularItems.push({
        id: i + 1,
        name: `Item Circular ${i + 1}`,
        description: `Item com referências circulares ${i + 1}`,
        references: []
      });
    }
    
    // Adicionar referências circulares
    circularItems.forEach(item => {
      const refCount = Math.floor(Math.random() * 5) + 1;
      
      for (let j = 0; j < refCount; j++) {
        let refId;
        
        do {
          refId = Math.floor(Math.random() * circularItems.length) + 1;
        } while (refId === item.id || item.references.includes(refId));
        
        item.references.push(refId);
      }
    });
    
    // Criar elementos dinâmicos
    const dynamicElements = [];
    
    for (let i = 0; i < 30; i++) {
      dynamicElements.push({
        id: i + 1,
        title: `Elemento Dinâmico ${i + 1}`,
        body: `<div class="dynamic-content-body">
          <p>Este é um conteúdo que pode ser renderizado dinamicamente.</p>
          <p>Conteúdo detalhado do elemento ${i + 1}</p>
          <div class="nested-content">
            <ul>
              ${Array(10).fill(0).map((_, idx) => `<li>Item ${idx + 1}</li>`).join('')}
            </ul>
          </div>
        </div>`
      });
    }
    
    // Criar referência circular explícita no nível raiz
    const circularRef = {
      name: 'Referência Circular',
      child: null
    };
    
    circularRef.child = {
      parent: circularRef
    };
    
    return {
      items,
      circularItems,
      dynamicElements,
      circularRef
    };
  }

  /**
   * Gera template com animações e transições
   * @returns {string} Template HTML
   * @private
   */
  _generateAnimatedTemplate() {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Teste de Renderização com Animações</title>
        <style>
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          @keyframes slideIn {
            from { transform: translateY(50px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }
          
          .animated {
            animation: fadeIn 0.5s ease-out;
          }
          
          .slide-in {
            animation: slideIn 0.7s ease-out;
          }
          
          .pulse {
            animation: pulse 2s infinite;
          }
          
          .staggered-item {
            opacity: 0;
            animation: fadeIn 0.5s ease-out forwards;
          }
          
          .staggered-container > div:nth-child(1) { animation-delay: 0.1s; }
          .staggered-container > div:nth-child(2) { animation-delay: 0.2s; }
          .staggered-container > div:nth-child(3) { animation-delay: 0.3s; }
          .staggered-container > div:nth-child(4) { animation-delay: 0.4s; }
          .staggered-container > div:nth-child(5) { animation-delay: 0.5s; }
          .staggered-container > div:nth-child(6) { animation-delay: 0.6s; }
          .staggered-container > div:nth-child(7) { animation-delay: 0.7s; }
          .staggered-container > div:nth-child(8) { animation-delay: 0.8s; }
          
          .transition-element {
            transition: all 0.3s ease;
          }
          
          .transition-element:hover {
            transform: scale(1.1);
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
          }
          
          .progress-bar {
            height: 5px;
            width: 0%;
            background-color: #4CAF50;
            transition: width 1s ease-out;
          }
          
          .product-card {
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 15px;
            margin: 10px;
            width: 250px;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
          }
          
          .product-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
          }
          
          .banner {
            height: 200px;
            background: linear-gradient(45deg, #6a11cb, #2575fc);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 24px;
            margin-bottom: 20px;
            overflow: hidden;
            position: relative;
          }
          
          .banner::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
            animation: shine 3s infinite;
          }
          
          @keyframes shine {
            to {
              left: 100%;
            }
          }
          
          .section {
            margin: 30px 0;
            opacity: 0;
            transform: translateY(20px);
            transition: opacity 0.6s ease, transform 0.6s ease;
          }
          
          .section.visible {
            opacity: 1;
            transform: translateY(0);
          }
        </style>
      </head>
      <body>
        <div class="banner animated">
          <h1>Loja Online Animada</h1>
        </div>
        
        <div class="progress-bar" style="width: 100%;"></div>
        
        <section class="section" id="section1">
          <h2 class="slide-in">Produtos em Destaque</h2>
          
          <div class="staggered-container">
            {{#each featuredProducts}}
              <div class="product-card staggered-item transition-element">
                <h3>{{name}}</h3>
                <p>{{description}}</p>
                <div class="price {{#if special}}pulse{{/if}}">R$ {{price}}</div>
                <button class="transition-element">Adicionar ao Carrinho</button>
              </div>
            {{/each}}
          </div>
        </section>
        
        <section class="section" id="section2">
          <h2 class="slide-in">Categorias Populares</h2>
          
          <div class="staggered-container">
            {{#each categories}}
              <div class="product-card staggered-item transition-element">
                <h3>{{name}}</h3>
                <p>{{productCount}} produtos</p>
                <button class="transition-element">Ver Categoria</button>
              </div>
            {{/each}}
          </div>
        </section>
        
        <section class="section" id="section3">
          <h2 class="slide-in">Promoções Especiais</h2>
          
          <div class="staggered-container">
            {{#each promotions}}
              <div class="product-card staggered-item transition-element">
                <h3>{{title}}</h3>
                <p>{{description}}</p>
                <div class="pulse">{{discount}}% OFF</div>
                <button class="transition-element">Ver Oferta</button>
              </div>
            {{/each}}
          </div>
        </section>
        
        <script>
          // Este script seria executado no cliente para ativar animações
          document.querySelectorAll('.section').forEach((section, index) => {
            setTimeout(() => {
              section.classList.add('visible');
            }, 300 * (index + 1));
          });
        </script>
      </body>
      </html>
    `;
  }

  /**
   * Conta componentes em um template
   * @param {string} template - Template HTML
   * @returns {number} Número de componentes
   * @private
   */
  _countComponents(template) {
    // Contar diferentes tipos de elementos HTML
    const { JSDOM } = require('jsdom');
    const dom = new JSDOM(template);
    const document = dom.window.document;
    
    // Elementos básicos que geralmente representam um "componente"
    const selectors = [
      'div.product-card', 'div.category-card', 'section', 'article',
      'form', 'table', 'nav', 'header', 'footer', 'aside',
      'div.sidebar', 'div.cart', 'div.search', 'div.filters'
    ];
    
    // Contar elementos
    let count = 0;
    
    selectors.forEach(selector => {
      count += document.querySelectorAll(selector).length;
    });
    
    // Contar tags de template Handlebars
    const handlebarsTagsMatches = template.match(/{{\s*#each[^}]*}}/g);
    if (handlebarsTagsMatches) {
      count += handlebarsTagsMatches.length;
    }
    
    return count;
  }

  /**
   * Executa uma função de renderização com timeout
   * @param {Function} renderFn - Função de renderização
   * @param {string} template - Template HTML
   * @param {Object} data - Dados para renderização
   * @returns {Promise<string>} HTML renderizado
   * @private
   */
  async _renderWithTimeout(renderFn, template, data) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout na renderização'));
      }, this.options.timeoutMs);
      
      renderFn(template, data)
        .then(result => {
          clearTimeout(timeout);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeout);
          reject(error);
        });
    });
  }
}

module.exports = ExtremeTestCases;

// Executar testes extremos se chamado diretamente
if (require.main === module) {
  const testCases = new ExtremeTestCases();
  
  testCases.initialize()
    .then(() => testCases.runAllTests())
    .then(() => {
      logger.success('Todos os testes extremos concluídos com sucesso!');
    })
    .catch(error => {
      logger.error(`Erro nos testes extremos: ${error.message}`);
    });
}
