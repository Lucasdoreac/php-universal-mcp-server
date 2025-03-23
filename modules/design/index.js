/**
 * Site Design System - Ponto de entrada
 * 
 * Este módulo fornece ferramentas para gerenciar a aparência visual
 * de sites e lojas de e-commerce em diferentes plataformas.
 */

const DesignController = require('./controllers/DesignController');
const Theme = require('./models/Theme');
const Template = require('./models/Template');
const BootstrapAdapter = require('./services/BootstrapAdapter');
const BootstrapTemplateRenderer = require('./services/BootstrapTemplateRenderer');

/**
 * Classe principal do Site Design System
 */
class DesignSystem {
  /**
   * Cria uma instância do Design System
   * 
   * @param {Object} options Opções de configuração
   * @param {Object} options.providerManager Gerenciador de provedores
   * @param {Object} options.cache Sistema de cache (opcional)
   * @param {Object} options.bootstrapAdapter Adaptador Bootstrap (opcional)
   * @param {Boolean} options.enableBootstrap Habilitar suporte a Bootstrap (opcional)
   * @param {String} options.bootstrapVersion Versão do Bootstrap (opcional)
   */
  constructor(options = {}) {
    this.options = options;
    
    // Configurações do Bootstrap
    this.enableBootstrap = options.enableBootstrap || false;
    
    // Criar adaptador Bootstrap se necessário
    if (this.enableBootstrap || options.bootstrapAdapter) {
      this.bootstrapAdapter = options.bootstrapAdapter || new BootstrapAdapter({
        cache: options.cache,
        bootstrapVersion: options.bootstrapVersion || '5.3.0'
      });
    }
    
    // Inicializar controller com bootstrap se habilitado
    this.designController = new DesignController({
      ...options,
      bootstrapAdapter: this.enableBootstrap ? this.bootstrapAdapter : null
    });

    // Log de inicialização
    if (this.enableBootstrap) {
      console.log(`Bootstrap support enabled (version ${options.bootstrapVersion || '5.3.0'})`);
    }
  }

  /**
   * Registra os métodos da API no servidor MCP
   * 
   * @param {Object} server Servidor MCP
   */
  registerApiMethods(server) {
    if (!server) {
      throw new Error('Servidor MCP é necessário para registrar os métodos da API');
    }

    // Registra métodos para design e templates
    server.registerMethod('design.getTemplates', this._handleApiCall.bind(this, this.designController.getTemplates.bind(this.designController)));
    server.registerMethod('design.getTemplate', this._handleApiCall.bind(this, this.designController.getTemplate.bind(this.designController)));
    server.registerMethod('design.applyTemplate', this._handleApiCall.bind(this, this.designController.applyTemplate.bind(this.designController)));
    server.registerMethod('design.customize', this._handleApiCall.bind(this, this.designController.customize.bind(this.designController)));
    server.registerMethod('design.preview', this._handleApiCall.bind(this, this.designController.preview.bind(this.designController)));
    server.registerMethod('design.publish', this._handleApiCall.bind(this, this.designController.publish.bind(this.designController)));
    
    // Métodos adicionais para componentes
    server.registerMethod('design.getComponents', this._handleApiCall.bind(this, this.designController.getComponents.bind(this.designController)));
    server.registerMethod('design.getComponent', this._handleApiCall.bind(this, this.designController.getComponent.bind(this.designController)));
    
    // Métodos específicos para Bootstrap se habilitado
    if (this.enableBootstrap) {
      // Método para obter CSS Bootstrap personalizado
      server.registerMethod('design.getBootstrapCss', this._handleApiCall.bind(this, async (params) => {
        if (!params || !params.siteId) {
          return {
            success: false,
            error: 'O ID do site é obrigatório'
          };
        }
        
        try {
          const theme = await this.designController.getCurrentTheme({ siteId: params.siteId });
          if (!theme.success) {
            return theme; // Propaga o erro
          }
          
          return {
            success: true,
            data: {
              css: this.bootstrapAdapter.generateCssVariables(theme.data.theme),
              sassVariables: this.bootstrapAdapter.generateSassVariables(theme.data.theme),
              bootstrapLinks: {
                css: this.bootstrapAdapter.getBootstrapCdnLink(),
                icons: this.bootstrapAdapter.getBootstrapCdnLink('bootstrap-icons'),
                scripts: this.bootstrapAdapter.getBootstrapScripts()
              }
            }
          };
        } catch (error) {
          return {
            success: false,
            error: `Erro ao gerar CSS Bootstrap: ${error.message}`
          };
        }
      }));
      
      // Método para verificar se um template é compatível com Bootstrap
      server.registerMethod('design.isBootstrapTemplate', this._handleApiCall.bind(this, async (params) => {
        if (!params || !params.templateId) {
          return {
            success: false,
            error: 'O ID do template é obrigatório'
          };
        }
        
        try {
          const template = await this.designController.getTemplate({ templateId: params.templateId });
          if (!template.success) {
            return template; // Propaga o erro
          }
          
          const isBootstrap = 
            template.data.templateId.startsWith('bs-') || 
            template.data.category === 'bootstrap' ||
            (template.data.metadata && template.data.metadata.bootstrap === true);
          
          return {
            success: true,
            data: {
              isBootstrap,
              templateId: template.data.templateId,
              category: template.data.category
            }
          };
        } catch (error) {
          return {
            success: false,
            error: `Erro ao verificar template Bootstrap: ${error.message}`
          };
        }
      }));
      
      // Método para listar componentes Bootstrap específicos
      server.registerMethod('design.getBootstrapComponents', this._handleApiCall.bind(this, async (params) => {
        try {
          const category = params?.category || null;
          const options = { category: category ? `bootstrap/${category}` : 'bootstrap' };
          
          const components = await this.designController.getComponents(options);
          if (!components.success) {
            return components; // Propaga o erro
          }
          
          return {
            success: true,
            data: components.data
          };
        } catch (error) {
          return {
            success: false,
            error: `Erro ao listar componentes Bootstrap: ${error.message}`
          };
        }
      }));
    }
  }

