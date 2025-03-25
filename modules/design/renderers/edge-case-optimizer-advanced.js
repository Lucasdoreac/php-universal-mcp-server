/**
 * Advanced Edge Case Optimizer para Renderizador Progressivo
 * 
 * Versão avançada do otimizador de casos extremos, com detecção mais sofisticada,
 * estratégias adaptativas de otimização e aprendizagem a partir dos resultados
 * de benchmarks anteriores.
 * 
 * @author PHP Universal MCP Server Team
 * @version 2.0.0
 */

const { JSDOM } = require('jsdom');
const logger = require('../../../utils/logger');
const fs = require('fs').promises;
const path = require('path');
const EdgeCaseOptimizer = require('./edge-case-optimizer');

/**
 * Otimizador avançado para casos extremos do renderizador progressivo
 * Estende o EdgeCaseOptimizer básico com capacidades mais avançadas
 */
class AdvancedEdgeCaseOptimizer extends EdgeCaseOptimizer {
  /**
   * Construtor
   * @param {Object} options - Opções de configuração
   */
  constructor(options = {}) {
    // Chamar construtor da classe pai
    super({
      // Valores refinados com base em benchmarks
      maxComponentSize: 100, // KB
      maxElementsPerTree: 4000,
      ...options
    });

    // Opções específicas do otimizador avançado
    this.advancedOptions = {
      // Habilitar análise de viewport
      viewportAnalysis: true,
      // Habilitar aprendizagem com benchmarks
      learningEnabled: true,
      // Cache de resultados de benchmarks
      benchmarkCache: path.join(__dirname, '../../../cache/edge-case-benchmarks.json'),
      // Limiar para considerar um padrão como problemático (%)
      patternThreshold: 15,
      // Usar estratégias adaptativas
      adaptiveStrategies: true,
      // Limite de profundidade para análise recursiva
      maxAnalysisDepth: 25,
      // Padrões adicionais a detectar
      additionalPatterns: [
        'shadow-dom',
        'layout-triggers',
        'forced-reflow',
        'css-complexity',
        'recursive-templates'
      ],
      ...options.advanced
    };

    // Adicionar otimizadores avançados
    this.optimizers.push(
      // Novos otimizadores avançados
      this._optimizeRecursiveTemplates,
      this._optimizeShadowDOM,
      this._optimizeLayoutTriggers,
      this._optimizeForcedReflow,
      this._optimizeCssComplexity,
      this._optimizeNestedFlexboxes,
      this._optimizeExcessiveGrid
    );

    // Inicializar cache de padrões aprendidos
    this.learnedPatterns = new Map();
    
    // Carregar dados de benchmarks anteriores se disponíveis
    this._loadBenchmarkData();
    
    // Inicializar estatísticas específicas
    this.advancedMetrics = {
      patternsDetected: {},
      optimizationSuccess: {},
      viewportComponents: 0,
      offscreenComponents: 0,
      adaptiveStrategiesApplied: 0
    };
  }

  /**
   * Carrega dados de benchmarks anteriores
   * @private
   */
  async _loadBenchmarkData() {
    try {
      const data = await fs.readFile(this.advancedOptions.benchmarkCache, 'utf8');
      const benchmarkData = JSON.parse(data);
      
      // Processar dados de benchmark para aprendizado
      if (benchmarkData.patterns) {
        for (const [pattern, stats] of Object.entries(benchmarkData.patterns)) {
          this.learnedPatterns.set(pattern, stats);
        }
        
        logger.info(`AdvancedEdgeCaseOptimizer: Carregados ${this.learnedPatterns.size} padrões aprendidos`);
      }
    } catch (error) {
      // Ignorar erro se arquivo não existir (primeira execução)
      if (error.code !== 'ENOENT') {
        logger.warn(`AdvancedEdgeCaseOptimizer: Erro ao carregar dados de benchmark: ${error.message}`);
      }
    }
  }

  /**
   * Salva dados de benchmarks para aprendizado futuro
   * @private
   */
  async _saveBenchmarkData() {
    if (!this.advancedOptions.learningEnabled) return;
    
    try {
      // Garantir que o diretório de cache existe
      const cacheDir = path.dirname(this.advancedOptions.benchmarkCache);
      await fs.mkdir(cacheDir, { recursive: true });
      
      // Preparar dados para salvar
      const benchmarkData = {
        lastUpdated: new Date().toISOString(),
        patterns: Object.fromEntries(this.learnedPatterns),
        advancedMetrics: this.advancedMetrics
      };
      
      // Salvar no arquivo de cache
      await fs.writeFile(
        this.advancedOptions.benchmarkCache,
        JSON.stringify(benchmarkData, null, 2),
        'utf8'
      );
      
      logger.debug('AdvancedEdgeCaseOptimizer: Dados de benchmark salvos com sucesso');
    } catch (error) {
      logger.warn(`AdvancedEdgeCaseOptimizer: Erro ao salvar dados de benchmark: ${error.message}`);
    }
  }

