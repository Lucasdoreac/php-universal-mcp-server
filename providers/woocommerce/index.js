/**
 * WooCommerce Provider
 * 
 * Implementa a integração com a API WooCommerce para gerenciamento
 * de lojas, produtos, categorias, pedidos e configurações.
 */

const { EventEmitter } = require('events');
const WooCommerceAuth = require('./auth');
const WooCommerceAPI = require('./api');
const ProductManager = require('./product');
const CategoryManager = require('./category');
const OrderManager = require('./order');
const CustomerManager = require('./customer');
const SettingsManager = require('./settings');

class WooCommerceProvider extends EventEmitter {
  /**
   * Construtor do provedor WooCommerce
   * @param {Object} config Configuração do provedor
   * @param {string} config.url URL da loja WooCommerce
   * @param {string} config.consumerKey Chave do consumidor para API WooCommerce
   * @param {string} config.consumerSecret Segredo do consumidor para API WooCommerce
   * @param {string} config.wpUsername Nome de usuário do WordPress (opcional)
   * @param {string} config.wpPassword Senha do WordPress (opcional)
   * @param {Object} config.options Opções adicionais (opcional)
   */
  constructor(config) {
    super();
    
    if (!config.url) {
      throw new Error('URL da loja WooCommerce é obrigatório');
    }
    
    if (!config.consumerKey || !config.consumerSecret) {
      throw new Error('Chave e segredo do consumidor WooCommerce são obrigatórios');
    }
    
    this.config = config;
    this.url = config.url;
    this.options = config.options || {};
    
    // Inicializa sistema de autenticação
    this.auth = new WooCommerceAuth({
      url: config.url,
      consumerKey: config.consumerKey,
      consumerSecret: config.consumerSecret,
      wpUsername: config.wpUsername,
      wpPassword: config.wpPassword,
      version: config.version || 'wc/v3'
    });
    
    // Inicializa API base
    this.api = new WooCommerceAPI(this.auth);
    
    // Inicializa gerenciadores específicos
    this.productManager = new ProductManager(this.api);
    this.categoryManager = new CategoryManager(this.api);
    this.orderManager = new OrderManager(this.api);
    this.customerManager = new CustomerManager(this.api);
    this.settingsManager = new SettingsManager(this.api);
  }

  /**
   * Inicializa o provedor
   * @returns {Promise<boolean>} Sucesso da inicialização
   */
  async initialize() {
    try {
      // Verifica conexão com a API WooCommerce
      const storeInfo = await this.api.get('');
      this.storeInfo = storeInfo;
      
      this.emit('initialized', true);
      return true;
    } catch (error) {
      this.emit('error', {
        message: 'Falha ao inicializar o provedor WooCommerce',
        error: error.message,
        code: error.code || 500
      });
      return false;
    }
  }

  /**
   * Obtém informações da loja
   * @returns {Promise<Object>} Informações da loja
   */
  async getStoreInfo() {
    try {
      return await this.api.get('');
    } catch (error) {
      this.emit('error', {
        message: 'Falha ao obter informações da loja',
        error: error.message,
        code: error.code || 500
      });
      throw error;
    }
  }

  // ===== PRODUTOS =====

  /**
   * Lista todos os produtos
   * @param {Object} options Opções de filtragem
   * @returns {Promise<Array>} Lista de produtos
   */
  async listProducts(options = {}) {
    try {
      return await this.productManager.list(options);
    } catch (error) {
      this.emit('error', {
        message: 'Falha ao listar produtos',
        error: error.message,
        code: error.code || 500
      });
      throw error;
    }
  }

  /**
   * Obtém detalhes de um produto
   * @param {number} productId ID do produto
   * @returns {Promise<Object>} Detalhes do produto
   */
  async getProduct(productId) {
    try {
      return await this.productManager.get(productId);
    } catch (error) {
      this.emit('error', {
        message: `Falha ao obter detalhes do produto ${productId}`,
        error: error.message,
        code: error.code || 500
      });
      throw error;
    }
  }

  /**
   * Cria um novo produto
   * @param {Object} productData Dados do produto
   * @returns {Promise<Object>} Produto criado
   */
  async createProduct(productData) {
    try {
      const product = await this.productManager.create(productData);
      this.emit('product-created', product);
      return product;
    } catch (error) {
      this.emit('error', {
        message: 'Falha ao criar produto',
        error: error.message,
        code: error.code || 500
      });
      throw error;
    }
  }

  /**
   * Atualiza um produto existente
   * @param {number} productId ID do produto
   * @param {Object} productData Dados do produto
   * @returns {Promise<Object>} Produto atualizado
   */
  async updateProduct(productId, productData) {
    try {
      const product = await this.productManager.update(productId, productData);
      this.emit('product-updated', product);
      return product;
    } catch (error) {
      this.emit('error', {
        message: `Falha ao atualizar produto ${productId}`,
        error: error.message,
        code: error.code || 500
      });
      throw error;
    }
  }

