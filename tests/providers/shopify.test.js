/**
 * Testes para o Shopify Provider
 * Este arquivo contém testes para verificar a funcionalidade do provedor Shopify
 * no PHP Universal MCP Server
 */

const { jest } = require('@jest/globals');
const mockAxios = require('jest-mock-axios').default;
const ShopifyProvider = require('../../providers/shopify');
const ShopifyAuth = require('../../providers/shopify/auth');
const ShopifyAPI = require('../../providers/shopify/api');

// Mock do logger
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
};

// Mock de configurações
const mockConfig = {
  shopify: {
    apiKey: 'test-api-key',
    apiSecret: 'test-api-secret',
    scopes: 'read_products,write_products,read_orders,write_orders',
    redirectUri: 'https://example.com/auth/callback'
  }
};

// Mock do token de autenticação
const mockTokenData = {
  access_token: 'test-access-token',
  refresh_token: 'test-refresh-token',
  scope: 'read_products,write_products,read_orders,write_orders',
  expires_in: 86400
};

// Mock para armazenamento de tokens
const mockTokenStore = {
  getToken: jest.fn(() => mockTokenData),
  saveToken: jest.fn(),
  deleteToken: jest.fn()
};

describe('Shopify Provider', () => {
  let shopifyProvider;
  
  beforeEach(() => {
    mockAxios.reset();
    jest.clearAllMocks();
    
    shopifyProvider = new ShopifyProvider({
      config: mockConfig,
      logger: mockLogger,
      tokenStore: mockTokenStore
    });
  });
  
  describe('Inicialização', () => {
    test('deve inicializar corretamente com as configurações fornecidas', () => {
      expect(shopifyProvider).toBeDefined();
      expect(shopifyProvider.config).toEqual(mockConfig);
      expect(shopifyProvider.logger).toEqual(mockLogger);
    });
    
    test('deve lançar erro se configurações estiverem faltando', () => {
      expect(() => new ShopifyProvider({
        logger: mockLogger,
        tokenStore: mockTokenStore
      })).toThrow(/Configuração obrigatória/);
    });
  });
  
  describe('Autenticação', () => {
    test('deve gerar URL de autorização corretamente', () => {
      const authUrl = shopifyProvider.auth.getAuthUrl('test-store.myshopify.com');
      expect(authUrl).toContain('https://test-store.myshopify.com/admin/oauth/authorize');
      expect(authUrl).toContain('client_id=test-api-key');
      expect(authUrl).toContain('scope=read_products,write_products,read_orders,write_orders');
      expect(authUrl).toContain('redirect_uri=https://example.com/auth/callback');
    });
    
    test('deve processar resposta de autorização e obter token de acesso', async () => {
      mockAxios.post.mockResolvedValueOnce({
        data: mockTokenData
      });
      
      const result = await shopifyProvider.auth.getAccessToken('test-store.myshopify.com', 'test-code');
      
      expect(mockAxios.post).toHaveBeenCalledWith(
        'https://test-store.myshopify.com/admin/oauth/access_token',
        expect.objectContaining({
          client_id: 'test-api-key',
          client_secret: 'test-api-secret',
          code: 'test-code'
        })
      );
      
      expect(result).toEqual(mockTokenData);
      expect(mockTokenStore.saveToken).toHaveBeenCalledWith('test-store.myshopify.com', mockTokenData);
    });
  });
  
  describe('Gerenciamento de Produtos', () => {
    const mockProducts = {
      products: [
        {
          id: 1,
          title: 'Produto Teste 1',
          price: '19.99',
          variants: [{ id: 101, price: '19.99' }]
        },
        {
          id: 2,
          title: 'Produto Teste 2',
          price: '29.99',
          variants: [{ id: 102, price: '29.99' }]
        }
      ]
    };
    
    test('deve listar produtos corretamente', async () => {
      mockAxios.get.mockResolvedValueOnce({
        data: mockProducts
      });
      
      const result = await shopifyProvider.product.list('test-store.myshopify.com');
      
      expect(mockAxios.get).toHaveBeenCalledWith(
        'https://test-store.myshopify.com/admin/api/2023-04/products.json',
        expect.objectContaining({
          headers: {
            'X-Shopify-Access-Token': 'test-access-token'
          }
        })
      );
      
      expect(result).toEqual(mockProducts.products);
    });
    
    test('deve obter detalhes de um produto específico', async () => {
      const mockProduct = {
        product: mockProducts.products[0]
      };
      
      mockAxios.get.mockResolvedValueOnce({
        data: mockProduct
      });
      
      const result = await shopifyProvider.product.get('test-store.myshopify.com', 1);
      
      expect(mockAxios.get).toHaveBeenCalledWith(
        'https://test-store.myshopify.com/admin/api/2023-04/products/1.json',
        expect.objectContaining({
          headers: {
            'X-Shopify-Access-Token': 'test-access-token'
          }
        })
      );
      
      expect(result).toEqual(mockProduct.product);
    });
    
    test('deve criar um novo produto', async () => {
      const newProduct = {
        title: 'Novo Produto',
        body_html: '<p>Descrição do novo produto</p>',
        vendor: 'Minha Loja',
        product_type: 'Físico',
        variants: [
          {
            price: '39.99',
            inventory_quantity: 10
          }
        ]
      };
      
      const mockResponse = {
        product: {
          id: 3,
          ...newProduct
        }
      };
      
      mockAxios.post.mockResolvedValueOnce({
        data: mockResponse
      });
      
      const result = await shopifyProvider.product.create('test-store.myshopify.com', newProduct);
      
      expect(mockAxios.post).toHaveBeenCalledWith(
        'https://test-store.myshopify.com/admin/api/2023-04/products.json',
        { product: newProduct },
        expect.objectContaining({
          headers: {
            'X-Shopify-Access-Token': 'test-access-token'
          }
        })
      );
      
      expect(result).toEqual(mockResponse.product);
    });
    
    test('deve atualizar um produto existente', async () => {
      const productId = 1;
      const updates = {
        title: 'Produto Atualizado',
        variants: [
          {
            id: 101,
            price: '24.99'
          }
        ]
      };
      
      const mockResponse = {
        product: {
          id: productId,
          title: 'Produto Atualizado',
          price: '24.99',
          variants: [{ id: 101, price: '24.99' }]
        }
      };
      
      mockAxios.put.mockResolvedValueOnce({
        data: mockResponse
      });
      
      const result = await shopifyProvider.product.update('test-store.myshopify.com', productId, updates);
      
      expect(mockAxios.put).toHaveBeenCalledWith(
        `https://test-store.myshopify.com/admin/api/2023-04/products/${productId}.json`,
        { product: updates },
        expect.objectContaining({
          headers: {
            'X-Shopify-Access-Token': 'test-access-token'
          }
        })
      );
      
      expect(result).toEqual(mockResponse.product);
    });
    
    test('deve excluir um produto', async () => {
      const productId = 1;
      
      mockAxios.delete.mockResolvedValueOnce({
        status: 200
      });
      
      await shopifyProvider.product.delete('test-store.myshopify.com', productId);
      
      expect(mockAxios.delete).toHaveBeenCalledWith(
        `https://test-store.myshopify.com/admin/api/2023-04/products/${productId}.json`,
        expect.objectContaining({
          headers: {
            'X-Shopify-Access-Token': 'test-access-token'
          }
        })
      );
    });
  });
  
  describe('Gerenciamento de Pedidos', () => {
    const mockOrders = {
      orders: [
        {
          id: 1001,
          order_number: '1001',
          total_price: '19.99',
          line_items: [{ product_id: 1, quantity: 1 }]
        },
        {
          id: 1002,
          order_number: '1002',
          total_price: '29.99',
          line_items: [{ product_id: 2, quantity: 1 }]
        }
      ]
    };
    
    test('deve listar pedidos corretamente', async () => {
      mockAxios.get.mockResolvedValueOnce({
        data: mockOrders
      });
      
      const result = await shopifyProvider.order.list('test-store.myshopify.com');
      
      expect(mockAxios.get).toHaveBeenCalledWith(
        'https://test-store.myshopify.com/admin/api/2023-04/orders.json',
        expect.objectContaining({
          headers: {
            'X-Shopify-Access-Token': 'test-access-token'
          }
        })
      );
      
      expect(result).toEqual(mockOrders.orders);
    });
    
    test('deve obter detalhes de um pedido específico', async () => {
      const mockOrder = {
        order: mockOrders.orders[0]
      };
      
      mockAxios.get.mockResolvedValueOnce({
        data: mockOrder
      });
      
      const result = await shopifyProvider.order.get('test-store.myshopify.com', 1001);
      
      expect(mockAxios.get).toHaveBeenCalledWith(
        'https://test-store.myshopify.com/admin/api/2023-04/orders/1001.json',
        expect.objectContaining({
          headers: {
            'X-Shopify-Access-Token': 'test-access-token'
          }
        })
      );
      
      expect(result).toEqual(mockOrder.order);
    });
    
    test('deve atualizar um pedido existente', async () => {
      const orderId = 1001;
      const updates = {
        note: 'Atualizado pelo sistema',
        tags: 'processado,enviado'
      };
      
      const mockResponse = {
        order: {
          ...mockOrders.orders[0],
          ...updates
        }
      };
      
      mockAxios.put.mockResolvedValueOnce({
        data: mockResponse
      });
      
      const result = await shopifyProvider.order.update('test-store.myshopify.com', orderId, updates);
      
      expect(mockAxios.put).toHaveBeenCalledWith(
        `https://test-store.myshopify.com/admin/api/2023-04/orders/${orderId}.json`,
        { order: updates },
        expect.objectContaining({
          headers: {
            'X-Shopify-Access-Token': 'test-access-token'
          }
        })
      );
      
      expect(result).toEqual(mockResponse.order);
    });
    
    test('deve processar uma ação em um pedido (cancelamento)', async () => {
      const orderId = 1001;
      const action = 'cancel';
      const actionData = { reason: 'customer' };
      
      const mockResponse = {
        order: {
          ...mockOrders.orders[0],
          cancelled: true,
          cancelled_at: '2023-04-01T12:00:00Z',
          cancel_reason: 'customer'
        }
      };
      
      mockAxios.post.mockResolvedValueOnce({
        data: mockResponse
      });
      
      const result = await shopifyProvider.order.process('test-store.myshopify.com', orderId, action, actionData);
      
      expect(mockAxios.post).toHaveBeenCalledWith(
        `https://test-store.myshopify.com/admin/api/2023-04/orders/${orderId}/cancel.json`,
        { reason: 'customer' },
        expect.objectContaining({
          headers: {
            'X-Shopify-Access-Token': 'test-access-token'
          }
        })
      );
      
      expect(result).toEqual(mockResponse.order);
    });
  });
  
  describe('Gerenciamento de Temas', () => {
    const mockThemes = {
      themes: [
        {
          id: 101,
          name: 'Tema 1',
          role: 'main',
          previewable: true
        },
        {
          id: 102,
          name: 'Tema 2',
          role: 'unpublished',
          previewable: true
        }
      ]
    };
    
    test('deve listar temas corretamente', async () => {
      mockAxios.get.mockResolvedValueOnce({
        data: mockThemes
      });
      
      const result = await shopifyProvider.theme.list('test-store.myshopify.com');
      
      expect(mockAxios.get).toHaveBeenCalledWith(
        'https://test-store.myshopify.com/admin/api/2023-04/themes.json',
        expect.objectContaining({
          headers: {
            'X-Shopify-Access-Token': 'test-access-token'
          }
        })
      );
      
      expect(result).toEqual(mockThemes.themes);
    });
    
    test('deve publicar um tema', async () => {
      const themeId = 102;
      const mockResponse = {
        theme: {
          ...mockThemes.themes[1],
          role: 'main'
        }
      };
      
      mockAxios.put.mockResolvedValueOnce({
        data: mockResponse
      });
      
      const result = await shopifyProvider.theme.publish('test-store.myshopify.com', themeId);
      
      expect(mockAxios.put).toHaveBeenCalledWith(
        `https://test-store.myshopify.com/admin/api/2023-04/themes/${themeId}.json`,
        { theme: { role: 'main' } },
        expect.objectContaining({
          headers: {
            'X-Shopify-Access-Token': 'test-access-token'
          }
        })
      );
      
      expect(result).toEqual(mockResponse.theme);
    });
  });
});
