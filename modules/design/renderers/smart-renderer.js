/**
 * Smart Renderer para PHP Universal MCP Server
 * 
 * Integrador inteligente que escolhe automaticamente o melhor renderizador
 * com base na complexidade e características do template.
 * 
 * @author PHP Universal MCP Server Team
 * @version 1.0.0
 */

const { JSDOM } = require('jsdom');
const ProgressiveRenderer = require('./progressive-renderer');
const EnhancedProgressiveRenderer = require('./enhanced-progressive-renderer');
const StreamingRenderer = require('./streaming-renderer');
const EdgeCaseOptimizer = require('./edge-case-optimizer');
const AdvancedEdgeCaseOptimizer = require('./edge-case-optimizer-advanced');
const logger = require('../../../utils/logger');

/**
 * Smart Renderer - Escolhe e integra automaticamente o melhor renderizador
 */
class SmartRenderer {
  /**
   * Construtor
   * @param {Object} options - Opções de configuração
   */
  constructor(options = {}) {
    this.options = {
      // Habilitar escolha automática de renderizador
      autoSelectRenderer: true,
      // Tamanho (em KB) a partir do qual usar EnhancedProgressiveRenderer
      enhancedThreshold: 300,
      // Tamanho (em KB) a partir do qual usar streaming
      streamingThreshold: 1000,
      // Tolerância para edge cases
      edgeCaseThreshold: 5,
      // Complexidade de DOM a partir da qual usar otimizações avançadas
      complexityThreshold: 1000,
      // Usar aprendizado para melhorar a seleção
      useLearning: true,
      // Log detalhado
      debug: false,
      // Renderizador padrão (progressive, enhanced, streaming)
      defaultRenderer: 'progressive',
      // Otimização de edge cases
      optimizeEdgeCases: true,
      // Usar otimização avançada para edge cases
      advancedOptimization: true,
      // Pesos para cada aspecto ao tomar decisões
      weights: {
        size: 0.4,
        elements: 0.3,
        edgeCases: 0.2,
        depth: 0.1
      },
      ...options
    };

    // Inicializar renderizadores
    this.renderers = {
      progressive: new ProgressiveRenderer(options),
      enhanced: new EnhancedProgressiveRenderer(options),
      streaming: new StreamingRenderer(options)
    };

    // Inicializar otimizadores
    this.optimizers = {
      basic: new EdgeCaseOptimizer(options),
      advanced: new AdvancedEdgeCaseOptimizer(options)
    };

    // Cache de decisões tomadas
    this.decisionsCache = new Map();

    // Sistema de logging
    this.logger = {
      debug: (...args) => this.options.debug && console.log('[SmartRenderer:DEBUG]', ...args),
      info: (...args) => console.log('[SmartRenderer:INFO]', ...args),
      warn: (...args) => console.warn('[SmartRenderer:WARN]', ...args),
      error: (...args) => console.error('[SmartRenderer:ERROR]', ...args)
    };

    this.logger.info('SmartRenderer inicializado com sucesso');
  }