  /**
   * Remove um produto
   * @param {number} productId ID do produto
   * @param {boolean} force Forçar exclusão em vez de mover para lixeira
   * @returns {Promise<Object>} Resultado da operação
   */
  async deleteProduct(productId, force = false) {
    try {
      const result = await this.productManager.delete(productId, force);
      this.emit('product-deleted', { id: productId, force });
      return result;
    } catch (error) {
      this.emit('error', {
        message: `Falha ao remover produto ${productId}`,
        error: error.message,
        code: error.code || 500
      });
      throw error;
    }
  }

  /**
   * Obtém variações de um produto
   * @param {number} productId ID do produto
   * @returns {Promise<Array>} Lista de variações
   */
  async getProductVariations(productId) {
    try {
      return await this.productManager.getVariations(productId);
    } catch (error) {
      this.emit('error', {
        message: `Falha ao obter variações do produto ${productId}`,
        error: error.message,
        code: error.code || 500
      });
      throw error;
    }
  }

  // ===== CATEGORIAS =====

  /**
   * Lista todas as categorias
   * @param {Object} options Opções de filtragem
   * @returns {Promise<Array>} Lista de categorias
   */
  async listCategories(options = {}) {
    try {
      return await this.categoryManager.list(options);
    } catch (error) {
      this.emit('error', {
        message: 'Falha ao listar categorias',
        error: error.message,
        code: error.code || 500
      });
      throw error;
    }
  }

  /**
   * Obtém detalhes de uma categoria
   * @param {number} categoryId ID da categoria
   * @returns {Promise<Object>} Detalhes da categoria
   */
  async getCategory(categoryId) {
    try {
      return await this.categoryManager.get(categoryId);
    } catch (error) {
      this.emit('error', {
        message: `Falha ao obter detalhes da categoria ${categoryId}`,
        error: error.message,
        code: error.code || 500
      });
      throw error;
    }
  }

  /**
   * Cria uma nova categoria
   * @param {Object} categoryData Dados da categoria
   * @returns {Promise<Object>} Categoria criada
   */
  async createCategory(categoryData) {
    try {
      const category = await this.categoryManager.create(categoryData);
      this.emit('category-created', category);
      return category;
    } catch (error) {
      this.emit('error', {
        message: 'Falha ao criar categoria',
        error: error.message,
        code: error.code || 500
      });
      throw error;
    }
  }

  /**
   * Atualiza uma categoria existente
   * @param {number} categoryId ID da categoria
   * @param {Object} categoryData Dados da categoria
   * @returns {Promise<Object>} Categoria atualizada
   */
  async updateCategory(categoryId, categoryData) {
    try {
      const category = await this.categoryManager.update(categoryId, categoryData);
      this.emit('category-updated', category);
      return category;
    } catch (error) {
      this.emit('error', {
        message: `Falha ao atualizar categoria ${categoryId}`,
        error: error.message,
        code: error.code || 500
      });
      throw error;
    }
  }

  /**
   * Remove uma categoria
   * @param {number} categoryId ID da categoria
   * @param {boolean} force Forçar exclusão mesmo com produtos associados
   * @returns {Promise<Object>} Resultado da operação
   */
  async deleteCategory(categoryId, force = false) {
    try {
      const result = await this.categoryManager.delete(categoryId, force);
      this.emit('category-deleted', { id: categoryId, force });
      return result;
    } catch (error) {
      this.emit('error', {
        message: `Falha ao remover categoria ${categoryId}`,
        error: error.message,
        code: error.code || 500
      });
      throw error;
    }
  }

  // ===== PEDIDOS =====

  /**
   * Lista todos os pedidos
   * @param {Object} options Opções de filtragem
   * @returns {Promise<Array>} Lista de pedidos
   */
  async listOrders(options = {}) {
    try {
      return await this.orderManager.list(options);
    } catch (error) {
      this.emit('error', {
        message: 'Falha ao listar pedidos',
        error: error.message,
        code: error.code || 500
      });
      throw error;
    }
  }

  /**
   * Obtém detalhes de um pedido
   * @param {number} orderId ID do pedido
   * @returns {Promise<Object>} Detalhes do pedido
   */
  async getOrder(orderId) {
    try {
      return await this.orderManager.get(orderId);
    } catch (error) {
      this.emit('error', {
        message: `Falha ao obter detalhes do pedido ${orderId}`,
        error: error.message,
        code: error.code || 500
      });
      throw error;
    }
  }

