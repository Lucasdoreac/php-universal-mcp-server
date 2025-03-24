/**
 * Módulo principal para gerenciamento de provedores de nuvem
 * @module providers/cloud
 */

const AWS = require('./aws');
const GCP = require('./gcp');
const Azure = require('./azure');
const DigitalOcean = require('./digitalocean');

/**
 * Classe para gerenciamento centralizado de provedores de nuvem
 */
class CloudProviders {
  /**
   * Cria uma instância do gerenciador de provedores de nuvem
   * @param {Object} config - Configuração global
   */
  constructor(config = {}) {
    this.config = config;
    this.providers = {
      aws: new AWS(config.aws || {}),
      gcp: new GCP(config.gcp || {}),
      azure: new Azure(config.azure || {}),
      digitalocean: new DigitalOcean(config.digitalocean || {})
    };
  }

  /**
   * Obtém um provedor de nuvem específico
   * @param {string} provider - Nome do provedor ('aws', 'gcp', 'azure', 'digitalocean')
   * @returns {Object} O provedor solicitado
   * @throws {Error} Se o provedor não for suportado
   */
  getProvider(provider) {
    if (!this.providers[provider]) {
      throw new Error(`Provedor de nuvem não suportado: ${provider}`);
    }
    return this.providers[provider];
  }

  /**
   * Lista todos os provedores disponíveis
   * @returns {string[]} Lista de nomes de provedores disponíveis
   */
  listProviders() {
    return Object.keys(this.providers);
  }

  /**
   * Verifica se um provedor está configurado corretamente
   * @param {string} provider - Nome do provedor
   * @returns {Promise<boolean>} Promessa que resolve para true se o provedor estiver configurado
   */
  async isProviderConfigured(provider) {
    try {
      const cloudProvider = this.getProvider(provider);
      return await cloudProvider.isConfigured();
    } catch (error) {
      console.error(`Erro ao verificar configuração do provedor ${provider}:`, error);
      return false;
    }
  }

  /**
   * Lista os serviços disponíveis para um provedor
   * @param {string} provider - Nome do provedor
   * @returns {string[]} Lista de serviços disponíveis
   */
  listProviderServices(provider) {
    const cloudProvider = this.getProvider(provider);
    return cloudProvider.listServices();
  }

  /**
   * Obtém métricas de todos os provedores configurados
   * @returns {Promise<Object>} Métricas de todos os provedores
   */
  async getAllMetrics() {
    const metrics = {};
    const providers = this.listProviders();
    
    for (const provider of providers) {
      try {
        if (await this.isProviderConfigured(provider)) {
          metrics[provider] = await this.getProvider(provider).getMetrics();
        }
      } catch (error) {
        console.error(`Erro ao obter métricas do provedor ${provider}:`, error);
        metrics[provider] = { error: error.message };
      }
    }
    
    return metrics;
  }
}

module.exports = CloudProviders;