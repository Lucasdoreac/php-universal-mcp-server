/**
 * PreviewService - Serviço para gerenciar previews de design
 * 
 * Este serviço permite a geração, armazenamento e acesso a previews de alterações
 * de design antes de serem publicadas em produção.
 */

const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

class PreviewService {
  /**
   * Cria uma nova instância do serviço de preview
   * 
   * @param {Object} options Opções de configuração
   * @param {Object} options.templateRenderer Renderizador de templates
   * @param {Object} options.themeManager Gerenciador de temas
   * @param {Object} options.cache Sistema de cache (opcional)
   * @param {String} options.previewDir Diretório para armazenar previews
   */
  constructor(options = {}) {
    this.options = Object.assign({
      templateRenderer: null,
      themeManager: null,
      cache: null,
      previewDir: path.resolve(__dirname, '../previews')
    }, options);

    this.previews = {}; // Armazenamento em memória de previews ativos
    
    // Garantir que o diretório de previews exista
    this._ensurePreviewDir();
  }

  /**
   * Garante que o diretório de previews exista
   * @private
   */
  async _ensurePreviewDir() {
    try {
      await fs.mkdir(this.options.previewDir, { recursive: true });
    } catch (error) {
      // Ignorar erro se o diretório já existir
    }
  }

  /**
   * Gera um ID único para um preview
   * 
   * @param {String} siteId ID do site
   * @returns {String} ID único para o preview
   * @private
   */
  _generatePreviewId(siteId) {
    const timestamp = Date.now().toString(36);
    const randomBytes = crypto.randomBytes(4).toString('hex');
    return `preview_${siteId}_${timestamp}_${randomBytes}`;
  }

  /**
   * Cria um novo preview de design
   * 
   * @param {String} siteId ID do site
   * @param {Object} changes Alterações a serem pré-visualizadas
   * @param {Object} options Opções adicionais
   * @returns {Promise<Object>} Dados do preview
   */
  async createPreview(siteId, changes, options = {}) {
    if (!this.options.themeManager) {
      throw new Error('ThemeManager não disponível');
    }
    
    // Gerar ID do preview
    const previewId = this._generatePreviewId(siteId);
    
    // Definir tempo de expiração (padrão: 30 minutos)
    const expirationTime = options.expirationTime || 30 * 60 * 1000;
    const expiresAt = new Date(Date.now() + expirationTime);
    
    // Obter o tema atual e aplicar alterações
    const currentTheme = await this.options.themeManager.getSiteTheme(siteId);
    const previewTheme = currentTheme.customize(changes);
    
    // Gerar CSS se o templateRenderer estiver disponível
    let cssVariables = '';
    if (this.options.templateRenderer) {
      cssVariables = this.options.templateRenderer.generateThemeCSS(previewTheme.toJSON());
    }
    
    // Dados do preview
    const previewData = {
      id: previewId,
      siteId,
      theme: previewTheme.toJSON(),
      cssVariables,
      changes,
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
      metadata: options.metadata || {}
    };
    
    // Salvar no sistema de arquivos
    const previewPath = path.join(this.options.previewDir, `${previewId}.json`);
    await fs.writeFile(previewPath, JSON.stringify(previewData, null, 2));
    
    // Armazenar em cache para acesso rápido
    this.previews[previewId] = previewData;
    if (this.options.cache) {
      const cacheKey = `preview:${previewId}`;
      await this.options.cache.set(cacheKey, previewData, Math.floor(expirationTime / 1000));
    }
    
    // Dados públicos do preview (sem o theme completo para economizar largura de banda)
    return {
      id: previewId,
      siteId,
      createdAt: previewData.createdAt,
      expiresAt: previewData.expiresAt,
      previewUrl: `/preview/${previewId}`
    };
  }

