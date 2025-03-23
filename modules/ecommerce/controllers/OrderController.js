/**
 * Controlador de Pedidos para o E-commerce Manager Core
 */

const { Order } = require('../models');
const OrderService = require('../services/OrderService');

class OrderController {
  /**
   * Cria uma instância do controlador de pedidos
   * @param {Object} options Opções de configuração
   * @param {Object} options.providerManager Gerenciador de provedores
   */
  constructor(options = {}) {
    this.orderService = new OrderService(options);
  }

  /**
   * Lista pedidos com suporte a filtros e paginação
   * 
   * @param {Object} params Parâmetros da requisição
   * @param {string} params.siteId ID do site
   * @param {Object} params.filter Filtros a serem aplicados
   * @param {number} params.page Página atual (começa em 1)
   * @param {number} params.perPage Itens por página
   * @param {string} params.sortBy Campo para ordenação
   * @param {string} params.sortOrder Direção da ordenação (asc/desc)
   * @returns {Promise<Object>} Resposta com lista de pedidos e metadados
   */
  async list(params) {
    try {
      const { siteId, filter = {}, page = 1, perPage = 25, sortBy = 'createdAt', sortOrder = 'desc' } = params;
      
      if (!siteId) {
        throw new Error('ID do site é obrigatório');
      }

      const response = await this.orderService.getOrders(siteId, { filter, page, perPage, sortBy, sortOrder });
      
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
   * Obtém detalhes de um pedido específico
   * 
   * @param {Object} params Parâmetros da requisição
   * @param {string} params.siteId ID do site
   * @param {string} params.orderId ID do pedido
   * @returns {Promise<Object>} Resposta com dados do pedido
   */
  async get(params) {
    try {
      const { siteId, orderId } = params;
      
      if (!siteId) {
        throw new Error('ID do site é obrigatório');
      }
      
      if (!orderId) {
        throw new Error('ID do pedido é obrigatório');
      }

      const order = await this.orderService.getOrderById(siteId, orderId);
      
      return {
        success: true,
        data: order
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Atualiza um pedido existente
   * 
   * @param {Object} params Parâmetros da requisição
   * @param {string} params.siteId ID do site
   * @param {string} params.orderId ID do pedido
   * @param {Object} params.updates Dados a serem atualizados
   * @returns {Promise<Object>} Resposta com o pedido atualizado
   */
  async update(params) {
    try {
      const { siteId, orderId, updates } = params;
      
      if (!siteId) {
        throw new Error('ID do site é obrigatório');
      }
      
      if (!orderId) {
        throw new Error('ID do pedido é obrigatório');
      }
      
      if (!updates || Object.keys(updates).length === 0) {
        throw new Error('Dados para atualização são obrigatórios');
      }

      // Busca o pedido atual para validar as alterações
      const existingOrder = await this.orderService.getOrderById(siteId, orderId);
      
      // Cria uma instância com os dados atualizados para validação
      const updatedData = { ...existingOrder, ...updates, updatedAt: new Date().toISOString() };
      const orderToUpdate = new Order(updatedData);
      
      const validation = orderToUpdate.validate();
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Dados do pedido inválidos',
          validationErrors: validation.errors
        };
      }

      const updatedOrder = await this.orderService.updateOrder(siteId, orderId, updates);
      
      return {
        success: true,
        data: updatedOrder
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Processa uma ação em um pedido
   * 
   * @param {Object} params Parâmetros da requisição
   * @param {string} params.siteId ID do site
   * @param {string} params.orderId ID do pedido
   * @param {string} params.action Ação a ser executada
   * @param {Object} params.actionData Dados adicionais para a ação
   * @returns {Promise<Object>} Resposta com o resultado da ação
   */
  async processAction(params) {
    try {
      const { siteId, orderId, action, actionData = {} } = params;
      
      if (!siteId) {
        throw new Error('ID do site é obrigatório');
      }
      
      if (!orderId) {
        throw new Error('ID do pedido é obrigatório');
      }
      
      if (!action) {
        throw new Error('Ação é obrigatória');
      }

      // Verifica se a ação é válida
      const validActions = ['complete', 'cancel', 'refund', 'add_note', 'update_status'];
      if (!validActions.includes(action)) {
        throw new Error(`Ação inválida. Ações válidas: ${validActions.join(', ')}`);
      }

      // Executa a ação adequada
      let result;
      switch (action) {
        case 'complete':
          result = await this.orderService.completeOrder(siteId, orderId);
          break;
        case 'cancel':
          result = await this.orderService.cancelOrder(siteId, orderId, actionData.reason);
          break;
        case 'refund':
          if (!actionData.amount && !actionData.fullRefund) {
            throw new Error('É necessário informar o valor do reembolso ou indicar reembolso total');
          }
          result = await this.orderService.refundOrder(siteId, orderId, actionData);
          break;
        case 'add_note':
          if (!actionData.note) {
            throw new Error('Nota é obrigatória');
          }
          result = await this.orderService.addOrderNote(siteId, orderId, actionData.note, actionData.isCustomerNote);
          break;
        case 'update_status':
          if (!actionData.status) {
            throw new Error('Status é obrigatório');
          }
          result = await this.orderService.updateOrderStatus(siteId, orderId, actionData.status, actionData.note);
          break;
      }
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Gera relatório de pedidos com estatísticas
   * 
   * @param {Object} params Parâmetros da requisição
   * @param {string} params.siteId ID do site
   * @param {string} params.reportType Tipo de relatório ('sales', 'product_performance', etc)
   * @param {Object} params.dateRange Intervalo de datas
   * @param {Object} params.filter Filtros adicionais
   * @returns {Promise<Object>} Resposta com os dados do relatório
   */
  async generateReport(params) {
    try {
      const { siteId, reportType, dateRange, filter = {} } = params;
      
      if (!siteId) {
        throw new Error('ID do site é obrigatório');
      }
      
      if (!reportType) {
        throw new Error('Tipo de relatório é obrigatório');
      }
      
      if (!dateRange || !dateRange.startDate) {
        throw new Error('Intervalo de datas é obrigatório');
      }

      // Verifica se o tipo de relatório é válido
      const validReportTypes = ['sales', 'product_performance', 'customer_orders', 'shipping_methods', 'payment_methods'];
      if (!validReportTypes.includes(reportType)) {
        throw new Error(`Tipo de relatório inválido. Tipos válidos: ${validReportTypes.join(', ')}`);
      }

      const reportData = await this.orderService.generateReport(siteId, reportType, dateRange, filter);
      
      return {
        success: true,
        data: reportData
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = OrderController;