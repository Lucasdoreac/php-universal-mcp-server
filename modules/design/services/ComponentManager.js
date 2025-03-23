/**
 * ComponentManager - Serviço para gerenciar componentes reutilizáveis
 * 
 * Este serviço gerencia o carregamento, configuração e renderização de componentes
 * para o Site Design System.
 */

const path = require('path');
const fs = require('fs').promises;

class ComponentManager {
  /**
   * Cria uma nova instância do gerenciador de componentes
   * 
   * @param {Object} options Opções de configuração
   * @param {String} options.componentsDir Diretório base de componentes
   * @param {Object} options.templateRenderer Renderizador de templates
   * @param {Object} options.cache Sistema de cache (opcional)
   */
  constructor(options = {}) {
    this.options = Object.assign({
      componentsDir: path.resolve(__dirname, '../components'),
      templateRenderer: null,
      cache: null
    }, options);

    this.components = {};
    this.configs = {};
  }

  /**
   * Carrega a configuração de um componente
   * 
   * @param {String} componentId ID do componente
   * @param {String} category Categoria do componente
   * @returns {Promise<Object>} Configuração do componente
   */
  async loadComponentConfig(componentId, category) {
    const cacheKey = `config:${category}:${componentId}`;
    
    // Verificar cache
    if (this.options.cache && await this.options.cache.has(cacheKey)) {
      return await this.options.cache.get(cacheKey);
    }
    
    // Caminho do arquivo de configuração
    const configPath = path.join(
      this.options.componentsDir,
      category,
      componentId,
      'config.json'
    );
    
    try {
      const configData = await fs.readFile(configPath, 'utf-8');
      const config = JSON.parse(configData);
      
      // Armazenar em cache
      if (this.options.cache) {
        await this.options.cache.set(cacheKey, config);
      }
      
      // Armazenar na memória
      this.configs[cacheKey] = config;
      
      return config;
    } catch (error) {
      throw new Error(`Falha ao carregar configuração do componente ${componentId}: ${error.message}`);
    }
  }

  /**
   * Carrega os estilos CSS de um componente
   * 
   * @param {String} componentId ID do componente
   * @param {String} category Categoria do componente
   * @returns {Promise<String>} Estilos CSS do componente
   */
  async loadComponentStyles(componentId, category) {
    const cacheKey = `styles:${category}:${componentId}`;
    
    // Verificar cache
    if (this.options.cache && await this.options.cache.has(cacheKey)) {
      return await this.options.cache.get(cacheKey);
    }
    
    // Caminho do arquivo CSS
    const stylePath = path.join(
      this.options.componentsDir,
      category,
      componentId,
      'style.css'
    );
    
    try {
      const styles = await fs.readFile(stylePath, 'utf-8');
      
      // Armazenar em cache
      if (this.options.cache) {
        await this.options.cache.set(cacheKey, styles);
      }
      
      return styles;
    } catch (error) {
      // Styles podem ser opcionais
      return '';
    }
  }

  /**
   * Carrega o script JS de um componente
   * 
   * @param {String} componentId ID do componente
   * @param {String} category Categoria do componente
   * @returns {Promise<String>} Script JS do componente
   */
  async loadComponentScript(componentId, category) {
    const cacheKey = `script:${category}:${componentId}`;
    
    // Verificar cache
    if (this.options.cache && await this.options.cache.has(cacheKey)) {
      return await this.options.cache.get(cacheKey);
    }
    
    // Caminho do arquivo JS
    const scriptPath = path.join(
      this.options.componentsDir,
      category,
      componentId,
      'script.js'
    );
    
    try {
      const script = await fs.readFile(scriptPath, 'utf-8');
      
      // Armazenar em cache
      if (this.options.cache) {
        await this.options.cache.set(cacheKey, script);
      }
      
      return script;
    } catch (error) {
      // Scripts podem ser opcionais
      return '';
    }
  }

  /**
   * Obtém uma lista de todas as categorias de componentes
   * 
   * @returns {Promise<Array>} Lista de categorias
   */
  async getCategories() {
    try {
      const entries = await fs.readdir(this.options.componentsDir, { withFileTypes: true });
      return entries
        .filter(entry => entry.isDirectory())
        .map(entry => entry.name);
    } catch (error) {
      throw new Error(`Falha ao obter categorias de componentes: ${error.message}`);
    }
  }

