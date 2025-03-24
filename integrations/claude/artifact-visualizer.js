/**
 * Artifact Visualizer - Visualização Avançada para Claude MCP
 * 
 * Este módulo é responsável por gerar visualizações HTML avançadas para serem
 * exibidas como artifacts no Claude. Implementa recursos para melhorar a
 * apresentação visual e a interatividade dos componentes Bootstrap.
 * 
 * @author Lucas Dórea
 * @version 1.0.0
 */

const fs = require('fs').promises;
const path = require('path');
const handlebars = require('handlebars');

/**
 * Classe responsável por gerar visualizações HTML para artifacts
 */
class ArtifactVisualizer {
  constructor() {
    this.templateCache = {};
    this.defaultStyles = `
      :root {
        --primary-color: #007bff;
        --secondary-color: #6c757d;
        --light-color: #f8f9fa;
        --dark-color: #343a40;
        --success-color: #28a745;
        --info-color: #17a2b8;
        --warning-color: #ffc107;
        --danger-color: #dc3545;
      }
      
      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        line-height: 1.6;
        color: #333;
        background-color: #fff;
        padding: 0;
        margin: 0;
      }
      
      .preview-wrapper {
        position: relative;
        border: 1px solid #ddd;
        border-radius: 8px;
        overflow: hidden;
      }
      
      .preview-header {
        background: linear-gradient(to right, var(--primary-color), #0056b3);
        color: white;
        padding: 10px 15px;
        font-size: 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .preview-container {
        padding: 0;
        min-height: 200px;
      }
      
      .preview-iframe {
        border: none;
        width: 100%;
        min-height: 600px;
      }
      
      .component-list {
        background-color: var(--light-color);
        padding: 15px;
        border-top: 1px solid #ddd;
      }
      
      .component-item {
        padding: 8px 12px;
        background-color: white;
        border: 1px solid #ddd;
        border-radius: 4px;
        margin-bottom: 8px;
        font-size: 14px;
        display: flex;
        justify-content: space-between;
      }
      
      .component-item .type {
        font-weight: bold;
        color: var(--primary-color);
      }
      
      .responsive-controls {
        display: flex;
        padding: 10px;
        background-color: #f1f3f5;
        border-bottom: 1px solid #ddd;
        justify-content: center;
      }
      
      .device-button {
        padding: 5px 10px;
        margin: 0 5px;
        background-color: white;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-size: 12px;
        cursor: pointer;
      }
      
      .device-button.active {
        background-color: var(--primary-color);
        color: white;
        border-color: var(--primary-color);
      }
    `;
  }

  /**
   * Inicializar o visualizador
   */
  async initialize() {
    try {
      // Registrar helpers do Handlebars
      this.registerHandlebarsHelpers();
      console.log('ArtifactVisualizer inicializado com sucesso');
    } catch (error) {
      console.error('Erro ao inicializar ArtifactVisualizer:', error);
    }
  }

  /**
   * Registrar helpers personalizados para o Handlebars
   */
  registerHandlebarsHelpers() {
    // Helper para formatação JSON legível
    handlebars.registerHelper('prettyJson', function(context) {
      return JSON.stringify(context, null, 2);
    });
    
    // Helper para gerar classes CSS condicionais
    handlebars.registerHelper('ifCond', function(v1, operator, v2, options) {
      switch (operator) {
        case '==':
          return (v1 == v2) ? options.fn(this) : options.inverse(this);
        case '===':
          return (v1 === v2) ? options.fn(this) : options.inverse(this);
        case '!=':
          return (v1 != v2) ? options.fn(this) : options.inverse(this);
        case '!==':
          return (v1 !== v2) ? options.fn(this) : options.inverse(this);
        case '<':
          return (v1 < v2) ? options.fn(this) : options.inverse(this);
        case '<=':
          return (v1 <= v2) ? options.fn(this) : options.inverse(this);
        case '>':
          return (v1 > v2) ? options.fn(this) : options.inverse(this);
        case '>=':
          return (v1 >= v2) ? options.fn(this) : options.inverse(this);
        case '&&':
          return (v1 && v2) ? options.fn(this) : options.inverse(this);
        case '||':
          return (v1 || v2) ? options.fn(this) : options.inverse(this);
        default:
          return options.inverse(this);
      }
    });
  }

  /**
   * Carregar template do sistema de arquivos ou cache
   * @param {string} templateName - Nome do template
   * @returns {Function} - Função de template compilada
   */
  async getTemplate(templateName) {
    if (this.templateCache[templateName]) {
      return this.templateCache[templateName];
    }
    
    try {
      const templateDir = path.join(__dirname, '../../templates/artifacts');
      const templatePath = path.join(templateDir, `${templateName}.hbs`);
      const template = await fs.readFile(templatePath, 'utf8');
      const compiledTemplate = handlebars.compile(template);
      
      this.templateCache[templateName] = compiledTemplate;
      return compiledTemplate;
    } catch (error) {
      console.error(`Erro ao carregar template ${templateName}:`, error);
      // Fallback para template padrão
      return this.getDefaultTemplate(templateName);
    }
  }

