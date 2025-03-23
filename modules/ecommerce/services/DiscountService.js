/**
 * Serviço de Descontos/Cupons para o E-commerce Manager Core
 * 
 * Responsável por interagir com os diferentes provedores para gerenciar cupons
 */

const { Discount } = require('../models');

class DiscountService {
  /**
   * Cria uma instância do serviço de descontos
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
   * Lista cupons de desconto com suporte a filtros e paginação
   * 
   * @param {string} siteId ID do site
   * @param {Object} options Opções de busca
   * @param {Object} options.filter Filtros a serem aplicados
   * @param {number} options.page Página atual (começa em 1)
   * @param {number} options.perPage Itens por página
   * @returns {Promise<Object>} Resultados paginados com metadados
   */
  async getDiscounts(siteId, options = {}) {
    const provider = await this._getProviderForSite(siteId);
    const platformDiscounts = await provider.getDiscounts(options);
    
    // Converte os cupons para o formato padrão do sistema
    const items = platformDiscounts.items.map(item => {
      return Discount.fromPlatformFormat(item, provider.platform);
    });
    
    return {
      items,
      total: platformDiscounts.total,
      hasMore: platformDiscounts.hasMore
    };
  }

  /**
   * Obtém detalhes de um cupom específico
   * 
   * @param {string} siteId ID do site
   * @param {string} discountId ID do cupom
   * @returns {Promise<Discount>} Instância do cupom
   */
  async getDiscountById(siteId, discountId) {
    // Verifica se o cupom está em cache
    const cacheKey = `discount:${siteId}:${discountId}`;
    if (this.cache) {
      const cachedDiscount = await this.cache.get(cacheKey);
      if (cachedDiscount) {
        return new Discount(cachedDiscount);
      }
    }
    
    const provider = await this._getProviderForSite(siteId);
    const platformDiscount = await provider.getDiscountById(discountId);
    
    if (!platformDiscount) {
      throw new Error(`Cupom não encontrado: ${discountId}`);
    }
    
    // Converte para o formato padrão do sistema
    const discount = Discount.fromPlatformFormat(platformDiscount, provider.platform);
    
    // Armazena em cache
    if (this.cache) {
      await this.cache.set(cacheKey, discount.toJSON(), 3600); // Cache por 1 hora
    }
    
    return discount;
  }

  /**
   * Busca um cupom pelo código
   * 
   * @param {string} siteId ID do site
   * @param {string} code Código do cupom
   * @returns {Promise<Discount>} Instância do cupom
   */
  async getDiscountByCode(siteId, code) {
    // Verifica se o cupom está em cache
    const cacheKey = `discount:${siteId}:code:${code}`;
    if (this.cache) {
      const cachedDiscount = await this.cache.get(cacheKey);
      if (cachedDiscount) {
        return new Discount(cachedDiscount);
      }
    }
    
    const provider = await this._getProviderForSite(siteId);
    const platformDiscount = await provider.getDiscountByCode(code);
    
    if (!platformDiscount) {
      throw new Error(`Cupom não encontrado para o código: ${code}`);
    }
    
    // Converte para o formato padrão do sistema
    const discount = Discount.fromPlatformFormat(platformDiscount, provider.platform);
    
    // Armazena em cache
    if (this.cache) {
      await this.cache.set(cacheKey, discount.toJSON(), 3600); // Cache por 1 hora
      
      // Também armazena pelo ID
      const idCacheKey = `discount:${siteId}:${discount.id}`;
      await this.cache.set(idCacheKey, discount.toJSON(), 3600); // Cache por 1 hora
    }
    
    return discount;
  }

  /**
   * Cria um novo cupom de desconto
   * 
   * @param {string} siteId ID do site
   * @param {Discount} discount Dados do cupom
   * @returns {Promise<Discount>} Cupom criado
   */
  async createDiscount(siteId, discount) {
    const provider = await this._getProviderForSite(siteId);
    
    // Converte para o formato específico da plataforma
    const platformData = discount.toPlatformFormat(provider.platform);
    
    // Cria o cupom na plataforma
    const createdPlatformDiscount = await provider.createDiscount(platformData);
    
    // Converte de volta para o formato padrão do sistema
    const createdDiscount = Discount.fromPlatformFormat(createdPlatformDiscount, provider.platform);
    
    return createdDiscount;
  }

