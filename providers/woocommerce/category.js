/**
 * WooCommerce Category Management Module
 * 
 * Implementa gerenciamento de categorias de produtos na API WooCommerce.
 */

class CategoryManager {
  /**
   * Construtor do gerenciador de categorias
   * @param {Object} api Instância da API WooCommerce
   */
  constructor(api) {
    this.api = api;
    this.endpoint = 'products/categories';
  }

  /**
   * Lista categorias
   * @param {Object} options Opções de filtragem
   * @returns {Promise<Array>} Lista de categorias
   */
  async list(options = {}) {
    try {
      // Se solicitado todas as categorias, usa o método getAll
      if (options.all === true) {
        delete options.all;
        return await this.api.getAll(this.endpoint, options);
      }
      return await this.api.get(this.endpoint, options);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtém detalhes de uma categoria
   * @param {number} id ID da categoria
   * @returns {Promise<Object>} Detalhes da categoria
   */
  async get(id) {
    try {
      return await this.api.get(`${this.endpoint}/${id}`);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Cria uma nova categoria
   * @param {Object} categoryData Dados da categoria
   * @returns {Promise<Object>} Categoria criada
   */
  async create(categoryData) {
    try {
      return await this.api.post(this.endpoint, categoryData);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Atualiza uma categoria existente
   * @param {number} id ID da categoria
   * @param {Object} categoryData Dados da categoria
   * @returns {Promise<Object>} Categoria atualizada
   */
  async update(id, categoryData) {
    try {
      return await this.api.put(`${this.endpoint}/${id}`, categoryData);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Remove uma categoria
   * @param {number} id ID da categoria
   * @param {boolean} force Forçar exclusão mesmo com produtos associados
   * @returns {Promise<Object>} Resultado da operação
   */
  async delete(id, force = false) {
    try {
      return await this.api.delete(`${this.endpoint}/${id}`, { force });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtém produtos de uma categoria
   * @param {number} categoryId ID da categoria
   * @param {Object} options Opções de filtragem
   * @returns {Promise<Array>} Lista de produtos
   */
  async getProducts(categoryId, options = {}) {
    try {
      const params = {
        ...options,
        category: categoryId
      };
      return await this.api.get('products', params);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtém estrutura hierárquica de categorias
   * @returns {Promise<Array>} Árvore de categorias
   */
  async getHierarchy() {
    try {
      // Obtém todas as categorias
      const categories = await this.list({ all: true });
      
      // Constrói mapa de categorias por ID
      const categoriesMap = {};
      categories.forEach(category => {
        categoriesMap[category.id] = {
          ...category,
          children: []
        };
      });
      
      // Constrói estrutura hierárquica
      const rootCategories = [];
      
      categories.forEach(category => {
        if (category.parent === 0) {
          // Categoria raiz
          rootCategories.push(categoriesMap[category.id]);
        } else {
          // Categoria filha
          if (categoriesMap[category.parent]) {
            categoriesMap[category.parent].children.push(categoriesMap[category.id]);
          }
        }
      });
      
      return rootCategories;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Cria operações em lote para categorias
   * @param {Object} operations Operações de batch (create, update, delete)
   * @returns {Promise<Object>} Resultado das operações
   */
  async batch(operations) {
    try {
      return await this.api.post(`${this.endpoint}/batch`, operations);
    } catch (error) {
      throw error;
    }
  }
}

module.exports = CategoryManager;