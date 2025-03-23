/**
 * ProductController.js
 * Controlador para gerenciamento de produtos no e-commerce
 */

class ProductController {
  /**
   * Construtor do controlador de produtos
   * @param {Object} options - Opções de configuração
   * @param {Object} options.providers - Provedores disponíveis
   * @param {Object} options.logger - Logger do sistema
   */
  constructor(options = {}) {
    this.providers = options.providers || {};
    this.logger = options.logger || console;
    this.cache = new Map();
  }

  /**
   * Lista produtos de um site específico
   * @param {String} siteId - ID do site
   * @param {Object} filter - Filtros opcionais (categoria, preço, etc)
   * @returns {Promise<Array>} - Lista de produtos
   */
  async list(siteId, filter = {}) {
    try {
      this.logger.info(`Listando produtos para o site ${siteId} com filtros: ${JSON.stringify(filter)}`);
      
      // Identifica o provedor para este site
      const providerType = await this._getProviderType(siteId);
      const provider = this.providers[providerType];
      
      if (!provider) {
        throw new Error(`Provedor não encontrado para o site ${siteId}`);
      }
      
      // Delega a listagem para o provedor específico
      const products = await provider.products.list(siteId, filter);
      
      // Atualiza o cache com os produtos obtidos
      this._updateCache(siteId, products);
      
      return products;
    } catch (error) {
      this.logger.error(`Erro ao listar produtos: ${error.message}`);
      throw error;
    }
  }

