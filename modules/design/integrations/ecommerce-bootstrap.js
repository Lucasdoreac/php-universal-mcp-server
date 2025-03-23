/**
 * Integração dos templates Bootstrap com o módulo de e-commerce
 * Conecta o Design System com o gerenciador de produtos, pedidos e clientes
 */

const path = require('path');
const BootstrapTemplateRenderer = require('../services/BootstrapTemplateRenderer');
const ComponentManager = require('../services/ComponentManager');

class EcommerceBootstrapIntegration {
  /**
   * Construtor
   * @param {Object} options - Opções da integração
   * @param {Object} options.ecommerceManager - Instância do gerenciador de e-commerce
   * @param {Object} options.logger - Logger para registrar informações e erros
   */
  constructor(options = {}) {
    this.ecommerceManager = options.ecommerceManager;
    this.logger = options.logger || console;
    
    this.templateRenderer = new BootstrapTemplateRenderer();
    this.componentManager = new ComponentManager({
      componentsDir: path.join(__dirname, '../components')
    });
    
    // Registrar helpers específicos para e-commerce
    this._registerHelpers();
  }
  
  /**
   * Registra helpers específicos para e-commerce
   * @private
   */
  _registerHelpers() {
    // Registrar helpers específicos para e-commerce nos templates
    this.templateRenderer.registerHelper('formatPrice', this._formatPrice.bind(this));
    this.templateRenderer.registerHelper('discountPercentage', this._discountPercentage.bind(this));
    this.templateRenderer.registerHelper('stockStatus', this._stockStatus.bind(this));
    this.templateRenderer.registerHelper('ratingStars', this._ratingStars.bind(this));
  }
  
  /**
   * Formata um preço de acordo com a moeda e configurações da loja
   * @private
   * @param {number} price - Preço a ser formatado
   * @param {Object} options - Opções de formatação
   * @returns {string} Preço formatado
   */
  _formatPrice(price, options = {}) {
    if (!this.ecommerceManager) {
      // Fallback se não houver gerenciador de e-commerce
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(price);
    }
    
    // Usar configurações da loja para formatação
    return this.ecommerceManager.formatPrice(price, options);
  }
  
  /**
   * Calcula a porcentagem de desconto entre preço original e preço promocional
   * @private
   * @param {number} originalPrice - Preço original
   * @param {number} salePrice - Preço promocional
   * @returns {string} Porcentagem de desconto formatada
   */
  _discountPercentage(originalPrice, salePrice) {
    if (!originalPrice || !salePrice || originalPrice <= salePrice) {
      return '0%';
    }
    
    const discount = ((originalPrice - salePrice) / originalPrice) * 100;
    return `${Math.round(discount)}%`;
  }
  
  /**
   * Retorna o status de estoque de um produto
   * @private
   * @param {number} stock - Quantidade em estoque
   * @param {Object} options - Opções do helper Handlebars
   * @returns {string} HTML para o status de estoque
   */
  _stockStatus(stock, options) {
    if (stock <= 0) {
      return '<span class="badge bg-danger">Fora de estoque</span>';
    } else if (stock <= 5) {
      return '<span class="badge bg-warning text-dark">Últimas unidades</span>';
    } else {
      return '<span class="badge bg-success">Em estoque</span>';
    }
  }
  
  /**
   * Gera HTML para exibição de classificação em estrelas
   * @private
   * @param {number} rating - Classificação (de 0 a 5)
   * @param {Object} options - Opções do helper Handlebars
   * @returns {string} HTML para as estrelas
   */
  _ratingStars(rating, options) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    
    let html = '';
    
    // Estrelas cheias
    for (let i = 0; i < fullStars; i++) {
      html += '<i class="bi bi-star-fill text-warning"></i>';
    }
    
    // Meia estrela, se necessário
    if (halfStar) {
      html += '<i class="bi bi-star-half text-warning"></i>';
    }
    
    // Estrelas vazias
    for (let i = 0; i < emptyStars; i++) {
      html += '<i class="bi bi-star text-warning"></i>';
    }
    
