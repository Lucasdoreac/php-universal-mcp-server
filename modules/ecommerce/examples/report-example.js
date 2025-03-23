/**
 * Exemplo de uso do E-commerce Manager Core para relatórios
 */

const EcommerceManager = require('../index');
const MCPServer = require('../../../core/mcp-protocol/server');

// Exemplo de configuração do servidor MCP
const server = new MCPServer({
  port: process.env.MCP_PORT || 7654,
  logLevel: 'info'
});

// Exemplo de implementação básica de um provedor (mockup) com dados para relatórios
class MockProvider {
  constructor(config) {
    this.config = config;
    this.platform = 'mock';
    
    // Gerar dados de exemplo para relatórios
    this.generateMockData();
  }

  generateMockData() {
    // Dados de pedidos de exemplo
    this.orders = [];
    
    // Gerar pedidos para os últimos 30 dias
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    for (let i = 0; i < 100; i++) {
      const orderDate = new Date(startDate);
      orderDate.setDate(startDate.getDate() + Math.floor(Math.random() * 30));
      
      const orderId = `ord_${i + 1}`;
      const customerId = `cust_${Math.floor(Math.random() * 20) + 1}`;
      const total = Math.round((50 + Math.random() * 200) * 100) / 100;
      const itemsCount = Math.floor(Math.random() * 5) + 1;
      
      const items = [];
      for (let j = 0; j < itemsCount; j++) {
        const productId = `prod_${Math.floor(Math.random() * 20) + 1}`;
        const quantity = Math.floor(Math.random() * 3) + 1;
        const price = Math.round((30 + Math.random() * 50) * 100) / 100;
        
        items.push({
          productId,
          name: `Produto ${productId.split('_')[1]}`,
          quantity,
          price,
          total: Math.round(quantity * price * 100) / 100
        });
      }
      
      const subtotal = items.reduce((sum, item) => sum + item.total, 0);
      const shipping = Math.round(Math.random() * 20 * 100) / 100;
      const tax = Math.round(subtotal * 0.1 * 100) / 100;
      
      this.orders.push({
        id: orderId,
        number: `ORD-${1000 + i}`,
        customerId,
        customer: {
          id: customerId,
          name: `Cliente ${customerId.split('_')[1]}`,
          email: `cliente${customerId.split('_')[1]}@example.com`
        },
        createdAt: orderDate.toISOString(),
        items,
        subtotal,
        shipping,
        tax,
        total: Math.round((subtotal + shipping + tax) * 100) / 100,
        status: Math.random() > 0.2 ? 'completed' : 
                Math.random() > 0.5 ? 'processing' : 'cancelled'
      });
    }
  }

  async getOrdersByDateRange(dateRange, options = {}) {
    const { startDate, endDate } = dateRange;
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    
    // Filtrar pedidos pelo intervalo de datas
    return this.orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= start && orderDate <= end;
    });
  }

  async getProductPerformance(dateRange, options = {}) {
    const { startDate, endDate } = dateRange;
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    
    // Filtrar pedidos pelo intervalo de datas
    const filteredOrders = this.orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= start && orderDate <= end;
    });
    
    // Calcular desempenho por produto
    const productMap = {};
    
    filteredOrders.forEach(order => {
      if (order.status === 'cancelled') return;
      
      order.items.forEach(item => {
        if (!productMap[item.productId]) {
          productMap[item.productId] = {
            productId: item.productId,
            name: item.name,
            quantitySold: 0,
            revenue: 0,
            orders: 0
          };
        }
        
        productMap[item.productId].quantitySold += item.quantity;
        productMap[item.productId].revenue += item.total;
        productMap[item.productId].orders += 1;
      });
    });
    
    return Object.values(productMap);
  }

  async getCustomerOrdersReport(dateRange, options = {}) {
    const { startDate, endDate } = dateRange;
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    
    // Filtrar pedidos pelo intervalo de datas
    const filteredOrders = this.orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= start && orderDate <= end;
    });
    
    // Agrupar pedidos por cliente
    const customerMap = {};
    
    filteredOrders.forEach(order => {
      const customerId = order.customerId;
      
      if (!customerMap[customerId]) {
        customerMap[customerId] = {
          id: customerId,
          name: order.customer.name,
          email: order.customer.email,
          orders: []
        };
      }
      
      customerMap[customerId].orders.push(order);
    });
    
    return Object.values(customerMap);
  }

  async getInventoryReport(options = {}) {
    // Gerar dados de estoque fictícios
    const inventory = [];
    
    for (let i = 1; i <= 20; i++) {
      const productId = `prod_${i}`;
      const stockLevel = Math.random();
      let stockQuantity;
      
      if (stockLevel < 0.1) {
        stockQuantity = 0; // Fora de estoque
      } else if (stockLevel < 0.3) {
        stockQuantity = Math.floor(Math.random() * 5); // Estoque baixo
      } else if (stockLevel > 0.9) {
        stockQuantity = 100 + Math.floor(Math.random() * 100); // Excesso de estoque
      } else {
        stockQuantity = 10 + Math.floor(Math.random() * 50); // Estoque normal
      }
      
      inventory.push({
        id: productId,
        name: `Produto ${i}`,
        sku: `SKU-00${i}`,
        stockQuantity,
        price: Math.round((30 + Math.random() * 50) * 100) / 100,
        lowStockThreshold: 5,
        excessStockThreshold: 100
      });
    }
    
    return inventory;
  }
}

