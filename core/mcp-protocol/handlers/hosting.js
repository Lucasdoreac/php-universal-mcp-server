/**
 * Handlers para gerenciamento de hospedagem
 * Integra com HostingManager para manter responsabilidades claras
 */

const { EventEmitter } = require('events');
const HostingManager = require('../../../modules/hosting');

class HostingHandler extends EventEmitter {
  constructor(server, config = {}) {
    super();
    this.server = server;
    
    // Use HostingManager as abstraction layer
    this.hostingManager = new HostingManager(config);
    
    // Forward events from HostingManager
    this.hostingManager.on('error', (error) => this.emit('error', error));
    this.hostingManager.on('site-created', (data) => this.emit('site-created', data));
    this.hostingManager.on('site-updated', (data) => this.emit('site-updated', data));
    this.hostingManager.on('site-deleted', (data) => this.emit('site-deleted', data));
  }

  /**
   * Initialize the hosting handler
   */
  async initialize() {
    return await this.hostingManager.initialize();
  }

  /**
   * Inicializa um provedor de hospedagem
   * @param {Object} params Parâmetros
   * @param {string} params.provider Nome do provedor
   * @param {Object} params.config Configuração do provedor
   */
  async initProvider(params) {
    try {
      const { provider, config } = params;
      await this.hostingManager.initializeProvider(provider, config);
      return { success: true, provider };
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Lista todos os sites
   * @param {Object} params Parâmetros
   * @param {string} params.provider Nome do provedor
   * @param {Object} params.filter Filtro de busca (opcional)
   */
  async listSites(params) {
    try {
      const { provider, filter } = params;
      return await this.hostingManager.listSites(provider, filter);
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Obtém detalhes de um site
   * @param {Object} params Parâmetros
   * @param {string} params.provider Nome do provedor
   * @param {string} params.siteId ID do site
   */
  async getSite(params) {
    try {
      const { provider, siteId } = params;
      return await this.hostingManager.getSite(siteId, provider);
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Cria um novo site
   * @param {Object} params Parâmetros
   * @param {string} params.provider Nome do provedor
   * @param {Object} params.options Opções do site
   */
  async createSite(params) {
    try {
      const { provider, options } = params;
      return await this.hostingManager.createSite(options, provider);
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Atualiza configurações de um site
   * @param {Object} params Parâmetros
   * @param {string} params.provider Nome do provedor
   * @param {string} params.siteId ID do site
   * @param {Object} params.updates Atualizações a serem aplicadas
   */
  async updateSite(params) {
    try {
      const { provider, siteId, updates } = params;
      return await this.hostingManager.updateSite(siteId, updates, provider);
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Remove um site
   * @param {Object} params Parâmetros
   * @param {string} params.provider Nome do provedor
   * @param {string} params.siteId ID do site
   */
  async deleteSite(params) {
    try {
      const { provider, siteId } = params;
      return await this.hostingManager.deleteSite(siteId, provider);
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Cria backup de um site
   * @param {Object} params Parâmetros
   * @param {string} params.provider Nome do provedor
   * @param {string} params.siteId ID do site
   */
  async createBackup(params) {
    try {
      const { provider, siteId } = params;
      return await this.hostingManager.createBackup(siteId, provider);
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Restaura um site a partir de um backup
   * @param {Object} params Parâmetros
   * @param {string} params.provider Nome do provedor
   * @param {string} params.siteId ID do site
   * @param {string} params.backupId ID do backup
   */
  async restoreBackup(params) {
    try {
      const { provider, siteId, backupId } = params;
      return await this.hostingManager.restoreBackup(siteId, backupId, provider);
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Configura um domínio para um site
   * @param {Object} params Parâmetros
   * @param {string} params.provider Nome do provedor
   * @param {string} params.siteId ID do site
   * @param {Object} params.domainSettings Configurações do domínio
   */
  async configureDomain(params) {
    try {
      const { provider, siteId, domainSettings } = params;
      return await this.hostingManager.configureDomain(siteId, domainSettings, provider);
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Configura certificado SSL para um site
   * @param {Object} params Parâmetros
   * @param {string} params.provider Nome do provedor
   * @param {string} params.siteId ID do site
   */
  async setupSSL(params) {
    try {
      const { provider, siteId } = params;
      return await this.hostingManager.setupSSL(siteId, provider);
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Obtém recursos de hospedagem de um site
   * @param {Object} params Parâmetros
   * @param {string} params.provider Nome do provedor
   * @param {string} params.siteId ID do site
   */
  async getResources(params) {
    try {
      const { provider, siteId } = params;
      return await this.hostingManager.getResources(siteId, provider);
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Atualiza plano de hospedagem de um site
   * @param {Object} params Parâmetros
   * @param {string} params.provider Nome do provedor
   * @param {string} params.siteId ID do site
   * @param {string} params.plan Novo plano
   */
  async upgradePlan(params) {
    try {
      const { provider, siteId, plan } = params;
      return await this.hostingManager.upgradePlan(siteId, plan, provider);
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Obtém métricas de desempenho de um site
   * @param {Object} params Parâmetros
   * @param {string} params.provider Nome do provedor
   * @param {string} params.siteId ID do site
   * @param {Object} params.timeframe Período de tempo (opcional)
   */
  async getMetrics(params) {
    try {
      const { provider, siteId, timeframe } = params;
      return await this.hostingManager.getMetrics(siteId, timeframe, provider);
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Registra todos os métodos no servidor MCP
   */
  registerMethods() {
    this.server.registerMethod('hosting.initProvider', this.initProvider.bind(this));
    this.server.registerMethod('hosting.listSites', this.listSites.bind(this));
    this.server.registerMethod('hosting.getSite', this.getSite.bind(this));
    this.server.registerMethod('hosting.createSite', this.createSite.bind(this));
    this.server.registerMethod('hosting.updateSite', this.updateSite.bind(this));
    this.server.registerMethod('hosting.deleteSite', this.deleteSite.bind(this));
    this.server.registerMethod('hosting.createBackup', this.createBackup.bind(this));
    this.server.registerMethod('hosting.restoreBackup', this.restoreBackup.bind(this));
    this.server.registerMethod('hosting.configureDomain', this.configureDomain.bind(this));
    this.server.registerMethod('hosting.setupSSL', this.setupSSL.bind(this));
    this.server.registerMethod('hosting.getResources', this.getResources.bind(this));
    this.server.registerMethod('hosting.upgradePlan', this.upgradePlan.bind(this));
    this.server.registerMethod('hosting.getMetrics', this.getMetrics.bind(this));
  }
}

module.exports = HostingHandler;
