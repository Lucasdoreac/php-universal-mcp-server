/**
 * Plugin Template
 * 
 * Template básico para criação de plugins
 * @version 1.0.0
 */

class PluginTemplate {
  /**
   * Informações do plugin
   */
  static get info() {
    return {
      name: 'plugin-template',
      version: '1.0.0',
      description: 'Template básico para criação de plugins',
      author: 'PHP Universal MCP Server',
      requirements: {
        serverVersion: '>=1.8.0'
      },
      hooks: [
        'server:started',
        'error'
      ]
    };
  }

  /**
   * Construtor do plugin
   * @param {Object} server Instância do servidor MCP
   * @param {Object} options Opções do plugin
   */
  constructor(server, options = {}) {
    this.server = server;
    this.options = options;
    this.methods = {}; // Métodos que o plugin registrará na API
    this.hooks = {}; // Funções para hooks
  }

  /**
   * Inicialização do plugin
   */
  async initialize() {
    // Lógica de inicialização
    this.registerHooks();
    this.registerMethods();
    return true;
  }

  /**
   * Registra os hooks do plugin
   */
  registerHooks() {
    this.hooks['server:started'] = () => {
      console.log('Server started hook from Template Plugin');
    };
    
    this.hooks['error'] = (error) => {
      console.log('Error hook from Template Plugin:', error);
    };
    
    // Registra os hooks no sistema
    Object.entries(this.hooks).forEach(([event, handler]) => {
      this.server.on(event, handler);
    });
  }

  /**
   * Registra os métodos do plugin na API
   */
  registerMethods() {
    // Define métodos
    this.methods['plugin-template.hello'] = async (params) => {
      return { message: `Hello from Template Plugin, ${params.name || 'World'}!` };
    };
    
    // Registra métodos na API
    Object.entries(this.methods).forEach(([name, handler]) => {
      this.server.registerMethod(name, handler);
    });
  }

  /**
   * Desativação do plugin
   */
  async deactivate() {
    // Remove hooks e métodos
    Object.keys(this.hooks).forEach(event => {
      this.server.removeListener(event, this.hooks[event]);
    });
    
    // Remove métodos da API
    Object.keys(this.methods).forEach(name => {
      this.server.unregisterMethod(name);
    });
    
    // Limpa recursos
    return true;
  }
}

module.exports = PluginTemplate;