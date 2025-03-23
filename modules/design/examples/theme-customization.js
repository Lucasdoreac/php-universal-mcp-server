/**
 * Exemplo de uso do Site Design System para personalização de temas
 */

const { DesignSystem } = require('../index');
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
    this.siteData = {
      themes: {},
      templates: {}
    };
  }

  // Métodos básicos para design e temas
  async getTheme(siteId) {
    return this.siteData.themes[siteId] || null;
  }

  async updateTheme(siteId, themeData) {
    this.siteData.themes[siteId] = themeData;
    return themeData;
  }

  async applyTemplate(siteId, templateData) {
    this.siteData.templates[siteId] = templateData;
    return {
      success: true,
      siteId,
      templateId: templateData.id,
      appliedAt: new Date().toISOString()
    };
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

// Inicializar o Design System
const designSystem = new DesignSystem({
  providerManager
});

// Registrar métodos no servidor MCP
designSystem.registerApiMethods(server);

// Iniciar o servidor
server.start();

console.log('Servidor MCP iniciado na porta', server.port);
console.log('DesignSystem configurado com sucesso');

// Exemplo de uso (simulado)
async function runExamples() {
  try {
    console.log('\n--- Listando templates disponíveis ---');
    const listResult = await server.callMethod('design.getTemplates', {
      category: 'ecommerce'
    });
    console.log(JSON.stringify(listResult, null, 2));

    console.log('\n--- Obtendo detalhes de um template ---');
    const templateResult = await server.callMethod('design.getTemplate', {
      templateId: 'modern-shop'
    });
    console.log('Template encontrado:', templateResult.data.name);
    console.log('Categoria:', templateResult.data.category);
    console.log('Componentes:', templateResult.data.components);

    console.log('\n--- Aplicando template a um site ---');
    const applyResult = await server.callMethod('design.applyTemplate', {
      siteId: 'site123',
      templateId: 'modern-shop'
    });
    console.log(JSON.stringify(applyResult, null, 2));

    console.log('\n--- Personalizando tema do site ---');
    const customizeResult = await server.callMethod('design.customize', {
      siteId: 'site123',
      customizations: {
        colors: {
          primary: '#ff5722',
          secondary: '#9c27b0'
        },
        typography: {
          fontFamily: {
            base: 'Roboto, sans-serif'
          }
        }
      }
    });
    console.log('Tema personalizado com sucesso');
    console.log('Cores atualizadas:', customizeResult.data.theme.colors);
    
    console.log('\n--- Gerando preview ---');
    const previewResult = await server.callMethod('design.preview', {
      siteId: 'site123',
      changes: {
        colors: {
          accent: '#4caf50'
        }
      }
    });
    console.log('URL de preview:', previewResult.data.previewUrl);
    console.log('Expira em:', previewResult.data.expiresAt);

    console.log('\n--- Publicando alterações ---');
    const publishResult = await server.callMethod('design.publish', {
      siteId: 'site123'
    });
    console.log('Publicado com sucesso:', publishResult.data.published);
    console.log('URL do site:', publishResult.data.siteUrl);

  } catch (error) {
    console.error('Erro ao executar exemplos:', error);
  } finally {
    console.log('\nExemplos concluídos');
    server.stop();
  }
}

// Executar exemplos após 1 segundo para garantir que o servidor está pronto
setTimeout(runExamples, 1000);