  /**
   * Otimiza um template para casos extremos com estratégias avançadas
   * @param {string} template - Template HTML a ser otimizado
   * @param {Object} options - Opções adicionais de otimização
   * @returns {Promise<Object>} HTML otimizado e métricas
   */
  async optimize(template, options = {}) {
    // Iniciar métricas avançadas para esta otimização
    this.advancedMetrics.startTime = Date.now();
    
    try {
      // Se análise de viewport estiver habilitada, executar pré-processamento
      if (this.advancedOptions.viewportAnalysis) {
        template = await this._preprocessForViewport(template);
      }
      
      // Análise avançada para detecção de padrões específicos
      const advancedAnalysis = await this._performAdvancedAnalysis(template);
      
      // Escolher estratégia adaptativa se habilitado
      if (this.advancedOptions.adaptiveStrategies) {
        this._selectAdaptiveStrategy(advancedAnalysis);
      }
      
      // Executar otimização padrão da classe pai
      const result = await super.optimize(template, options);
      
      // Aplicar otimizações avançadas pós-processamento
      result.html = await this._postprocessOptimizations(result.html, advancedAnalysis);
      
      // Atualizar métricas avançadas
      this.advancedMetrics.totalTime = Date.now() - this.advancedMetrics.startTime;
      result.advancedMetrics = { ...this.advancedMetrics };
      
      // Salvar dados para aprendizado futuro
      await this._saveBenchmarkData();
      
      return result;
    } catch (error) {
      logger.error(`AdvancedEdgeCaseOptimizer: Erro na otimização avançada: ${error.message}`);
      
      // Em caso de erro, tentar a otimização padrão como fallback
      logger.info('AdvancedEdgeCaseOptimizer: Usando otimizador básico como fallback');
      return super.optimize(template, options);
    }
  }

  /**
   * Pré-processa o template para otimização baseada em viewport
   * @param {string} template - Template HTML
   * @returns {Promise<string>} Template pré-processado
   * @private
   */
  async _preprocessForViewport(template) {
    logger.debug('AdvancedEdgeCaseOptimizer: Pré-processando para otimização de viewport');
    
    try {
      // Usar JSDOM para analisar o template
      const dom = new JSDOM(template, {
        runScripts: 'outside-only',
        resources: 'usable'
      });
      
      const document = dom.window.document;
      
      // Estimar altura da viewport (simulação para desktop)
      const viewportHeight = 900; // pixels
      
      // Analisar todos os elementos
      const allElements = document.querySelectorAll('*');
      let inViewport = 0;
      let offscreen = 0;
      
      // Processar elementos para marcação de viewport
      for (const element of allElements) {
        try {
          // Obter posição aproximada
          const rect = element.getBoundingClientRect();
          
          // Verificar se está na viewport inicial (aproximação)
          if (rect.top < viewportHeight) {
            // Elemento visível na viewport inicial
            element.setAttribute('data-viewport', 'visible');
            element.setAttribute('data-progressive-priority', '1');
            inViewport++;
          } else {
            // Elemento abaixo da viewport inicial
            element.setAttribute('data-viewport', 'offscreen');
            
            // Ajustar prioridade com base na distância da viewport
            const distance = rect.top - viewportHeight;
            const priority = Math.min(5, 2 + Math.floor(distance / 500));
            element.setAttribute('data-progressive-priority', priority.toString());
            
            offscreen++;
          }
        } catch (error) {
          // Ignorar erros em elementos específicos
          continue;
        }
      }
      
      // Atualizar métricas
      this.advancedMetrics.viewportComponents = inViewport;
      this.advancedMetrics.offscreenComponents = offscreen;
      
      logger.debug(`AdvancedEdgeCaseOptimizer: Marcados ${inViewport} elementos na viewport e ${offscreen} fora`);
      
      // Retornar HTML pré-processado
      return dom.serialize();
    } catch (error) {
      logger.error(`AdvancedEdgeCaseOptimizer: Erro no pré-processamento de viewport: ${error.message}`);
      
      // Em caso de erro, retornar template original
      return template;
    }
  }

  /**
   * Executa análise avançada do template
   * @param {string} template - Template HTML
   * @returns {Promise<Object>} Resultado da análise avançada
   * @private
   */
  async _performAdvancedAnalysis(template) {
    logger.debug('AdvancedEdgeCaseOptimizer: Executando análise avançada');
    
    try {
      const dom = new JSDOM(template);
      const document = dom.window.document;
      
      const analysis = {
        patterns: {},
        complexity: {
          overall: 0,
          dom: 0,
          css: 0,
          nestingDepth: 0
        },
        criticalIssues: []
      };
      
      // Detectar padrões avançados
      analysis.patterns = {
        // Shadow DOM (Web Components)
        shadowDOM: Boolean(document.querySelector('*[shadowroot], *[attachShadow]')),
        
        // Layout triggers (elementos que forçam recálculo de layout)
        layoutTriggers: this._detectLayoutTriggers(document),
        
        // Forçar refluxo (forçar o navegador a recalcular estilos)
        forcedReflow: this._detectForcedReflow(document),
        
        // Complexidade CSS (seletores complexos, !important, etc.)
        cssComplexity: this._detectCssComplexity(document),
        
        // Templates recursivos (componentes que podem causar loops infinitos)
        recursiveTemplates: this._detectRecursiveTemplates(document),
        
        // Flexbox aninhados excessivamente
        nestedFlexboxes: this._detectNestedFlexboxes(document),
        
        // Grids excessivos
        excessiveGrids: this._detectExcessiveGrids(document)
      };
      
      // Calcular complexidade geral
      let patternCount = 0;
      for (const [pattern, detected] of Object.entries(analysis.patterns)) {
        if (detected === true || (typeof detected === 'number' && detected > 0)) {
          patternCount++;
          
          // Registrar nas métricas
          if (!this.advancedMetrics.patternsDetected[pattern]) {
            this.advancedMetrics.patternsDetected[pattern] = 0;
          }
          this.advancedMetrics.patternsDetected[pattern]++;
          
          // Verificar se é um problema crítico
          if (this._isPatternCritical(pattern, detected)) {
            analysis.criticalIssues.push({
              pattern,
              value: detected,
              impact: 'high'
            });
          }
        }
      }
      
      // Calcular profundidade máxima do DOM
      analysis.complexity.nestingDepth = this._calculateMaxNestingDepth(document.body);
      
      // Calcular complexidade geral
      analysis.complexity.dom = this._calculateDOMComplexity(document);
      analysis.complexity.css = typeof analysis.patterns.cssComplexity === 'number' 
        ? analysis.patterns.cssComplexity 
        : 0;
      
      analysis.complexity.overall = (
        patternCount * 10 + 
        analysis.complexity.nestingDepth * 2 + 
        analysis.complexity.dom / 100 + 
        analysis.complexity.css
      );
      
      logger.debug(`AdvancedEdgeCaseOptimizer: Análise avançada concluída - ${patternCount} padrões detectados`);
      
      return analysis;
    } catch (error) {
      logger.error(`AdvancedEdgeCaseOptimizer: Erro na análise avançada: ${error.message}`);
      
      // Retornar análise básica em caso de erro
      return {
        patterns: {},
        complexity: { overall: 0 },
        criticalIssues: []
      };
    }
  }

