/**
 * Modelo de Desconto/Cupom para o E-commerce Manager Core
 * 
 * Representa um cupom de desconto no sistema unificado de e-commerce
 */
class Discount {
  /**
   * Cria uma nova instância de desconto/cupom
   * 
   * @param {Object} data Dados do desconto
   * @param {string} data.id Identificador único do desconto
   * @param {string} data.code Código do cupom
   * @param {string} data.description Descrição do cupom
   * @param {string} data.type Tipo de desconto ('percentage', 'fixed_cart', 'fixed_product')
   * @param {number} data.amount Valor do desconto
   * @param {string} data.status Status do cupom ('active', 'inactive', 'expired')
   * @param {Date} data.startDate Data de início da validade
   * @param {Date} data.endDate Data de término da validade
   * @param {number} data.usageLimit Limite de uso total
   * @param {number} data.usageCount Contagem atual de uso
   * @param {number} data.usageLimitPerUser Limite de uso por usuário
   * @param {string[]} data.productIds IDs de produtos aplicáveis
   * @param {string[]} data.excludedProductIds IDs de produtos excluídos
   * @param {string[]} data.categoryIds IDs de categorias aplicáveis
   * @param {string[]} data.excludedCategoryIds IDs de categorias excluídas
   * @param {number} data.minimumAmount Valor mínimo de pedido
   * @param {number} data.maximumAmount Valor máximo de pedido
   * @param {Object} data.metadata Metadados adicionais específicos da plataforma
   */
  constructor(data = {}) {
    this.id = data.id || this._generateId();
    this.code = data.code || this._generateCode();
    this.description = data.description || '';
    this.type = data.type || 'percentage'; // percentage, fixed_cart, fixed_product
    this.amount = data.amount || 0;
    this.status = data.status || 'active'; // active, inactive, expired
    this.startDate = data.startDate || new Date().toISOString();
    this.endDate = data.endDate || null;
    this.usageLimit = data.usageLimit || null;
    this.usageCount = data.usageCount || 0;
    this.usageLimitPerUser = data.usageLimitPerUser || null;
    this.productIds = data.productIds || [];
    this.excludedProductIds = data.excludedProductIds || [];
    this.categoryIds = data.categoryIds || [];
    this.excludedCategoryIds = data.excludedCategoryIds || [];
    this.minimumAmount = data.minimumAmount || 0;
    this.maximumAmount = data.maximumAmount || null;
    this.metadata = data.metadata || {};
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  /**
   * Gera um ID único para o desconto
   * @private
   * @returns {string} ID único
   */
  _generateId() {
    return 'disc_' + Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  /**
   * Gera um código de cupom aleatório
   * @private
   * @returns {string} Código de cupom
   */
  _generateCode() {
    // Gera um código de cupom de 8 caracteres
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
  }

  /**
   * Verifica se o cupom está válido para uso
   * @returns {boolean} Se o cupom está válido
   */
  isValid() {
    // Verifica status
    if (this.status !== 'active') return false;
    
    // Verifica data de validade
    const now = new Date();
    if (this.endDate && new Date(this.endDate) < now) return false;
    
    // Verifica limite de uso
    if (this.usageLimit !== null && this.usageCount >= this.usageLimit) return false;
    
    return true;
  }

  /**
   * Verifica se o cupom é aplicável a um carrinho específico
   * @param {Object} cart Dados do carrinho
   * @returns {Object} Resultado da verificação {isApplicable: boolean, reason: string}
   */
  isApplicableToCart(cart) {
    // Verifica valor mínimo do pedido
    if (cart.total < this.minimumAmount) {
      return {
        isApplicable: false,
        reason: `O valor mínimo para este cupom é ${this.minimumAmount}`
      };
    }
    
    // Verifica valor máximo do pedido
    if (this.maximumAmount !== null && cart.total > this.maximumAmount) {
      return {
        isApplicable: false,
        reason: `O valor máximo para este cupom é ${this.maximumAmount}`
      };
    }
    
    // Verifica se há produtos aplicáveis no carrinho
    if (this.productIds.length > 0) {
      const hasApplicableProduct = cart.items.some(item => 
        this.productIds.includes(item.productId)
      );
      
      if (!hasApplicableProduct) {
        return {
          isApplicable: false,
          reason: 'Este cupom não é aplicável aos produtos do carrinho'
        };
      }
    }
    
    // Verifica produtos excluídos
    if (this.excludedProductIds.length > 0) {
      const hasExcludedProduct = cart.items.some(item => 
        this.excludedProductIds.includes(item.productId)
      );
      
      if (hasExcludedProduct) {
        return {
          isApplicable: false,
          reason: 'Este cupom não pode ser aplicado a um ou mais produtos do carrinho'
        };
      }
    }
    
    return {
      isApplicable: true
    };
  }

  /**
   * Calcula o valor de desconto para um carrinho
   * @param {Object} cart Dados do carrinho
   * @returns {number} Valor do desconto
   */
  calculateDiscountValue(cart) {
    if (!this.isValid()) return 0;
    
    const applicability = this.isApplicableToCart(cart);
    if (!applicability.isApplicable) return 0;
    
    let discountValue = 0;
    
    switch (this.type) {
      case 'percentage':
        discountValue = cart.total * (this.amount / 100);
        break;
        
      case 'fixed_cart':
        discountValue = this.amount;
        // Não permitir desconto maior que o total
        if (discountValue > cart.total) discountValue = cart.total;
        break;
        
      case 'fixed_product':
        // Para cada item aplicável, calcula o desconto
        cart.items.forEach(item => {
          // Verifica se o produto está na lista de produtos aplicáveis (ou se a lista está vazia)
          const isApplicable = this.productIds.length === 0 || 
                               this.productIds.includes(item.productId);
                               
          // Verifica se o produto não está na lista de excluídos
          const isExcluded = this.excludedProductIds.includes(item.productId);
          
          if (isApplicable && !isExcluded) {
            // Calcula o desconto para cada unidade do produto
            const itemDiscount = this.amount * item.quantity;
            // Não permitir desconto maior que o preço do item
            const maxDiscount = item.price * item.quantity;
            discountValue += Math.min(itemDiscount, maxDiscount);
          }
        });
        break;
    }
    
    return discountValue;
  }

  /**
   * Incrementa o contador de uso do cupom
   */
  incrementUsage() {
    this.usageCount += 1;
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Valida os dados do desconto
   * @returns {Object} Resultado da validação {isValid: boolean, errors: string[]}
   */
  validate() {
    const errors = [];

    if (!this.code || this.code.trim() === '') {
      errors.push('O código do cupom é obrigatório');
    }

    if (!['percentage', 'fixed_cart', 'fixed_product'].includes(this.type)) {
      errors.push('O tipo de desconto deve ser percentage, fixed_cart ou fixed_product');
    }

    if (this.amount < 0) {
      errors.push('O valor do desconto não pode ser negativo');
    }

    if (this.type === 'percentage' && this.amount > 100) {
      errors.push('O valor do desconto percentual não pode ser maior que 100%');
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * Converte o desconto para um formato adequado para uma plataforma específica
   * @param {string} platform Nome da plataforma (woocommerce, shopify, etc)
   * @returns {Object} Dados formatados para a plataforma
   */
  toPlatformFormat(platform) {
    // Implementação base que pode ser estendida por adaptadores específicos
    return {
      ...this,
      platform
    };
  }

  /**
   * Converte o desconto para um objeto simples
   * @returns {Object} Representação do desconto como objeto simples
   */
  toJSON() {
    return {
      id: this.id,
      code: this.code,
      description: this.description,
      type: this.type,
      amount: this.amount,
      status: this.status,
      startDate: this.startDate,
      endDate: this.endDate,
      usageLimit: this.usageLimit,
      usageCount: this.usageCount,
      usageLimitPerUser: this.usageLimitPerUser,
      productIds: this.productIds,
      excludedProductIds: this.excludedProductIds,
      categoryIds: this.categoryIds,
      excludedCategoryIds: this.excludedCategoryIds,
      minimumAmount: this.minimumAmount,
      maximumAmount: this.maximumAmount,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Cria uma instância de desconto a partir de um objeto específico de plataforma
   * @param {Object} platformData Dados da plataforma
   * @param {string} platform Nome da plataforma
   * @returns {Discount} Nova instância de desconto
   */
  static fromPlatformFormat(platformData, platform) {
    // Implementação base que pode ser estendida por adaptadores específicos
    return new Discount({
      ...platformData,
      metadata: { platform, originalData: platformData }
    });
  }
}

module.exports = Discount;