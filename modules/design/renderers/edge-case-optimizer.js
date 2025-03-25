/**
 * Edge Case Optimizer para Renderizador Progressivo
 * 
 * Módulo especializado em otimizações para casos extremos encontrados
 * durante os testes de carga. Implementa soluções específicas para padrões
 * problemáticos e templates extremamente grandes.
 * 
 * @author PHP Universal MCP Server Team
 * @version 1.0.0
 */

const { JSDOM } = require('jsdom');
const logger = require('../../../utils/logger');

/**
 * Otimizador para casos extremos do renderizador progressivo
 */
class EdgeCaseOptimizer {
  /**
   * Construtor
   * @param {Object} options - Opções de configuração
   */
  constructor(options = {}) {
    this.options = {
      // Habilitar otimizações agressivas
      aggressiveOptimization: true,
      // Tamanho máximo (em KB) para renderizar componentes completos
      maxComponentSize: 150,
      // Número máximo de elementos em uma única DOM tree
      maxElementsPerTree: 5000,
      // Habilitar log detalhado
      debug: false,
      ...options
    };

    // Mecanismos de otimização registrados
    this.optimizers = [
      // Otimizações para templates em geral
      this._optimizeNestedTables,
      this._optimizeDeepDOM,
      this._optimizeRedundantElements,
      this._optimizeHeavyComponents,
      
      // Otimizações para edge cases específicos
      this._optimizeCarousels,
      this._optimizeNestedForms,
      this._optimizeModalDialogs,
      this._optimizeInfiniteScrollContainers,
      this._optimizeDataGrids
    ];

    // Inicializar métricas
    this.metrics = {
      templatesBefore: [],
      templatesAfter: [],
      optimizationsApplied: 0,
      edgeCasesDetected: 0,
      memoryReduction: 0
    };
  }

  /**
   * Otimiza um template para casos extremos
   * @param {string} template - Template HTML a ser otimizado
   * @param {Object} options - Opções adicionais de otimização
   * @returns {Promise<Object>} HTML otimizado e métricas
   */
  async optimize(template, options = {}) {
    const startTime = Date.now();
    const mergedOptions = { ...this.options, ...options };
    
    // Armazenar tamanho original
    const originalSize = template.length;
    this.metrics.templatesBefore.push(originalSize);

    try {
      logger.info(`EdgeCaseOptimizer: Iniciando otimização de template (${(originalSize / 1024).toFixed(2)}KB)`);
      
      // Analisar template para detectar casos extremos
      const { edgeCases, domSize } = await this._analyzeTemplate(template);
      this.metrics.edgeCasesDetected += edgeCases.length;
      
      // Aplicar otimizações específicas para casos extremos detectados
      let optimizedTemplate = template;
      
      // Se muitos casos extremos, usar modo agressivo
      const useAggressiveMode = mergedOptions.aggressiveOptimization || 
                               edgeCases.length > 5 || 
                               domSize > mergedOptions.maxElementsPerTree;
      
      if (useAggressiveMode) {
        logger.warn(`EdgeCaseOptimizer: Usando modo agressivo devido a ${edgeCases.length} casos extremos`);
      }
      
      // Aplicar cada otimizador registrado
      for (const optimizer of this.optimizers) {
        // Verificar memória disponível antes da otimização
        this._checkMemory();
        
        // Aplicar otimização
        const result = await optimizer.call(this, optimizedTemplate, edgeCases, {
          ...mergedOptions,
          aggressiveMode: useAggressiveMode
        });
        
        // Atualizar template se houve otimização
        if (result && result.html) {
          optimizedTemplate = result.html;
          this.metrics.optimizationsApplied += result.optimizationsApplied || 0;
          logger.debug(`EdgeCaseOptimizer: Otimização aplicada, ${(result.optimizationsApplied || 0)} mudanças`);
        }
        
        // Forçar coleta de lixo se disponível
        if (typeof global.gc === 'function') {
          global.gc();
        }
      }
      
      // Calcular estatísticas
      const optimizedSize = optimizedTemplate.length;
      this.metrics.templatesAfter.push(optimizedSize);
      const reductionPercent = ((originalSize - optimizedSize) / originalSize) * 100;
      this.metrics.memoryReduction += originalSize - optimizedSize;
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      logger.info(`EdgeCaseOptimizer: Otimização concluída em ${processingTime}ms. Redução: ${reductionPercent.toFixed(2)}%`);
      
      // Retornar template otimizado e métricas
      return {
        html: optimizedTemplate,
        metrics: {
          originalSize,
          optimizedSize,
          reductionPercent,
          edgeCasesDetected: edgeCases.length,
          optimizationsApplied: this.metrics.optimizationsApplied,
          processingTime
        }
      };
    } catch (error) {
      logger.error(`EdgeCaseOptimizer: Erro durante otimização: ${error.message}`);
      
      // Em caso de erro, retornar template original
      return {
        html: template,
        metrics: {
          originalSize,
          optimizedSize: originalSize,
          reductionPercent: 0,
          error: error.message
        }
      };
    }
  }