  /**
   * Obter um template padrão caso o solicitado não exista
   * @param {string} templateType - Tipo de template
   * @returns {Function} - Função de template compilada
   */
  getDefaultTemplate(templateType) {
    const defaultTemplates = {
      'website': handlebars.compile(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>{{title}}</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css" rel="stylesheet">
            <style>{{styles}}</style>
          </head>
          <body>
            <div class="preview-wrapper">
              <div class="preview-header">
                <div>{{title}}</div>
                <div>PHP Universal MCP Server</div>
              </div>
              <div class="responsive-controls">
                <button class="device-button active" data-width="100%">Desktop</button>
                <button class="device-button" data-width="768px">Tablet</button>
                <button class="device-button" data-width="375px">Mobile</button>
              </div>
              <div class="preview-container">
                {{{content}}}
              </div>
              <div class="component-list">
                <h5>Componentes ({{componentsCount}})</h5>
                {{#each components}}
                  <div class="component-item">
                    <span class="type">{{type}}</span>
                    <span class="id">ID: {{id}}</span>
                  </div>
                {{/each}}
              </div>
            </div>
            <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/js/bootstrap.bundle.min.js"></script>
            <script>
              // Controles responsivos
              document.querySelectorAll('.device-button').forEach(button => {
                button.addEventListener('click', function() {
                  const width = this.getAttribute('data-width');
                  document.querySelector('.preview-container').style.width = width;
                  
                  // Atualizar botão ativo
                  document.querySelectorAll('.device-button').forEach(btn => btn.classList.remove('active'));
                  this.classList.add('active');
                });
              });
            </script>
          </body>
        </html>
      `),
      
      'component': handlebars.compile(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>{{title}}</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css" rel="stylesheet">
            <style>{{styles}}</style>
          </head>
          <body>
            <div class="preview-wrapper">
              <div class="preview-header">
                <div>Componente: {{title}}</div>
                <div>Tipo: {{type}}</div>
              </div>
              <div class="preview-container p-3">
                {{{content}}}
              </div>
              <div class="p-3 bg-light">
                <h5>Propriedades</h5>
                <pre><code>{{prettyJson properties}}</code></pre>
              </div>
            </div>
            <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/js/bootstrap.bundle.min.js"></script>
          </body>
        </html>
      `)
    };
    
    return defaultTemplates[templateType] || defaultTemplates['website'];
  }

  /**
   * Gerar visualização HTML para um site
   * @param {Object} site - Dados do site
   * @param {string} content - Conteúdo HTML do site
   * @returns {string} - HTML formatado para o artifact
   */
  async generateWebsiteVisualization(site, content, components = []) {
    try {
      const template = await this.getTemplate('website');
      
      return template({
        title: site.title || 'Website Preview',
        content: content,
        styles: this.defaultStyles,
        components: components,
        componentsCount: components.length
      });
    } catch (error) {
      console.error('Erro ao gerar visualização do site:', error);
      throw error;
    }
  }

  /**
   * Gerar visualização HTML para um componente
   * @param {Object} component - Dados do componente
   * @returns {string} - HTML formatado para o artifact
   */
  async generateComponentVisualization(component) {
    try {
      const template = await this.getTemplate('component');
      
      return template({
        title: component.name || 'Component Preview',
        type: component.type || 'unknown',
        content: component.content || '',
        properties: component.properties || {},
        styles: this.defaultStyles
      });
    } catch (error) {
      console.error('Erro ao gerar visualização do componente:', error);
      throw error;
    }
  }

  /**
   * Extrair e formatar os componentes de um site
   * @param {string} html - HTML do site
   * @returns {Array} - Lista de componentes encontrados
   */
  extractComponents(html) {
    // Esta é uma versão simplificada. Uma implementação real
    // usaria um parser DOM como cheerio ou jsdom para extrair
    // componentes de forma mais precisa.
    const componentRegex = /data-component-id="([^"]+)"\s+data-component-type="([^"]+)"/g;
    const components = [];
    let match;
    
    while ((match = componentRegex.exec(html)) !== null) {
      components.push({
        id: match[1],
        type: match[2]
      });
    }
    
    return components;
  }

  /**
   * Preparar dados do artifact para o Claude MCP
   * @param {string} html - HTML formatado
   * @param {string} title - Título do artifact
   * @returns {Object} - Dados do artifact
   */
  prepareArtifact(html, title = 'Website Preview') {
    return {
      type: 'text/html',
      title: title,
      content: html
    };
  }
}

// Exportar instância única do visualizador
const visualizer = new ArtifactVisualizer();
visualizer.initialize();

module.exports = visualizer;