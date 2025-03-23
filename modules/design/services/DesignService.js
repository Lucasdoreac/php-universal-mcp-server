/**
 * Serviço de Design para o Site Design System
 * 
 * Responsável por interagir com os diferentes provedores para gerenciar temas e templates
 */

const Theme = require('../models/Theme');
const TemplateManager = require('./TemplateManager');
const TemplateRenderer = require('./TemplateRenderer');
const BootstrapTemplateRenderer = require('./BootstrapTemplateRenderer');
const ComponentManager = require('./ComponentManager');
const ThemeManager = require('./ThemeManager');
const path = require('path');

class DesignService {
  /**
   * Cria uma instância do serviço de design
   * @param {Object} options Opções de configuração
   * @param {Object} options.providerManager Gerenciador de provedores
   * @param {Object} options.cache Sistema de cache (opcional)
   * @param {Object} options.bootstrapAdapter Adaptador Bootstrap (opcional)
   */
  constructor(options = {}) {
    this.providerManager = options.providerManager;
    this.cache = options.cache || null;
    this.bootstrapAdapter = options.bootstrapAdapter || null;
    
    // Diretórios base
    const baseDir = path.resolve(__dirname, '..');
    const templatesDir = path.join(baseDir, 'templates');
    const componentsDir = path.join(baseDir, 'components');
    const themesDir = path.join(baseDir, 'themes');
    
    // Inicializar serviços
    // Escolher o renderizador apropriado com base na disponibilidade do Bootstrap
    if (this.bootstrapAdapter) {
      this.templateRenderer = new BootstrapTemplateRenderer({
        templatesDir,
        componentsDir,
        cache: this.cache,
        bootstrapAdapter: this.bootstrapAdapter
      });
    } else {
      this.templateRenderer = new TemplateRenderer({
        templatesDir,
        componentsDir,
        cache: this.cache
      });
    }
    
    this.componentManager = new ComponentManager({
      componentsDir,
      templateRenderer: this.templateRenderer,
      cache: this.cache
    });
    
    this.themeManager = new ThemeManager({
      themesDir,
      templateRenderer: this.templateRenderer,
      cache: this.cache
    });
    
    this.templateManager = new TemplateManager({
      templatesDir,
      cache: this.cache
    });
  }

  /**
   * Define o adaptador Bootstrap
   * 
   * @param {Object} bootstrapAdapter Adaptador Bootstrap
   */
  setBootstrapAdapter(bootstrapAdapter) {
    this.bootstrapAdapter = bootstrapAdapter;
    
    // Atualizar ou trocar o renderizador
    const templatesDir = this.templateRenderer.options.templatesDir;
    const componentsDir = this.templateRenderer.options.componentsDir;
    
    // Se não for um BootstrapTemplateRenderer, cria um novo
    if (!(this.templateRenderer instanceof BootstrapTemplateRenderer)) {
      this.templateRenderer = new BootstrapTemplateRenderer({
        templatesDir,
        componentsDir,
        cache: this.cache,
        bootstrapAdapter: this.bootstrapAdapter
      });
      
      // Atualiza o ComponentManager com o novo renderizador
      this.componentManager.options.templateRenderer = this.templateRenderer;
      this.themeManager.options.templateRenderer = this.templateRenderer;
    } else {
      // Já é um BootstrapTemplateRenderer, apenas atualiza o adaptador
      this.templateRenderer.bootstrapAdapter = bootstrapAdapter;
    }
  }

  /**
   * Obtém o provedor apropriado para um site
   * @param {string} siteId ID do site
   * @returns {Object} Instância do provedor
   * @private
   */
  async _getProviderForSite(siteId) {
    if (!this.providerManager) {
      throw new Error('Gerenciador de provedores não configurado');
    }
    
    return this.providerManager.getProviderForSite(siteId);
  }

  /**
   * Lista templates disponíveis
   * 
   * @param {Object} options Opções de busca
   * @param {string} options.category Categoria de templates
   * @returns {Promise<Array>} Lista de templates
   */
  async getTemplates(options = {}) {
    return this.templateManager.listTemplates(options);
  }

  /**
   * Obtém detalhes de um template específico
   * 
   * @param {string} templateId ID do template
   * @returns {Promise<Object>} Detalhes do template
   */
  async getTemplateById(templateId) {
    return this.templateManager.getTemplateById(templateId);
  }