  /**
   * Analisa um template para detectar casos extremos
   * @param {string} template - Template HTML a ser analisado
   * @returns {Promise<Object>} Informações sobre casos extremos detectados
   * @private
   */
  async _analyzeTemplate(template) {
    // Usar JSDOM com opções limitadas para análise rápida
    const dom = new JSDOM(template, {
      runScripts: 'outside-only'
    });
    
    const document = dom.window.document;
    const edgeCases = [];
    
    try {
      // Verificar tamanho do DOM
      const allElements = document.querySelectorAll('*');
      const domSize = allElements.length;
      
      logger.debug(`EdgeCaseOptimizer: DOM contém ${domSize} elementos`);
      
      // 1. Detectar tabelas aninhadas (problema comum)
      const nestedTables = document.querySelectorAll('table table');
      if (nestedTables.length > 0) {
        edgeCases.push({
          type: 'nested_tables',
          count: nestedTables.length,
          elements: this._getSelectorsForElements(nestedTables)
        });
      }
      
      // 2. Detectar DOM excessivamente profundo
      const deepElements = Array.from(allElements).filter(el => {
        let depth = 0;
        let parent = el;
        while (parent && depth < 20) {
          parent = parent.parentNode;
          depth++;
        }
        return depth >= 15; // profundidade considerada excessiva
      });
      
      if (deepElements.length > 0) {
        edgeCases.push({
          type: 'deep_dom',
          count: deepElements.length,
          elements: this._getSelectorsForElements(deepElements)
        });
      }
      
      // 3. Detectar carrosséis e sliders (componentes pesados)
      const carousels = document.querySelectorAll('.carousel, .slider, [data-slider], [data-carousel]');
      if (carousels.length > 0) {
        edgeCases.push({
          type: 'carousel',
          count: carousels.length,
          elements: this._getSelectorsForElements(carousels)
        });
      }
      
      // 4. Detectar grids de dados grandes
      const dataGrids = document.querySelectorAll('.grid, .data-grid, .table-responsive, .datatable');
      const largeGrids = Array.from(dataGrids).filter(grid => grid.querySelectorAll('tr, .row').length > 30);
      
      if (largeGrids.length > 0) {
        edgeCases.push({
          type: 'large_grid',
          count: largeGrids.length,
          elements: this._getSelectorsForElements(largeGrids)
        });
      }
      
      // 5. Detectar formulários aninhados ou complexos
      const complexForms = document.querySelectorAll('form');
      const heavyForms = Array.from(complexForms).filter(form => form.querySelectorAll('input, select, textarea').length > 20);
      
      if (heavyForms.length > 0) {
        edgeCases.push({
          type: 'complex_form',
          count: heavyForms.length,
          elements: this._getSelectorsForElements(heavyForms)
        });
      }
      
      // 6. Detectar modais e dialogs
      const modals = document.querySelectorAll('.modal, dialog, [role="dialog"]');
      if (modals.length > 3) { // muitos modais podem ser problemáticos
        edgeCases.push({
          type: 'multiple_modals',
          count: modals.length,
          elements: this._getSelectorsForElements(modals)
        });
      }
      
      // 7. Detectar containers de infinite scroll
      const infiniteScrolls = document.querySelectorAll('.infinite-scroll, [data-infinite], .load-more');
      if (infiniteScrolls.length > 0) {
        edgeCases.push({
          type: 'infinite_scroll',
          count: infiniteScrolls.length,
          elements: this._getSelectorsForElements(infiniteScrolls)
        });
      }
      
      // 8. Detectar scripts pesados
      const heavyScripts = Array.from(document.querySelectorAll('script')).filter(script => 
        script.textContent && script.textContent.length > 5000
      );
      
      if (heavyScripts.length > 0) {
        edgeCases.push({
          type: 'heavy_script',
          count: heavyScripts.length,
          elements: this._getSelectorsForElements(heavyScripts)
        });
      }
      
      // 9. Detectar elementos com muitos filhos
      const heavyParents = Array.from(allElements).filter(el => el.children.length > 50);
      if (heavyParents.length > 0) {
        edgeCases.push({
          type: 'heavy_parent',
          count: heavyParents.length,
          elements: this._getSelectorsForElements(heavyParents)
        });
      }
      
      // 10. Detectar redundância de elementos
      // (elementos com classes idênticas aninhados uns dentro dos outros)
      const redundantElements = this._findRedundantElements(document);
      if (redundantElements.length > 0) {
        edgeCases.push({
          type: 'redundant_elements',
          count: redundantElements.length,
          elements: this._getSelectorsForElements(redundantElements)
        });
      }
      
      logger.info(`EdgeCaseOptimizer: Detectados ${edgeCases.length} tipos de casos extremos`);
      
      return { edgeCases, domSize };
    } catch (error) {
      logger.error(`EdgeCaseOptimizer: Erro ao analisar template: ${error.message}`);
      return { edgeCases: [], domSize: 0 };
    } finally {
      // Limpar recursos
      dom.window.close();
    }
  }

