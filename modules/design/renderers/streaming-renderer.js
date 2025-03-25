/**
 * Streaming Renderer para PHP Universal MCP Server
 * 
 * Renderizador especializado para templates extremamente grandes
 * que utiliza técnicas de streaming e chunking para otimizar
 * uso de memória e tempo de renderização.
 * 
 * @author PHP Universal MCP Server Team
 * @version 1.0.0
 * @license MIT
 */

const EventEmitter = require('events');
const { JSDOM } = require('jsdom');
const handlebars = require('handlebars');
const MemoryOptimizer = require('./memory-optimizer');
const EnhancedProgressiveRenderer = require('./enhanced-progressive-renderer');

/**
 * Renderizador que implementa técnicas de streaming para templates extremamente grandes
 */
class StreamingRenderer extends EventEmitter {
  /**
   * Construtor do renderizador streaming
   * @param {Object} options - Opções de configuração
   */
  constructor(options = {}) {
    super();
    
    this.options = {
      // Tamanho máximo de cada chunk para processamento (em KB)
      chunkSize: 500,
      
      // Número máximo de workers simultâneos para processamento paralelo
      maxWorkers: 2,
      
      // Limite absoluto de uso de memória em MB (após o qual as otimizações agressivas são acionadas)
      memoryLimit: 300,
      
      // Intervalo (ms) para verificação de uso de memória
      memoryCheckInterval: 1000,
      
      // Habilitar debug detalhado
      debug: false,
      
      // Estratégia de divisão ('dom', 'node', 'section', 'custom')
      chunkStrategy: 'section',
      
      // Tamanho do buffer para streaming (em KB)
      bufferSize: 100,
      
      // Habilitar análise de prioridade para carregamento progressivo
      priorityAnalysis: true,
      
      // Habilitar otimização agressiva para templates extremamente grandes (>5MB)
      aggressiveOptimization: true,
      
      // Habilitar processamento paralelo quando possível
      parallelProcessing: true,
      
      // Função customizada para validar a divisão de chunks
      validateChunk: null,
      
      ...options
    };
    
    // Inicializar renderizador avançado para processar chunks
    this.renderer = new EnhancedProgressiveRenderer({
      memoryOptimization: true,
      memoryOptimizationThreshold: this.options.chunkSize / 2,
      memoryLimit: this.options.memoryLimit / 2,
      renderMode: 'incremental',
      parallelRendering: this.options.parallelProcessing,
      maxParallelWorkers: this.options.maxWorkers,
      debug: this.options.debug
    });
    
    // Inicializar otimizador de memória para divisão e gestão de chunks
    this.memoryOptimizer = new MemoryOptimizer({
      chunkSize: this.options.chunkSize,
      memoryThreshold: this.options.memoryLimit,
      debug: this.options.debug
    });
    
    // Sistema de logging
    this.logger = {
      debug: (...args) => this.options.debug && console.log('[StreamingRenderer:DEBUG]', ...args),
      info: (...args) => console.log('[StreamingRenderer:INFO]', ...args),
      warn: (...args) => console.warn('[StreamingRenderer:WARN]', ...args),
      error: (...args) => console.error('[StreamingRenderer:ERROR]', ...args),
      metric: (...args) => console.log('[StreamingRenderer:METRIC]', ...args)
    };
    
    // Estatísticas de renderização
    this.stats = {
      totalChunks: 0,
      processedChunks: 0,
      renderTime: 0,
      memoryPeak: 0,
      memoryAvg: 0,
      templateSize: 0,
      compressionRatio: 0,
      chunkSizes: []
    };
    
    // Buffer de streaming
    this.buffer = {
      chunks: [],
      size: 0,
      flushed: 0
    };
    
    // Registrar helpers Handlebars customizados
    this._registerHandlebarsHelpers();
    
    // Iniciar monitoramento de memória
    this._startMemoryMonitoring();
    
    this.logger.info('StreamingRenderer inicializado com sucesso');
  }

  /**
   * Registra helpers Handlebars customizados
   * @private
   */
  _registerHandlebarsHelpers() {
    // Helper para identificar chunk boundaries
    handlebars.registerHelper('chunk-boundary', (options) => {
      return new handlebars.SafeString(`<!-- chunk-boundary ${Date.now()} -->`);
    });
    
    // Helper para marcar chunking automático
    handlebars.registerHelper('auto-chunk', (options) => {
      const content = options.fn(this);
      return new handlebars.SafeString(`<!-- chunk-start -->${content}<!-- chunk-end -->`);
    });
    
    // Helper para prioridade dentro de chunks
    handlebars.registerHelper('chunk-priority', (level, options) => {
      const content = options.fn(this);
      return new handlebars.SafeString(`<!-- priority:${level} -->${content}<!-- /priority:${level} -->`);
    });
    
    this.logger.debug('Helpers Handlebars registrados para chunking');
  }