  /**
   * Calcula a profundidade máxima de aninhamento no DOM
   * @param {Element} element - Elemento a verificar
   * @param {number} depth - Profundidade atual
   * @returns {number} Profundidade máxima
   * @private
   */
  _calculateMaxNestingDepth(element, depth = 0) {
    if (!element || depth > this.advancedOptions.maxAnalysisDepth) {
      return depth;
    }
    
    // Inicializar profundidade máxima
    let maxDepth = depth;
    
    // Verificar filhos
    for (const child of element.children) {
      const childDepth = this._calculateMaxNestingDepth(child, depth + 1);
      maxDepth = Math.max(maxDepth, childDepth);
    }
    
    return maxDepth;
  }

  /**
   * Calcula a complexidade geral do DOM
   * @param {Document} document - Documento DOM
   * @returns {number} Pontuação de complexidade
   * @private
   */
  _calculateDOMComplexity(document) {
    const elements = document.querySelectorAll('*');
    let complexity = elements.length;
    
    // Fatores que aumentam a complexidade
    const complexityFactors = {
      script: 10,
      iframe: 20,
      canvas: 15,
      video: 15,
      svg: 5,
      table: 5,
      form: 5,
      input: 2,
      select: 3,
      'data-binding': 10,
      'event-listener': 5
    };
    
    // Calcular complexidade por tipo de elemento
    for (const [selector, factor] of Object.entries(complexityFactors)) {
      const count = document.querySelectorAll(selector).length;
      complexity += count * factor;
    }
    
    // Verificar atributos de data-binding e eventos
    for (const element of elements) {
      // Verificar atributos que começam com "on" (eventos)
      const eventAttributes = Array.from(element.attributes).filter(attr => 
        attr.name.startsWith('on')
      );
      
      // Adicionar pontuação para eventos
      complexity += eventAttributes.length * complexityFactors['event-listener'];
      
      // Verificar atributos de data-binding
      const dataBindingAttributes = Array.from(element.attributes).filter(attr => 
        attr.name.includes('bind') || 
        attr.name.includes('model') || 
        attr.name.includes('v-') ||
        attr.name.includes('ng-')
      );
      
      // Adicionar pontuação para data-binding
      complexity += dataBindingAttributes.length * complexityFactors['data-binding'];
    }
    
    return complexity;
  }

  /**
   * Verifica se um padrão é considerado crítico
   * @param {string} pattern - Nome do padrão
   * @param {boolean|number} value - Valor detectado
   * @returns {boolean} Verdadeiro se o padrão for crítico
   * @private
   */
  _isPatternCritical(pattern, value) {
    // Limites para considerar um padrão crítico
    const criticalThresholds = {
      shadowDOM: true,
      layoutTriggers: 10,
      forcedReflow: 5,
      cssComplexity: 50,
      recursiveTemplates: 1,
      nestedFlexboxes: 5,
      excessiveGrids: 3
    };
    
    // Verificar se o pattern está no threshold
    if (!(pattern in criticalThresholds)) {
      return false;
    }
    
    // Comparar com o threshold apropriado
    if (typeof value === 'boolean') {
      return value === true && criticalThresholds[pattern] === true;
    } else if (typeof value === 'number') {
      return value >= criticalThresholds[pattern];
    }
    
    return false;
  }

  /**
   * Seleciona a estratégia adaptativa com base na análise
   * @param {Object} analysis - Resultado da análise avançada
   * @private
   */
  _selectAdaptiveStrategy(analysis) {
    // Estratégias disponíveis para otimização
    const strategies = {
      aggressive: {
        threshold: 100, // Complexidade geral alta
        options: {
          aggressiveOptimization: true,
          maxComponentSize: 50, // Reduzir tamanho máximo de componentes
          chunkProcessing: true,
          streamingEnabled: true
        }
      },
      moderate: {
        threshold: 50, // Complexidade geral média
        options: {
          aggressiveOptimization: false,
          maxComponentSize: 100,
          chunkProcessing: true,
          streamingEnabled: false
        }
      },
      conservative: {
        threshold: 20, // Complexidade geral baixa
        options: {
          aggressiveOptimization: false,
          maxComponentSize: 150,
          chunkProcessing: false,
          streamingEnabled: false
        }
      }
    };
    
    // Selecionar estratégia baseada na complexidade
    let selectedStrategy = 'conservative';
    
    if (analysis.complexity.overall >= strategies.aggressive.threshold || 
        analysis.criticalIssues.length >= 3) {
      selectedStrategy = 'aggressive';
    } else if (analysis.complexity.overall >= strategies.moderate.threshold || 
               analysis.criticalIssues.length >= 1) {
      selectedStrategy = 'moderate';
    }
    
    // Aplicar opções da estratégia selecionada
    const strategyOptions = strategies[selectedStrategy].options;
    Object.assign(this.options, strategyOptions);
    
    // Registrar a estratégia escolhida
    this.advancedMetrics.adaptiveStrategy = selectedStrategy;
    this.advancedMetrics.adaptiveStrategiesApplied++;
    
    logger.info(`AdvancedEdgeCaseOptimizer: Estratégia adaptativa selecionada: ${selectedStrategy}`);
  }

