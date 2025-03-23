/**
 * FTP Uploader para PHP Universal MCP Server
 * Permite o upload de sites para servidores via FTP/SFTP
 */
const ftp = require('basic-ftp');
const path = require('path');
const fs = require('fs');

class FTPUploader {
  /**
   * Inicializa o uploader FTP
   * @param {Object} config - Configurações
   */
  constructor(config = {}) {
    this.config = {
      sitesDir: config.sitesDir || path.join(process.cwd(), 'sites'),
      ...config
    };
  }

  /**
   * Faz upload de um site para um servidor FTP
   * @param {Object} options - Opções de upload
   * @returns {Promise<Object>} Resultado do upload
   */
  async uploadSite(options) {
    const { domain, ftpHost, ftpUser, ftpPassword, ftpPort = 21, ftpPath = '/', useTLS = true } = options;
    
    if (!domain) {
      return {
        success: false,
        error: 'Domínio do site não especificado',
        timestamp: new Date().toISOString()
      };
    }
    
    if (!ftpHost || !ftpUser || !ftpPassword) {
      return {
        success: false,
        error: 'Credenciais FTP incompletas (host, usuário ou senha)',
        timestamp: new Date().toISOString()
      };
    }
    
    const siteDir = path.join(this.config.sitesDir, domain);
    
    if (!fs.existsSync(siteDir)) {
      return {
        success: false,
        error: `Site '${domain}' não encontrado em ${siteDir}`,
        timestamp: new Date().toISOString()
      };
    }
    
    // Cria cliente FTP
    const client = new ftp.Client();
    client.ftp.verbose = false; // Desativa logs detalhados
    
    try {
      // Conecta ao servidor FTP
      await client.access({
        host: ftpHost,
        user: ftpUser,
        password: ftpPassword,
        port: ftpPort,
        secure: useTLS
      });
      
      // Navega para o diretório de destino
      await client.ensureDir(ftpPath);
      
      // Faz upload recursivo do diretório do site
      await client.uploadFromDir(siteDir);
      
      // Fecha a conexão
      client.close();
      
      return {
        success: true,
        domain,
        ftpHost,
        ftpPath,
        message: `Site '${domain}' foi enviado com sucesso para ${ftpHost}${ftpPath}`,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      // Garante que a conexão seja fechada
      client.close();
      
      return {
        success: false,
        error: `Erro ao fazer upload: ${error.message}`,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = FTPUploader;