  /**
   * Inicia monitoramento de uso de memória
   * @private
   */
  _startMemoryMonitoring() {
    if (!this.options.debug) return;
    
    this.memoryMonitorInterval = setInterval(() => {
      const memoryUsage = process.memoryUsage();
      const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;
      
      // Atualizar estatísticas
      this.stats.memoryPeak = Math.max(this.stats.memoryPeak, heapUsedMB);
      
      // Calcular média de uso de memória
      if (!this.stats.memoryReadings) {
        this.stats.memoryReadings = [];
      }
      
      this.stats.memoryReadings.push(heapUsedMB);
      this.stats.memoryAvg = this.stats.memoryReadings.reduce((a, b) => a + b, 0) / this.stats.memoryReadings.length;
      
      // Verificar se é necessário otimização agressiva
      if (heapUsedMB > this.options.memoryLimit * 0.8) {
        this.logger.warn(`Uso de memória alto: ${heapUsedMB.toFixed(2)}MB - Ativando otimizações agressivas`);
        this._triggerAggressiveMemoryOptimization();
      }
      
      this.logger.debug(`Uso de memória: ${heapUsedMB.toFixed(2)}MB`);
    }, this.options.memoryCheckInterval);
  }

  /**
   * Para o monitoramento de memória
   * @private
   */
  _stopMemoryMonitoring() {
    if (this.memoryMonitorInterval) {
      clearInterval(this.memoryMonitorInterval);
    }
  }

  /**
   * Ativa otimizações agressivas de memória
   * @private
   */
  _triggerAggressiveMemoryOptimization() {
    // Reduzir tamanho dos chunks
    this.options.chunkSize = Math.max(50, this.options.chunkSize / 2);
    
    // Reduzir tamanho do buffer
    this.options.bufferSize = Math.max(20, this.options.bufferSize / 2);
    
    // Forçar liberação de memória
    if (typeof global.gc === 'function') {
      this.logger.debug('Executando garbage collection forçado');
      global.gc();
    }
    
    // Limpar cachés
    this._clearCaches();
    
    // Emitir evento de otimização de memória
    this.emit('memory-optimization', {
      newChunkSize: this.options.chunkSize,
      newBufferSize: this.options.bufferSize,
      currentMemoryUsage: process.memoryUsage().heapUsed / 1024 / 1024
    });
  }

  /**
   * Limpa cachés para liberar memória
   * @private
   */
  _clearCaches() {
    // Limpar cache de templates do Handlebars
    handlebars.templates = {};
    
    // Limpar buffer se ficar muito grande
    if (this.buffer.size > this.options.bufferSize * 2) {
      this.logger.debug(`Limpando buffer (${this.buffer.size}KB)`);
      this._flushBuffer(true);
    }
  }

