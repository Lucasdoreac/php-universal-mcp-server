/**
 * Memory Optimizer para Renderizador Progressivo
 * 
 * Este módulo fornece estratégias avançadas de gerenciamento de memória
 * para o renderizador progressivo, permitindo processar templates extremamente
 * grandes com uso eficiente de recursos.
 * 
 * @author PHP Universal MCP Server Team
 * @version 1.0.0
 */

const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const EventEmitter = require('events');

/**
 * Otimizador de memória para processamento de templates grandes
 */
class MemoryOptimizer {
  /**
   * Construtor do otimizador
   * @param {Object} options - Opções de configuração
   */
  constructor(options = {}) {
    this.options = {
      // Tamanho máximo (em KB) para processar de uma vez
      chunkSize: 500,
      // Limite de memória (em MB) para acionar otimizações agressivas
      memoryThreshold: 200,
      // Intervalo (em ms) para verificar uso de memória
      monitorInterval: 1000,
      // Habilitar modo de streaming
      streamingEnabled: true,
      // Habilitar coleta de lixo explícita entre chunks
      explicitGC: typeof global.gc === 'function',
      // Habilitar log detalhado
      debug: false,
      ...options
    };
    
    // Inicializar sistema de eventos
    this.events = new EventEmitter();
    
    // Estado interno
    this._memory = {
      lastUsage: 0,
      peak: 0,
      warnings: 0
    };
    
    // Timer para monitoramento de memória
    this._monitorTimer = null;
    
    // Cache de nós processados
    this._processedCache = new Map();
    
    // Sistema de logging
    this.logger = {
      debug: (...args) => this.options.debug && console.log('[MemoryOptimizer:DEBUG]', ...args),
      info: (...args) => console.log('[MemoryOptimizer:INFO]', ...args),
      warn: (...args) => console.warn('[MemoryOptimizer:WARN]', ...args),
      error: (...args) => console.error('[MemoryOptimizer:ERROR]', ...args)
    };
  }

  /**
   * Inicializa o monitoramento de memória
   */
  startMemoryMonitoring() {
    if (this._monitorTimer) {
      clearInterval(this._monitorTimer);
    }
    
    this._monitorTimer = setInterval(() => {
      this._checkMemoryUsage();
    }, this.options.monitorInterval);
    
    this.logger.debug('Monitoramento de memória iniciado');
  }

  /**
   * Para o monitoramento de memória
   */
  stopMemoryMonitoring() {
    if (this._monitorTimer) {
      clearInterval(this._monitorTimer);
      this._monitorTimer = null;
    }
    
    this.logger.debug('Monitoramento de memória interrompido');
  }

  /**
   * Verifica o uso atual de memória
   * @private
   */
  _checkMemoryUsage() {
    const memoryUsage = process.memoryUsage();
    const heapUsed = memoryUsage.heapUsed / 1024 / 1024; // MB
    
    // Atualizar pico de uso
    if (heapUsed > this._memory.peak) {
      this._memory.peak = heapUsed;
    }
    
    // Calcular taxa de crescimento
    const growthRate = this._memory.lastUsage > 0 ? 
      (heapUsed - this._memory.lastUsage) / this.options.monitorInterval * 1000 : 0;
    
    this._memory.lastUsage = heapUsed;
    
    // Verificar uso excessivo
    if (heapUsed > this.options.memoryThreshold) {
      this._memory.warnings++;
      
      // Emitir evento de alerta
      this.events.emit('memory-warning', {
        used: heapUsed,
        threshold: this.options.memoryThreshold,
        growthRate,
        warningCount: this._memory.warnings
      });
      
      this.logger.warn(`Uso de memória alto: ${heapUsed.toFixed(2)}MB (limite: ${this.options.memoryThreshold}MB)`);
      
      // Tentar liberar memória
      this._tryFreeMemory();
    } else {
      this.logger.debug(`Uso de memória: ${heapUsed.toFixed(2)}MB (taxa: ${growthRate.toFixed(2)}MB/s)`);
    }
  }

  /**
   * Tenta liberar memória não utilizada
   * @private
   */
  _tryFreeMemory() {
    // Limpar caches
    this._processedCache.clear();
    
    // Forçar coleta de lixo se disponível
    if (this.options.explicitGC) {
      this.logger.debug('Executando coleta de lixo explícita');
      global.gc();
    }
  }

