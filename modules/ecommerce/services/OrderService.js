/**
 * Serviço de Pedidos para o E-commerce Manager Core
 * 
 * Responsável por interagir com os diferentes provedores para gerenciar pedidos
 */

const { Order } = require('../models');

class OrderService {
  /**
   * Cria uma instância do serviço de pedidos
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
   * Lista pedidos com suporte a filtros e paginação
   * 
   * @param {string} siteId ID do site
   * @param {Object} options Opções de busca
   * @param {Object} options.filter Filtros a serem aplicados (status, data, cliente, etc)
   * @param {number} options.page Página atual (começa em 1)
   * @param {number} options.perPage Itens por página
   * @param {string} options.sortBy Campo para ordenação
   * @param {string} options.sortOrder Direção da ordenação (asc/desc)
   * @returns {Promise<Object>} Resultados paginados com metadados
   */
  async getOrders(siteId, options = {}) {
    const provider = await this._getProviderForSite(siteId);
    const platformOrders = await provider.getOrders(options);
    
    // Converte os pedidos para o formato padrão do sistema
    const items = platformOrders.items.map(item => {
      return Order.fromPlatformFormat(item, provider.platform);
    });
    
    return {
      items,
      total: platformOrders.total,
      hasMore: platformOrders.hasMore
    };
  }

  /**
   * Obtém detalhes de um pedido específico
   * 
   * @param {string} siteId ID do site
   * @param {string} orderId ID do pedido
   * @returns {Promise<Order>} Instância do pedido
   */
  async getOrderById(siteId, orderId) {
    // Verifica se o pedido está em cache
    const cacheKey = `order:${siteId}:${orderId}`;
    if (this.cache) {
      const cachedOrder = await this.cache.get(cacheKey);
      if (cachedOrder) {
        return new Order(cachedOrder);
      }
    }
    
    const provider = await this._getProviderForSite(siteId);
    const platformOrder = await provider.getOrderById(orderId);
    
    if (!platformOrder) {
      throw new Error(`Pedido não encontrado: ${orderId}`);
    }
    
    // Converte para o formato padrão do sistema
    const order = Order.fromPlatformFormat(platformOrder, provider.platform);
    
    // Armazena em cache
    if (this.cache) {
      await this.cache.set(cacheKey, order.toJSON(), 1800); // Cache por 30 minutos
    }
    
    return order;
  }

  /**
   * Atualiza um pedido existente
   * 
   * @param {string} siteId ID do site
   * @param {string} orderId ID do pedido
   * @param {Object} updates Dados a serem atualizados
   * @returns {Promise<Order>} Pedido atualizado
   */
  async updateOrder(siteId, orderId, updates) {
    const provider = await this._getProviderForSite(siteId);
    
    // Obtém o pedido atual para mesclar com as atualizações
    const existingOrder = await this.getOrderById(siteId, orderId);
    
    // Cria uma nova instância com os dados mesclados
    const updatedOrder = new Order({
      ...existingOrder.toJSON(),
      ...updates,
      updatedAt: new Date().toISOString()
    });
    
    // Converte para o formato específico da plataforma
    const platformData = updatedOrder.toPlatformFormat(provider.platform);
    
    // Atualiza o pedido na plataforma
    const updatedPlatformOrder = await provider.updateOrder(orderId, platformData);
    
    // Converte de volta para o formato padrão do sistema
    const result = Order.fromPlatformFormat(updatedPlatformOrder, provider.platform);
    
    // Atualiza o cache se disponível
    if (this.cache) {
      const cacheKey = `order:${siteId}:${orderId}`;
      await this.cache.set(cacheKey, result.toJSON(), 1800); // Cache por 30 minutos
    }
    
    return result;
  }