  /**
   * Renderiza o template usando streaming para otimizar memória e performance
   * @param {string} templateContent - Conteúdo do template a ser renderizado
   * @param {Object} data - Dados para renderização
   * @param {Object} options - Opções específicas para esta renderização
   * @returns {Promise<string>} HTML renderizado
   */
  async render(templateContent, data = {}, options = {}) {
    const startTime = Date.now();
    const mergedOptions = { ...this.options, ...options };
    
    // Resetar estatísticas
    this.stats = {
      totalChunks: 0,
      processedChunks: 0,
      renderTime: 0,
      memoryPeak: 0,
      templateSize: templateContent.length / 1024, // KB
      compressionRatio: 0,
      chunkSizes: []
    };
    
    try {
      this.logger.info(`Iniciando renderização streaming para template de ${(templateContent.length / 1024).toFixed(2)}KB`);
      
      // Determinar se é um template extremamente grande que precisa de otimizações agressivas
      const isExtremelyLarge = templateContent.length > 5 * 1024 * 1024; // > 5MB
      
      if (isExtremelyLarge && mergedOptions.aggressiveOptimization) {
        this.logger.info('Template extremamente grande detectado - usando otimizações agressivas');
        
        // Ajustar opções para templates enormes
        mergedOptions.chunkSize = Math.min(mergedOptions.chunkSize, 200);
        mergedOptions.bufferSize = Math.min(mergedOptions.bufferSize, 50);
      }
      
      // Dividir o template em chunks usando a estratégia apropriada
      const chunks = await this._chunkifyTemplate(templateContent, mergedOptions);
      
      this.stats.totalChunks = chunks.length;
      
      // Registrar tamanhos dos chunks para análise
      this.stats.chunkSizes = chunks.map(chunk => chunk.length / 1024); // KB
      
      // Armazenar resultado final
      let result = '';
      
      // Inicializar o HTML base se o modo de streaming for ativado
      if (mergedOptions.chunkedOutput) {
        result = this._generateHtmlBase(templateContent);
      }
      
      // Função para processar a saída de cada chunk
      const processChunkOutput = (html, chunkInfo) => {
        if (mergedOptions.chunkedOutput) {
          // Adicionar ao buffer
          this._addToBuffer(html, chunkInfo);
          return result;
        } else {
          // Concatenar no resultado final
          result += html;
          return result;
        }
      };
      
      // Processar chunks
      const processingOptions = {
        isExtremelyLarge,
        totalChunks: chunks.length,
        initialContent: templateContent
      };
      
      // Decidir entre processamento sequencial ou paralelo
      if (mergedOptions.parallelProcessing && chunks.length > 2) {
        // Processar chunks em paralelo com limitação de concorrência
        result = await this._processChunksInParallel(
          chunks, 
          data, 
          processChunkOutput, 
          processingOptions
        );
      } else {
        // Processar chunks sequencialmente
        result = await this._processChunksSequentially(
          chunks, 
          data, 
          processChunkOutput, 
          processingOptions
        );
      }
      
      // Se houver conteúdo no buffer, garantir que seja incorporado ao resultado
      if (this.buffer.chunks.length > 0) {
        result = this._flushBuffer(false);
      }
      
      // Se estiver no modo chunked output, finalizar o HTML
      if (mergedOptions.chunkedOutput) {
        result = this._finalizeChunkedOutput(result);
      }
      
      // Registrar estatísticas finais
      this.stats.renderTime = Date.now() - startTime;
      
      this.logger.info(`Renderização concluída em ${this.stats.renderTime}ms (${chunks.length} chunks)`);
      this.logger.metric(`Pico de memória: ${this.stats.memoryPeak.toFixed(2)}MB`);
      
      // Emitir evento de conclusão
      this.emit('render-complete', {
        templateSize: templateContent.length,
        chunks: chunks.length,
        renderTime: this.stats.renderTime,
        memoryPeak: this.stats.memoryPeak
      });
      
      return result;
    } catch (error) {
      this.logger.error(`Erro na renderização streaming: ${error.message}`);
      this.logger.error(error.stack);
      
      // Emitir evento de erro
      this.emit('render-error', {
        message: error.message,
        stack: error.stack
      });
      
      throw error;
    } finally {
      // Parar monitoramento de memória
      this._stopMemoryMonitoring();
      
      // Limpar recursos
      this._clearResources();
    }
  }

  /**
   * Renderiza de forma incremental com callback para cada chunk renderizado
   * @param {string} templateContent - Conteúdo do template
   * @param {Object} data - Dados para renderização
   * @param {Function} chunkCallback - Callback para cada chunk renderizado (html, chunkInfo) => void
   * @param {Object} options - Opções adicionais
   * @returns {Promise<void>}
   */
  async renderIncremental(templateContent, data = {}, chunkCallback, options = {}) {
    if (!chunkCallback || typeof chunkCallback !== 'function') {
      throw new Error('É necessário fornecer um callback para processar chunks incrementais');
    }
    
    const startTime = Date.now();
    const mergedOptions = { ...this.options, ...options };
    
    try {
      this.logger.info(`Iniciando renderização incremental para template de ${(templateContent.length / 1024).toFixed(2)}KB`);
      
      // Dividir o template em chunks
      const chunks = await this._chunkifyTemplate(templateContent, mergedOptions);
      
      this.stats.totalChunks = chunks.length;
      this.logger.info(`Template dividido em ${chunks.length} chunks`);
      
      // Inicializar contexto de renderização
      const renderContext = {
        templateSize: templateContent.length,
        totalChunks: chunks.length,
        processedChunks: 0,
        startTime
      };
      
      // Processar cada chunk sequencialmente
      for (let i = 0; i < chunks.length; i++) {
        const chunkStartTime = Date.now();
        const chunk = chunks[i];
        
        this.logger.debug(`Processando chunk ${i + 1}/${chunks.length} (${(chunk.length / 1024).toFixed(2)}KB)`);
        
        try {
          // Renderizar o chunk
          const chunkHTML = await this.renderer.render(chunk, {
            ...data,
            _chunkContext: {
              chunkIndex: i,
              totalChunks: chunks.length,
              isFirstChunk: i === 0,
              isLastChunk: i === chunks.length - 1
            }
          });
          
          // Calcular tempo de renderização
          const chunkRenderTime = Date.now() - chunkStartTime;
          
          // Informações sobre o chunk para o callback
          const chunkInfo = {
            index: i,
            total: chunks.length,
            isFirst: i === 0,
            isLast: i === chunks.length - 1,
            progress: Math.round(((i + 1) / chunks.length) * 100),
            renderTime: chunkRenderTime,
            size: chunk.length
          };
          
          // Chamar o callback com o HTML renderizado e informações do chunk
          chunkCallback(chunkHTML, chunkInfo);
          
          // Atualizar estatísticas
          this.stats.processedChunks++;
          renderContext.processedChunks++;
          
          // Emitir evento de progresso
          this.emit('render-progress', {
            chunk: i + 1,
            total: chunks.length,
            percent: Math.round(((i + 1) / chunks.length) * 100),
            renderTime: chunkRenderTime
          });
          
          // Forçar garbage collection após cada chunk se disponível
          if (typeof global.gc === 'function' && (i % 5 === 0 || chunk.length > 1000000)) {
            global.gc();
          }
        } catch (error) {
          this.logger.error(`Erro ao renderizar chunk ${i + 1}: ${error.message}`);
          
          // Emitir evento de erro de chunk
          this.emit('chunk-error', {
            chunk: i + 1,
            total: chunks.length,
            error: error.message
          });
          
          // Continuar com próximo chunk, fornecendo um placeholder para o callback
          chunkCallback(`<!-- Erro na renderização do chunk ${i + 1} -->`, {
            index: i,
            total: chunks.length,
            isFirst: i === 0,
            isLast: i === chunks.length - 1,
            progress: Math.round(((i + 1) / chunks.length) * 100),
            error: true,
            errorMessage: error.message
          });
        }
      }
      
      // Finalizar renderização
      const totalTime = Date.now() - startTime;
      this.stats.renderTime = totalTime;
      
      this.logger.info(`Renderização incremental concluída em ${totalTime}ms (${chunks.length} chunks)`);
      
      // Emitir evento de conclusão
      this.emit('render-complete', {
        templateSize: templateContent.length,
        chunks: chunks.length,
        renderTime: totalTime,
        memoryPeak: this.stats.memoryPeak
      });
    } catch (error) {
      this.logger.error(`Erro na renderização incremental: ${error.message}`);
      
      // Emitir evento de erro
      this.emit('render-error', {
        message: error.message,
        stack: error.stack
      });
      
      throw error;
    } finally {
      // Parar monitoramento de memória
      this._stopMemoryMonitoring();
      
      // Limpar recursos
      this._clearResources();
    }
  }