  /**
   * Divide um template grande em chunks para processamento
   * @param {string} template - Template a ser dividido
   * @returns {Array<string>} Array de chunks do template
   */
  chunkifyTemplate(template) {
    // Se o template for pequeno, retornar como um único chunk
    if (template.length < this.options.chunkSize * 1024) {
      return [template];
    }
    
    this.logger.info(`Dividindo template de ${(template.length / 1024).toFixed(2)}KB em chunks`);
    
    // Criar DOM temporário para dividir o template
    const dom = new JSDOM(template);
    const document = dom.window.document;
    const body = document.body;
    
    // Identificar tags de primeiro nível
    const topLevelNodes = Array.from(body.children);
    
    // Inicializar chunks
    const chunks = [];
    let currentChunk = '';
    let currentSize = 0;
    
    // Processar nós de primeiro nível
    for (const node of topLevelNodes) {
      const nodeHtml = node.outerHTML;
      const nodeSize = nodeHtml.length / 1024; // Tamanho em KB
      
      // Se o nó for maior que o tamanho máximo de chunk, dividir recursivamente
      if (nodeSize > this.options.chunkSize) {
        // Finalizar chunk atual se não estiver vazio
        if (currentSize > 0) {
          chunks.push(currentChunk);
          currentChunk = '';
          currentSize = 0;
        }
        
        // Dividir nó grande em sub-chunks
        const subChunks = this._splitLargeNode(node);
        chunks.push(...subChunks);
      } 
      // Se adicionar este nó exceder o tamanho do chunk, iniciar um novo
      else if (currentSize + nodeSize > this.options.chunkSize) {
        chunks.push(currentChunk);
        currentChunk = nodeHtml;
        currentSize = nodeSize;
      } 
      // Caso contrário, adicionar ao chunk atual
      else {
        currentChunk += nodeHtml;
        currentSize += nodeSize;
      }
    }
    
    // Adicionar o último chunk se não estiver vazio
    if (currentSize > 0) {
      chunks.push(currentChunk);
    }
    
    this.logger.info(`Template dividido em ${chunks.length} chunks`);
    
    return chunks;
  }

  /**
   * Divide um nó grande em chunks menores
   * @param {Node} node - Nó DOM a ser dividido
   * @returns {Array<string>} Array de chunks HTML
   * @private
   */
  _splitLargeNode(node) {
    const nodeType = node.nodeName.toLowerCase();
    const chunks = [];
    
    // Estratégia depende do tipo de nó
    switch (nodeType) {
      // Para tabelas, dividir por linhas
      case 'table':
        chunks.push(...this._splitTable(node));
        break;
      
      // Para listas, dividir por itens
      case 'ul':
      case 'ol':
        chunks.push(...this._splitList(node));
        break;
      
      // Para divs e seções, dividir por filhos
      case 'div':
      case 'section':
      case 'article':
        chunks.push(...this._splitContainer(node));
        break;
      
      // Para outros tipos, simplesmente usar como um chunk
      default:
        chunks.push(node.outerHTML);
    }
    
    return chunks;
  }

  /**
   * Divide uma tabela em chunks por linhas
   * @param {Node} tableNode - Nó da tabela
   * @returns {Array<string>} Array de chunks de tabela
   * @private
   */
  _splitTable(tableNode) {
    const chunks = [];
    const rows = tableNode.querySelectorAll('tr');
    
    // Capturar cabeçalho da tabela
    const tableHeader = tableNode.querySelector('thead') ? tableNode.querySelector('thead').outerHTML : '';
    
    // Inicializar chunk atual
    let currentChunk = `<table>${tableHeader}<tbody>`;
    let currentSize = currentChunk.length / 1024;
    let rowCount = 0;
    
    // Processar linhas
    for (const row of rows) {
      const rowHtml = row.outerHTML;
      const rowSize = rowHtml.length / 1024;
      
      // Se adicionar esta linha exceder o tamanho do chunk, iniciar um novo
      if (currentSize + rowSize > this.options.chunkSize && rowCount > 0) {
        currentChunk += '</tbody></table>';
        chunks.push(currentChunk);
        currentChunk = `<table>${tableHeader}<tbody>`;
        currentSize = currentChunk.length / 1024;
        rowCount = 0;
      }
      
      // Adicionar linha ao chunk atual
      currentChunk += rowHtml;
      currentSize += rowSize;
      rowCount++;
    }
    
    // Adicionar o último chunk se não estiver vazio
    if (rowCount > 0) {
      currentChunk += '</tbody></table>';
      chunks.push(currentChunk);
    }
    
    return chunks;
  }

