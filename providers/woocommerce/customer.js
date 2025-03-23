/**
 * WooCommerce Customer Management Module
 * 
 * Implementa gerenciamento de clientes na API WooCommerce.
 */

class CustomerManager {
  /**
   * Construtor do gerenciador de clientes
   * @param {Object} api Instância da API WooCommerce
   */
  constructor(api) {
    this.api = api;
    this.endpoint = 'customers';
  }

  /**
   * Lista clientes
   * @param {Object} options Opções de filtragem
   * @returns {Promise<Array>} Lista de clientes
   */
  async list(options = {}) {
    try {
      // Se solicitado todos os clientes, usa o método getAll
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
   * Obtém detalhes de um cliente
   * @param {number} id ID do cliente
   * @returns {Promise<Object>} Detalhes do cliente
   */
  async get(id) {
    try {
      return await this.api.get(`${this.endpoint}/${id}`);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Cria um novo cliente
   * @param {Object} customerData Dados do cliente
   * @returns {Promise<Object>} Cliente criado
   */
  async create(customerData) {
    try {
      return await this.api.post(this.endpoint, customerData);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Atualiza um cliente existente
   * @param {number} id ID do cliente
   * @param {Object} customerData Dados do cliente
   * @returns {Promise<Object>} Cliente atualizado
   */
  async update(id, customerData) {
    try {
      return await this.api.put(`${this.endpoint}/${id}`, customerData);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Remove um cliente
   * @param {number} id ID do cliente
   * @param {boolean} force Forçar exclusão
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
   * Busca cliente por email
   * @param {string} email Email do cliente
   * @returns {Promise<Object|null>} Cliente encontrado ou null
   */
  async findByEmail(email) {
    try {
      const customers = await this.list({ email });
      return customers && customers.length > 0 ? customers[0] : null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtém pedidos de um cliente
   * @param {number} customerId ID do cliente
   * @param {Object} options Opções de filtragem
   * @returns {Promise<Array>} Lista de pedidos
   */
  async getOrders(customerId, options = {}) {
    try {
      const params = {
        ...options,
        customer: customerId
      };
      return await this.api.get('orders', params);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtém downloads disponíveis para um cliente
   * @param {number} customerId ID do cliente
   * @returns {Promise<Array>} Lista de downloads
   */
  async getDownloads(customerId) {
    try {
      return await this.api.get(`${this.endpoint}/${customerId}/downloads`);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Cria operações em lote para clientes
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

module.exports = CustomerManager;