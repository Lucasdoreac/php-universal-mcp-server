/**
 * Performance Optimizer for PHP Universal MCP Server
 * 
 * Sistema avançado para otimização de performance em visualizações grandes no Claude MCP.
 * Implementa estratégias de lazy loading, cache inteligente e renderização progressiva.
 * 
 * @author PHP Universal MCP Server Team
 * @version 1.0.0
 * @license MIT
 */

const NodeCache = require('node-cache');
const { performance } = require('perf_hooks');
const zlib = require('zlib');
const handlebars = require('handlebars');
const logger = require('../../../utils/logger');

class PerformanceOptimizer {
  constructor(options = {}) {
    this.options = {
      cacheEnabled: true,
      compressionEnabled: true,
      lazyLoadingEnabled: true,
      progressiveRenderingEnabled: true,
      cacheTTL: 3600, // 1 hora em segundos
      ...options
    };

    // Inicializar sistema de cache
    this.templateCache = new NodeCache({
      stdTTL: this.options.cacheTTL,
      checkperiod: 120,
      useClones: false
    });

    // Métricas de performance
    this.metrics = {
      renderTimes: [],
      cacheHits: 0,
      cacheMisses: 0,
      compressedSizes: {}
    };

    // Registrar helpers Handlebars personalizados
    this._registerHandlebarsHelpers();

    logger.info('PerformanceOptimizer: Inicializado com sucesso');
  }

  /**
   * Registra helpers personalizados do Handlebars para otimização
   * @private
   */
  _registerHandlebarsHelpers() {
    // Helper para lazy loading de componentes
    handlebars.registerHelper('lazyLoad', (options) => {
      if (!this.options.lazyLoadingEnabled) {
        return options.fn(this);
      }

      const content = options.fn(this);
      return `<div class="lazy-load-container" data-loading="false">
                ${content}
              </div>`;
    });

    // Helper para renderização progressiva
    handlebars.registerHelper('progressiveRender', (priority, options) => {
      if (!this.options.progressiveRenderingEnabled) {
        return options.fn(this);
      }

      const content = options.fn(this);
      return `<div class="progressive-render" data-priority="${priority || 'normal'}">
                ${content}
              </div>`;
    });

    logger.debug('PerformanceOptimizer: Helpers Handlebars registrados');
  }

  /**
   * Otimiza um template HTML para melhor performance
   * @param {string} templateContent - Conteúdo do template
   * @param {object} data - Dados para renderização
   * @param {object} options - Opções de otimização
   * @returns {Promise<string>} Template otimizado
   */
  async optimizeTemplate(templateContent, data = {}, options = {}) {
    const startTime = performance.now();
    const templateId = this._generateTemplateId(templateContent, data);
    const mergedOptions = { ...this.options, ...options };

    try {
      // Verificar cache
      if (mergedOptions.cacheEnabled) {
        const cachedResult = this.templateCache.get(templateId);
        if (cachedResult) {
          this.metrics.cacheHits++;
          logger.debug(`PerformanceOptimizer: Cache hit para template ID ${templateId.substring(0, 8)}...`);
          return this._decompressIfNeeded(cachedResult, mergedOptions);
        }
        this.metrics.cacheMisses++;
      }

      // Processar template
      const processedTemplate = this._preprocessTemplate(templateContent, mergedOptions);
      const compiledTemplate = handlebars.compile(processedTemplate);
      let renderedTemplate = compiledTemplate(data);

      // Pós-processamento para otimizações adicionais
      renderedTemplate = this._postprocessTemplate(renderedTemplate, mergedOptions);

      // Comprimir e armazenar em cache se necessário
      if (mergedOptions.cacheEnabled) {
        const compressedTemplate = mergedOptions.compressionEnabled
          ? this._compressTemplate(renderedTemplate)
          : renderedTemplate;
        
        this.templateCache.set(templateId, compressedTemplate);
        logger.debug(`PerformanceOptimizer: Template armazenado em cache (ID: ${templateId.substring(0, 8)}...)`);
      }

      // Registrar métricas
      const endTime = performance.now();
      this.metrics.renderTimes.push(endTime - startTime);
      
      return renderedTemplate;
    } catch (error) {
      logger.error(`PerformanceOptimizer: Erro ao otimizar template: ${error.message}`);
      // Fallback para o template original em caso de erro
      return templateContent;
    }
  }

