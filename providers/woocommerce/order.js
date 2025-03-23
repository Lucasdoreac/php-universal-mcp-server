/**
 * WooCommerce Order Management Module
 * 
 * Implementa gerenciamento de pedidos na API WooCommerce.
 */

class OrderManager {
  /**
   * Construtor do gerenciador de pedidos
   * @param {Object} api Instância da API WooCommerce
   */
  constructor(api) {
    this.api = api;
    this.endpoint = 'orders';
  }

  /**
   * Lista pedidos
   * @param {Object} options Opções de filtragem
   * @returns {Promise<Array>} Lista de pedidos
   */
  async list(options = {}) {
    try {
      // Se solicitado todos os pedidos, usa o método getAll
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
   * Obtém detalhes de um pedido
   * @param {number} id ID do pedido
   * @returns {Promise<Object>} Detalhes do pedido
   */
  async get(id) {
    try {
      return await this.api.get(`${this.endpoint}/${id}`);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Cria um novo pedido
   * @param {Object} orderData Dados do pedido
   * @returns {Promise<Object>} Pedido criado
   */
  async create(orderData) {
    try {
      return await this.api.post(this.endpoint, orderData);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Atualiza um pedido existente
   * @param {number} id ID do pedido
   * @param {Object} orderData Dados do pedido
   * @returns {Promise<Object>} Pedido atualizado
   */
  async update(id, orderData) {
    try {
      return await this.api.put(`${this.endpoint}/${id}`, orderData);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Atualiza o status de um pedido
   * @param {number} id ID do pedido
   * @param {string} status Novo status do pedido
   * @returns {Promise<Object>} Pedido atualizado
   */
  async updateStatus(id, status) {
    try {
      return await this.update(id, { status });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Remove um pedido
   * @param {number} id ID do pedido
   * @param {boolean} force Forçar exclusão em vez de mover para lixeira
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
   * Obtém notas de um pedido
   * @param {number} orderId ID do pedido
   * @returns {Promise<Array>} Lista de notas
   */
  async getNotes(orderId) {
    try {
      return await this.api.get(`${this.endpoint}/${orderId}/notes`);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Adiciona uma nota a um pedido
   * @param {number} orderId ID do pedido
   * @param {Object} noteData Dados da nota
   * @returns {Promise<Object>} Nota criada
   */
  async addNote(orderId, noteData) {
    try {
      return await this.api.post(`${this.endpoint}/${orderId}/notes`, noteData);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtém reembolsos de um pedido
   * @param {number} orderId ID do pedido
   * @returns {Promise<Array>} Lista de reembolsos
   */
  async getRefunds(orderId) {
    try {
      return await this.api.get(`${this.endpoint}/${orderId}/refunds`);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Cria um reembolso para um pedido
   * @param {number} orderId ID do pedido
   * @param {Object} refundData Dados do reembolso
   * @returns {Promise<Object>} Reembolso criado
   */
  async createRefund(orderId, refundData) {
    try {
      return await this.api.post(`${this.endpoint}/${orderId}/refunds`, refundData);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtém detalhes de um cliente a partir do pedido
   * @param {number} orderId ID do pedido
   * @returns {Promise<Object>} Detalhes do cliente
   */
  async getCustomerFromOrder(orderId) {
    try {
      const order = await this.get(orderId);
      if (order.customer_id === 0) {
        // Cliente convidado
        return {
          id: 0,
          guest: true,
          billing: order.billing,
          shipping: order.shipping
        };
      }
      
      return await this.api.get(`customers/${order.customer_id}`);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtém status possíveis para pedidos
   * @returns {Promise<Object>} Status disponíveis
   */
  async getStatuses() {
    try {
      return await this.api.get('reports/orders/totals');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtém estatísticas de vendas
   * @param {Object} params Parâmetros da consulta
   * @returns {Promise<Object>} Estatísticas de vendas
   */
  async getSalesStats(params = {}) {
    try {
      return await this.api.get('reports/sales', params);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Cria operações em lote para pedidos
   * @param {Object} operations Operações de batch (create, update, delete)
   * @returns {Promise<Object>} Resultado das operações
   */
  async batch(operations) {
    try {
      return await this.api.batch(this.endpoint, operations);
    } catch (error) {
      throw error;
    }
  }
}

module.exports = OrderManager;