  /**
   * Gera seletores CSS únicos para elementos
   * @param {NodeList|Array} elements - Elementos para gerar seletores
   * @returns {Array<string>} Array de seletores CSS
   * @private
   */
  _getSelectorsForElements(elements) {
    const selectors = [];
    const maxElements = 10; // Limitar quantidade de seletores para não sobrecarregar logs
    
    try {
      // Converter para array se necessário
      const elementsArray = elements instanceof NodeList ? Array.from(elements) : elements;
      
      // Gerar seletores para até maxElements
      for (let i = 0; i < Math.min(elementsArray.length, maxElements); i++) {
        const element = elementsArray[i];
        
        // Tentar gerar um seletor único
        let selector = element.tagName.toLowerCase();
        
        // Adicionar ID se existir
        if (element.id) {
          selector += `#${element.id}`;
        } 
        // Caso contrário, adicionar classes
        else if (element.className && typeof element.className === 'string') {
          const classes = element.className.trim().split(/\s+/);
          if (classes.length > 0 && classes[0] !== '') {
            selector += `.${classes[0]}`;
          }
        }
        
        // Adicionar informação de posição se necessário para tornar único
        if (element.parentNode) {
          const siblings = element.parentNode.children;
          const sameTagSiblings = Array.from(siblings).filter(el => el.tagName === element.tagName);
          
          if (sameTagSiblings.length > 1) {
            const index = Array.from(siblings).indexOf(element) + 1;
            selector += `:nth-child(${index})`;
          }
        }
        
        selectors.push(selector);
      }
      
      // Adicionar indicador de mais elementos se necessário
      if (elementsArray.length > maxElements) {
        selectors.push(`... (${elementsArray.length - maxElements} more)`);
      }
    } catch (error) {
      logger.error(`EdgeCaseOptimizer: Erro ao gerar seletores: ${error.message}`);
    }
    
    return selectors;
  }

  /**
   * Encontra elementos redundantes no documento (elementos com mesmas classes aninhados)
   * @param {Document} document - Documento DOM
   * @returns {Array} Array de elementos redundantes
   * @private
   */
  _findRedundantElements(document) {
    const redundantElements = [];
    
    try {
      // Percorrer todos os elementos com pelo menos uma classe
      const elementsWithClass = document.querySelectorAll('[class]');
      
      for (const element of elementsWithClass) {
        const parentWithSameClass = this._findParentWithSameClass(element);
        
        if (parentWithSameClass) {
          redundantElements.push(element);
        }
      }
    } catch (error) {
      logger.error(`EdgeCaseOptimizer: Erro ao buscar elementos redundantes: ${error.message}`);
    }
    
    return redundantElements;
  }

  /**
   * Encontra ancestral com mesma classe de um elemento
   * @param {Element} element - Elemento a verificar
   * @returns {Element|null} Ancestral com mesma classe ou null
   * @private
   */
  _findParentWithSameClass(element) {
    if (!element || !element.className || typeof element.className !== 'string') {
      return null;
    }
    
    const classes = element.className.trim().split(/\s+/);
    
    // Verificar cada ancestral
    let parent = element.parentElement;
    while (parent) {
      if (parent.className && typeof parent.className === 'string') {
        const parentClasses = parent.className.trim().split(/\s+/);
        
        // Verificar se há interseção entre os conjuntos de classes
        const hasCommonClass = classes.some(cls => parentClasses.includes(cls));
        
        if (hasCommonClass) {
          return parent;
        }
      }
      
      parent = parent.parentElement;
    }
    
    return null;
  }