  /**
   * Cria um novo produto
   * @param {String} siteId - ID do site
   * @param {Object} productData - Dados do produto a ser criado
   * @returns {Promise<Object>} - Produto criado
   */
  async create(siteId, productData) {
    try {
      this.logger.info(`Criando produto para o site ${siteId}: ${JSON.stringify(productData)}`);
      
      // Validação básica
      if (!productData.name || !productData.price) {
        throw new Error('Nome e preço são obrigatórios para criar um produto');
      }
      
      // Identifica o provedor para este site
      const providerType = await this._getProviderType(siteId);
      const provider = this.providers[providerType];
      
      if (!provider) {
        throw new Error(`Provedor não encontrado para o site ${siteId}`);
      }
      
      // Formata o produto de acordo com o formato esperado pelo provedor
      const formattedProduct = this._formatProductForProvider(productData, providerType);
      
      // Delega a criação para o provedor específico
      const createdProduct = await provider.products.create(siteId, formattedProduct);
      
      // Invalida o cache para este site
      this._invalidateCache(siteId);
      
      return createdProduct;
    } catch (error) {
      this.logger.error(`Erro ao criar produto: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtém detalhes de um produto específico
   * @param {String} siteId - ID do site
   * @param {String} productId - ID do produto
   * @returns {Promise<Object>} - Detalhes do produto
   */
  async get(siteId, productId) {
    try {
      this.logger.info(`Obtendo produto ${productId} do site ${siteId}`);
      
      // Verifica se o produto está no cache
      const cachedProduct = this._getFromCache(siteId, productId);
      if (cachedProduct) {
        return cachedProduct;
      }
      
      // Identifica o provedor para este site
      const providerType = await this._getProviderType(siteId);
      const provider = this.providers[providerType];
      
      if (!provider) {
        throw new Error(`Provedor não encontrado para o site ${siteId}`);
      }
      
      // Delega a obtenção para o provedor específico
      const product = await provider.products.get(siteId, productId);
      
      // Atualiza o cache com o produto obtido
      this._updateCacheItem(siteId, productId, product);
      
      return product;
    } catch (error) {
      this.logger.error(`Erro ao obter produto: ${error.message}`);
      throw error;
    }
  }

  /**
   * Atualiza um produto existente
   * @param {String} siteId - ID do site
   * @param {String} productId - ID do produto
   * @param {Object} updates - Dados a serem atualizados
   * @returns {Promise<Object>} - Produto atualizado
   */
  async update(siteId, productId, updates) {
    try {
      this.logger.info(`Atualizando produto ${productId} do site ${siteId}: ${JSON.stringify(updates)}`);
      
      // Identifica o provedor para este site
      const providerType = await this._getProviderType(siteId);
      const provider = this.providers[providerType];
      
      if (!provider) {
        throw new Error(`Provedor não encontrado para o site ${siteId}`);
      }
      
      // Formata as atualizações de acordo com o formato esperado pelo provedor
      const formattedUpdates = this._formatProductForProvider(updates, providerType);
      
      // Delega a atualização para o provedor específico
      const updatedProduct = await provider.products.update(siteId, productId, formattedUpdates);
      
      // Invalida o cache para este produto
      this._invalidateCacheItem(siteId, productId);
      
      return updatedProduct;
    } catch (error) {
      this.logger.error(`Erro ao atualizar produto: ${error.message}`);
      throw error;
    }
  }

  /**
   * Remove um produto
   * @param {String} siteId - ID do site
   * @param {String} productId - ID do produto
   * @returns {Promise<Boolean>} - Status da remoção
   */
  async delete(siteId, productId) {
    try {
      this.logger.info(`Removendo produto ${productId} do site ${siteId}`);
      
      // Identifica o provedor para este site
      const providerType = await this._getProviderType(siteId);
      const provider = this.providers[providerType];
      
      if (!provider) {
        throw new Error(`Provedor não encontrado para o site ${siteId}`);
      }
      
      // Delega a remoção para o provedor específico
      const result = await provider.products.delete(siteId, productId);
      
      // Invalida o cache para este produto
      this._invalidateCacheItem(siteId, productId);
      
      return result;
    } catch (error) {
      this.logger.error(`Erro ao remover produto: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Determina o tipo de provedor para um site específico
   * @private
   * @param {String} siteId - ID do site
   * @returns {Promise<String>} - Tipo do provedor (ex: 'hostinger', 'woocommerce')
   */
  async _getProviderType(siteId) {
    // TODO: Implementar uma forma de obter o provedor a partir do ID do site
    // Isso poderia vir de um banco de dados ou outro repositório
    
    // Por enquanto, faremos uma simulação simples
    if (siteId.startsWith('woo-')) {
      return 'woocommerce';
    } else if (siteId.startsWith('shop-')) {
      return 'shopify';
    } else {
      return 'hostinger';
    }
  }
  
  /**
   * Formata os dados do produto de acordo com o esperado pelo provedor
   * @private
   * @param {Object} productData - Dados do produto
   * @param {String} providerType - Tipo do provedor
   * @returns {Object} - Produto formatado
   */
  _formatProductForProvider(productData, providerType) {
    // Cria uma cópia para não modificar o original
    const formatted = { ...productData };
    
    // Formata de acordo com o provedor
    switch (providerType) {
      case 'woocommerce':
        // WooCommerce espera alguns campos específicos
        if (formatted.price) {
          formatted.regular_price = formatted.price.toString();
          delete formatted.price;
        }
        break;
        
      case 'shopify':
        // Shopify tem uma estrutura diferente
        if (formatted.price) {
          formatted.variants = [{ price: formatted.price.toString() }];
          delete formatted.price;
        }
        break;
        
      default:
        // Mantém o formato original para outros provedores
        break;
    }
    
    return formatted;
  }
  
  /**
   * Métodos de gerenciamento de cache
   */
  _getFromCache(siteId, productId) {
    const siteCacheKey = `site_${siteId}`;
    const siteCache = this.cache.get(siteCacheKey);
    
    if (siteCache && siteCache.products) {
      return siteCache.products.find(p => p.id == productId);
    }
    
    return null;
  }
  
  _updateCache(siteId, products) {
    const siteCacheKey = `site_${siteId}`;
    this.cache.set(siteCacheKey, { products, timestamp: Date.now() });
  }
  
  _updateCacheItem(siteId, productId, product) {
    const siteCacheKey = `site_${siteId}`;
    const siteCache = this.cache.get(siteCacheKey) || { products: [], timestamp: 0 };
    
    // Remove o produto antigo se existir
    siteCache.products = siteCache.products.filter(p => p.id != productId);
    
    // Adiciona o novo produto
    siteCache.products.push(product);
    siteCache.timestamp = Date.now();
    
    this.cache.set(siteCacheKey, siteCache);
  }
  
  _invalidateCache(siteId) {
    const siteCacheKey = `site_${siteId}`;
    this.cache.delete(siteCacheKey);
  }
  
  _invalidateCacheItem(siteId, productId) {
    const siteCacheKey = `site_${siteId}`;
    const siteCache = this.cache.get(siteCacheKey);
    
    if (siteCache && siteCache.products) {
      siteCache.products = siteCache.products.filter(p => p.id != productId);
      siteCache.timestamp = Date.now();
      this.cache.set(siteCacheKey, siteCache);
    }
  }
}

module.exports = ProductController;
