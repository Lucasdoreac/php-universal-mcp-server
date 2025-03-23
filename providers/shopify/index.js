/**
 * Shopify Provider
 * 
 * Implementa a integração com a API Shopify para gerenciamento
 * de lojas, produtos, coleções, pedidos e configurações.
 */

const { EventEmitter } = require('events');
const ShopifyAuth = require('./auth');
const ShopifyAPI = require('./api');
const ProductManager = require('./product');
const CollectionManager = require('./collection');
const OrderManager = require('./order');
const CustomerManager = require('./customer');
const ThemeManager = require('./theme');
const SettingsManager = require('./settings');

class ShopifyProvider extends EventEmitter {
  /**
   * Construtor do provedor Shopify
   * @param {Object} config Configuração do provedor
   * @param {string} config.shopName Nome da loja Shopify
   * @param {string} config.apiKey Chave da API Shopify
   * @param {string} config.apiSecret Segredo da API Shopify
   * @param {string} config.accessToken Token de acesso para API (opcional se usar OAuth)
   * @param {string} config.apiVersion Versão da API (padrão: 2023-10)
   * @param {Object} config.options Opções adicionais (opcional)
   */
  constructor(config) {
    super();
    
    if (!config.shopName) {
      throw new Error('Nome da loja Shopify é obrigatório');
    }
    
    if (!config.apiKey || !config.apiSecret) {
      throw new Error('Chave e segredo da API Shopify são obrigatórios');
    }
    
    this.config = config;
    this.shopName = config.shopName;
    this.options = config.options || {};
    
    // Inicializa sistema de autenticação
    this.auth = new ShopifyAuth({
      shopName: config.shopName,
      apiKey: config.apiKey,
      apiSecret: config.apiSecret,
      accessToken: config.accessToken,
      apiVersion: config.apiVersion || '2023-10',
      scopes: config.scopes || ['read_products', 'write_products', 'read_orders', 'write_orders', 'read_customers', 'write_customers']
    });
    
    // Inicializa API base
    this.api = new ShopifyAPI(this.auth);
    
    // Inicializa gerenciadores específicos
    this.productManager = new ProductManager(this.api);
    this.collectionManager = new CollectionManager(this.api);
    this.orderManager = new OrderManager(this.api);
    this.customerManager = new CustomerManager(this.api);
    this.themeManager = new ThemeManager(this.api);
    this.settingsManager = new SettingsManager(this.api);
  }