  /**
   * Verifica o uso atual de memória
   * @private
   */
  _checkMemory() {
    try {
      const memoryUsage = process.memoryUsage();
      const heapUsed = memoryUsage.heapUsed / 1024 / 1024; // MB
      
      if (heapUsed > 200) {
        logger.warn(`EdgeCaseOptimizer: Alto uso de memória: ${heapUsed.toFixed(2)}MB`);
        
        // Tentar liberar memória
        if (typeof global.gc === 'function') {
          global.gc();
        }
      }
    } catch (error) {
      // Ignorar erros ao verificar memória
    }
  }

  /**
   * Otimização para tabelas aninhadas
   * @param {string} template - Template HTML
   * @param {Array} edgeCases - Casos extremos detectados
   * @param {Object} options - Opções de otimização
   * @returns {Promise<Object>} HTML otimizado e métricas
   * @private
   */
  async _optimizeNestedTables(template, edgeCases, options) {
    const nestedTablesCase = edgeCases.find(ec => ec.type === 'nested_tables');
    if (!nestedTablesCase) {
      return null;
    }
    
    logger.debug(`EdgeCaseOptimizer: Otimizando ${nestedTablesCase.count} tabelas aninhadas`);
    
    try {
      // Usar JSDOM para manipular o DOM
      const dom = new JSDOM(template);
      const document = dom.window.document;
      
      // Encontrar tabelas aninhadas
      const nestedTables = document.querySelectorAll('table table');
      
      // Transformar
      let optimizationsApplied = 0;
      
      for (const table of nestedTables) {
        // Para tabelas aninhadas grandes, converter para div com data-table
        if (options.aggressiveMode || table.querySelectorAll('tr').length > 10) {
          // Criar estrutura simplificada equivalente com divs
          const tableWrapper = document.createElement('div');
          tableWrapper.className = 'simplified-table';
          tableWrapper.setAttribute('data-was-table', 'true');
          tableWrapper.setAttribute('data-lazy-render', 'true');
          tableWrapper.setAttribute('data-progressive-priority', '4');
          tableWrapper.innerHTML = table.outerHTML;
          
          // Substituir a tabela aninhada pelo wrapper
          table.parentNode.replaceChild(tableWrapper, table);
          optimizationsApplied++;
        }
      }
      
      // Retornar HTML otimizado
      if (optimizationsApplied > 0) {
        return {
          html: dom.serialize(),
          optimizationsApplied
        };
      }
      
      return null;
    } catch (error) {
      logger.error(`EdgeCaseOptimizer: Erro ao otimizar tabelas aninhadas: ${error.message}`);
      return null;
    }
  }

  /**
   * Otimização para DOM excessivamente profundo
   * @param {string} template - Template HTML
   * @param {Array} edgeCases - Casos extremos detectados
   * @param {Object} options - Opções de otimização
   * @returns {Promise<Object>} HTML otimizado e métricas
   * @private
   */
  async _optimizeDeepDOM(template, edgeCases, options) {
    const deepDOMCase = edgeCases.find(ec => ec.type === 'deep_dom');
    if (!deepDOMCase) {
      return null;
    }
    
    logger.debug(`EdgeCaseOptimizer: Otimizando ${deepDOMCase.count} elementos com DOM profundo`);
    
    try {
      // Usar JSDOM para manipular o DOM
      const dom = new JSDOM(template);
      const document = dom.window.document;
      
      // Encontrar elementos com profundidade excessiva
      const allElements = document.querySelectorAll('*');
      const deepElements = Array.from(allElements).filter(el => {
        let depth = 0;
        let parent = el;
        while (parent && depth < 20) {
          parent = parent.parentNode;
          depth++;
        }
        return depth >= 15; // profundidade considerada excessiva
      });
      
      // Transformar
      let optimizationsApplied = 0;
      
      for (const element of deepElements) {
        // Encontrar um ancestral a uma profundidade razoável
        let target = element;
        let depth = 0;
        while (target.parentNode && depth < 10) {
          target = target.parentNode;
          depth++;
        }
        
        // Se o ancestral tem muitos filhos, otimizar
        if (options.aggressiveMode || this._countDescendants(target) > 50) {
          // Criar wrapper para conteúdo profundo
          const wrapper = document.createElement('div');
          wrapper.className = 'deep-content-wrapper';
          wrapper.setAttribute('data-deep-content', 'true');
          wrapper.setAttribute('data-lazy-render', 'true');
          wrapper.setAttribute('data-progressive-priority', '5');
          
          // Capturar o conteúdo original
          wrapper.innerHTML = target.innerHTML;
          
          // Substituir o conteúdo do alvo pelo wrapper
          target.innerHTML = '';
          target.appendChild(wrapper);
          
          optimizationsApplied++;
          
          // Limitar otimizações para evitar sobrecarga
          if (optimizationsApplied >= 5) break;
        }
      }
      
      // Retornar HTML otimizado
      if (optimizationsApplied > 0) {
        return {
          html: dom.serialize(),
          optimizationsApplied
        };
      }
      
      return null;
    } catch (error) {
      logger.error(`EdgeCaseOptimizer: Erro ao otimizar DOM profundo: ${error.message}`);
      return null;
    }
  }