  /**
   * Aplica otimizações pós-processamento
   * @param {string} html - HTML otimizado
   * @param {Object} analysis - Resultado da análise avançada
   * @returns {Promise<string>} HTML com otimizações pós-processamento
   * @private
   */
  async _postprocessOptimizations(html, analysis) {
    logger.debug('AdvancedEdgeCaseOptimizer: Aplicando otimizações pós-processamento');
    
    try {
      // Criar DOM a partir do HTML
      const dom = new JSDOM(html);
      const document = dom.window.document;
      
      // Adicionar scripts de otimização progressiva
      const script = document.createElement('script');
      script.setAttribute('data-optimizer', 'advanced-edge-case');
      script.textContent = this._generateOptimizationScript(analysis);
      
      // Adicionar script ao final do body
      document.body.appendChild(script);
      
      // Adicionar meta tag para indicar otimização
      const meta = document.createElement('meta');
      meta.setAttribute('name', 'renderer');
      meta.setAttribute('content', 'php-universal-mcp-advanced-edge-case-optimizer');
      document.head.appendChild(meta);
      
      // Adicionar CSS de otimização
      const style = document.createElement('style');
      style.textContent = this._generateOptimizationCSS(analysis);
      document.head.appendChild(style);
      
      return dom.serialize();
    } catch (error) {
      logger.error(`AdvancedEdgeCaseOptimizer: Erro no pós-processamento: ${error.message}`);
      
      // Em caso de erro, retornar HTML original
      return html;
    }
  }

  /**
   * Gera script de otimização baseado na análise
   * @param {Object} analysis - Resultado da análise avançada
   * @returns {string} Código JavaScript para otimização no cliente
   * @private
   */
  _generateOptimizationScript(analysis) {
    return `
      // Advanced Edge Case Optimizer Runtime
      (function() {
        const optimizer = {
          // Configuração baseada na análise do servidor
          config: {
            patterns: ${JSON.stringify(analysis.patterns)},
            complexity: ${JSON.stringify(analysis.complexity)},
            criticalIssues: ${JSON.stringify(analysis.criticalIssues)}
          },
          
          // Estado de runtime
          state: {
            initialRender: true,
            viewportObserver: null,
            processed: new Set(),
            pendingElements: [],
            pendingTimeout: null
          },
          
          // Inicializar otimizador
          init: function() {
            // Configurar IntersectionObserver para lazy loading
            if ('IntersectionObserver' in window) {
              this.state.viewportObserver = new IntersectionObserver(
                this.handleElementVisibility.bind(this),
                { rootMargin: '200px' }
              );
              
              // Observar elementos marcados como offscreen
              const offscreenElements = document.querySelectorAll('[data-viewport="offscreen"]');
              for (const element of offscreenElements) {
                this.state.viewportObserver.observe(element);
              }
            }
            
            // Processar elementos da viewport inicial
            this.processInitialViewport();
            
            // Adicionar handlers para eventos do usuário
            this.setupEventHandlers();
            
            // Registrar para debug
            console.debug('Advanced Edge Case Optimizer initialized');
          },
          
          // Processar elementos na viewport inicial
          processInitialViewport: function() {
            const visibleElements = document.querySelectorAll('[data-viewport="visible"]');
            
            // Processar elementos visíveis primeiro
            for (const element of visibleElements) {
              this.processElement(element, true);
            }
            
            // Marcar renderização inicial como concluída
            setTimeout(() => {
              this.state.initialRender = false;
              
              // Processar próximo lote de elementos pendentes
              this.processPendingElements();
            }, 100);
          },
          
          // Processar elementos quando entrarem na viewport
          handleElementVisibility: function(entries) {
            for (const entry of entries) {
              if (entry.isIntersecting) {
                // Elemento entrou na viewport
                const element = entry.target;
                
                // Parar de observar este elemento
                this.state.viewportObserver.unobserve(element);
                
                // Adicionar à fila de processamento
                this.state.pendingElements.push(element);
                
                // Agendar processamento
                this.schedulePendingProcessing();
              }
            }
          },
          
          // Agendar processamento de elementos pendentes
          schedulePendingProcessing: function() {
            if (this.state.pendingTimeout) {
              clearTimeout(this.state.pendingTimeout);
            }
            
            this.state.pendingTimeout = setTimeout(() => {
              this.processPendingElements();
            }, 50);
          },
          
          // Processar lote de elementos pendentes
          processPendingElements: function() {
            const batch = this.state.pendingElements.splice(0, 10);
            
            for (const element of batch) {
              this.processElement(element, false);
            }
            
            // Se ainda houver elementos pendentes, agendar próximo lote
            if (this.state.pendingElements.length > 0) {
              this.schedulePendingProcessing();
            }
          },
          
          // Processar elemento individual
          processElement: function(element, isViewport) {
            if (this.state.processed.has(element)) {
              return;
            }
            
            // Marcar como processado
            this.state.processed.add(element);
            
            // Aplicar otimizações específicas com base nos padrões detectados
            if (this.config.patterns.nestedFlexboxes && element.closest('.nested-flexbox-wrapper')) {
              this.applyFlexboxOptimization(element);
            }
            
            if (this.config.patterns.excessiveGrids && element.closest('.grid-wrapper')) {
              this.applyGridOptimization(element);
            }
            
            // Remover marcadores de viewport
            element.removeAttribute('data-viewport');
            
            // Adicionar classe para animar entrada
            if (!isViewport) {
              element.classList.add('optimizer-visible');
            }
          },
          
          // Aplicar otimização específica para flexbox aninhados
          applyFlexboxOptimization: function(element) {
            // Implementação específica
          },
          
          // Aplicar otimização específica para grids excessivos
          applyGridOptimization: function(element) {
            // Implementação específica
          },
          
          // Configurar handlers de eventos
          setupEventHandlers: function() {
            // Handler para scroll para processamento adicional
            window.addEventListener('scroll', () => {
              if (!this.state.initialRender && this.state.pendingElements.length === 0) {
                // Verificar elementos adicionais não processados
                const remainingElements = document.querySelectorAll('[data-viewport="offscreen"]:not(.optimizer-visible)');
                
                for (const element of remainingElements) {
                  const rect = element.getBoundingClientRect();
                  
                  // Verificar se está próximo da viewport
                  if (rect.top < window.innerHeight + 500) {
                    this.state.pendingElements.push(element);
                  }
                }
                
                if (this.state.pendingElements.length > 0) {
                  this.schedulePendingProcessing();
                }
              }
            }, { passive: true });
          }
        };
        
        // Inicializar após carregamento do DOM
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', optimizer.init.bind(optimizer));
        } else {
          optimizer.init();
        }
      })();
    `;
  }

