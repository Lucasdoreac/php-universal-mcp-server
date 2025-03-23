/**
 * Ponto de entrada do E-commerce Manager Core
 * 
 * Este módulo exporta a API unificada para gerenciamento de e-commerce
 */

const ProductController = require('./controllers/ProductController');
const OrderController = require('./controllers/OrderController');
const CategoryController = require('./controllers/CategoryController');
const CustomerController = require('./controllers/CustomerController');
const DiscountController = require('./controllers/DiscountController');
const ReportController = require('./controllers/ReportController');

const AnalyticsDashboard = require('./analytics/AnalyticsDashboard');
const CacheManager = require('./utils/CacheManager');
const models = require('./models');

/**
 * Classe principal do E-commerce Manager Core
 */
class EcommerceManager {
  /**
   * Cria uma instância do gerenciador de e-commerce
   * 
   * @param {Object} options Opções de configuração
   * @param {Object} options.providerManager Gerenciador de provedores
   * @param {Object} options.cache Sistema de cache (opcional)
   */
  constructor(options = {}) {
    this.options = options;
    
    // Configura o sistema de cache
    this.cache = options.cache || new CacheManager();
    
    // Configura os controladores
    this.productController = new ProductController({ ...options, cache: this.cache });
    this.orderController = new OrderController({ ...options, cache: this.cache });
    this.categoryController = new CategoryController({ ...options, cache: this.cache });
    this.customerController = new CustomerController({ ...options, cache: this.cache });
    this.discountController = new DiscountController({ ...options, cache: this.cache });
    this.reportController = new ReportController({ ...options, cache: this.cache });
    
    // Inicializa o dashboard de analytics
    this.analyticsDashboard = new AnalyticsDashboard({ ...options, cache: this.cache });
  }

