/**
 * Exemplo de uso do E-commerce Manager Core para gerenciamento de produtos
 */

const EcommerceManager = require('../index');
const MCPServer = require('../../../core/mcp-protocol/server');

// Exemplo de configuração do servidor MCP
const server = new MCPServer({
  port: process.env.MCP_PORT || 7654,
  logLevel: 'info'
});

// Exemplo de implementação básica de um provedor (mockup)
class MockProvider {
  constructor(config) {
    this.config = config;
    this.platform = 'mock';
    
    // Dados de exemplo
    this.products = [
      {
        id: 'prod_1',
        name: 'Produto de Exemplo 1',
        description: 'Descrição detalhada do produto 1',
        price: 99.90,
        stockQuantity: 100,
        categories: [{ id: 'cat_1', name: 'Categoria 1' }],
        status: 'published',
        createdAt: new Date().toISOString()
      },
      {
        id: 'prod_2',
        name: 'Produto de Exemplo 2',
        description: 'Descrição detalhada do produto 2',
        price: 149.90,
        stockQuantity: 50,
        categories: [{ id: 'cat_2', name: 'Categoria 2' }],
        status: 'published',
        createdAt: new Date().toISOString()
      }
    ];
  }

  async getProducts({ filter = {}, page = 1, perPage = 10 }) {
    // Implementação simplificada de filtragem
    let filteredProducts = [...this.products];
    
    if (filter.status) {
      filteredProducts = filteredProducts.filter(p => p.status === filter.status);
    }
    
    const start = (page - 1) * perPage;
    const end = start + perPage;
    const paginatedProducts = filteredProducts.slice(start, end);
    
    return {
      items: paginatedProducts,
      total: filteredProducts.length,
      hasMore: end < filteredProducts.length
    };
  }

  async getProductById(productId) {
    return this.products.find(p => p.id === productId) || null;
  }

  async createProduct(productData) {
    const newProduct = {
      id: `prod_${this.products.length + 1}`,
      ...productData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.products.push(newProduct);
    return newProduct;
  }

  async updateProduct(productId, updates) {
    const index = this.products.findIndex(p => p.id === productId);
    if (index === -1) {
      throw new Error(`Produto não encontrado: ${productId}`);
    }
    
    const updatedProduct = {
      ...this.products[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    this.products[index] = updatedProduct;
    return updatedProduct;
  }

  async deleteProduct(productId) {
    const initialLength = this.products.length;
    this.products = this.products.filter(p => p.id !== productId);
    return this.products.length !== initialLength;
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
    console.log('\n--- Listando produtos ---');
    const listResult = await server.callMethod('products.list', {
      siteId: 'site123',
      page: 1,
      perPage: 10
    });
    console.log(JSON.stringify(listResult, null, 2));

    console.log('\n--- Criando novo produto ---');
    const createResult = await server.callMethod('products.create', {
      siteId: 'site123',
      productData: {
        name: 'Produto de Teste',
        description: 'Produto criado para teste',
        price: 79.90,
        stockQuantity: 25,
        status: 'draft'
      }
    });
    console.log(JSON.stringify(createResult, null, 2));

    console.log('\n--- Obtendo produto criado ---');
    const getResult = await server.callMethod('products.get', {
      siteId: 'site123',
      productId: createResult.data.id
    });
    console.log(JSON.stringify(getResult, null, 2));

    console.log('\n--- Atualizando produto ---');
    const updateResult = await server.callMethod('products.update', {
      siteId: 'site123',
      productId: createResult.data.id,
      updates: {
        price: 69.90,
        status: 'published'
      }
    });
    console.log(JSON.stringify(updateResult, null, 2));

    console.log('\n--- Removendo produto ---');
    const deleteResult = await server.callMethod('products.delete', {
      siteId: 'site123',
      productId: createResult.data.id
    });
    console.log(JSON.stringify(deleteResult, null, 2));

  } catch (error) {
    console.error('Erro ao executar exemplos:', error);
  } finally {
    console.log('\nExemplos concluídos');
    server.stop();
  }
}

// Executar exemplos após 1 segundo para garantir que o servidor está pronto
setTimeout(runExamples, 1000);