  /**
   * Gera CSS de otimização baseado na análise
   * @param {Object} analysis - Resultado da análise avançada
   * @returns {string} Código CSS para otimização no cliente
   * @private
   */
  _generateOptimizationCSS(analysis) {
    return `
      /* Advanced Edge Case Optimizer Styles */
      
      /* Animação para elementos que entram na viewport */
      .optimizer-visible {
        animation: optimizer-fade-in 0.3s ease-in;
      }
      
      @keyframes optimizer-fade-in {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      /* Otimizações para flexbox aninhados */
      .nested-flexbox-wrapper {
        contain: content;
      }
      
      /* Otimizações para grids complexos */
      .grid-wrapper {
        contain: content;
      }
      
      /* Otimizações específicas para layout triggers */
      ${analysis.patterns.layoutTriggers ? `
      [data-layout-trigger] {
        contain: layout;
        will-change: transform;
      }` : ''}
      
      /* Otimizações específicas para refluxo forçado */
      ${analysis.patterns.forcedReflow ? `
      [data-forced-reflow] {
        contain: layout style;
      }` : ''}
      
      /* Otimizações para elementos complexos */
      ${analysis.complexity.overall > 50 ? `
      [data-progressive-priority="4"],
      [data-progressive-priority="5"] {
        contain: content;
      }` : ''}
    `;
  }

  // ----- Detecção de padrões avançados -----

  /**
   * Detecta triggers de layout que podem causar renderização lenta
   * @param {Document} document - Documento DOM
   * @returns {number} Número de triggers de layout detectados
   * @private
   */
  _detectLayoutTriggers(document) {
    let count = 0;
    
    // Propriedades CSS que disparam recálculo de layout
    const layoutTriggeringStyles = [
      'position: sticky',
      'position: fixed',
      'transform',
      'width: 100%',
      'height: 100%',
      'top: 0',
      'left: 0',
      'right: 0',
      'bottom: 0'
    ];
    
    // Selecionar todos os elementos com estilo inline
    const elementsWithStyle = document.querySelectorAll('[style]');
    
    for (const element of elementsWithStyle) {
      const style = element.getAttribute('style');
      
      // Verificar propriedades de layout
      for (const trigger of layoutTriggeringStyles) {
        if (style.includes(trigger)) {
          element.setAttribute('data-layout-trigger', 'true');
          count++;
          break;
        }
      }
    }
    
    // Verificar também elementos com classes comuns que causam problemas de layout
    const layoutClasses = [
      '.sticky',
      '.fixed',
      '.absolute',
      '.fullwidth',
      '.fullheight',
      '.grid',
      '.flex'
    ];
    
    for (const selector of layoutClasses) {
      const elements = document.querySelectorAll(selector);
      count += elements.length;
      
      for (const element of elements) {
        element.setAttribute('data-layout-trigger', 'true');
      }
    }
    
    return count;
  }

  /**
   * Detecta elementos que causam refluxo forçado (recálculo de layout)
   * @param {Document} document - Documento DOM
   * @returns {number} Número de elementos que causam refluxo
   * @private
   */
  _detectForcedReflow(document) {
    let count = 0;
    
    // Elementos com animações e transições
    const animatedElements = document.querySelectorAll(
      '[class*="animate"], [class*="transition"], [class*="motion"]'
    );
    
    count += animatedElements.length;
    
    // Marcar elementos
    for (const element of animatedElements) {
      element.setAttribute('data-forced-reflow', 'true');
    }
    
    // Scripts inline (podem causar refluxo)
    const inlineScripts = document.querySelectorAll('script:not([src])');
    count += inlineScripts.length;
    
    return count;
  }