  /**
   * Renderiza um template usando o renderizador mais adequado
   * @param {string} template - Template HTML a renderizar
   * @param {Object} data - Dados para a renderização
   * @param {Object} options - Opções adicionais
   * @returns {Promise<string>} HTML renderizado
   */
  async render(template, data = {}, options = {}) {
    const startTime = Date.now();
    const mergedOptions = { ...this.options, ...options };

    try {
      // Analisar template para decisão inteligente
      const analysis = await this._analyzeTemplate(template);
      
      // Escolher o melhor renderizador com base na análise
      const rendererInfo = this._selectBestRenderer(template, analysis, mergedOptions);
      const { renderer, optimize, useAdvancedOptimizer } = rendererInfo;
      
      this.logger.info(`Renderizador selecionado: ${renderer}, otimização: ${optimize}, avançada: ${useAdvancedOptimizer}`);
      
      let optimizedTemplate = template;
      let optimizationResult = null;
      
      // Aplicar otimização de edge cases se necessário
      if (optimize && mergedOptions.optimizeEdgeCases) {
        const optimizer = useAdvancedOptimizer ? this.optimizers.advanced : this.optimizers.basic;
        this.logger.info(`Aplicando otimização de edge cases com ${useAdvancedOptimizer ? 'otimizador avançado' : 'otimizador básico'}`);
        
        try {
          optimizationResult = await optimizer.optimize(template);
          optimizedTemplate = optimizationResult.html;
          
          this.logger.info(`Otimização concluída: ${optimizationResult.metrics.reductionPercent.toFixed(2)}% de redução`);
        } catch (error) {
          this.logger.error(`Erro na otimização: ${error.message}`);
          // Continuar com o template original em caso de erro
        }
      }
      
      // Renderizar com o renderizador selecionado
      let result;
      
      // Tratamento especial para o modo streaming
      if (renderer === 'streaming' && options.streamingCallback) {
        await this.renderers.streaming.renderStreaming(
          optimizedTemplate, 
          data,
          options.streamingCallback
        );
        
        // Retornar resultado vazio
        result = '';
      } else {
        // Renderizar com o renderizador selecionado
        result = await this.renderers[renderer].render(optimizedTemplate, data);
      }
      
      // Aprender com esta renderização
      if (mergedOptions.useLearning) {
        this._learnFromRendering(template, analysis, {
          renderer,
          optimize,
          useAdvancedOptimizer,
          renderTime: Date.now() - startTime,
          optimizationResult
        });
      }
      
      return result;
    } catch (error) {
      this.logger.error(`Erro na renderização: ${error.message}`);
      
      // Em caso de erro, tentar renderização com Progressive Renderer como fallback
      this.logger.info('Usando Progressive Renderer como fallback');
      return this.renderers.progressive.render(template, data);
    }
  }

  /**
   * Analisa um template para coletar métricas
   * @param {string} template - Template HTML
   * @returns {Promise<Object>} Análise do template
   * @private
   */
  async _analyzeTemplate(template) {
    this.logger.debug('Analisando template para decisão inteligente');

    try {
      // Verificar cache para template idêntico
      const templateHash = this._hashString(template);
      if (this.decisionsCache.has(templateHash)) {
        this.logger.debug('Usando análise em cache');
        return this.decisionsCache.get(templateHash).analysis;
      }

      // Calcular tamanho em KB
      const sizeKB = template.length / 1024;

      // Analisar DOM para coletar métricas
      const dom = new JSDOM(template);
      const document = dom.window.document;

      // Contar elementos
      const elements = document.querySelectorAll('*').length;

      // Calcular profundidade máxima do DOM
      const depthMap = new Map();
      let maxDepth = 0;

      const calculateDepth = (element, depth = 0) => {
        depthMap.set(element, depth);
        maxDepth = Math.max(maxDepth, depth);

        for (const child of element.children) {
          calculateDepth(child, depth + 1);
        }
      };

      calculateDepth(document.documentElement);

      // Detectar edge cases (simplificado)
      const edgeCases = [];

      // Tabelas aninhadas
      const nestedTables = document.querySelectorAll('table table');
      if (nestedTables.length > 0) {
        edgeCases.push({ type: 'nested_tables', count: nestedTables.length });
      }

      // Flexbox aninhados
      const flexElements = document.querySelectorAll('[style*="display: flex"], [style*="display:flex"], .flex, .d-flex');
      let nestedFlexCount = 0;
      for (const el of flexElements) {
        let parent = el.parentElement;
        while (parent) {
          if (
            (parent.style && (
              parent.style.display === 'flex' || 
              parent.style.display === 'inline-flex'
            )) || 
            (parent.className && (
              parent.className.includes('flex') || 
              parent.className.includes('d-flex')
            ))
          ) {
            nestedFlexCount++;
            break;
          }
          parent = parent.parentElement;
        }
      }
      if (nestedFlexCount > 0) {
        edgeCases.push({ type: 'nested_flexboxes', count: nestedFlexCount });
      }

      // Grids excessivas
      const grids = document.querySelectorAll('[style*="display: grid"], [style*="display:grid"], .grid');
      let largeGridCount = 0;
      for (const grid of grids) {
        if (grid.children.length > 50) {
          largeGridCount++;
        }
      }
      if (largeGridCount > 0) {
        edgeCases.push({ type: 'large_grids', count: largeGridCount });
      }

      // Estruturas recursivas
      const recursiveElements = [];
      const classMap = new Map();

      document.querySelectorAll('[class]').forEach(el => {
        const classes = el.className.split(/\s+/);

        classes.forEach(cls => {
          if (!cls) return;

          if (!classMap.has(cls)) {
            classMap.set(cls, []);
          }
          classMap.get(cls).push(el);
        });
      });

      classMap.forEach((elements, cls) => {
        if (elements.length < 2) return;

        // Verificar se há aninhamento de mesma classe
        let hasNesting = false;
        for (const el of elements) {
          const parent = el.parentElement;
          if (parent && parent.className && parent.className.includes(cls)) {
            hasNesting = true;
            recursiveElements.push(el);
            break;
          }
        }
      });

      if (recursiveElements.length > 0) {
        edgeCases.push({ type: 'recursive_elements', count: recursiveElements.length });
      }

      // Calcular complexidade
      const complexity = this._calculateComplexity(elements, maxDepth, edgeCases.length, sizeKB);

      const analysis = {
        sizeKB,
        elements,
        maxDepth,
        edgeCases,
        complexity
      };

      // Armazenar no cache
      this.decisionsCache.set(templateHash, {
        analysis,
        timestamp: Date.now()
      });

      return analysis;
    } catch (error) {
      this.logger.error(`Erro na análise do template: ${error.message}`);
      
      // Retornar análise básica baseada apenas no tamanho
      return {
        sizeKB: template.length / 1024,
        elements: 0,
        maxDepth: 0,
        edgeCases: [],
        complexity: 0
      };
    }
  }

