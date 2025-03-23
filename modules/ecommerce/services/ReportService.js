/**
 * Serviço de Relatórios e Analytics para o E-commerce Manager Core
 * 
 * Responsável por gerar relatórios e análises de dados de e-commerce
 */

class ReportService {
  /**
   * Cria uma instância do serviço de relatórios
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
   * Gera relatório de vendas
   * 
   * @param {string} siteId ID do site
   * @param {Object} dateRange Intervalo de datas {startDate, endDate}
   * @param {Object} options Opções adicionais
   * @returns {Promise<Object>} Dados do relatório
   */
  async generateSalesReport(siteId, dateRange, options = {}) {
    const { groupBy = 'day', includeTax = true, includeShipping = true } = options;
    
    // Verifica se já existe em cache
    const cacheKey = `report:sales:${siteId}:${JSON.stringify(dateRange)}:${JSON.stringify(options)}`;
    if (this.cache) {
      const cachedReport = await this.cache.get(cacheKey);
      if (cachedReport) {
        return cachedReport;
      }
    }

    const provider = await this._getProviderForSite(siteId);
    
    // Busca os dados de pedidos no período
    const ordersData = await provider.getOrdersByDateRange(dateRange, {
      status: options.status || ['completed', 'processing'],
      includeDetails: true
    });
    
    // Processa os dados para o formato do relatório
    const report = this._processSalesReportData(ordersData, {
      groupBy,
      includeTax,
      includeShipping
    });
    
    // Adiciona metadados
    report.metadata = {
      dateRange,
      generatedAt: new Date().toISOString(),
      siteId
    };
    
    // Armazena em cache com tempo de vida curto
    if (this.cache) {
      await this.cache.set(cacheKey, report, 1800); // Cache por 30 minutos
    }
    
    return report;
  }

  /**
   * Processa dados para um relatório de vendas
   * @param {Array} ordersData Dados brutos de pedidos
   * @param {Object} options Opções de processamento
   * @returns {Object} Relatório processado
   * @private
   */
  _processSalesReportData(ordersData, options) {
    const { groupBy, includeTax, includeShipping } = options;
    
    // Inicializa as estruturas de dados
    const salesByPeriod = {};
    let totalSales = 0;
    let totalOrders = 0;
    let totalItems = 0;
    let totalShipping = 0;
    let totalTax = 0;
    
    // Processa cada pedido
    ordersData.forEach(order => {
      // Calcula o período para agrupamento
      const orderDate = new Date(order.createdAt);
      let periodKey;
      
      switch (groupBy) {
        case 'hour':
          periodKey = `${orderDate.getFullYear()}-${(orderDate.getMonth() + 1).toString().padStart(2, '0')}-${orderDate.getDate().toString().padStart(2, '0')} ${orderDate.getHours().toString().padStart(2, '0')}:00`;
          break;
        case 'day':
          periodKey = `${orderDate.getFullYear()}-${(orderDate.getMonth() + 1).toString().padStart(2, '0')}-${orderDate.getDate().toString().padStart(2, '0')}`;
          break;
        case 'week':
          // Calcula o início da semana (domingo)
          const firstDayOfWeek = new Date(orderDate);
          const day = orderDate.getDay();
          const diff = orderDate.getDate() - day;
          firstDayOfWeek.setDate(diff);
          periodKey = `${firstDayOfWeek.getFullYear()}-${(firstDayOfWeek.getMonth() + 1).toString().padStart(2, '0')}-${firstDayOfWeek.getDate().toString().padStart(2, '0')}`;
          break;
        case 'month':
          periodKey = `${orderDate.getFullYear()}-${(orderDate.getMonth() + 1).toString().padStart(2, '0')}`;
          break;
        case 'year':
          periodKey = `${orderDate.getFullYear()}`;
          break;
        default:
          periodKey = `${orderDate.getFullYear()}-${(orderDate.getMonth() + 1).toString().padStart(2, '0')}-${orderDate.getDate().toString().padStart(2, '0')}`;
      }
      
      // Inicializa o período se ainda não existir
      if (!salesByPeriod[periodKey]) {
        salesByPeriod[periodKey] = {
          period: periodKey,
          sales: 0,
          orders: 0,
          items: 0,
          shipping: 0,
          tax: 0
        };
      }
      
      // Calcula os valores do pedido
      const orderTotal = order.total || 0;
      const orderItems = order.items ? order.items.length : 0;
      const orderShipping = order.shippingTotal || 0;
      const orderTax = order.taxTotal || 0;
      
      // Atualiza totais do período
      salesByPeriod[periodKey].sales += orderTotal;
      salesByPeriod[periodKey].orders += 1;
      salesByPeriod[periodKey].items += orderItems;
      salesByPeriod[periodKey].shipping += orderShipping;
      salesByPeriod[periodKey].tax += orderTax;
      
      // Atualiza totais gerais
      totalSales += orderTotal;
      totalOrders += 1;
      totalItems += orderItems;
      totalShipping += orderShipping;
      totalTax += orderTax;
    });
    
    // Converte o objeto em array e ordena por período
    const salesSeries = Object.values(salesByPeriod).sort((a, b) => a.period.localeCompare(b.period));
    
    // Calcula médias
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
    const averageItemsPerOrder = totalOrders > 0 ? totalItems / totalOrders : 0;
    
    // Monta o relatório final
    const report = {
      series: salesSeries,
      totals: {
        sales: totalSales,
        orders: totalOrders,
        items: totalItems,
        shipping: totalShipping,
        tax: totalTax
      },
      averages: {
        orderValue: averageOrderValue,
        itemsPerOrder: averageItemsPerOrder
      }
    };
    
    // Adiciona dados de produtos mais vendidos se disponíveis
    const topProducts = this._getTopProductsFromOrders(ordersData);
    if (topProducts.length > 0) {
      report.topProducts = topProducts.slice(0, 10); // Top 10
    }
    
    return report;
  }

