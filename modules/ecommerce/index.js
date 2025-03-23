/**
 * Ponto de entrada do E-commerce Manager Core
 * 
 * Este módulo exporta a API unificada para gerenciamento de e-commerce
 */

const ProductController = require('./controllers/ProductController');
const OrderController = require('./controllers/OrderController');
const CategoryController = require('./controllers/CategoryController');
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
   * @param {Object} options.cache Sistema de cache
   */
  constructor(options = {}) {
    this.options = options;
    this.productController = new ProductController(options);
    this.orderController = new OrderController(options);
    this.categoryController = new CategoryController(options);
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
}

module.exports = EcommerceManager;