  /**
   * Otimização para elementos redundantes
   * @param {string} template - Template HTML
   * @param {Array} edgeCases - Casos extremos detectados
   * @param {Object} options - Opções de otimização
   * @returns {Promise<Object>} HTML otimizado e métricas
   * @private
   */
  async _optimizeRedundantElements(template, edgeCases, options) {
    const redundantCase = edgeCases.find(ec => ec.type === 'redundant_elements');
    if (!redundantCase) {
      return null;
    }
    
    logger.debug(`EdgeCaseOptimizer: Otimizando ${redundantCase.count} elementos redundantes`);
    
    try {
      // Usar JSDOM para manipular o DOM
      const dom = new JSDOM(template);
      const document = dom.window.document;
      
      // Encontrar elementos redundantes
      const redundantElements = this._findRedundantElements(document);
      
      // Transformar
      let optimizationsApplied = 0;
      
      for (const element of redundantElements) {
        const parent = this._findParentWithSameClass(element);
        
        if (parent) {
          // Mover o conteúdo para o pai
          const contentElements = Array.from(element.childNodes);
          for (const contentElement of contentElements) {
            parent.insertBefore(contentElement.cloneNode(true), element);
          }
          
          // Remover o elemento redundante
          parent.removeChild(element);
          optimizationsApplied++;
        }
        
        // Limitar otimizações para evitar sobrecarga
        if (optimizationsApplied >= 20) break;
      }
      
      // Retornar HTML otimizado
      if (optimizationsApplied > 0) {
        return {
          html: dom.serialize(),
          optimizationsApplied
        };
      }
      
      return null;
    } catch (error) {
      logger.error(`EdgeCaseOptimizer: Erro ao otimizar elementos redundantes: ${error.message}`);
      return null;
    }
  }

  /**
   * Otimização para componentes pesados
   * @param {string} template - Template HTML
   * @param {Array} edgeCases - Casos extremos detectados
   * @param {Object} options - Opções de otimização
   * @returns {Promise<Object>} HTML otimizado e métricas
   * @private
   */
  async _optimizeHeavyComponents(template, edgeCases, options) {
    const heavyParentCase = edgeCases.find(ec => ec.type === 'heavy_parent');
    if (!heavyParentCase) {
      return null;
    }
    
    logger.debug(`EdgeCaseOptimizer: Otimizando ${heavyParentCase.count} componentes pesados`);
    
    try {
      // Usar JSDOM para manipular o DOM
      const dom = new JSDOM(template);
      const document = dom.window.document;
      
      // Encontrar elementos com muitos filhos
      const heavyParents = Array.from(document.querySelectorAll('*')).filter(el => el.children.length > 50);
      
      // Transformar
      let optimizationsApplied = 0;
      
      for (const element of heavyParents) {
        // Converter para componente lazy-loaded
        const wrapper = document.createElement('div');
        wrapper.className = `heavy-component-wrapper ${element.className || ''}`;
        wrapper.setAttribute('data-heavy-component', 'true');
        wrapper.setAttribute('data-lazy-render', 'true');
        wrapper.setAttribute('data-progressive-priority', '5');
        
        // Capturar o conteúdo original
        wrapper.innerHTML = element.innerHTML;
        
        // Substituir o conteúdo do elemento pelo wrapper
        element.innerHTML = '';
        element.appendChild(wrapper);
        
        optimizationsApplied++;
        
        // Limitar otimizações para evitar sobrecarga
        if (optimizationsApplied >= 5) break;
      }
      
      // Retornar HTML otimizado
      if (optimizationsApplied > 0) {
        return {
          html: dom.serialize(),
          optimizationsApplied
        };
      }
      
      return null;
    } catch (error) {
      logger.error(`EdgeCaseOptimizer: Erro ao otimizar componentes pesados: ${error.message}`);
      return null;
    }
  }