  /**
   * Atualiza um cupom existente
   * 
   * @param {string} siteId ID do site
   * @param {string} discountId ID do cupom
   * @param {Object} updates Dados a serem atualizados
   * @returns {Promise<Discount>} Cupom atualizado
   */
  async updateDiscount(siteId, discountId, updates) {
    const provider = await this._getProviderForSite(siteId);
    
    // Obtém o cupom atual para mesclar com as atualizações
    const existingDiscount = await this.getDiscountById(siteId, discountId);
    
    // Cria uma nova instância com os dados mesclados
    const updatedDiscount = new Discount({
      ...existingDiscount.toJSON(),
      ...updates,
      updatedAt: new Date().toISOString()
    });
    
    // Converte para o formato específico da plataforma
    const platformData = updatedDiscount.toPlatformFormat(provider.platform);
    
    // Atualiza o cupom na plataforma
    const updatedPlatformDiscount = await provider.updateDiscount(discountId, platformData);
    
    // Converte de volta para o formato padrão do sistema
    const result = Discount.fromPlatformFormat(updatedPlatformDiscount, provider.platform);
    
    // Atualiza o cache se disponível
    if (this.cache) {
      const cacheKey = `discount:${siteId}:${discountId}`;
      await this.cache.set(cacheKey, result.toJSON(), 3600); // Cache por 1 hora
      
      // Também atualiza pelo código se disponível
      if (result.code) {
        const codeCacheKey = `discount:${siteId}:code:${result.code}`;
        await this.cache.set(codeCacheKey, result.toJSON(), 3600); // Cache por 1 hora
      }
    }
    
    return result;
  }

  /**
   * Remove um cupom
   * 
   * @param {string} siteId ID do site
   * @param {string} discountId ID do cupom
   * @returns {Promise<boolean>} Status da operação
   */
  async deleteDiscount(siteId, discountId) {
    // Obtém o cupom para ter acesso ao código (para limpar o cache pelo código também)
    let discountCode = null;
    try {
      const discount = await this.getDiscountById(siteId, discountId);
      discountCode = discount.code;
    } catch (error) {
      // Ignora erros ao buscar o cupom
    }
    
    const provider = await this._getProviderForSite(siteId);
    
    // Remove o cupom na plataforma
    const result = await provider.deleteDiscount(discountId);
    
    // Remove do cache se disponível
    if (this.cache) {
      const cacheKey = `discount:${siteId}:${discountId}`;
      await this.cache.delete(cacheKey);
      
      // Também remove pelo código se disponível
      if (discountCode) {
        const codeCacheKey = `discount:${siteId}:code:${discountCode}`;
        await this.cache.delete(codeCacheKey);
      }
    }
    
    return result;
  }

  /**
   * Valida um cupom para um carrinho
   * 
   * @param {string} siteId ID do site
   * @param {string} code Código do cupom
   * @param {Object} cart Dados do carrinho
   * @returns {Promise<Object>} Resultado da validação
   */
  async validateDiscountCode(siteId, code, cart) {
    let discount;
    
    try {
      discount = await this.getDiscountByCode(siteId, code);
    } catch (error) {
      return {
        isValid: false,
        reason: 'Cupom inválido ou inexistente'
      };
    }
    
    // Verifica se o cupom está válido
    if (!discount.isValid()) {
      return {
        isValid: false,
        reason: 'Cupom expirado ou inativo'
      };
    }
    
    // Verifica se é aplicável ao carrinho
    const applicability = discount.isApplicableToCart(cart);
    if (!applicability.isApplicable) {
      return {
        isValid: false,
        reason: applicability.reason
      };
    }
    
    // Calcula o valor de desconto
    const discountValue = discount.calculateDiscountValue(cart);
    
    return {
      isValid: true,
      discount: discount.toJSON(),
      discountValue,
      originalTotal: cart.total,
      finalTotal: cart.total - discountValue
    };
  }
}

module.exports = DiscountService;