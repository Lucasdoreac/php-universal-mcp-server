/**
 * TemplateRenderer - Serviço responsável por renderizar templates
 * 
 * Este serviço permite a renderização de templates HTML usando diferentes engines
 * e fornece suporte a componentes reutilizáveis e variáveis de tema.
 */

const path = require('path');
const fs = require('fs').promises;
const Handlebars = require('handlebars');

class TemplateRenderer {
  /**
   * Cria uma nova instância do renderizador de templates
   * @param {Object} options Opções de configuração
   * @param {String} options.templatesDir Diretório base de templates
   * @param {String} options.componentsDir Diretório de componentes
   * @param {Object} options.cache Sistema de cache (opcional)
   */
  constructor(options = {}) {
    this.options = Object.assign({
      templatesDir: path.resolve(__dirname, '../templates'),
      componentsDir: path.resolve(__dirname, '../components'),
      cache: null
    }, options);

    this.templates = {};
    this.partials = {};
    this.engine = 'handlebars'; // Default engine
    
    // Inicializar Handlebars com helpers
    this._initHandlebars();
  }

  /**
   * Inicializa o Handlebars com os helpers necessários
   * @private
   */
  _initHandlebars() {
    // Helper para formatação de moeda
    Handlebars.registerHelper('currency', function(value) {
      return new Intl.NumberFormat('pt-BR', { 
        style: 'currency', 
        currency: 'BRL' 
      }).format(value);
    });

    // Helper para truncar texto
    Handlebars.registerHelper('truncate', function(text, length) {
      if (!text) return '';
      if (text.length <= length) return text;
      return text.substring(0, length) + '...';
    });

    // Helper para datas
    Handlebars.registerHelper('date', function(value, format) {
      if (!value) return '';
      const date = new Date(value);
      
      // Formato simples baseado em tokens
      if (format === 'short') {
        return date.toLocaleDateString('pt-BR');
      } else if (format === 'long') {
        return date.toLocaleDateString('pt-BR', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      } else if (format === 'time') {
        return date.toLocaleTimeString('pt-BR');
      } else if (format === 'datetime') {
        return date.toLocaleString('pt-BR');
      }
      
      // Formato personalizado
      return format.replace('%Y', date.getFullYear())
        .replace('%m', String(date.getMonth() + 1).padStart(2, '0'))
        .replace('%d', String(date.getDate()).padStart(2, '0'))
        .replace('%H', String(date.getHours()).padStart(2, '0'))
        .replace('%M', String(date.getMinutes()).padStart(2, '0'))
        .replace('%S', String(date.getSeconds()).padStart(2, '0'));
    });
  }

  /**
   * Carrega um template do disco
   * @param {String} templateId ID do template
   * @param {String} templateCategory Categoria do template
   * @returns {Promise<String>} Conteúdo do template
   */
  async loadTemplate(templateId, templateCategory = 'ecommerce') {
    const cacheKey = `template:${templateCategory}:${templateId}`;
    
    // Verificar cache
    if (this.options.cache && await this.options.cache.has(cacheKey)) {
      return await this.options.cache.get(cacheKey);
    }
    
    // Caminho do template
    const templatePath = path.join(
      this.options.templatesDir,
      templateCategory,
      templateId,
      'index.html'
    );
    
    try {
      const template = await fs.readFile(templatePath, 'utf-8');
      
      // Armazenar em cache
      if (this.options.cache) {
        await this.options.cache.set(cacheKey, template);
      }
      
      // Armazenar na memória
      this.templates[cacheKey] = template;
      
      return template;
    } catch (error) {
      throw new Error(`Falha ao carregar template ${templateId}: ${error.message}`);
    }
  }

  /**
   * Carrega um componente do disco
   * @param {String} componentId ID do componente
   * @param {String} componentCategory Categoria do componente
   * @returns {Promise<String>} Conteúdo do componente
   */
  async loadComponent(componentId, componentCategory) {
    const cacheKey = `component:${componentCategory}:${componentId}`;
    
    // Verificar cache
    if (this.options.cache && await this.options.cache.has(cacheKey)) {
      return await this.options.cache.get(cacheKey);
    }
    
    // Caminho do componente
    const componentPath = path.join(
      this.options.componentsDir,
      componentCategory,
      componentId,
      'index.html'
    );
    
    try {
      const component = await fs.readFile(componentPath, 'utf-8');
      
      // Armazenar em cache
      if (this.options.cache) {
        await this.options.cache.set(cacheKey, component);
      }
      
      // Armazenar parcial no Handlebars
      const partialName = `${componentCategory}_${componentId.replace(/-/g, '_')}`;
      Handlebars.registerPartial(partialName, component);
      
      // Armazenar na memória
      this.partials[cacheKey] = component;
      
      return component;
    } catch (error) {
      throw new Error(`Falha ao carregar componente ${componentId}: ${error.message}`);
    }
  }

  /**
   * Carrega e registra múltiplos componentes
   * @param {Array} components Lista de componentes para carregar
   * @returns {Promise<void>}
   */
  async loadComponents(components) {
    const promises = components.map(comp => {
      const [category, id] = comp.split('/');
      return this.loadComponent(id, category);
    });
    
    await Promise.all(promises);
  }

  /**
   * Compila um template com seus dados
   * @param {String} templateString Conteúdo do template
   * @param {Object} data Dados para o template
   * @returns {String} HTML renderizado
   */
  compileTemplate(templateString, data) {
    try {
      const template = Handlebars.compile(templateString);
      return template(data);
    } catch (error) {
      throw new Error(`Erro ao compilar template: ${error.message}`);
    }
  }

  /**
   * Renderiza um template com dados e componentes
   * @param {String} templateId ID do template
   * @param {Object} data Dados para o template
   * @param {Object} options Opções de renderização
   * @returns {Promise<String>} HTML renderizado
   */
  async renderTemplate(templateId, data, options = {}) {
    const templateCategory = options.category || 'ecommerce';
    
    // Carregar template
    const templateString = await this.loadTemplate(templateId, templateCategory);
    
    // Carregar componentes necessários
    if (options.components && Array.isArray(options.components)) {
      await this.loadComponents(options.components);
    }
    
    // Pré-processar template para identificar componentes
    const componentMatches = templateString.match(/\{%\s*include\s*['"](\w+\/[\w-]+)['"]\s*%\}/g) || [];
    
    // Extrair IDs de componentes e carregá-los
    const componentIds = componentMatches.map(match => {
      const componentPath = match.match(/\{%\s*include\s*['"](\w+\/[\w-]+)['"]\s*%\}/)[1];
      return componentPath;
    });
    
    if (componentIds.length > 0) {
      await this.loadComponents(componentIds);
    }
    
    // Processar include tags para formato Handlebars
    let processedTemplate = templateString.replace(
      /\{%\s*include\s*['"](\w+)\/([\w-]+)['"]\s*%\}/g, 
      '{{> $1_$2}}'
    );
    
    // Processar loops
    processedTemplate = processedTemplate.replace(
      /\{%\s*for\s+(\w+)\s+in\s+(\w+(?:\.\w+)*)\s*%\}([\s\S]*?)\{%\s*endfor\s*%\}/g,
      '{{#each $2 as |$1|}}{{{this}}}{{/each}}'
    );
    
    // Processar condicionais
    processedTemplate = processedTemplate.replace(
      /\{%\s*if\s+([^%]+)\s*%\}([\s\S]*?)(?:\{%\s*else\s*%\}([\s\S]*?))?\{%\s*endif\s*%\}/g,
      '{{#if $1}}$2{{else}}$3{{/if}}'
    );
    
    // Renderizar template
    return this.compileTemplate(processedTemplate, data);
  }

  /**
   * Renderiza um componente com dados
   * @param {String} componentId ID do componente
   * @param {String} componentCategory Categoria do componente
   * @param {Object} data Dados para o componente
   * @returns {Promise<String>} HTML renderizado
   */
  async renderComponent(componentId, componentCategory, data) {
    // Carregar componente
    const componentString = await this.loadComponent(componentId, componentCategory);
    
    // Renderizar componente
    return this.compileTemplate(componentString, data);
  }

  /**
   * Gera CSS baseado em variáveis de tema
   * @param {Object} theme Configurações do tema
   * @returns {String} CSS gerado
   */
  generateThemeCSS(theme) {
    let css = ':root {\n';
    
    // Cores
    if (theme.colors) {
      Object.entries(theme.colors).forEach(([key, value]) => {
        css += `  --color-${key}: ${value};\n`;
      });
    }
    
    // Tipografia
    if (theme.typography) {
      if (theme.typography.headingFont) {
        css += `  --heading-font: ${theme.typography.headingFont};\n`;
      }
      
      if (theme.typography.bodyFont) {
        css += `  --body-font: ${theme.typography.bodyFont};\n`;
      }
      
      if (theme.typography.baseFontSize) {
        css += `  --base-font-size: ${theme.typography.baseFontSize};\n`;
      }
      
      // Tamanhos específicos
      const typographySizes = ['h1', 'h2', 'h3', 'h4', 'body', 'small'];
      typographySizes.forEach(size => {
        if (theme.typography[size]) {
          if (theme.typography[size].fontSize) {
            css += `  --font-size-${size}: ${theme.typography[size].fontSize};\n`;
          }
          
          if (theme.typography[size].fontWeight) {
            css += `  --font-weight-${size}: ${theme.typography[size].fontWeight};\n`;
          }
          
          if (theme.typography[size].lineHeight) {
            css += `  --line-height-${size}: ${theme.typography[size].lineHeight};\n`;
          }
        }
      });
    }
    
    // Espaçamento
    if (theme.spacing) {
      Object.entries(theme.spacing).forEach(([key, value]) => {
        css += `  --spacing-${key}: ${value};\n`;
      });
    }
    
    // Layout
    if (theme.layout) {
      Object.entries(theme.layout).forEach(([key, value]) => {
        css += `  --layout-${key}: ${value};\n`;
      });
    }
    
    // Bordas
    if (theme.borders) {
      Object.entries(theme.borders).forEach(([key, value]) => {
        css += `  --border-${key}: ${value};\n`;
      });
    }
    
    // Sombras
    if (theme.shadows) {
      Object.entries(theme.shadows).forEach(([key, value]) => {
        css += `  --shadow-${key}: ${value};\n`;
      });
    }
    
    // Componentes específicos
    if (theme.components) {
      Object.entries(theme.components).forEach(([component, props]) => {
        Object.entries(props).forEach(([key, value]) => {
          // Processar referências a variáveis usando $ (ex: $colors.primary)
          let processedValue = value;
          
          if (typeof value === 'string' && value.startsWith('$')) {
            const varPath = value.substring(1).split('.');
            let themeValue = theme;
            
            // Navegar pelo caminho da variável
            for (const segment of varPath) {
              themeValue = themeValue[segment];
              if (themeValue === undefined) break;
            }
            
            if (themeValue !== undefined) {
              processedValue = themeValue;
            }
          }
          
          css += `  --${component}-${key}: ${processedValue};\n`;
        });
      });
    }
    
    css += '}\n';
    return css;
  }
}

module.exports = TemplateRenderer;