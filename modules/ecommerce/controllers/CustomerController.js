/**
 * Controlador de Clientes para o E-commerce Manager Core
 */

const { Customer } = require('../models');
const CustomerService = require('../services/CustomerService');

class CustomerController {
  /**
   * Cria uma instância do controlador de clientes
   * @param {Object} options Opções de configuração
   * @param {Object} options.providerManager Gerenciador de provedores
   */
  constructor(options = {}) {
    this.customerService = new CustomerService(options);
  }

  /**
   * Lista clientes com suporte a filtros e paginação
   * 
   * @param {Object} params Parâmetros da requisição
   * @param {string} params.siteId ID do site
   * @param {Object} params.filter Filtros a serem aplicados
   * @param {number} params.page Página atual (começa em 1)
   * @param {number} params.perPage Itens por página
   * @param {string} params.sortBy Campo para ordenação
   * @param {string} params.sortOrder Direção da ordenação (asc/desc)
   * @returns {Promise<Object>} Resposta com lista de clientes e metadados
   */
  async list(params) {
    try {
      const { siteId, filter = {}, page = 1, perPage = 25, sortBy = 'createdAt', sortOrder = 'desc' } = params;
      
      if (!siteId) {
        throw new Error('ID do site é obrigatório');
      }

      const response = await this.customerService.getCustomers(siteId, { filter, page, perPage, sortBy, sortOrder });
      
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
   * Obtém detalhes de um cliente específico
   * 
   * @param {Object} params Parâmetros da requisição
   * @param {string} params.siteId ID do site
   * @param {string} params.customerId ID do cliente
   * @returns {Promise<Object>} Resposta com dados do cliente
   */
  async get(params) {
    try {
      const { siteId, customerId } = params;
      
      if (!siteId) {
        throw new Error('ID do site é obrigatório');
      }
      
      if (!customerId) {
        throw new Error('ID do cliente é obrigatório');
      }

      const customer = await this.customerService.getCustomerById(siteId, customerId);
      
      return {
        success: true,
        data: customer
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Cria um novo cliente
   * 
   * @param {Object} params Parâmetros da requisição
   * @param {string} params.siteId ID do site
   * @param {Object} params.customerData Dados do cliente
   * @returns {Promise<Object>} Resposta com o cliente criado
   */
  async create(params) {
    try {
      const { siteId, customerData } = params;
      
      if (!siteId) {
        throw new Error('ID do site é obrigatório');
      }
      
      if (!customerData) {
        throw new Error('Dados do cliente são obrigatórios');
      }

      // Cria uma instância do modelo para validação
      const customer = new Customer(customerData);
      const validation = customer.validate();
      
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Dados de cliente inválidos',
          validationErrors: validation.errors
        };
      }

      const createdCustomer = await this.customerService.createCustomer(siteId, customer);
      
      return {
        success: true,
        data: createdCustomer
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Atualiza um cliente existente
   * 
   * @param {Object} params Parâmetros da requisição
   * @param {string} params.siteId ID do site
   * @param {string} params.customerId ID do cliente
   * @param {Object} params.updates Dados a serem atualizados
   * @returns {Promise<Object>} Resposta com o cliente atualizado
   */
  async update(params) {
    try {
      const { siteId, customerId, updates } = params;
      
      if (!siteId) {
        throw new Error('ID do site é obrigatório');
      }
      
      if (!customerId) {
        throw new Error('ID do cliente é obrigatório');
      }
      
      if (!updates || Object.keys(updates).length === 0) {
        throw new Error('Dados para atualização são obrigatórios');
      }

      // Busca o cliente atual para validar as alterações
      const existingCustomer = await this.customerService.getCustomerById(siteId, customerId);
      
      // Cria uma instância com os dados atualizados para validação
      const updatedData = { ...existingCustomer, ...updates, updatedAt: new Date().toISOString() };
      const customerToUpdate = new Customer(updatedData);
      
      const validation = customerToUpdate.validate();
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Dados de cliente inválidos',
          validationErrors: validation.errors
        };
      }

      const updatedCustomer = await this.customerService.updateCustomer(siteId, customerId, updates);
      
      return {
        success: true,
        data: updatedCustomer
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Adiciona um endereço a um cliente
   * 
   * @param {Object} params Parâmetros da requisição
   * @param {string} params.siteId ID do site
   * @param {string} params.customerId ID do cliente
   * @param {Object} params.address Dados do endereço
   * @param {Object} params.options Opções adicionais
   * @returns {Promise<Object>} Resposta com o cliente atualizado
   */
  async addAddress(params) {
    try {
      const { siteId, customerId, address, options = {} } = params;
      
      if (!siteId) {
        throw new Error('ID do site é obrigatório');
      }
      
      if (!customerId) {
        throw new Error('ID do cliente é obrigatório');
      }
      
      if (!address) {
        throw new Error('Dados do endereço são obrigatórios');
      }

      const requiredFields = ['address1', 'city', 'state', 'postcode', 'country'];
      const missingFields = requiredFields.filter(field => !address[field]);
      
      if (missingFields.length > 0) {
        return {
          success: false,
          error: `Campos obrigatórios ausentes: ${missingFields.join(', ')}`
        };
      }

      const updatedCustomer = await this.customerService.addCustomerAddress(siteId, customerId, address, options);
      
      return {
        success: true,
        data: updatedCustomer
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Remove um cliente
   * 
   * @param {Object} params Parâmetros da requisição
   * @param {string} params.siteId ID do site
   * @param {string} params.customerId ID do cliente
   * @returns {Promise<Object>} Resposta com status da operação
   */
  async delete(params) {
    try {
      const { siteId, customerId } = params;
      
      if (!siteId) {
        throw new Error('ID do site é obrigatório');
      }
      
      if (!customerId) {
        throw new Error('ID do cliente é obrigatório');
      }

      await this.customerService.deleteCustomer(siteId, customerId);
      
      return {
        success: true,
        message: 'Cliente removido com sucesso'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obtém os pedidos de um cliente
   * 
   * @param {Object} params Parâmetros da requisição
   * @param {string} params.siteId ID do site
   * @param {string} params.customerId ID do cliente
   * @param {Object} params.filter Filtros para pedidos
   * @returns {Promise<Object>} Resposta com lista de pedidos do cliente
   */
  async getOrders(params) {
    try {
      const { siteId, customerId, filter = {} } = params;
      
      if (!siteId) {
        throw new Error('ID do site é obrigatório');
      }
      
      if (!customerId) {
        throw new Error('ID do cliente é obrigatório');
      }

      const orders = await this.customerService.getCustomerOrders(siteId, customerId, filter);
      
      return {
        success: true,
        data: orders
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = CustomerController;