  /**
   * Extrai os produtos mais vendidos de uma lista de pedidos
   * @param {Array} ordersData Dados brutos de pedidos
   * @returns {Array} Produtos ordenados por quantidade vendida
   * @private
   */
  _getTopProductsFromOrders(ordersData) {
    const productSales = {};
    
    // Contabiliza vendas por produto
    ordersData.forEach(order => {
      if (!order.items || !Array.isArray(order.items)) return;
      
      order.items.forEach(item => {
        const productId = item.productId;
        if (!productId) return;
        
        if (!productSales[productId]) {
          productSales[productId] = {
            productId,
            name: item.name || `Produto ${productId}`,
            quantity: 0,
            revenue: 0
          };
        }
        
        productSales[productId].quantity += item.quantity || 1;
        productSales[productId].revenue += (item.price * (item.quantity || 1));
      });
    });
    
    // Converte para array e ordena por quantidade
    return Object.values(productSales).sort((a, b) => b.quantity - a.quantity);
  }

  /**
   * Gera relatório de desempenho de produtos
   * 
   * @param {string} siteId ID do site
   * @param {Object} dateRange Intervalo de datas {startDate, endDate}
   * @param {Object} options Opções adicionais
   * @returns {Promise<Object>} Dados do relatório
   */
  async generateProductPerformanceReport(siteId, dateRange, options = {}) {
    // Verifica se já existe em cache
    const cacheKey = `report:products:${siteId}:${JSON.stringify(dateRange)}:${JSON.stringify(options)}`;
    if (this.cache) {
      const cachedReport = await this.cache.get(cacheKey);
      if (cachedReport) {
        return cachedReport;
      }
    }

    const provider = await this._getProviderForSite(siteId);
    
    // Busca os dados de produtos e vendas no período
    const productsData = await provider.getProductPerformance(dateRange, options);
    
    // Processa os dados para o formato do relatório
    const report = this._processProductPerformanceData(productsData);
    
    // Adiciona metadados
    report.metadata = {
      dateRange,
      generatedAt: new Date().toISOString(),
      siteId
    };
    
    // Armazena em cache com tempo de vida curto
    if (this.cache) {
      await this.cache.set(cacheKey, report, 1800); // Cache por 30 minutos
    }
    
    return report;
  }

