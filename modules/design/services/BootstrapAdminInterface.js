/**
 * Interface de administração para personalização de templates Bootstrap
 * Permite modificar temas, componentes e visualizar alterações em tempo real
 */

const path = require('path');
const fs = require('fs').promises;
const BootstrapAdapter = require('./BootstrapAdapter');
const BootstrapTemplateRenderer = require('./BootstrapTemplateRenderer');
const PreviewService = require('./PreviewService');
const ThemeManager = require('./ThemeManager');
const ComponentManager = require('./ComponentManager');

class BootstrapAdminInterface {
  /**
   * Construtor
   * @param {Object} options - Opções da interface de administração
   * @param {string} options.templateDir - Diretório de templates
   * @param {string} options.componentsDir - Diretório de componentes
   * @param {string} options.previewDir - Diretório para visualizações prévias
   * @param {Object} options.logger - Logger para registrar informações e erros
   */
  constructor(options = {}) {
    this.templateDir = options.templateDir || path.join(__dirname, '../templates/bootstrap');
    this.componentsDir = options.componentsDir || path.join(__dirname, '../components/bootstrap');
    this.previewDir = options.previewDir || path.join(__dirname, '../examples/previews');
    this.logger = options.logger || console;
    
    this.bootstrapAdapter = new BootstrapAdapter();
    this.templateRenderer = new BootstrapTemplateRenderer();
    this.previewService = new PreviewService();
    this.themeManager = new ThemeManager();
    this.componentManager = new ComponentManager();
    
    this.supportedTemplates = [];
    this.supportedComponents = [];
  }
  
  /**
   * Inicializa a interface de administração
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      await this._loadTemplates();
      await this._loadComponents();
      this.logger.info('Interface de administração Bootstrap inicializada com sucesso');
    } catch (error) {
      this.logger.error('Erro ao inicializar interface de administração Bootstrap:', error);
      throw error;
    }
  }
  
  /**
   * Carrega templates disponíveis
   * @private
   * @returns {Promise<void>}
   */
  async _loadTemplates() {
    try {
      const templateDirs = await fs.readdir(this.templateDir);
      
      this.supportedTemplates = await Promise.all(
        templateDirs
          .filter(dir => dir.startsWith('bs-') && !dir.startsWith('.'))
          .map(async (dir) => {
            const configPath = path.join(this.templateDir, dir, 'config.json');
            try {
              const configData = await fs.readFile(configPath, 'utf8');
              const config = JSON.parse(configData);
              return {
                id: dir,
                name: config.name,
                description: config.description,
                version: config.version,
                options: config.options || {},
                schema: config.schema || {}
              };
            } catch (err) {
              this.logger.warn(`Configuração inválida para template ${dir}:`, err);
              return null;
            }
          })
      );
      
      // Filtrar templates nulos (configurações inválidas)
      this.supportedTemplates = this.supportedTemplates.filter(Boolean);
      
      this.logger.info(`Carregados ${this.supportedTemplates.length} templates Bootstrap`);
    } catch (error) {
      this.logger.error('Erro ao carregar templates Bootstrap:', error);
      throw error;
    }
  }
  
  /**
   * Carrega componentes disponíveis
   * @private
   * @returns {Promise<void>}
   */
  async _loadComponents() {
    try {
      const componentTypes = await fs.readdir(this.componentsDir);
      
      const allComponents = [];
      
      for (const type of componentTypes) {
        if (type.startsWith('.')) continue;
        
        const typePath = path.join(this.componentsDir, type);
        const stat = await fs.stat(typePath);
        
        if (!stat.isDirectory()) continue;
        
        const components = await fs.readdir(typePath);
        
        for (const component of components) {
          if (component.startsWith('.')) continue;
          
          const configPath = path.join(typePath, component, 'config.json');
          try {
            const configData = await fs.readFile(configPath, 'utf8');
            const config = JSON.parse(configData);
            allComponents.push({
              id: `${type}/${component}`,
              type: type,
              name: config.name,
              description: config.description,
              version: config.version,
              options: config.options || {},
              schema: config.schema || {}
            });
          } catch (err) {
            this.logger.warn(`Configuração inválida para componente ${component}:`, err);
          }
        }
      }
      
      this.supportedComponents = allComponents;
      this.logger.info(`Carregados ${this.supportedComponents.length} componentes Bootstrap`);
    } catch (error) {
      this.logger.error('Erro ao carregar componentes Bootstrap:', error);
      throw error;
    }
  }
  
  /**
   * Obtém a lista de templates disponíveis
   * @returns {Array} Lista de templates disponíveis
   */
  getAvailableTemplates() {
    return this.supportedTemplates;
  }
  
  /**
   * Obtém a lista de componentes disponíveis
   * @param {string} [type] - Filtrar por tipo de componente (opcional)
   * @returns {Array} Lista de componentes disponíveis
   */
  getAvailableComponents(type) {
    if (type) {
      return this.supportedComponents.filter(component => component.type === type);
    }
    return this.supportedComponents;
  }
  
  /**
   * Gera uma pré-visualização de um template com as opções especificadas
   * @param {string} templateId - ID do template
   * @param {Object} options - Opções do template
   * @param {Object} data - Dados para o template
   * @returns {Promise<string>} HTML gerado para pré-visualização
   */
  async generateTemplatePreview(templateId, options = {}, data = {}) {
    try {
      const template = this.supportedTemplates.find(t => t.id === templateId);
      if (!template) {
        throw new Error(`Template não encontrado: ${templateId}`);
      }
      
      // Mesclar opções padrão com opções personalizadas
      const mergedOptions = this._mergeOptions(template.options, options);
      
      // Renderizar template
      const html = await this.templateRenderer.render(templateId, mergedOptions, data);
      
      // Salvar pré-visualização para referência
      const previewPath = path.join(this.previewDir, `${templateId}-preview.html`);
      await fs.mkdir(path.dirname(previewPath), { recursive: true });
      await fs.writeFile(previewPath, html);
      
      return html;
    } catch (error) {
      this.logger.error('Erro ao gerar pré-visualização de template:', error);
      throw error;
    }
  }
  