  /**
   * Gera um ID único para um template baseado em seu conteúdo e dados
   * @private
   * @param {string} template - Conteúdo do template
   * @param {object} data - Dados para renderização
   * @returns {string} ID único do template
   */
  _generateTemplateId(template, data) {
    const crypto = require('crypto');
    const templateHash = crypto.createHash('md5').update(template).digest('hex');
    const dataHash = crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');
    return `${templateHash}_${dataHash}`;
  }

  /**
   * Pré-processa o template para aplicar otimizações
   * @private
   * @param {string} template - Template a ser processado
   * @param {object} options - Opções de otimização
   * @returns {string} Template pré-processado
   */
  _preprocessTemplate(template, options) {
    // Aplicar estratégias de lazy loading
    if (options.lazyLoadingEnabled) {
      template = this._applyLazyLoadingStrategy(template);
    }

    // Aplicar estratégias de renderização progressiva
    if (options.progressiveRenderingEnabled) {
      template = this._applyProgressiveRenderingStrategy(template);
    }

    return template;
  }

  /**
   * Aplica estratégia de lazy loading a componentes pesados
   * @private
   * @param {string} template - Template a ser processado
   * @returns {string} Template com lazy loading aplicado
   */
  _applyLazyLoadingStrategy(template) {
    // Detectar componentes pesados (carrosséis, galerias, etc.)
    const heavyComponentPatterns = [
      { pattern: /<div[^>]*carousel[^>]*>[\s\S]*?<\/div>/gi, wrapper: 'carousel' },
      { pattern: /<div[^>]*gallery[^>]*>[\s\S]*?<\/div>/gi, wrapper: 'gallery' },
      { pattern: /<table[^>]*>[\s\S]*?<\/table>/gi, wrapper: 'table' },
      { pattern: /<iframe[^>]*>[\s\S]*?<\/iframe>/gi, wrapper: 'iframe' }
    ];

    heavyComponentPatterns.forEach(({ pattern, wrapper }) => {
      template = template.replace(pattern, (match) => {
        return `{{#lazyLoad}}<div class="heavy-component ${wrapper}-wrapper">${match}</div>{{/lazyLoad}}`;
      });
    });

    return template;
  }

  /**
   * Aplica estratégia de renderização progressiva
   * @private
   * @param {string} template - Template a ser processado
   * @returns {string} Template com renderização progressiva aplicada
   */
  _applyProgressiveRenderingStrategy(template) {
    // Identificar seções do template e atribuir prioridades
    const headerPattern = /<header[^>]*>[\s\S]*?<\/header>/gi;
    const mainContentPattern = /<main[^>]*>[\s\S]*?<\/main>/gi;
    const footerPattern = /<footer[^>]*>[\s\S]*?<\/footer>/gi;

    // Prioridade alta para cabeçalho
    template = template.replace(headerPattern, (match) => {
      return `{{#progressiveRender "high"}}${match}{{/progressiveRender}}`;
    });

    // Prioridade normal para conteúdo principal
    template = template.replace(mainContentPattern, (match) => {
      return `{{#progressiveRender "normal"}}${match}{{/progressiveRender}}`;
    });

    // Prioridade baixa para rodapé
    template = template.replace(footerPattern, (match) => {
      return `{{#progressiveRender "low"}}${match}{{/progressiveRender}}`;
    });

    return template;
  }

  /**
   * Pós-processa o template renderizado para otimizações finais
   * @private
   * @param {string} rendered - Template renderizado
   * @param {object} options - Opções de otimização
   * @returns {string} Template pós-processado
   */
  _postprocessTemplate(rendered, options) {
    // Minificar HTML se solicitado
    if (options.minifyHTML) {
      rendered = this._minifyHTML(rendered);
    }

    // Adicionar scripts de inicialização para lazy loading
    if (options.lazyLoadingEnabled) {
      rendered += `
        <script>
          // Inicializador de Lazy Loading
          (function() {
            const lazyContainers = document.querySelectorAll('.lazy-load-container');
            const observer = new IntersectionObserver((entries) => {
              entries.forEach(entry => {
                if (entry.isIntersecting) {
                  const container = entry.target;
                  if (container.getAttribute('data-loading') !== 'true') {
                    container.setAttribute('data-loading', 'true');
                    // Ativar conteúdo
                    container.classList.add('loaded');
                    // Parar de observar depois de carregar
                    observer.unobserve(container);
                  }
                }
              });
            }, { rootMargin: '100px' });
            
            lazyContainers.forEach(container => {
              observer.observe(container);
            });
          })();
        </script>
      `;
    }

    // Adicionar scripts para renderização progressiva
    if (options.progressiveRenderingEnabled) {
      rendered += `
        <script>
          // Inicializador de Renderização Progressiva
          (function() {
            // Mostrar componentes na ordem de prioridade
            const showByPriority = (priority) => {
              const elements = document.querySelectorAll(\`.progressive-render[data-priority="\${priority}"]\`);
              elements.forEach(element => {
                element.style.opacity = "1";
                element.style.transition = "opacity 0.3s ease-in";
              });
            };
            
            // Prioridade alta - imediatamente
            showByPriority('high');
            
            // Prioridade normal - após 100ms
            setTimeout(() => showByPriority('normal'), 100);
            
            // Prioridade baixa - após 300ms
            setTimeout(() => showByPriority('low'), 300);
          })();
        </script>
      `;
    }

    return rendered;
  }

