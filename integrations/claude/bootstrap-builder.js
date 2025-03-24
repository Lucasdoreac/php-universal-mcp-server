/**
 * Bootstrap Website Builder - Claude MCP Integration
 * 
 * Este módulo fornece a integração entre o sistema de criação de websites
 * utilizando Bootstrap e o Claude via MCP (Model Context Protocol).
 * 
 * Permite que usuários criem websites completos através de comandos em
 * linguagem natural no Claude, com geração de visualizações e controle
 * interativo do processo de criação.
 * 
 * @author Lucas Dórea
 * @version 1.1.0
 */

const path = require('path');
const handlebars = require('handlebars');
const fs = require('fs').promises;
const { MCPResponse } = require('@modelcontextprotocol/sdk');

// Importar serviços do módulo de design
const designService = require('../../modules/design/services/design-service');
const templateService = require('../../modules/design/services/template-service');
const componentService = require('../../modules/design/services/component-service');

// Importar gerenciadores de componentes Bootstrap
const navbarManager = require('../../modules/design/components/bootstrap/navbar');
const carouselManager = require('../../modules/design/components/bootstrap/carousel');
const accordionManager = require('../../modules/design/components/bootstrap/accordion');
const modalManager = require('../../modules/design/components/bootstrap/modal');
const galleryManager = require('../../modules/design/components/bootstrap/gallery');
const formManager = require('../../modules/design/components/bootstrap/form');
const footerManager = require('../../modules/design/components/bootstrap/footer');
const productManager = require('../../modules/design/components/bootstrap/product');

// Importar visualizador de artifacts
const artifactVisualizer = require('./artifact-visualizer');

// Templates disponíveis
const TEMPLATES = {
  'landing': 'bs-landing',
  'blog': 'bs-blog',
  'portfolio': 'bs-portfolio',
  'shop': 'bs-shop'
};

/**
 * Classe principal do Bootstrap Website Builder
 */
class BootstrapBuilder {
  constructor() {
    this.activeSession = null;
    this.activeSite = null;
    this.templateCache = {};
    this.componentCache = {};
    
    // Inicializar templates
    this.initializeTemplates();
  }

  /**
   * Inicializa templates disponíveis
   */
  async initializeTemplates() {
    try {
      // Carregar templates
      for (const [key, templateId] of Object.entries(TEMPLATES)) {
        this.templateCache[key] = await templateService.getTemplate(templateId);
      }
      
      console.log('Templates Bootstrap carregados com sucesso');
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
    }
  }

  /**
   * Criar novo site a partir de um template
   * @param {string} templateType - Tipo de template (landing, blog, portfolio, shop)
   * @param {Object} options - Opções do site (título, descrição, cores, etc)
   * @returns {Object} - Objeto com dados do site criado
   */
  async createSite(templateType, options = {}) {
    try {
      // Verificar se o template existe
      if (!this.templateCache[templateType]) {
        throw new Error(`Template "${templateType}" não encontrado`);
      }
      
      // Criar site com template selecionado
      const site = await designService.createSite({
        template: this.templateCache[templateType].id,
        title: options.title || `Novo Site ${templateType}`,
        description: options.description || 'Site criado com PHP Universal MCP Server',
        options: {
          primaryColor: options.primaryColor || '#007bff',
          secondaryColor: options.secondaryColor || '#6c757d',
          fontFamily: options.fontFamily || 'Arial, sans-serif',
          ...options.extraOptions
        }
      });
      
      this.activeSite = site;
      return site;
    } catch (error) {
      console.error('Erro ao criar site:', error);
      throw error;
    }
  }

  /**
   * Adicionar componente ao site ativo
   * @param {string} componentType - Tipo de componente (navbar, carousel, etc)
   * @param {string} targetSelector - Seletor CSS onde o componente será inserido
   * @param {Object} options - Opções do componente
   * @returns {Object} - Componente criado
   */
  async addComponent(componentType, targetSelector, options = {}) {
    if (!this.activeSite) {
      throw new Error('Nenhum site ativo');
    }
    
    // Mapear tipo de componente para seu gerenciador
    const componentManagers = {
      'navbar': navbarManager,
      'carousel': carouselManager,
      'accordion': accordionManager,
      'modal': modalManager,
      'gallery': galleryManager,
      'form': formManager,
      'footer': footerManager,
      'product': productManager
    };
    
    if (!componentManagers[componentType]) {
      throw new Error(`Tipo de componente "${componentType}" não suportado`);
    }
    
    try {
      // Criar componente usando o gerenciador apropriado
      const component = await componentManagers[componentType].create(this.activeSite.id, targetSelector, options);
      
      // Adicionar atributos especiais para detecção no artifact-visualizer
      component.content = component.content.replace(/<([a-z]+[^>]*)/gi, `<$1 data-component-id="${component.id}" data-component-type="${componentType}"`);
      
      return component;
    } catch (error) {
      console.error(`Erro ao adicionar componente ${componentType}:`, error);
      throw error;
    }
  }

