/**
 * Modelo de Template para o Site Design System
 * 
 * Representa um template completo que pode ser aplicado a um site
 */
class Template {
  /**
   * Cria uma instância de template
   * 
   * @param {Object} data Dados do template
   * @param {string} data.id Identificador único do template
   * @param {string} data.name Nome do template
   * @param {string} data.description Descrição do template
   * @param {string} data.category Categoria do template (ecommerce, blog, etc)
   * @param {string} data.thumbnail URL da miniatura do template
   * @param {Object} data.theme Tema associado ao template
   * @param {Object} data.layout Configurações de layout
   * @param {Array} data.components Componentes incluídos
   * @param {Object} data.metadata Metadados adicionais
   */
  constructor(data = {}) {
    this.id = data.id || this._generateId();
    this.name = data.name || '';
    this.description = data.description || '';
    this.category = data.category || 'general';
    this.thumbnail = data.thumbnail || '';
    this.theme = data.theme || {};
    this.layout = data.layout || {};
    this.components = data.components || [];
    this.metadata = data.metadata || {};
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  /**
   * Gera um ID único para o template
   * @private
   * @returns {string} ID único
   */
  _generateId() {
    return 'tmpl_' + Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  /**
   * Converte o template para um objeto simples
   * @returns {Object} Representação do template como objeto simples
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      category: this.category,
      thumbnail: this.thumbnail,
      theme: this.theme,
      layout: this.layout,
      components: this.components,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = Template;