  /**
   * Obtém os dados de um preview
   * 
   * @param {String} previewId ID do preview
   * @returns {Promise<Object>} Dados completos do preview
   */
  async getPreview(previewId) {
    // Verificar cache em memória
    if (this.previews[previewId]) {
      // Verificar se expirou
      if (new Date(this.previews[previewId].expiresAt) < new Date()) {
        delete this.previews[previewId];
        throw new Error(`Preview expirado: ${previewId}`);
      }
      return this.previews[previewId];
    }
    
    // Verificar cache externo
    if (this.options.cache) {
      const cacheKey = `preview:${previewId}`;
      const cachedPreview = await this.options.cache.get(cacheKey);
      if (cachedPreview) {
        // Verificar se expirou
        if (new Date(cachedPreview.expiresAt) < new Date()) {
          await this.options.cache.del(cacheKey);
          throw new Error(`Preview expirado: ${previewId}`);
        }
        this.previews[previewId] = cachedPreview;
        return cachedPreview;
      }
    }
    
    // Carregar do sistema de arquivos
    try {
      const previewPath = path.join(this.options.previewDir, `${previewId}.json`);
      const previewData = JSON.parse(await fs.readFile(previewPath, 'utf-8'));
      
      // Verificar se expirou
      if (new Date(previewData.expiresAt) < new Date()) {
        // Remover arquivo de preview expirado
        try {
          await fs.unlink(previewPath);
        } catch (error) {
          // Ignorar erro se o arquivo não existir
        }
        throw new Error(`Preview expirado: ${previewId}`);
      }
      
      // Armazenar em cache
      this.previews[previewId] = previewData;
      if (this.options.cache) {
        const cacheKey = `preview:${previewId}`;
        const ttl = Math.max(0, Math.floor((new Date(previewData.expiresAt) - new Date()) / 1000));
        await this.options.cache.set(cacheKey, previewData, ttl);
      }
      
      return previewData;
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error(`Preview não encontrado: ${previewId}`);
      }
      throw error;
    }
  }

  /**
   * Renderiza um preview para visualização
   * 
   * @param {String} previewId ID do preview
   * @param {Object} mockData Dados mock para renderização (opcional)
   * @returns {Promise<String>} HTML renderizado
   */
  async renderPreview(previewId, mockData = {}) {
    if (!this.options.templateRenderer) {
      throw new Error('TemplateRenderer não disponível');
    }
    
    // Obter dados do preview
    const previewData = await this.getPreview(previewId);
    const { siteId, theme } = previewData;
    
    // Combinar com dados mock padrão se não fornecidos
    const renderData = {
      site: mockData.site || {
        name: `Site ${siteId}`,
        logo: '/assets/images/logo.png',
        description: 'Descrição do site',
        social: {
          facebook: 'example',
          instagram: 'example',
          twitter: 'example'
        },
        address: 'Rua Exemplo, 123 - São Paulo, SP',
        phone: '(11) 1234-5678',
        email: 'contato@example.com'
      },
      theme,
      isPreview: true,
      previewId,
      previewExpiresAt: previewData.expiresAt,
      ...mockData
    };
    
    // Encontrar o template associado ou usar o padrão
    let templateId = 'modern-shop';
    let templateCategory = 'ecommerce';
    
    if (theme.metadata && theme.metadata.templateId) {
      templateId = theme.metadata.templateId;
    }
    
    // Renderizar o template com os dados
    try {
      const html = await this.options.templateRenderer.renderTemplate(templateId, renderData, {
        category: templateCategory,
        components: [
          'header/modern-header',
          'product/product-card'
        ]
      });
      
      // Injetar CSS inline para facilitar a visualização
      return html.replace('</head>', `<style>${previewData.cssVariables}</style></head>`);
    } catch (error) {
      throw new Error(`Erro ao renderizar preview: ${error.message}`);
    }
  }

  /**
   * Aplica um preview como o tema atual do site
   * 
   * @param {String} previewId ID do preview
   * @returns {Promise<Object>} Resultado da aplicação
   */
  async applyPreview(previewId) {
    if (!this.options.themeManager) {
      throw new Error('ThemeManager não disponível');
    }
    
    // Obter dados do preview
    const previewData = await this.getPreview(previewId);
    const { siteId, theme } = previewData;
    
    // Aplicar o tema ao site
    const appliedTheme = await this.options.themeManager.customizeSiteTheme(siteId, theme);
    
    // Remover o preview após aplicado
    await this.deletePreview(previewId);
    
    return {
      success: true,
      theme: appliedTheme.toJSON(),
      appliedAt: new Date().toISOString(),
      previewId
    };
  }

  /**
   * Remove um preview
   * 
   * @param {String} previewId ID do preview
   * @returns {Promise<Boolean>} Resultado da operação
   */
  async deletePreview(previewId) {
    // Remover do cache em memória
    delete this.previews[previewId];
    
    // Remover do cache externo
    if (this.options.cache) {
      const cacheKey = `preview:${previewId}`;
      await this.options.cache.del(cacheKey);
    }
    
    // Remover do sistema de arquivos
    try {
      const previewPath = path.join(this.options.previewDir, `${previewId}.json`);
      await fs.unlink(previewPath);
      return true;
    } catch (error) {
      if (error.code === 'ENOENT') {
        // Já foi removido ou nunca existiu
        return true;
      }
      throw error;
    }
  }

  /**
   * Lista previews ativos para um site
   * 
   * @param {String} siteId ID do site
   * @returns {Promise<Array>} Lista de previews ativos
   */
  async listPreviews(siteId) {
    try {
      // Ler o diretório de previews
      const files = await fs.readdir(this.options.previewDir);
      
      // Filtrar os arquivos de preview
      const previewFiles = files.filter(file => 
        file.startsWith(`preview_${siteId}_`) && file.endsWith('.json')
      );
      
      // Carregar dados de cada preview
      const previews = [];
      
      for (const file of previewFiles) {
        try {
          const previewPath = path.join(this.options.previewDir, file);
          const previewData = JSON.parse(await fs.readFile(previewPath, 'utf-8'));
          
          // Verificar se expirou
          if (new Date(previewData.expiresAt) < new Date()) {
            // Remover preview expirado
            try {
              await fs.unlink(previewPath);
            } catch (error) {
              // Ignorar erro
            }
            continue;
          }
          
          // Adicionar preview à lista
          previews.push({
            id: previewData.id,
            siteId: previewData.siteId,
            createdAt: previewData.createdAt,
            expiresAt: previewData.expiresAt,
            previewUrl: `/preview/${previewData.id}`,
            metadata: previewData.metadata || {}
          });
        } catch (error) {
          // Ignorar erro e continuar com o próximo arquivo
          console.warn(`Erro ao carregar preview ${file}: ${error.message}`);
        }
      }
      
      return previews;
    } catch (error) {
      throw new Error(`Erro ao listar previews: ${error.message}`);
    }
  }

  /**
   * Limpa previews expirados
   * 
   * @returns {Promise<Number>} Número de previews removidos
   */
  async cleanupExpiredPreviews() {
    try {
      // Ler o diretório de previews
      const files = await fs.readdir(this.options.previewDir);
      
      // Filtrar os arquivos de preview
      const previewFiles = files.filter(file => file.endsWith('.json'));
      
      let removedCount = 0;
      
      for (const file of previewFiles) {
        try {
          const previewPath = path.join(this.options.previewDir, file);
          const previewData = JSON.parse(await fs.readFile(previewPath, 'utf-8'));
          
          // Verificar se expirou
          if (new Date(previewData.expiresAt) < new Date()) {
            // Remover do cache em memória
            delete this.previews[previewData.id];
            
            // Remover do cache externo
            if (this.options.cache) {
              const cacheKey = `preview:${previewData.id}`;
              await this.options.cache.del(cacheKey);
            }
            
            // Remover arquivo
            await fs.unlink(previewPath);
            removedCount++;
          }
        } catch (error) {
          // Ignorar erro e continuar com o próximo arquivo
          console.warn(`Erro ao processar preview ${file}: ${error.message}`);
        }
      }
      
      return removedCount;
    } catch (error) {
      throw new Error(`Erro ao limpar previews expirados: ${error.message}`);
    }
  }
}

module.exports = PreviewService;