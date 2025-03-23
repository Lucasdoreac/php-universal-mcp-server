/**
 * ThemeManager - Serviço para gerenciar temas e personalizações
 * 
 * Este serviço é responsável por gerenciar a criação, aplicação, personalização
 * e versionamento de temas para sites e lojas de e-commerce.
 */

const fs = require('fs').promises;
const path = require('path');
const Theme = require('../models/Theme');

class ThemeManager {
  /**
   * Cria uma nova instância do gerenciador de temas
   * 
   * @param {Object} options Opções de configuração
   * @param {String} options.themesDir Diretório base de temas
   * @param {Object} options.cache Sistema de cache (opcional)
   * @param {Object} options.templateRenderer Renderizador de templates
   */
  constructor(options = {}) {
    this.options = Object.assign({
      themesDir: path.resolve(__dirname, '../themes'),
      cache: null,
      templateRenderer: null
    }, options);

    this.themes = {}; // Armazenamento em memória de temas
    this.themeHistory = {}; // Histórico de versões de temas
  }

  /**
   * Obtém um tema pelo ID
   * 
   * @param {String} themeId ID do tema
   * @returns {Promise<Theme>} Tema
   */
  async getTheme(themeId) {
    // Verificar cache em memória
    if (this.themes[themeId]) {
      return this.themes[themeId];
    }
    
    // Verificar cache externo
    const cacheKey = `theme:${themeId}`;
    if (this.options.cache) {
      const cachedTheme = await this.options.cache.get(cacheKey);
      if (cachedTheme) {
        const theme = new Theme(cachedTheme);
        this.themes[themeId] = theme;
        return theme;
      }
    }
    
    // Carregar do sistema de arquivos
    try {
      const themePath = path.join(this.options.themesDir, `${themeId}.json`);
      const themeData = await fs.readFile(themePath, 'utf-8');
      const themeJson = JSON.parse(themeData);
      
      const theme = new Theme(themeJson);
      
      // Armazenar em cache
      this.themes[themeId] = theme;
      if (this.options.cache) {
        await this.options.cache.set(cacheKey, theme.toJSON(), 3600); // Cache por 1 hora
      }
      
      return theme;
    } catch (error) {
      throw new Error(`Falha ao carregar tema ${themeId}: ${error.message}`);
    }
  }

  /**
   * Salva um tema
   * 
   * @param {Theme} theme Tema a ser salvo
   * @returns {Promise<Theme>} Tema salvo
   */
  async saveTheme(theme) {
    if (!(theme instanceof Theme)) {
      throw new Error('Objeto inválido: deve ser uma instância de Theme');
    }
    
    const themeId = theme.id;
    
    // Adicionar ao histórico de versões
    if (!this.themeHistory[themeId]) {
      this.themeHistory[themeId] = [];
    }
    
    // Adicionar timestamp para versionamento
    const versionedTheme = theme.customize({
      metadata: {
        ...theme.metadata,
        updatedAt: new Date().toISOString(),
        version: (this.themeHistory[themeId].length + 1).toString()
      }
    });
    
    // Adicionar versão ao histórico
    this.themeHistory[themeId].push(versionedTheme.toJSON());
    if (this.themeHistory[themeId].length > 10) {
      // Manter apenas as 10 versões mais recentes
      this.themeHistory[themeId].shift();
    }
    
    // Salvar no sistema de arquivos
    try {
      const themePath = path.join(this.options.themesDir, `${themeId}.json`);
      const themeDir = path.dirname(themePath);
      
      // Garantir que o diretório existe
      try {
        await fs.mkdir(themeDir, { recursive: true });
      } catch (err) {
        // Ignorar erro se o diretório já existir
      }
      
      // Salvar o arquivo
      await fs.writeFile(themePath, JSON.stringify(versionedTheme.toJSON(), null, 2));
      
      // Atualizar cache
      this.themes[themeId] = versionedTheme;
      if (this.options.cache) {
        const cacheKey = `theme:${themeId}`;
        await this.options.cache.set(cacheKey, versionedTheme.toJSON(), 3600);
      }
      
      return versionedTheme;
    } catch (error) {
      throw new Error(`Falha ao salvar tema ${themeId}: ${error.message}`);
    }
  }

