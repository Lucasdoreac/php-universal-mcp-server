/**
 * Serviço de Clientes para o E-commerce Manager Core
 * 
 * Responsável por interagir com os diferentes provedores para gerenciar clientes
 */

const { Customer, Order } = require('../models');

class CustomerService {
  /**
   * Cria uma instância do serviço de clientes
   * @param {Object} options Opções de configuração
   * @param {Object} options.providerManager Gerenciador de provedores
   */
  constructor(options = {}) {
    this.providerManager = options.providerManager;
    this.cache = options.cache || null;
  }

  /**
   * Obtém o provedor apropriado para um site
   * @param {string} siteId ID do site
   * @returns {Object} Instância do provedor
   * @private
   */
  async _getProviderForSite(siteId) {
    if (!this.providerManager) {
      throw new Error('Gerenciador de provedores não configurado');
    }
    
    return this.providerManager.getProviderForSite(siteId);
  }

  /**
   * Lista clientes com suporte a filtros e paginação
   * 
   * @param {string} siteId ID do site
   * @param {Object} options Opções de busca
   * @param {Object} options.filter Filtros a serem aplicados
   * @param {number} options.page Página atual (começa em 1)
   * @param {number} options.perPage Itens por página
   * @param {string} options.sortBy Campo para ordenação
   * @param {string} options.sortOrder Direção da ordenação (asc/desc)
   * @returns {Promise<Object>} Resultados paginados com metadados
   */
  async getCustomers(siteId, options = {}) {
    const provider = await this._getProviderForSite(siteId);
    const platformCustomers = await provider.getCustomers(options);
    
    // Converte os clientes para o formato padrão do sistema
    const items = platformCustomers.items.map(item => {
      return Customer.fromPlatformFormat(item, provider.platform);
    });
    
    return {
      items,
      total: platformCustomers.total,
      hasMore: platformCustomers.hasMore
    };
  }

  /**
   * Obtém detalhes de um cliente específico
   * 
   * @param {string} siteId ID do site
   * @param {string} customerId ID do cliente
   * @returns {Promise<Customer>} Instância do cliente
   */
  async getCustomerById(siteId, customerId) {
    // Verifica se o cliente está em cache
    const cacheKey = `customer:${siteId}:${customerId}`;
    if (this.cache) {
      const cachedCustomer = await this.cache.get(cacheKey);
      if (cachedCustomer) {
        return new Customer(cachedCustomer);
      }
    }
    
    const provider = await this._getProviderForSite(siteId);
    const platformCustomer = await provider.getCustomerById(customerId);
    
    if (!platformCustomer) {
      throw new Error(`Cliente não encontrado: ${customerId}`);
    }
    
    // Converte para o formato padrão do sistema
    const customer = Customer.fromPlatformFormat(platformCustomer, provider.platform);
    
    // Armazena em cache
    if (this.cache) {
      await this.cache.set(cacheKey, customer.toJSON(), 3600); // Cache por 1 hora
    }
    
    return customer;
  }

  /**
   * Cria um novo cliente
   * 
   * @param {string} siteId ID do site
   * @param {Customer} customer Dados do cliente
   * @returns {Promise<Customer>} Cliente criado
   */
  async createCustomer(siteId, customer) {
    const provider = await this._getProviderForSite(siteId);
    
    // Converte para o formato específico da plataforma
    const platformData = customer.toPlatformFormat(provider.platform);
    
    // Cria o cliente na plataforma
    const createdPlatformCustomer = await provider.createCustomer(platformData);
    
    // Converte de volta para o formato padrão do sistema
    const createdCustomer = Customer.fromPlatformFormat(createdPlatformCustomer, provider.platform);
    
    return createdCustomer;
  }

