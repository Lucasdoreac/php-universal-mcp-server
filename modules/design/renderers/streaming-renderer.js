/**
 * Streaming Renderer para o PHP Universal MCP Server
 * 
 * Renderizador especializado para templates extremamente grandes,
 * implementando técnicas de streaming avançadas e feedback visual
 * em tempo real para o usuário.
 * 
 * @author PHP Universal MCP Server Team
 * @version 1.0.0
 */

const { JSDOM } = require('jsdom');
const EventEmitter = require('events');
const MemoryOptimizer = require('./memory-optimizer');
const logger = require('../../../utils/logger');

/**
 * Renderizador de streaming para templates extremamente grandes
 */
class StreamingRenderer {
  /**
   * Construtor
   * @param {Object} options - Opções de configuração
   */
  constructor(options = {}) {
    this.options = {
      // Tamanho máximo de chunk (em KB)
      chunkSize: 100,
      // Intervalo (em ms) entre chunks
      chunkInterval: 50,
      // Timeout para renderização (ms)
      renderTimeout: 60000,
      // Número máximo de elementos por chunk
      maxElementsPerChunk: 200,
      // Feedback visual para o usuário
      visualFeedback: true,
      // Tamanho de buffer para elementos HTML (em KB)
      bufferSize: 512,
      // Log detalhado
      debug: false,
      // Monitoramento de memória
      memoryMonitoring: true,
      // Limite de memória antes de forçar GC (MB)
      memoryLimit: 500,
      // Priorização inteligente
      prioritization: true,
      // CSS de estilo para skeleton loading
      skeletonCSS: true,
      ...options
    };

    // Inicializar otimizador de memória
    this.memoryOptimizer = new MemoryOptimizer({
      chunkSize: this.options.chunkSize,
      memoryThreshold: this.options.memoryLimit,
      debug: this.options.debug
    });

    // Sistema de eventos
    this.events = new EventEmitter();

    // Métricas
    this.metrics = {
      totalChunks: 0,
      renderedChunks: 0,
      totalElements: 0,
      elementsPerChunk: [],
      chunkSizes: [],
      renderTimes: [],
      memoryUsage: [],
      streamingTime: 0,
      errors: []
    };

    // Estado interno
    this._streamingInProgress = false;
    this._abortController = null;
    this._buffer = '';
    this._bufferSize = 0;

    // Sistema de logging
    this.logger = {
      debug: (...args) => this.options.debug && console.log('[StreamingRenderer:DEBUG]', ...args),
      info: (...args) => console.log('[StreamingRenderer:INFO]', ...args),
      warn: (...args) => console.warn('[StreamingRenderer:WARN]', ...args),
      error: (...args) => console.error('[StreamingRenderer:ERROR]', ...args)
    };

    this.logger.info('StreamingRenderer inicializado com sucesso');
  }

