/**
 * Marketplace Installer
 * 
 * Sistema para instalação, atualização e remoção de plugins do PHP Universal MCP Server
 * @module modules/marketplace/core/installer
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Classe para gerenciamento de instalação de plugins
 */
class Installer {
  /**
   * Cria uma nova instância do instalador
   * @param {Object} options - Opções de configuração
   * @param {string} options.localPluginsPath - Caminho para os plugins locais
   * @param {Object} options.validator - Instância do validador de plugins
   * @param {Object} options.logger - Logger para registrar operações
   */
  constructor(options = {}) {
    if (!options.localPluginsPath) {
      throw new Error('Caminho para plugins locais é obrigatório');
    }
    
    this.localPluginsPath = options.localPluginsPath;
    this.validator = options.validator;
    this.logger = options.logger || console;
    
    // Garantir que o diretório de plugins exista
    if (!fs.existsSync(this.localPluginsPath)) {
      fs.mkdirSync(this.localPluginsPath, { recursive: true });
    }
    
    // Registro de plugins instalados (em uma implementação real, seria persistido)
    this.installedPlugins = new Map();
    
    // Carregar plugins já instalados
    this._loadInstalledPlugins();
    
    this.logger.info('Installer inicializado');
  }
  
  /**
   * Carrega a lista de plugins instalados
   * @private
   */
  _loadInstalledPlugins() {
    try {
      const registryFile = path.join(this.localPluginsPath, 'registry.json');
      
      if (fs.existsSync(registryFile)) {
        const registryData = JSON.parse(fs.readFileSync(registryFile, 'utf8'));
        
        // Converter de objeto para Map
        Object.entries(registryData).forEach(([pluginId, pluginInfo]) => {
          this.installedPlugins.set(pluginId, pluginInfo);
        });
        
        this.logger.info(`Carregados ${this.installedPlugins.size} plugins instalados`);
      } else {
        this.logger.info('Nenhum plugin instalado encontrado');
      }
    } catch (error) {
      this.logger.error('Erro ao carregar plugins instalados:', error);
      // Iniciar com um registro vazio em caso de erro
    }
  }
  
  /**
   * Salva a lista de plugins instalados
   * @private
   */
  _saveInstalledPlugins() {
    try {
      const registryFile = path.join(this.localPluginsPath, 'registry.json');
      
      // Converter Map para objeto
      const registryData = {};
      this.installedPlugins.forEach((pluginInfo, pluginId) => {
        registryData[pluginId] = pluginInfo;
      });
      
      fs.writeFileSync(registryFile, JSON.stringify(registryData, null, 2));
      
      this.logger.info('Registro de plugins atualizado');
    } catch (error) {
      this.logger.error('Erro ao salvar registro de plugins:', error);
      throw error;
    }
  }
  
  /**
   * Obtém a lista de plugins instalados
   * @returns {Promise<Array>} Lista de plugins instalados
   */
  async getInstalledPlugins() {
    try {
      return Array.from(this.installedPlugins.values());
    } catch (error) {
      this.logger.error('Erro ao obter plugins instalados:', error);
      throw error;
    }
  }
  
  /**
   * Verifica se um plugin está instalado
   * @param {string} pluginId - ID do plugin
   * @returns {Promise<boolean>} true se o plugin estiver instalado
   */
  async isPluginInstalled(pluginId) {
    return this.installedPlugins.has(pluginId);
  }
  
  /**
   * Obtém informações de um plugin instalado
   * @param {string} pluginId - ID do plugin
   * @returns {Promise<Object|null>} Informações do plugin ou null se não estiver instalado
   */
  async getInstalledPlugin(pluginId) {
    return this.installedPlugins.get(pluginId) || null;
  }
  
