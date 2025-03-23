/**
 * Serviço de Produtos para o E-commerce Manager Core
 * 
 * Responsável por interagir com os diferentes provedores para gerenciar produtos
 */

const { Product } = require('../models');

class ProductService {
  /**
   * Cria uma instância do serviço de produtos
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
   * Lista produtos com suporte a filtros e paginação
   * 
   * @param {string} siteId ID do site
   * @param {Object} options Opções de busca
   * @param {Object} options.filter Filtros a serem aplicados
   * @param {number} options.page Página atual (começa em 1)
   * @param {number} options.perPage Itens por página
   * @param {string} options.sortBy Campo para ordenação
   * @param {string} options.sortOrder Direção da ordenação (asc/desc)
   * @returns {Promise<Object>} Resultados paginados com metadados
   */
  async getProducts(siteId, options = {}) {
    const provider = await this._getProviderForSite(siteId);
    const platformProducts = await provider.getProducts(options);
    
    // Converte os produtos para o formato padrão do sistema
    const items = platformProducts.items.map(item => {
      return Product.fromPlatformFormat(item, provider.platform);
    });
    
    return {
      items,
      total: platformProducts.total,
      hasMore: platformProducts.hasMore
    };
  }

  /**
   * Obtém detalhes de um produto específico
   * 
   * @param {string} siteId ID do site
   * @param {string} productId ID do produto
   * @returns {Promise<Product>} Instância do produto
   */
  async getProductById(siteId, productId) {
    // Verifica se o produto está em cache
    const cacheKey = `product:${siteId}:${productId}`;
    if (this.cache) {
      const cachedProduct = await this.cache.get(cacheKey);
      if (cachedProduct) {
        return new Product(cachedProduct);
      }
    }
    
    const provider = await this._getProviderForSite(siteId);
    const platformProduct = await provider.getProductById(productId);
    
    if (!platformProduct) {
      throw new Error(`Produto não encontrado: ${productId}`);
    }
    
    // Converte para o formato padrão do sistema
    const product = Product.fromPlatformFormat(platformProduct, provider.platform);
    
    // Armazena em cache
    if (this.cache) {
      await this.cache.set(cacheKey, product.toJSON(), 3600); // Cache por 1 hora
    }
    
    return product;
  }

  /**
   * Cria um novo produto
   * 
   * @param {string} siteId ID do site
   * @param {Product} product Dados do produto
   * @returns {Promise<Product>} Produto criado
   */
  async createProduct(siteId, product) {
    const provider = await this._getProviderForSite(siteId);
    
    // Converte para o formato específico da plataforma
    const platformData = product.toPlatformFormat(provider.platform);
    
    // Cria o produto na plataforma
    const createdPlatformProduct = await provider.createProduct(platformData);
    
    // Converte de volta para o formato padrão do sistema
    const createdProduct = Product.fromPlatformFormat(createdPlatformProduct, provider.platform);
    
    return createdProduct;
  }

  /**
   * Atualiza um produto existente
   * 
   * @param {string} siteId ID do site
   * @param {string} productId ID do produto
   * @param {Object} updates Dados a serem atualizados
   * @returns {Promise<Product>} Produto atualizado
   */
  async updateProduct(siteId, productId, updates) {
    const provider = await this._getProviderForSite(siteId);
    
    // Obtém o produto atual para mesclar com as atualizações
    const existingProduct = await this.getProductById(siteId, productId);
    
    // Cria uma nova instância com os dados mesclados
    const updatedProduct = new Product({
      ...existingProduct.toJSON(),
      ...updates,
      updatedAt: new Date().toISOString()
    });
    
    // Converte para o formato específico da plataforma
    const platformData = updatedProduct.toPlatformFormat(provider.platform);
    
    // Atualiza o produto na plataforma
    const updatedPlatformProduct = await provider.updateProduct(productId, platformData);
    
    // Converte de volta para o formato padrão do sistema
    const result = Product.fromPlatformFormat(updatedPlatformProduct, provider.platform);
    
    // Atualiza o cache se disponível
    if (this.cache) {
      const cacheKey = `product:${siteId}:${productId}`;
      await this.cache.set(cacheKey, result.toJSON(), 3600); // Cache por 1 hora
    }
    
    return result;
  }

  /**
   * Remove um produto
   * 
   * @param {string} siteId ID do site
   * @param {string} productId ID do produto
   * @returns {Promise<boolean>} Status da operação
   */
  async deleteProduct(siteId, productId) {
    const provider = await this._getProviderForSite(siteId);
    
    // Remove o produto na plataforma
    const result = await provider.deleteProduct(productId);
    
    // Remove do cache se disponível
    if (this.cache) {
      const cacheKey = `product:${siteId}:${productId}`;
      await this.cache.delete(cacheKey);
    }
    
    return result;
  }

  /**
   * Atualiza o estoque de um produto
   * 
   * @param {string} siteId ID do site
   * @param {string} productId ID do produto
   * @param {number} quantity Nova quantidade em estoque
   * @param {Object} options Opções adicionais
   * @returns {Promise<Product>} Produto atualizado
   */
  async updateStock(siteId, productId, quantity, options = {}) {
    const provider = await this._getProviderForSite(siteId);
    
    // Atualiza o estoque na plataforma
    const updatedPlatformProduct = await provider.updateProductStock(productId, quantity, options);
    
    // Converte para o formato padrão do sistema
    const result = Product.fromPlatformFormat(updatedPlatformProduct, provider.platform);
    
    // Atualiza o cache se disponível
    if (this.cache) {
      const cacheKey = `product:${siteId}:${productId}`;
      await this.cache.set(cacheKey, result.toJSON(), 3600); // Cache por 1 hora
    }
    
    return result;
  }

  /**
   * Obtém produtos relacionados
   * 
   * @param {string} siteId ID do site
   * @param {string} productId ID do produto
   * @param {Object} options Opções adicionais
   * @returns {Promise<Product[]>} Lista de produtos relacionados
   */
  async getRelatedProducts(siteId, productId, options = {}) {
    const provider = await this._getProviderForSite(siteId);
    
    // Obtém produtos relacionados na plataforma
    const relatedPlatformProducts = await provider.getRelatedProducts(productId, options);
    
    // Converte para o formato padrão do sistema
    return relatedPlatformProducts.map(item => {
      return Product.fromPlatformFormat(item, provider.platform);
    });
  }
}

module.exports = ProductService;