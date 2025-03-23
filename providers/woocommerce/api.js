/**
 * WooCommerce API Module
 * 
 * Implementa chamadas à API REST do WooCommerce.
 */

class WooCommerceAPI {
  /**
   * Construtor da classe de API
   * @param {Object} auth Instância de WooCommerceAuth
   */
  constructor(auth) {
    this.auth = auth;
    this.client = null;
  }

  /**
   * Obtém cliente Axios configurado
   * @returns {Promise<Object>} Cliente Axios
   * @private
   */
  async getClient() {
    if (!this.client) {
      this.client = await this.auth.getAuthenticatedClient();
    }
    return this.client;
  }

  /**
   * Executa requisição GET
   * @param {string} endpoint Endpoint da API
   * @param {Object} params Parâmetros da consulta
   * @returns {Promise<Object|Array>} Resposta da API
   */
  async get(endpoint, params = {}) {
    try {
      const client = await this.getClient();
      const response = await client.get(endpoint, { params });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Executa requisição POST
   * @param {string} endpoint Endpoint da API
   * @param {Object} data Dados a serem enviados
   * @returns {Promise<Object>} Resposta da API
   */
  async post(endpoint, data = {}) {
    try {
      const client = await this.getClient();
      const response = await client.post(endpoint, data);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Executa requisição PUT
   * @param {string} endpoint Endpoint da API
   * @param {Object} data Dados a serem enviados
   * @returns {Promise<Object>} Resposta da API
   */
  async put(endpoint, data = {}) {
    try {
      const client = await this.getClient();
      const response = await client.put(endpoint, data);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Executa requisição DELETE
   * @param {string} endpoint Endpoint da API
   * @param {Object} params Parâmetros da requisição
   * @returns {Promise<Object>} Resposta da API
   */
  async delete(endpoint, params = {}) {
    try {
      const client = await this.getClient();
      const response = await client.delete(endpoint, { params });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Processa erros da API
   * @param {Error} error Erro da requisição
   * @throws {Error} Erro processado
   * @private
   */
  handleError(error) {
    let errorMessage = 'Erro desconhecido na API WooCommerce';
    let errorCode = 500;
    
    if (error.response) {
      // A API retornou uma resposta com código de erro
      errorMessage = error.response.data?.message || 'Erro na resposta da API WooCommerce';
      errorCode = error.response.status;
      
      const detailsError = new Error(errorMessage);
      detailsError.code = errorCode;
      detailsError.data = error.response.data;
      throw detailsError;
    } else if (error.request) {
      // A requisição foi feita mas não houve resposta
      errorMessage = 'Sem resposta do servidor WooCommerce';
      const timeoutError = new Error(errorMessage);
      timeoutError.code = 408; // Request Timeout
      throw timeoutError;
    } else {
      // Algo aconteceu ao configurar a requisição
      errorMessage = `Erro ao configurar requisição: ${error.message}`;
      const configError = new Error(errorMessage);
      configError.code = 400; // Bad Request
      throw configError;
    }
  }

  /**
   * Executa requisição batch
   * @param {string} resource Recurso da API (products, orders, etc.)
   * @param {Object} operations Operações de batch (create, update, delete)
   * @returns {Promise<Object>} Resposta da API
   */
  async batch(resource, operations) {
    try {
      const endpoint = `${resource}/batch`;
      const response = await this.post(endpoint, operations);
      return response;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Executa requisição com paginação para obter todos os resultados
   * @param {string} endpoint Endpoint da API
   * @param {Object} params Parâmetros da consulta
   * @returns {Promise<Array>} Todos os resultados
   */
  async getAll(endpoint, params = {}) {
    let page = 1;
    const perPage = params.per_page || 100;
    let totalPages = 1;
    let allItems = [];
    
    try {
      // Primeira requisição para obter o número total de páginas
      const client = await this.getClient();
      const firstResponse = await client.get(endpoint, {
        params: { ...params, page, per_page: perPage }
      });
      
      allItems = [...firstResponse.data];
      
      // Verifica se há mais páginas
      const totalItems = parseInt(firstResponse.headers['x-wp-total'] || '0', 10);
      totalPages = parseInt(firstResponse.headers['x-wp-totalpages'] || '1', 10);
      
      // Busca páginas adicionais
      const requests = [];
      for (page = 2; page <= totalPages; page++) {
        requests.push(
          client.get(endpoint, {
            params: { ...params, page, per_page: perPage }
          })
        );
      }
      
      if (requests.length > 0) {
        const responses = await Promise.all(requests);
        responses.forEach(response => {
          allItems = [...allItems, ...response.data];
        });
      }
      
      return allItems;
    } catch (error) {
      this.handleError(error);
    }
  }
}

module.exports = WooCommerceAPI;