  /**
   * Concluir um pedido
   * 
   * @param {string} siteId ID do site
   * @param {string} orderId ID do pedido
   * @returns {Promise<Order>} Pedido atualizado
   */
  async completeOrder(siteId, orderId) {
    const provider = await this._getProviderForSite(siteId);
    
    // Atualiza o pedido na plataforma
    const completedPlatformOrder = await provider.completeOrder(orderId);
    
    // Converte para o formato padrão do sistema
    const result = Order.fromPlatformFormat(completedPlatformOrder, provider.platform);
    
    // Atualiza o cache se disponível
    if (this.cache) {
      const cacheKey = `order:${siteId}:${orderId}`;
      await this.cache.set(cacheKey, result.toJSON(), 1800); // Cache por 30 minutos
    }
    
    return result;
  }

  /**
   * Cancelar um pedido
   * 
   * @param {string} siteId ID do site
   * @param {string} orderId ID do pedido
   * @param {string} reason Motivo do cancelamento
   * @returns {Promise<Order>} Pedido atualizado
   */
  async cancelOrder(siteId, orderId, reason = '') {
    const provider = await this._getProviderForSite(siteId);
    
    // Atualiza o pedido na plataforma
    const canceledPlatformOrder = await provider.cancelOrder(orderId, reason);
    
    // Converte para o formato padrão do sistema
    const result = Order.fromPlatformFormat(canceledPlatformOrder, provider.platform);
    
    // Atualiza o cache se disponível
    if (this.cache) {
      const cacheKey = `order:${siteId}:${orderId}`;
      await this.cache.set(cacheKey, result.toJSON(), 1800); // Cache por 30 minutos
    }
    
    return result;
  }

  /**
   * Reembolsar um pedido
   * 
   * @param {string} siteId ID do site
   * @param {string} orderId ID do pedido
   * @param {Object} refundData Dados do reembolso
   * @returns {Promise<Order>} Pedido atualizado
   */
  async refundOrder(siteId, orderId, refundData) {
    const provider = await this._getProviderForSite(siteId);
    
    // Atualiza o pedido na plataforma
    const refundedPlatformOrder = await provider.refundOrder(orderId, refundData);
    
    // Converte para o formato padrão do sistema
    const result = Order.fromPlatformFormat(refundedPlatformOrder, provider.platform);
    
    // Atualiza o cache se disponível
    if (this.cache) {
      const cacheKey = `order:${siteId}:${orderId}`;
      await this.cache.set(cacheKey, result.toJSON(), 1800); // Cache por 30 minutos
    }
    
    return result;
  }

  /**
   * Adicionar nota a um pedido
   * 
   * @param {string} siteId ID do site
   * @param {string} orderId ID do pedido
   * @param {string} note Conteúdo da nota
   * @param {boolean} isCustomerNote Se a nota é visível para o cliente
   * @returns {Promise<Order>} Pedido atualizado
   */
  async addOrderNote(siteId, orderId, note, isCustomerNote = false) {
    const provider = await this._getProviderForSite(siteId);
    
    // Atualiza o pedido na plataforma
    const updatedPlatformOrder = await provider.addOrderNote(orderId, note, isCustomerNote);
    
    // Converte para o formato padrão do sistema
    const result = Order.fromPlatformFormat(updatedPlatformOrder, provider.platform);
    
    // Atualiza o cache se disponível
    if (this.cache) {
      const cacheKey = `order:${siteId}:${orderId}`;
      await this.cache.set(cacheKey, result.toJSON(), 1800); // Cache por 30 minutos
    }
    
    return result;
  }

  /**
   * Atualizar status de um pedido
   * 
   * @param {string} siteId ID do site
   * @param {string} orderId ID do pedido
   * @param {string} status Novo status
   * @param {string} note Nota opcional sobre a mudança
   * @returns {Promise<Order>} Pedido atualizado
   */
  async updateOrderStatus(siteId, orderId, status, note = '') {
    const provider = await this._getProviderForSite(siteId);
    
    // Atualiza o pedido na plataforma
    const updatedPlatformOrder = await provider.updateOrderStatus(orderId, status, note);
    
    // Converte para o formato padrão do sistema
    const result = Order.fromPlatformFormat(updatedPlatformOrder, provider.platform);
    
    // Atualiza o cache se disponível
    if (this.cache) {
      const cacheKey = `order:${siteId}:${orderId}`;
      await this.cache.set(cacheKey, result.toJSON(), 1800); // Cache por 30 minutos
    }
    
    return result;
  }

