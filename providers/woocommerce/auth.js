/**
 * WooCommerce Authentication Module
 * 
 * Implementa autenticação OAuth 1.0a para a API WooCommerce.
 */

const OAuth = require('oauth-1.0a');
const crypto = require('crypto');
const axios = require('axios');

class WooCommerceAuth {
  /**
   * Construtor da classe de autenticação
   * @param {Object} config Configuração de autenticação
   * @param {string} config.url URL da loja WooCommerce
   * @param {string} config.consumerKey Chave do consumidor para API WooCommerce
   * @param {string} config.consumerSecret Segredo do consumidor para API WooCommerce
   * @param {string} config.wpUsername Nome de usuário do WordPress (opcional para JWT)
   * @param {string} config.wpPassword Senha do WordPress (opcional para JWT)
   * @param {string} config.version Versão da API (padrão: 'wc/v3')
   */
  constructor(config) {
    this.url = config.url;
    this.consumerKey = config.consumerKey;
    this.consumerSecret = config.consumerSecret;
    this.wpUsername = config.wpUsername;
    this.wpPassword = config.wpPassword;
    this.version = config.version || 'wc/v3';
    this.apiUrl = `${this.url}/wp-json/${this.version}`;
    this.useHttps = this.url.startsWith('https');
    
    // Configuração do OAuth
    this.oauth = OAuth({
      consumer: {
        key: this.consumerKey,
        secret: this.consumerSecret
      },
      signature_method: 'HMAC-SHA256',
      hash_function(base_string, key) {
        return crypto
          .createHmac('sha256', key)
          .update(base_string)
          .digest('base64');
      }
    });
    
    // Token JWT para APIs REST do WordPress
    this.jwtToken = null;
  }

  /**
   * Gera headers de autenticação OAuth 1.0a
   * @param {string} method Método HTTP
   * @param {string} url URL da requisição
   * @returns {Object} Headers de autenticação
   */
  getOAuthHeaders(method, url) {
    // Para URLs HTTPS, podemos enviar as chaves diretamente como parâmetros de query
    if (this.useHttps) {
      return {}; // As credenciais serão enviadas como parâmetros de URL
    }
    
    // Para HTTP, precisamos usar assinatura OAuth
    const requestData = {
      url,
      method
    };
    
    return this.oauth.toHeader(this.oauth.authorize(requestData));
  }

  /**
   * Adiciona parâmetros de autenticação à URL
   * @param {string} url URL base
   * @returns {string} URL com parâmetros de autenticação
   */
  addAuthParams(url) {
    // Adiciona parâmetros apenas para HTTPS
    if (this.useHttps) {
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}consumer_key=${this.consumerKey}&consumer_secret=${this.consumerSecret}`;
    }
    
    return url;
  }

  /**
   * Obtém token JWT para a API REST do WordPress
   * @returns {Promise<string>} Token JWT
   */
  async getJWTToken() {
    // Se já temos um token, retorna-o
    if (this.jwtToken) {
      return this.jwtToken;
    }
    
    // Se não temos credenciais do WordPress, não podemos obter o token
    if (!this.wpUsername || !this.wpPassword) {
      throw new Error('Credenciais do WordPress são necessárias para obter token JWT');
    }
    
    try {
      const response = await axios.post(`${this.url}/wp-json/jwt-auth/v1/token`, {
        username: this.wpUsername,
        password: this.wpPassword
      });
      
      this.jwtToken = response.data.token;
      return this.jwtToken;
    } catch (error) {
      throw new Error(`Falha ao obter token JWT: ${error.message}`);
    }
  }

  /**
   * Configura cliente Axios para requisições autenticadas
   * @param {Object} config Configuração do Axios
   * @returns {Object} Cliente Axios configurado
   */
  async getAuthenticatedClient(config = {}) {
    const axiosConfig = {
      ...config,
      baseURL: this.apiUrl
    };
    
    // Configura interceptor para adicionar parâmetros de autenticação
    const client = axios.create(axiosConfig);
    
    client.interceptors.request.use((requestConfig) => {
      // URL completa da requisição
      const url = `${this.apiUrl}${requestConfig.url}`;
      
      // Adiciona headers OAuth
      const oauthHeaders = this.getOAuthHeaders(requestConfig.method.toUpperCase(), url);
      requestConfig.headers = { ...requestConfig.headers, ...oauthHeaders };
      
      // Modifica URL para incluir parâmetros de autenticação
      if (this.useHttps) {
        const baseUrl = requestConfig.url;
        const separator = baseUrl.includes('?') ? '&' : '?';
        requestConfig.url = `${baseUrl}${separator}consumer_key=${this.consumerKey}&consumer_secret=${this.consumerSecret}`;
      }
      
      return requestConfig;
    });
    
    return client;
  }

  /**
   * Valida as credenciais de autenticação
   * @returns {Promise<boolean>} Sucesso da validação
   */
  async validateCredentials() {
    try {
      const client = await this.getAuthenticatedClient();
      await client.get('');
      return true;
    } catch (error) {
      throw new Error(`Falha ao validar credenciais: ${error.message}`);
    }
  }
}

module.exports = WooCommerceAuth;