  /**
   * Detecta complexidade excessiva em CSS (seletores, !important, etc.)
   * @param {Document} document - Documento DOM
   * @returns {number} Pontuação de complexidade CSS
   * @private
   */
  _detectCssComplexity(document) {
    let complexity = 0;
    
    // Verificar folhas de estilo inline
    const styleElements = document.querySelectorAll('style');
    
    for (const style of styleElements) {
      const css = style.textContent;
      
      // Uso de !important (geralmente indicativo de CSS ruim)
      const importantCount = (css.match(/!important/g) || []).length;
      complexity += importantCount * 5;
      
      // Seletores complexos (mais de 3 níveis)
      const complexSelectors = (css.match(/([a-z0-9_-]+\s+){3,}[a-z0-9_-]+/gi) || []).length;
      complexity += complexSelectors * 3;
      
      // Uso de vendor prefixes (possível código legado ou não otimizado)
      const vendorPrefixes = (css.match(/(-webkit-|-moz-|-ms-|-o-)/g) || []).length;
      complexity += vendorPrefixes;
      
      // Uso de media queries aninhadas
      const mediaQueries = (css.match(/@media/g) || []).length;
      complexity += mediaQueries * 2;
    }
    
    // Verificar estilos inline
    const elementsWithStyle = document.querySelectorAll('[style]');
    complexity += elementsWithStyle.length;
    
    return complexity;
  }

  /**
   * Detecta templates recursivos que podem causar problemas de renderização
   * @param {Document} document - Documento DOM
   * @returns {number} Número de padrões recursivos detectados
   * @private
   */
  _detectRecursiveTemplates(document) {
    let count = 0;
    
    // Estruturas comuns de frameworks que usam templates recursivos
    const recursivePatterns = [
      '[v-for]:not([v-if])', // Vue.js recursivo sem condição de parada
      '[ng-repeat]:not([ng-if])', // Angular recursivo sem condição
      '[data-each]:not([data-if])', // Handlebars/Mustache recursivo
      '[data-bind="foreach"]:not([data-bind*="if"])', // Knockout.js recursivo
      '.nested-component .nested-component', // Componentes aninhados dentro deles mesmos
      '.recursive-template' // Classes explicitamente marcadas como recursivas
    ];
    
    for (const pattern of recursivePatterns) {
      const elements = document.querySelectorAll(pattern);
      count += elements.length;
      
      // Marcar elementos
      for (const element of elements) {
        element.setAttribute('data-recursive-template', 'true');
      }
    }
    
    // Detecção avançada: componentes com mesmo tipo aninhados em múltiplos níveis
    const allElements = document.querySelectorAll('*[class]');
    const classHierarchy = new Map();
    
    for (const element of allElements) {
      const classes = element.className.split(/\s+/);
      
      for (const cls of classes) {
        if (!cls || cls.length === 0) continue;
        
        // Verificar se esta classe já foi encontrada em ancestrais
        let parent = element.parentElement;
        let depth = 0;
        let found = false;
        
        while (parent && depth < 10) {
          if (parent.className && parent.className.split(/\s+/).includes(cls)) {
            found = true;
            
            // Armazenar hierarquia para análise
            if (!classHierarchy.has(cls)) {
              classHierarchy.set(cls, []);
            }
            
            classHierarchy.get(cls).push({ element, depth });
            break;
          }
          
          parent = parent.parentElement;
          depth++;
        }
        
        if (found) {
          count++;
          element.setAttribute('data-recursive-template', 'true');
          break;
        }
      }
    }
    
    return count;
  }

  /**
   * Detecta flexboxes aninhados excessivamente
   * @param {Document} document - Documento DOM
   * @returns {number} Número de flexboxes aninhados problemáticos
   * @private
   */
  _detectNestedFlexboxes(document) {
    let count = 0;
    
    // Selecionar todos os flexboxes
    const flexboxes = document.querySelectorAll(
      '[style*="display: flex"], [style*="display:flex"], .flex, .d-flex'
    );
    
    // Verificar aninhamento excessivo
    for (const flexbox of flexboxes) {
      // Verificar ancestrais
      let parent = flexbox.parentElement;
      let flexParents = [];
      
      while (parent) {
        if (
          parent.style && (
            parent.style.display === 'flex' || 
            parent.style.display === 'inline-flex'
          ) || 
          parent.className && (
            parent.className.includes('flex') || 
            parent.className.includes('d-flex')
          )
        ) {
          flexParents.push(parent);
        }
        
        parent = parent.parentElement;
      }
      
      // Se tivermos mais de 2 níveis de flexbox aninhados
      if (flexParents.length > 2) {
        count++;
        
        // Adicionar wrapper para otimização
        const wrapper = document.createElement('div');
        wrapper.className = 'nested-flexbox-wrapper';
        flexbox.parentNode.insertBefore(wrapper, flexbox);
        wrapper.appendChild(flexbox);
      }
    }
    
    return count;
  }

  /**
   * Detecta uso excessivo de CSS Grid
   * @param {Document} document - Documento DOM
   * @returns {number} Número de grids problemáticos
   * @private
   */
  _detectExcessiveGrids(document) {
    let count = 0;
    
    // Selecionar todos os grids
    const grids = document.querySelectorAll(
      '[style*="display: grid"], [style*="display:grid"], .grid, .css-grid'
    );
    
    for (const grid of grids) {
      // Verificar número de células
      const cells = grid.children.length;
      
      // Verificar complexidade do grid
      const gridStyle = window.getComputedStyle(grid);
      const columns = gridStyle.gridTemplateColumns.split(' ').length;
      const rows = gridStyle.gridTemplateRows.split(' ').length;
      
      // Grid com muitas células ou estrutura complexa
      if (cells > 50 || columns * rows > 50) {
        count++;
        
        // Adicionar wrapper para otimização
        const wrapper = document.createElement('div');
        wrapper.className = 'grid-wrapper';
        grid.parentNode.insertBefore(wrapper, grid);
        wrapper.appendChild(grid);
      }
    }
    
    return count;
  }