  /**
   * Divide um template em chunks usando a estratégia selecionada
   * @param {string} templateContent - Conteúdo do template
   * @param {Object} options - Opções de chunking
   * @returns {Promise<Array<string>>} Array de chunks
   * @private
   */
  async _chunkifyTemplate(templateContent, options) {
    // Se for um template pequeno, retornar como um único chunk
    if (templateContent.length < options.chunkSize * 1024) {
      return [templateContent];
    }
    
    this.logger.debug(`Dividindo template usando estratégia '${options.chunkStrategy}'`);
    
    switch (options.chunkStrategy) {
      case 'dom':
        return this._chunkifyByDOM(templateContent, options);
      case 'section':
        return this._chunkifyBySections(templateContent, options);
      case 'node':
        return this._chunkifyByNodes(templateContent, options);
      case 'custom':
        if (typeof options.customChunker === 'function') {
          return options.customChunker(templateContent, options);
        }
        this.logger.warn('Estratégia custom selecionada, mas função customChunker não fornecida');
        // Fallback para chunking por tamanho
      default:
        return this._chunkifyBySize(templateContent, options);
    }
  }

  /**
   * Divide o template em chunks por análise DOM
   * @param {string} templateContent - Conteúdo do template
   * @param {Object} options - Opções de chunking
   * @returns {Promise<Array<string>>} Array de chunks
   * @private
   */
  async _chunkifyByDOM(templateContent, options) {
    try {
      return await this.memoryOptimizer.optimizedDOMProcessing(async () => {
        const { JSDOM } = require('jsdom');
        const dom = new JSDOM(templateContent);
        const { document } = dom.window;
        
        // Identificar pontos naturais de quebra (seções, divs, headers, etc)
        const breakpoints = [
          ...document.querySelectorAll('body > *, main > *, .container > *')
        ].filter(el => {
          // Filtrar elementos que são pontos naturais de quebra
          const tagName = el.tagName.toLowerCase();
          return ['div', 'section', 'article', 'header', 'footer', 'nav', 'aside', 'main'].includes(tagName);
        });
        
        if (breakpoints.length < 2) {
          this.logger.debug('Poucos breakpoints naturais encontrados, usando divisão por tamanho');
          return this._chunkifyBySize(templateContent, options);
        }
        
        // Coletar chunks
        const chunks = [];
        let currentChunk = document.createDocumentFragment();
        let currentSize = 0;
        const targetSize = options.chunkSize * 1024;
        const fullHTML = document.documentElement.outerHTML;
        
        // Capturar o DOCTYPE e o HTML inicial
        const doctype = templateContent.includes('<!DOCTYPE') 
          ? templateContent.substring(0, templateContent.indexOf('>') + 1) 
          : '';
        
        const headContent = document.head ? document.head.outerHTML : '';
        const bodyStart = '<body' + (document.body.getAttribute('class') ? ` class="${document.body.getAttribute('class')}"` : '') + '>';
        const bodyEnd = '</body>';
        
        // Adicionar preâmbulo ao primeiro chunk
        let preambulo = `${doctype}<html><head>${headContent}</head>${bodyStart}`;
        let isFirstChunk = true;
        
        // Processar cada ponto de quebra
        for (const el of breakpoints) {
          const elSize = el.outerHTML.length;
          
          // Se adicionar este elemento exceder o tamanho alvo, finalizar o chunk atual
          if (currentSize + elSize > targetSize && currentSize > 0) {
            // Finalizar chunk atual
            const chunkHTML = isFirstChunk 
              ? preambulo + Array.from(currentChunk.childNodes).map(n => n.outerHTML || '').join('') 
              : Array.from(currentChunk.childNodes).map(n => n.outerHTML || '').join('');
            
            chunks.push(chunkHTML);
            
            // Iniciar novo chunk
            currentChunk = document.createDocumentFragment();
            currentSize = 0;
            isFirstChunk = false;
          }
          
          // Adicionar elemento ao chunk atual
          currentChunk.appendChild(el.cloneNode(true));
          currentSize += elSize;
        }
        
        // Finalizar último chunk
        if (currentSize > 0) {
          const chunkHTML = isFirstChunk 
            ? preambulo + Array.from(currentChunk.childNodes).map(n => n.outerHTML || '').join('') + bodyEnd + '</html>'
            : Array.from(currentChunk.childNodes).map(n => n.outerHTML || '').join('') + bodyEnd + '</html>';
          
          chunks.push(chunkHTML);
        }
        
        // Verificar se temos pelo menos um chunk
        if (chunks.length === 0) {
          this.logger.warn('Falha ao dividir por DOM, usando divisão por tamanho');
          return this._chunkifyBySize(templateContent, options);
        }
        
        // Ajustar chunks para garantir que todos (exceto o primeiro) tenham o fechamento apropriado
        for (let i = 1; i < chunks.length - 1; i++) {
          chunks[i] = preambulo + chunks[i];
        }
        
        this.logger.debug(`Template dividido em ${chunks.length} chunks usando DOM`);
        
        return chunks;
      });
    } catch (error) {
      this.logger.error(`Erro ao dividir por DOM: ${error.message}`);
      this.logger.debug('Falling back para divisão por tamanho');
      return this._chunkifyBySize(templateContent, options);
    }
  }