  /**
   * Lista componentes disponíveis
   * 
   * @param {Object} options Opções de busca
   * @param {string} options.category Categoria de componentes
   * @returns {Promise<Array>} Lista de componentes
   */
  async getComponents(options = {}) {
    if (options.category) {
      return this.componentManager.getComponentsByCategory(options.category);
    }
    
    return this.componentManager.getAllComponents();
  }

  /**
   * Obtém detalhes de um componente específico
   * 
   * @param {string} componentId ID do componente
   * @param {string} category Categoria do componente
   * @returns {Promise<Object>} Detalhes do componente
   */
  async getComponent(componentId, category) {
    const config = await this.componentManager.loadComponentConfig(componentId, category);
    return {
      id: componentId,
      category,
      ...config
    };
  }

  /**
   * Obtém o tema atual de um site
   * 
   * @param {string} siteId ID do site
   * @returns {Promise<Theme>} Tema do site
   */
  async getCurrentTheme(siteId) {
    return this.themeManager.getSiteTheme(siteId);
  }

  /**
   * Aplica um template a um site
   * 
   * @param {string} siteId ID do site
   * @param {string} templateId ID do template
   * @returns {Promise<Object>} Resultado da operação
   */
  async applyTemplate(siteId, templateId) {
    // Obtém o template
    const template = await this.templateManager.getTemplateById(templateId);
    if (!template) {
      throw new Error(`Template não encontrado: ${templateId}`);
    }
    
    const provider = await this._getProviderForSite(siteId);
    
    // Aplicar o tema do template ao site
    const theme = await this.themeManager.applyTemplateTheme(siteId, template.theme, templateId);
    
    // Verificar se o template é do tipo Bootstrap
    const isBootstrapTemplate = templateId.startsWith('bs-') || template.category === 'bootstrap';
    
    // Se for Bootstrap e o adaptador não estiver disponível, emitir um aviso
    if (isBootstrapTemplate && !this.bootstrapAdapter) {
      console.warn(`Template Bootstrap ${templateId} aplicado, mas o adaptador Bootstrap não está disponível. Algumas funcionalidades podem estar limitadas.`);
    }
    
    // Gerar CSS do Bootstrap se disponível e for um template Bootstrap
    let bootstrapCss = null;
    if (isBootstrapTemplate && this.bootstrapAdapter) {
      bootstrapCss = this.bootstrapAdapter.generateCssVariables(theme.toJSON());
    }
    
    // Sincronizar com o provedor (quando implementado)
    // Se o provedor tiver API para isso
    if (provider && typeof provider.updateSiteTheme === 'function') {
      await provider.updateSiteTheme(siteId, theme.toJSON());
    }
    
    return {
      theme: theme.toJSON(),
      template: template,
      bootstrapCss,
      appliedAt: new Date().toISOString()
    };
  }

