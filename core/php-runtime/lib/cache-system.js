/**
 * Cache System
 * Sistema de cache para otimizar execuções de código PHP
 */
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class CacheSystem {
  /**
   * Inicializa o sistema de cache
   * @param {Object} config - Configurações do cache
   */
  constructor(config = {}) {
    this.config = {
      enabled: config.cacheEnabled !== undefined ? config.cacheEnabled : true,
      directory: config.cacheDirectory || path.join(process.cwd(), 'cache'),
      lifetime: config.cacheLifetime || 3600, // 1 hora em segundos
      maxSize: config.cacheMaxSize || 104857600, // 100MB
      maxEntries: config.cacheMaxEntries || 1000,
      ...config
    };
    
    // Mapa em memória para cache mais rápido
    this.memoryCache = new Map();
    
    // Inicialização
    this._init();
  }

  /**
   * Inicializa o sistema de cache
   * @private
   */
  async _init() {
    try {
      // Cria diretório de cache se não existir
      await fs.mkdir(this.config.directory, { recursive: true });
      
      // Carrega informações do cache para memória
      await this._loadCacheInfo();
      
      // Agenda limpeza periódica
      this._scheduleCleanup();
    } catch (error) {
      console.warn(`Erro ao inicializar cache: ${error.message}`);
    }
  }

  /**
   * Carrega informações do cache para memória
   * @private
   */
  async _loadCacheInfo() {
    try {
      // Lista todos os arquivos no diretório de cache
      const files = await fs.readdir(this.config.directory);
      
      // Carrega metadados de cada arquivo
      for (const file of files) {
        if (file.endsWith('.meta.json')) {
          try {
            const metaPath = path.join(this.config.directory, file);
            const metaContent = await fs.readFile(metaPath, 'utf8');
            const metadata = JSON.parse(metaContent);
            
            // Verifica se o cache ainda é válido
            if (metadata.expiresAt > Date.now()) {
              // Adiciona à memória sem carregar o conteúdo ainda
              this.memoryCache.set(metadata.key, {
                expiresAt: metadata.expiresAt,
                size: metadata.size,
                filePath: path.join(this.config.directory, metadata.filename)
              });
            } else {
              // Remove arquivos expirados
              await this._removeEntry(metadata.key, metadata.filename);
            }
          } catch (err) {
            // Ignora erro e continua
          }
        }
      }
    } catch (error) {
      // Ignora erros - simplesmente inicia com cache vazio
    }
  }

  /**
   * Agenda limpeza periódica do cache
   * @private
   */
  _scheduleCleanup() {
    // Limpa a cada hora por padrão
    setInterval(() => this.cleanup(), 3600000);
  }

  /**
   * Gera uma chave de cache a partir do código e opções
   * @param {string} code - Código PHP
   * @param {Object} options - Opções de execução
   * @returns {string} Chave de cache
   */
  generateKey(code, options = {}) {
    // Usa apenas as opções relevantes para o cache
    const relevantOptions = {
      ini: options.ini || {},
      args: options.args || [],
      env: options.env || {}
    };
    
    // Serializa código e opções
    const serialized = JSON.stringify({
      code,
      options: relevantOptions
    });
    
    // Gera hash SHA-256
    return crypto.createHash('sha256').update(serialized).digest('hex');
  }

  /**
   * Verifica se uma chave existe no cache
   * @param {string} key - Chave do cache
   * @returns {Promise<boolean>} True se a chave existir e for válida
   */
  async has(key) {
    // Verifica na memória primeiro
    if (this.memoryCache.has(key)) {
      const entry = this.memoryCache.get(key);
      // Verifica validade
      if (entry.expiresAt > Date.now()) {
        return true;
      } else {
        // Remove entrada expirada
        this.memoryCache.delete(key);
        return false;
      }
    }
    
    // Verifica no sistema de arquivos
    try {
      const metaPath = path.join(this.config.directory, `${key}.meta.json`);
      const stats = await fs.stat(metaPath);
      
      if (stats.isFile()) {
        // Carrega metadados
        const metaContent = await fs.readFile(metaPath, 'utf8');
        const metadata = JSON.parse(metaContent);
        
        // Verifica validade
        if (metadata.expiresAt > Date.now()) {
          // Adiciona à memória
          this.memoryCache.set(key, {
            expiresAt: metadata.expiresAt,
            size: metadata.size,
            filePath: path.join(this.config.directory, metadata.filename)
          });
          return true;
        } else {
          // Remove entrada expirada
          await this._removeEntry(key, metadata.filename);
          return false;
        }
      }
    } catch (error) {
      // Arquivo não existe ou erro de leitura
      return false;
    }
    
    return false;
  }

  /**
   * Obtém um valor do cache
   * @param {string} key - Chave do cache
   * @returns {Promise<Object|null>} Valor do cache ou null se não existir
   */
  async get(key) {
    // Se o cache estiver desativado, retorna null
    if (!this.config.enabled) {
      return null;
    }
    
    // Verifica se a chave existe
    if (!await this.has(key)) {
      return null;
    }
    
    try {
      // Obtém informações da memória
      const entry = this.memoryCache.get(key);
      
      // Lê o arquivo de cache
      const content = await fs.readFile(entry.filePath, 'utf8');
      
      // Converte de volta para objeto
      return JSON.parse(content);
    } catch (error) {
      // Em caso de erro, remove a entrada e retorna null
      await this.remove(key);
      return null;
    }
  }

  /**
   * Armazena um valor no cache
   * @param {string} key - Chave do cache
   * @param {Object} value - Valor a ser armazenado
   * @returns {Promise<boolean>} True se armazenado com sucesso
   */
  async set(key, value) {
    // Se o cache estiver desativado, retorna false
    if (!this.config.enabled) {
      return false;
    }
    
    try {
      // Prepara o caminho dos arquivos
      const filename = `${key}.cache`;
      const filePath = path.join(this.config.directory, filename);
      const metaPath = path.join(this.config.directory, `${key}.meta.json`);
      
      // Serializa o valor
      const serialized = JSON.stringify(value);
      const size = Buffer.byteLength(serialized);
      
      // Verifica tamanho máximo
      if (size > this.config.maxSize * 0.1) { // Limita entradas individuais a 10% do tamanho total
        return false;
      }
      
      // Limpa o cache se necessário
      await this._ensureSpace(size);
      
      // Salva o arquivo de cache
      await fs.writeFile(filePath, serialized);
      
      // Prepara metadados
      const metadata = {
        key,
        filename,
        createdAt: Date.now(),
        expiresAt: Date.now() + (this.config.lifetime * 1000),
        size
      };
      
      // Salva metadados
      await fs.writeFile(metaPath, JSON.stringify(metadata));
      
      // Adiciona à memória
      this.memoryCache.set(key, {
        expiresAt: metadata.expiresAt,
        size,
        filePath
      });
      
      return true;
    } catch (error) {
      console.warn(`Erro ao armazenar no cache: ${error.message}`);
      return false;
    }
  }

  /**
   * Remove uma entrada do cache
   * @param {string} key - Chave a ser removida
   * @returns {Promise<boolean>} True se removido com sucesso
   */
  async remove(key) {
    try {
      // Remove da memória
      if (this.memoryCache.has(key)) {
        this.memoryCache.delete(key);
      }
      
      // Tenta ler metadados
      const metaPath = path.join(this.config.directory, `${key}.meta.json`);
      try {
        const metaContent = await fs.readFile(metaPath, 'utf8');
        const metadata = JSON.parse(metaContent);
        
        // Remove arquivos
        await this._removeEntry(key, metadata.filename);
        return true;
      } catch (err) {
        // Tenta remover apenas os arquivos padrão
        await Promise.all([
          fs.unlink(path.join(this.config.directory, `${key}.cache`)).catch(() => {}),
          fs.unlink(metaPath).catch(() => {})
        ]);
        return true;
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Remove uma entrada de cache pelos seus arquivos
   * @param {string} key - Chave do cache
   * @param {string} filename - Nome do arquivo de dados
   * @returns {Promise<void>}
   * @private
   */
  async _removeEntry(key, filename) {
    // Remove da memória
    this.memoryCache.delete(key);
    
    // Remove arquivos
    await Promise.all([
      fs.unlink(path.join(this.config.directory, filename)).catch(() => {}),
      fs.unlink(path.join(this.config.directory, `${key}.meta.json`)).catch(() => {})
    ]);
  }

  /**
   * Garante espaço suficiente para uma nova entrada
   * @param {number} requiredSize - Tamanho necessário em bytes
   * @returns {Promise<void>}
   * @private
   */
  async _ensureSpace(requiredSize) {
    // Verifica se o cache está muito grande
    if (this.memoryCache.size >= this.config.maxEntries) {
      await this._removeOldestEntries(Math.ceil(this.config.maxEntries * 0.1)); // Remove 10% das entradas
    }
    
    // Calcula tamanho atual do cache
    let currentSize = 0;
    for (const entry of this.memoryCache.values()) {
      currentSize += entry.size;
    }
    
    // Se não houver espaço suficiente, remove entradas antigas
    if ((currentSize + requiredSize) > this.config.maxSize) {
      const sizeToFree = (currentSize + requiredSize) - this.config.maxSize + 1024 * 1024; // +1MB extra
      await this._freeCacheSpace(sizeToFree);
    }
  }

  /**
   * Remove entradas mais antigas para liberar espaço
   * @param {number} sizeToFree - Tamanho a ser liberado em bytes
   * @returns {Promise<void>}
   * @private
   */
  async _freeCacheSpace(sizeToFree) {
    // Ordena entradas por data de expiração
    const entries = Array.from(this.memoryCache.entries())
      .sort((a, b) => a[1].expiresAt - b[1].expiresAt);
    
    let freedSize = 0;
    const removePromises = [];
    
    for (const [key, entry] of entries) {
      if (freedSize >= sizeToFree) break;
      
      freedSize += entry.size;
      
      // Remove a entrada
      this.memoryCache.delete(key);
      
      // Adiciona à lista de arquivos a remover
      removePromises.push(this._removeEntry(key, path.basename(entry.filePath)));
    }
    
    // Remove os arquivos em paralelo
    await Promise.all(removePromises);
  }

  /**
   * Remove as entradas mais antigas do cache
   * @param {number} count - Número de entradas a remover
   * @returns {Promise<void>}
   * @private
   */
  async _removeOldestEntries(count) {
    // Ordena entradas por data de expiração
    const entries = Array.from(this.memoryCache.entries())
      .sort((a, b) => a[1].expiresAt - b[1].expiresAt)
      .slice(0, count);
    
    const removePromises = entries.map(([key, entry]) => {
      this.memoryCache.delete(key);
      return this._removeEntry(key, path.basename(entry.filePath));
    });
    
    // Remove os arquivos em paralelo
    await Promise.all(removePromises);
  }

  /**
   * Limpa entradas expiradas do cache
   * @returns {Promise<number>} Número de entradas removidas
   */
  async cleanup() {
    const now = Date.now();
    const expiredEntries = Array.from(this.memoryCache.entries())
      .filter(([_, entry]) => entry.expiresAt <= now);
    
    let removedCount = 0;
    
    for (const [key, entry] of expiredEntries) {
      this.memoryCache.delete(key);
      await this._removeEntry(key, path.basename(entry.filePath));
      removedCount++;
    }
    
    return removedCount;
  }

  /**
   * Limpa todo o cache
   * @returns {Promise<boolean>} True se limpo com sucesso
   */
  async clear() {
    try {
      // Limpa cache em memória
      this.memoryCache.clear();
      
      // Lista todos os arquivos no diretório de cache
      const files = await fs.readdir(this.config.directory);
      
      // Remove todos os arquivos
      await Promise.all(files.map(file => 
        fs.unlink(path.join(this.config.directory, file)).catch(() => {})
      ));
      
      return true;
    } catch (error) {
      console.warn(`Erro ao limpar cache: ${error.message}`);
      return false;
    }
  }

  /**
   * Obtém estatísticas do sistema de cache
   * @returns {Promise<Object>} Estatísticas do cache
   */
  async getStats() {
    let totalSize = 0;
    let oldestEntry = Date.now();
    let newestEntry = 0;
    
    for (const entry of this.memoryCache.values()) {
      totalSize += entry.size;
      oldestEntry = Math.min(oldestEntry, entry.expiresAt - (this.config.lifetime * 1000));
      newestEntry = Math.max(newestEntry, entry.expiresAt - (this.config.lifetime * 1000));
    }
    
    return {
      enabled: this.config.enabled,
      entries: this.memoryCache.size,
      totalSize,
      maxSize: this.config.maxSize,
      usagePercentage: (totalSize / this.config.maxSize * 100).toFixed(2) + '%',
      oldestEntry: new Date(oldestEntry).toISOString(),
      newestEntry: new Date(newestEntry).toISOString(),
      directory: this.config.directory
    };
  }
}

module.exports = CacheSystem;