  /**
   * Calcula complexidade geral do template
   * @param {number} elements - Número de elementos
   * @param {number} depth - Profundidade máxima do DOM
   * @param {number} edgeCasesCount - Número de edge cases detectados
   * @param {number} sizeKB - Tamanho em KB
   * @returns {number} Pontuação de complexidade
   * @private
   */
  _calculateComplexity(elements, depth, edgeCasesCount, sizeKB) {
    const { weights } = this.options;
    
    // Normalizar cada métrica
    const normalizedSize = Math.min(1, sizeKB / 2000); // Caps at 2MB
    const normalizedElements = Math.min(1, elements / 10000); // Caps at 10k elements
    const normalizedEdgeCases = Math.min(1, edgeCasesCount / 20); // Caps at 20 edge cases
    const normalizedDepth = Math.min(1, depth / 50); // Caps at depth of 50
    
    // Calcular complexidade ponderada
    return (
      weights.size * normalizedSize +
      weights.elements * normalizedElements +
      weights.edgeCases * normalizedEdgeCases +
      weights.depth * normalizedDepth
    ) * 100; // Scale to 0-100
  }

  /**
   * Seleciona o melhor renderizador com base na análise do template
   * @param {string} template - Template HTML
   * @param {Object} analysis - Análise do template
   * @param {Object} options - Opções adicionais
   * @returns {Object} Informações sobre o renderizador selecionado
   * @private
   */
  _selectBestRenderer(template, analysis, options) {
    const { 
      autoSelectRenderer, 
      defaultRenderer, 
      enhancedThreshold, 
      streamingThreshold, 
      edgeCaseThreshold, 
      complexityThreshold 
    } = options;
    
    // Se seleção automática estiver desativada, usar renderizador padrão
    if (!autoSelectRenderer) {
      return { 
        renderer: defaultRenderer, 
        optimize: false, 
        useAdvancedOptimizer: false 
      };
    }
    
    // Calcular pontuação para cada renderizador
    const scores = {
      progressive: 0,
      enhanced: 0,
      streaming: 0
    };
    
    // Score baseado no tamanho
    if (analysis.sizeKB < enhancedThreshold) {
      scores.progressive += 10;
    } else if (analysis.sizeKB < streamingThreshold) {
      scores.enhanced += 10;
    } else {
      scores.streaming += 10;
    }
    
    // Score baseado no número de elementos
    if (analysis.elements < 1000) {
      scores.progressive += 5;
    } else if (analysis.elements < 5000) {
      scores.enhanced += 5;
    } else {
      scores.streaming += 5;
    }
    
    // Score baseado em edge cases
    if (analysis.edgeCases.length < 3) {
      scores.progressive += 3;
    } else if (analysis.edgeCases.length < edgeCaseThreshold) {
      scores.enhanced += 3;
    } else {
      scores.streaming += 3;
    }
    
    // Score baseado na profundidade do DOM
    if (analysis.maxDepth < 10) {
      scores.progressive += 2;
    } else if (analysis.maxDepth < 20) {
      scores.enhanced += 2;
    } else {
      scores.streaming += 2;
    }
    
    // Decisão para otimização de edge cases
    const optimize = analysis.edgeCases.length >= 2;
    
    // Decisão para otimizador avançado
    const useAdvancedOptimizer = 
      analysis.complexity >= complexityThreshold || 
      analysis.edgeCases.length >= edgeCaseThreshold;
    
    // Escolher o renderizador com maior pontuação
    let renderer = 'progressive';
    let maxScore = scores.progressive;
    
    if (scores.enhanced > maxScore) {
      renderer = 'enhanced';
      maxScore = scores.enhanced;
    }
    
    if (scores.streaming > maxScore) {
      renderer = 'streaming';
    }
    
    // Logs de decisão
    this.logger.debug(`Pontuações: Progressive=${scores.progressive}, Enhanced=${scores.enhanced}, Streaming=${scores.streaming}`);
    this.logger.debug(`Decisão final: ${renderer} (optimize=${optimize}, advanced=${useAdvancedOptimizer})`);
    
    return { renderer, optimize, useAdvancedOptimizer };
  }

