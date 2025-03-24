/**
 * Plugin Manager
 * 
 * Sistema de gerenciamento de plugins para PHP Universal MCP Server
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');
const PluginLoader = require('./loader');
const PluginRegistry = require('./registry');
const PluginValidator = require('./validator');

class PluginManager extends EventEmitter {
  constructor(server, options = {}) {
    super();
    this.server = server;
    this.options = {
      pluginsDir: path.join(process.cwd(), 'plugins'),
      ...options
    };
    
    this.loader = new PluginLoader(this);
    this.registry = new PluginRegistry(this.options.pluginsDir);
    this.validator = new PluginValidator();
    
    this.plugins = new Map(); // Armazena instâncias de plugins ativos
  }
  
  /**
   * Inicializa o gerenciador e carrega plugins registrados
   */
  async initialize() {
    try {
      // Garantir que diretório de plugins existe
      if (!fs.existsSync(this.options.pluginsDir)) {
        fs.mkdirSync(this.options.pluginsDir, { recursive: true });
      }
      
      // Carregar registro de plugins
      await this.registry.load();
      
      // Carregar plugins ativos
      for (const [pluginName, pluginInfo] of Object.entries(this.registry.getActivePlugins())) {
        await this.loadPlugin(pluginName);
      }
      
      this.emit('initialized');
      return true;
    } catch (error) {
      this.emit('error', {
        message: 'Falha ao inicializar gerenciador de plugins',
        error: error.message
      });
      return false;
    }
  }
  
  /**
   * Carrega um plugin específico
   */
  async loadPlugin(pluginName) {
    try {
      // Verificar se plugin existe
      const pluginPath = path.join(this.options.pluginsDir, pluginName);
      if (!fs.existsSync(pluginPath)) {
        throw new Error(`Plugin ${pluginName} não encontrado`);
      }
      
      // Verificar informações do plugin
      const pluginInfo = this.registry.getPluginInfo(pluginName);
      if (!pluginInfo) {
        throw new Error(`Plugin ${pluginName} não está registrado`);
      }
      
      // Validar plugin
      const PluginClass = this.loader.loadPluginClass(pluginName);
      const validationResult = this.validator.validate(PluginClass, pluginInfo);
      
      if (!validationResult.valid) {
        throw new Error(`Plugin ${pluginName} inválido: ${validationResult.error}`);
      }
      
      // Criar instância do plugin
      const plugin = new PluginClass(this.server, pluginInfo.options || {});
      
      // Inicializar plugin
      await plugin.initialize();
      
      // Armazenar plugin ativo
      this.plugins.set(pluginName, plugin);
      
      this.emit('plugin:loaded', { name: pluginName });
      return true;
    } catch (error) {
      this.emit('error', {
        message: `Falha ao carregar plugin ${pluginName}`,
        error: error.message
      });
      return false;
    }
  }
  
  /**
   * Instala um novo plugin
   */
  async installPlugin(source, options = {}) {
    try {
      // Validar fonte do plugin (arquivo, diretório, npm...)
      const pluginName = await this.loader.installFromSource(source);
      
      // Verificar se plugin é válido
      const PluginClass = this.loader.loadPluginClass(pluginName);
      const validationResult = this.validator.validate(PluginClass);
      
      if (!validationResult.valid) {
        // Remover plugin se inválido
        await this.loader.removePlugin(pluginName);
        throw new Error(`Plugin inválido: ${validationResult.error}`);
      }
      
      // Registrar plugin
      await this.registry.registerPlugin(pluginName, {
        active: options.autoActivate !== false,
        options: options.pluginOptions || {},
        installedAt: new Date().toISOString(),
        source: source
      });
      
      // Carregar plugin se autoActivate
      if (options.autoActivate !== false) {
        await this.loadPlugin(pluginName);
      }
      
      this.emit('plugin:installed', { name: pluginName });
      return { success: true, name: pluginName };
    } catch (error) {
      this.emit('error', {
        message: 'Falha ao instalar plugin',
        error: error.message
      });
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Instala um plugin a partir de código fonte gerado
   * Método especial para o Claude criar plugins dinamicamente
   */
  async createPlugin(pluginData) {
    try {
      const { name, files, options = {} } = pluginData;
      
      if (!name || !files || !Array.isArray(files) || files.length === 0) {
        throw new Error('Dados do plugin inválidos');
      }
      
      // Criar diretório para o plugin
      const pluginDir = path.join(this.options.pluginsDir, name);
      if (fs.existsSync(pluginDir)) {
        throw new Error(`Plugin ${name} já existe`);
      }
      
      fs.mkdirSync(pluginDir, { recursive: true });
      
      // Salvar arquivos do plugin
      for (const file of files) {
        if (!file.path || !file.content) continue;
        
        const filePath = path.join(pluginDir, file.path);
        const dirName = path.dirname(filePath);
        
        if (!fs.existsSync(dirName)) {
          fs.mkdirSync(dirName, { recursive: true });
        }
        
        fs.writeFileSync(filePath, file.content, 'utf8');
      }
      
      // Verificar se o plugin é válido e instalá-lo
      const result = await this.installPlugin(pluginDir, {
        autoActivate: options.autoActivate !== false,
        pluginOptions: options.pluginOptions || {}
      });
      
      return result;
    } catch (error) {
      this.emit('error', {
        message: 'Falha ao criar plugin',
        error: error.message
      });
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Desativa um plugin
   */
  async deactivatePlugin(pluginName) {
    try {
      if (!this.plugins.has(pluginName)) {
        throw new Error(`Plugin ${pluginName} não está ativo`);
      }
      
      const plugin = this.plugins.get(pluginName);
      await plugin.deactivate();
      
      this.plugins.delete(pluginName);
      
      // Atualizar registro
      await this.registry.updatePlugin(pluginName, { active: false });
      
      this.emit('plugin:deactivated', { name: pluginName });
      return true;
    } catch (error) {
      this.emit('error', {
        message: `Falha ao desativar plugin ${pluginName}`,
        error: error.message
      });
      return false;
    }
  }
  
  /**
   * Remove um plugin
   */
  async removePlugin(pluginName) {
    try {
      // Desativar plugin se estiver ativo
      if (this.plugins.has(pluginName)) {
        await this.deactivatePlugin(pluginName);
      }
      
      // Remover arquivos do plugin
      await this.loader.removePlugin(pluginName);
      
      // Remover do registro
      await this.registry.unregisterPlugin(pluginName);
      
      this.emit('plugin:removed', { name: pluginName });
      return true;
    } catch (error) {
      this.emit('error', {
        message: `Falha ao remover plugin ${pluginName}`,
        error: error.message
      });
      return false;
    }
  }
  
  /**
   * Lista todos os plugins
   */
  listPlugins() {
    return this.registry.getAllPlugins();
  }
  
  /**
   * Obtém detalhes de um plugin específico
   */
  getPluginInfo(pluginName) {
    return this.registry.getPluginInfo(pluginName);
  }
  
  /**
   * Registra métodos de API para o gerenciador de plugins
   */
  registerApiMethods() {
    // Método para listar plugins
    this.server.registerMethod('plugins.list', async () => {
      return {
        success: true,
        data: this.listPlugins()
      };
    });
    
    // Método para instalar plugin
    this.server.registerMethod('plugins.install', async (params) => {
      const { source, options } = params;
      return await this.installPlugin(source, options);
    });
    
    // Método para criar plugin (para uso do Claude)
    this.server.registerMethod('plugins.create', async (params) => {
      return await this.createPlugin(params);
    });
    
    // Método para remover plugin
    this.server.registerMethod('plugins.remove', async (params) => {
      const { name } = params;
      const result = await this.removePlugin(name);
      return { success: result };
    });
    
    // Método para ativar plugin
    this.server.registerMethod('plugins.activate', async (params) => {
      const { name } = params;
      await this.registry.updatePlugin(name, { active: true });
      const result = await this.loadPlugin(name);
      return { success: result };
    });
    
    // Método para desativar plugin
    this.server.registerMethod('plugins.deactivate', async (params) => {
      const { name } = params;
      const result = await this.deactivatePlugin(name);
      return { success: result };
    });
    
    // Método para obter informações do plugin
    this.server.registerMethod('plugins.info', async (params) => {
      const { name } = params;
      const info = this.getPluginInfo(name);
      return {
        success: !!info,
        data: info || { error: `Plugin ${name} não encontrado` }
      };
    });
  }
}

module.exports = PluginManager;
