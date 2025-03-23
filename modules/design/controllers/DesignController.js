/**
 * Controlador de Design para o Site Design System
 */

const Theme = require('../models/Theme');
const DesignService = require('../services/DesignService');

class DesignController {
  /**
   * Cria uma instância do controlador de design
   * @param {Object} options Opções de configuração
   * @param {Object} options.providerManager Gerenciador de provedores
   */
  constructor(options = {}) {
    this.designService = new DesignService(options);
  }

  /**
   * Lista templates disponíveis
   * 
   * @param {Object} params Parâmetros da requisição
   * @param {string} params.category Categoria de templates (opcional)
   * @returns {Promise<Object>} Resposta com lista de templates
   */
  async getTemplates(params = {}) {
    try {
      const { category } = params;
      const templates = await this.designService.getTemplates({ category });
      
      return {
        success: true,
        data: templates
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obtém detalhes de um template específico
   * 
   * @param {Object} params Parâmetros da requisição
   * @param {string} params.templateId ID do template
   * @returns {Promise<Object>} Resposta com dados do template
   */
  async getTemplate(params) {
    try {
      const { templateId } = params;
      
      if (!templateId) {
        throw new Error('ID do template é obrigatório');
      }

      const template = await this.designService.getTemplateById(templateId);
      
      return {
        success: true,
        data: template
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Aplica um template a um site
   * 
   * @param {Object} params Parâmetros da requisição
   * @param {string} params.siteId ID do site
   * @param {string} params.templateId ID do template
   * @returns {Promise<Object>} Resposta com resultado da aplicação
   */
  async applyTemplate(params) {
    try {
      const { siteId, templateId } = params;
      
      if (!siteId) {
        throw new Error('ID do site é obrigatório');
      }
      
      if (!templateId) {
        throw new Error('ID do template é obrigatório');
      }

      const result = await this.designService.applyTemplate(siteId, templateId);
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Personaliza o tema de um site
   * 
   * @param {Object} params Parâmetros da requisição
   * @param {string} params.siteId ID do site
   * @param {Object} params.customizations Personalizações a serem aplicadas
   * @returns {Promise<Object>} Resposta com o tema personalizado
   */
  async customize(params) {
    try {
      const { siteId, customizations } = params;
      
      if (!siteId) {
        throw new Error('ID do site é obrigatório');
      }
      
      if (!customizations || Object.keys(customizations).length === 0) {
        throw new Error('Personalizações são obrigatórias');
      }

      const result = await this.designService.customizeTheme(siteId, customizations);
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Gera um preview de alterações de design
   * 
   * @param {Object} params Parâmetros da requisição
   * @param {string} params.siteId ID do site
   * @param {Object} params.changes Alterações a serem pré-visualizadas
   * @returns {Promise<Object>} Resposta com dados do preview
   */
  async preview(params) {
    try {
      const { siteId, changes } = params;
      
      if (!siteId) {
        throw new Error('ID do site é obrigatório');
      }
      
      if (!changes || Object.keys(changes).length === 0) {
        throw new Error('Alterações são obrigatórias');
      }

      const previewData = await this.designService.generatePreview(siteId, changes);
      
      return {
        success: true,
        data: previewData
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Publica alterações de design
   * 
   * @param {Object} params Parâmetros da requisição
   * @param {string} params.siteId ID do site
   * @returns {Promise<Object>} Resposta com resultado da publicação
   */
  async publish(params) {
    try {
      const { siteId } = params;
      
      if (!siteId) {
        throw new Error('ID do site é obrigatório');
      }

      const result = await this.designService.publishChanges(siteId);
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = DesignController;