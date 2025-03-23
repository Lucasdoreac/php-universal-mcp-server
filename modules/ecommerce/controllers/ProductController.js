/**
 * Controlador de Produtos para o E-commerce Manager Core
 */

const { Product } = require('../models');
const ProductService = require('../services/ProductService');

class ProductController {
  /**
   * Cria uma instância do controlador de produtos
   * @param {Object} options Opções de configuração
   * @param {Object} options.providerManager Gerenciador de provedores
   */
  constructor(options = {}) {
    this.productService = new ProductService(options);
  }

  /**
   * Lista produtos com suporte a filtros e paginação
   * 
   * @param {Object} params Parâmetros da requisição
   * @param {string} params.siteId ID do site
   * @param {Object} params.filter Filtros a serem aplicados
   * @param {number} params.page Página atual (começa em 1)
   * @param {number} params.perPage Itens por página
   * @param {string} params.sortBy Campo para ordenação
   * @param {string} params.sortOrder Direção da ordenação (asc/desc)
   * @returns {Promise<Object>} Resposta com lista de produtos e metadados
   */
  async list(params) {
    try {
      const { siteId, filter = {}, page = 1, perPage = 25, sortBy = 'createdAt', sortOrder = 'desc' } = params;
      
      if (!siteId) {
        throw new Error('ID do site é obrigatório');
      }

      const response = await this.productService.getProducts(siteId, { filter, page, perPage, sortBy, sortOrder });
      
      return {
        success: true,
        data: response.items,
        pagination: {
          total: response.total,
          page,
          perPage,
          totalPages: Math.ceil(response.total / perPage)
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obtém detalhes de um produto específico
   * 
   * @param {Object} params Parâmetros da requisição
   * @param {string} params.siteId ID do site
   * @param {string} params.productId ID do produto
   * @returns {Promise<Object>} Resposta com dados do produto
   */
  async get(params) {
    try {
      const { siteId, productId } = params;
      
      if (!siteId) {
        throw new Error('ID do site é obrigatório');
      }
      
      if (!productId) {
        throw new Error('ID do produto é obrigatório');
      }

      const product = await this.productService.getProductById(siteId, productId);
      
      return {
        success: true,
        data: product
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Cria um novo produto
   * 
   * @param {Object} params Parâmetros da requisição
   * @param {string} params.siteId ID do site
   * @param {Object} params.productData Dados do produto
   * @returns {Promise<Object>} Resposta com o produto criado
   */
  async create(params) {
    try {
      const { siteId, productData } = params;
      
      if (!siteId) {
        throw new Error('ID do site é obrigatório');
      }
      
      if (!productData) {
        throw new Error('Dados do produto são obrigatórios');
      }

      // Cria uma instância do modelo para validação
      const product = new Product(productData);
      const validation = product.validate();
      
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Dados de produto inválidos',
          validationErrors: validation.errors
        };
      }

      const createdProduct = await this.productService.createProduct(siteId, product);
      
      return {
        success: true,
        data: createdProduct
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Atualiza um produto existente
   * 
   * @param {Object} params Parâmetros da requisição
   * @param {string} params.siteId ID do site
   * @param {string} params.productId ID do produto
   * @param {Object} params.updates Dados a serem atualizados
   * @returns {Promise<Object>} Resposta com o produto atualizado
   */
  async update(params) {
    try {
      const { siteId, productId, updates } = params;
      
      if (!siteId) {
        throw new Error('ID do site é obrigatório');
      }
      
      if (!productId) {
        throw new Error('ID do produto é obrigatório');
      }
      
      if (!updates || Object.keys(updates).length === 0) {
        throw new Error('Dados para atualização são obrigatórios');
      }

      // Busca o produto atual para validar as alterações
      const existingProduct = await this.productService.getProductById(siteId, productId);
      
      // Cria uma instância com os dados atualizados para validação
      const updatedData = { ...existingProduct, ...updates, updatedAt: new Date().toISOString() };
      const productToUpdate = new Product(updatedData);
      
      const validation = productToUpdate.validate();
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Dados de produto inválidos',
          validationErrors: validation.errors
        };
      }

      const updatedProduct = await this.productService.updateProduct(siteId, productId, updates);
      
      return {
        success: true,
        data: updatedProduct
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Remove um produto
   * 
   * @param {Object} params Parâmetros da requisição
   * @param {string} params.siteId ID do site
   * @param {string} params.productId ID do produto
   * @returns {Promise<Object>} Resposta com status da operação
   */
  async delete(params) {
    try {
      const { siteId, productId } = params;
      
      if (!siteId) {
        throw new Error('ID do site é obrigatório');
      }
      
      if (!productId) {
        throw new Error('ID do produto é obrigatório');
      }

      await this.productService.deleteProduct(siteId, productId);
      
      return {
        success: true,
        message: 'Produto removido com sucesso'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = ProductController;