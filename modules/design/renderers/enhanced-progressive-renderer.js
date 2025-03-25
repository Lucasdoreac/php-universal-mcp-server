/**
 * Enhanced Progressive Renderer
 * 
 * Implementação avançada do renderizador progressivo com otimização de memória
 * e melhorias de desempenho para templates extremamente grandes.
 * 
 * @author PHP Universal MCP Server Team
 * @version 1.0.0
 */

const ProgressiveRenderer = require('./progressive-renderer');
const MemoryOptimizer = require('./memory-optimizer');
const EventEmitter = require('events');

/**
 * Renderizador progressivo aprimorado com suporte para templates extremamente grandes
 * e otimização avançada de memória
 */
class EnhancedProgressiveRenderer {
  /**
   * Construtor do renderizador aprimorado
   * @param {Object} options - Opções de configuração
   */
  constructor(options = {}) {
    this.options = {
      // Habilitar otimização de memória
      memoryOptimization: true,
      // Tamanho mínimo (em KB) para ativar otimização de memória
      memoryOptimizationThreshold: 200,
      // Limite de memória (em MB) para otimizações agressivas
      memoryLimit: 300,
      // Modo de rendering (full, incremental, streaming)
      renderMode: 'incremental',
      // Habilitar renderização paralela para chunks independentes
      parallelRendering: true,
      // Número máximo de workers paralelos
      maxParallelWorkers: 2,
      // Timeout para renderização (ms)
      renderTimeout: 60000,
      // Habilitar log detalhado
      debug: false,
      ...options
    };
    
    // Criar instância do renderizador progressivo básico
    this.renderer = new ProgressiveRenderer({
      ...options,
      debug: this.options.debug
    });
    
    // Criar instância do otimizador de memória
    this.memoryOptimizer = new MemoryOptimizer({
      chunkSize: this.options.memoryOptimizationThreshold,
      memoryThreshold: this.options.memoryLimit,
      debug: this.options.debug
    });
    
    // Sistema de eventos
    this.events = new EventEmitter();
    
    // Configurar handlers de eventos para o otimizador de memória
    this._setupEventHandlers();
    
    // Sistema de logging
    this.logger = {
      debug: (...args) => this.options.debug && console.log('[EnhancedRenderer:DEBUG]', ...args),
      info: (...args) => console.log('[EnhancedRenderer:INFO]', ...args),
      warn: (...args) => console.warn('[EnhancedRenderer:WARN]', ...args),
      error: (...args) => console.error('[EnhancedRenderer:ERROR]', ...args)
    };
  }

  /**
   * Configura os handlers de eventos
   * @private
   */
  _setupEventHandlers() {
    // Repassar eventos do otimizador de memória
    this.memoryOptimizer.on('progress', (data) => {
      this.events.emit('progress', {
        ...data,
        stage: 'rendering'
      });
    });
    
    this.memoryOptimizer.on('memory-warning', (data) => {
      this.events.emit('memory-warning', data);
    });
    
    this.memoryOptimizer.on('complete', (data) => {
      this.events.emit('render-complete', data);
    });
  }

