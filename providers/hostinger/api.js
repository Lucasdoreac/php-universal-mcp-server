/**
 * Módulo de API para o provedor Hostinger
 * 
 * Implementa chamadas específicas para operações da API Hostinger
 */

const axios = require('axios');

class HostingerAPI {
  /**
   * Construtor da classe de API
   * @param {Object} auth Instância de HostingerAuth
   * @param {string} baseURL URL base da API
   */
  constructor(auth, baseURL = 'https://api.hostinger.com/v1') {
    this.auth = auth;
    this.baseURL = baseURL;
  }

  /**
   * Obtém cliente Axios configurado com token de autenticação
   * @returns {Promise<Object>} Cliente Axios configurado
   * @private
   */
  async getClient() {
    const token = await this.auth.getAuthToken();
    return axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
  }

  /**
   * Realiza uma requisição GET
   * @param {string} endpoint Endpoint da API
   * @param {Object} params Parâmetros da requisição
   * @returns {Promise<Object>} Resposta da API
   */
  async get(endpoint, params = {}) {
    const client = await this.getClient();
    try {
      const response = await client.get(endpoint, { params });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Realiza uma requisição POST
   * @param {string} endpoint Endpoint da API
   * @param {Object} data Dados a serem enviados
   * @returns {Promise<Object>} Resposta da API
   */
  async post(endpoint, data = {}) {
    const client = await this.getClient();
    try {
      const response = await client.post(endpoint, data);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Realiza uma requisição PUT
   * @param {string} endpoint Endpoint da API
   * @param {Object} data Dados a serem enviados
   * @returns {Promise<Object>} Resposta da API
   */
  async put(endpoint, data = {}) {
    const client = await this.getClient();
    try {
      const response = await client.put(endpoint, data);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Realiza uma requisição PATCH
   * @param {string} endpoint Endpoint da API
   * @param {Object} data Dados a serem enviados
   * @returns {Promise<Object>} Resposta da API
   */
  async patch(endpoint, data = {}) {
    const client = await this.getClient();
    try {
      const response = await client.patch(endpoint, data);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Realiza uma requisição DELETE
   * @param {string} endpoint Endpoint da API
   * @returns {Promise<Object>} Resposta da API
   */
  async delete(endpoint) {
    const client = await this.getClient();
    try {
      const response = await client.delete(endpoint);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Trata erros das requisições
   * @param {Error} error Erro da requisição
   * @throws {Error} Erro tratado
   * @private
   */
  handleError(error) {
    if (error.response) {
      // A requisição foi feita e o servidor respondeu com um status fora do intervalo 2xx
      const message = error.response.data?.message || 'Erro na resposta do servidor';
      const apiError = new Error(message);
      apiError.statusCode = error.response.status;
      apiError.data = error.response.data;
      throw apiError;
    } else if (error.request) {
      // A requisição foi feita mas não houve resposta
      throw new Error('Sem resposta do servidor Hostinger');
    } else {
      // Algo aconteceu na configuração da requisição que disparou um erro
      throw new Error(`Erro ao configurar requisição: ${error.message}`);
    }
  }

  /**
   * API: Obtém informações da conta
   * @returns {Promise<Object>} Informações da conta
   */
  async getAccount() {
    return this.get('/account');
  }

  /**
   * API: Lista todos os websites
   * @returns {Promise<Array>} Lista de websites
   */
  async listWebsites() {
    return this.get('/websites');
  }

  /**
   * API: Obtém detalhes de um website
   * @param {string} websiteId ID do website
   * @returns {Promise<Object>} Detalhes do website
   */
  async getWebsite(websiteId) {
    return this.get(`/websites/${websiteId}`);
  }

  /**
   * API: Cria um novo website
   * @param {Object} websiteData Dados do website
   * @returns {Promise<Object>} Detalhes do website criado
   */
  async createWebsite(websiteData) {
    return this.post('/websites', websiteData);
  }

  /**
   * API: Atualiza um website
   * @param {string} websiteId ID do website
   * @param {Object} websiteData Dados a serem atualizados
   * @returns {Promise<Object>} Detalhes do website atualizado
   */
  async updateWebsite(websiteId, websiteData) {
    return this.patch(`/websites/${websiteId}`, websiteData);
  }

  /**
   * API: Remove um website
   * @param {string} websiteId ID do website
   * @returns {Promise<Object>} Resultado da operação
   */
  async deleteWebsite(websiteId) {
    return this.delete(`/websites/${websiteId}`);
  }

  /**
   * API: Lista domínios
   * @returns {Promise<Array>} Lista de domínios
   */
  async listDomains() {
    return this.get('/domains');
  }

  /**
   * API: Obtém detalhes de um domínio
   * @param {string} domainName Nome do domínio
   * @returns {Promise<Object>} Detalhes do domínio
   */
  async getDomain(domainName) {
    return this.get(`/domains/${domainName}`);
  }

  /**
   * API: Cria registros DNS para um domínio
   * @param {string} domainName Nome do domínio
   * @param {Array} records Registros DNS a serem criados
   * @returns {Promise<Object>} Resultado da operação
   */
  async createDnsRecords(domainName, records) {
    return this.post(`/domains/${domainName}/dns`, { records });
  }

  /**
   * API: Lista registros DNS de um domínio
   * @param {string} domainName Nome do domínio
   * @returns {Promise<Array>} Lista de registros DNS
   */
  async listDnsRecords(domainName) {
    return this.get(`/domains/${domainName}/dns`);
  }

  /**
   * API: Remove um registro DNS
   * @param {string} domainName Nome do domínio
   * @param {string} recordId ID do registro DNS
   * @returns {Promise<Object>} Resultado da operação
   */
  async deleteDnsRecord(domainName, recordId) {
    return this.delete(`/domains/${domainName}/dns/${recordId}`);
  }

  /**
   * API: Lista bancos de dados de um website
   * @param {string} websiteId ID do website
   * @returns {Promise<Array>} Lista de bancos de dados
   */
  async listDatabases(websiteId) {
    return this.get(`/websites/${websiteId}/databases`);
  }

  /**
   * API: Cria um banco de dados para um website
   * @param {string} websiteId ID do website
   * @param {Object} dbData Dados do banco de dados
   * @returns {Promise<Object>} Detalhes do banco de dados criado
   */
  async createDatabase(websiteId, dbData) {
    return this.post(`/websites/${websiteId}/databases`, dbData);
  }

  /**
   * API: Obtém detalhes de um banco de dados
   * @param {string} websiteId ID do website
   * @param {string} dbId ID do banco de dados
   * @returns {Promise<Object>} Detalhes do banco de dados
   */
  async getDatabase(websiteId, dbId) {
    return this.get(`/websites/${websiteId}/databases/${dbId}`);
  }

  /**
   * API: Remove um banco de dados
   * @param {string} websiteId ID do website
   * @param {string} dbId ID do banco de dados
   * @returns {Promise<Object>} Resultado da operação
   */
  async deleteDatabase(websiteId, dbId) {
    return this.delete(`/websites/${websiteId}/databases/${dbId}`);
  }

  /**
   * API: Lista backups de um website
   * @param {string} websiteId ID do website
   * @returns {Promise<Array>} Lista de backups
   */
  async listBackups(websiteId) {
    return this.get(`/websites/${websiteId}/backups`);
  }

  /**
   * API: Cria um backup de um website
   * @param {string} websiteId ID do website
   * @param {Object} backupData Dados do backup
   * @returns {Promise<Object>} Detalhes do backup criado
   */
  async createBackup(websiteId, backupData = {}) {
    return this.post(`/websites/${websiteId}/backups`, backupData);
  }

  /**
   * API: Restaura um backup
   * @param {string} websiteId ID do website
   * @param {string} backupId ID do backup
   * @returns {Promise<Object>} Resultado da operação
   */
  async restoreBackup(websiteId, backupId) {
    return this.post(`/websites/${websiteId}/backups/${backupId}/restore`);
  }

  /**
   * API: Obtém estatísticas de um website
   * @param {string} websiteId ID do website
   * @param {Object} params Parâmetros da consulta
   * @returns {Promise<Object>} Estatísticas do website
   */
  async getWebsiteStats(websiteId, params = { period: '30d' }) {
    return this.get(`/websites/${websiteId}/stats`, params);
  }

  /**
   * API: Lista certificados SSL de um website
   * @param {string} websiteId ID do website
   * @returns {Promise<Array>} Lista de certificados SSL
   */
  async listSslCertificates(websiteId) {
    return this.get(`/websites/${websiteId}/ssl`);
  }

  /**
   * API: Instala um certificado SSL para um website
   * @param {string} websiteId ID do website
   * @param {Object} sslData Dados do certificado SSL
   * @returns {Promise<Object>} Detalhes do certificado instalado
   */
  async installSslCertificate(websiteId, sslData = { provider: 'letsencrypt' }) {
    return this.post(`/websites/${websiteId}/ssl`, sslData);
  }
}

module.exports = HostingerAPI;