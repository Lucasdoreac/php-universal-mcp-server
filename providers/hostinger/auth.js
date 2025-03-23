/**
 * Módulo de autenticação para o provedor Hostinger
 */

const crypto = require('crypto');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

class HostingerAuth {
  /**
   * Construtor da classe de autenticação
   * @param {Object} config Configuração de autenticação
   * @param {string} config.clientId ID do cliente (opcional)
   * @param {string} config.clientSecret Secret do cliente (opcional)
   * @param {string} config.apiKey Chave API direta (opcional)
   * @param {string} config.tokenStoragePath Caminho para armazenar tokens (opcional)
   */
  constructor(config) {
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.apiKey = config.apiKey;
    this.tokenStoragePath = config.tokenStoragePath || path.join(process.cwd(), '.hostinger_tokens');
    this.tokens = {};
    this.loadTokens();
  }

  /**
   * Carrega tokens armazenados
   * @private
   */
  loadTokens() {
    try {
      if (fs.existsSync(this.tokenStoragePath)) {
        const data = fs.readFileSync(this.tokenStoragePath, 'utf8');
        this.tokens = JSON.parse(this.decrypt(data));
      }
    } catch (error) {
      console.error('Erro ao carregar tokens:', error.message);
      this.tokens = {};
    }
  }

  /**
   * Salva tokens para uso futuro
   * @private
   */
  saveTokens() {
    try {
      const encrypted = this.encrypt(JSON.stringify(this.tokens));
      fs.writeFileSync(this.tokenStoragePath, encrypted);
    } catch (error) {
      console.error('Erro ao salvar tokens:', error.message);
    }
  }

  /**
   * Criptografa dados sensíveis
   * @param {string} data Dados a serem criptografados
   * @returns {string} Dados criptografados
   * @private
   */
  encrypt(data) {
    try {
      // Usa uma chave derivada do ambiente para criptografia
      const machineKey = this.getMachineKey();
      const cipher = crypto.createCipher('aes-256-cbc', machineKey);
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      return encrypted;
    } catch (error) {
      console.error('Erro na criptografia:', error.message);
      return data; // Fallback para não criptografado em caso de erro
    }
  }

  /**
   * Descriptografa dados sensíveis
   * @param {string} data Dados a serem descriptografados
   * @returns {string} Dados descriptografados
   * @private
   */
  decrypt(data) {
    try {
      const machineKey = this.getMachineKey();
      const decipher = crypto.createDecipher('aes-256-cbc', machineKey);
      let decrypted = decipher.update(data, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      console.error('Erro na descriptografia:', error.message);
      return data; // Retorna dados originais em caso de erro
    }
  }

  /**
   * Gera uma chave baseada no ambiente da máquina
   * @returns {string} Chave derivada do ambiente
   * @private
   */
  getMachineKey() {
    // Em produção, usar algo mais seguro e específico da máquina
    // Esta é uma implementação simplificada para desenvolvimento
    const os = require('os');
    const baseKey = `${os.hostname()}:${os.platform()}:${os.arch()}:${process.env.USER || process.env.USERNAME || 'user'}`;
    return crypto.createHash('sha256').update(baseKey).digest('hex');
  }

  /**
   * Obtém token de autenticação
   * @returns {Promise<string>} Token de autenticação
   */
  async getAuthToken() {
    // Se já temos uma API Key, usamos diretamente
    if (this.apiKey) {
      return this.apiKey;
    }

    // Verificamos se temos um token válido
    if (this.tokens.accessToken && this.tokens.expiresAt > Date.now()) {
      return this.tokens.accessToken;
    }

    // Precisamos renovar ou obter um novo token
    try {
      // Se temos um refresh token, tentamos renovar
      if (this.tokens.refreshToken) {
        return await this.refreshToken();
      }

      // Caso contrário, obtemos um novo token
      return await this.authenticate();
    } catch (error) {
      throw new Error(`Falha na autenticação: ${error.message}`);
    }
  }

  /**
   * Autentica com as credenciais fornecidas
   * @returns {Promise<string>} Novo token de acesso
   * @private
   */
  async authenticate() {
    if (!this.clientId || !this.clientSecret) {
      throw new Error('Client ID e Client Secret são necessários para autenticação');
    }

    try {
      const response = await axios.post('https://api.hostinger.com/v1/auth/token', {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'client_credentials'
      });

      this.tokens = {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresAt: Date.now() + (response.data.expires_in * 1000),
        tokenType: response.data.token_type
      };

      this.saveTokens();
      return this.tokens.accessToken;
    } catch (error) {
      throw new Error(`Erro na autenticação: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Renova o token usando o refresh token
   * @returns {Promise<string>} Novo token de acesso
   * @private
   */
  async refreshToken() {
    try {
      const response = await axios.post('https://api.hostinger.com/v1/auth/token', {
        refresh_token: this.tokens.refreshToken,
        grant_type: 'refresh_token'
      });

      this.tokens = {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresAt: Date.now() + (response.data.expires_in * 1000),
        tokenType: response.data.token_type
      };

      this.saveTokens();
      return this.tokens.accessToken;
    } catch (error) {
      // Se falhar a renovação, tenta autenticar novamente
      return await this.authenticate();
    }
  }

  /**
   * Revoga o token atual
   * @returns {Promise<boolean>} Sucesso da revogação
   */
  async revokeToken() {
    if (!this.tokens.accessToken) {
      return true; // Não há token para revogar
    }

    try {
      await axios.post('https://api.hostinger.com/v1/auth/revoke', {
        token: this.tokens.accessToken
      });

      this.tokens = {};
      this.saveTokens();
      return true;
    } catch (error) {
      return false;
    }
  }
}

module.exports = HostingerAuth;