  // ----- Otimizadores específicos avançados -----

  /**
   * Otimização para templates recursivos
   * @param {string} template - Template HTML
   * @param {Array} edgeCases - Casos extremos detectados
   * @param {Object} options - Opções de otimização
   * @returns {Promise<Object>} HTML otimizado e métricas
   * @private
   */
  async _optimizeRecursiveTemplates(template, edgeCases, options) {
    const recursiveCase = edgeCases.find(ec => ec.type === 'recursive_templates');
    if (!recursiveCase) {
      return null;
    }
    
    logger.debug(`AdvancedEdgeCaseOptimizer: Otimizando ${recursiveCase.count} templates recursivos`);
    
    try {
      // Usar JSDOM para manipular o DOM
      const dom = new JSDOM(template);
      const document = dom.window.document;
      
      // Encontrar templates recursivos
      const recursiveTemplates = document.querySelectorAll('[data-recursive-template="true"]');
      
      // Transformar
      let optimizationsApplied = 0;
      
      for (const element of recursiveTemplates) {
        // Limitar profundidade de recursão
        const maxDepth = options.aggressiveMode ? 2 : 3;
        
        // Encontrar componentes aninhados de mesmo tipo
        const className = element.className.split(/\s+/).find(cls => 
          cls && element.querySelectorAll(`.${cls}`).length > 0
        );
        
        if (className) {
          // Selecionar componentes aninhados além da profundidade máxima
          const nestedComponents = Array.from(element.querySelectorAll(`.${className}`));
          
          // Mapear profundidade de cada componente
          const withDepth = nestedComponents.map(comp => {
            let depth = 0;
            let parent = comp.parentElement;
            
            while (parent && parent !== element) {
              if (parent.className && parent.className.split(/\s+/).includes(className)) {
                depth++;
              }
              parent = parent.parentElement;
            }
            
            return { comp, depth };
          });
          
          // Filtrar componentes além da profundidade máxima
          const tooDeep = withDepth.filter(({ depth }) => depth >= maxDepth);
          
          // Substituir componentes profundos por placeholders
          for (const { comp } of tooDeep) {
            const placeholder = document.createElement('div');
            placeholder.className = `${className}-placeholder`;
            placeholder.innerHTML = `<div class="recursive-placeholder" data-depth="${maxDepth}" data-original-class="${className}">
              <button class="load-more-recursive">Carregar mais...</button>
            </div>`;
            
            comp.parentNode.replaceChild(placeholder, comp);
            optimizationsApplied++;
          }
        }
      }
      
      // Retornar HTML otimizado
      if (optimizationsApplied > 0) {
        // Registrar métrica
        if (!this.advancedMetrics.optimizationSuccess['recursive_templates']) {
          this.advancedMetrics.optimizationSuccess['recursive_templates'] = 0;
        }
        this.advancedMetrics.optimizationSuccess['recursive_templates'] += optimizationsApplied;
        
        return {
          html: dom.serialize(),
          optimizationsApplied
        };
      }
      
      return null;
    } catch (error) {
      logger.error(`AdvancedEdgeCaseOptimizer: Erro ao otimizar templates recursivos: ${error.message}`);
      return null;
    }
  }

  /**
   * Otimização para elementos que usam Shadow DOM
   * @param {string} template - Template HTML
   * @param {Array} edgeCases - Casos extremos detectados
   * @param {Object} options - Opções de otimização
   * @returns {Promise<Object>} HTML otimizado e métricas
   * @private
   */
  async _optimizeShadowDOM(template, edgeCases, options) {
    // Implementação futura - placeholder por enquanto
    return null;
  }

  /**
   * Otimização para elementos que disparam recálculo de layout
   * @param {string} template - Template HTML
   * @param {Array} edgeCases - Casos extremos detectados
   * @param {Object} options - Opções de otimização
   * @returns {Promise<Object>} HTML otimizado e métricas
   * @private
   */
  async _optimizeLayoutTriggers(template, edgeCases, options) {
    const layoutTriggerCase = edgeCases.find(ec => ec.type === 'layout_triggers');
    if (!layoutTriggerCase) {
      return null;
    }
    
    logger.debug(`AdvancedEdgeCaseOptimizer: Otimizando ${layoutTriggerCase.count} triggers de layout`);
    
    try {
      // Usar JSDOM para manipular o DOM
      const dom = new JSDOM(template);
      const document = dom.window.document;
      
      // Encontrar elementos que disparam recálculo de layout
      const triggerElements = document.querySelectorAll('[data-layout-trigger="true"]');
      
      // Transformar
      let optimizationsApplied = 0;
      
      for (const element of triggerElements) {
        // Adicionar atributos de otimização
        element.setAttribute('data-optimize-layout', 'true');
        
        // Adicionar CSS containment quando possível
        const currentStyle = element.getAttribute('style') || '';
        
        if (!currentStyle.includes('contain:') && !currentStyle.includes('contain :')) {
          element.setAttribute('style', `${currentStyle}; contain: layout;`);
          optimizationsApplied++;
        }
        
        // Adicionar will-change para elementos animados
        if (
          (element.className && (
            element.className.includes('animate') || 
            element.className.includes('transition')
          )) &&
          !currentStyle.includes('will-change')
        ) {
          element.setAttribute('style', `${currentStyle}; will-change: transform;`);
          optimizationsApplied++;
        }
      }
      
      // Retornar HTML otimizado
      if (optimizationsApplied > 0) {
        // Registrar métrica
        if (!this.advancedMetrics.optimizationSuccess['layout_triggers']) {
          this.advancedMetrics.optimizationSuccess['layout_triggers'] = 0;
        }
        this.advancedMetrics.optimizationSuccess['layout_triggers'] += optimizationsApplied;
        
        return {
          html: dom.serialize(),
          optimizationsApplied
        };
      }
      
      return null;
    } catch (error) {
      logger.error(`AdvancedEdgeCaseOptimizer: Erro ao otimizar triggers de layout: ${error.message}`);
      return null;
    }
  }

