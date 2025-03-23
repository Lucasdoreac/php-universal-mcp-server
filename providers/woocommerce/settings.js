/**
 * WooCommerce Settings Management Module
 * 
 * Implementa gerenciamento de configurações da loja na API WooCommerce.
 */

class SettingsManager {
  /**
   * Construtor do gerenciador de configurações
   * @param {Object} api Instância da API WooCommerce
   */
  constructor(api) {
    this.api = api;
    this.endpoint = 'settings';
  }

  /**
   * Lista todos os grupos de configurações
   * @returns {Promise<Array>} Lista de grupos de configurações
   */
  async listGroups() {
    try {
      return await this.api.get(this.endpoint);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtém configurações de um grupo
   * @param {string} group Grupo de configurações
   * @returns {Promise<Array>} Configurações do grupo
   */
  async get(group = '') {
    try {
      if (!group) {
        return await this.listGroups();
      }
      return await this.api.get(`${this.endpoint}/${group}`);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtém uma configuração específica
   * @param {string} group Grupo de configurações
   * @param {string} id ID da configuração
   * @returns {Promise<Object>} Detalhes da configuração
   */
  async getOption(group, id) {
    try {
      return await this.api.get(`${this.endpoint}/${group}/${id}`);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Atualiza uma configuração específica
   * @param {string} group Grupo de configurações
   * @param {string} id ID da configuração
   * @param {Object} data Dados da configuração
   * @returns {Promise<Object>} Configuração atualizada
   */
  async update(group, id, data) {
    try {
      return await this.api.put(`${this.endpoint}/${group}/${id}`, data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Atualiza várias configurações de um grupo
   * @param {string} group Grupo de configurações
   * @param {Object} batchData Dados das configurações a serem atualizadas
   * @returns {Promise<Object>} Resultado da operação
   */
  async batchUpdate(group, batchData) {
    try {
      return await this.api.post(`${this.endpoint}/${group}/batch`, { update: batchData });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtém configurações gerais da loja
   * @returns {Promise<Array>} Configurações gerais
   */
  async getGeneralSettings() {
    try {
      return await this.get('general');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtém configurações de produtos
   * @returns {Promise<Array>} Configurações de produtos
   */
  async getProductSettings() {
    try {
      return await this.get('products');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtém configurações de impostos
   * @returns {Promise<Array>} Configurações de impostos
   */
  async getTaxSettings() {
    try {
      return await this.get('tax');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtém configurações de frete
   * @returns {Promise<Array>} Configurações de frete
   */
  async getShippingSettings() {
    try {
      return await this.get('shipping');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtém configurações de pagamento
   * @returns {Promise<Array>} Configurações de pagamento
   */
  async getPaymentSettings() {
    try {
      return await this.get('payment');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtém configurações de email
   * @returns {Promise<Array>} Configurações de email
   */
  async getEmailSettings() {
    try {
      return await this.get('email');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtém configurações avançadas
   * @returns {Promise<Array>} Configurações avançadas
   */
  async getAdvancedSettings() {
    try {
      return await this.get('advanced');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtém configurações de webhook
   * @returns {Promise<Array>} Configurações de webhook
   */
  async getWebhookSettings() {
    try {
      return await this.get('webhooks');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtém moeda atual da loja
   * @returns {Promise<Object>} Configuração de moeda
   */
  async getCurrency() {
    try {
      const settings = await this.getGeneralSettings();
      const currencySetting = settings.find(setting => setting.id === 'woocommerce_currency');
      return currencySetting || { value: 'USD' };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Atualiza moeda da loja
   * @param {string} currency Código da moeda
   * @returns {Promise<Object>} Configuração atualizada
   */
  async updateCurrency(currency) {
    try {
      return await this.update('general', 'woocommerce_currency', { value: currency });
    } catch (error) {
      throw error;
    }
  }
}

module.exports = SettingsManager;