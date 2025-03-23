/**
 * Configuração do provedor Shopify
 */

module.exports = {
  // Configuração da API
  shopName: process.env.SHOPIFY_SHOP_NAME || '',
  apiKey: process.env.SHOPIFY_API_KEY || '',
  apiSecret: process.env.SHOPIFY_API_SECRET || '',
  accessToken: process.env.SHOPIFY_ACCESS_TOKEN || '',
  apiVersion: process.env.SHOPIFY_API_VERSION || '2023-10',
  
  // Escopos de permissão (para fluxo OAuth)
  scopes: [
    'read_products',
    'write_products',
    'read_product_listings',
    'read_customers',
    'write_customers',
    'read_orders',
    'write_orders',
    'read_content',
    'write_content',
    'read_themes',
    'write_themes',
    'read_script_tags',
    'write_script_tags',
    'read_shipping',
    'write_shipping'
  ],
  
  // Configuração de recursos padrão
  defaults: {
    // Status de pedidos padrão
    orderStatuses: [
      'open',
      'closed',
      'cancelled',
      'any'
    ],
    
    // Status financeiros de pedidos
    financialStatuses: [
      'pending',
      'authorized',
      'partially_paid',
      'paid',
      'partially_refunded',
      'refunded',
      'voided'
    ],
    
    // Status de fulfillment
    fulfillmentStatuses: [
      'shipped',
      'partial',
      'unshipped',
      'any'
    ],
    
    // Razões de cancelamento
    cancelReasons: [
      'customer',
      'fraud',
      'inventory',
      'declined',
      'other'
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
      'collection-created',
      'collection-updated',
      'collection-deleted',
      'order-updated',
      'order-closed',
      'order-canceled',
      'customer-created',
      'customer-updated',
      'customer-deleted',
      'theme-set-main'
    ]
  },
  
  // Configuração de limites de taxa
  rateLimit: {
    restCalls: {
      maxCallsPerSecond: 2, // Shopify recomenda no máximo 2 chamadas por segundo
      maxBurst: 40, // Limite máximo de chamadas em rajada
      resetTime: 30000 // Tempo para reset em caso de limite excedido (30 segundos)
    },
    graphqlCalls: {
      maxCostPerSecond: 50, // Limite de custo por segundo para GraphQL
      maxDepth: 10, // Profundidade máxima de consultas GraphQL
      maxCost: 1000 // Custo máximo total por consulta
    }
  },
  
  // Configuração de logging
  logging: {
    level: process.env.SHOPIFY_LOG_LEVEL || 'info',
    format: 'json',
    file: process.env.SHOPIFY_LOG_FILE || './logs/shopify.log'
  },
  
  // Configuração de webhooks
  webhooks: {
    enabled: process.env.SHOPIFY_WEBHOOKS_ENABLED === 'true',
    callbackUrl: process.env.SHOPIFY_WEBHOOK_CALLBACK_URL || '',
    secret: process.env.SHOPIFY_WEBHOOK_SECRET || '',
    topics: [
      'orders/create',
      'orders/cancelled',
      'orders/fulfilled',
      'orders/paid',
      'orders/updated',
      'products/create',
      'products/update',
      'products/delete',
      'customers/create',
      'customers/update',
      'customers/delete',
      'themes/publish'
    ]
  },
  
  // Configuração da API GraphQL
  graphql: {
    enabled: true, // Habilita o uso de GraphQL quando possível
    preferOverRest: false, // Prefere GraphQL sobre REST quando ambos estão disponíveis
    maxItemsPerRequest: 250, // Máximo de itens por requisição
    includeDeprecated: false // Inclui campos e recursos obsoletos
  },
  
  // Configuração de recursos opcionais
  features: {
    // Permite interação com temas
    themeManagement: true,
    // Permite acesso a metafields
    metafields: true,
    // Habilita estatísticas de clientes
    customerStats: true,
    // Permite gerenciamento de fulfillments
    fulfillments: true,
    // Habilita suporte a múltiplas moedas
    multiCurrency: true
  },
  
  // Configurações de autenticação OAuth
  oauth: {
    redirectUri: process.env.SHOPIFY_OAUTH_REDIRECT_URI || '',
    // URI para retornar após autorização
    useOnlineTokens: true, // Usar tokens online (com prazo de validade)
    // Define se deve usar tokens de acesso online (expiráveis) ou offline (permanentes)
    forceApproval: false // Forçar tela de aprovação mesmo se já autorizado
  }
};