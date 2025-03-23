/**
 * BootstrapTemplateRenderer - Renderizador de templates específico para Bootstrap
 * 
 * Estende o TemplateRenderer padrão adicionando funcionalidades específicas
 * para renderização de templates Bootstrap e suporte a seus componentes.
 */

const TemplateRenderer = require('./TemplateRenderer');
const BootstrapAdapter = require('./BootstrapAdapter');

class BootstrapTemplateRenderer extends TemplateRenderer {
  /**
   * Cria uma nova instância do renderizador de templates Bootstrap
   * 
   * @param {Object} options Opções de configuração
   * @param {String} options.templatesDir Diretório base de templates
   * @param {String} options.componentsDir Diretório de componentes
   * @param {Object} options.cache Sistema de cache (opcional)
   * @param {Object} options.bootstrapAdapter Adaptador Bootstrap (opcional)
   */
  constructor(options = {}) {
    super(options);
    
    // Criar o adaptador Bootstrap se não fornecido
    this.bootstrapAdapter = options.bootstrapAdapter || new BootstrapAdapter({
      cache: options.cache,
      bootstrapVersion: options.bootstrapVersion || '5.3.0'
    });
    
    // Registrar helpers adicionais para Bootstrap
    this._initBootstrapHelpers();
  }

  /**
   * Inicializa helpers específicos para Bootstrap
   * @private
   */
  _initBootstrapHelpers() {
    const Handlebars = require('handlebars');
    
    // Helper para verificar se um valor existe em um array
    Handlebars.registerHelper('inArray', function(array, value, options) {
      if (!array) return options.inverse(this);
      return (array.indexOf(value) !== -1) ? options.fn(this) : options.inverse(this);
    });
    
    // Helper para condicional baseado em tamanho de tela Bootstrap
    Handlebars.registerHelper('ifScreenSize', function(size, operator, breakpoint, options) {
      const breakpoints = {
        xs: 0,
        sm: 576,
        md: 768,
        lg: 992,
        xl: 1200,
        xxl: 1400
      };
      
      if (!breakpoints[size] && size !== 'xs') {
        return options.inverse(this);
      }
      
      const sizeValue = breakpoints[size];
      const breakpointValue = breakpoints[breakpoint];
      
      let result = false;
      switch (operator) {
        case 'lt':
          result = sizeValue < breakpointValue;
          break;
        case 'lte':
          result = sizeValue <= breakpointValue;
          break;
        case 'gt':
          result = sizeValue > breakpointValue;
          break;
        case 'gte':
          result = sizeValue >= breakpointValue;
          break;
        case 'eq':
          result = sizeValue === breakpointValue;
          break;
        default:
          result = false;
      }
      
      return result ? options.fn(this) : options.inverse(this);
    });
    
    // Helper para gerar classes de grid Bootstrap
    Handlebars.registerHelper('bsCol', function(options) {
      const defaults = { xs: 12, sm: 6, md: 4, lg: 3, xl: 3 };
      const sizes = { ...defaults, ...options.hash };
      
      let classes = [];
      
      Object.entries(sizes).forEach(([size, cols]) => {
        if (size === 'xs') {
          classes.push(`col-${cols}`);
        } else {
          classes.push(`col-${size}-${cols}`);
        }
      });
      
      return classes.join(' ');
    });
    
    // Helper para gerar icones Bootstrap
    Handlebars.registerHelper('bsIcon', function(name, options) {
      const additionalClasses = options.hash.class || '';
      return new Handlebars.SafeString(`<i class="bi bi-${name} ${additionalClasses}"></i>`);
    });
  }