  /**
   * Otimização específica para carrosséis
   * @param {string} template - Template HTML
   * @param {Array} edgeCases - Casos extremos detectados
   * @param {Object} options - Opções de otimização
   * @returns {Promise<Object>} HTML otimizado e métricas
   * @private
   */
  async _optimizeCarousels(template, edgeCases, options) {
    const carouselCase = edgeCases.find(ec => ec.type === 'carousel');
    if (!carouselCase) {
      return null;
    }
    
    logger.debug(`EdgeCaseOptimizer: Otimizando ${carouselCase.count} carrosséis`);
    
    try {
      // Usar JSDOM para manipular o DOM
      const dom = new JSDOM(template);
      const document = dom.window.document;
      
      // Encontrar carrosséis
      const carousels = document.querySelectorAll('.carousel, .slider, [data-slider], [data-carousel]');
      
      // Transformar
      let optimizationsApplied = 0;
      
      for (const carousel of carousels) {
        // Encontrar slides
        const slides = carousel.querySelectorAll('.carousel-item, .slide, .item');
        
        if (slides.length > 0) {
          // Manter apenas o primeiro slide visível, outros como lazy-load
          for (let i = 0; i < slides.length; i++) {
            const slide = slides[i];
            
            if (i === 0) {
              // Primeiro slide permanece visível
              slide.setAttribute('data-active', 'true');
            } else {
              // Outros slides são marcados para lazy loading
              slide.setAttribute('data-lazy-slide', 'true');
              slide.setAttribute('aria-hidden', 'true');
              slide.style.display = 'none';
            }
          }
          
          // Marcar carousel para inicialização progressiva
          carousel.setAttribute('data-progressive-init', 'true');
          carousel.setAttribute('data-progressive-priority', '3');
          
          optimizationsApplied++;
        }
      }
      
      // Retornar HTML otimizado
      if (optimizationsApplied > 0) {
        return {
          html: dom.serialize(),
          optimizationsApplied
        };
      }
      
      return null;
    } catch (error) {
      logger.error(`EdgeCaseOptimizer: Erro ao otimizar carrosséis: ${error.message}`);
      return null;
    }
  }

  /**
   * Otimização específica para formulários aninhados
   * @param {string} template - Template HTML
   * @param {Array} edgeCases - Casos extremos detectados
   * @param {Object} options - Opções de otimização
   * @returns {Promise<Object>} HTML otimizado e métricas
   * @private
   */
  async _optimizeNestedForms(template, edgeCases, options) {
    const formCase = edgeCases.find(ec => ec.type === 'complex_form');
    if (!formCase) {
      return null;
    }
    
    logger.debug(`EdgeCaseOptimizer: Otimizando ${formCase.count} formulários complexos`);
    
    try {
      // Usar JSDOM para manipular o DOM
      const dom = new JSDOM(template);
      const document = dom.window.document;
      
      // Encontrar formulários complexos
      const complexForms = Array.from(document.querySelectorAll('form'))
        .filter(form => form.querySelectorAll('input, select, textarea').length > 20);
      
      // Transformar
      let optimizationsApplied = 0;
      
      for (const form of complexForms) {
        // Dividir formulário em grupos lógicos (fieldsets, divs)
        const fieldsets = form.querySelectorAll('fieldset, .form-group, .input-group');
        
        if (fieldsets.length > 0) {
          // Criar navegação por abas para grupos
          const tabsWrapper = document.createElement('div');
          tabsWrapper.className = 'form-tabs-wrapper';
          
          // Criar navegação por abas
          const tabsNav = document.createElement('div');
          tabsNav.className = 'form-tabs-nav';
          
          // Criar contêiner de conteúdo
          const tabsContent = document.createElement('div');
          tabsContent.className = 'form-tabs-content';
          
          // Processar cada grupo
          for (let i = 0; i < fieldsets.length; i++) {
            const fieldset = fieldsets[i];
            const fieldsetId = `form-tab-${i}`;
            
            // Criar tab
            const tab = document.createElement('button');
            tab.className = i === 0 ? 'form-tab active' : 'form-tab';
            tab.setAttribute('data-tab', fieldsetId);
            tab.textContent = fieldset.querySelector('legend')?.textContent || 
                              fieldset.getAttribute('data-title') || 
                              `Seção ${i + 1}`;
            
            // Adicionar tab à navegação
            tabsNav.appendChild(tab);
            
            // Criar painel de conteúdo
            const panel = document.createElement('div');
            panel.className = i === 0 ? 'form-tab-panel active' : 'form-tab-panel';
            panel.id = fieldsetId;
            panel.appendChild(fieldset.cloneNode(true));
            
            // Adicionar painel ao conteúdo
            tabsContent.appendChild(panel);
          }
          
          // Montar estrutura de abas
          tabsWrapper.appendChild(tabsNav);
          tabsWrapper.appendChild(tabsContent);
          
          // Substituir o conteúdo do formulário
          form.innerHTML = '';
          form.appendChild(tabsWrapper);
          
          optimizationsApplied++;
        }
      }
      
      // Retornar HTML otimizado
      if (optimizationsApplied > 0) {
        return {
          html: dom.serialize(),
          optimizationsApplied
        };
      }
      
      return null;
    } catch (error) {
      logger.error(`EdgeCaseOptimizer: Erro ao otimizar formulários: ${error.message}`);
      return null;
    }
  }