  /**
   * Editar componente existente
   * @param {string} componentId - ID do componente
   * @param {Object} updates - Atualizações a aplicar
   * @returns {Object} - Componente atualizado
   */
  async updateComponent(componentId, updates) {
    if (!this.activeSite) {
      throw new Error('Nenhum site ativo');
    }
    
    try {
      const component = await componentService.getComponent(this.activeSite.id, componentId);
      if (!component) {
        throw new Error(`Componente ${componentId} não encontrado`);
      }
      
      // Identificar o gerenciador apropriado para o tipo de componente
      const componentType = component.type.split('-')[0]; // Ex: 'bs-navbar' -> 'navbar'
      const manager = this.getManagerForType(componentType);
      
      if (!manager) {
        throw new Error(`Gerenciador não encontrado para componente ${componentType}`);
      }
      
      const updatedComponent = await manager.update(this.activeSite.id, componentId, updates);
      
      // Atualizar atributos especiais para detecção no artifact-visualizer
      updatedComponent.content = updatedComponent.content.replace(/<([a-z]+[^>]*)/gi, `<$1 data-component-id="${updatedComponent.id}" data-component-type="${componentType}"`);
      
      return updatedComponent;
    } catch (error) {
      console.error('Erro ao atualizar componente:', error);
      throw error;
    }
  }

  /**
   * Obter o gerenciador para um determinado tipo de componente
   * @private
   */
  getManagerForType(componentType) {
    const managers = {
      'navbar': navbarManager,
      'carousel': carouselManager,
      'accordion': accordionManager,
      'modal': modalManager,
      'gallery': galleryManager,
      'form': formManager,
      'footer': footerManager,
      'product': productManager
    };
    
    return managers[componentType];
  }

  /**
   * Gerar prévia do site
   * @returns {string} HTML do site
   */
  async generatePreview() {
    if (!this.activeSite) {
      throw new Error('Nenhum site ativo');
    }
    
    try {
      const preview = await designService.generatePreview(this.activeSite.id);
      return preview.html;
    } catch (error) {
      console.error('Erro ao gerar prévia:', error);
      throw error;
    }
  }

  /**
   * Obter lista de componentes do site ativo
   * @returns {Array} Lista de componentes
   */
  async getComponents() {
    if (!this.activeSite) {
      throw new Error('Nenhum site ativo');
    }
    
    try {
      const components = await componentService.getSiteComponents(this.activeSite.id);
      return components;
    } catch (error) {
      console.error('Erro ao obter componentes:', error);
      return [];
    }
  }

  /**
   * Publicar site
   * @param {Object} options - Opções de publicação
   * @returns {Object} - Informações da publicação
   */
  async publishSite(options = {}) {
    if (!this.activeSite) {
      throw new Error('Nenhum site ativo');
    }
    
    try {
      const result = await designService.publishSite(this.activeSite.id, options);
      return result;
    } catch (error) {
      console.error('Erro ao publicar site:', error);
      throw error;
    }
  }

  /**
   * Gerar artifact para visualização no Claude
   * @returns {Object} - Dados para o artifact
   */
  async generateArtifact() {
    try {
      // Gerar prévia do HTML
      const preview = await this.generatePreview();
      
      // Obter componentes para exibição
      const components = await this.getComponents();
      
      // Gerar visualização melhorada com o artifact-visualizer
      const html = await artifactVisualizer.generateWebsiteVisualization(
        this.activeSite,
        preview,
        components
      );
      
      return artifactVisualizer.prepareArtifact(
        html,
        this.activeSite ? this.activeSite.title : 'Preview do Site'
      );
    } catch (error) {
      console.error('Erro ao gerar artifact:', error);
      
      // Fallback para exibição simples em caso de erro
      return {
        type: 'text/html',
        title: this.activeSite ? this.activeSite.title : 'Preview do Site',
        content: `
          <html>
            <head>
              <title>Preview do Site</title>
              <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css" rel="stylesheet">
            </head>
            <body>
              <div class="container p-4">
                <div class="alert alert-warning">
                  <h4>Erro ao gerar visualização avançada</h4>
                  <p>${error.message}</p>
                </div>
                <div class="mt-4">
                  ${await this.generatePreview()}
                </div>
              </div>
            </body>
          </html>
        `
      };
    }
  }
  