  /**
   * Aprende com os resultados da renderização
   * @param {string} template - Template HTML
   * @param {Object} analysis - Análise do template
   * @param {Object} result - Resultado da renderização
   * @private
   */
  _learnFromRendering(template, analysis, result) {
    // Armazenar resultado no cache
    const templateHash = this._hashString(template);
    
    if (this.decisionsCache.has(templateHash)) {
      const cached = this.decisionsCache.get(templateHash);
      cached.lastRendering = result;
      cached.renderCount = (cached.renderCount || 0) + 1;
      this.decisionsCache.set(templateHash, cached);
    }
    
    // Ajustar pesos com base nos resultados
    // Implementação simples que será expandida em versões futuras
    if (result.renderTime > 5000) {
      // Se o tempo de renderização for muito alto, aumentar o peso do tamanho
      this.options.weights.size += 0.05;
      this.options.weights.elements -= 0.02;
      this.options.weights.edgeCases -= 0.02;
      this.options.weights.depth -= 0.01;
      
      // Normalizar para soma = 1
      const sum = Object.values(this.options.weights).reduce((a, b) => a + b, 0);
      for (const key in this.options.weights) {
        this.options.weights[key] /= sum;
      }
    }
    
    this.logger.debug('Aprendizado atualizado com base nos resultados');
  }

  /**
   * Gera um hash simples para uma string
   * @param {string} str - String para hash
   * @returns {string} Hash
   * @private
   */
  _hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(16);
  }

  /**
   * Retorna métricas e estatísticas do renderizador
   * @returns {Object} Métricas e estatísticas
   */
  getMetrics() {
    const metrics = {
      decisionsCache: {
        size: this.decisionsCache.size,
        items: []
      },
      rendererUsage: {
        progressive: 0,
        enhanced: 0,
        streaming: 0
      },
      optimizationUsage: {
        none: 0,
        basic: 0,
        advanced: 0
      }
    };

    // Coletar estatísticas do cache
    for (const [hash, data] of this.decisionsCache.entries()) {
      if (data.lastRendering) {
        // Contar uso de renderizadores
        metrics.rendererUsage[data.lastRendering.renderer]++;
        
        // Contar uso de otimizações
        if (!data.lastRendering.optimize) {
          metrics.optimizationUsage.none++;
        } else if (data.lastRendering.useAdvancedOptimizer) {
          metrics.optimizationUsage.advanced++;
        } else {
          metrics.optimizationUsage.basic++;
        }
        
        // Adicionar item à lista limitada
        if (metrics.decisionsCache.items.length < 10) {
          metrics.decisionsCache.items.push({
            hash: hash.substring(0, 8),
            analysis: {
              sizeKB: data.analysis.sizeKB,
              elements: data.analysis.elements,
              edgeCasesCount: data.analysis.edgeCases.length,
              complexity: data.analysis.complexity
            },
            decision: {
              renderer: data.lastRendering.renderer,
              optimize: data.lastRendering.optimize,
              useAdvancedOptimizer: data.lastRendering.useAdvancedOptimizer,
              renderTime: data.lastRendering.renderTime
            }
          });
        }
      }
    }

    return metrics;
  }

  /**
   * Limpa o cache de decisões
   */
  clearCache() {
    this.decisionsCache.clear();
    this.logger.info('Cache de decisões limpo');
  }
}

module.exports = SmartRenderer;