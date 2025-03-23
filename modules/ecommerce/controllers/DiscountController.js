/**
 * Controlador de Descontos/Cupons para o E-commerce Manager Core
 */

const { Discount } = require('../models');
const DiscountService = require('../services/DiscountService');

class DiscountController {
  /**
   * Cria uma instância do controlador de descontos
   * @param {Object} options Opções de configuração
   * @param {Object} options.providerManager Gerenciador de provedores
   */
  constructor(options = {}) {
    this.discountService = new DiscountService(options);
  }

  /**
   * Lista cupons de desconto com suporte a filtros e paginação
   * 
   * @param {Object} params Parâmetros da requisição
   * @param {string} params.siteId ID do site
   * @param {Object} params.filter Filtros a serem aplicados
   * @param {number} params.page Página atual (começa em 1)
   * @param {number} params.perPage Itens por página
   * @returns {Promise<Object>} Resposta com lista de cupons e metadados
   */
  async list(params) {
    try {
      const { siteId, filter = {}, page = 1, perPage = 25 } = params;
      
      if (!siteId) {
        throw new Error('ID do site é obrigatório');
      }

      const response = await this.discountService.getDiscounts(siteId, { filter, page, perPage });
      
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
   * Obtém detalhes de um cupom específico
   * 
   * @param {Object} params Parâmetros da requisição
   * @param {string} params.siteId ID do site
   * @param {string} params.discountId ID do cupom
   * @returns {Promise<Object>} Resposta com dados do cupom
   */
  async get(params) {
    try {
      const { siteId, discountId } = params;
      
      if (!siteId) {
        throw new Error('ID do site é obrigatório');
      }
      
      if (!discountId) {
        throw new Error('ID do cupom é obrigatório');
      }

      const discount = await this.discountService.getDiscountById(siteId, discountId);
      
      return {
        success: true,
        data: discount
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Cria um novo cupom de desconto
   * 
   * @param {Object} params Parâmetros da requisição
   * @param {string} params.siteId ID do site
   * @param {Object} params.discountData Dados do cupom
   * @returns {Promise<Object>} Resposta com o cupom criado
   */
  async create(params) {
    try {
      const { siteId, discountData } = params;
      
      if (!siteId) {
        throw new Error('ID do site é obrigatório');
      }
      
      if (!discountData) {
        throw new Error('Dados do cupom são obrigatórios');
      }

      // Cria uma instância do modelo para validação
      const discount = new Discount(discountData);
      const validation = discount.validate();
      
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Dados de cupom inválidos',
          validationErrors: validation.errors
        };
      }

      const createdDiscount = await this.discountService.createDiscount(siteId, discount);
      
      return {
        success: true,
        data: createdDiscount
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Atualiza um cupom existente
   * 
   * @param {Object} params Parâmetros da requisição
   * @param {string} params.siteId ID do site
   * @param {string} params.discountId ID do cupom
   * @param {Object} params.updates Dados a serem atualizados
   * @returns {Promise<Object>} Resposta com o cupom atualizado
   */
  async update(params) {
    try {
      const { siteId, discountId, updates } = params;
      
      if (!siteId) {
        throw new Error('ID do site é obrigatório');
      }
      
      if (!discountId) {
        throw new Error('ID do cupom é obrigatório');
      }
      
      if (!updates || Object.keys(updates).length === 0) {
        throw new Error('Dados para atualização são obrigatórios');
      }

      // Busca o cupom atual para validar as alterações
      const existingDiscount = await this.discountService.getDiscountById(siteId, discountId);
      
      // Cria uma instância com os dados atualizados para validação
      const updatedData = { ...existingDiscount, ...updates, updatedAt: new Date().toISOString() };
      const discountToUpdate = new Discount(updatedData);
      
      const validation = discountToUpdate.validate();
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Dados de cupom inválidos',
          validationErrors: validation.errors
        };
      }

      const updatedDiscount = await this.discountService.updateDiscount(siteId, discountId, updates);
      
      return {
        success: true,
        data: updatedDiscount
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Remove um cupom
   * 
   * @param {Object} params Parâmetros da requisição
   * @param {string} params.siteId ID do site
   * @param {string} params.discountId ID do cupom
   * @returns {Promise<Object>} Resposta com status da operação
   */
  async delete(params) {
    try {
      const { siteId, discountId } = params;
      
      if (!siteId) {
        throw new Error('ID do site é obrigatório');
      }
      
      if (!discountId) {
        throw new Error('ID do cupom é obrigatório');
      }

      await this.discountService.deleteDiscount(siteId, discountId);
      
      return {
        success: true,
        message: 'Cupom removido com sucesso'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Valida um cupom para um carrinho
   * 
   * @param {Object} params Parâmetros da requisição
   * @param {string} params.siteId ID do site
   * @param {string} params.code Código do cupom
   * @param {Object} params.cart Dados do carrinho
   * @returns {Promise<Object>} Resposta com validação do cupom
   */
  async validate(params) {
    try {
      const { siteId, code, cart } = params;
      
      if (!siteId) {
        throw new Error('ID do site é obrigatório');
      }
      
      if (!code) {
        throw new Error('Código do cupom é obrigatório');
      }
      
      if (!cart) {
        throw new Error('Dados do carrinho são obrigatórios');
      }

      const validation = await this.discountService.validateDiscountCode(siteId, code, cart);
      
      return {
        success: true,
        data: validation
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = DiscountController;