  /**
   * Processa dados para um relatório de desempenho de produtos
   * @param {Array} productsData Dados brutos de produtos
   * @returns {Object} Relatório processado
   * @private
   */
  _processProductPerformanceData(productsData) {
    // Ordenar produtos por quantidade vendida
    const sortedProducts = [...productsData].sort((a, b) => b.quantitySold - a.quantitySold);
    
    // Calcular totais
    const totalQuantitySold = sortedProducts.reduce((sum, product) => sum + (product.quantitySold || 0), 0);
    const totalRevenue = sortedProducts.reduce((sum, product) => sum + (product.revenue || 0), 0);
    
    // Separar em categorias (se houver informação de categoria)
    const categorySales = {};
    sortedProducts.forEach(product => {
      if (!product.categories || !Array.isArray(product.categories)) return;
      
      product.categories.forEach(category => {
        if (!category.id) return;
        
        if (!categorySales[category.id]) {
          categorySales[category.id] = {
            id: category.id,
            name: category.name || `Categoria ${category.id}`,
            quantitySold: 0,
            revenue: 0,
            products: 0
          };
        }
        
        categorySales[category.id].quantitySold += product.quantitySold || 0;
        categorySales[category.id].revenue += product.revenue || 0;
        categorySales[category.id].products += 1;
      });
    });
    
    // Ordenar categorias por receita
    const topCategories = Object.values(categorySales).sort((a, b) => b.revenue - a.revenue);
    
    return {
      products: sortedProducts,
      topProducts: sortedProducts.slice(0, 10), // Top 10
      totals: {
        quantitySold: totalQuantitySold,
        revenue: totalRevenue,
        products: sortedProducts.length
      },
      categories: {
        all: Object.values(categorySales),
        top: topCategories.slice(0, 5) // Top 5
      }
    };
  }

  /**
   * Gera relatório de clientes
   * 
   * @param {string} siteId ID do site
   * @param {Object} dateRange Intervalo de datas {startDate, endDate}
   * @param {Object} options Opções adicionais
   * @returns {Promise<Object>} Dados do relatório
   */
  async generateCustomerReport(siteId, dateRange, options = {}) {
    // Verifica se já existe em cache
    const cacheKey = `report:customers:${siteId}:${JSON.stringify(dateRange)}:${JSON.stringify(options)}`;
    if (this.cache) {
      const cachedReport = await this.cache.get(cacheKey);
      if (cachedReport) {
        return cachedReport;
      }
    }

    const provider = await this._getProviderForSite(siteId);
    
    // Busca os dados de clientes e pedidos no período
    const customersData = await provider.getCustomerOrdersReport(dateRange, options);
    
    // Processa os dados para o formato do relatório
    const report = this._processCustomerReportData(customersData);
    
    // Adiciona metadados
    report.metadata = {
      dateRange,
      generatedAt: new Date().toISOString(),
      siteId
    };
    
    // Armazena em cache com tempo de vida curto
    if (this.cache) {
      await this.cache.set(cacheKey, report, 1800); // Cache por 30 minutos
    }
    
    return report;
  }