  /**
   * Gera uma pré-visualização de um componente com as opções especificadas
   * @param {string} componentId - ID do componente
   * @param {Object} options - Opções do componente
   * @param {Object} data - Dados para o componente
   * @returns {Promise<string>} HTML gerado para pré-visualização
   */
  async generateComponentPreview(componentId, options = {}, data = {}) {
    try {
      const component = this.supportedComponents.find(c => c.id === componentId);
      if (!component) {
        throw new Error(`Componente não encontrado: ${componentId}`);
      }
      
      // Mesclar opções padrão com opções personalizadas
      const mergedOptions = this._mergeOptions(component.options, options);
      
      // Renderizar componente usando o BootstrapRenderer
      const html = await this.componentManager.renderComponent(componentId, {
        options: mergedOptions,
        ...data
      });
      
      // Envolver em HTML básico para visualização correta
      const wrappedHtml = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Pré-visualização: ${component.name}</title>
          <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css">
        </head>
        <body>
          <div class="container py-5">
            <h1 class="mb-4">Pré-visualização: ${component.name}</h1>
            <div class="card p-3 border shadow-sm mb-4">
              ${html}
            </div>
          </div>
          <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
        </body>
        </html>
      `;
      
      // Salvar pré-visualização para referência
      const previewPath = path.join(this.previewDir, `${componentId.replace('/', '-')}-preview.html`);
      await fs.mkdir(path.dirname(previewPath), { recursive: true });
      await fs.writeFile(previewPath, wrappedHtml);
      
      return wrappedHtml;
    } catch (error) {
      this.logger.error('Erro ao gerar pré-visualização de componente:', error);
      throw error;
    }
  }
  
  /**
   * Personaliza um tema Bootstrap com base nas opções especificadas
   * @param {Object} themeOptions - Opções do tema Bootstrap
   * @returns {Promise<Object>} Tema Bootstrap personalizado
   */
  async customizeBootstrapTheme(themeOptions) {
    try {
      const customTheme = await this.bootstrapAdapter.generateCustomTheme(themeOptions);
      
      // Salvar tema personalizado
      const themePath = path.join(this.previewDir, 'custom-bootstrap-theme.scss');
      await fs.mkdir(path.dirname(themePath), { recursive: true });
      await fs.writeFile(themePath, customTheme.scss);
      
      return customTheme;
    } catch (error) {
      this.logger.error('Erro ao personalizar tema Bootstrap:', error);
      throw error;
    }
  }
  
  /**
   * Obtém a configuração de um template específico
   * @param {string} templateId - ID do template
   * @returns {Object|null} Configuração do template
   */
  getTemplateConfig(templateId) {
    const template = this.supportedTemplates.find(t => t.id === templateId);
    if (!template) return null;
    
    return {
      id: template.id,
      name: template.name,
      description: template.description,
      version: template.version,
      options: template.options,
      schema: template.schema
    };
  }
  
  /**
   * Obtém a configuração de um componente específico
   * @param {string} componentId - ID do componente
   * @returns {Object|null} Configuração do componente
   */
  getComponentConfig(componentId) {
    const component = this.supportedComponents.find(c => c.id === componentId);
    if (!component) return null;
    
    return {
      id: component.id,
      type: component.type,
      name: component.name,
      description: component.description,
      version: component.version,
      options: component.options,
      schema: component.schema
    };
  }
  
  /**
   * Mescla opções padrão com opções personalizadas
   * @private
   * @param {Object} defaultOptions - Opções padrão
   * @param {Object} customOptions - Opções personalizadas
   * @returns {Object} Opções mescladas
   */
  _mergeOptions(defaultOptions, customOptions) {
    const mergedOptions = {};
    
    // Função recursiva para mesclar opções
    const mergeRecursive = (defaults, customs, target) => {
      // Processar valores padrão
      if (defaults) {
        Object.keys(defaults).forEach(key => {
          // Se o valor padrão for um objeto e não um array
          if (defaults[key] && typeof defaults[key] === 'object' && !Array.isArray(defaults[key])) {
            // Verificar se há uma propriedade "default" para usar como valor padrão
            if ('default' in defaults[key]) {
              target[key] = defaults[key].default;
            } else {
              // Se for um objeto aninhado, mesclar recursivamente
              target[key] = {};
              mergeRecursive(defaults[key], customs && customs[key], target[key]);
            }
          } else {
            // Usar valor padrão para tipos simples ou arrays
            target[key] = defaults[key];
          }
        });
      }
      
      // Sobrescrever com valores personalizados
      if (customs) {
        Object.keys(customs).forEach(key => {
          if (customs[key] !== undefined) {
            if (customs[key] && typeof customs[key] === 'object' && !Array.isArray(customs[key]) &&
                target[key] && typeof target[key] === 'object' && !Array.isArray(target[key])) {
              // Mesclar objetos aninhados
              mergeRecursive(null, customs[key], target[key]);
            } else {
              // Sobrescrever direto
              target[key] = customs[key];
            }
          }
        });
      }
    };
    
    mergeRecursive(defaultOptions, customOptions, mergedOptions);
    return mergedOptions;
  }
}

module.exports = BootstrapAdminInterface;