  /**
   * Renderiza um template Bootstrap com suporte a recursos especiais
   * 
   * @param {String} templateId ID do template
   * @param {Object} data Dados para o template
   * @param {Object} options Opções de renderização
   * @returns {Promise<String>} HTML renderizado
   */
  async renderTemplate(templateId, data, options = {}) {
    // Obter dados de tema para o Bootstrap
    const bootstrapTheme = data.theme || {};
    
    // Adicionar metadados do Bootstrap ao contexto de renderização
    const enhancedData = {
      ...data,
      bootstrap: {
        version: this.bootstrapAdapter.options.bootstrapVersion,
        cssLink: this.bootstrapAdapter.getBootstrapCdnLink(),
        iconsLink: this.bootstrapAdapter.getBootstrapCdnLink('bootstrap-icons'),
        scripts: this.bootstrapAdapter.getBootstrapScripts(),
        cssVariables: this.bootstrapAdapter.generateCssVariables(bootstrapTheme)
      }
    };
    
    // Carregar componentes Bootstrap necessários
    const bootstrapComponents = [];
    
    // Se há componentes listados nas opções, adicionar componentes Bootstrap correspondentes
    if (options.components && Array.isArray(options.components)) {
      // Identificar componentes não-Bootstrap (padrão) e adicionar à lista
      const standardComponents = options.components.filter(comp => !comp.startsWith('bootstrap/'));
      
      // Identificar componentes Bootstrap explícitos e mapeá-los
      const explicitBootstrapComponents = options.components
        .filter(comp => comp.startsWith('bootstrap/'))
        .map(comp => comp.replace('bootstrap/', ''));
      
      bootstrapComponents.push(...explicitBootstrapComponents);
      
      // Para cada componente padrão, tentar encontrar uma versão Bootstrap equivalente
      standardComponents.forEach(comp => {
        const [category, id] = comp.split('/');
        
        // Tenta mapear para componente Bootstrap equivalente
        const bsComponent = this.bootstrapAdapter.mapComponentToBootstrap(category, id);
        if (bsComponent) {
          bootstrapComponents.push(`bootstrap/${category}/${bsComponent}`);
        }
      });
      
      // Adicionar todos os componentes para carregamento
      await this.loadComponents([...standardComponents, ...bootstrapComponents]);
    }
    
    // Adicionar scripts de inicialização do Bootstrap
    enhancedData.bootstrap.initScript = `
      // Initialize Bootstrap functions
      document.addEventListener('DOMContentLoaded', function() {
        // Initialize all tooltips
        var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
        var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
          return new bootstrap.Tooltip(tooltipTriggerEl)
        });
        
        // Initialize all popovers
        var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'))
        var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
          return new bootstrap.Popover(popoverTriggerEl)
        });
      });
    `;
    
    // Chamar o método de renderização da classe pai
    return super.renderTemplate(templateId, enhancedData, {
      ...options,
      components: [...(options.components || []), ...bootstrapComponents]
    });
  }

  /**
   * Gera um HTML base para Bootstrap com os recursos necessários
   * 
   * @param {String} title Título da página
   * @param {Object} theme Configurações de tema
   * @param {Object} options Opções adicionais
   * @returns {String} HTML base para Bootstrap
   */
  generateBootstrapBase(title, theme, options = {}) {
    const cssVariables = this.bootstrapAdapter.generateCssVariables(theme);
    const bootstrapVersion = options.bootstrapVersion || this.bootstrapAdapter.options.bootstrapVersion;
    
    return `<!DOCTYPE html>
<html lang="${options.lang || 'pt-BR'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  
  <!-- Bootstrap CSS -->
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@${bootstrapVersion}/dist/css/bootstrap.min.css" rel="stylesheet">
  
  <!-- Bootstrap Icons -->
  <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css" rel="stylesheet">
  
  <!-- Google Fonts -->
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet">
  
  <!-- Custom CSS for theme variables -->
  <style>
    ${cssVariables}
  </style>
  ${options.headContent || ''}
</head>
<body>
  ${options.bodyContent || ''}
  
  <!-- Bootstrap JavaScript Bundle with Popper -->
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@${bootstrapVersion}/dist/js/bootstrap.bundle.min.js"></script>
  ${options.scriptContent || ''}
</body>
</html>`;
  }
}

module.exports = BootstrapTemplateRenderer;