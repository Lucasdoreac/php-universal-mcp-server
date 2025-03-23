/**
 * Módulo de autenticação e segurança do PHP Universal MCP Server
 * 
 * Este módulo centraliza a autenticação e segurança para diferentes provedores,
 * fornecendo um sistema unificado de gerenciamento de credenciais e tokens.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

class AuthManager extends EventEmitter {
  /**
   * Construtor do gerenciador de autenticação
   * @param {Object} config Configuração do gerenciador
   */
  constructor(config = {}) {
    super();
    this.config = config;
    this.credentials = {};
    this.secrets = {};
    this.encryptionKey = config.encryptionKey || this.generateEncryptionKey();
    this.storageDir = config.storageDir || path.join(process.cwd(), '.credentials');
    
    // Garante que o diretório de armazenamento existe
    this.ensureStorageDir();
    
    // Carrega credenciais existentes
    this.loadCredentials();
  }

  /**
   * Garante que o diretório de armazenamento existe
   * @private
   */
  ensureStorageDir() {
    if (!fs.existsSync(this.storageDir)) {
      try {
        fs.mkdirSync(this.storageDir, { recursive: true });
      } catch (error) {
        console.error(`Erro ao criar diretório de armazenamento: ${error.message}`);
        throw error;
      }
    }
  }

  /**
   * Gera uma chave de criptografia baseada no ambiente
   * @returns {string} Chave de criptografia
   * @private
   */
  generateEncryptionKey() {
    const os = require('os');
    const envKey = process.env.MCP_ENCRYPTION_KEY;
    
    if (envKey) {
      return envKey;
    }
    
    // Gera uma chave baseada no ambiente da máquina
    const baseKey = `${os.hostname()}:${os.platform()}:${os.arch()}:${process.env.USER || process.env.USERNAME || 'user'}`;
    return crypto.createHash('sha256').update(baseKey).digest('hex');
  }

  /**
   * Carrega credenciais do armazenamento
   * @private
   */
  loadCredentials() {
    const credentialsFile = path.join(this.storageDir, 'credentials.enc');
    const secretsFile = path.join(this.storageDir, 'secrets.enc');
    
    try {
      if (fs.existsSync(credentialsFile)) {
        const data = fs.readFileSync(credentialsFile, 'utf8');
        this.credentials = this.decrypt(data);
      }
      
      if (fs.existsSync(secretsFile)) {
        const data = fs.readFileSync(secretsFile, 'utf8');
        this.secrets = this.decrypt(data);
      }
    } catch (error) {
      console.error(`Erro ao carregar credenciais: ${error.message}`);
      // Em caso de erro, inicializa com objetos vazios
      this.credentials = {};
      this.secrets = {};
    }
  }

  /**
   * Salva credenciais no armazenamento
   * @private
   */
  saveCredentials() {
    const credentialsFile = path.join(this.storageDir, 'credentials.enc');
    const secretsFile = path.join(this.storageDir, 'secrets.enc');
    
    try {
      const encryptedCredentials = this.encrypt(this.credentials);
      const encryptedSecrets = this.encrypt(this.secrets);
      
      fs.writeFileSync(credentialsFile, encryptedCredentials);
      fs.writeFileSync(secretsFile, encryptedSecrets);
    } catch (error) {
      console.error(`Erro ao salvar credenciais: ${error.message}`);
      throw error;
    }
  }

  /**
   * Criptografa dados
   * @param {Object} data Dados a serem criptografados
   * @returns {string} Dados criptografados
   * @private
   */
  encrypt(data) {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(this.encryptionKey.slice(0, 32)), iv);
      
      let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      return `${iv.toString('hex')}:${encrypted}`;
    } catch (error) {
      console.error(`Erro na criptografia: ${error.message}`);
      throw error;
    }
  }

  /**
   * Descriptografa dados
   * @param {string} data Dados a serem descriptografados
   * @returns {Object} Dados descriptografados
   * @private
   */
  decrypt(data) {
    try {
      const [ivHex, encryptedData] = data.split(':');
      const iv = Buffer.from(ivHex, 'hex');
      const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(this.encryptionKey.slice(0, 32)), iv);
      
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return JSON.parse(decrypted);
    } catch (error) {
      console.error(`Erro na descriptografia: ${error.message}`);
      throw error;
    }
  }

  /**
   * Adiciona ou atualiza credenciais de um provedor
   * @param {string} provider Nome do provedor
   * @param {Object} credentials Credenciais do provedor
   * @returns {boolean} Sucesso da operação
   */
  setCredentials(provider, credentials) {
    try {
      // Separa credenciais públicas de secretas
      const publicCreds = {};
      const secretCreds = {};
      
      for (const [key, value] of Object.entries(credentials)) {
        if (key.includes('key') || key.includes('secret') || key.includes('password') || key.includes('token')) {
          secretCreds[key] = value;
        } else {
          publicCreds[key] = value;
        }
      }
      
      this.credentials[provider] = publicCreds;
      this.secrets[provider] = secretCreds;
      
      this.saveCredentials();
      this.emit('credentials-updated', provider);
      
      return true;
    } catch (error) {
      this.emit('error', {
        message: `Falha ao salvar credenciais para ${provider}`,
        error: error.message
      });
      return false;
    }
  }

  /**
   * Obtém todas as credenciais de um provedor
   * @param {string} provider Nome do provedor
   * @returns {Object} Credenciais do provedor
   */
  getCredentials(provider) {
    const publicCreds = this.credentials[provider] || {};
    const secretCreds = this.secrets[provider] || {};
    
    return { ...publicCreds, ...secretCreds };
  }

  /**
   * Remove credenciais de um provedor
   * @param {string} provider Nome do provedor
   * @returns {boolean} Sucesso da operação
   */
  removeCredentials(provider) {
    try {
      if (this.credentials[provider]) {
        delete this.credentials[provider];
      }
      
      if (this.secrets[provider]) {
        delete this.secrets[provider];
      }
      
      this.saveCredentials();
      this.emit('credentials-removed', provider);
      
      return true;
    } catch (error) {
      this.emit('error', {
        message: `Falha ao remover credenciais para ${provider}`,
        error: error.message
      });
      return false;
    }
  }

  /**
   * Lista provedores com credenciais configuradas
   * @returns {Array} Lista de provedores
   */
  listProviders() {
    return Object.keys(this.credentials);
  }

  /**
   * Inicializa um provedor com suas credenciais
   * @param {Function} ProviderClass Classe do provedor
   * @param {string} providerName Nome do provedor
   * @returns {Object} Instância do provedor inicializada
   */
  initializeProvider(ProviderClass, providerName) {
    const credentials = this.getCredentials(providerName);
    
    if (!credentials || Object.keys(credentials).length === 0) {
      throw new Error(`Nenhuma credencial encontrada para o provedor ${providerName}`);
    }
    
    const provider = new ProviderClass(credentials);
    return provider;
  }

  /**
   * Gera uma senha segura aleatória
   * @param {number} length Comprimento da senha
   * @param {Object} options Opções de geração
   * @returns {string} Senha gerada
   */
  generateSecurePassword(length = 16, options = {}) {
    const defaults = {
      lowercase: true,
      uppercase: true,
      numbers: true,
      symbols: true
    };
    
    const config = { ...defaults, ...options };
    let chars = '';
    
    if (config.lowercase) chars += 'abcdefghijklmnopqrstuvwxyz';
    if (config.uppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (config.numbers) chars += '0123456789';
    if (config.symbols) chars += '!@#$%^&*()_+~`|}{[]\\:;?><,./-=';
    
    let password = '';
    const randomValues = crypto.randomBytes(length);
    
    for (let i = 0; i < length; i++) {
      const randomIndex = randomValues[i] % chars.length;
      password += chars.charAt(randomIndex);
    }
    
    return password;
  }
}

module.exports = AuthManager;