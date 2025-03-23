/**
 * Shopify Authentication Module
 * 
 * Implementa autenticação OAuth 2.0 para a API Shopify.
 */

const crypto = require('crypto');
const axios = require('axios');
const querystring = require('querystring');

class ShopifyAuth {
  /**
   * Construtor da classe de autenticação
   * @param {Object} config Configuração de autenticação
   * @param {string} config.shopName Nome da loja Shopify
   * @param {string} config.apiKey Chave da API Shopify
   * @param {string} config.apiSecret Segredo da API Shopify
   * @param {string} config.accessToken Token de acesso (opcional se usar OAuth)
   * @param {string} config.apiVersion Versão da API (padrão: 2023-10)
   * @param {Array<string>} config.scopes Escopos de permissão
   */
  constructor(config) {
    this.shopName = config.shopName;
    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
    this.accessToken = config.accessToken;
    this.apiVersion = config.apiVersion || '2023-10';
    this.scopes = config.scopes || [];
    this.shopUrl = `https://${this.shopName}.myshopify.com`;
    this.apiUrl = `${this.shopUrl}/admin/api/${this.apiVersion}`;
  }

  /**
   * Gera a URL para autorização OAuth
   * @param {string} redirectUri URI de redirecionamento após autorização
   * @param {Array<string>} scopes Escopos de permissão (opcional)
   * @param {string} state Estado para validação CSRF (opcional)
   * @returns {string} URL de autorização
   */
  getAuthorizationUrl(redirectUri, scopes = [], state = '') {
    const requestedScopes = scopes.length > 0 ? scopes : this.scopes;
    
    if (!state) {
      state = crypto.randomBytes(16).toString('hex');
    }
    
    const params = {
      client_id: this.apiKey,
      scope: requestedScopes.join(','),
      redirect_uri: redirectUri,
      state: state,
      'grant_options[]': 'per-user'
    };
    
    return `${this.shopUrl}/admin/oauth/authorize?${querystring.stringify(params)}`;
  }

  /**
   * Verifica a validade da requisição de callback
   * @param {Object} query Parâmetros da requisição
   * @returns {boolean} Validade da requisição
   */
  validateCallback(query) {
    // Verifica estado para proteção CSRF
    if (query.state !== this.state) {
      return false;
    }
    
    // Verifica HMAC
    const hmac = query.hmac;
    const params = { ...query };
    delete params.hmac;
    delete params.signature;
    
    const message = querystring.stringify(params);
    const generatedHash = crypto
      .createHmac('sha256', this.apiSecret)
      .update(message)
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(hmac),
      Buffer.from(generatedHash)
    );
  }

  /**
   * Troca o código de autorização por um token de acesso
   * @param {string} code Código de autorização
   * @param {string} redirectUri URI de redirecionamento
   * @returns {Promise<Object>} Token de acesso e informações
   */
  async getAccessToken(code, redirectUri) {
    try {
      const response = await axios.post(`${this.shopUrl}/admin/oauth/access_token`, {
        client_id: this.apiKey,
        client_secret: this.apiSecret,
        code: code,
        redirect_uri: redirectUri
      });
      
      this.accessToken = response.data.access_token;
      return response.data;
    } catch (error) {
      throw new Error(`Falha ao obter token de acesso: ${error.message}`);
    }
  }

  /**
   * Verifica se o token de acesso é válido
   * @returns {Promise<boolean>} Validade do token
   */
  async validateAccessToken() {
    if (!this.accessToken) {
      return false;
    }
    
    try {
      const client = this.getAuthenticatedClient();
      await client.get('shop.json');
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Configura cliente Axios para requisições autenticadas
   * @param {Object} config Configuração do Axios
   * @returns {Object} Cliente Axios configurado
   */
  getAuthenticatedClient(config = {}) {
    if (!this.accessToken) {
      throw new Error('Token de acesso não disponível. Autentique-se primeiro.');
    }
    
    const axiosConfig = {
      ...config,
      baseURL: this.apiUrl,
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': this.accessToken,
        ...config.headers
      }
    };
    
    return axios.create(axiosConfig);
  }

  /**
   * Gera headers de autenticação para requisições GraphQL
   * @returns {Object} Headers de autenticação
   */
  getGraphQLHeaders() {
    if (!this.accessToken) {
      throw new Error('Token de acesso não disponível. Autentique-se primeiro.');
    }
    
    return {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': this.accessToken
    };
  }

  /**
   * Obtém URL da API GraphQL
   * @returns {string} URL da API GraphQL
   */
  getGraphQLUrl() {
    return `${this.shopUrl}/admin/api/${this.apiVersion}/graphql.json`;
  }

  /**
   * Executa consulta GraphQL
   * @param {string} query Consulta GraphQL
   * @param {Object} variables Variáveis da consulta (opcional)
   * @returns {Promise<Object>} Resultado da consulta
   */
  async executeGraphQL(query, variables = {}) {
    try {
      const response = await axios.post(
        this.getGraphQLUrl(),
        {
          query,
          variables
        },
        {
          headers: this.getGraphQLHeaders()
        }
      );
      
      return response.data;
    } catch (error) {
      throw new Error(`Falha ao executar consulta GraphQL: ${error.message}`);
    }
  }
}

module.exports = ShopifyAuth;