  /**
   * Gerar artifact específico para visualização de um componente
   * @param {string} componentId - ID do componente
   * @returns {Object} - Dados para o artifact
   */
  async generateComponentArtifact(componentId) {
    try {
      if (!this.activeSite) {
        throw new Error('Nenhum site ativo');
      }
      
      // Obter detalhes do componente
      const component = await componentService.getComponent(this.activeSite.id, componentId);
      if (!component) {
        throw new Error(`Componente ${componentId} não encontrado`);
      }
      
      // Gerar visualização melhorada com o artifact-visualizer
      const html = await artifactVisualizer.generateComponentVisualization(component);
      
      return artifactVisualizer.prepareArtifact(
        html,
        `Componente: ${component.name || component.type}`
      );
    } catch (error) {
      console.error('Erro ao gerar artifact de componente:', error);
      throw error;
    }
  }
}

// Instância global do builder
const builder = new BootstrapBuilder();

/**
 * Processar comando do Claude
 * @param {Object} command - Comando recebido
 * @param {Object} session - Sessão MCP
 * @returns {MCPResponse} - Resposta para o Claude
 */
async function processCommand(command, session) {
  try {
    // Analisar comando em linguagem natural
    const parsedCommand = parseNaturalCommand(command.text);
    
    switch (parsedCommand.action) {
      case 'create':
        const site = await builder.createSite(
          parsedCommand.templateType, 
          parsedCommand.options
        );
        
        // Gerar artifact para visualização no Claude
        const artifact = await builder.generateArtifact();
        
        return new MCPResponse({
          message: `Site ${site.title} criado com sucesso! Você pode adicionar componentes com comandos como "adicionar menu" ou "inserir carrossel".`,
          artifacts: [artifact]
        });
        
      case 'add-component':
        const component = await builder.addComponent(
          parsedCommand.componentType,
          parsedCommand.targetSelector,
          parsedCommand.options
        );
        
        // Gerar artifact atualizado
        const updatedArtifact = await builder.generateArtifact();
        
        return new MCPResponse({
          message: `Componente ${parsedCommand.componentType} adicionado com sucesso! ID do componente: ${component.id}`,
          artifacts: [updatedArtifact]
        });
        
      case 'view-component':
        // Visualizar um componente específico
        const componentArtifact = await builder.generateComponentArtifact(parsedCommand.componentId);
        
        return new MCPResponse({
          message: `Visualizando componente ${parsedCommand.componentId}:`,
          artifacts: [componentArtifact]
        });
        
      case 'update-component':
        await builder.updateComponent(
          parsedCommand.componentId,
          parsedCommand.updates
        );
        
        // Gerar artifact atualizado
        const updatedComponentArtifact = await builder.generateArtifact();
        
        return new MCPResponse({
          message: `Componente atualizado com sucesso!`,
          artifacts: [updatedComponentArtifact]
        });
        
      case 'publish':
        const published = await builder.publishSite(parsedCommand.options);
        
        return new MCPResponse({
          message: `Site publicado com sucesso! Disponível em: ${published.url}`,
          artifacts: [await builder.generateArtifact()]
        });
        
      case 'preview':
        return new MCPResponse({
          message: `Prévia do site atualizada:`,
          artifacts: [await builder.generateArtifact()]
        });
        
      default:
        return new MCPResponse({
          message: `Comando não reconhecido. Por favor, tente novamente.`
        });
    }
  } catch (error) {
    console.error('Erro ao processar comando:', error);
    return new MCPResponse({
      message: `Erro: ${error.message}`
    });
  }
}

/**
 * Parser simplificado para comandos em linguagem natural
 * Este é um parser básico que será expandido com NLP mais robusto
 * @param {string} text - Texto do comando
 * @returns {Object} Comando estruturado
 */
