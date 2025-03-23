/**
 * Módulo de gerenciamento de hospedagem
 * 
 * Este módulo centraliza as funcionalidades relacionadas a gerenciamento de
 * hospedagem, integrando-se com diferentes provedores através da camada de
 * provedores.
 */

const { EventEmitter } = require('events');
const providers = require('../../providers');

class HostingManager extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = config;
    this.providers = {};
    this.defaultProvider = config.defaultProvider || 'hostinger';
  }

  /**
   * Inicializa o gerenciador de hospedagem
   */
  async initialize() {
    try {
      // Se houver configurações para provedores, inicializa-os
      if (this.config.providers) {
        for (const [providerName, providerConfig] of Object.entries(this.config.providers)) {
          await this.initializeProvider(providerName, providerConfig);
        }
      }

      this.emit('initialized');
      return true;
    } catch (error) {
      this.emit('error', {
        message: 'Falha ao inicializar o gerenciador de hospedagem',
        error: error.message
      });
      return false;
    }
  }

  /**
   * Inicializa um provedor específico
   * @param {string} providerName Nome do provedor
   * @param {Object} providerConfig Configuração do provedor
   */
  async initializeProvider(providerName, providerConfig) {
    try {
      if (!providers[providerName]) {
        throw new Error(`Provedor ${providerName} não implementado`);
      }

      const providerInstance = new providers[providerName](providerConfig);
      await providerInstance.initialize();

      this.providers[providerName] = providerInstance;
      this.emit('provider-initialized', { provider: providerName });

      return true;
    } catch (error) {
      this.emit('error', {
        message: `Falha ao inicializar provedor ${providerName}`,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Obtém instância de um provedor
   * @param {string} providerName Nome do provedor (opcional, usa o padrão se não fornecido)
   * @returns {Object} Instância do provedor
   * @private
   */
  getProvider(providerName = null) {
    const provider = providerName || this.defaultProvider;
    
    if (!this.providers[provider]) {
      throw new Error(`Provedor ${provider} não inicializado`);
    }
    
    return this.providers[provider];
  }

  /**
   * Lista todos os sites
   * @param {string} providerName Nome do provedor (opcional)
   * @param {Object} filter Filtro opcional
   * @returns {Promise<Array>} Lista de sites
   */
  async listSites(providerName = null, filter = {}) {
    try {
      const provider = this.getProvider(providerName);
      return await provider.listSites(filter);
    } catch (error) {
      this.emit('error', {
        message: 'Falha ao listar sites',
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Obtém detalhes de um site específico
   * @param {string} siteId ID do site
   * @param {string} providerName Nome do provedor (opcional)
   * @returns {Promise<Object>} Detalhes do site
   */
  async getSite(siteId, providerName = null) {
    try {
      const provider = this.getProvider(providerName);
      return await provider.getSite(siteId);
    } catch (error) {
      this.emit('error', {
        message: `Falha ao obter detalhes do site ${siteId}`,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Cria um novo site
   * @param {Object} options Opções do site
   * @param {string} providerName Nome do provedor (opcional)
   * @returns {Promise<Object>} Detalhes do site criado
   */
  async createSite(options, providerName = null) {
    try {
      const provider = this.getProvider(providerName);
      const result = await provider.createSite(options);
      this.emit('site-created', { provider: providerName || this.defaultProvider, site: result });
      return result;
    } catch (error) {
      this.emit('error', {
        message: 'Falha ao criar site',
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Atualiza configurações de um site
   * @param {string} siteId ID do site
   * @param {Object} updates Atualizações a serem aplicadas
   * @param {string} providerName Nome do provedor (opcional)
   * @returns {Promise<Object>} Detalhes do site atualizado
   */
  async updateSite(siteId, updates, providerName = null) {
    try {
      const provider = this.getProvider(providerName);
      const result = await provider.updateSite(siteId, updates);
      this.emit('site-updated', { provider: providerName || this.defaultProvider, site: result });
      return result;
    } catch (error) {
      this.emit('error', {
        message: `Falha ao atualizar site ${siteId}`,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Remove um site
   * @param {string} siteId ID do site
   * @param {string} providerName Nome do provedor (opcional)
   * @returns {Promise<boolean>} Sucesso da remoção
   */
  async deleteSite(siteId, providerName = null) {
    try {
      const provider = this.getProvider(providerName);
      await provider.deleteSite(siteId);
      this.emit('site-deleted', { provider: providerName || this.defaultProvider, siteId });
      return true;
    } catch (error) {
      this.emit('error', {
        message: `Falha ao remover site ${siteId}`,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Cria backup de um site
   * @param {string} siteId ID do site
   * @param {string} providerName Nome do provedor (opcional)
   * @returns {Promise<Object>} Detalhes do backup
   */
  async createBackup(siteId, providerName = null) {
    try {
      const provider = this.getProvider(providerName);
      const result = await provider.createBackup(siteId);
      this.emit('backup-created', { provider: providerName || this.defaultProvider, site: siteId, backup: result });
      return result;
    } catch (error) {
      this.emit('error', {
        message: `Falha ao criar backup do site ${siteId}`,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Restaura um site a partir de um backup
   * @param {string} siteId ID do site
   * @param {string} backupId ID do backup
   * @param {string} providerName Nome do provedor (opcional)
   * @returns {Promise<Object>} Detalhes da restauração
   */
  async restoreBackup(siteId, backupId, providerName = null) {
    try {
      const provider = this.getProvider(providerName);
      const result = await provider.restoreBackup(siteId, backupId);
      this.emit('backup-restored', { provider: providerName || this.defaultProvider, site: siteId, backup: backupId });
      return result;
    } catch (error) {
      this.emit('error', {
        message: `Falha ao restaurar backup ${backupId} do site ${siteId}`,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Configura um domínio para um site
   * @param {string} siteId ID do site
   * @param {Object} domainSettings Configurações do domínio
   * @param {string} providerName Nome do provedor (opcional)
   * @returns {Promise<Object>} Detalhes da configuração
   */
  async configureDomain(siteId, domainSettings, providerName = null) {
    try {
      const provider = this.getProvider(providerName);
      const result = await provider.configureDomain(siteId, domainSettings);
      this.emit('domain-configured', { provider: providerName || this.defaultProvider, site: siteId, domain: domainSettings.domain || '' });
      return result;
    } catch (error) {
      this.emit('error', {
        message: `Falha ao configurar domínio para o site ${siteId}`,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Configura certificado SSL para um site
   * @param {string} siteId ID do site
   * @param {string} providerName Nome do provedor (opcional)
   * @returns {Promise<Object>} Detalhes do certificado
   */
  async setupSSL(siteId, providerName = null) {
    try {
      const provider = this.getProvider(providerName);
      const result = await provider.setupSSL(siteId);
      this.emit('ssl-configured', { provider: providerName || this.defaultProvider, site: siteId });
      return result;
    } catch (error) {
      this.emit('error', {
        message: `Falha ao configurar SSL para o site ${siteId}`,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Obtém recursos de hospedagem de um site
   * @param {string} siteId ID do site
   * @param {string} providerName Nome do provedor (opcional)
   * @returns {Promise<Object>} Recursos de hospedagem
   */
  async getResources(siteId, providerName = null) {
    try {
      const provider = this.getProvider(providerName);
      if (typeof provider.getResources === 'function') {
        return await provider.getResources(siteId);
      } else {
        // Fallback para provedores que não implementam getResources diretamente
        const siteDetails = await provider.getSite(siteId);
        return {
          disk: siteDetails.resources?.disk,
          bandwidth: siteDetails.resources?.bandwidth,
          cpu: siteDetails.resources?.cpu,
          memory: siteDetails.resources?.memory
        };
      }
    } catch (error) {
      this.emit('error', {
        message: `Falha ao obter recursos do site ${siteId}`,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Atualiza plano de hospedagem de um site
   * @param {string} siteId ID do site
   * @param {string} plan Novo plano
   * @param {string} providerName Nome do provedor (opcional)
   * @returns {Promise<Object>} Resultado da atualização
   */
  async upgradePlan(siteId, plan, providerName = null) {
    try {
      const provider = this.getProvider(providerName);
      if (typeof provider.upgradePlan === 'function') {
        return await provider.upgradePlan(siteId, plan);
      } else {
        // Fallback para provedores que não implementam upgradePlan diretamente
        return await provider.updateSite(siteId, { plan });
      }
    } catch (error) {
      this.emit('error', {
        message: `Falha ao atualizar plano do site ${siteId}`,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Obtém métricas de desempenho de um site
   * @param {string} siteId ID do site
   * @param {Object} timeframe Período de tempo (opcional)
   * @param {string} providerName Nome do provedor (opcional)
   * @returns {Promise<Object>} Métricas de desempenho
   */
  async getMetrics(siteId, timeframe = {}, providerName = null) {
    try {
      const provider = this.getProvider(providerName);
      return await provider.getMetrics(siteId, timeframe);
    } catch (error) {
      this.emit('error', {
        message: `Falha ao obter métricas do site ${siteId}`,
        error: error.message
      });
      throw error;
    }
  }
}

module.exports = HostingManager;