  /**
   * Personaliza o tema de um site
   * 
   * @param {string} siteId ID do site
   * @param {Object} customizations Personalizações a serem aplicadas
   * @returns {Promise<Object>} Tema personalizado
   */
  async customizeTheme(siteId, customizations) {
    // Aplicar personalizações ao tema
    const customizedTheme = await this.themeManager.customizeSiteTheme(siteId, customizations);
    
    const provider = await this._getProviderForSite(siteId);
    
    // Determinar se o tema é Bootstrap (verificando metadata)
    const themeData = customizedTheme.toJSON();
    const isBootstrapTheme = themeData.metadata && 
                          (themeData.metadata.templateId && themeData.metadata.templateId.startsWith('bs-') || 
                           themeData.metadata.bootstrap);
    
    // Gerar CSS para o Bootstrap, se aplicável
    let bootstrapCss = null;
    if (isBootstrapTheme && this.bootstrapAdapter) {
      bootstrapCss = this.bootstrapAdapter.generateCssVariables(themeData);
    }
    
    // Sincronizar com o provedor (quando implementado)
    // Se o provedor tiver API para isso
    if (provider && typeof provider.updateSiteTheme === 'function') {
      await provider.updateSiteTheme(siteId, customizedTheme.toJSON());
    }
    
    // Gerar CSS a partir do tema
    const cssVariables = this.templateRenderer.generateThemeCSS(customizedTheme.toJSON());
    
    return {
      theme: customizedTheme.toJSON(),
      cssVariables,
      bootstrapCss,
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Gera um preview de alterações de design
   * 
   * @param {string} siteId ID do site
   * @param {Object} changes Alterações a serem pré-visualizadas
   * @returns {Promise<Object>} Dados do preview
   */
  async generatePreview(siteId, changes) {
    // Gerar preview usando o ThemeManager
    const previewData = await this.themeManager.generateThemePreview(siteId, changes);
    
    // Determinar se o tema é Bootstrap (verificando metadata)
    const isBootstrapTheme = previewData.theme.metadata && 
                          (previewData.theme.metadata.templateId && previewData.theme.metadata.templateId.startsWith('bs-') || 
                           previewData.theme.metadata.bootstrap);
    
    // Gerar CSS para o Bootstrap, se aplicável
    let bootstrapCss = null;
    if (isBootstrapTheme && this.bootstrapAdapter) {
      bootstrapCss = this.bootstrapAdapter.generateCssVariables(previewData.theme);
    }
    
    // Em uma implementação real, geraria uma URL de preview
    const previewUrl = `https://preview.example.com/${siteId}?preview=${previewData.previewId}`;
    
    return {
      ...previewData,
      bootstrapCss,
      previewUrl
    };
  }

  /**
   * Renderiza um preview para visualização
   * 
   * @param {string} previewId ID do preview
   * @returns {Promise<String>} HTML renderizado
   */
  async renderPreview(previewId) {
    // Obter dados do preview
    const previewData = await this.themeManager.getThemePreview(previewId);
    
    // Extrair o siteId e obter o template atual do site
    const { siteId, theme } = previewData;
    
    // Obter informações do site (em uma implementação real, viria do provedor)
    const siteInfo = {
      name: `Site ${siteId}`,
      logo: 'https://example.com/logo.png',
      description: 'Descrição do site',
      social: {
        facebook: 'example',
        instagram: 'example',
        twitter: 'example'
      },
      contact: {
        email: 'contato@example.com',
        phone: '(11) 1234-5678'
      }
    };
    
    // Obter dados de produtos mock para o preview
    const mockProducts = Array.from({ length: 8 }, (_, i) => ({
      id: `product-${i + 1}`,
      name: `Produto ${i + 1}`,
      price: 99.99 + (i * 10),
      compare_at_price: i % 3 === 0 ? 129.99 + (i * 10) : null,
      discount: i % 3 === 0 ? 20 : null,
      is_new: i % 4 === 0,
      rating: 3 + (i % 3),
      reviews_count: 5 + (i * 2),
      images: ['https://via.placeholder.com/600x600'],
      url: `/products/product-${i + 1}`,
      short_description: 'Descrição curta do produto.'
    }));
    
    // Preparar dados para renderização (mock data)
    const renderData = {
      site: siteInfo,
      theme,
      products: {
        featured: mockProducts.slice(0, 4),
        new_arrivals: mockProducts.slice(4, 8)
      },
      categories: {
        featured: [
          { name: 'Categoria 1', url: '/category-1', image: 'https://via.placeholder.com/300x200' },
          { name: 'Categoria 2', url: '/category-2', image: 'https://via.placeholder.com/300x200' },
          { name: 'Categoria 3', url: '/category-3', image: 'https://via.placeholder.com/300x200' },
          { name: 'Categoria 4', url: '/category-4', image: 'https://via.placeholder.com/300x200' }
        ]
      },
      banners: {
        main: [
          {
            title: 'Banner Principal',
            description: 'Descrição do banner principal',
            image: 'https://via.placeholder.com/1200x400',
            button_text: 'Ver Ofertas',
            button_url: '/offers'
          }
        ],
        promo: {
          title: 'Promoção Especial',
          description: 'Aproveite descontos exclusivos',
          image: 'https://via.placeholder.com/1200x200',
          button_text: 'Ver Promoção',
          button_url: '/promo'
        }
      },
      navigation: {
        main: [
          { title: 'Home', url: '/', isActive: true },
          { title: 'Produtos', url: '/products/', isActive: false },
          { title: 'Sobre', url: '/about/', isActive: false },
          { title: 'Contato', url: '/contact/', isActive: false }
        ]
      },
      settings: {
        showRatings: true,
        enableQuickView: true
      },
      cart: {
        count: 2
      },
      assets: {
        css: {
          main: '/assets/css/main.css'
        },
        js: {
          main: '/assets/js/main.js',
          slider: '/assets/js/slider.js'
        },
        images: {
          defaultLogo: '/assets/images/logo.png',
          payment_methods: '/assets/images/payment-methods.png'
        }
      }
    };
    
    // Verificar se é um tema Bootstrap a partir dos metadados
    const isBootstrapTheme = theme.metadata && 
                          (theme.metadata.templateId && theme.metadata.templateId.startsWith('bs-') || 
                           theme.metadata.bootstrap);
    
    let templateId, templateCategory;
    
    if (isBootstrapTheme) {
      // Para temas Bootstrap, usar o template correspondente de bootstrap/
      templateId = theme.metadata.templateId || 'bs-ecommerce';
      templateCategory = 'bootstrap';
    } else {
      // Para temas padrão, usar o template associado ou um padrão
      templateId = theme.metadata.templateId || 'modern-shop';
      templateCategory = 'ecommerce';
    }
    
    // Componentes específicos com base no tipo de template
    const components = isBootstrapTheme ? 
      ['bootstrap/navbar/bs-navbar', 'bootstrap/product/bs-product-card', 'bootstrap/footer/bs-footer'] : 
      ['header/modern-header', 'product/product-card'];
    
    // Renderizar o template com os dados
    return this.templateRenderer.renderTemplate(templateId, renderData, {
      category: templateCategory,
      components
    });
  }

  /**
   * Publica alterações de design
   * 
   * @param {string} siteId ID do site
   * @returns {Promise<Object>} Resultado da publicação
   */
  async publishChanges(siteId) {
    // Obter o tema atual
    const currentTheme = await this.themeManager.getSiteTheme(siteId);
    
    const provider = await this._getProviderForSite(siteId);
    
    // Em uma implementação real, publicaria no provedor
    if (provider && typeof provider.publishSiteTheme === 'function') {
      await provider.publishSiteTheme(siteId, currentTheme.toJSON());
    }
    
    // Verificar se é um tema Bootstrap
    const themeData = currentTheme.toJSON();
    const isBootstrapTheme = themeData.metadata && 
                          (themeData.metadata.templateId && themeData.metadata.templateId.startsWith('bs-') || 
                           themeData.metadata.bootstrap);
    
    // Gerar CSS a partir do tema
    const cssVariables = this.templateRenderer.generateThemeCSS(themeData);
    
    // Gerar CSS para o Bootstrap, se aplicável
    let bootstrapCss = null;
    if (isBootstrapTheme && this.bootstrapAdapter) {
      bootstrapCss = this.bootstrapAdapter.generateCssVariables(themeData);
    }
    
    return {
      published: true,
      theme: themeData,
      cssVariables,
      bootstrapCss,
      publishedAt: new Date().toISOString(),
      siteUrl: `https://site.example.com/${siteId}`
    };
  }

  /**
   * Cria um pacote de assets (CSS/JS) para um site
   * 
   * @param {string} siteId ID do site
   * @returns {Promise<Object>} Pacote de CSS e JS
   */
  async createAssetBundle(siteId) {
    // Obter o tema atual do site
    const currentTheme = await this.themeManager.getSiteTheme(siteId);
    const themeData = currentTheme.toJSON();
    
    // Verificar se é um tema Bootstrap
    const isBootstrapTheme = themeData.metadata && 
                          (themeData.metadata.templateId && themeData.metadata.templateId.startsWith('bs-') || 
                           themeData.metadata.bootstrap);
    
    // Componentes a incluir com base no tipo de tema
    let componentsList;
    
    if (isBootstrapTheme) {
      componentsList = [
        { id: 'bootstrap/navbar/bs-navbar', options: {} },
        { id: 'bootstrap/product/bs-product-card', options: { style: 'default', showRatings: true } },
        { id: 'bootstrap/footer/bs-footer', options: {} }
      ];
    } else {
      componentsList = [
        { id: 'header/modern-header', options: {} },
        { id: 'product/product-card', options: { style: 'default', showRatings: true } },
        { id: 'footer/standard-footer', options: {} }
      ];
    }
    
    // Criar pacote de componentes
    const bundle = await this.componentManager.createComponentBundle(
      siteId,
      componentsList,
      themeData
    );
    
    // Adicionar CSS do Bootstrap ao pacote, se aplicável
    if (isBootstrapTheme && this.bootstrapAdapter) {
      const bootstrapCss = this.bootstrapAdapter.generateCssVariables(themeData);
      bundle.bootstrapCss = bootstrapCss;
    }
    
    return bundle;
  }
}

module.exports = DesignService;