// Implementação do ProviderManager simplificado
class ProviderManager {
  constructor() {
    this.providers = {};
    this.siteProviders = {};
  }

  registerProvider(platform, ProviderClass, defaultConfig = {}) {
    this.providers[platform] = {
      ProviderClass,
      defaultConfig
    };
  }

  configureSite(siteId, platform, config = {}) {
    this.siteProviders[siteId] = {
      platform,
      config
    };
  }

  getProviderForSite(siteId) {
    const siteConfig = this.siteProviders[siteId];
    if (!siteConfig) {
      throw new Error(`Configuração não encontrada para o site: ${siteId}`);
    }
    
    const { platform, config } = siteConfig;
    const providerInfo = this.providers[platform];
    
    if (!providerInfo) {
      throw new Error(`Provedor não encontrado para a plataforma: ${platform}`);
    }
    
    const { ProviderClass, defaultConfig } = providerInfo;
    return new ProviderClass({ ...defaultConfig, ...config });
  }
}

// Instanciar e configurar o gerenciador de provedores
const providerManager = new ProviderManager();
providerManager.registerProvider('mock', MockProvider);
providerManager.configureSite('site123', 'mock');

// Inicializar o E-commerce Manager
const ecommerceManager = new EcommerceManager({
  providerManager
});

// Registrar métodos no servidor MCP
ecommerceManager.registerApiMethods(server);

// Iniciar o servidor
server.start();

console.log('Servidor MCP iniciado na porta', server.port);
console.log('EcommerceManager configurado com sucesso');

// Exemplo de uso (simulado)
async function runExamples() {
  try {
    const dateRange = {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // Últimos 30 dias
      endDate: new Date().toISOString()
    };

    console.log('\n--- Gerando relatório de vendas ---');
    const salesReport = await server.callMethod('reports.sales', {
      siteId: 'site123',
      dateRange,
      options: {
        groupBy: 'day'
      }
    });
    console.log('Relatório de vendas gerado com sucesso');
    console.log(`Total de vendas: ${salesReport.data.totals.sales.toFixed(2)}`);
    console.log(`Total de pedidos: ${salesReport.data.totals.orders}`);
    console.log(`Valor médio do pedido: ${salesReport.data.averages.orderValue.toFixed(2)}`);

    console.log('\n--- Gerando relatório de desempenho de produtos ---');
    const productReport = await server.callMethod('reports.products', {
      siteId: 'site123',
      dateRange
    });
    console.log('Relatório de produtos gerado com sucesso');
    console.log('Top 5 produtos mais vendidos:');
    productReport.data.topProducts.slice(0, 5).forEach((product, index) => {
      console.log(`${index + 1}. ${product.name} - Vendas: ${product.quantitySold} unidades - Receita: ${product.revenue.toFixed(2)}`);
    });

    console.log('\n--- Gerando relatório de clientes ---');
    const customerReport = await server.callMethod('reports.customers', {
      siteId: 'site123',
      dateRange
    });
    console.log('Relatório de clientes gerado com sucesso');
    console.log(`Total de clientes: ${customerReport.data.totals.customers}`);
    console.log(`Clientes novos: ${customerReport.data.segments.new.count}`);
    console.log(`Clientes recorrentes: ${customerReport.data.segments.returning.count}`);

    console.log('\n--- Gerando relatório de estoque ---');
    const inventoryReport = await server.callMethod('reports.inventory', {
      siteId: 'site123'
    });
    console.log('Relatório de estoque gerado com sucesso');
    console.log(`Valor total do estoque: ${inventoryReport.data.totals.stockValue.toFixed(2)}`);
    console.log(`Produtos fora de estoque: ${inventoryReport.data.stockCategories.outOfStock.count}`);
    console.log(`Produtos com estoque baixo: ${inventoryReport.data.stockCategories.lowStock.count}`);

    console.log('\n--- Gerando painel de métricas ---');
    const dashboardReport = await server.callMethod('reports.dashboard', {
      siteId: 'site123',
      dateRange
    });
    console.log('Painel de métricas gerado com sucesso');
    console.log(`Receita total: ${dashboardReport.data.revenue.total.toFixed(2)}`);
    console.log(`Total de pedidos: ${dashboardReport.data.revenue.orders}`);
    console.log(`Clientes novos vs recorrentes: ${dashboardReport.data.customers.new} / ${dashboardReport.data.customers.returning}`);

  } catch (error) {
    console.error('Erro ao executar exemplos:', error);
  } finally {
    console.log('\nExemplos concluídos');
    server.stop();
  }
}

// Executar exemplos após 1 segundo para garantir que o servidor está pronto
setTimeout(runExamples, 1000);