  /**
   * Inicializa o provedor
   * @returns {Promise<boolean>} Sucesso da inicialização
   */
  async initialize() {
    try {
      // Verifica conexão com a API Shopify
      const shopInfo = await this.api.get('shop.json');
      this.shopInfo = shopInfo.shop;
      
      this.emit('initialized', true);
      return true;
    } catch (error) {
      this.emit('error', {
        message: 'Falha ao inicializar o provedor Shopify',
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
  async getShopInfo() {
    try {
      const response = await this.api.get('shop.json');
      return response.shop;
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
   * @returns {Promise<Object>} Resultado da operação
   */
  async deleteProduct(productId) {
    try {
      const result = await this.productManager.delete(productId);
      this.emit('product-deleted', { id: productId });
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
   * Obtém variantes de um produto
   * @param {number} productId ID do produto
   * @returns {Promise<Array>} Lista de variantes
   */
  async getProductVariants(productId) {
    try {
      return await this.productManager.getVariants(productId);
    } catch (error) {
      this.emit('error', {
        message: `Falha ao obter variantes do produto ${productId}`,
        error: error.message,
        code: error.code || 500
      });
      throw error;
    }
  }

  // ===== COLEÇÕES =====

  /**
   * Lista todas as coleções personalizadas
   * @param {Object} options Opções de filtragem
   * @returns {Promise<Array>} Lista de coleções
   */
  async listCustomCollections(options = {}) {
    try {
      return await this.collectionManager.listCustom(options);
    } catch (error) {
      this.emit('error', {
        message: 'Falha ao listar coleções personalizadas',
        error: error.message,
        code: error.code || 500
      });
      throw error;
    }
  }

  /**
   * Lista todas as coleções inteligentes
   * @param {Object} options Opções de filtragem
   * @returns {Promise<Array>} Lista de coleções
   */
  async listSmartCollections(options = {}) {
    try {
      return await this.collectionManager.listSmart(options);
    } catch (error) {
      this.emit('error', {
        message: 'Falha ao listar coleções inteligentes',
        error: error.message,
        code: error.code || 500
      });
      throw error;
    }
  }

  /**
   * Obtém detalhes de uma coleção
   * @param {number} collectionId ID da coleção
   * @param {boolean} isCustom Indica se é uma coleção personalizada
   * @returns {Promise<Object>} Detalhes da coleção
   */
  async getCollection(collectionId, isCustom = true) {
    try {
      return await this.collectionManager.get(collectionId, isCustom);
    } catch (error) {
      this.emit('error', {
        message: `Falha ao obter detalhes da coleção ${collectionId}`,
        error: error.message,
        code: error.code || 500
      });
      throw error;
    }
  }

  /**
   * Cria uma nova coleção personalizada
   * @param {Object} collectionData Dados da coleção
   * @returns {Promise<Object>} Coleção criada
   */
  async createCustomCollection(collectionData) {
    try {
      const collection = await this.collectionManager.createCustom(collectionData);
      this.emit('collection-created', collection);
      return collection;
    } catch (error) {
      this.emit('error', {
        message: 'Falha ao criar coleção personalizada',
        error: error.message,
        code: error.code || 500
      });
      throw error;
    }
  }

  /**
   * Cria uma nova coleção inteligente
   * @param {Object} collectionData Dados da coleção
   * @returns {Promise<Object>} Coleção criada
   */
  async createSmartCollection(collectionData) {
    try {
      const collection = await this.collectionManager.createSmart(collectionData);
      this.emit('collection-created', collection);
      return collection;
    } catch (error) {
      this.emit('error', {
        message: 'Falha ao criar coleção inteligente',
        error: error.message,
        code: error.code || 500
      });
      throw error;
    }
  }

  /**
   * Atualiza uma coleção existente
   * @param {number} collectionId ID da coleção
   * @param {Object} collectionData Dados da coleção
   * @param {boolean} isCustom Indica se é uma coleção personalizada
   * @returns {Promise<Object>} Coleção atualizada
   */
  async updateCollection(collectionId, collectionData, isCustom = true) {
    try {
      const collection = await this.collectionManager.update(collectionId, collectionData, isCustom);
      this.emit('collection-updated', collection);
      return collection;
    } catch (error) {
      this.emit('error', {
        message: `Falha ao atualizar coleção ${collectionId}`,
        error: error.message,
        code: error.code || 500
      });
      throw error;
    }
  }

  /**
   * Remove uma coleção
   * @param {number} collectionId ID da coleção
   * @param {boolean} isCustom Indica se é uma coleção personalizada
   * @returns {Promise<Object>} Resultado da operação
   */
  async deleteCollection(collectionId, isCustom = true) {
    try {
      const result = await this.collectionManager.delete(collectionId, isCustom);
      this.emit('collection-deleted', { id: collectionId, isCustom });
      return result;
    } catch (error) {
      this.emit('error', {
        message: `Falha ao remover coleção ${collectionId}`,
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
   * Fecha um pedido
   * @param {number} orderId ID do pedido
   * @returns {Promise<Object>} Pedido fechado
   */
  async closeOrder(orderId) {
    try {
      const order = await this.orderManager.close(orderId);
      this.emit('order-closed', { id: orderId });
      return order;
    } catch (error) {
      this.emit('error', {
        message: `Falha ao fechar pedido ${orderId}`,
        error: error.message,
        code: error.code || 500
      });
      throw error;
    }
  }

  /**
   * Cancela um pedido
   * @param {number} orderId ID do pedido
   * @param {Object} options Opções de cancelamento
   * @returns {Promise<Object>} Pedido cancelado
   */
  async cancelOrder(orderId, options = {}) {
    try {
      const order = await this.orderManager.cancel(orderId, options);
      this.emit('order-canceled', { id: orderId });
      return order;
    } catch (error) {
      this.emit('error', {
        message: `Falha ao cancelar pedido ${orderId}`,
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

  /**
   * Atualiza um cliente existente
   * @param {number} customerId ID do cliente
   * @param {Object} customerData Dados do cliente
   * @returns {Promise<Object>} Cliente atualizado
   */
  async updateCustomer(customerId, customerData) {
    try {
      const customer = await this.customerManager.update(customerId, customerData);
      this.emit('customer-updated', customer);
      return customer;
    } catch (error) {
      this.emit('error', {
        message: `Falha ao atualizar cliente ${customerId}`,
        error: error.message,
        code: error.code || 500
      });
      throw error;
    }
  }

  /**
   * Remove um cliente
   * @param {number} customerId ID do cliente
   * @returns {Promise<Object>} Resultado da operação
   */
  async deleteCustomer(customerId) {
    try {
      const result = await this.customerManager.delete(customerId);
      this.emit('customer-deleted', { id: customerId });
      return result;
    } catch (error) {
      this.emit('error', {
        message: `Falha ao remover cliente ${customerId}`,
        error: error.message,
        code: error.code || 500
      });
      throw error;
    }
  }

  // ===== TEMAS =====

  /**
   * Lista todos os temas
   * @returns {Promise<Array>} Lista de temas
   */
  async listThemes() {
    try {
      return await this.themeManager.list();
    } catch (error) {
      this.emit('error', {
        message: 'Falha ao listar temas',
        error: error.message,
        code: error.code || 500
      });
      throw error;
    }
  }

  /**
   * Obtém detalhes de um tema
   * @param {number} themeId ID do tema
   * @returns {Promise<Object>} Detalhes do tema
   */
  async getTheme(themeId) {
    try {
      return await this.themeManager.get(themeId);
    } catch (error) {
      this.emit('error', {
        message: `Falha ao obter detalhes do tema ${themeId}`,
        error: error.message,
        code: error.code || 500
      });
      throw error;
    }
  }

  /**
   * Obtém o tema principal da loja
   * @returns {Promise<Object>} Tema principal
   */
  async getMainTheme() {
    try {
      return await this.themeManager.getMain();
    } catch (error) {
      this.emit('error', {
        message: 'Falha ao obter tema principal',
        error: error.message,
        code: error.code || 500
      });
      throw error;
    }
  }

  /**
   * Define um tema como principal
   * @param {number} themeId ID do tema
   * @returns {Promise<Object>} Tema atualizado
   */
  async setMainTheme(themeId) {
    try {
      const theme = await this.themeManager.setAsMain(themeId);
      this.emit('theme-set-main', { id: themeId });
      return theme;
    } catch (error) {
      this.emit('error', {
        message: `Falha ao definir tema ${themeId} como principal`,
        error: error.message,
        code: error.code || 500
      });
      throw error;
    }
  }

  // ===== CONFIGURAÇÕES =====

  /**
   * Obtém configurações da loja
   * @returns {Promise<Object>} Configurações da loja
   */
  async getShopSettings() {
    try {
      return await this.settingsManager.getShopSettings();
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
   * Obtém políticas da loja (privacidade, reembolso, etc.)
   * @returns {Promise<Object>} Políticas da loja
   */
  async getShopPolicies() {
    try {
      return await this.settingsManager.getPolicies();
    } catch (error) {
      this.emit('error', {
        message: 'Falha ao obter políticas da loja',
        error: error.message,
        code: error.code || 500
      });
      throw error;
    }
  }

  /**
   * Obtém configurações de envio
   * @returns {Promise<Object>} Configurações de envio
   */
  async getShippingSettings() {
    try {
      return await this.settingsManager.getShippingSettings();
    } catch (error) {
      this.emit('error', {
        message: 'Falha ao obter configurações de envio',
        error: error.message,
        code: error.code || 500
      });
      throw error;
    }
  }

  /**
   * Obtém configurações de pagamento
   * @returns {Promise<Object>} Configurações de pagamento
   */
  async getPaymentSettings() {
    try {
      return await this.settingsManager.getPaymentSettings();
    } catch (error) {
      this.emit('error', {
        message: 'Falha ao obter configurações de pagamento',
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
      return await this.api.get('webhooks.json');
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
      const response = await this.api.post('webhooks.json', { webhook: webhookData });
      const webhook = response.webhook;
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

module.exports = ShopifyProvider;