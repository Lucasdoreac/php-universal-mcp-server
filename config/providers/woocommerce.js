/**
 * Configuração do provedor WooCommerce
 */

module.exports = {
  // Configuração da API
  url: process.env.WOOCOMMERCE_URL || '',
  consumerKey: process.env.WOOCOMMERCE_CONSUMER_KEY || '',
  consumerSecret: process.env.WOOCOMMERCE_CONSUMER_SECRET || '',
  wpUsername: process.env.WOOCOMMERCE_WP_USERNAME || '',
  wpPassword: process.env.WOOCOMMERCE_WP_PASSWORD || '',
  version: process.env.WOOCOMMERCE_API_VERSION || 'wc/v3',
  
  // Configuração de recursos padrão
  defaults: {
    // Status de pedidos padrão
    orderStatuses: [
      'pending', 
      'processing', 
      'on-hold', 
      'completed', 
      'cancelled', 
      'refunded', 
      'failed'
    ],
    
    // Tipos de produtos suportados
    productTypes: [
      {
        id: 'simple',
        name: 'Produto simples',
        description: 'Produto sem variações ou opções'
      },
      {
        id: 'variable',
        name: 'Produto variável',
        description: 'Produto com opções e variações'
      },
      {
        id: 'grouped',
        name: 'Produto agrupado',
        description: 'Grupo de produtos simples'
      },
      {
        id: 'external',
        name: 'Produto externo/Afiliado',
        description: 'Produto vendido em outro site'
      }
    ],
    
    // Status de estoque padrão
    stockStatuses: {
      instock: 'Em estoque',
      outofstock: 'Fora de estoque',
      onbackorder: 'Por encomenda'
    },
    
    // Status de impostos padrão
    taxStatuses: {
      taxable: 'Taxable',
      shipping: 'Shipping only',
      none: 'None'
    },
    
    // Campos personalizados suportados
    customFields: [
      {
        key: 'sku',
        label: 'SKU',
        description: 'Código único de produto'
      },
      {
        key: 'weight',
        label: 'Peso',
        description: 'Peso do produto'
      },
      {
        key: 'dimensions',
        label: 'Dimensões',
        description: 'Dimensões do produto (comprimento, largura, altura)'
      },
      {
        key: 'purchase_note',
        label: 'Nota de compra',
        description: 'Nota exibida ao cliente após a compra'
      }
    ]
  },
  
  // Configuração de cache
  cache: {
    enabled: true,
    ttl: 300, // 5 minutos
    invalidationEvents: [
      'product-created',
      'product-updated',
      'product-deleted',
      'category-created',
      'category-updated',
      'category-deleted',
      'order-updated',
      'order-status-updated',
      'customer-created',
      'setting-updated'
    ]
  },
  
  // Configuração de logging
  logging: {
    level: process.env.WOOCOMMERCE_LOG_LEVEL || 'info',
    format: 'json',
    file: process.env.WOOCOMMERCE_LOG_FILE || './logs/woocommerce.log'
  },
  
  // Configuração de webhooks
  webhooks: {
    enabled: process.env.WOOCOMMERCE_WEBHOOKS_ENABLED === 'true',
    callbackUrl: process.env.WOOCOMMERCE_WEBHOOK_CALLBACK_URL || '',
    secret: process.env.WOOCOMMERCE_WEBHOOK_SECRET || '',
    topics: [
      'order.created',
      'order.updated',
      'product.created',
      'product.updated',
      'product.deleted',
      'customer.created',
      'customer.updated'
    ]
  }
};