  /**
   * Divide uma lista em chunks por itens
   * @param {Node} listNode - Nó da lista
   * @returns {Array<string>} Array de chunks de lista
   * @private
   */
  _splitList(listNode) {
    const chunks = [];
    const items = listNode.querySelectorAll('li');
    const listType = listNode.nodeName.toLowerCase();
    
    // Inicializar chunk atual
    let currentChunk = `<${listType}>`;
    let currentSize = currentChunk.length / 1024;
    let itemCount = 0;
    
    // Processar itens
    for (const item of items) {
      const itemHtml = item.outerHTML;
      const itemSize = itemHtml.length / 1024;
      
      // Se adicionar este item exceder o tamanho do chunk, iniciar um novo
      if (currentSize + itemSize > this.options.chunkSize && itemCount > 0) {
        currentChunk += `</${listType}>`;
        chunks.push(currentChunk);
        currentChunk = `<${listType}>`;
        currentSize = currentChunk.length / 1024;
        itemCount = 0;
      }
      
      // Adicionar item ao chunk atual
      currentChunk += itemHtml;
      currentSize += itemSize;
      itemCount++;
    }
    
    // Adicionar o último chunk se não estiver vazio
    if (itemCount > 0) {
      currentChunk += `</${listType}>`;
      chunks.push(currentChunk);
    }
    
    return chunks;
  }

  /**
   * Divide um contêiner em chunks por filhos
   * @param {Node} containerNode - Nó contêiner
   * @returns {Array<string>} Array de chunks de contêiner
   * @private
   */
  _splitContainer(containerNode) {
    const chunks = [];
    const children = Array.from(containerNode.children);
    const containerType = containerNode.nodeName.toLowerCase();
    
    // Capturar atributos do contêiner
    const attrs = Array.from(containerNode.attributes).map(attr => 
      `${attr.name}="${attr.value}"`
    ).join(' ');
    
    // Inicializar chunk atual
    let currentChunk = `<${containerType} ${attrs}>`;
    let currentSize = currentChunk.length / 1024;
    let childCount = 0;
    
    // Processar filhos
    for (const child of children) {
      const childHtml = child.outerHTML;
      const childSize = childHtml.length / 1024;
      
      // Se o filho for maior que o tamanho máximo de chunk, dividir recursivamente
      if (childSize > this.options.chunkSize) {
        // Finalizar chunk atual se não estiver vazio
        if (childCount > 0) {
          currentChunk += `</${containerType}>`;
          chunks.push(currentChunk);
          currentChunk = `<${containerType} ${attrs}>`;
          currentSize = currentChunk.length / 1024;
          childCount = 0;
        }
        
        // Dividir filho grande em sub-chunks
        const subChunks = this._splitLargeNode(child);
        
        // Adicionar cada sub-chunk ao contêiner apropriado
        for (const subChunk of subChunks) {
          chunks.push(`<${containerType} ${attrs}>${subChunk}</${containerType}>`);
        }
      } 
      // Se adicionar este filho exceder o tamanho do chunk, iniciar um novo
      else if (currentSize + childSize > this.options.chunkSize && childCount > 0) {
        currentChunk += `</${containerType}>`;
        chunks.push(currentChunk);
        currentChunk = `<${containerType} ${attrs}>`;
        currentSize = currentChunk.length / 1024;
        childCount = 0;
      } 
      // Caso contrário, adicionar ao chunk atual
      else {
        currentChunk += childHtml;
        currentSize += childSize;
        childCount++;
      }
    }
    
    // Adicionar o último chunk se não estiver vazio
    if (childCount > 0) {
      currentChunk += `</${containerType}>`;
      chunks.push(currentChunk);
    }
    
    return chunks;
  }