  /**
   * Otimização para elementos que causam refluxo forçado
   * @param {string} template - Template HTML
   * @param {Array} edgeCases - Casos extremos detectados
   * @param {Object} options - Opções de otimização
   * @returns {Promise<Object>} HTML otimizado e métricas
   * @private
   */
  async _optimizeForcedReflow(template, edgeCases, options) {
    // Implementação futura - placeholder por enquanto
    return null;
  }

  /**
   * Otimização para CSS complexo
   * @param {string} template - Template HTML
   * @param {Array} edgeCases - Casos extremos detectados
   * @param {Object} options - Opções de otimização
   * @returns {Promise<Object>} HTML otimizado e métricas
   * @private
   */
  async _optimizeCssComplexity(template, edgeCases, options) {
    const cssComplexityCase = edgeCases.find(ec => ec.type === 'css_complexity');
    if (!cssComplexityCase) {
      return null;
    }
    
    logger.debug(`AdvancedEdgeCaseOptimizer: Otimizando complexidade CSS`);
    
    try {
      // Usar JSDOM para manipular o DOM
      const dom = new JSDOM(template);
      const document = dom.window.document;
      
      // Encontrar elementos style
      const styleElements = document.querySelectorAll('style');
      
      // Transformar
      let optimizationsApplied = 0;
      
      for (const style of styleElements) {
        let css = style.textContent;
        const originalLength = css.length;
        
        // Otimização: remover comentários CSS
        css = css.replace(/\/\*[\s\S]*?\*\//g, '');
        
        // Otimização: simplificar seletores muito complexos
        // Encontrar seletores complexos (mais de 4 níveis)
        const complexSelectorRegex = /([a-z0-9_\-\.#\[\]]+\s+){4,}[a-z0-9_\-\.#\[\]]+\s*\{/gi;
        const complexSelectors = css.match(complexSelectorRegex) || [];
        
        for (const selector of complexSelectors) {
          // Extrair o seletor (sem as chaves)
          const selectorOnly = selector.slice(0, selector.indexOf('{')).trim();
          
          // Simplificar pegando só os últimos 3 níveis
          const parts = selectorOnly.split(/\s+/);
          const simplifiedSelector = parts.slice(-3).join(' ');
          
          // Substituir no CSS
          css = css.replace(selectorOnly, simplifiedSelector);
          optimizationsApplied++;
        }
        
        // Adicionar um comentário para indicar otimização
        css = `/* Optimized by AdvancedEdgeCaseOptimizer */\n${css}`;
        
        // Atualizar o conteúdo do elemento style
        style.textContent = css;
        
        // Contar como otimização se houver redução significativa
        if (css.length < originalLength * 0.9) {
          optimizationsApplied++;
        }
      }
      
      // Retornar HTML otimizado
      if (optimizationsApplied > 0) {
        // Registrar métrica
        if (!this.advancedMetrics.optimizationSuccess['css_complexity']) {
          this.advancedMetrics.optimizationSuccess['css_complexity'] = 0;
        }
        this.advancedMetrics.optimizationSuccess['css_complexity'] += optimizationsApplied;
        
        return {
          html: dom.serialize(),
          optimizationsApplied
        };
      }
      
      return null;
    } catch (error) {
      logger.error(`AdvancedEdgeCaseOptimizer: Erro ao otimizar complexidade CSS: ${error.message}`);
      return null;
    }
  }

  /**
   * Otimização para flexboxes aninhados
   * @param {string} template - Template HTML
   * @param {Array} edgeCases - Casos extremos detectados
   * @param {Object} options - Opções de otimização
   * @returns {Promise<Object>} HTML otimizado e métricas
   * @private
   */
  async _optimizeNestedFlexboxes(template, edgeCases, options) {
    const nestedFlexboxCase = edgeCases.find(ec => ec.type === 'nested_flexboxes');
    if (!nestedFlexboxCase) {
      return null;
    }
    
    logger.debug(`AdvancedEdgeCaseOptimizer: Otimizando ${nestedFlexboxCase.count} flexboxes aninhados`);
    
    // Implementação futura - placeholder por enquanto
    return null;
  }

  /**
   * Otimização para grids excessivos
   * @param {string} template - Template HTML
   * @param {Array} edgeCases - Casos extremos detectados
   * @param {Object} options - Opções de otimização
   * @returns {Promise<Object>} HTML otimizado e métricas
   * @private
   */
  async _optimizeExcessiveGrid(template, edgeCases, options) {
    const excessiveGridCase = edgeCases.find(ec => ec.type === 'excessive_grids');
    if (!excessiveGridCase) {
      return null;
    }
    
    logger.debug(`AdvancedEdgeCaseOptimizer: Otimizando ${excessiveGridCase.count} grids excessivos`);
    
    // Implementação futura - placeholder por enquanto
    return null;
  }

  /**
   * Retorna métricas avançadas do otimizador
   * @returns {Object} Métricas avançadas
   */
  getAdvancedMetrics() {
    return this.advancedMetrics;
  }
}

module.exports = AdvancedEdgeCaseOptimizer;