  /**
   * Renderiza um template HTML usando streaming progressivo
   * @param {string} template - Template HTML a renderizar
   * @param {Object} data - Dados para renderização
   * @param {Function} chunkCallback - Callback para cada chunk renderizado
   * @returns {Promise<void>} Promise que resolve quando completo
   */
  async renderStreaming(template, data = {}, chunkCallback) {
    if (!chunkCallback || typeof chunkCallback !== 'function') {
      throw new Error('É necessário fornecer um callback para receber os chunks renderizados');
    }

    if (this._streamingInProgress) {
      throw new Error('Uma renderização streaming já está em andamento');
    }

    this._streamingInProgress = true;
    this._abortController = new AbortController();
    const signal = this._abortController.signal;

    const startTime = Date.now();
    this.metrics.streamingTime = 0;
    this.metrics.renderedChunks = 0;

    try {
      this.logger.info(`Iniciando renderização streaming para template de ${(template.length / 1024).toFixed(2)} KB`);

      // Preparar ambiente de streaming
      await this._prepareStreaming(template, data);

      // Dividir template em chunks gerenciáveis
      const chunks = await this._splitTemplateIntoChunks(template, data);
      this.metrics.totalChunks = chunks.length;

      // Enviar informações iniciais
      await this._sendInitialChunk(chunkCallback);

      // Processar e enviar cada chunk
      for (let i = 0; i < chunks.length; i++) {
        // Verificar se o streaming foi abortado
        if (signal.aborted) {
          this.logger.warn('Renderização streaming abortada');
          break;
        }

        // Processar o chunk
        const chunkStartTime = performance.now();
        const processedChunk = await this._processChunk(chunks[i], i, chunks.length);
        const chunkEndTime = performance.now();
        const chunkRenderTime = chunkEndTime - chunkStartTime;

        // Registrar métricas
        this.metrics.renderTimes.push(chunkRenderTime);
        this.metrics.chunkSizes.push(processedChunk.length);
        this.metrics.renderedChunks++;

        // Adicionar ao buffer
        await this._addToBuffer(processedChunk);

        // Calcular progresso
        const progress = {
          chunk: i + 1,
          totalChunks: chunks.length,
          percent: Math.round(((i + 1) / chunks.length) * 100),
          renderTime: chunkRenderTime,
          size: processedChunk.length
        };

        // Enviar callback
        chunkCallback(this._buffer, {
          ...progress,
          isFirstChunk: i === 0,
          isLastChunk: i === chunks.length - 1,
          isPartial: i < chunks.length - 1
        });

        // Emitir evento de progresso
        this.events.emit('progress', progress);

        // Aguardar um momento antes do próximo chunk
        await this._chunkDelay();

        // Verificar memória e otimizar se necessário
        await this._checkMemory();

        // Limpar buffer após alguns chunks
        if (i > 0 && i % 5 === 0) {
          this._buffer = '';
          this._bufferSize = 0;
        }
      }

      // Enviar chunk final
      await this._sendFinalChunk(chunkCallback);

      // Calcular tempo total
      this.metrics.streamingTime = Date.now() - startTime;

      this.logger.info(`Renderização streaming concluída em ${this.metrics.streamingTime}ms`);
      this.events.emit('complete', { ...this.metrics });
    } catch (error) {
      this.logger.error(`Erro na renderização streaming: ${error.message}`);
      this.metrics.errors.push(error.message);
      this.events.emit('error', { message: error.message, stack: error.stack });
      throw error;
    } finally {
      this._streamingInProgress = false;
      this._abortController = null;
    }
  }

  /**
   * Prepara o ambiente para streaming
   * @param {string} template - Template HTML
   * @param {Object} data - Dados para renderização
   * @returns {Promise<void>}
   * @private
   */
  async _prepareStreaming(template, data) {
    this.logger.debug('Preparando ambiente para streaming');

    // Resetar buffer
    this._buffer = '';
    this._bufferSize = 0;

    // Inicializar métricas
    this.metrics.totalElements = 0;
    this.metrics.elementsPerChunk = [];
    this.metrics.chunkSizes = [];
    this.metrics.renderTimes = [];
    this.metrics.memoryUsage = [];
    this.metrics.errors = [];

    // Analisar o template para obter informações
    try {
      const dom = new JSDOM(template);
      const document = dom.window.document;

      // Contar elementos para métricas
      this.metrics.totalElements = document.querySelectorAll('*').length;

      this.logger.debug(`Template contém ${this.metrics.totalElements} elementos`);
    } catch (error) {
      this.logger.warn(`Erro ao analisar template para métricas: ${error.message}`);
    }
  }

  /**
   * Divide o template em chunks gerenciáveis
   * @param {string} template - Template HTML
   * @param {Object} data - Dados para renderização
   * @returns {Promise<Array<Object>>} Array de chunks
   * @private
   */
  async _splitTemplateIntoChunks(template, data) {
    this.logger.debug('Dividindo template em chunks');

    try {
      // Usar o otimizador de memória para dividir o template
      const rawChunks = this.memoryOptimizer.chunkifyTemplate(template);

      // Adicionar metadados a cada chunk
      const chunks = rawChunks.map((content, index) => {
        // Analisar cada chunk para obter estatísticas
        let elementCount = 0;
        try {
          const dom = new JSDOM(content);
          elementCount = dom.window.document.querySelectorAll('*').length;
        } catch (e) {
          // Ignorar erros na análise
        }

        return {
          id: `chunk-${index}`,
          content,
          size: content.length,
          elements: elementCount,
          index
        };
      });

      this.logger.info(`Template dividido em ${chunks.length} chunks`);
      return chunks;
    } catch (error) {
      this.logger.error(`Erro ao dividir template: ${error.message}`);
      throw error;
    }
  }