  /**
   * Divide o template em chunks por seções
   * @param {string} templateContent - Conteúdo do template
   * @param {Object} options - Opções de chunking
   * @returns {Promise<Array<string>>} Array de chunks
   * @private
   */
  async _chunkifyBySections(templateContent, options) {
    try {
      // Expressão regular para identificar seções (elementos de nível superior)
      // Procura por tags HTML principais como section, article, div, header, footer, etc.
      const sectionRegex = /<(section|article|div|header|footer|nav|aside|main)([^>]*)>/gi;
      
      // Identificar início do body
      const bodyStartIndex = templateContent.indexOf('<body');
      if (bodyStartIndex === -1) {
        throw new Error('Tag body não encontrada no template');
      }
      
      const bodyEndIndex = templateContent.lastIndexOf('</body>');
      if (bodyEndIndex === -1) {
        throw new Error('Tag de fechamento body não encontrada no template');
      }
      
      // Extrair cabeçalho (tudo antes de body)
      const header = templateContent.substring(0, bodyStartIndex + templateContent.substring(bodyStartIndex).indexOf('>') + 1);
      
      // Extrair corpo (conteúdo dentro de body)
      const bodyContent = templateContent.substring(
        bodyStartIndex + templateContent.substring(bodyStartIndex).indexOf('>') + 1,
        bodyEndIndex
      );
      
      // Extrair rodapé (tudo depois de body)
      const footer = templateContent.substring(bodyEndIndex);
      
      // Encontrar todas as correspondências da expressão regular
      const matches = [...bodyContent.matchAll(sectionRegex)];
      
      if (matches.length === 0) {
        this.logger.debug('Nenhuma seção encontrada, usando divisão por tamanho');
        return this._chunkifyBySize(templateContent, options);
      }
      
      // Preparar índices de seções
      const sectionIndices = matches.map(match => match.index);
      
      // Adicionar o início e fim como pontos de corte
      sectionIndices.unshift(0);
      sectionIndices.push(bodyContent.length);
      
      // Criar chunks baseados no tamanho alvo
      const chunks = [];
      let currentChunk = header;
      let currentSize = 0;
      const targetSize = options.chunkSize * 1024;
      
      for (let i = 1; i < sectionIndices.length; i++) {
        const sectionStart = sectionIndices[i - 1];
        const sectionEnd = sectionIndices[i];
        const section = bodyContent.substring(sectionStart, sectionEnd);
        const sectionSize = section.length;
        
        // Se adicionar esta seção exceder o tamanho alvo, finalizar o chunk atual
        if (currentSize + sectionSize > targetSize && currentSize > 0) {
          // Finalizar chunk atual
          chunks.push(currentChunk + '</body></html>');
          
          // Iniciar novo chunk
          currentChunk = header;
          currentSize = 0;
        }
        
        // Adicionar seção ao chunk atual
        currentChunk += section;
        currentSize += sectionSize;
      }
      
      // Finalizar último chunk
      if (currentSize > 0) {
        chunks.push(currentChunk + footer);
      }
      
      this.logger.debug(`Template dividido em ${chunks.length} chunks usando seções`);
      
      return chunks;
    } catch (error) {
      this.logger.error(`Erro ao dividir por seções: ${error.message}`);
      return this._chunkifyBySize(templateContent, options);
    }
  }