    return html;
  }
  
  /**
   * Renderiza um template de produto com dados do e-commerce
   * @param {string} productId - ID do produto
   * @param {string} templateName - Nome do template
   * @param {Object} options - Opções de renderização
   * @returns {Promise<string>} HTML renderizado
   */
  async renderProductTemplate(productId, templateName = 'product-detail', options = {}) {
    try {
      if (!this.ecommerceManager) {
        throw new Error('Gerenciador de e-commerce não disponível');
      }
      
      // Obter dados do produto
      const product = await this.ecommerceManager.getProduct(productId);
      if (!product) {
        throw new Error(`Produto não encontrado: ${productId}`);
      }
      
      // Obter dados relacionados
      const relatedProducts = await this.ecommerceManager.getRelatedProducts(productId);
      const categories = await this.ecommerceManager.getCategories();
      
      // Dados para o template
      const data = {
        product,
        relatedProducts,
        categories,
        siteInfo: await this.ecommerceManager.getStoreInfo()
      };
      
      // Renderizar template específico
      let html;
      
      switch (templateName) {
        case 'product-detail':
          html = await this.templateRenderer.render('bs-ecommerce-product', options, data);
          break;
        case 'product-card':
          html = await this.componentManager.renderComponent('bootstrap/product/bs-product-card', {
            options,
            product
          });
          break;
        case 'product-modal':
          html = await this.componentManager.renderComponent('bootstrap/modal/bs-product-modal', {
            options,
            product
          });
          break;
        default:
          throw new Error(`Template não reconhecido: ${templateName}`);
      }
      
      return html;
    } catch (error) {
      this.logger.error('Erro ao renderizar template de produto:', error);
      throw error;
    }
  }
  
  /**
   * Renderiza um template de categoria com produtos
   * @param {string} categoryId - ID da categoria
   * @param {Object} options - Opções de renderização
   * @returns {Promise<string>} HTML renderizado
   */
  async renderCategoryTemplate(categoryId, options = {}) {
    try {
      if (!this.ecommerceManager) {
        throw new Error('Gerenciador de e-commerce não disponível');
      }
      
      // Obter dados da categoria
      const category = await this.ecommerceManager.getCategory(categoryId);
      if (!category) {
        throw new Error(`Categoria não encontrada: ${categoryId}`);
      }
      
      // Obter produtos da categoria
      const products = await this.ecommerceManager.getProductsByCategory(categoryId, {
        limit: options.limit || 12,
        page: options.page || 1,
        sort: options.sort || 'default'
      });
      
      // Obter todas as categorias para navegação
      const categories = await this.ecommerceManager.getCategories();
      
      // Dados para o template
      const data = {
        category,
        products,
        categories,
        pagination: products.pagination || {},
        siteInfo: await this.ecommerceManager.getStoreInfo()
      };
      
      // Renderizar template de categoria
      const html = await this.templateRenderer.render('bs-ecommerce-category', options, data);
      
      return html;
    } catch (error) {
      this.logger.error('Erro ao renderizar template de categoria:', error);
      throw error;
    }
  }
  
  /**
   * Renderiza a página de carrinho de compras
   * @param {string} cartId - ID do carrinho
   * @param {Object} options - Opções de renderização
   * @returns {Promise<string>} HTML renderizado
   */
  async renderCartTemplate(cartId, options = {}) {
    try {
      if (!this.ecommerceManager) {
        throw new Error('Gerenciador de e-commerce não disponível');
      }
      
      // Obter dados do carrinho
      const cart = await this.ecommerceManager.getCart(cartId);
      if (!cart) {
        throw new Error(`Carrinho não encontrado: ${cartId}`);
      }
      
      // Dados para o template
      const data = {
        cart,
        siteInfo: await this.ecommerceManager.getStoreInfo()
      };
      
      // Renderizar template de carrinho
      const html = await this.templateRenderer.render('bs-ecommerce-cart', options, data);
      
      return html;
    } catch (error) {
      this.logger.error('Erro ao renderizar template de carrinho:', error);
      throw error;
    }
  }
  
  /**
   * Renderiza a página de checkout
   * @param {string} cartId - ID do carrinho
   * @param {Object} options - Opções de renderização
   * @returns {Promise<string>} HTML renderizado
   */
  async renderCheckoutTemplate(cartId, options = {}) {
    try {
      if (!this.ecommerceManager) {
        throw new Error('Gerenciador de e-commerce não disponível');
      }
      
      // Obter dados do carrinho
      const cart = await this.ecommerceManager.getCart(cartId);
      if (!cart) {
        throw new Error(`Carrinho não encontrado: ${cartId}`);
      }
      
      // Obter métodos de pagamento e envio disponíveis
      const paymentMethods = await this.ecommerceManager.getPaymentMethods();
      const shippingMethods = await this.ecommerceManager.getShippingMethods(cart);
      
      // Dados para o template
      const data = {
        cart,
        paymentMethods,
        shippingMethods,
        siteInfo: await this.ecommerceManager.getStoreInfo()
      };
      
      // Renderizar template de checkout
      const html = await this.templateRenderer.render('bs-ecommerce-checkout', options, data);
      
      return html;
    } catch (error) {
      this.logger.error('Erro ao renderizar template de checkout:', error);
      throw error;
    }
  }
  
  /**
   * Renderiza a página de gerenciamento de pedidos (para clientes)
   * @param {string} customerId - ID do cliente
   * @param {Object} options - Opções de renderização
   * @returns {Promise<string>} HTML renderizado
   */
  async renderOrdersTemplate(customerId, options = {}) {
    try {
      if (!this.ecommerceManager) {
        throw new Error('Gerenciador de e-commerce não disponível');
      }
      
      // Obter pedidos do cliente
      const orders = await this.ecommerceManager.getCustomerOrders(customerId, {
        limit: options.limit || 10,
        page: options.page || 1,
        status: options.status
      });
      
      // Dados para o template
      const data = {
        orders,
        customer: await this.ecommerceManager.getCustomer(customerId),
        pagination: orders.pagination || {},
        siteInfo: await this.ecommerceManager.getStoreInfo()
      };
      
      // Renderizar template de pedidos
      const html = await this.templateRenderer.render('bs-ecommerce-orders', options, data);
      
      return html;
    } catch (error) {
      this.logger.error('Erro ao renderizar template de pedidos:', error);
      throw error;
    }
  }
  
  /**
   * Renderiza componentes de produto para uso em páginas diversas
   * @param {Array} productIds - IDs dos produtos a renderizar
   * @param {string} componentType - Tipo de componente ('card', 'list', 'mini')
   * @param {Object} options - Opções de renderização
   * @returns {Promise<Array<string>>} Array de HTMLs renderizados
   */
  async renderProductComponents(productIds, componentType = 'card', options = {}) {
    try {
      if (!this.ecommerceManager) {
        throw new Error('Gerenciador de e-commerce não disponível');
      }
      
      // Obter produtos
      const products = await Promise.all(
        productIds.map(id => this.ecommerceManager.getProduct(id))
      );
      
      // Filtrar produtos não encontrados
      const validProducts = products.filter(Boolean);
      
      // Mapear componente a renderizar
      let componentName;
      switch (componentType) {
        case 'card':
          componentName = 'bootstrap/product/bs-product-card';
          break;
        case 'list':
          componentName = 'bootstrap/product/bs-product-list-item';
          break;
        case 'mini':
          componentName = 'bootstrap/product/bs-product-mini';
          break;
        default:
          componentName = 'bootstrap/product/bs-product-card';
      }
      
      // Renderizar componentes para cada produto
      const htmlComponents = await Promise.all(
        validProducts.map(product => 
          this.componentManager.renderComponent(componentName, {
            options,
            product
          })
        )
      );
      
      return htmlComponents;
    } catch (error) {
      this.logger.error('Erro ao renderizar componentes de produto:', error);
      throw error;
    }
  }
}

module.exports = EcommerceBootstrapIntegration;