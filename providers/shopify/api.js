/**
 * Shopify API Module
 * 
 * Implementa chamadas à API REST e GraphQL do Shopify.
 */

class ShopifyAPI {
  /**
   * Construtor da classe de API
   * @param {Object} auth Instância de ShopifyAuth
   */
  constructor(auth) {
    this.auth = auth;
    this.client = null;
    this.rateLimitDelay = 500; // Delay entre requisições em ms
    this.lastRequestTime = 0;
  }

  /**
   * Obtém cliente Axios configurado
   * @returns {Object} Cliente Axios
   * @private
   */
  getClient() {
    if (!this.client) {
      this.client = this.auth.getAuthenticatedClient();
    }
    return this.client;
  }

  /**
   * Gerencia atrasos para evitar limites de taxa na API
   * @returns {Promise<void>}
   * @private
   */
  async handleRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.rateLimitDelay) {
      const delayMs = this.rateLimitDelay - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
    
    this.lastRequestTime = Date.now();
  }

  /**
   * Executa requisição GET
   * @param {string} endpoint Endpoint da API
   * @param {Object} params Parâmetros da consulta
   * @returns {Promise<Object|Array>} Resposta da API
   */
  async get(endpoint, params = {}) {
    await this.handleRateLimit();
    
    try {
      const client = this.getClient();
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
    await this.handleRateLimit();
    
    try {
      const client = this.getClient();
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
    await this.handleRateLimit();
    
    try {
      const client = this.getClient();
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
    await this.handleRateLimit();
    
    try {
      const client = this.getClient();
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
    let errorMessage = 'Erro desconhecido na API Shopify';
    let errorCode = 500;
    
    if (error.response) {
      // A API retornou uma resposta com código de erro
      const errorData = error.response.data;
      const errors = errorData.errors || (typeof errorData === 'string' ? errorData : 'Erro na resposta da API Shopify');
      
      errorMessage = typeof errors === 'object' ? JSON.stringify(errors) : errors;
      errorCode = error.response.status;
      
      // Tratamento específico para limite de taxa
      if (errorCode === 429) {
        // Aumente o atraso para respeitar os limites
        this.rateLimitDelay = Math.min(this.rateLimitDelay * 2, 5000);
        errorMessage = 'Limite de taxa da API Shopify excedido. Tente novamente mais tarde.';
      }
      
      const detailsError = new Error(errorMessage);
      detailsError.code = errorCode;
      detailsError.data = error.response.data;
      throw detailsError;
    } else if (error.request) {
      // A requisição foi feita mas não houve resposta
      errorMessage = 'Sem resposta do servidor Shopify';
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
   * Executa consulta GraphQL
   * @param {string} query Consulta GraphQL
   * @param {Object} variables Variáveis da consulta
   * @returns {Promise<Object>} Resultado da consulta
   */
  async graphql(query, variables = {}) {
    await this.handleRateLimit();
    
    try {
      return await this.auth.executeGraphQL(query, variables);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Executa requisição com paginação para obter todos os resultados
   * @param {string} endpoint Endpoint da API
   * @param {Object} params Parâmetros da consulta
   * @param {number} maxItems Número máximo de itens a serem retornados (0 para sem limite)
   * @returns {Promise<Array>} Todos os resultados
   */
  async getAll(endpoint, params = {}, maxItems = 0) {
    let page = 1;
    const limit = params.limit || 50;
    let allItems = [];
    let hasMore = true;
    
    while (hasMore) {
      const queryParams = {
        ...params,
        limit,
        page
      };
      
      const response = await this.get(endpoint, queryParams);
      
      // Determina a chave de resposta (produtos, pedidos, etc.)
      const responseKey = Object.keys(response).find(key => Array.isArray(response[key]));
      
      if (!responseKey || !response[responseKey] || response[responseKey].length === 0) {
        hasMore = false;
        break;
      }
      
      const items = response[responseKey];
      allItems = [...allItems, ...items];
      
      // Verifica se atingiu o limite máximo de itens
      if (maxItems > 0 && allItems.length >= maxItems) {
        allItems = allItems.slice(0, maxItems);
        hasMore = false;
        break;
      }
      
      // Verifica se há mais páginas
      if (items.length < limit) {
        hasMore = false;
      } else {
        page++;
      }
    }
    
    // Retorna no mesmo formato da resposta original
    return allItems;
  }

  /**
   * Executa paginação baseada em GraphQL usando cursores
   * @param {string} query Consulta GraphQL
   * @param {string} connectionPath Caminho para a conexão (ex: 'products')
   * @param {string} itemsPath Caminho para os itens (ex: 'edges.node')
   * @param {Object} variables Variáveis iniciais da consulta
   * @param {number} maxItems Número máximo de itens (0 para sem limite)
   * @returns {Promise<Array>} Todos os resultados
   */
  async graphqlPaginate(query, connectionPath, itemsPath, variables = {}, maxItems = 0) {
    let hasNextPage = true;
    let afterCursor = null;
    let allItems = [];
    
    while (hasNextPage) {
      const queryVariables = {
        ...variables,
        after: afterCursor
      };
      
      const response = await this.graphql(query, queryVariables);
      
      // Extrai dados da resposta
      const connection = this.getNestedProperty(response.data, connectionPath);
      if (!connection) {
        break;
      }
      
      // Extrai itens dos edges
      const items = this.extractItems(connection.edges, itemsPath);
      allItems = [...allItems, ...items];
      
      // Verifica se atingiu o limite máximo de itens
      if (maxItems > 0 && allItems.length >= maxItems) {
        allItems = allItems.slice(0, maxItems);
        hasNextPage = false;
        break;
      }
      
      // Verifica se há mais páginas
      hasNextPage = connection.pageInfo?.hasNextPage || false;
      afterCursor = connection.pageInfo?.endCursor || null;
      
      if (!hasNextPage || !afterCursor) {
        break;
      }
    }
    
    return allItems;
  }

  /**
   * Obtém propriedade aninhada de um objeto
   * @param {Object} obj Objeto de origem
   * @param {string} path Caminho da propriedade (separado por pontos)
   * @returns {*} Valor da propriedade
   * @private
   */
  getNestedProperty(obj, path) {
    return path.split('.').reduce((prev, curr) => {
      return prev && prev[curr] ? prev[curr] : null;
    }, obj);
  }

  /**
   * Extrai itens de edges GraphQL
   * @param {Array} edges Edges da resposta GraphQL
   * @param {string} path Caminho para o item (ex: 'node')
   * @returns {Array} Itens extraídos
   * @private
   */
  extractItems(edges, path) {
    if (!edges || !Array.isArray(edges)) {
      return [];
    }
    
    return edges.map(edge => {
      return this.getNestedProperty(edge, path);
    }).filter(item => item !== null);
  }
}

module.exports = ShopifyAPI;