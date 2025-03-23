/**
 * Controlador de Categorias para o E-commerce Manager Core
 */

const { Category } = require('../models');
const CategoryService = require('../services/CategoryService');

class CategoryController {
  /**
   * Cria uma instância do controlador de categorias
   * @param {Object} options Opções de configuração
   * @param {Object} options.providerManager Gerenciador de provedores
   */
  constructor(options = {}) {
    this.categoryService = new CategoryService(options);
  }

  /**
   * Lista categorias com suporte a filtros
   * 
   * @param {Object} params Parâmetros da requisição
   * @param {string} params.siteId ID do site
   * @param {Object} params.filter Filtros a serem aplicados
   * @returns {Promise<Object>} Resposta com lista de categorias
   */
  async list(params) {
    try {
      const { siteId, filter = {} } = params;
      
      if (!siteId) {
        throw new Error('ID do site é obrigatório');
      }

      const categories = await this.categoryService.getCategories(siteId, filter);
      
      return {
        success: true,
        data: categories
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obtém detalhes de uma categoria específica
   * 
   * @param {Object} params Parâmetros da requisição
   * @param {string} params.siteId ID do site
   * @param {string} params.categoryId ID da categoria
   * @returns {Promise<Object>} Resposta com dados da categoria
   */
  async get(params) {
    try {
      const { siteId, categoryId } = params;
      
      if (!siteId) {
        throw new Error('ID do site é obrigatório');
      }
      
      if (!categoryId) {
        throw new Error('ID da categoria é obrigatório');
      }

      const category = await this.categoryService.getCategoryById(siteId, categoryId);
      
      return {
        success: true,
        data: category
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Cria uma nova categoria
   * 
   * @param {Object} params Parâmetros da requisição
   * @param {string} params.siteId ID do site
   * @param {Object} params.categoryData Dados da categoria
   * @returns {Promise<Object>} Resposta com a categoria criada
   */
  async create(params) {
    try {
      const { siteId, categoryData } = params;
      
      if (!siteId) {
        throw new Error('ID do site é obrigatório');
      }
      
      if (!categoryData) {
        throw new Error('Dados da categoria são obrigatórios');
      }

      // Cria uma instância do modelo para validação
      const category = new Category(categoryData);
      const validation = category.validate();
      
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Dados de categoria inválidos',
          validationErrors: validation.errors
        };
      }

      const createdCategory = await this.categoryService.createCategory(siteId, category);
      
      return {
        success: true,
        data: createdCategory
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Atualiza uma categoria existente
   * 
   * @param {Object} params Parâmetros da requisição
   * @param {string} params.siteId ID do site
   * @param {string} params.categoryId ID da categoria
   * @param {Object} params.updates Dados a serem atualizados
   * @returns {Promise<Object>} Resposta com a categoria atualizada
   */
  async update(params) {
    try {
      const { siteId, categoryId, updates } = params;
      
      if (!siteId) {
        throw new Error('ID do site é obrigatório');
      }
      
      if (!categoryId) {
        throw new Error('ID da categoria é obrigatório');
      }
      
      if (!updates || Object.keys(updates).length === 0) {
        throw new Error('Dados para atualização são obrigatórios');
      }

      // Busca a categoria atual para validar as alterações
      const existingCategory = await this.categoryService.getCategoryById(siteId, categoryId);
      
      // Cria uma instância com os dados atualizados para validação
      const updatedData = { ...existingCategory, ...updates, updatedAt: new Date().toISOString() };
      const categoryToUpdate = new Category(updatedData);
      
      const validation = categoryToUpdate.validate();
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Dados de categoria inválidos',
          validationErrors: validation.errors
        };
      }

      const updatedCategory = await this.categoryService.updateCategory(siteId, categoryId, updates);
      
      return {
        success: true,
        data: updatedCategory
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Remove uma categoria
   * 
   * @param {Object} params Parâmetros da requisição
   * @param {string} params.siteId ID do site
   * @param {string} params.categoryId ID da categoria
   * @returns {Promise<Object>} Resposta com status da operação
   */
  async delete(params) {
    try {
      const { siteId, categoryId } = params;
      
      if (!siteId) {
        throw new Error('ID do site é obrigatório');
      }
      
      if (!categoryId) {
        throw new Error('ID da categoria é obrigatório');
      }

      await this.categoryService.deleteCategory(siteId, categoryId);
      
      return {
        success: true,
        message: 'Categoria removida com sucesso'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = CategoryController;