  /**
   * Cria um novo tema
   * 
   * @param {Object} themeData Dados do tema
   * @returns {Promise<Theme>} Tema criado
   */
  async createTheme(themeData) {
    // Gerar ID único para o tema
    const id = themeData.id || `theme_${Date.now()}`;
    
    // Definir dados padrão
    const defaultData = {
      id,
      name: themeData.name || 'Novo Tema',
      description: themeData.description || 'Tema personalizado',
      colors: themeData.colors || {
        primary: '#3498db',
        secondary: '#2ecc71',
        accent: '#e74c3c',
        background: '#ffffff',
        text: '#333333'
      },
      typography: themeData.typography || {
        headingFont: 'Montserrat, sans-serif',
        bodyFont: 'Open Sans, sans-serif',
        baseFontSize: '16px'
      },
      metadata: {
        ...themeData.metadata || {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: '1.0.0'
      }
    };
    
    // Criar o tema
    const theme = new Theme(defaultData);
    
    // Salvar o tema
    return this.saveTheme(theme);
  }

  /**
   * Obtém o tema atual para um site
   * 
   * @param {String} siteId ID do site
   * @returns {Promise<Theme>} Tema atual do site
   */
  async getSiteTheme(siteId) {
    try {
      return await this.getTheme(`site_${siteId}`);
    } catch (error) {
      // Se não encontrar, criar um tema padrão
      return this.createTheme({
        id: `site_${siteId}`,
        name: 'Tema Padrão',
        description: `Tema padrão para o site ${siteId}`,
        metadata: { siteId }
      });
    }
  }

  /**
   * Personaliza o tema de um site
   * 
   * @param {String} siteId ID do site
   * @param {Object} customizations Personalizações a serem aplicadas
   * @returns {Promise<Theme>} Tema personalizado
   */
  async customizeSiteTheme(siteId, customizations) {
    // Obter o tema atual
    const currentTheme = await this.getSiteTheme(siteId);
    
    // Aplicar personalizações
    const customizedTheme = currentTheme.customize(customizations);
    
    // Salvar o tema personalizado
    return this.saveTheme(customizedTheme);
  }

  /**
   * Aplica um tema de template a um site
   * 
   * @param {String} siteId ID do site
   * @param {Object} templateTheme Tema do template
   * @param {String} templateId ID do template aplicado
   * @returns {Promise<Theme>} Tema aplicado
   */
  async applyTemplateTheme(siteId, templateTheme, templateId) {
    // Criar um novo tema baseado no template
    const newTheme = new Theme({
      id: `site_${siteId}`,
      name: templateTheme.name || 'Tema de Template',
      description: `Tema baseado no template ${templateId}`,
      colors: templateTheme.colors || {},
      typography: templateTheme.typography || {},
      spacing: templateTheme.spacing || {},
      borders: templateTheme.borders || {},
      shadows: templateTheme.shadows || {},
      layout: templateTheme.layout || {},
      components: templateTheme.components || {},
      metadata: {
        siteId,
        templateId,
        appliedAt: new Date().toISOString(),
      }
    });
    
    // Salvar o novo tema
    return this.saveTheme(newTheme);
  }

  /**
   * Obtém o histórico de versões de um tema
   * 
   * @param {String} themeId ID do tema
   * @returns {Promise<Array>} Histórico de versões
   */
  async getThemeHistory(themeId) {
    // Verificar se o tema existe
    await this.getTheme(themeId);
    
    // Retornar o histórico em ordem cronológica inversa
    return (this.themeHistory[themeId] || []).slice().reverse();
  }

  /**
   * Reverte um tema para uma versão anterior
   * 
   * @param {String} themeId ID do tema
   * @param {String} version Versão para a qual reverter
   * @returns {Promise<Theme>} Tema revertido
   */
  async revertThemeToVersion(themeId, version) {
    // Verificar se o tema existe
    await this.getTheme(themeId);
    
    // Encontrar a versão especificada
    const themeHistory = this.themeHistory[themeId] || [];
    const versionToRevert = themeHistory.find(t => 
      t.metadata && t.metadata.version === version
    );
    
    if (!versionToRevert) {
      throw new Error(`Versão ${version} não encontrada para o tema ${themeId}`);
    }
    
    // Criar um novo tema baseado na versão antiga
    const revertedTheme = new Theme({
      ...versionToRevert,
      metadata: {
        ...versionToRevert.metadata,
        revertedFrom: version,
        revertedAt: new Date().toISOString(),
      }
    });
    
    // Salvar o tema revertido
    return this.saveTheme(revertedTheme);
  }

  /**
   * Gera um preview de alterações de tema
   * 
   * @param {String} siteId ID do site
   * @param {Object} changes Alterações a serem pré-visualizadas
   * @returns {Promise<Object>} Dados do preview
   */
  async generateThemePreview(siteId, changes) {
    // Obter o tema atual
    const currentTheme = await this.getSiteTheme(siteId);
    
    // Aplicar alterações temporárias sem salvar
    const previewTheme = currentTheme.customize(changes);
    
    // Gerar CSS a partir do tema, se o templateRenderer estiver disponível
    let cssVariables = '';
    if (this.options.templateRenderer) {
      cssVariables = this.options.templateRenderer.generateThemeCSS(previewTheme.toJSON());
    }
    
    // Gerar ID único para o preview
    const previewId = `preview_${siteId}_${Date.now()}`;
    
    // Salvar temporariamente no cache
    if (this.options.cache) {
      const cacheKey = `preview:${previewId}`;
      await this.options.cache.set(cacheKey, {
        theme: previewTheme.toJSON(),
        cssVariables,
        siteId,
        createdAt: new Date().toISOString()
      }, 1800); // Cache por 30 minutos
    }
    
    return {
      previewId,
      theme: previewTheme.toJSON(),
      cssVariables,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutos
    };
  }

  /**
   * Obtém um preview de tema pelo ID
   * 
   * @param {String} previewId ID do preview
   * @returns {Promise<Object>} Dados do preview
   */
  async getThemePreview(previewId) {
    if (!this.options.cache) {
      throw new Error('Cache não disponível para previews');
    }
    
    const cacheKey = `preview:${previewId}`;
    const previewData = await this.options.cache.get(cacheKey);
    
    if (!previewData) {
      throw new Error(`Preview não encontrado ou expirado: ${previewId}`);
    }
    
    return previewData;
  }
}

module.exports = ThemeManager;