  /**
   * Renderiza um template de forma otimizada
   * @param {string} template - Template HTML a ser renderizado
   * @param {Object} data - Dados para renderização
   * @returns {Promise<string>} Template HTML renderizado
   */
  async render(template, data = {}) {
    this.logger.info(`Iniciando renderização de template (${(template.length / 1024).toFixed(2)}KB)`);
    
    // Decidir se deve usar otimização de memória
    const useMemoryOptimization = this.options.memoryOptimization && 
                                 template.length > this.options.memoryOptimizationThreshold * 1024;
    
    // Armazenar tempo de início
    const startTime = Date.now();
    
    try {
      // Se o template for muito grande, usar otimização de memória
      if (useMemoryOptimization) {
        this.logger.info(`Usando otimização de memória para template grande`);
        
        // Função de processamento para cada chunk
        const chunkProcessor = async (chunk, context) => {
          this.logger.debug(`Processando chunk ${context.chunkIndex + 1}/${context.totalChunks} (${(chunk.length / 1024).toFixed(2)}KB)`);
          
          // Aplicar renderização progressiva ao chunk
          return await this.renderer.render(chunk, {
            ...data,
            _chunkContext: context
          });
        };
        
        // Processar com otimização de memória
        return await this.memoryOptimizer.processWithMemoryOptimization(template, chunkProcessor, {
          renderMode: this.options.renderMode
        });
      } 
      // Caso contrário, usar renderizador padrão
      else {
        this.logger.debug(`Usando renderizador padrão para template de tamanho moderado`);
        return await this.renderer.render(template, data);
      }
    } catch (error) {
      this.logger.error(`Erro durante renderização: ${error.message}`);
      
      // Emitir evento de erro
      this.events.emit('error', {
        message: error.message,
        stack: error.stack,
        templateSize: template.length
      });
      
      throw error;
    } finally {
      // Calcular tempo de execução
      const executionTime = Date.now() - startTime;
      
      this.logger.info(`Renderização concluída em ${executionTime}ms`);
      
      // Emitir evento de conclusão
      this.events.emit('complete', {
        executionTime,
        templateSize: template.length,
        memoryOptimization: useMemoryOptimization,
        memoryStats: this.memoryOptimizer.getMemoryStats()
      });
    }
  }

