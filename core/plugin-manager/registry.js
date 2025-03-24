/**
 * Plugin Registry
 * 
 * Gerencia o registro de plugins instalados
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');

class PluginRegistry {
  constructor(pluginsDir) {
    this.pluginsDir = pluginsDir;
    this.registryFile = path.join(pluginsDir, '.registry.json');
    this.plugins = {};
  }
  
  /**
   * Carrega o registro de plugins
   */
  async load() {
    try {
      if (fs.existsSync(this.registryFile)) {
        const data = fs.readFileSync(this.registryFile, 'utf8');
        this.plugins = JSON.parse(data);
      } else {
        // Criar arquivo de registro vazio
        this.plugins = {};
        await this.save();
      }
      return true;
    } catch (error) {
      throw new Error(`Erro ao carregar registro de plugins: ${error.message}`);
    }
  }
  
  /**
   * Salva o registro de plugins
   */
  async save() {
    try {
      // Garantir que o diretório existe
      if (!fs.existsSync(this.pluginsDir)) {
        fs.mkdirSync(this.pluginsDir, { recursive: true });
      }
      
      // Serializar e salvar
      const data = JSON.stringify(this.plugins, null, 2);
      fs.writeFileSync(this.registryFile, data, 'utf8');
      return true;
    } catch (error) {
      throw new Error(`Erro ao salvar registro de plugins: ${error.message}`);
    }
  }
  
  /**
   * Registra um novo plugin
   */
  async registerPlugin(name, info) {
    this.plugins[name] = {
      ...info,
      registeredAt: info.registeredAt || new Date().toISOString()
    };
    
    await this.save();
    return true;
  }
  
  /**
   * Atualiza informações de um plugin
   */
  async updatePlugin(name, updates) {
    if (!this.plugins[name]) {
      throw new Error(`Plugin ${name} não encontrado no registro`);
    }
    
    this.plugins[name] = {
      ...this.plugins[name],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    await this.save();
    return true;
  }
  
  /**
   * Remove um plugin do registro
   */
  async unregisterPlugin(name) {
    if (this.plugins[name]) {
      delete this.plugins[name];
      await this.save();
    }
    return true;
  }
  
  /**
   * Obtém informações de um plugin específico
   */
  getPluginInfo(name) {
    return this.plugins[name];
  }
  
  /**
   * Retorna todos os plugins registrados
   */
  getAllPlugins() {
    return this.plugins;
  }
  
  /**
   * Retorna apenas plugins ativos
   */
  getActivePlugins() {
    const activePlugins = {};
    
    Object.entries(this.plugins).forEach(([name, info]) => {
      if (info.active) {
        activePlugins[name] = info;
      }
    });
    
    return activePlugins;
  }
}

module.exports = PluginRegistry;
