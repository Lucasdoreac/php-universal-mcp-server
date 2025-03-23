/**
 * Serviço de Categorias para o E-commerce Manager Core
 * 
 * Responsável por interagir com os diferentes provedores para gerenciar categorias
 */

const { Category } = require('../models');

class CategoryService {
  /**
   * Cria uma instância do serviço de categorias
   * @param {Object} options Opções de configuração
   * @param {Object} options.providerManager Gerenciador de provedores
   */
  constructor(options = {}) {
    this.providerManager = options.providerManager;
    this.cache = options.cache || null;
  }

  /**
   * Obtém o provedor apropriado para um site
   * @param {string} siteId ID do site
   * @returns {Object} Instância do provedor
   * @private
   */
  async _getProviderForSite(siteId) {
    if (!this.providerManager) {
      throw new Error('Gerenciador de provedores não configurado');
    }
    
    return this.providerManager.getProviderForSite(siteId);
  }

  /**
   * Lista categorias com suporte a filtros
   * 
   * @param {string} siteId ID do site
   * @param {Object} filter Filtros a serem aplicados
   * @returns {Promise<Category[]>} Lista de categorias
   */
  async getCategories(siteId, filter = {}) {
    // Verifica se as categorias estão em cache
    const cacheKey = `categories:${siteId}:${JSON.stringify(filter)}`;
    if (this.cache) {
      const cachedCategories = await this.cache.get(cacheKey);
      if (cachedCategories) {
        return cachedCategories.map(data => new Category(data));
      }
    }
    
    const provider = await this._getProviderForSite(siteId);
    const platformCategories = await provider.getCategories(filter);
    
    // Converte as categorias para o formato padrão do sistema
    const categories = platformCategories.map(item => {
      return Category.fromPlatformFormat(item, provider.platform);
    });
    
    // Armazena em cache
    if (this.cache) {
      await this.cache.set(cacheKey, categories.map(cat => cat.toJSON()), 3600); // Cache por 1 hora
    }
    
    return categories;
  }

  /**
   * Obtém detalhes de uma categoria específica
   * 
   * @param {string} siteId ID do site
   * @param {string} categoryId ID da categoria
   * @returns {Promise<Category>} Instância da categoria
   */
  async getCategoryById(siteId, categoryId) {
    // Verifica se a categoria está em cache
    const cacheKey = `category:${siteId}:${categoryId}`;
    if (this.cache) {
      const cachedCategory = await this.cache.get(cacheKey);
      if (cachedCategory) {
        return new Category(cachedCategory);
      }
    }
    
    const provider = await this._getProviderForSite(siteId);
    const platformCategory = await provider.getCategoryById(categoryId);
    
    if (!platformCategory) {
      throw new Error(`Categoria não encontrada: ${categoryId}`);
    }
    
    // Converte para o formato padrão do sistema
    const category = Category.fromPlatformFormat(platformCategory, provider.platform);
    
    // Armazena em cache
    if (this.cache) {
      await this.cache.set(cacheKey, category.toJSON(), 3600); // Cache por 1 hora
    }
    
    return category;
  }

  /**
   * Cria uma nova categoria
   * 
   * @param {string} siteId ID do site
   * @param {Category} category Dados da categoria
   * @returns {Promise<Category>} Categoria criada
   */
  async createCategory(siteId, category) {
    const provider = await this._getProviderForSite(siteId);
    
    // Converte para o formato específico da plataforma
    const platformData = category.toPlatformFormat(provider.platform);
    
    // Cria a categoria na plataforma
    const createdPlatformCategory = await provider.createCategory(platformData);
    
    // Converte de volta para o formato padrão do sistema
    const createdCategory = Category.fromPlatformFormat(createdPlatformCategory, provider.platform);
    
    // Invalida o cache de lista de categorias
    if (this.cache) {
      const listCachePattern = `categories:${siteId}:*`;
      await this.cache.deletePattern(listCachePattern);
    }
    
    return createdCategory;
  }

  /**
   * Atualiza uma categoria existente
   * 
   * @param {string} siteId ID do site
   * @param {string} categoryId ID da categoria
   * @param {Object} updates Dados a serem atualizados
   * @returns {Promise<Category>} Categoria atualizada
   */
  async updateCategory(siteId, categoryId, updates) {
    const provider = await this._getProviderForSite(siteId);
    
    // Obtém a categoria atual para mesclar com as atualizações
    const existingCategory = await this.getCategoryById(siteId, categoryId);
    
    // Cria uma nova instância com os dados mesclados
    const updatedCategory = new Category({
      ...existingCategory.toJSON(),
      ...updates,
      updatedAt: new Date().toISOString()
    });
    
    // Converte para o formato específico da plataforma
    const platformData = updatedCategory.toPlatformFormat(provider.platform);
    
    // Atualiza a categoria na plataforma
    const updatedPlatformCategory = await provider.updateCategory(categoryId, platformData);
    
    // Converte de volta para o formato padrão do sistema
    const result = Category.fromPlatformFormat(updatedPlatformCategory, provider.platform);
    
    // Atualiza o cache se disponível
    if (this.cache) {
      const cacheKey = `category:${siteId}:${categoryId}`;
      await this.cache.set(cacheKey, result.toJSON(), 3600); // Cache por 1 hora
      
      // Invalida o cache de lista de categorias
      const listCachePattern = `categories:${siteId}:*`;
      await this.cache.deletePattern(listCachePattern);
    }
    
    return result;
  }

  /**
   * Remove uma categoria
   * 
   * @param {string} siteId ID do site
   * @param {string} categoryId ID da categoria
   * @returns {Promise<boolean>} Status da operação
   */
  async deleteCategory(siteId, categoryId) {
    const provider = await this._getProviderForSite(siteId);
    
    // Remove a categoria na plataforma
    const result = await provider.deleteCategory(categoryId);
    
    // Remove do cache se disponível
    if (this.cache) {
      const cacheKey = `category:${siteId}:${categoryId}`;
      await this.cache.delete(cacheKey);
      
      // Invalida o cache de lista de categorias
      const listCachePattern = `categories:${siteId}:*`;
      await this.cache.deletePattern(listCachePattern);
    }
    
    return result;
  }
}

module.exports = CategoryService;