  /**
   * Renderiza um template no modo streaming, retornando partes do HTML à medida
   * que são processadas
   * @param {string} template - Template HTML a ser renderizado
   * @param {Object} data - Dados para renderização
   * @param {Function} chunkCallback - Função chamada para cada chunk renderizado
   * @returns {Promise<void>} Promise que resolve quando todo o template for processado
   */
  async renderStreaming(template, data = {}, chunkCallback) {
    if (!chunkCallback || typeof chunkCallback !== 'function') {
      throw new Error('É necessário fornecer um callback para receber os chunks renderizados');
    }
    
    this.logger.info(`Iniciando renderização streaming (${(template.length / 1024).toFixed(2)}KB)`);
    
    // Armazenar tempo de início
    const startTime = Date.now();
    
    try {
      // Dividir o template em chunks
      const chunks = this.memoryOptimizer.chunkifyTemplate(template);
      
      // Processar cada chunk de forma sequencial
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        this.logger.debug(`Processando chunk streaming ${i + 1}/${chunks.length} (${(chunk.length / 1024).toFixed(2)}KB)`);
        
        // Renderizar o chunk
        const renderedChunk = await this.renderer.render(chunk, {
          ...data,
          _chunkContext: {
            chunkIndex: i,
            totalChunks: chunks.length,
            isFirstChunk: i === 0,
            isLastChunk: i === chunks.length - 1
          }
        });
        
        // Enviar o chunk renderizado para o callback
        chunkCallback(renderedChunk, {
          chunkIndex: i,
          totalChunks: chunks.length,
          isFirstChunk: i === 0,
          isLastChunk: i === chunks.length - 1,
          progress: Math.round(((i + 1) / chunks.length) * 100)
        });
        
        // Emitir evento de progresso
        this.events.emit('progress', {
          chunk: i + 1,
          totalChunks: chunks.length,
          percent: Math.round(((i + 1) / chunks.length) * 100),
          stage: 'streaming'
        });
        
        // Liberar memória após cada chunk
        if (typeof global.gc === 'function') {
          global.gc();
        }
      }
    } catch (error) {
      this.logger.error(`Erro durante renderização streaming: ${error.message}`);
      
      // Emitir evento de erro
      this.events.emit('error', {
        message: error.message,
        stack: error.stack,
        templateSize: template.length
      });
      
      throw error;
    } finally {
      // Calcular tempo de execução
      const executionTime = Date.now() - startTime;
      
      this.logger.info(`Renderização streaming concluída em ${executionTime}ms`);
      
      // Emitir evento de conclusão
      this.events.emit('complete', {
        executionTime,
        templateSize: template.length,
        chunks: chunks.length,
        memoryStats: this.memoryOptimizer.getMemoryStats()
      });
    }
  }

  /**
   * Renderiza um template com otimização baseada em análise de prioridade
   * @param {string} template - Template HTML a ser renderizado
   * @param {Object} data - Dados para renderização
   * @returns {Promise<Object>} Objeto com HTML renderizado e metadados
   */
  async renderWithPriorityAnalysis(template, data = {}) {
    this.logger.info(`Iniciando renderização com análise de prioridade (${(template.length / 1024).toFixed(2)}KB)`);
    
    // Armazenar tempo de início
    const startTime = Date.now();
    
    try {
      // Analisar estrutura do template para identificar componentes prioritários
      const structureAnalysis = await this._analyzeTemplateStructure(template);
      
      // Definir prioridades com base na análise
      const priorities = this._calculateRenderingPriorities(structureAnalysis);
      
      // Decidir se deve usar otimização de memória
      const useMemoryOptimization = this.options.memoryOptimization && 
                                   template.length > this.options.memoryOptimizationThreshold * 1024;
      
      let renderedHTML;
      
      // Renderizar com otimização conforme necessário
      if (useMemoryOptimization) {
        // Função de processamento para cada chunk, aplicando prioridades
        const chunkProcessor = async (chunk, context) => {
          return await this.renderer.render(chunk, {
            ...data,
            _priorities: priorities,
            _chunkContext: context
          });
        };
        
        // Processar com otimização de memória
        renderedHTML = await this.memoryOptimizer.processWithMemoryOptimization(template, chunkProcessor, {
          renderMode: this.options.renderMode,
          priorities
        });
      } else {
        // Renderizar diretamente com prioridades
        renderedHTML = await this.renderer.render(template, {
          ...data,
          _priorities: priorities
        });
      }
      
      // Calcular tempo de execução
      const executionTime = Date.now() - startTime;
      
      // Retornar HTML renderizado e metadados
      return {
        html: renderedHTML,
        stats: {
          executionTime,
          templateSize: template.length,
          priorities,
          memoryOptimization: useMemoryOptimization,
          memoryStats: this.memoryOptimizer.getMemoryStats()
        }
      };
    } catch (error) {
      this.logger.error(`Erro durante renderização com análise de prioridade: ${error.message}`);
      
      // Emitir evento de erro
      this.events.emit('error', {
        message: error.message,
        stack: error.stack,
        templateSize: template.length
      });
      
      throw error;
    }
  }

  /**
   * Analisa a estrutura do template para identificação de componentes
   * @param {string} template - Template HTML a ser analisado
   * @returns {Promise<Object>} Análise da estrutura do template
   * @private
   */
  async _analyzeTemplateStructure(template) {
    this.logger.debug('Analisando estrutura do template');
    
    // Utilizar otimizador de memória para análise de DOM em templates grandes
    return await this.memoryOptimizer.optimizedDOMProcessing(async () => {
      try {
        // Usar o renderer para analisar estrutura (método interno)
        if (typeof this.renderer._analyzeStructure === 'function') {
          return await this.renderer._analyzeStructure(template);
        }
        
        // Implementação básica se não existir no renderer
        const { JSDOM } = require('jsdom');
        const dom = new JSDOM(template);
        const document = dom.window.document;
        
        // Análise básica de componentes
        const components = {
          aboveTheFold: [],
          belowTheFold: [],
          criticalElements: []
        };
        
        // Identificar elementos críticos (cabeçalho, navegação, hero)
        const header = document.querySelector('header');
        if (header) components.criticalElements.push('header');
        
        const nav = document.querySelector('nav');
        if (nav) components.criticalElements.push('nav');
        
        const hero = document.querySelector('.hero, .jumbotron, .banner');
        if (hero) components.criticalElements.push('hero');
        
        // Analisar elementos acima e abaixo da dobra (estimativa)
        const allElements = Array.from(document.body.querySelectorAll('*'));
        
        // Dividir elementos pela posição aproximada (primeiros 70% são considerados acima da dobra)
        const foldIndex = Math.floor(allElements.length * 0.7);
        
        components.aboveTheFold = allElements.slice(0, foldIndex)
          .map(el => el.tagName.toLowerCase())
          .filter((tag, index, self) => self.indexOf(tag) === index);
        
        components.belowTheFold = allElements.slice(foldIndex)
          .map(el => el.tagName.toLowerCase())
          .filter((tag, index, self) => self.indexOf(tag) === index);
        
        return {
          components,
          totalElements: allElements.length,
          structure: {
            hasHeader: !!header,
            hasFooter: !!document.querySelector('footer'),
            mainContentElements: document.querySelectorAll('main, article, section').length
          }
        };
      } catch (error) {
        this.logger.error(`Erro ao analisar estrutura: ${error.message}`);
        
        // Retornar análise vazia em caso de erro
        return {
          components: {
            aboveTheFold: [],
            belowTheFold: [],
            criticalElements: []
          },
          totalElements: 0,
          structure: {
            hasHeader: false,
            hasFooter: false,
            mainContentElements: 0
          }
        };
      }
    });
  }

  /**
   * Calcula prioridades de renderização com base na análise da estrutura
   * @param {Object} structureAnalysis - Análise da estrutura do template
   * @returns {Object} Prioridades de renderização
   * @private
   */
  _calculateRenderingPriorities(structureAnalysis) {
    // Elementos críticos sempre têm prioridade máxima
    const criticalSelectors = ['header', 'nav', '.navbar', '.hero', '.jumbotron', '.banner', 'h1', 'main > h2'];
    
    // Adicionar elementos críticos identificados na análise
    if (structureAnalysis.components && structureAnalysis.components.criticalElements) {
      criticalSelectors.push(...structureAnalysis.components.criticalElements);
    }
    
    // Elementos de alta prioridade (acima da dobra)
    const highPrioritySelectors = ['main', 'article', 'section:first-of-type', '.content', '.product', '.featured'];
    
    // Adicionar elementos acima da dobra identificados na análise
    if (structureAnalysis.components && structureAnalysis.components.aboveTheFold) {
      // Adicionar apenas elementos significativos
      const aboveFoldTags = structureAnalysis.components.aboveTheFold
        .filter(tag => !['div', 'span', 'p', 'br', 'hr', 'a'].includes(tag))
        .map(tag => tag);
      
      highPrioritySelectors.push(...aboveFoldTags);
    }
    
    // Elementos de baixa prioridade (abaixo da dobra, rodapé, sidebar)
    const lowPrioritySelectors = ['footer', 'aside', '.sidebar', '.comments', '.related', '.similar-products'];
    
    // Retornar prioridades calculadas
    return {
      critical: criticalSelectors,
      high: highPrioritySelectors,
      low: lowPrioritySelectors
    };
  }

  /**
   * Registra uma função de callback para o evento especificado
   * @param {string} event - Nome do evento
   * @param {Function} callback - Função de callback
   */
  on(event, callback) {
    this.events.on(event, callback);
  }

  /**
   * Remove uma função de callback de um evento
   * @param {string} event - Nome do evento
   * @param {Function} callback - Função de callback
   */
  off(event, callback) {
    this.events.off(event, callback);
  }

  /**
   * Retorna estatísticas do renderizador
   * @returns {Object} Estatísticas de renderização
   */
  getStats() {
    return {
      renderer: this.renderer.stats || {},
      memory: this.memoryOptimizer.getMemoryStats()
    };
  }
}

module.exports = EnhancedProgressiveRenderer;