  /**
   * Processa dados para um relatório de clientes
   * @param {Array} customersData Dados brutos de clientes e pedidos
   * @returns {Object} Relatório processado
   * @private
   */
  _processCustomerReportData(customersData) {
    // Calcular métricas por cliente
    const enhancedCustomers = customersData.map(customer => {
      const customerOrders = customer.orders || [];
      const totalSpent = customerOrders.reduce((sum, order) => sum + (order.total || 0), 0);
      const orderCount = customerOrders.length;
      const averageOrderValue = orderCount > 0 ? totalSpent / orderCount : 0;
      const firstOrderDate = customerOrders.length > 0 ? 
        new Date(Math.min(...customerOrders.map(o => new Date(o.createdAt).getTime()))) : 
        null;
      const lastOrderDate = customerOrders.length > 0 ? 
        new Date(Math.max(...customerOrders.map(o => new Date(o.createdAt).getTime()))) : 
        null;
      
      return {
        ...customer,
        totalSpent,
        orderCount,
        averageOrderValue,
        firstOrderDate: firstOrderDate ? firstOrderDate.toISOString() : null,
        lastOrderDate: lastOrderDate ? lastOrderDate.toISOString() : null,
        isReturningCustomer: orderCount > 1
      };
    });
    
    // Ordenar por total gasto
    const sortedCustomers = [...enhancedCustomers].sort((a, b) => b.totalSpent - a.totalSpent);
    
    // Separar clientes novos vs. recorrentes
    const newCustomers = enhancedCustomers.filter(c => c.orderCount === 1);
    const returningCustomers = enhancedCustomers.filter(c => c.orderCount > 1);
    
    // Calcular métricas agregadas
    const totalCustomers = enhancedCustomers.length;
    const totalOrders = enhancedCustomers.reduce((sum, c) => sum + c.orderCount, 0);
    const totalRevenue = enhancedCustomers.reduce((sum, c) => sum + c.totalSpent, 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const averageOrdersPerCustomer = totalCustomers > 0 ? totalOrders / totalCustomers : 0;
    const newCustomersRatio = totalCustomers > 0 ? newCustomers.length / totalCustomers : 0;
    
    return {
      customers: sortedCustomers,
      topCustomers: sortedCustomers.slice(0, 10), // Top 10
      segments: {
        new: {
          count: newCustomers.length,
          revenue: newCustomers.reduce((sum, c) => sum + c.totalSpent, 0),
          averageOrderValue: newCustomers.length > 0 ? 
            newCustomers.reduce((sum, c) => sum + c.totalSpent, 0) / newCustomers.length : 0
        },
        returning: {
          count: returningCustomers.length,
          revenue: returningCustomers.reduce((sum, c) => sum + c.totalSpent, 0),
          averageOrderValue: returningCustomers.length > 0 ? 
            returningCustomers.reduce((sum, c) => sum + c.totalSpent, 0) / 
            returningCustomers.reduce((sum, c) => sum + c.orderCount, 0) : 0,
          averageOrdersPerCustomer: returningCustomers.length > 0 ? 
            returningCustomers.reduce((sum, c) => sum + c.orderCount, 0) / returningCustomers.length : 0
        }
      },
      totals: {
        customers: totalCustomers,
        orders: totalOrders,
        revenue: totalRevenue
      },
      averages: {
        orderValue: averageOrderValue,
        ordersPerCustomer: averageOrdersPerCustomer
      },
      ratios: {
        newCustomers: newCustomersRatio,
        returningCustomers: 1 - newCustomersRatio
      }
    };
  }

  /**
   * Obtém relatório de estoque
   * 
   * @param {string} siteId ID do site
   * @param {Object} options Opções adicionais
   * @returns {Promise<Object>} Dados do relatório
   */
  async generateInventoryReport(siteId, options = {}) {
    // Verifica se já existe em cache
    const cacheKey = `report:inventory:${siteId}:${JSON.stringify(options)}`;
    if (this.cache) {
      const cachedReport = await this.cache.get(cacheKey);
      if (cachedReport) {
        return cachedReport;
      }
    }

    const provider = await this._getProviderForSite(siteId);
    
    // Busca os dados de estoque
    const inventoryData = await provider.getInventoryReport(options);
    
    // Processa os dados para o formato do relatório
    const report = this._processInventoryReportData(inventoryData);
    
    // Adiciona metadados
    report.metadata = {
      generatedAt: new Date().toISOString(),
      siteId
    };
    
    // Armazena em cache com tempo de vida curto
    if (this.cache) {
      await this.cache.set(cacheKey, report, 1800); // Cache por 30 minutos
    }
    
    return report;
  }

  /**
   * Processa dados para um relatório de estoque
   * @param {Array} inventoryData Dados brutos de estoque
   * @returns {Object} Relatório processado
   * @private
   */
  _processInventoryReportData(inventoryData) {
    // Classificar produtos por estado de estoque
    const outOfStock = [];
    const lowStock = [];
    const inStock = [];
    const excessStock = [];
    
    inventoryData.forEach(product => {
      const stock = product.stockQuantity || 0;
      const lowThreshold = product.lowStockThreshold || 5;
      const excessThreshold = product.excessStockThreshold || 100;
      
      if (stock <= 0) {
        outOfStock.push(product);
      } else if (stock <= lowThreshold) {
        lowStock.push(product);
      } else if (stock >= excessThreshold) {
        excessStock.push(product);
      } else {
        inStock.push(product);
      }
    });
    
    // Calcular valor total do estoque
    const totalStockValue = inventoryData.reduce((sum, product) => {
      const stock = product.stockQuantity || 0;
      const price = product.price || 0;
      return sum + (stock * price);
    }, 0);
    
    // Ordenar produtos por valor de estoque
    const sortedByValue = [...inventoryData].sort((a, b) => {
      const aValue = (a.stockQuantity || 0) * (a.price || 0);
      const bValue = (b.stockQuantity || 0) * (b.price || 0);
      return bValue - aValue;
    });
    
    return {
      products: inventoryData,
      stockCategories: {
        outOfStock: {
          count: outOfStock.length,
          items: outOfStock
        },
        lowStock: {
          count: lowStock.length,
          items: lowStock
        },
        inStock: {
          count: inStock.length,
          items: inStock
        },
        excessStock: {
          count: excessStock.length,
          items: excessStock
        }
      },
      totals: {
        products: inventoryData.length,
        stockValue: totalStockValue,
        stockQuantity: inventoryData.reduce((sum, p) => sum + (p.stockQuantity || 0), 0)
      },
      highestValue: sortedByValue.slice(0, 10) // Top 10 por valor
    };
  }
}

module.exports = ReportService;