function parseNaturalCommand(text) {
  // Normalizar texto
  const normalizedText = text.toLowerCase().trim();
  
  // Regras básicas de parsing
  if (normalizedText.includes('criar site') || normalizedText.includes('novo site')) {
    // Detectar tipo de template
    let templateType = 'landing';
    if (normalizedText.includes('blog')) templateType = 'blog';
    if (normalizedText.includes('portfolio')) templateType = 'portfolio';
    if (normalizedText.includes('loja') || normalizedText.includes('shop')) templateType = 'shop';
    
    // Extrair título se fornecido
    let title = null;
    const titleMatch = normalizedText.match(/(?:chamado|título|titulado|nome)[:\s]+["'](.+?)["']/i);
    if (titleMatch) title = titleMatch[1];
    
    // Extrair cor primária se fornecida
    let primaryColor = null;
    const colorMatch = normalizedText.match(/cor(?:\s+primária)?[:\s]+([#][0-9a-fA-F]{6}|[a-zA-Z]+)/i);
    if (colorMatch) primaryColor = colorMatch[1];
    
    return {
      action: 'create',
      templateType,
      options: { 
        title,
        primaryColor
      }
    };
  }
  
  if (normalizedText.includes('adicionar') || normalizedText.includes('inserir')) {
    // Detectar tipo de componente
    let componentType = null;
    if (normalizedText.includes('navbar') || normalizedText.includes('menu')) componentType = 'navbar';
    if (normalizedText.includes('carrossel') || normalizedText.includes('carousel')) componentType = 'carousel';
    if (normalizedText.includes('accordion') || normalizedText.includes('acordeão')) componentType = 'accordion';
    if (normalizedText.includes('modal') || normalizedText.includes('janela')) componentType = 'modal';
    if (normalizedText.includes('galeria') || normalizedText.includes('gallery')) componentType = 'gallery';
    if (normalizedText.includes('formulário') || normalizedText.includes('form')) componentType = 'form';
    if (normalizedText.includes('rodapé') || normalizedText.includes('footer')) componentType = 'footer';
    if (normalizedText.includes('produto') || normalizedText.includes('product')) componentType = 'product';
    
    // Extrair variante para componentes que suportam
    let variant = null;
    const variantMatch = normalizedText.match(/variante[:\s]+([a-zA-Z]+)/i);
    if (variantMatch) variant = variantMatch[1];
    
    // Extrair seletor alvo (onde inserir)
    let targetSelector = '#content';
    if (normalizedText.includes('no cabeçalho') || normalizedText.includes('no header')) {
      targetSelector = 'header';
    }
    if (normalizedText.includes('no rodapé') || normalizedText.includes('no footer')) {
      targetSelector = 'footer';
    }
    
    return {
      action: 'add-component',
      componentType: componentType || 'navbar', // Padrão para navbar se não detectado
      targetSelector,
      options: { variant }
    };
  }
  
  if (normalizedText.includes('visualizar componente') || normalizedText.includes('ver componente')) {
    // Extrair ID do componente
    const idMatch = normalizedText.match(/componente[:\s]+([a-zA-Z0-9-]+)/i);
    const componentId = idMatch ? idMatch[1] : null;
    
    if (!componentId) {
      return { action: 'preview' }; // Fallback para preview do site
    }
    
    return {
      action: 'view-component',
      componentId
    };
  }
  
  if (normalizedText.includes('atualizar componente') || normalizedText.includes('editar componente')) {
    // Extrair ID do componente
    const idMatch = normalizedText.match(/componente[:\s]+([a-zA-Z0-9-]+)/i);
    const componentId = idMatch ? idMatch[1] : null;
    
    if (!componentId) {
      return { action: 'preview' }; // Fallback para preview do site
    }
    
    // Extrair propriedades a atualizar
    // Este é um parser básico, um parser real com NLP seria mais robusto
    const updates = {};
    
    if (normalizedText.includes('cor:')) {
      const colorMatch = normalizedText.match(/cor[:\s]+([#][0-9a-fA-F]{6}|[a-zA-Z]+)/i);
      if (colorMatch) updates.color = colorMatch[1];
    }
    
    if (normalizedText.includes('texto:')) {
      const textMatch = normalizedText.match(/texto[:\s]+["'](.+?)["']/i);
      if (textMatch) updates.text = textMatch[1];
    }
    
    if (normalizedText.includes('título:')) {
      const titleMatch = normalizedText.match(/título[:\s]+["'](.+?)["']/i);
      if (titleMatch) updates.title = titleMatch[1];
    }
    
    return {
      action: 'update-component',
      componentId,
      updates
    };
  }
  
  if (normalizedText.includes('publicar') || normalizedText.includes('deploy')) {
    // Extrair domínio se fornecido
    const domainMatch = normalizedText.match(/(?:em|para|no)[:\s]+([a-zA-Z0-9][a-zA-Z0-9-]+\.[a-zA-Z]{2,})/i);
    const domain = domainMatch ? domainMatch[1] : null;
    
    return {
      action: 'publish',
      options: domain ? { domain } : {}
    };
  }
  
  if (normalizedText.includes('prévia') || normalizedText.includes('preview') || normalizedText.includes('visualizar')) {
    return {
      action: 'preview'
    };
  }
  
  // Padrão se nenhum comando for reconhecido
  return {
    action: 'preview'
  };
}

// Exportar funções para integração com MCP
module.exports = {
  processCommand,
  builder
};