  /**
   * Atualiza um pedido existente
   * @param {number} orderId ID do pedido
   * @param {Object} orderData Dados do pedido
   * @returns {Promise<Object>} Pedido atualizado
   */
  async updateOrder(orderId, orderData) {
    try {
      const order = await this.orderManager.update(orderId, orderData);
      this.emit('order-updated', order);
      return order;
    } catch (error) {
      this.emit('error', {
        message: `Falha ao atualizar pedido ${orderId}`,
        error: error.message,
        code: error.code || 500
      });
      throw error;
    }
  }

  /**
   * Atualiza o status de um pedido
   * @param {number} orderId ID do pedido
   * @param {string} status Novo status do pedido
   * @returns {Promise<Object>} Pedido atualizado
   */
  async updateOrderStatus(orderId, status) {
    try {
      const order = await this.orderManager.updateStatus(orderId, status);
      this.emit('order-status-updated', { id: orderId, status });
      return order;
    } catch (error) {
      this.emit('error', {
        message: `Falha ao atualizar status do pedido ${orderId}`,
        error: error.message,
        code: error.code || 500
      });
      throw error;
    }
  }

  // ===== CLIENTES =====

  /**
   * Lista todos os clientes
   * @param {Object} options Opções de filtragem
   * @returns {Promise<Array>} Lista de clientes
   */
  async listCustomers(options = {}) {
    try {
      return await this.customerManager.list(options);
    } catch (error) {
      this.emit('error', {
        message: 'Falha ao listar clientes',
        error: error.message,
        code: error.code || 500
      });
      throw error;
    }
  }

  /**
   * Obtém detalhes de um cliente
   * @param {number} customerId ID do cliente
   * @returns {Promise<Object>} Detalhes do cliente
   */
  async getCustomer(customerId) {
    try {
      return await this.customerManager.get(customerId);
    } catch (error) {
      this.emit('error', {
        message: `Falha ao obter detalhes do cliente ${customerId}`,
        error: error.message,
        code: error.code || 500
      });
      throw error;
    }
  }

  /**
   * Cria um novo cliente
   * @param {Object} customerData Dados do cliente
   * @returns {Promise<Object>} Cliente criado
   */
  async createCustomer(customerData) {
    try {
      const customer = await this.customerManager.create(customerData);
      this.emit('customer-created', customer);
      return customer;
    } catch (error) {
      this.emit('error', {
        message: 'Falha ao criar cliente',
        error: error.message,
        code: error.code || 500
      });
      throw error;
    }
  }

  // ===== CONFIGURAÇÕES =====

  /**
   * Obtém configurações da loja
   * @param {string} group Grupo de configurações (opcional)
   * @returns {Promise<Object>} Configurações da loja
   */
  async getSettings(group = '') {
    try {
      return await this.settingsManager.get(group);
    } catch (error) {
      this.emit('error', {
        message: 'Falha ao obter configurações da loja',
        error: error.message,
        code: error.code || 500
      });
      throw error;
    }
  }

  /**
   * Atualiza configurações da loja
   * @param {string} group Grupo de configurações
   * @param {string} id ID da configuração
   * @param {Object} data Dados da configuração
   * @returns {Promise<Object>} Configuração atualizada
   */
  async updateSetting(group, id, data) {
    try {
      const setting = await this.settingsManager.update(group, id, data);
      this.emit('setting-updated', { group, id, data });
      return setting;
    } catch (error) {
      this.emit('error', {
        message: `Falha ao atualizar configuração ${id} do grupo ${group}`,
        error: error.message,
        code: error.code || 500
      });
      throw error;
    }
  }

  /**
   * Obtém status do sistema
   * @returns {Promise<Object>} Status do sistema
   */
  async getSystemStatus() {
    try {
      return await this.api.get('system_status');
    } catch (error) {
      this.emit('error', {
        message: 'Falha ao obter status do sistema',
        error: error.message,
        code: error.code || 500
      });
      throw error;
    }
  }

  /**
   * Obtém status dos webhooks
   * @returns {Promise<Array>} Lista de webhooks configurados
   */
  async getWebhooks() {
    try {
      return await this.api.get('webhooks');
    } catch (error) {
      this.emit('error', {
        message: 'Falha ao obter webhooks',
        error: error.message,
        code: error.code || 500
      });
      throw error;
    }
  }

  /**
   * Cria um novo webhook
   * @param {Object} webhookData Dados do webhook
   * @returns {Promise<Object>} Webhook criado
   */
  async createWebhook(webhookData) {
    try {
      const webhook = await this.api.post('webhooks', webhookData);
      this.emit('webhook-created', webhook);
      return webhook;
    } catch (error) {
      this.emit('error', {
        message: 'Falha ao criar webhook',
        error: error.message,
        code: error.code || 500
      });
      throw error;
    }
  }
}

module.exports = WooCommerceProvider;