  /**
   * Manipula chamadas de API, adicionando tratamento de erros e validação
   * 
   * @param {Function} handlerFn Função de manipulação da chamada
   * @param {Object} params Parâmetros da chamada
   * @returns {Promise<Object>} Resposta da API
   * @private
   */
  async _handleApiCall(handlerFn, params) {
    try {
      // Valida parâmetros obrigatórios comuns
      if (!params) {
        return {
          success: false,
          error: 'Parâmetros são obrigatórios'
        };
      }

      // Executa o manipulador específico
      return await handlerFn(params);
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Erro desconhecido',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      };
    }
  }

  /**
   * Obtém templates disponíveis
   * 
   * @param {Object} options Opções de filtragem
   * @param {string} options.category Categoria de templates (ecommerce, blog, landing, etc)
   * @returns {Promise<Array>} Lista de templates disponíveis
   */
  async getTemplates(options = {}) {
    const response = await this.designController.getTemplates(options);
    return response.success ? response.data : [];
  }

  /**
   * Aplica um template a um site
   * 
   * @param {string} siteId ID do site
   * @param {string} templateId ID do template
   * @returns {Promise<Object>} Resultado da operação
   */
  async applyTemplate(siteId, templateId) {
    return this.designController.applyTemplate({ siteId, templateId });
  }

  /**
   * Personaliza a aparência de um site
   * 
   * @param {string} siteId ID do site
   * @param {Object} customizations Personalizações a serem aplicadas
   * @returns {Promise<Object>} Resultado da operação
   */
  async customize(siteId, customizations) {
    return this.designController.customize({ siteId, customizations });
  }

  /**
   * Gera um preview das alterações
   * 
   * @param {string} siteId ID do site
   * @param {Object} changes Alterações a serem visualizadas
   * @returns {Promise<Object>} Dados do preview
   */
  async preview(siteId, changes) {
    return this.designController.preview({ siteId, changes });
  }

  /**
   * Publica alterações de design
   * 
   * @param {string} siteId ID do site
   * @returns {Promise<Object>} Resultado da operação
   */
  async publish(siteId) {
    return this.designController.publish({ siteId });
  }

  /**
   * Retorna os modelos de dados disponíveis
   * @returns {Object} Modelos de dados
   */
  getModels() {
    return {
      Theme,
      Template
    };
  }

  /**
   * Habilita o suporte ao Bootstrap
   * 
   * @param {Object} options Opções do Bootstrap
   * @param {String} options.version Versão do Bootstrap
   * @returns {DesignSystem} A instância atual do DesignSystem
   */
  enableBootstrapSupport(options = {}) {
    this.enableBootstrap = true;
    
    // Criar adaptador Bootstrap se ainda não existir
    if (!this.bootstrapAdapter) {
      this.bootstrapAdapter = new BootstrapAdapter({
        cache: this.options.cache,
        bootstrapVersion: options.version || '5.3.0'
      });
    }
    
    // Atualizar controlador com o adaptador Bootstrap
    this.designController.setBootstrapAdapter(this.bootstrapAdapter);
    
    console.log(`Bootstrap support enabled (version ${options.version || '5.3.0'})`);
    
    return this;
  }

  /**
   * Cria um renderizador de templates Bootstrap
   * 
   * @param {Object} options Opções do renderizador
   * @returns {BootstrapTemplateRenderer} Renderizador de templates Bootstrap
   */
  createBootstrapRenderer(options = {}) {
    if (!this.bootstrapAdapter && !this.enableBootstrap) {
      console.warn('BootstrapAdapter não está disponível. Habilitando suporte ao Bootstrap automaticamente.');
      this.enableBootstrapSupport();
    }
    
    return new BootstrapTemplateRenderer({
      ...options,
      cache: options.cache || this.options.cache,
      bootstrapAdapter: this.bootstrapAdapter
    });
  }
  
  /**
   * Verifica se o suporte ao Bootstrap está habilitado
   * 
   * @returns {Boolean} true se o suporte ao Bootstrap estiver habilitado
   */
  isBootstrapEnabled() {
    return this.enableBootstrap === true && this.bootstrapAdapter !== null;
  }
}

module.exports = {
  DesignSystem,
  models: {
    Theme,
    Template
  },
  BootstrapAdapter,
  BootstrapTemplateRenderer
};