  /**
   * Instala um plugin
   * @param {string} pluginId - ID do plugin
   * @param {string} [version] - Versão específica (opcional)
   * @returns {Promise<Object>} Resultado da instalação
   */
  async installPlugin(pluginId, version) {
    try {
      this.logger.info(`Iniciando instalação do plugin ${pluginId}${version ? ` versão ${version}` : ''}`);
      
      // Verificar se o plugin já está instalado
      if (await this.isPluginInstalled(pluginId)) {
        const installedVersion = this.installedPlugins.get(pluginId).version;
        
        if (!version || version === installedVersion) {
          return {
            success: false,
            error: `Plugin ${pluginId} já está instalado na versão ${installedVersion}`
          };
        }
        
        // Se for uma versão diferente, fazer atualização
        return this.updatePlugin(pluginId, version);
      }
      
      // Em uma implementação real, baixaríamos o plugin de um repositório
      // Aqui simulamos a instalação
      
      // Gerar informações do plugin
      const pluginInfo = {
        id: pluginId,
        name: `Plugin ${pluginId}`,
        version: version || '1.0.0',
        description: 'Plugin instalado via simulação',
        author: 'System',
        installPath: path.join(this.localPluginsPath, pluginId),
        installedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active',
        config: {}
      };
      
      // Criar diretório do plugin
      if (!fs.existsSync(pluginInfo.installPath)) {
        fs.mkdirSync(pluginInfo.installPath, { recursive: true });
      }
      
      // Simular criação de arquivos do plugin
      const pluginManifestPath = path.join(pluginInfo.installPath, 'plugin.json');
      fs.writeFileSync(pluginManifestPath, JSON.stringify(pluginInfo, null, 2));
      
      // Adicionar ao registro de plugins instalados
      this.installedPlugins.set(pluginId, pluginInfo);
      this._saveInstalledPlugins();
      
      this.logger.info(`Plugin ${pluginId} instalado com sucesso na versão ${pluginInfo.version}`);
      
      return {
        success: true,
        pluginInfo
      };
    } catch (error) {
      this.logger.error(`Erro ao instalar plugin ${pluginId}:`, error);
      
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Atualiza um plugin
   * @param {string} pluginId - ID do plugin
   * @param {string} [toVersion] - Versão alvo (opcional, usa a mais recente se não fornecida)
   * @returns {Promise<Object>} Resultado da atualização
   */
  async updatePlugin(pluginId, toVersion) {
    try {
      this.logger.info(`Iniciando atualização do plugin ${pluginId}${toVersion ? ` para versão ${toVersion}` : ''}`);
      
      // Verificar se o plugin está instalado
      if (!await this.isPluginInstalled(pluginId)) {
        return {
          success: false,
          error: `Plugin ${pluginId} não está instalado`
        };
      }
      
      // Obter informações do plugin instalado
      const pluginInfo = this.installedPlugins.get(pluginId);
      const currentVersion = pluginInfo.version;
      
      // Verificar se já está na versão desejada
      if (toVersion && currentVersion === toVersion) {
        return {
          success: false,
          error: `Plugin ${pluginId} já está na versão ${toVersion}`
        };
      }
      
      // Em uma implementação real, baixaríamos a nova versão do plugin e a instalaríamos
      // Aqui simulamos a atualização
      
      const targetVersion = toVersion || `${parseInt(currentVersion.split('.')[0]) + 1}.0.0`;
      
      // Atualizar informações do plugin
      pluginInfo.version = targetVersion;
      pluginInfo.updatedAt = new Date().toISOString();
      
      // Atualizar arquivo do plugin
      const pluginManifestPath = path.join(pluginInfo.installPath, 'plugin.json');
      fs.writeFileSync(pluginManifestPath, JSON.stringify(pluginInfo, null, 2));
      
      // Atualizar no registro de plugins instalados
      this.installedPlugins.set(pluginId, pluginInfo);
      this._saveInstalledPlugins();
      
      this.logger.info(`Plugin ${pluginId} atualizado com sucesso da versão ${currentVersion} para ${targetVersion}`);
      
      return {
        success: true,
        pluginId,
        previousVersion: currentVersion,
        version: targetVersion
      };
    } catch (error) {
      this.logger.error(`Erro ao atualizar plugin ${pluginId}:`, error);
      
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Desinstala um plugin
   * @param {string} pluginId - ID do plugin
   * @returns {Promise<Object>} Resultado da desinstalação
   */
  async uninstallPlugin(pluginId) {
    try {
      this.logger.info(`Iniciando desinstalação do plugin ${pluginId}`);
      
      // Verificar se o plugin está instalado
      if (!await this.isPluginInstalled(pluginId)) {
        return {
          success: false,
          error: `Plugin ${pluginId} não está instalado`
        };
      }
      
      // Obter informações do plugin
      const pluginInfo = this.installedPlugins.get(pluginId);
      
      // Em uma implementação real, faríamos uma limpeza adequada
      // Aqui simulamos a remoção
      
      // Remover diretório do plugin (recursivamente)
      if (fs.existsSync(pluginInfo.installPath)) {
        // Em um caso real, usaríamos fs.rm com { recursive: true } (Node.js 14+)
        // Por compatibilidade, vamos simplesmente simular a remoção
        // fs.rmSync(pluginInfo.installPath, { recursive: true });
        
        // Simular remoção renomeando o diretório
        const backupPath = `${pluginInfo.installPath}_uninstalled_${Date.now()}`;
        fs.renameSync(pluginInfo.installPath, backupPath);
      }
      
      // Remover do registro de plugins instalados
      this.installedPlugins.delete(pluginId);
      this._saveInstalledPlugins();
      
      this.logger.info(`Plugin ${pluginId} desinstalado com sucesso`);
      
      return {
        success: true,
        pluginId
      };
    } catch (error) {
      this.logger.error(`Erro ao desinstalar plugin ${pluginId}:`, error);
      
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Ativa um plugin
   * @param {string} pluginId - ID do plugin
   * @returns {Promise<Object>} Resultado da ativação
   */
  async activatePlugin(pluginId) {
    try {
      this.logger.info(`Ativando plugin ${pluginId}`);
      
      // Verificar se o plugin está instalado
      if (!await this.isPluginInstalled(pluginId)) {
        return {
          success: false,
          error: `Plugin ${pluginId} não está instalado`
        };
      }
      
      // Obter informações do plugin
      const pluginInfo = this.installedPlugins.get(pluginId);
      
      // Verificar se já está ativo
      if (pluginInfo.status === 'active') {
        return {
          success: false,
          error: `Plugin ${pluginId} já está ativo`
        };
      }
      
      // Atualizar status do plugin
      pluginInfo.status = 'active';
      pluginInfo.updatedAt = new Date().toISOString();
      
      // Atualizar arquivo do plugin
      const pluginManifestPath = path.join(pluginInfo.installPath, 'plugin.json');
      fs.writeFileSync(pluginManifestPath, JSON.stringify(pluginInfo, null, 2));
      
      // Atualizar no registro de plugins instalados
      this.installedPlugins.set(pluginId, pluginInfo);
      this._saveInstalledPlugins();
      
      this.logger.info(`Plugin ${pluginId} ativado com sucesso`);
      
      return {
        success: true,
        pluginId,
        status: 'active'
      };
    } catch (error) {
      this.logger.error(`Erro ao ativar plugin ${pluginId}:`, error);
      
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Desativa um plugin
   * @param {string} pluginId - ID do plugin
   * @returns {Promise<Object>} Resultado da desativação
   */
  async deactivatePlugin(pluginId) {
    try {
      this.logger.info(`Desativando plugin ${pluginId}`);
      
      // Verificar se o plugin está instalado
      if (!await this.isPluginInstalled(pluginId)) {
        return {
          success: false,
          error: `Plugin ${pluginId} não está instalado`
        };
      }
      
      // Obter informações do plugin
      const pluginInfo = this.installedPlugins.get(pluginId);
      
      // Verificar se já está inativo
      if (pluginInfo.status === 'inactive') {
        return {
          success: false,
          error: `Plugin ${pluginId} já está inativo`
        };
      }
      
      // Atualizar status do plugin
      pluginInfo.status = 'inactive';
      pluginInfo.updatedAt = new Date().toISOString();
      
      // Atualizar arquivo do plugin
      const pluginManifestPath = path.join(pluginInfo.installPath, 'plugin.json');
      fs.writeFileSync(pluginManifestPath, JSON.stringify(pluginInfo, null, 2));
      
      // Atualizar no registro de plugins instalados
      this.installedPlugins.set(pluginId, pluginInfo);
      this._saveInstalledPlugins();
      
      this.logger.info(`Plugin ${pluginId} desativado com sucesso`);
      
      return {
        success: true,
        pluginId,
        status: 'inactive'
      };
    } catch (error) {
      this.logger.error(`Erro ao desativar plugin ${pluginId}:`, error);
      
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Configura um plugin
   * @param {string} pluginId - ID do plugin
   * @param {Object} config - Configurações do plugin
   * @returns {Promise<Object>} Resultado da configuração
   */
  async configurePlugin(pluginId, config) {
    try {
      this.logger.info(`Configurando plugin ${pluginId}`);
      
      // Verificar se o plugin está instalado
      if (!await this.isPluginInstalled(pluginId)) {
        return {
          success: false,
          error: `Plugin ${pluginId} não está instalado`
        };
      }
      
      // Obter informações do plugin
      const pluginInfo = this.installedPlugins.get(pluginId);
      
      // Atualizar configurações do plugin
      pluginInfo.config = {
        ...pluginInfo.config,
        ...config
      };
      pluginInfo.updatedAt = new Date().toISOString();
      
      // Atualizar arquivo do plugin
      const pluginManifestPath = path.join(pluginInfo.installPath, 'plugin.json');
      fs.writeFileSync(pluginManifestPath, JSON.stringify(pluginInfo, null, 2));
      
      // Atualizar no registro de plugins instalados
      this.installedPlugins.set(pluginId, pluginInfo);
      this._saveInstalledPlugins();
      
      this.logger.info(`Plugin ${pluginId} configurado com sucesso`);
      
      return {
        success: true,
        pluginId,
        config: pluginInfo.config
      };
    } catch (error) {
      this.logger.error(`Erro ao configurar plugin ${pluginId}:`, error);
      
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = Installer;