  /**
   * Envia o chunk inicial com estrutura base e feedback visual
   * @param {Function} chunkCallback - Callback para enviar o chunk
   * @returns {Promise<void>}
   * @private
   */
  async _sendInitialChunk(chunkCallback) {
    this.logger.debug('Enviando chunk inicial');

    // Criar estrutura HTML inicial com feedback visual
    const initialHTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="renderer" content="php-universal-mcp-streaming">
  <title>Renderização em Streaming</title>
  ${this._generateStreamingCSS()}
</head>
<body>
  <div id="streaming-content"></div>
  
  ${this.options.visualFeedback ? `
  <div class="streaming-progress">
    <div class="streaming-progress-bar" id="streamingProgressBar"></div>
    <div id="streamingProgressText">Carregando (0/${this.metrics.totalChunks || '?'})...</div>
  </div>
  ` : ''}
  
  ${this._generateStreamingScript()}
</body>
</html>`;

    // Definir buffer inicial
    this._buffer = initialHTML;
    this._bufferSize = initialHTML.length;

    // Enviar chunk inicial
    chunkCallback(initialHTML, {
      chunk: 0,
      totalChunks: this.metrics.totalChunks,
      percent: 0,
      isFirstChunk: true,
      isLastChunk: false,
      isPartial: true
    });

    // Emitir evento
    this.events.emit('start', { 
      totalChunks: this.metrics.totalChunks,
      totalElements: this.metrics.totalElements
    });
  }

  /**
   * Processa um chunk individual
   * @param {Object} chunk - Chunk a processar
   * @param {number} index - Índice do chunk
   * @param {number} total - Total de chunks
   * @returns {Promise<string>} HTML processado
   * @private
   */
  async _processChunk(chunk, index, total) {
    this.logger.debug(`Processando chunk ${index + 1}/${total} (${(chunk.size / 1024).toFixed(2)} KB)`);

    try {
      // Adicionar wrapper para o chunk
      const chunkContent = chunk.content;
      const priority = this._calculateChunkPriority(chunk, index, total);

      // Wrapper com metadados
      const processedChunk = `
<div class="streaming-chunk" data-chunk-id="${chunk.id}" data-chunk-index="${index}" data-priority="${priority}">
  ${chunkContent}
</div>
<script>
  // Notificar que o chunk foi carregado
  if (window.streamingRenderer) {
    window.streamingRenderer.chunkLoaded(${index}, ${total}, ${priority});
  }
</script>
`;

      // Registrar número de elementos
      this.metrics.elementsPerChunk.push(chunk.elements);

      return processedChunk;
    } catch (error) {
      this.logger.error(`Erro ao processar chunk ${index + 1}: ${error.message}`);
      this.metrics.errors.push(`Chunk ${index + 1}: ${error.message}`);

      // Retornar mensagem de erro visível
      return `
<div class="streaming-chunk streaming-error" data-chunk-id="${chunk.id}" data-chunk-index="${index}">
  <div class="error-message">
    <h3>Erro ao renderizar esta seção</h3>
    <p>${error.message}</p>
  </div>
</div>
`;
    }
  }

  /**
   * Calcula a prioridade de um chunk para renderização
   * @param {Object} chunk - Chunk a avaliar
   * @param {number} index - Índice do chunk
   * @param {number} total - Total de chunks
   * @returns {number} Prioridade (1-5, menor = mais alta)
   * @private
   */
  _calculateChunkPriority(chunk, index, total) {
    // Se a priorização estiver desativada, usar ordem linear
    if (!this.options.prioritization) {
      return index < total / 3 ? 1 : index < total * 2 / 3 ? 3 : 5;
    }

    // Primeiro chunk sempre tem prioridade máxima
    if (index === 0) return 1;

    // Último chunk tem prioridade baixa
    if (index === total - 1) return 5;

    // Priorizar com base na posição e número de elementos
    // Chunks no início do documento têm maior prioridade
    const positionFactor = index / total;
    let priority;

    if (positionFactor < 0.2) {
      // Primeiros 20% dos chunks - prioridade alta
      priority = 1;
    } else if (positionFactor < 0.5) {
      // Próximos 30% - prioridade média-alta
      priority = 2;
    } else if (positionFactor < 0.8) {
      // Próximos 30% - prioridade média
      priority = 3;
    } else {
      // Últimos 20% - prioridade baixa
      priority = 4;
    }

    // Ajustar com base no número de elementos (chunks mais densos = maior prioridade)
    if (chunk.elements > this.options.maxElementsPerChunk / 2) {
      priority = Math.max(1, priority - 1);
    }

    return priority;
  }

  /**
   * Adiciona HTML ao buffer de streaming
   * @param {string} html - HTML a adicionar
   * @returns {Promise<void>}
   * @private
   */
  async _addToBuffer(html) {
    // Adicionar ao buffer
    this._buffer += html;
    this._bufferSize += html.length;

    // Verificar se excedeu o tamanho máximo
    if (this._bufferSize > this.options.bufferSize * 1024) {
      this.logger.debug(`Buffer excedeu tamanho máximo (${this.options.bufferSize} KB), limpando`);
      this._buffer = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="renderer" content="php-universal-mcp-streaming">
  <title>Renderização em Streaming (Continuação)</title>
  ${this._generateStreamingCSS()}
</head>
<body>
  <div id="streaming-content">
    <!-- Continuação do conteúdo anterior -->
    ${html}
  </div>
  
  ${this.options.visualFeedback ? `
  <div class="streaming-progress">
    <div class="streaming-progress-bar" id="streamingProgressBar"></div>
    <div id="streamingProgressText">Carregando (${this.metrics.renderedChunks}/${this.metrics.totalChunks})...</div>
  </div>
  ` : ''}
  
  ${this._generateStreamingScript()}
</body>
</html>`;
      this._bufferSize = this._buffer.length;
    }
  }

  /**
   * Envia o chunk final com scripts de finalização
   * @param {Function} chunkCallback - Callback para enviar o chunk
   * @returns {Promise<void>}
   * @private
   */
  async _sendFinalChunk(chunkCallback) {
    this.logger.debug('Enviando chunk final');

    // Script de finalização
    const finalScript = `
<script>
  // Streaming concluído
  if (window.streamingRenderer) {
    window.streamingRenderer.complete();
  }
  
  // Registrar métricas de renderização
  console.log('Streaming concluído em ${this.metrics.streamingTime}ms');
  console.log('Total de chunks: ${this.metrics.renderedChunks}/${this.metrics.totalChunks}');
</script>
`;

    // Adicionar ao buffer
    this._buffer += finalScript;
    this._bufferSize += finalScript.length;

    // Enviar chunk final
    chunkCallback(this._buffer, {
      chunk: this.metrics.totalChunks,
      totalChunks: this.metrics.totalChunks,
      percent: 100,
      isFirstChunk: false,
      isLastChunk: true,
      isPartial: false
    });
  }

  /**
   * Aguarda um intervalo entre chunks
   * @returns {Promise<void>}
   * @private
   */
  async _chunkDelay() {
    return new Promise(resolve => {
      setTimeout(resolve, this.options.chunkInterval);
    });
  }

  /**
   * Verifica uso de memória e otimiza se necessário
   * @returns {Promise<void>}
   * @private
   */
  async _checkMemory() {
    if (!this.options.memoryMonitoring) return;

    try {
      const memoryUsage = process.memoryUsage();
      const heapUsedMB = memoryUsage.heapUsed / (1024 * 1024);
      
      // Registrar uso de memória
      this.metrics.memoryUsage.push(heapUsedMB);

      // Verificar se ultrapassou o limite
      if (heapUsedMB > this.options.memoryLimit) {
        this.logger.warn(`Uso de memória alto: ${heapUsedMB.toFixed(2)}MB, forçando otimização`);
        
        // Forçar coleta de lixo se disponível
        if (typeof global.gc === 'function') {
          this.logger.debug('Executando coleta de lixo explícita');
          global.gc();
        }

        // Emitir evento de alerta de memória
        this.events.emit('memory-warning', { used: heapUsedMB, limit: this.options.memoryLimit });
      }
    } catch (error) {
      // Ignorar erros no monitoramento de memória
      this.logger.debug(`Erro ao verificar memória: ${error.message}`);
    }
  }

  /**
   * Aborta a renderização em andamento
   * @returns {boolean} true se foi abortado, false se não havia streaming em progresso
   */
  abort() {
    if (!this._streamingInProgress || !this._abortController) {
      return false;
    }

    this.logger.warn('Abortando renderização streaming');
    this._abortController.abort();
    return true;
  }

  /**
   * Gera CSS para feedback visual de streaming
   * @returns {string} Tag style com CSS
   * @private
   */
  _generateStreamingCSS() {
    return `<style>
  /* Estilos para streaming renderer */
  .streaming-progress {
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 10px 15px;
    border-radius: 4px;
    font-size: 14px;
    z-index: 9999;
    transition: opacity 0.5s;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  }
  
  .streaming-progress-bar {
    height: 4px;
    background: #4caf50;
    margin-bottom: 6px;
    width: 0%;
    transition: width 0.3s;
    border-radius: 2px;
  }
  
  /* Estilo para chunks */
  .streaming-chunk {
    opacity: 0;
    transition: opacity 0.5s ease-in-out;
    will-change: opacity;
  }
  
  .streaming-chunk.visible {
    opacity: 1;
  }
  
  /* Estilo para erros */
  .streaming-error {
    opacity: 1;
    padding: 15px;
    margin: 10px 0;
    background-color: #ffebee;
    border-left: 4px solid #f44336;
    color: #333;
  }
  
  .error-message {
    max-width: 800px;
    margin: 0 auto;
  }
  
  .error-message h3 {
    margin-top: 0;
    color: #d32f2f;
  }
  
  /* Animação de carregamento */
  @keyframes skeleton-pulse {
    0% {
      background-position: -200px 0;
    }
    100% {
      background-position: calc(200px + 100%) 0;
    }
  }
  
  /* Placeholders */
  ${this.options.skeletonCSS ? `
  .skeleton-placeholder {
    display: block;
    background: #f0f0f0;
    background-image: linear-gradient(90deg, #f0f0f0, #f8f8f8, #f0f0f0);
    background-size: 200px 100%;
    background-repeat: no-repeat;
    animation: skeleton-pulse 1.5s infinite;
    border-radius: 4px;
    height: 1em;
    margin: 0.5em 0;
  }
  
  .skeleton-image {
    height: 0;
    padding-bottom: 56.25%; /* 16:9 aspect ratio */
  }
  
  .skeleton-title {
    height: 1.5em;
    width: 85%;
  }
  
  .skeleton-text {
    height: 1em;
  }
  
  .skeleton-text.short {
    width: 60%;
  }
  
  .skeleton-button {
    height: 2em;
    width: 120px;
    border-radius: 4px;
  }
  ` : ''}
</style>`;
  }

  /**
   * Gera o script para gerenciar o streaming no cliente
   * @returns {string} Tag script com o código
   * @private
   */
  _generateStreamingScript() {
    return `<script>
  // Streaming Renderer Client-Side
  (function() {
    const streamingRenderer = {
      // Estado
      state: {
        loadedChunks: 0,
        totalChunks: ${this.metrics.totalChunks || 0},
        chunksById: {},
        pendingPriority: {
          1: [], 2: [], 3: [], 4: [], 5: []
        },
        startTime: Date.now(),
        complete: false
      },
      
      // Inicialização
      init: function() {
        // Preparar elementos progress
        this.progressBar = document.getElementById('streamingProgressBar');
        this.progressText = document.getElementById('streamingProgressText');
        
        // Configurar observer para lazy loading
        if ('IntersectionObserver' in window) {
          this.setupIntersectionObserver();
        }
        
        // Expor globalmente
        window.streamingRenderer = this;
        
        console.log('Streaming Renderer inicializado');
      },
      
      // Configura observer para lazy loading
      setupIntersectionObserver: function() {
        this.observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const chunk = entry.target;
              const priority = parseInt(chunk.dataset.priority || 3, 10);
              
              // Prioridade fixa
              this.showChunk(chunk);
              
              // Deixar de observar
              this.observer.unobserve(chunk);
            }
          });
        }, {
          rootMargin: '200px',
          threshold: 0.1
        });
      },
      
      // Notificação de chunk carregado
      chunkLoaded: function(index, total, priority) {
        const chunks = document.querySelectorAll('.streaming-chunk');
        const chunk = chunks[chunks.length - 1];
        
        if (!chunk) return;
        
        // Registrar o chunk
        this.state.chunksById[chunk.dataset.chunkId] = chunk;
        this.state.loadedChunks++;
        
        // Atualizar total se necessário
        if (this.state.totalChunks === 0 || this.state.totalChunks < total) {
          this.state.totalChunks = total;
        }
        
        // Adicionar à fila de prioridade
        this.state.pendingPriority[priority].push(chunk);
        
        // Atualizar progresso
        this.updateProgress();
        
        // Processar chunks de alta prioridade imediatamente
        if (priority <= 2) {
          this.processHighPriorityChunks();
        } else if (this.state.loadedChunks % 3 === 0) {
          // A cada 3 chunks, processar alguns pendentes
          this.processPendingChunks();
        }
        
        // Observar para lazy loading (prioridades baixas)
        if (priority >= 4 && this.observer) {
          this.observer.observe(chunk);
        }
      },
      
      // Processa chunks de alta prioridade
      processHighPriorityChunks: function() {
        // Processar todos os chunks de prioridade 1
        this.state.pendingPriority[1].forEach(chunk => {
          this.showChunk(chunk);
        });
        this.state.pendingPriority[1] = [];
        
        // Processar alguns chunks de prioridade 2
        const priority2Count = Math.min(this.state.pendingPriority[2].length, 3);
        for (let i = 0; i < priority2Count; i++) {
          const chunk = this.state.pendingPriority[2].shift();
          this.showChunk(chunk);
        }
      },
      
      // Processa chunks pendentes
      processPendingChunks: function() {
        // Processar um chunk de cada prioridade, começando pela mais alta
        for (let priority = 2; priority <= 5; priority++) {
          if (this.state.pendingPriority[priority].length > 0) {
            const chunk = this.state.pendingPriority[priority].shift();
            this.showChunk(chunk);
            
            // Limitar a um chunk por ciclo para prioridades baixas
            if (priority >= 4) break;
          }
        }
      },
      
      // Atualiza barra de progresso
      updateProgress: function() {
        if (!this.progressBar || !this.progressText) return;
        
        const percent = Math.min(100, Math.round((this.state.loadedChunks / this.state.totalChunks) * 100));
        this.progressBar.style.width = percent + '%';
        this.progressText.textContent = \`Carregando (\${this.state.loadedChunks}/\${this.state.totalChunks})...\`;
        
        // Esconder progress bar no final
        if (this.state.complete || percent >= 100) {
          setTimeout(() => {
            const progress = document.querySelector('.streaming-progress');
            if (progress) {
              progress.style.opacity = '0';
              setTimeout(() => {
                progress.style.display = 'none';
              }, 500);
            }
          }, 1000);
        }
      },
      
      // Exibe um chunk
      showChunk: function(chunk) {
        if (!chunk) return;
        
        // Adicionar classe para transição visual
        chunk.classList.add('visible');
        
        // Remover das pendências
        const priority = parseInt(chunk.dataset.priority || 3, 10);
        const index = this.state.pendingPriority[priority].indexOf(chunk);
        if (index !== -1) {
          this.state.pendingPriority[priority].splice(index, 1);
        }
      },
      
      // Finalização do streaming
      complete: function() {
        this.state.complete = true;
        
        // Processar todos os chunks pendentes
        for (let priority = 1; priority <= 5; priority++) {
          this.state.pendingPriority[priority].forEach(chunk => {
            this.showChunk(chunk);
          });
          this.state.pendingPriority[priority] = [];
        }
        
        // Atualizar progresso
        this.updateProgress();
        
        const totalTime = Date.now() - this.state.startTime;
        console.log(\`Streaming renderizado em \${totalTime}ms\`);
      }
    };
    
    // Inicializar após o carregamento do DOM
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => streamingRenderer.init());
    } else {
      streamingRenderer.init();
    }
  })();
</script>`;
  }

  /**
   * Registra função de callback para evento
   * @param {string} event - Nome do evento (progress, complete, error, memory-warning)
   * @param {Function} callback - Função a ser chamada
   */
  on(event, callback) {
    this.events.on(event, callback);
  }

  /**
   * Remove função de callback de evento
   * @param {string} event - Nome do evento
   * @param {Function} callback - Função a remover
   */
  off(event, callback) {
    this.events.off(event, callback);
  }

  /**
   * Retorna as métricas atuais
   * @returns {Object} Métricas
   */
  getMetrics() {
    return { ...this.metrics };
  }
}

module.exports = StreamingRenderer;