  /**
   * Otimização específica para modais e diálogos
   * @param {string} template - Template HTML
   * @param {Array} edgeCases - Casos extremos detectados
   * @param {Object} options - Opções de otimização
   * @returns {Promise<Object>} HTML otimizado e métricas
   * @private
   */
  async _optimizeModalDialogs(template, edgeCases, options) {
    const modalCase = edgeCases.find(ec => ec.type === 'multiple_modals');
    if (!modalCase) {
      return null;
    }
    
    logger.debug(`EdgeCaseOptimizer: Otimizando ${modalCase.count} modais`);
    
    try {
      // Usar JSDOM para manipular o DOM
      const dom = new JSDOM(template);
      const document = dom.window.document;
      
      // Encontrar modais
      const modals = document.querySelectorAll('.modal, dialog, [role="dialog"]');
      
      // Transformar
      let optimizationsApplied = 0;
      
      for (const modal of modals) {
        // Separar modais do DOM principal e mover para o final do body
        document.body.appendChild(modal.cloneNode(true));
        modal.parentNode.removeChild(modal);
        
        optimizationsApplied++;
      }
      
      // Criar container para gerenciar modais
      if (optimizationsApplied > 0) {
        const modalManager = document.createElement('div');
        modalManager.id = 'modal-container';
        modalManager.setAttribute('data-progressive-priority', '5');
        modalManager.setAttribute('data-lazy-render', 'true');
        
        // Mover todos os modais para dentro do gerenciador
        const detachedModals = document.querySelectorAll('.modal, dialog, [role="dialog"]');
        for (const modal of detachedModals) {
          modalManager.appendChild(modal);
        }
        
        document.body.appendChild(modalManager);
      }
      
      // Retornar HTML otimizado
      if (optimizationsApplied > 0) {
        return {
          html: dom.serialize(),
          optimizationsApplied
        };
      }
      
      return null;
    } catch (error) {
      logger.error(`EdgeCaseOptimizer: Erro ao otimizar modais: ${error.message}`);
      return null;
    }
  }

  /**
   * Otimização específica para containers de infinite scroll
   * @param {string} template - Template HTML
   * @param {Array} edgeCases - Casos extremos detectados
   * @param {Object} options - Opções de otimização
   * @returns {Promise<Object>} HTML otimizado e métricas
   * @private
   */
  async _optimizeInfiniteScrollContainers(template, edgeCases, options) {
    const infiniteScrollCase = edgeCases.find(ec => ec.type === 'infinite_scroll');
    if (!infiniteScrollCase) {
      return null;
    }
    
    logger.debug(`EdgeCaseOptimizer: Otimizando ${infiniteScrollCase.count} containers de infinite scroll`);
    
    try {
      // Usar JSDOM para manipular o DOM
      const dom = new JSDOM(template);
      const document = dom.window.document;
      
      // Encontrar containers de infinite scroll
      const infiniteScrolls = document.querySelectorAll('.infinite-scroll, [data-infinite], .load-more');
      
      // Transformar
      let optimizationsApplied = 0;
      
      for (const container of infiniteScrolls) {
        // Limitar o número de itens iniciais
        const items = container.children;
        const maxInitialItems = 5;
        
        if (items.length > maxInitialItems) {
          // Criar wrapper para itens adicionais
          const moreItemsWrapper = document.createElement('div');
          moreItemsWrapper.className = 'more-items-container';
          moreItemsWrapper.setAttribute('data-lazy-load', 'true');
          moreItemsWrapper.setAttribute('data-progressive-priority', '5');
          
          // Mover itens adicionais para o wrapper
          for (let i = items.length - 1; i >= maxInitialItems; i--) {
            moreItemsWrapper.insertBefore(items[i], moreItemsWrapper.firstChild);
          }
          
          // Adicionar wrapper após os itens iniciais
          container.appendChild(moreItemsWrapper);
          
          // Adicionar botão "Carregar mais"
          const loadMoreBtn = document.createElement('button');
          loadMoreBtn.className = 'load-more-btn';
          loadMoreBtn.textContent = 'Carregar mais';
          loadMoreBtn.setAttribute('data-load-more', 'true');
          
          container.appendChild(loadMoreBtn);
          
          optimizationsApplied++;
        }
      }
      
      // Retornar HTML otimizado
      if (optimizationsApplied > 0) {
        return {
          html: dom.serialize(),
          optimizationsApplied
        };
      }
      
      return null;
    } catch (error) {
      logger.error(`EdgeCaseOptimizer: Erro ao otimizar infinite scroll: ${error.message}`);
      return null;
    }
  }

