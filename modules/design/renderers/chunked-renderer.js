/**
 * Chunked Renderer para PHP Universal MCP Server
 * 
 * Renderizador otimizado para memória que processa templates em chunks,
 * permitindo a renderização de templates extremamente grandes sem
 * esgotar a memória disponível.
 * 
 * @author PHP Universal MCP Server Team
 * @version 1.0.0
 * @license MIT
 */

const EventEmitter = require('events');
const MemoryOptimizer = require('./memory-optimizer');
const ProgressiveRenderer = require('./progressive-renderer');
const path = require('path');
const os = require('os');

/**
 * Renderizador que processa templates em chunks, otimizando o uso de memória
 */
class ChunkedRenderer extends EventEmitter {
  /**
   * Construtor do renderizador de chunks
   * @param {Object} options - Opções de configuração
   */
  constructor(options = {}) {
    super();
    
    this.options = {
      // Tamanho máximo de cada chunk (em KB)
      chunkSize: 1000,
      
      // Diretório temporário para armazenamento de chunks (null = usar sistema operacional)
      tempDir: null,
      
      // Habilitar otimização de memória
      memoryOptimization: true,
      
      // Limite de memória (em MB) para ativar otimizações agressivas
      memoryLimit: 300,
      
      // Habilitar modo de depuração
      debug: false,
      
      // Usar sistema de arquivos para processamento extremamente grandes
      useFileSystem: false,
      
      // Limpar arquivos temporários após processamento
      cleanTempFiles: true,
      
      // Usar DOM para análise (se false, usa regex para processamento mais leve)
      useDOMAnalysis: true,
      
      // Prefixo para arquivos temporários
      tempFilePrefix: 'chunk-',
      
      // Número máximo de tentativas para renderização de chunk
      maxRetries: 3,
      
      ...options
    };
    
    // Inicializar renderizador para processar chunks
    this.renderer = new ProgressiveRenderer({
      priorityLevels: 3,
      initialRenderTimeout: 200,
      componentAnalysisEnabled: true,
      skeletonLoading: false,
      feedbackEnabled: false
    });
    
    // Inicializar otimizador de memória
    this.memoryOptimizer = new MemoryOptimizer({
      chunkSize: this.options.chunkSize,
      memoryThreshold: this.options.memoryLimit,
      debug: this.options.debug
    });
    
    // Diretório temporário para arquivos de chunk
    this.tempDir = this.options.tempDir || os.tmpdir();
    
    // Estatísticas de rendeirização
    this.stats = {
      templateSize: 0,
      chunks: 0,
      processedChunks: 0,
      failedChunks: 0,
      totalTime: 0,
      chunkTimes: [],
      maxMemoryUsage: 0,
      averageMemoryUsage: 0
    };
    
    // Sistema de logging
    this.logger = {
      debug: (...args) => this.options.debug && console.log('[ChunkedRenderer:DEBUG]', ...args),
      info: (...args) => console.log('[ChunkedRenderer:INFO]', ...args),
      warn: (...args) => console.warn('[ChunkedRenderer:WARN]', ...args),
      error: (...args) => console.error('[ChunkedRenderer:ERROR]', ...args)
    };
    
    this.logger.info('ChunkedRenderer inicializado com sucesso');
  }

