/**
 * Modelo de Categoria para o E-commerce Manager Core
 * 
 * Representa uma categoria de produtos no sistema unificado de e-commerce
 */
class Category {
  /**
   * Cria uma nova instância de categoria
   * 
   * @param {Object} data Dados da categoria
   * @param {string} data.id Identificador único da categoria
   * @param {string} data.name Nome da categoria
   * @param {string} data.description Descrição da categoria
   * @param {string} data.slug Slug para URL
   * @param {string} data.parentId ID da categoria pai (se for subcategoria)
   * @param {number} data.order Ordem de exibição
   * @param {Object} data.image Imagem da categoria
   * @param {Object} data.metadata Metadados adicionais específicos da plataforma
   */
  constructor(data = {}) {
    this.id = data.id || this._generateId();
    this.name = data.name || '';
    this.description = data.description || '';
    this.slug = data.slug || this._generateSlug(data.name || '');
    this.parentId = data.parentId || null;
    this.order = data.order || 0;
    this.image = data.image || null;
    this.metadata = data.metadata || {};
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  /**
   * Gera um ID único para a categoria
   * @private
   * @returns {string} ID único
   */
  _generateId() {
    return 'cat_' + Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  /**
   * Gera um slug a partir do nome da categoria
   * @private
   * @param {string} name Nome da categoria
   * @returns {string} Slug para URL
   */
  _generateSlug(name) {
    return name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  /**
   * Valida os dados da categoria
   * @returns {Object} Resultado da validação {isValid: boolean, errors: string[]}
   */
  validate() {
    const errors = [];

    if (!this.name || this.name.trim() === '') {
      errors.push('O nome da categoria é obrigatório');
    }

    if (!this.slug || this.slug.trim() === '') {
      errors.push('O slug da categoria é obrigatório');
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * Converte a categoria para um formato adequado para uma plataforma específica
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
   * Converte a categoria para um objeto simples
   * @returns {Object} Representação da categoria como objeto simples
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      slug: this.slug,
      parentId: this.parentId,
      order: this.order,
      image: this.image,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Cria uma instância de categoria a partir de um objeto específico de plataforma
   * @param {Object} platformData Dados da plataforma
   * @param {string} platform Nome da plataforma
   * @returns {Category} Nova instância de categoria
   */
  static fromPlatformFormat(platformData, platform) {
    // Implementação base que pode ser estendida por adaptadores específicos
    return new Category({
      ...platformData,
      metadata: { platform, originalData: platformData }
    });
  }
}

module.exports = Category;