  /**
   * Otimização específica para grids de dados
   * @param {string} template - Template HTML
   * @param {Array} edgeCases - Casos extremos detectados
   * @param {Object} options - Opções de otimização
   * @returns {Promise<Object>} HTML otimizado e métricas
   * @private
   */
  async _optimizeDataGrids(template, edgeCases, options) {
    const gridCase = edgeCases.find(ec => ec.type === 'large_grid');
    if (!gridCase) {
      return null;
    }
    
    logger.debug(`EdgeCaseOptimizer: Otimizando ${gridCase.count} grids de dados`);
    
    try {
      // Usar JSDOM para manipular o DOM
      const dom = new JSDOM(template);
      const document = dom.window.document;
      
      // Encontrar grids de dados
      const dataGrids = document.querySelectorAll('.grid, .data-grid, .table-responsive, .datatable');
      const largeGrids = Array.from(dataGrids).filter(grid => grid.querySelectorAll('tr, .row').length > 30);
      
      // Transformar
      let optimizationsApplied = 0;
      
      for (const grid of largeGrids) {
        // Extrair linhas da grid
        let rows;
        
        if (grid.tagName.toLowerCase() === 'table' || grid.querySelector('table')) {
          const table = grid.tagName.toLowerCase() === 'table' ? grid : grid.querySelector('table');
          rows = table.querySelectorAll('tbody tr');
        } else {
          rows = grid.querySelectorAll('.row');
        }
        
        if (rows.length > 0) {
          // Definir o número de linhas visíveis inicialmente
          const visibleRows = 10;
          
          // Ocultar linhas além do limite
          for (let i = visibleRows; i < rows.length; i++) {
            rows[i].style.display = 'none';
            rows[i].setAttribute('data-lazy-row', 'true');
          }
          
          // Adicionar controles de paginação
          const paginationWrapper = document.createElement('div');
          paginationWrapper.className = 'grid-pagination';
          
          const pageCount = Math.ceil(rows.length / visibleRows);
          
          // Adicionar informações de paginação
          paginationWrapper.innerHTML = `
            <div class="pagination-info">
              Mostrando 1-${visibleRows} de ${rows.length} linhas
            </div>
            <div class="pagination-controls">
              <button disabled class="pagination-prev">Anterior</button>
              <span class="current-page">Página 1 de ${pageCount}</span>
              <button class="pagination-next">Próximo</button>
            </div>
          `;
          
          // Adicionar atributos para paginação dinâmica
          grid.setAttribute('data-page-size', visibleRows);
          grid.setAttribute('data-total-rows', rows.length);
          grid.setAttribute('data-current-page', 1);
          grid.setAttribute('data-progressive-grid', 'true');
          grid.setAttribute('data-progressive-priority', '3');
          
          // Adicionar paginação após a grid
          grid.parentNode.insertBefore(paginationWrapper, grid.nextSibling);
          
          optimizationsApplied++;
        }
      }
      
      // Retornar HTML otimizado
      if (optimizationsApplied > 0) {
        return {
          html: dom.serialize(),
          optimizationsApplied
        };
      }
      
      return null;
    } catch (error) {
      logger.error(`EdgeCaseOptimizer: Erro ao otimizar grids de dados: ${error.message}`);
      return null;
    }
  }

  /**
   * Conta o número de descendentes de um elemento
   * @param {Element} element - Elemento a contar descendentes
   * @returns {number} Número de descendentes
   * @private
   */
  _countDescendants(element) {
    return element.querySelectorAll('*').length;
  }

  /**
   * Retorna métricas do otimizador
   * @returns {Object} Métricas do otimizador
   */
  getMetrics() {
    // Calcular métricas gerais
    const totalBefore = this.metrics.templatesBefore.reduce((sum, size) => sum + size, 0);
    const totalAfter = this.metrics.templatesAfter.reduce((sum, size) => sum + size, 0);
    const reductionPercent = totalBefore > 0 ? ((totalBefore - totalAfter) / totalBefore) * 100 : 0;
    
    return {
      templatesProcessed: this.metrics.templatesBefore.length,
      totalBefore,
      totalAfter,
      reductionPercent,
      memoryReduction: this.metrics.memoryReduction,
      edgeCasesDetected: this.metrics.edgeCasesDetected,
      optimizationsApplied: this.metrics.optimizationsApplied
    };
  }
}

module.exports = EdgeCaseOptimizer;