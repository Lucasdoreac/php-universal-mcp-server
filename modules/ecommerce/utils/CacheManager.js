/**
 * Gerenciador de Cache para o E-commerce Manager Core
 * 
 * Fornece funcionalidades para armazenar e recuperar dados em cache
 */

class CacheManager {
  /**
   * Cria uma instância do gerenciador de cache
   * @param {Object} options Opções de configuração
   * @param {Object} options.storage Implementação de armazenamento (opcional)
   * @param {number} options.defaultTtl Tempo de vida padrão em segundos (opcional)
   */
  constructor(options = {}) {
    this.storage = options.storage || new MemoryStorage();
    this.defaultTtl = options.defaultTtl || 3600; // 1 hora
  }

  /**
   * Armazena um valor no cache
   * 
   * @param {string} key Chave do cache
   * @param {*} value Valor a ser armazenado
   * @param {number} ttl Tempo de vida em segundos (opcional)
   * @returns {Promise<boolean>} Se o valor foi armazenado com sucesso
   */
  async set(key, value, ttl = this.defaultTtl) {
    return this.storage.set(key, value, ttl);
  }

  /**
   * Obtém um valor do cache
   * 
   * @param {string} key Chave do cache
   * @returns {Promise<*>} Valor armazenado ou null se não encontrado ou expirado
   */
  async get(key) {
    return this.storage.get(key);
  }

  /**
   * Remove um valor do cache
   * 
   * @param {string} key Chave do cache
   * @returns {Promise<boolean>} Se o valor foi removido com sucesso
   */
  async delete(key) {
    return this.storage.delete(key);
  }

  /**
   * Remove valores do cache que correspondem a um padrão
   * 
   * @param {string} pattern Padrão de chave (com * como curinga)
   * @returns {Promise<number>} Número de chaves removidas
   */
  async deletePattern(pattern) {
    return this.storage.deletePattern(pattern);
  }

  /**
   * Limpa todo o cache
   * 
   * @returns {Promise<boolean>} Se o cache foi limpo com sucesso
   */
  async clear() {
    return this.storage.clear();
  }
}

/**
 * Implementação de armazenamento em memória
 */
class MemoryStorage {
  constructor() {
    this.cache = new Map();
  }

  async set(key, value, ttl) {
    const expiresAt = ttl ? Date.now() + (ttl * 1000) : null;
    this.cache.set(key, {
      value,
      expiresAt
    });
    return true;
  }

  async get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    // Verifica se expirou
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.value;
  }

  async delete(key) {
    return this.cache.delete(key);
  }

  async deletePattern(pattern) {
    const regex = new RegExp(`^${pattern.replace(/\*/g, '.*')}$`);
    let count = 0;
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }
    
    return count;
  }

  async clear() {
    this.cache.clear();
    return true;
  }
}

module.exports = CacheManager;