  /**
   * Divide o template em chunks por tamanho fixo
   * @param {string} templateContent - Conteúdo do template
   * @param {Object} options - Opções de chunking
   * @returns {Promise<Array<string>>} Array de chunks
   * @private
   */
  async _chunkifyBySize(templateContent, options) {
    try {
      // Usar o otimizador de memória para dividir o template
      const chunkSizeBytes = options.chunkSize * 1024;
      
      // Encontrar o início e fim do body
      const bodyStartIndex = templateContent.indexOf('<body');
      const bodyEndIndex = templateContent.lastIndexOf('</body>');
      
      if (bodyStartIndex === -1 || bodyEndIndex === -1) {
        // Template não tem estrutura HTML válida, dividir diretamente
        return this.memoryOptimizer.chunkifyString(templateContent, chunkSizeBytes);
      }
      
      // Extrair cabeçalho (tudo antes de body)
      const bodyTagEndIndex = templateContent.indexOf('>', bodyStartIndex) + 1;
      const header = templateContent.substring(0, bodyTagEndIndex);
      
      // Extrair conteúdo do body
      const bodyContent = templateContent.substring(bodyTagEndIndex, bodyEndIndex);
      
      // Extrair rodapé (body tag final e todo o resto)
      const footer = templateContent.substring(bodyEndIndex);
      
      // Dividir o conteúdo do body em chunks
      const bodyChunks = this.memoryOptimizer.chunkifyString(bodyContent, chunkSizeBytes);
      
      // Adicionar cabeçalho e rodapé aos chunks
      const finalChunks = bodyChunks.map((chunk, index) => {
        if (index === 0 && index === bodyChunks.length - 1) {
          // Se for o único chunk, incluir cabeçalho e rodapé
          return header + chunk + footer;
        } else if (index === 0) {
          // Se for o primeiro chunk, incluir cabeçalho
          return header + chunk + '</body></html>';
        } else if (index === bodyChunks.length - 1) {
          // Se for o último chunk, incluir rodapé
          return header + chunk + footer;
        } else {
          // Chunks intermediários
          return header + chunk + '</body></html>';
        }
      });
      
      this.logger.debug(`Template dividido em ${finalChunks.length} chunks por tamanho`);
      
      return finalChunks;
    } catch (error) {
      this.logger.error(`Erro ao dividir por tamanho: ${error.message}`);
      
      // Último recurso: dividir em um número fixo de partes
      const numChunks = Math.ceil(templateContent.length / (options.chunkSize * 1024));
      const chunkSize = Math.ceil(templateContent.length / numChunks);
      
      const chunks = [];
      for (let i = 0; i < numChunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, templateContent.length);
        chunks.push(templateContent.substring(start, end));
      }
      
      this.logger.debug(`Template dividido em ${chunks.length} chunks (método de fallback)`);
      
      return chunks;
    }
  }

  /**
   * Divide o template em chunks por análise de nodos
   * @param {string} templateContent - Conteúdo do template
   * @param {Object} options - Opções de chunking
   * @returns {Promise<Array<string>>} Array de chunks
   * @private
   */
  async _chunkifyByNodes(templateContent, options) {
    // Este método é mais complexo e requer análise profunda do DOM
    // Para implementação inicial, vamos delegar ao DOM chunking
    return this._chunkifyByDOM(templateContent, options);
  }

  /**
   * Processa chunks em paralelo com limitação de concorrência
   * @param {Array<string>} chunks - Array de chunks a processar
   * @param {Object} data - Dados para renderização
   * @param {Function} outputProcessor - Função para processar saída
   * @param {Object} options - Opções de processamento
   * @returns {Promise<string>} Resultado final do processamento
   * @private
   */
  async _processChunksInParallel(chunks, data, outputProcessor, options) {
    this.logger.debug(`Processando ${chunks.length} chunks em paralelo (máx: ${this.options.maxWorkers} workers)`);
    
    // Função para processar um único chunk
    const processChunk = async (chunk, index) => {
      try {
        const chunkStartTime = Date.now();
        
        // Renderizar o chunk
        const renderedChunk = await this.renderer.render(chunk, {
          ...data,
          _chunkContext: {
            chunkIndex: index,
            totalChunks: chunks.length,
            isFirstChunk: index === 0,
            isLastChunk: index === chunks.length - 1
          }
        });
        
        const chunkRenderTime = Date.now() - chunkStartTime;
        
        // Atualizar estatísticas
        this.stats.processedChunks++;
        
        // Emitir evento de progresso
        this.emit('render-progress', {
          chunk: index + 1,
          total: chunks.length,
          percent: Math.round(((index + 1) / chunks.length) * 100),
          renderTime: chunkRenderTime
        });
        
        // Processar saída do chunk
        return outputProcessor(renderedChunk, {
          index,
          total: chunks.length,
          isFirst: index === 0,
          isLast: index === chunks.length - 1,
          renderTime: chunkRenderTime
        });
      } catch (error) {
        this.logger.error(`Erro ao processar chunk ${index + 1}: ${error.message}`);
        
        // Emitir evento de erro
        this.emit('chunk-error', {
          chunk: index + 1,
          total: chunks.length,
          error: error.message
        });
        
        // Retornar um placeholder em caso de erro
        return outputProcessor(`<!-- Erro na renderização do chunk ${index + 1} -->`, {
          index,
          total: chunks.length,
          isFirst: index === 0,
          isLast: index === chunks.length - 1,
          error: true
        });
      }
    };
    
    // Processar chunks com limitação de concorrência
    const CONCURRENT_CHUNKS = Math.min(this.options.maxWorkers, chunks.length);
    let activePromises = 0;
    let nextChunkIndex = 0;
    let result = '';
    
    const processNext = async () => {
      if (nextChunkIndex >= chunks.length) return;
      
      const currentIndex = nextChunkIndex++;
      activePromises++;
      
      try {
        result = await processChunk(chunks[currentIndex], currentIndex);
      } finally {
        activePromises--;
        // Processar próximo chunk
        if (nextChunkIndex < chunks.length) {
          await processNext();
        }
      }
    };
    
    // Iniciar processamento paralelo inicial
    const initialPromises = [];
    for (let i = 0; i < CONCURRENT_CHUNKS; i++) {
      initialPromises.push(processNext());
    }
    
    // Aguardar conclusão de todos os chunks
    await Promise.all(initialPromises);
    
    // Retornar resultado final
    return result;
  }

  /**
   * Processa chunks sequencialmente
   * @param {Array<string>} chunks - Array de chunks a processar
   * @param {Object} data - Dados para renderização
   * @param {Function} outputProcessor - Função para processar saída
   * @param {Object} options - Opções de processamento
   * @returns {Promise<string>} Resultado final do processamento
   * @private
   */
  async _processChunksSequentially(chunks, data, outputProcessor, options) {
    this.logger.debug(`Processando ${chunks.length} chunks sequencialmente`);
    
    let result = '';
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const chunkStartTime = Date.now();
      
      try {
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
        
        const chunkRenderTime = Date.now() - chunkStartTime;
        
        // Atualizar estatísticas
        this.stats.processedChunks++;
        
        // Emitir evento de progresso
        this.emit('render-progress', {
          chunk: i + 1,
          total: chunks.length,
          percent: Math.round(((i + 1) / chunks.length) * 100),
          renderTime: chunkRenderTime
        });
        
        // Processar saída do chunk
        result = outputProcessor(renderedChunk, {
          index: i,
          total: chunks.length,
          isFirst: i === 0,
          isLast: i === chunks.length - 1,
          renderTime: chunkRenderTime
        });
        
        // Forçar garbage collection a cada 5 chunks ou para chunks grandes
        if (typeof global.gc === 'function' && (i % 5 === 0 || chunk.length > 1000000)) {
          global.gc();
        }
      } catch (error) {
        this.logger.error(`Erro ao processar chunk ${i + 1}: ${error.message}`);
        
        // Emitir evento de erro
        this.emit('chunk-error', {
          chunk: i + 1,
          total: chunks.length,
          error: error.message
        });
        
        // Processar um erro para este chunk
        result = outputProcessor(`<!-- Erro na renderização do chunk ${i + 1} -->`, {
          index: i,
          total: chunks.length,
          isFirst: i === 0,
          isLast: i === chunks.length - 1,
          error: true
        });
      }
    }
    
    return result;
  }

  /**
   * Adiciona um chunk ao buffer de streaming
   * @param {string} html - HTML do chunk
   * @param {Object} chunkInfo - Informações do chunk
   * @private
   */
  _addToBuffer(html, chunkInfo) {
    this.buffer.chunks.push({
      html,
      info: chunkInfo
    });
    
    this.buffer.size += html.length / 1024; // KB
    
    // Verificar se o buffer deve ser esvaziado
    if (this.buffer.size > this.options.bufferSize) {
      this._flushBuffer(false);
    }
  }

  /**
   * Esvazia o buffer de streaming
   * @param {boolean} clearAll - Se deve limpar o buffer completamente
   * @returns {string} HTML atual
   * @private
   */
  _flushBuffer(clearAll) {
    const html = this.buffer.chunks.map(chunk => chunk.html).join('');
    
    // Emitir evento de buffer
    this.emit('buffer-flush', {
      size: this.buffer.size,
      chunks: this.buffer.chunks.length
    });
    
    // Limpar buffer
    this.buffer.chunks = [];
    this.buffer.size = 0;
    this.buffer.flushed++;
    
    return html;
  }

  /**
   * Gera a base HTML para o modo de saída em chunks
   * @param {string} template - Template original
   * @returns {string} HTML base
   * @private
   */
  _generateHtmlBase(template) {
    // Extrair DOCTYPE, html, head e início do body
    const doctype = template.includes('<!DOCTYPE') 
      ? template.substring(0, template.indexOf('>') + 1) 
      : '<!DOCTYPE html>';
    
    // Extrair ou criar head
    let head = '';
    const headStart = template.indexOf('<head');
    const headEnd = template.indexOf('</head>');
    
    if (headStart !== -1 && headEnd !== -1) {
      head = template.substring(headStart, headEnd + 7);
    } else {
      head = '<head><title>Documento Renderizado</title></head>';
    }
    
    // Extrair atributos do body
    let bodyAttrs = '';
    const bodyStart = template.indexOf('<body');
    
    if (bodyStart !== -1) {
      const bodyTagEnd = template.indexOf('>', bodyStart);
      const bodyTag = template.substring(bodyStart, bodyTagEnd + 1);
      const attrsMatch = bodyTag.match(/<body([^>]*)>/);
      
      if (attrsMatch && attrsMatch[1]) {
        bodyAttrs = attrsMatch[1];
      }
    }
    
    // Criar HTML base com script para processamento progressivo
    return `${doctype}
<html>
  ${head}
  <body${bodyAttrs}>
    <div id="streaming-content"></div>
    <script>
      // Script para processamento progressivo de chunks
      (function() {
        window.streamingRenderer = {
          chunks: [],
          processedChunks: 0,
          totalChunks: 0,
          
          // Função para processar um novo chunk
          processChunk: function(html, chunkInfo) {
            const contentDiv = document.getElementById('streaming-content');
            
            // Atualizar informações de progresso
            this.processedChunks = chunkInfo.index + 1;
            this.totalChunks = chunkInfo.total;
            
            // Atualizar conteúdo
            if (contentDiv) {
              contentDiv.innerHTML += html;
            }
            
            // Emitir evento de chunk processado
            const event = new CustomEvent('chunk-processed', { detail: chunkInfo });
            document.dispatchEvent(event);
            
            // Se for o último chunk, emitir evento de conclusão
            if (chunkInfo.isLast) {
              const completeEvent = new CustomEvent('rendering-complete');
              document.dispatchEvent(completeEvent);
            }
          }
        };
      })();
    </script>
`;
  }

  /**
   * Finaliza a saída HTML no modo de chunks
   * @param {string} html - HTML atual
   * @returns {string} HTML finalizado
   * @private
   */
  _finalizeChunkedOutput(html) {
    return html + `
    <script>
      // Emitir evento final quando o documento estiver completamente carregado
      document.addEventListener('DOMContentLoaded', function() {
        const completeEvent = new CustomEvent('rendering-complete');
        document.dispatchEvent(completeEvent);
      });
    </script>
  </body>
</html>`;
  }

  /**
   * Limpa recursos utilizados durante a renderização
   * @private
   */
  _clearResources() {
    // Limpar buffer
    this.buffer.chunks = [];
    this.buffer.size = 0;
    
    // Forçar garbage collection se disponível
    if (typeof global.gc === 'function') {
      global.gc();
    }
  }

  /**
   * Verifica se o template é adequado para streaming
   * @param {string} templateContent - Conteúdo do template
   * @returns {boolean} Template é adequado para streaming
   */
  isStreamable(templateContent) {
    // Verificar tamanho do template
    if (templateContent.length < this.options.chunkSize * 1024) {
      return false;
    }
    
    // Verificar se tem estrutura HTML válida
    const hasHtmlStructure = templateContent.includes('<html') && 
                            templateContent.includes('</html>') &&
                            templateContent.includes('<body') && 
                            templateContent.includes('</body>');
    
    // Templates maiores que 5MB são sempre considerados para streaming
    if (templateContent.length > 5 * 1024 * 1024) {
      return true;
    }
    
    // Para templates médios, verificar se têm estrutura HTML apropriada
    return hasHtmlStructure;
  }

  /**
   * Retorna estatísticas de renderização
   * @returns {Object} Estatísticas
   */
  getStats() {
    return { ...this.stats };
  }
}

module.exports = StreamingRenderer;
