/**
 * Template Editor Module
 * 
 * Editor visual de templates para PHP Universal MCP Server
 * Versão 1.7.2
 */

const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');

class TemplateEditor {
  constructor(options = {}) {
    this.options = {
      components: ['header', 'footer', 'products', 'gallery'],
      responsive: {
        sm: 576,
        md: 768,
        lg: 992,
        xl: 1200,
        xxl: 1400
      },
      ...options
    };
    
    this.cache = options.cache || {
      get: () => null,
      set: () => {}
    };
    
    this.templates = {};
    this.loadTemplates();
  }
  
  /**
   * Carrega os templates disponíveis do sistema
   */
  loadTemplates() {
    const templatesDir = path.join(__dirname, 'templates');
    
    try {
      if (fs.existsSync(templatesDir)) {
        const templates = fs.readdirSync(templatesDir);
        
        templates.forEach(template => {
          const templatePath = path.join(templatesDir, template);
          
          if (fs.statSync(templatePath).isDirectory()) {
            this.templates[template] = {
              name: template,
              path: templatePath,
              components: []
            };
            
            // Carregar componentes
            const componentsDir = path.join(templatePath, 'components');
            if (fs.existsSync(componentsDir)) {
              const components = fs.readdirSync(componentsDir);
              
              components.forEach(component => {
                if (component.endsWith('.html') || component.endsWith('.hbs')) {
                  const componentName = path.basename(component, path.extname(component));
                  this.templates[template].components.push(componentName);
                }
              });
            }
          }
        });
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  }
  
  /**
   * Retorna a lista de templates disponíveis
   */
  getTemplates() {
    return Object.values(this.templates);
  }
  
  /**
   * Retorna a lista de componentes para um template específico
   */
  getTemplateComponents(templateId) {
    return this.templates[templateId]?.components || [];
  }
  
  /**
   * Retorna um componente específico de um template
   */
  getComponent(templateId, componentName) {
    if (!this.templates[templateId]) {
      throw new Error(`Template '${templateId}' not found`);
    }
    
    const componentPath = path.join(this.templates[templateId].path, 'components', `${componentName}.html`);
    
    if (!fs.existsSync(componentPath)) {
      throw new Error(`Component '${componentName}' not found in template '${templateId}'`);
    }
    
    return fs.readFileSync(componentPath, 'utf8');
  }
  
  /**
   * Abre o editor para um site específico
   */
  async openEditor(siteId) {
    // Verificar cache primeiro
    const cacheKey = `editor:${siteId}`;
    const cachedEditor = this.cache.get(cacheKey, 'templates');
    
    if (cachedEditor) {
      return cachedEditor;
    }
    
    // Buscar informações do site
    // Nota: Esta é uma implementação simplificada e deve ser adaptada para buscar dados reais do site
    const siteInfo = {
      id: siteId,
      name: `Site ${siteId}`,
      template: 'bs-shop',
      components: {
        header: { content: '<h1>Header do Site</h1>' },
        footer: { content: '<footer>Footer do Site</footer>' },
        products: { content: '<div class="products">Produtos</div>' }
      }
    };
    
    // Construir interface do editor
    const editorInterface = this.buildEditorInterface(siteInfo);
    
    // Armazenar em cache
    this.cache.set(cacheKey, editorInterface, 300, 'templates');
    
    return editorInterface;
  }
  
  /**
   * Constrói a interface do editor para um site
   */
  buildEditorInterface(siteInfo) {
    // Template do editor
    const editorTemplate = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Editor de Templates - ${siteInfo.name}</title>
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
      <style>
        .editor-sidebar { width: 280px; }
        .editor-main { flex: 1; }
        .component-item { cursor: pointer; margin-bottom: 10px; }
        .device-preview { border: 1px solid #ddd; margin: 0 auto; }
        .device-preview.mobile { width: 375px; }
        .device-preview.tablet { width: 768px; }
        .device-preview.desktop { width: 100%; }
        .editor-toolbar { padding: 8px; background: #f8f9fa; }
      </style>
    </head>
    <body>
      <div class="container-fluid p-0">
        <div class="editor-toolbar d-flex justify-content-between align-items-center border-bottom">
          <div class="d-flex">
            <button class="btn btn-sm btn-outline-primary me-2">Salvar</button>
            <button class="btn btn-sm btn-outline-secondary me-2">Publicar</button>
          </div>
          
          <div class="site-info">
            <span class="badge bg-primary">${siteInfo.template}</span>
            <span class="text-muted ms-2">${siteInfo.name}</span>
          </div>
          
          <div class="device-switcher">
            <button class="btn btn-sm btn-outline-secondary me-1" data-device="mobile">Mobile</button>
            <button class="btn btn-sm btn-outline-secondary me-1" data-device="tablet">Tablet</button>
            <button class="btn btn-sm btn-outline-secondary" data-device="desktop">Desktop</button>
          </div>
        </div>
        
        <div class="d-flex">
          <div class="editor-sidebar border-end p-3">
            <h5>Componentes</h5>
            <div class="components-list">
              ${this.templates[siteInfo.template]?.components.map(component => `
                <div class="component-item card p-2" data-component="${component}">
                  <div class="d-flex justify-content-between">
                    <span>${component}</span>
                    <div>
                      <button class="btn btn-sm btn-outline-primary">Editar</button>
                    </div>
                  </div>
                </div>
              `).join('') || 'Nenhum componente disponível'}
            </div>
            
            <hr>
            
            <h5>Propriedades</h5>
            <div class="properties-panel">
              <div class="mb-3">
                <label class="form-label">Cores</label>
                <select class="form-select form-select-sm">
                  <option>Padrão</option>
                  <option>Claro</option>
                  <option>Escuro</option>
                </select>
              </div>
              
              <div class="mb-3">
                <label class="form-label">Fonte</label>
                <select class="form-select form-select-sm">
                  <option>Padrão</option>
                  <option>Sans Serif</option>
                  <option>Serif</option>
                </select>
              </div>
              
              <div class="mb-3">
                <label class="form-label">Espaçamento</label>
                <div class="input-group">
                  <input type="number" class="form-control form-control-sm" value="16">
                  <span class="input-group-text">px</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="editor-main p-3">
            <div class="device-preview desktop">
              <div class="preview-content">
                ${Object.entries(siteInfo.components).map(([name, component]) => `
                  <div class="preview-component" data-component="${name}">
                    ${component.content}
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
      <script>
        // Código JavaScript para o funcionamento do editor
        document.addEventListener('DOMContentLoaded', function() {
          // Switch de dispositivos
          const deviceButtons = document.querySelectorAll('[data-device]');
          const previewContainer = document.querySelector('.device-preview');
          
          deviceButtons.forEach(button => {
            button.addEventListener('click', function() {
              const device = this.getAttribute('data-device');
              previewContainer.className = 'device-preview ' + device;
              
              deviceButtons.forEach(btn => btn.classList.remove('active'));
              this.classList.add('active');
            });
          });
          
          // Edição de componentes (simulado)
          const componentItems = document.querySelectorAll('.component-item');
          
          componentItems.forEach(item => {
            const editButton = item.querySelector('button');
            editButton.addEventListener('click', function() {
              const component = item.getAttribute('data-component');
              alert('Editando componente: ' + component);
            });
          });
        });
      </script>
    </body>
    </html>
    `;
    
    return {
      success: true,
      data: {
        html: editorTemplate,
        siteInfo: siteInfo,
        template: siteInfo.template,
        components: Object.keys(siteInfo.components)
      }
    };
  }
  
  /**
   * Atualiza um componente para um site
   */
  async updateComponent(siteId, component, content) {
    // Implemente a lógica para atualizar o componente
    // Esta é uma implementação fictícia
    return {
      success: true,
      data: {
        siteId,
        component,
        updated: true,
        timestamp: new Date().toISOString()
      }
    };
  }
  
  /**
   * Registra métodos de API para o módulo
   */
  registerApiMethods(server) {
    server.registerMethod('design.editor.open', async (params) => {
      const { siteId } = params;
      return await this.openEditor(siteId);
    });
    
    server.registerMethod('design.editor.templates', async () => {
      return {
        success: true,
        data: {
          templates: this.getTemplates()
        }
      };
    });
    
    server.registerMethod('design.editor.components', async (params) => {
      const { templateId } = params;
      return {
        success: true,
        data: {
          components: this.getTemplateComponents(templateId)
        }
      };
    });
    
    server.registerMethod('design.editor.getComponent', async (params) => {
      const { templateId, componentName } = params;
      
      try {
        const component = this.getComponent(templateId, componentName);
        
        return {
          success: true,
          data: {
            component,
            templateId,
            componentName
          }
        };
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      }
    });
    
    server.registerMethod('design.editor.updateComponent', async (params) => {
      const { siteId, component, content } = params;
      return await this.updateComponent(siteId, component, content);
    });
    
    server.registerMethod('design.editor.preview', async (params) => {
      const { siteId, device } = params;
      
      // Implementação fictícia
      return {
        success: true,
        data: {
          siteId,
          device: device || 'desktop',
          previewUrl: `https://preview.example.com/${siteId}?device=${device || 'desktop'}`
        }
      };
    });
  }
}

module.exports = { TemplateEditor };