  /**
   * Processa um template com otimização de memória
   * @param {string} template - Template a ser processado
   * @param {Function} processor - Função de processamento para cada chunk
   * @param {Object} context - Contexto para processamento
   * @returns {Promise<string>} Template processado
   */
  async processWithMemoryOptimization(template, processor, context = {}) {
    // Iniciar monitoramento de memória
    this.startMemoryMonitoring();
    
    try {
      // Dividir template em chunks se necessário
      const chunks = this.chunkifyTemplate(template);
      
      // Se houver apenas um chunk, processar diretamente
      if (chunks.length === 1) {
        const result = await processor(template, context);
        return result;
      }
      
      // Processar chunks em sequência com otimização de memória
      let result = '';
      
      // Modo de streaming
      if (this.options.streamingEnabled) {
        for (let i = 0; i < chunks.length; i++) {
          this.logger.debug(`Processando chunk ${i + 1}/${chunks.length} (${(chunks[i].length / 1024).toFixed(2)}KB)`);
          
          // Processar chunk
          const processedChunk = await processor(chunks[i], {
            ...context,
            chunkIndex: i,
            totalChunks: chunks.length,
            isFirstChunk: i === 0,
            isLastChunk: i === chunks.length - 1
          });
          
          // Adicionar ao resultado
          result += processedChunk;
          
          // Liberar memória após cada chunk
          if (this.options.explicitGC) {
            global.gc();
          }
          
          // Emitir progresso
          this.events.emit('progress', {
            chunk: i + 1,
            totalChunks: chunks.length,
            percent: Math.round(((i + 1) / chunks.length) * 100)
          });
        }
      } 
      // Modo padrão (processar todos os chunks)
      else {
        const processedChunks = [];
        
        for (let i = 0; i < chunks.length; i++) {
          this.logger.debug(`Processando chunk ${i + 1}/${chunks.length} (${(chunks[i].length / 1024).toFixed(2)}KB)`);
          
          // Processar chunk
          const processedChunk = await processor(chunks[i], {
            ...context,
            chunkIndex: i,
            totalChunks: chunks.length,
            isFirstChunk: i === 0,
            isLastChunk: i === chunks.length - 1
          });
          
          // Adicionar ao array de resultados
          processedChunks.push(processedChunk);
          
          // Liberar memória após cada chunk
          if (this.options.explicitGC) {
            global.gc();
          }
          
          // Emitir progresso
          this.events.emit('progress', {
            chunk: i + 1,
            totalChunks: chunks.length,
            percent: Math.round(((i + 1) / chunks.length) * 100)
          });
        }
        
        // Combinar todos os chunks
        result = processedChunks.join('');
      }
      
      return result;
    } finally {
      // Parar monitoramento de memória
      this.stopMemoryMonitoring();
      
      // Limpar caches
      this._processedCache.clear();
      
      // Forçar coleta de lixo final
      if (this.options.explicitGC) {
        global.gc();
      }
      
      // Emitir estatísticas finais
      this.events.emit('complete', {
        peakMemory: this._memory.peak,
        warnings: this._memory.warnings
      });
      
      this.logger.info(`Processamento concluído. Pico de memória: ${this._memory.peak.toFixed(2)}MB`);
    }
  }

  /**
   * Melhora o gerenciamento de memória durante a análise de DOM
   * @param {Function} callback - Função a ser executada com otimização de memória
   * @param {Object} context - Contexto para o callback
   * @returns {Promise<any>} Resultado do callback
   */
  async optimizedDOMProcessing(callback, context = {}) {
    // Capturar uso de memória antes
    const memBefore = process.memoryUsage().heapUsed / 1024 / 1024;
    
    try {
      // Executar callback com contexto
      return await callback(context);
    } finally {
      // Capturar uso de memória depois
      const memAfter = process.memoryUsage().heapUsed / 1024 / 1024;
      const memDiff = memAfter - memBefore;
      
      // Verificar vazamento significativo
      if (memDiff > 10) {
        this.logger.warn(`Possível vazamento de memória: +${memDiff.toFixed(2)}MB`);
        
        // Tentar liberar memória
        this._tryFreeMemory();
      }
    }
  }
  
  /**
   * Associa uma função de callback a um evento
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
   * Retorna estatísticas de uso de memória
   * @returns {Object} Estatísticas de memória
   */
  getMemoryStats() {
    return {
      currentUsage: process.memoryUsage().heapUsed / 1024 / 1024,
      peakUsage: this._memory.peak,
      warningCount: this._memory.warnings,
      memoryLimit: this.options.memoryThreshold
    };
  }
}

module.exports = MemoryOptimizer;
