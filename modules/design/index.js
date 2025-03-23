/**
 * Site Design System - Ponto de entrada
 * 
 * Este módulo fornece ferramentas para gerenciar a aparência visual
 * de sites e lojas de e-commerce em diferentes plataformas.
 */

const DesignController = require('./controllers/DesignController');
const Theme = require('./models/Theme');
const Template = require('./models/Template');

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
   */
  constructor(options = {}) {
    this.options = options;
    this.designController = new DesignController(options);
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
}

module.exports = {
  DesignSystem,
  models: {
    Theme,
    Template
  }
};