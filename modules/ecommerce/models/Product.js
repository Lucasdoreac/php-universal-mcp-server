/**
 * Modelo de Produto para o E-commerce Manager Core
 * 
 * Representa um produto no sistema unificado de e-commerce,
 * com suporte a diferentes plataformas (WooCommerce, Shopify, etc.)
 */
class Product {
  /**
   * Cria uma nova instância de produto
   * 
   * @param {Object} data Dados do produto
   * @param {string} data.id Identificador único do produto (opcional, gerado automaticamente se não fornecido)
   * @param {string} data.name Nome do produto
   * @param {string} data.description Descrição detalhada do produto
   * @param {string} data.shortDescription Descrição curta do produto
   * @param {number} data.price Preço regular do produto
   * @param {number} data.salePrice Preço promocional (opcional)
   * @param {string} data.sku Código SKU do produto
   * @param {number} data.stockQuantity Quantidade em estoque
   * @param {boolean} data.manageStock Se o estoque deve ser gerenciado
   * @param {string[]} data.categories Categorias do produto
   * @param {string[]} data.tags Tags do produto
   * @param {Object[]} data.images Lista de imagens do produto
   * @param {Object[]} data.attributes Atributos do produto
   * @param {Object[]} data.variations Variações do produto
   * @param {string} data.status Status do produto (published, draft, etc)
   * @param {Object} data.metadata Metadados adicionais específicos da plataforma
   */
  constructor(data = {}) {
    this.id = data.id || this._generateId();
    this.name = data.name || '';
    this.description = data.description || '';
    this.shortDescription = data.shortDescription || '';
    this.price = data.price || 0;
    this.salePrice = data.salePrice || null;
    this.sku = data.sku || '';
    this.stockQuantity = data.stockQuantity || 0;
    this.manageStock = data.manageStock !== undefined ? data.manageStock : true;
    this.categories = data.categories || [];
    this.tags = data.tags || [];
    this.images = data.images || [];
    this.attributes = data.attributes || [];
    this.variations = data.variations || [];
    this.status = data.status || 'draft';
    this.metadata = data.metadata || {};
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  /**
   * Gera um ID único para o produto
   * @private
   * @returns {string} ID único
   */
  _generateId() {
    return 'prod_' + Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  /**
   * Valida os dados do produto
   * @returns {Object} Resultado da validação {isValid: boolean, errors: string[]}
   */
  validate() {
    const errors = [];

    if (!this.name || this.name.trim() === '') {
      errors.push('O nome do produto é obrigatório');
    }

    if (this.price < 0) {
      errors.push('O preço do produto não pode ser negativo');
    }

    if (this.salePrice !== null && this.salePrice < 0) {
      errors.push('O preço promocional não pode ser negativo');
    }

    if (this.salePrice !== null && this.salePrice > this.price) {
      errors.push('O preço promocional não pode ser maior que o preço regular');
    }

    if (this.manageStock && this.stockQuantity < 0) {
      errors.push('A quantidade em estoque não pode ser negativa');
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * Converte o produto para um formato adequado para uma plataforma específica
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
   * Converte o produto para um objeto simples
   * @returns {Object} Representação do produto como objeto simples
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      shortDescription: this.shortDescription,
      price: this.price,
      salePrice: this.salePrice,
      sku: this.sku,
      stockQuantity: this.stockQuantity,
      manageStock: this.manageStock,
      categories: this.categories,
      tags: this.tags,
      images: this.images,
      attributes: this.attributes,
      variations: this.variations,
      status: this.status,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Cria uma instância de produto a partir de um objeto específico de plataforma
   * @param {Object} platformData Dados da plataforma
   * @param {string} platform Nome da plataforma
   * @returns {Product} Nova instância de produto
   */
  static fromPlatformFormat(platformData, platform) {
    // Esta implementação base deve ser estendida por adaptadores específicos
    return new Product({
      ...platformData,
      metadata: { platform, originalData: platformData }
    });
  }
}

module.exports = Product;