  /**
   * Comprime um template para economia de memória no cache
   * @private
   * @param {string} template - Template a ser comprimido
   * @returns {Buffer} Template comprimido
   */
  _compressTemplate(template) {
    try {
      const compressed = zlib.deflateSync(Buffer.from(template, 'utf8'));
      
      // Registrar métricas de compressão
      const originalSize = Buffer.byteLength(template, 'utf8');
      const compressedSize = compressed.length;
      const ratio = (compressedSize / originalSize) * 100;
      
      this.metrics.compressedSizes[template.length] = {
        original: originalSize,
        compressed: compressedSize,
        ratio: ratio.toFixed(2) + '%'
      };
      
      logger.debug(`PerformanceOptimizer: Compressão: ${originalSize} bytes → ${compressedSize} bytes (${ratio.toFixed(2)}%)`);
      
      return compressed;
    } catch (error) {
      logger.error(`PerformanceOptimizer: Erro ao comprimir template: ${error.message}`);
      return template;
    }
  }

  /**
   * Descomprime um template se estiver comprimido
   * @private
   * @param {string|Buffer} template - Template potencialmente comprimido
   * @param {object} options - Opções de otimização
   * @returns {string} Template descomprimido
   */
  _decompressIfNeeded(template, options) {
    if (!options.compressionEnabled || typeof template === 'string') {
      return template;
    }
    
    try {
      const decompressed = zlib.inflateSync(template).toString('utf8');
      return decompressed;
    } catch (error) {
      logger.error(`PerformanceOptimizer: Erro ao descomprimir template: ${error.message}`);
      // Tentar retornar o template como está se não for possível descomprimir
      return template.toString();
    }
  }

  /**
   * Minifica o HTML para reduzir o tamanho
   * @private
   * @param {string} html - HTML a ser minificado
   * @returns {string} HTML minificado
   */
  _minifyHTML(html) {
    return html
      .replace(/\s+/g, ' ')                        // Combinar espaços múltiplos
      .replace(/>\s+</g, '><')                     // Remover espaços entre tags
      .replace(/<!--(.*?)-->/g, '')                // Remover comentários
      .replace(/\s+\/>/g, '/>')                    // Remover espaços antes de />
      .trim();                                     // Remover espaços no início/fim
  }

  /**
   * Obtém métricas de performance do otimizador
   * @returns {object} Métricas de performance
   */
  getMetrics() {
    const renderTimes = this.metrics.renderTimes;
    const avgRenderTime = renderTimes.length > 0 
      ? renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length 
      : 0;
    
    return {
      averageRenderTimeMs: avgRenderTime.toFixed(2),
      cacheHits: this.metrics.cacheHits,
      cacheMisses: this.metrics.cacheMisses,
      cacheHitRatio: this.metrics.cacheHits + this.metrics.cacheMisses > 0
        ? (this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses) * 100).toFixed(2) + '%'
        : '0%',
      compressionStats: this.metrics.compressedSizes,
      totalTemplatesProcessed: renderTimes.length
    };
  }

  /**
   * Limpa o cache de templates
   * @returns {number} Número de entradas removidas
   */
  clearCache() {
    const keys = this.templateCache.keys();
    this.templateCache.flushAll();
    logger.info(`PerformanceOptimizer: Cache limpo, ${keys.length} entradas removidas`);
    return keys.length;
  }
}

module.exports = PerformanceOptimizer;