  /**
   * Atualiza um cliente existente
   * 
   * @param {string} siteId ID do site
   * @param {string} customerId ID do cliente
   * @param {Object} updates Dados a serem atualizados
   * @returns {Promise<Customer>} Cliente atualizado
   */
  async updateCustomer(siteId, customerId, updates) {
    const provider = await this._getProviderForSite(siteId);
    
    // Obtém o cliente atual para mesclar com as atualizações
    const existingCustomer = await this.getCustomerById(siteId, customerId);
    
    // Cria uma nova instância com os dados mesclados
    const updatedCustomer = new Customer({
      ...existingCustomer.toJSON(),
      ...updates,
      updatedAt: new Date().toISOString()
    });
    
    // Converte para o formato específico da plataforma
    const platformData = updatedCustomer.toPlatformFormat(provider.platform);
    
    // Atualiza o cliente na plataforma
    const updatedPlatformCustomer = await provider.updateCustomer(customerId, platformData);
    
    // Converte de volta para o formato padrão do sistema
    const result = Customer.fromPlatformFormat(updatedPlatformCustomer, provider.platform);
    
    // Atualiza o cache se disponível
    if (this.cache) {
      const cacheKey = `customer:${siteId}:${customerId}`;
      await this.cache.set(cacheKey, result.toJSON(), 3600); // Cache por 1 hora
    }
    
    return result;
  }

  /**
   * Adiciona um endereço a um cliente
   * 
   * @param {string} siteId ID do site
   * @param {string} customerId ID do cliente
   * @param {Object} addressData Dados do endereço
   * @param {Object} options Opções adicionais
   * @returns {Promise<Customer>} Cliente atualizado
   */
  async addCustomerAddress(siteId, customerId, addressData, options = {}) {
    const provider = await this._getProviderForSite(siteId);
    
    // Obtém o cliente atual
    const existingCustomer = await this.getCustomerById(siteId, customerId);
    
    // Adiciona o endereço na instância local
    const addressId = existingCustomer.addAddress(addressData, options);
    
    // Converte para o formato específico da plataforma
    const platformData = existingCustomer.toPlatformFormat(provider.platform);
    
    // Atualiza o cliente na plataforma (alguns provedores podem ter API específica para endereços)
    let updatedPlatformCustomer;
    if (typeof provider.addCustomerAddress === 'function') {
      updatedPlatformCustomer = await provider.addCustomerAddress(customerId, addressData, options);
    } else {
      updatedPlatformCustomer = await provider.updateCustomer(customerId, platformData);
    }
    
    // Converte de volta para o formato padrão do sistema
    const result = Customer.fromPlatformFormat(updatedPlatformCustomer, provider.platform);
    
    // Atualiza o cache se disponível
    if (this.cache) {
      const cacheKey = `customer:${siteId}:${customerId}`;
      await this.cache.set(cacheKey, result.toJSON(), 3600); // Cache por 1 hora
    }
    
    return result;
  }

  /**
   * Remove um cliente
   * 
   * @param {string} siteId ID do site
   * @param {string} customerId ID do cliente
   * @returns {Promise<boolean>} Status da operação
   */
  async deleteCustomer(siteId, customerId) {
    const provider = await this._getProviderForSite(siteId);
    
    // Remove o cliente na plataforma
    const result = await provider.deleteCustomer(customerId);
    
    // Remove do cache se disponível
    if (this.cache) {
      const cacheKey = `customer:${siteId}:${customerId}`;
      await this.cache.delete(cacheKey);
    }
    
    return result;
  }

  /**
   * Obtém os pedidos de um cliente
   * 
   * @param {string} siteId ID do site
   * @param {string} customerId ID do cliente
   * @param {Object} filter Filtros para pedidos
   * @returns {Promise<Order[]>} Lista de pedidos do cliente
   */
  async getCustomerOrders(siteId, customerId, filter = {}) {
    const provider = await this._getProviderForSite(siteId);
    
    // Alguns provedores podem ter endpoint específico para pedidos de cliente
    let platformOrders;
    if (typeof provider.getCustomerOrders === 'function') {
      platformOrders = await provider.getCustomerOrders(customerId, filter);
    } else {
      // Caso contrário, filtra os pedidos pelo ID do cliente
      const customerFilter = { ...filter, customerId };
      const response = await provider.getOrders({
        filter: customerFilter,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
      platformOrders = response.items;
    }
    
    // Converte para o formato padrão do sistema
    return platformOrders.map(order => Order.fromPlatformFormat(order, provider.platform));
  }
}

module.exports = CustomerService;