  /**
   * Gera relatório de pedidos e vendas
   * 
   * @param {string} siteId ID do site
   * @param {string} reportType Tipo de relatório
   * @param {Object} dateRange Intervalo de datas
   * @param {Object} filter Filtros adicionais
   * @returns {Promise<Object>} Dados do relatório
   */
  async generateReport(siteId, reportType, dateRange, filter = {}) {
    const provider = await this._getProviderForSite(siteId);
    
    // Obtém dados para o relatório da plataforma
    const reportData = await provider.generateOrderReport(reportType, dateRange, filter);
    
    // Processa dados do relatório (podem variar conforme o tipo)
    let processedData = reportData;
    
    switch (reportType) {
      case 'sales':
        // Processa dados de vendas (soma por período, etc)
        processedData = this._processSalesReportData(reportData);
        break;
        
      case 'product_performance':
        // Processa dados de desempenho de produtos
        processedData = this._processProductPerformanceData(reportData);
        break;
        
      case 'customer_orders':
        // Processa dados de pedidos por cliente
        processedData = this._processCustomerOrdersData(reportData);
        break;
        
      // Outros tipos de relatório...
    }
    
    return processedData;
  }

  /**
   * Processa dados de relatório de vendas
   * @param {Object} reportData Dados brutos do relatório
   * @returns {Object} Dados processados
   * @private
   */
  _processSalesReportData(reportData) {
    // Implementação para processar relatório de vendas
    // Por exemplo, calcular totais, médias, etc.
    return {
      ...reportData,
      // Adicionando dados calculados
      totalSales: reportData.items.reduce((sum, item) => sum + item.total, 0),
      averageOrderValue: reportData.items.length ? 
        reportData.items.reduce((sum, item) => sum + item.total, 0) / reportData.items.length : 0,
      totalOrders: reportData.items.length
    };
  }

  /**
   * Processa dados de relatório de desempenho de produtos
   * @param {Object} reportData Dados brutos do relatório
   * @returns {Object} Dados processados
   * @private
   */
  _processProductPerformanceData(reportData) {
    // Implementação para processar relatório de desempenho de produtos
    // Por exemplo, calcular mais vendidos, margens, etc.
    const sortedProducts = [...reportData.items].sort((a, b) => b.quantitySold - a.quantitySold);
    
    return {
      ...reportData,
      // Adicionando dados calculados
      topSellingProducts: sortedProducts.slice(0, 10),
      totalQuantitySold: sortedProducts.reduce((sum, item) => sum + item.quantitySold, 0),
      totalRevenue: sortedProducts.reduce((sum, item) => sum + item.revenue, 0)
    };
  }

  /**
   * Processa dados de relatório de pedidos por cliente
   * @param {Object} reportData Dados brutos do relatório
   * @returns {Object} Dados processados
   * @private
   */
  _processCustomerOrdersData(reportData) {
    // Implementação para processar relatório de pedidos por cliente
    // Por exemplo, identificar clientes recorrentes, valor médio, etc.
    const customers = reportData.items.reduce((result, item) => {
      if (!result[item.customerId]) {
        result[item.customerId] = {
          customerId: item.customerId,
          customerName: item.customerName,
          customerEmail: item.customerEmail,
          orders: [],
          totalSpent: 0,
          orderCount: 0
        };
      }
      
      result[item.customerId].orders.push(item);
      result[item.customerId].totalSpent += item.total;
      result[item.customerId].orderCount += 1;
      
      return result;
    }, {});
    
    // Converte para array e ordena por total gasto
    const customersArray = Object.values(customers).sort((a, b) => b.totalSpent - a.totalSpent);
    
    return {
      ...reportData,
      // Adicionando dados calculados
      customers: customersArray,
      topCustomers: customersArray.slice(0, 10),
      customerCount: customersArray.length,
      averageCustomerValue: customersArray.length ? 
        customersArray.reduce((sum, c) => sum + c.totalSpent, 0) / customersArray.length : 0
    };
  }
}

module.exports = OrderService;