  /**
   * Registra os métodos da API no servidor MCP
   * 
   * @param {Object} server Servidor MCP
   */
  registerApiMethods(server) {
    if (!server) {
      throw new Error('Servidor MCP é necessário para registrar os métodos da API');
    }

    // Registra métodos para produtos
    server.registerMethod('products.list', this._handleApiCall.bind(this, this.productController.list.bind(this.productController)));
    server.registerMethod('products.get', this._handleApiCall.bind(this, this.productController.get.bind(this.productController)));
    server.registerMethod('products.create', this._handleApiCall.bind(this, this.productController.create.bind(this.productController)));
    server.registerMethod('products.update', this._handleApiCall.bind(this, this.productController.update.bind(this.productController)));
    server.registerMethod('products.delete', this._handleApiCall.bind(this, this.productController.delete.bind(this.productController)));

    // Registra métodos para pedidos
    server.registerMethod('orders.list', this._handleApiCall.bind(this, this.orderController.list.bind(this.orderController)));
    server.registerMethod('orders.get', this._handleApiCall.bind(this, this.orderController.get.bind(this.orderController)));
    server.registerMethod('orders.update', this._handleApiCall.bind(this, this.orderController.update.bind(this.orderController)));
    server.registerMethod('orders.process', this._handleApiCall.bind(this, this.orderController.processAction.bind(this.orderController)));
    server.registerMethod('orders.report', this._handleApiCall.bind(this, this.orderController.generateReport.bind(this.orderController)));

    // Registra métodos para categorias
    server.registerMethod('categories.list', this._handleApiCall.bind(this, this.categoryController.list.bind(this.categoryController)));
    server.registerMethod('categories.get', this._handleApiCall.bind(this, this.categoryController.get.bind(this.categoryController)));
    server.registerMethod('categories.create', this._handleApiCall.bind(this, this.categoryController.create.bind(this.categoryController)));
    server.registerMethod('categories.update', this._handleApiCall.bind(this, this.categoryController.update.bind(this.categoryController)));
    server.registerMethod('categories.delete', this._handleApiCall.bind(this, this.categoryController.delete.bind(this.categoryController)));

    // Registra métodos para clientes
    server.registerMethod('customers.list', this._handleApiCall.bind(this, this.customerController.list.bind(this.customerController)));
    server.registerMethod('customers.get', this._handleApiCall.bind(this, this.customerController.get.bind(this.customerController)));
    server.registerMethod('customers.create', this._handleApiCall.bind(this, this.customerController.create.bind(this.customerController)));
    server.registerMethod('customers.update', this._handleApiCall.bind(this, this.customerController.update.bind(this.customerController)));
    server.registerMethod('customers.delete', this._handleApiCall.bind(this, this.customerController.delete.bind(this.customerController)));
    server.registerMethod('customers.addAddress', this._handleApiCall.bind(this, this.customerController.addAddress.bind(this.customerController)));
    server.registerMethod('customers.getOrders', this._handleApiCall.bind(this, this.customerController.getOrders.bind(this.customerController)));

    // Registra métodos para cupons/descontos
    server.registerMethod('discounts.list', this._handleApiCall.bind(this, this.discountController.list.bind(this.discountController)));
    server.registerMethod('discounts.get', this._handleApiCall.bind(this, this.discountController.get.bind(this.discountController)));
    server.registerMethod('discounts.create', this._handleApiCall.bind(this, this.discountController.create.bind(this.discountController)));
    server.registerMethod('discounts.update', this._handleApiCall.bind(this, this.discountController.update.bind(this.discountController)));
    server.registerMethod('discounts.delete', this._handleApiCall.bind(this, this.discountController.delete.bind(this.discountController)));
    server.registerMethod('discounts.validate', this._handleApiCall.bind(this, this.discountController.validate.bind(this.discountController)));

    // Registra métodos para relatórios
    server.registerMethod('reports.sales', this._handleApiCall.bind(this, this.reportController.generateSalesReport.bind(this.reportController)));
    server.registerMethod('reports.products', this._handleApiCall.bind(this, this.reportController.generateProductPerformanceReport.bind(this.reportController)));
    server.registerMethod('reports.customers', this._handleApiCall.bind(this, this.reportController.generateCustomerReport.bind(this.reportController)));
    server.registerMethod('reports.inventory', this._handleApiCall.bind(this, this.reportController.generateInventoryReport.bind(this.reportController)));
    server.registerMethod('reports.dashboard', this._handleApiCall.bind(this, this.reportController.getDashboardMetrics.bind(this.reportController)));
    
    // Registra métodos para o dashboard de analytics
    server.registerMethod('analytics.dashboard', this._handleApiCall.bind(this, this.analyticsDashboard.generateDashboard.bind(this.analyticsDashboard)));
  }

  /**
   * Manipula chamadas de API, adicionando tratamento de erros e validação
   * 
   * @param {Function} handlerFn Função de manipulação da chamada
   * @param {Object} params Parâmetros da chamada
   * @returns {Promise<Object>} Resposta da API
   * @private
   */
  async _handleApiCall(handlerFn, params) {
    try {
      // Valida parâmetros obrigatórios comuns
      if (!params) {
        return {
          success: false,
          error: 'Parâmetros são obrigatórios'
        };
      }

      // Executa o manipulador específico
      return await handlerFn(params);
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Erro desconhecido',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      };
    }
  }

  /**
   * Retorna os modelos de dados disponíveis
   * @returns {Object} Modelos de dados
   */
  getModels() {
    return models;
  }

  /**
   * Limpa o cache do sistema
   * @param {string} pattern Padrão de chaves para limpar (opcional)
   * @returns {Promise<Object>} Resultado da operação
   */
  async clearCache(pattern) {
    try {
      let result;
      if (pattern) {
        result = await this.cache.deletePattern(pattern);
        return {
          success: true,
          message: `${result} chaves de cache removidas com o padrão: ${pattern}`
        };
      } else {
        result = await this.cache.clear();
        return {
          success: true,
          message: 'Cache limpo com sucesso'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Erro ao limpar cache: ${error.message}`
      };
    }
  }
  
  /**
   * Retorna o dashboard de analytics
   * @returns {Object} Instância do dashboard de analytics
   */
  getAnalyticsDashboard() {
    return this.analyticsDashboard;
  }
}

module.exports = EcommerceManager;