  /**
   * Renderiza um template em chunks para otimizar o uso de memória
   * @param {string} templateContent - Conteúdo do template
   * @param {Object} data - Dados para renderização
   * @param {Object} options - Opções adicionais
   * @returns {Promise<string>} HTML renderizado
   */
  async render(templateContent, data = {}, options = {}) {
    const startTime = Date.now();
    const mergedOptions = { ...this.options, ...options };
    
    // Preparar estatísticas
    this.stats = {
      templateSize: templateContent.length / 1024, // KB
      chunks: 0,
      processedChunks: 0,
      failedChunks: 0,
      totalTime: 0,
      chunkTimes: [],
      maxMemoryUsage: 0,
      memoryReadings: []
    };
    
    // Iniciar monitoramento de memória se modo debug ativado
    let memoryMonitorInterval;
    if (mergedOptions.debug) {
      memoryMonitorInterval = setInterval(() => {
        const memUsage = process.memoryUsage().heapUsed / 1024 / 1024; // MB
        this.stats.maxMemoryUsage = Math.max(this.stats.maxMemoryUsage, memUsage);
        this.stats.memoryReadings.push(memUsage);
      }, 1000);
    }
    
    try {
      this.logger.info(`Iniciando renderização de template (${(templateContent.length / 1024).toFixed(2)}KB)`);
      
      // Determinar estratégia de renderização baseada no tamanho do template
      const isExtremelyLarge = templateContent.length > 5 * 1024 * 1024; // > 5MB
      
      // Se for extremamente grande e file system estiver habilitado, usar filesystem
      if (isExtremelyLarge && mergedOptions.useFileSystem) {
        this.logger.info('Template extremamente grande detectado - usando filesystem');
        return await this._renderWithFileSystem(templateContent, data, mergedOptions);
      }
      
      // Dividir o template em chunks
      this.logger.debug('Dividindo template em chunks');
      const chunks = await this._chunkifyTemplate(templateContent, mergedOptions);
      this.stats.chunks = chunks.length;
      
      // Emitir evento de início com informações
      this.emit('render-start', {
        templateSize: templateContent.length,
        chunks: chunks.length,
        chunkSize: mergedOptions.chunkSize
      });
      
      this.logger.info(`Template dividido em ${chunks.length} chunks`);
      
      // Renderizar cada chunk
      let result = '';
      
      for (let i = 0; i < chunks.length; i++) {
        const chunkStartTime = Date.now();
        const chunk = chunks[i];
        
        try {
          this.logger.debug(`Renderizando chunk ${i + 1}/${chunks.length} (${(chunk.length / 1024).toFixed(2)}KB)`);
          
          // Renderizar o chunk com retry em caso de falha
          let renderedChunk = null;
          let retries = 0;
          
          while (renderedChunk === null && retries < mergedOptions.maxRetries) {
            try {
              renderedChunk = await this.renderer.render(chunk, {
                ...data,
                _chunkContext: {
                  chunkIndex: i,
                  totalChunks: chunks.length,
                  isFirstChunk: i === 0,
                  isLastChunk: i === chunks.length - 1
                }
              });
            } catch (chunkError) {
              retries++;
              this.logger.warn(`Erro ao renderizar chunk ${i + 1}, tentativa ${retries}: ${chunkError.message}`);
              
              if (retries >= mergedOptions.maxRetries) {
                throw chunkError;
              }
              
              // Forçar garbage collection se disponível
              if (typeof global.gc === 'function') {
                global.gc();
              }
              
              // Esperar antes de tentar novamente
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }
          
          // Adicionar ao resultado
          result += renderedChunk;
          
          const chunkTime = Date.now() - chunkStartTime;
          this.stats.chunkTimes.push(chunkTime);
          this.stats.processedChunks++;
          
          // Emitir evento de progresso
          this.emit('render-progress', {
            chunk: i + 1,
            total: chunks.length,
            progress: Math.round(((i + 1) / chunks.length) * 100),
            time: chunkTime
          });
          
          this.logger.debug(`Chunk ${i + 1} renderizado em ${chunkTime}ms`);
          
          // Forçar garbage collection após cada chunk se disponível
          if (typeof global.gc === 'function') {
            global.gc();
          }
        } catch (error) {
          this.stats.failedChunks++;
          this.logger.error(`Erro ao renderizar chunk ${i + 1}: ${error.message}`);
          
          // Emitir evento de erro
          this.emit('chunk-error', {
            chunk: i + 1,
            total: chunks.length,
            error: error.message
          });
          
          // Adicionar mensagem de erro como placeholder
          result += `<!-- Erro ao renderizar chunk ${i + 1} -->\n`;
          
          // Continuar com próximo chunk
          continue;
        }
      }
      
      // Finalizar estatísticas
      this.stats.totalTime = Date.now() - startTime;
      
      if (this.stats.memoryReadings && this.stats.memoryReadings.length > 0) {
        this.stats.averageMemoryUsage = this.stats.memoryReadings.reduce((a, b) => a + b, 0) / this.stats.memoryReadings.length;
      }
      
      this.logger.info(`Renderização concluída em ${this.stats.totalTime}ms (${chunks.length} chunks, ${this.stats.failedChunks} falhas)`);
      
      // Emitir evento de conclusão
      this.emit('render-complete', {
        totalTime: this.stats.totalTime,
        processedChunks: this.stats.processedChunks,
        failedChunks: this.stats.failedChunks,
        maxMemoryUsage: this.stats.maxMemoryUsage
      });
      
      return result;
    } catch (error) {
      this.logger.error(`Erro durante renderização: ${error.message}`);
      
      // Emitir evento de erro
      this.emit('render-error', {
        message: error.message,
        stack: error.stack
      });
      
      throw error;
    } finally {
      // Parar monitoramento de memória
      if (memoryMonitorInterval) {
        clearInterval(memoryMonitorInterval);
      }
      
      // Limpar recursos
      this._cleanupResources();
    }
  }

  /**
   * Renderiza por etapas com callback para cada chunk renderizado
   * @param {string} templateContent - Conteúdo do template
   * @param {Object} data - Dados para renderização
   * @param {Function} chunkCallback - Callback para cada chunk renderizado (html, index, total)
   * @param {Object} options - Opções adicionais
   * @returns {Promise<void>}
   */
  async renderWithCallback(templateContent, data = {}, chunkCallback, options = {}) {
    if (!chunkCallback || typeof chunkCallback !== 'function') {
      throw new Error('É necessário fornecer um callback para processar os chunks');
    }
    
    const startTime = Date.now();
    const mergedOptions = { ...this.options, ...options };
    
    try {
      this.logger.info(`Iniciando renderização por etapas (${(templateContent.length / 1024).toFixed(2)}KB)`);
      
      // Dividir o template em chunks
      const chunks = await this._chunkifyTemplate(templateContent, mergedOptions);
      this.stats.chunks = chunks.length;
      
      // Emitir evento de início
      this.emit('render-start', {
        templateSize: templateContent.length,
        chunks: chunks.length
      });
      
      // Processar cada chunk
      for (let i = 0; i < chunks.length; i++) {
        const chunkStartTime = Date.now();
        const chunk = chunks[i];
        
        try {
          this.logger.debug(`Renderizando chunk ${i + 1}/${chunks.length}`);
          
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
          
          const chunkTime = Date.now() - chunkStartTime;
          this.stats.chunkTimes.push(chunkTime);
          this.stats.processedChunks++;
          
          // Chamar o callback com o chunk renderizado
          chunkCallback(renderedChunk, i, chunks.length, {
            time: chunkTime,
            isFirstChunk: i === 0,
            isLastChunk: i === chunks.length - 1,
            progress: Math.round(((i + 1) / chunks.length) * 100)
          });
          
          // Emitir evento de progresso
          this.emit('render-progress', {
            chunk: i + 1,
            total: chunks.length,
            progress: Math.round(((i + 1) / chunks.length) * 100),
            time: chunkTime
          });
          
          // Forçar garbage collection se disponível
          if (typeof global.gc === 'function') {
            global.gc();
          }
        } catch (error) {
          this.stats.failedChunks++;
          this.logger.error(`Erro ao renderizar chunk ${i + 1}: ${error.message}`);
          
          // Emitir evento de erro
          this.emit('chunk-error', {
            chunk: i + 1,
            total: chunks.length,
            error: error.message
          });
          
          // Chamar callback com erro
          chunkCallback(
            `<!-- Erro ao renderizar chunk ${i + 1} -->\n`,
            i,
            chunks.length,
            {
              error: true,
              errorMessage: error.message,
              progress: Math.round(((i + 1) / chunks.length) * 100)
            }
          );
        }
      }
      
      // Finalizar estatísticas
      this.stats.totalTime = Date.now() - startTime;
      
      this.logger.info(`Renderização por etapas concluída em ${this.stats.totalTime}ms`);
      
      // Emitir evento de conclusão
      this.emit('render-complete', {
        totalTime: this.stats.totalTime,
        processedChunks: this.stats.processedChunks,
        failedChunks: this.stats.failedChunks
      });
    } catch (error) {
      this.logger.error(`Erro durante renderização por etapas: ${error.message}`);
      
      // Emitir evento de erro
      this.emit('render-error', {
        message: error.message,
        stack: error.stack
      });
      
      throw error;
    } finally {
      // Limpar recursos
      this._cleanupResources();
    }
  }

  /**
   * Divide o template em chunks para processamento
   * @param {string} templateContent - Conteúdo do template
   * @param {Object} options - Opções de chunking
   * @returns {Promise<Array<string>>} Array de chunks
   * @private
   */
  async _chunkifyTemplate(templateContent, options) {
    try {
      // Para templates pequenos, retornar como um único chunk
      if (templateContent.length < options.chunkSize * 1024) {
        return [templateContent];
      }
      
      // Usar DOM para dividir o template se habilitado e o template não for enorme
      if (options.useDOMAnalysis && templateContent.length < 10 * 1024 * 1024) {
        try {
          const domChunks = await this._chunkifyUsingDOM(templateContent, options);
          if (domChunks.length > 1) {
            return domChunks;
          }
        } catch (domError) {
          this.logger.warn(`Falha ao dividir usando DOM: ${domError.message}. Usando método alternativo.`);
        }
      }
      
      // Se DOM falhar ou não estiver habilitado, dividir por seções ou smart split
      const hasHTML = templateContent.includes('<html') && templateContent.includes('</html>');
      const hasBody = templateContent.includes('<body') && templateContent.includes('</body>');
      
      if (hasHTML && hasBody) {
        // Dividir por estrutura HTML
        return await this._chunkifyByHTMLStructure(templateContent, options);
      } else {
        // Usar chunkify padrão do memory optimizer
        return this.memoryOptimizer.chunkifyString(templateContent, options.chunkSize * 1024);
      }
    } catch (error) {
      this.logger.error(`Erro ao chunkificar template: ${error.message}`);
      
      // Método de fallback: dividir em tamanhos iguais
      const chunkSizeBytes = options.chunkSize * 1024;
      const chunks = [];
      
      for (let i = 0; i < templateContent.length; i += chunkSizeBytes) {
        chunks.push(templateContent.substring(i, i + chunkSizeBytes));
      }
      
      return chunks;
    }
  }

  /**
   * Divide o template usando análise DOM
   * @param {string} templateContent - Conteúdo do template
   * @param {Object} options - Opções de chunking
   * @returns {Promise<Array<string>>} Array de chunks
   * @private
   */
  async _chunkifyUsingDOM(templateContent, options) {
    // Esta implementação requer JSDOM
    const { JSDOM } = require('jsdom');
    
    // Usar o otimizador de memória para análise segura do DOM
    return await this.memoryOptimizer.optimizedDOMProcessing(async () => {
      const dom = new JSDOM(templateContent);
      const { document } = dom.window;
      
      // Extrair partes importantes do documento
      const { doctype } = dom;
      const html = document.documentElement;
      const head = document.head;
      const body = document.body;
      
      if (!body) {
        throw new Error('DOM analysis failed: no body element found');
      }
      
      // Obter elementos de nível superior como pontos de quebra naturais
      const topLevelNodes = Array.from(body.children);
      
      if (topLevelNodes.length < 2) {
        throw new Error('Não há elementos suficientes para dividir em chunks');
      }
      
      // Calcular quantos elementos por chunk, com base no tamanho alvo
      const targetChunkSize = options.chunkSize * 1024;
      const avgNodeSize = templateContent.length / topLevelNodes.length;
      const nodesPerChunk = Math.max(1, Math.floor(targetChunkSize / avgNodeSize));
      
      // Dividir em chunks
      const nodeChunks = [];
      for (let i = 0; i < topLevelNodes.length; i += nodesPerChunk) {
        nodeChunks.push(topLevelNodes.slice(i, i + nodesPerChunk));
      }
      
      // Criar HTML para cada chunk
      const doctypeStr = doctype ? `<!DOCTYPE ${doctype.name}${doctype.publicId ? ` PUBLIC "${doctype.publicId}"` : ''}${doctype.systemId ? ` "${doctype.systemId}"` : ''}>` : '';
      const headContent = head ? head.outerHTML : '<head></head>';
      
      return nodeChunks.map((nodes, index) => {
        // Criar clone do body
        const tempBody = body.cloneNode(false);
        
        // Adicionar nós deste chunk
        nodes.forEach(node => tempBody.appendChild(node.cloneNode(true)));
        
        // Construir HTML completo para o chunk
        return `${doctypeStr}<html>${headContent}${tempBody.outerHTML}</html>`;
      });
    });
  }

  /**
   * Divide o template baseado na estrutura HTML
   * @param {string} templateContent - Conteúdo do template
   * @param {Object} options - Opções de chunking
   * @returns {Promise<Array<string>>} Array de chunks
   * @private
   */
  async _chunkifyByHTMLStructure(templateContent, options) {
    try {
      // Extrair DOCTYPE, html, head e atributos body
      let doctype = '';
      const doctypeMatch = templateContent.match(/<!DOCTYPE[^>]*>/i);
      if (doctypeMatch) {
        doctype = doctypeMatch[0];
      }
      
      // Extrair head
      let head = '';
      const headMatch = templateContent.match(/<head[^>]*>[\s\S]*?<\/head>/i);
      if (headMatch) {
        head = headMatch[0];
      }
      
      // Extrair body e seus atributos
      let bodyTag = '<body>';
      let bodyEndTag = '</body>';
      const bodyStartMatch = templateContent.match(/<body[^>]*>/i);
      if (bodyStartMatch) {
        bodyTag = bodyStartMatch[0];
      }
      
      // Extrair conteúdo do body
      let bodyContent = '';
      const bodyMatch = templateContent.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      if (bodyMatch && bodyMatch[1]) {
        bodyContent = bodyMatch[1];
      } else {
        throw new Error('Não foi possível extrair o conteúdo do body');
      }
      
      // Dividir o conteúdo do body em seções
      // Procurar por tags que naturalmente dividem o conteúdo: section, article, div (grandes)
      const sectionRegex = /<(section|article|div|header|footer|nav|aside|main)[^>]*>[\s\S]*?<\/(section|article|div|header|footer|nav|aside|main)>/gi;
      
      let sections = [];
      let lastIndex = 0;
      let match;
      
      // Extrair seções usando regex
      while ((match = sectionRegex.exec(bodyContent)) !== null) {
        // Verificar se esta seção não está dentro de outra já extraída
        let isNested = false;
        for (const section of sections) {
          if (match.index > section.start && match.index + match[0].length < section.start + section.content.length) {
            isNested = true;
            break;
          }
        }
        
        if (!isNested) {
          sections.push({
            content: match[0],
            start: match.index,
            end: match.index + match[0].length,
            size: match[0].length
          });
          lastIndex = Math.max(lastIndex, match.index + match[0].length);
        }
      }
      
      // Verificar se extraímos seções suficientes
      if (sections.length < 2) {
        // Não encontrou seções suficientes, tentar outro método
        return this._chunkifyBySize(templateContent, options);
      }
      
      // Agrupar seções em chunks de tamanho apropriado
      const chunks = [];
      let currentChunk = '';
      let currentSize = 0;
      const targetSize = options.chunkSize * 1024;
      
      // Ordenar seções por posição
      sections.sort((a, b) => a.start - b.start);
      
      // Criar HTML base
      const htmlPrefix = `${doctype}<html>${head}${bodyTag}`;
      const htmlSuffix = `${bodyEndTag}</html>`;
      
      // Agrupar seções em chunks
      for (const section of sections) {
        if (currentSize + section.size > targetSize && currentSize > 0) {
          // Finalizar chunk atual
          chunks.push(htmlPrefix + currentChunk + htmlSuffix);
          currentChunk = '';
          currentSize = 0;
        }
        
        // Adicionar seção ao chunk atual
        currentChunk += section.content;
        currentSize += section.size;
      }
      
      // Finalizar último chunk se necessário
      if (currentSize > 0) {
        chunks.push(htmlPrefix + currentChunk + htmlSuffix);
      }
      
      return chunks;
    } catch (error) {
      this.logger.error(`Erro ao dividir por estrutura HTML: ${error.message}`);
      return this._chunkifyBySize(templateContent, options);
    }
  }

  /**
   * Divide o template em chunks de tamanho fixo
   * @param {string} templateContent - Conteúdo do template
   * @param {Object} options - Opções de chunking
   * @returns {Promise<Array<string>>} Array de chunks
   * @private
   */
  async _chunkifyBySize(templateContent, options) {
    const chunkSizeBytes = options.chunkSize * 1024;
    
    // Verificar se o template possui estrutura HTML
    const hasHTML = templateContent.includes('<html') && templateContent.includes('</html>');
    
    if (!hasHTML) {
      // Se não for HTML, dividir diretamente
      return this.memoryOptimizer.chunkifyString(templateContent, chunkSizeBytes);
    }
    
    // Extrair cabeçalho e rodapé
    let header = '';
    let footer = '';
    
    const headMatch = templateContent.match(/^[\s\S]*<body[^>]*>/i);
    if (headMatch) {
      header = headMatch[0];
    }
    
    const footerMatch = templateContent.match(/<\/body>[\s\S]*$/i);
    if (footerMatch) {
      footer = footerMatch[0];
    }
    
    // Extrair conteúdo do body
    let bodyContent = templateContent;
    if (header && footer) {
      bodyContent = templateContent.substring(
        header.length,
        templateContent.length - footer.length
      );
    }
    
    // Dividir o conteúdo do body
    const bodyChunks = this.memoryOptimizer.chunkifyString(bodyContent, chunkSizeBytes);
    
    // Compor os chunks finais
    return bodyChunks.map((chunk, index) => {
      if (header && footer) {
        return header + chunk + footer;
      } else {
        return chunk;
      }
    });
  }

  /**
   * Renderiza um template extremamente grande usando o sistema de arquivos
   * @param {string} templateContent - Conteúdo do template
   * @param {Object} data - Dados para renderização
   * @param {Object} options - Opções de renderização
   * @returns {Promise<string>} HTML renderizado
   * @private
   */
  async _renderWithFileSystem(templateContent, data, options) {
    const fs = require('fs').promises;
    const os = require('os');
    const path = require('path');
    
    try {
      this.logger.info('Iniciando renderização com filesystem');
      
      // Criar diretório temporário
      const tempDir = path.join(os.tmpdir(), `mcp-render-${Date.now()}`);
      await fs.mkdir(tempDir, { recursive: true });
      
      this.logger.debug(`Diretório temporário criado: ${tempDir}`);
      
      // Dividir template em chunks
      const chunks = await this._chunkifyTemplate(templateContent, options);
      this.stats.chunks = chunks.length;
      
      this.logger.info(`Template dividido em ${chunks.length} chunks`);
      
      // Salvar chunks em arquivos
      const chunkFiles = [];
      
      for (let i = 0; i < chunks.length; i++) {
        const chunkFileName = path.join(tempDir, `${options.tempFilePrefix}${i}.html`);
        await fs.writeFile(chunkFileName, chunks[i], 'utf8');
        chunkFiles.push(chunkFileName);
        
        this.logger.debug(`Chunk ${i + 1} salvo em ${chunkFileName}`);
      }
      
      // Renderizar chunks do filesystem
      let result = '';
      
      for (let i = 0; i < chunkFiles.length; i++) {
        const chunkStartTime = Date.now();
        
        try {
          this.logger.debug(`Renderizando chunk ${i + 1} do arquivo ${chunkFiles[i]}`);
          
          // Ler chunk do arquivo
          const chunkContent = await fs.readFile(chunkFiles[i], 'utf8');
          
          // Renderizar o chunk
          const renderedChunk = await this.renderer.render(chunkContent, {
            ...data,
            _chunkContext: {
              chunkIndex: i,
              totalChunks: chunks.length,
              isFirstChunk: i === 0,
              isLastChunk: i === chunks.length - 1
            }
          });
          
          // Adicionar ao resultado
          result += renderedChunk;
          
          const chunkTime = Date.now() - chunkStartTime;
          this.stats.chunkTimes.push(chunkTime);
          this.stats.processedChunks++;
          
          // Emitir evento de progresso
          this.emit('render-progress', {
            chunk: i + 1,
            total: chunks.length,
            progress: Math.round(((i + 1) / chunks.length) * 100),
            time: chunkTime
          });
          
          this.logger.debug(`Chunk ${i + 1} renderizado em ${chunkTime}ms`);
          
          // Forçar garbage collection se disponível
          if (typeof global.gc === 'function') {
            global.gc();
          }
          
          // Remover arquivo do chunk para economizar espaço
          if (options.cleanTempFiles) {
            await fs.unlink(chunkFiles[i]);
          }
        } catch (error) {
          this.stats.failedChunks++;
          this.logger.error(`Erro ao renderizar chunk ${i + 1}: ${error.message}`);
          
          // Emitir evento de erro
          this.emit('chunk-error', {
            chunk: i + 1,
            total: chunks.length,
            error: error.message
          });
          
          // Adicionar mensagem de erro como placeholder
          result += `<!-- Erro ao renderizar chunk ${i + 1} -->\n`;
        }
      }
      
      // Limpar diretório temporário
      if (options.cleanTempFiles) {
        try {
          await fs.rmdir(tempDir);
          this.logger.debug(`Diretório temporário removido: ${tempDir}`);
        } catch (cleanupError) {
          this.logger.warn(`Erro ao remover diretório temporário: ${cleanupError.message}`);
        }
      }
      
      return result;
    } catch (error) {
      this.logger.error(`Erro na renderização com filesystem: ${error.message}`);
      throw error;
    }
  }

  /**
   * Limpa recursos utilizados durante a renderização
   * @private
   */
  _cleanupResources() {
    // Forçar garbage collection se disponível
    if (typeof global.gc === 'function') {
      global.gc();
    }
  }

  /**
   * Retorna estatísticas da renderização
   * @returns {Object} Estatísticas
   */
  getStats() {
    // Calcular estatísticas adicionais
    if (this.stats.chunkTimes && this.stats.chunkTimes.length > 0) {
      const sum = this.stats.chunkTimes.reduce((a, b) => a + b, 0);
      this.stats.averageChunkTime = sum / this.stats.chunkTimes.length;
      
      this.stats.maxChunkTime = Math.max(...this.stats.chunkTimes);
      this.stats.minChunkTime = Math.min(...this.stats.chunkTimes);
    }
    
    return { ...this.stats };
  }
}

module.exports = ChunkedRenderer;