  /**
   * Obtém uma lista de componentes de uma categoria
   * 
   * @param {String} category Categoria de componentes
   * @returns {Promise<Array>} Lista de componentes
   */
  async getComponentsByCategory(category) {
    try {
      const categoryPath = path.join(this.options.componentsDir, category);
      const entries = await fs.readdir(categoryPath, { withFileTypes: true });
      
      const components = [];
      
      for (const entry of entries.filter(e => e.isDirectory())) {
        try {
          const componentId = entry.name;
          const config = await this.loadComponentConfig(componentId, category);
          
          components.push({
            id: componentId,
            category,
            name: config.name || componentId,
            description: config.description || '',
            version: config.version || '1.0.0'
          });
        } catch (error) {
          // Ignorar componentes sem configuração válida
          console.warn(`Componente inválido em ${category}/${entry.name}: ${error.message}`);
        }
      }
      
      return components;
    } catch (error) {
      throw new Error(`Falha ao obter componentes da categoria ${category}: ${error.message}`);
    }
  }

  /**
   * Obtém todos os componentes disponíveis
   * 
   * @returns {Promise<Object>} Componentes agrupados por categoria
   */
  async getAllComponents() {
    const categories = await this.getCategories();
    const result = {};
    
    for (const category of categories) {
      result[category] = await this.getComponentsByCategory(category);
    }
    
    return result;
  }

  /**
   * Obtém as opções de personalização de um componente
   * 
   * @param {String} componentId ID do componente
   * @param {String} category Categoria do componente
   * @returns {Promise<Array>} Opções de personalização
   */
  async getComponentOptions(componentId, category) {
    const config = await this.loadComponentConfig(componentId, category);
    return config.options || [];
  }

  /**
   * Renderiza um componente com dados e opções personalizadas
   * 
   * @param {String} componentId ID do componente
   * @param {String} category Categoria do componente
   * @param {Object} data Dados para renderização
   * @param {Object} customOptions Opções personalizadas
   * @returns {Promise<Object>} Componente renderizado (HTML, CSS, JS)
   */
  async renderComponent(componentId, category, data = {}, customOptions = {}) {
    if (!this.options.templateRenderer) {
      throw new Error('TemplateRenderer não está disponível');
    }
    
    // Carregar configuração do componente
    const config = await this.loadComponentConfig(componentId, category);
    
    // Mesclar opções padrão com opções personalizadas
    const options = {};
    
    if (config.options) {
      // Definir valores padrão
      config.options.forEach(option => {
        options[option.id] = option.default;
      });
    }
    
    // Aplicar opções personalizadas
    Object.assign(options, customOptions);
    
    // Preparar dados para renderização
    const renderData = {
      ...data,
      options
    };
    
    // Renderizar HTML do componente
    const html = await this.options.templateRenderer.renderComponent(componentId, category, renderData);
    
    // Carregar CSS e JS
    const css = await this.loadComponentStyles(componentId, category);
    const js = await this.loadComponentScript(componentId, category);
    
    return {
      html,
      css,
      js,
      config
    };
  }

  /**
   * Cria um pacote com múltiplos componentes para um site
   * 
   * @param {String} siteId ID do site
   * @param {Array} components Lista de componentes a incluir
   * @param {Object} themeSettings Configurações de tema
   * @returns {Promise<Object>} Pacote de componentes (CSS e JS combinados)
   */
  async createComponentBundle(siteId, components, themeSettings = {}) {
    const cssChunks = [];
    const jsChunks = [];
    
    // Para cada componente no pacote
    for (const comp of components) {
      const [category, id] = comp.id.split('/');
      const options = comp.options || {};
      
      try {
        // Carregar recursos do componente (sem renderizar HTML)
        const css = await this.loadComponentStyles(id, category);
        const js = await this.loadComponentScript(id, category);
        
        if (css) cssChunks.push(`/* ${category}/${id} */\n${css}`);
        if (js) jsChunks.push(`/* ${category}/${id} */\n${js}`);
      } catch (error) {
        console.error(`Erro ao carregar componente ${category}/${id}: ${error.message}`);
      }
    }
    
    // Gerar CSS do tema, se disponível
    if (themeSettings && Object.keys(themeSettings).length > 0 && this.options.templateRenderer) {
      const themeCSS = this.options.templateRenderer.generateThemeCSS(themeSettings);
      cssChunks.unshift(`/* Theme Variables */\n${themeCSS}`);
    }
    
    return {
      css: cssChunks.join('\n\n'),
      js: jsChunks.join('\n\n')
    };
  }
}

module.exports = ComponentManager;