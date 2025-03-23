/**
 * Configuração do provedor Hostinger
 */

module.exports = {
  // Configuração da API
  apiKey: process.env.HOSTINGER_API_KEY || '',
  apiEndpoint: process.env.HOSTINGER_API_ENDPOINT || 'https://api.hostinger.com/v1',
  
  // Configuração de autenticação
  auth: {
    clientId: process.env.HOSTINGER_CLIENT_ID || '',
    clientSecret: process.env.HOSTINGER_CLIENT_SECRET || '',
    tokenStoragePath: process.env.HOSTINGER_TOKEN_STORAGE_PATH || './data/tokens/hostinger'
  },
  
  // Configuração de recursos padrão para sites
  defaults: {
    // Planos disponíveis
    plans: {
      basic: {
        name: 'Premium',
        description: 'Plano básico para pequenos sites',
        resources: {
          bandwidth: '100GB',
          storage: '10GB',
          databases: 2,
          email: 10
        }
      },
      business: {
        name: 'Business',
        description: 'Plano para sites profissionais',
        resources: {
          bandwidth: 'Unlimited',
          storage: '20GB',
          databases: 10,
          email: 100
        }
      },
      enterprise: {
        name: 'Enterprise',
        description: 'Plano para grandes sites e e-commerce',
        resources: {
          bandwidth: 'Unlimited',
          storage: '100GB',
          databases: 'Unlimited',
          email: 'Unlimited'
        }
      }
    },
    
    // Templates disponíveis
    templates: [
      {
        id: 'blank',
        name: 'Site em branco',
        description: 'Inicie um site do zero'
      },
      {
        id: 'wordpress',
        name: 'WordPress',
        description: 'Inicie um site com WordPress pré-instalado'
      },
      {
        id: 'woocommerce',
        name: 'WooCommerce',
        description: 'Inicie uma loja online com WooCommerce'
      },
      {
        id: 'blog',
        name: 'Blog',
        description: 'Template para blog pessoal ou corporativo'
      },
      {
        id: 'business',
        name: 'Business',
        description: 'Template para site empresarial'
      },
      {
        id: 'portfolio',
        name: 'Portfolio',
        description: 'Template para portfolio criativo'
      }
    ],
    
    // Configurações de DNS padrão
    dns: {
      nameservers: [
        'ns1.hostinger.com',
        'ns2.hostinger.com'
      ],
      records: [
        { type: 'A', name: '@', content: '104.21.234.56', ttl: 14400 },
        { type: 'AAAA', name: '@', content: '2606:4700:3033::6815:c938', ttl: 14400 },
        { type: 'CNAME', name: 'www', content: '@', ttl: 14400 },
        { type: 'MX', name: '@', content: 'mx1.hostinger.com', priority: 10, ttl: 14400 },
        { type: 'MX', name: '@', content: 'mx2.hostinger.com', priority: 20, ttl: 14400 },
        { type: 'TXT', name: '@', content: 'v=spf1 include:hostinger.com ~all', ttl: 14400 }
      ]
    },
    
    // Configurações de SSL padrão
    ssl: {
      provider: 'letsencrypt',
      type: 'auto'
    }
  },
  
  // Configuração de cache
  cache: {
    enabled: true,
    ttl: 300, // 5 minutos
    invalidationEvents: [
      'site-created',
      'site-updated',
      'site-deleted',
      'domain-configured',
      'ssl-configured'
    ]
  },
  
  // Configuração de logging
  logging: {
    level: process.env.HOSTINGER_LOG_LEVEL || 'info',
    format: 'json',
    file: process.env.HOSTINGER_LOG_FILE || './logs/hostinger.log'
  }
};