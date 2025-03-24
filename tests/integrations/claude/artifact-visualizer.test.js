/**
 * Testes para o módulo ArtifactVisualizer de integração com Claude
 * 
 * Testes de integração para validar o funcionamento do visualizador de
 * artifacts que melhora a apresentação dos websites e componentes no Claude.
 */

const path = require('path');
const { expect } = require('chai');
const sinon = require('sinon');
const fs = require('fs').promises;
const handlebars = require('handlebars');

// Módulo a ser testado
const artifactVisualizer = require('../../../integrations/claude/artifact-visualizer');

// Mocks e dependências
const bootstrapBuilder = require('../../../integrations/claude/bootstrap-builder').builder;

describe('ArtifactVisualizer Integration Tests', () => {
  let sandbox;
  
  before(() => {
    // Configurar ambiente de teste
    sandbox = sinon.createSandbox();
  });
  
  afterEach(() => {
    // Restaurar stubs e spies após cada teste
    sandbox.restore();
  });
  
  describe('Initialization', () => {
    it('should initialize and register Handlebars helpers', async () => {
      // Espionar o método registerHandlebarsHelpers
      const spy = sandbox.spy(artifactVisualizer, 'registerHandlebarsHelpers');
      
      // Reinicializar o visualizador
      await artifactVisualizer.initialize();
      
      // Verificar se o método foi chamado
      expect(spy.calledOnce).to.be.true;
      
      // Verificar se os helpers foram registrados
      expect(handlebars.helpers).to.have.property('prettyJson');
      expect(handlebars.helpers).to.have.property('ifCond');
    });
  });
  
  describe('Template Management', () => {
    it('should load template from filesystem or return default template', async () => {
      // Stub para fs.readFile que simula um erro para testar fallback
      sandbox.stub(fs, 'readFile').rejects(new Error('File not found'));
      
      // Tentar carregar um template inexistente
      const template = await artifactVisualizer.getTemplate('non-existent');
      
      // Verificar se um template padrão foi retornado
      expect(template).to.be.a('function');
    });
    
    it('should use cached template if available', async () => {
      // Adicionar um template ao cache
      artifactVisualizer.templateCache['test-template'] = handlebars.compile('<div>{{title}}</div>');
      
      // Stub para fs.readFile para verificar que não é chamado
      const readFileStub = sandbox.stub(fs, 'readFile');
      
      // Obter o template do cache
      const template = await artifactVisualizer.getTemplate('test-template');
      
      // Verificar se fs.readFile não foi chamado (template veio do cache)
      expect(readFileStub.called).to.be.false;
      
      // Verificar se o template funciona corretamente
      const result = template({ title: 'Test Title' });
      expect(result).to.equal('<div>Test Title</div>');
    });
  });
  
  describe('Website Visualization', () => {
    it('should generate HTML for website artifact', async () => {
      // Stub para getTemplate para evitar dependência do filesystem
      sandbox.stub(artifactVisualizer, 'getTemplate').resolves(handlebars.compile(`
        <!DOCTYPE html>
        <html>
          <head><title>{{title}}</title></head>
          <body>
            <div class="preview-container">
              {{{content}}}
            </div>
            <div class="component-list">
              {{#each components}}
                <div class="component-item">{{type}}: {{id}}</div>
              {{/each}}
            </div>
          </body>
        </html>
      `));
      
      // Site e conteúdo de teste
      const site = {
        id: 'site-1',
        title: 'Test Site',
        description: 'A test site'
      };
      
      const content = '<div class="container"><h1>Hello World</h1></div>';
      
      const components = [
        { id: 'comp-1', type: 'navbar', name: 'Top Navigation' },
        { id: 'comp-2', type: 'carousel', name: 'Hero Banner' }
      ];
      
      // Gerar visualização
      const html = await artifactVisualizer.generateWebsiteVisualization(site, content, components);
      
      // Verificar se o HTML contém os elementos esperados
      expect(html).to.include('Test Site');
      expect(html).to.include('Hello World');
      expect(html).to.include('navbar: comp-1');
      expect(html).to.include('carousel: comp-2');
    });
    
    it('should handle errors gracefully', async () => {
      // Stub para getTemplate que simula um erro
      sandbox.stub(artifactVisualizer, 'getTemplate').rejects(new Error('Template error'));
      
      try {
        // Tentar gerar visualização
        await artifactVisualizer.generateWebsiteVisualization({}, '', []);
        // Se não lançar erro, falhar o teste
        expect.fail('Should have thrown an error');
      } catch (error) {
        // Verificar se o erro foi capturado
        expect(error.message).to.equal('Template error');
      }
    });
  });
  
  describe('Component Visualization', () => {
    it('should generate HTML for component artifact', async () => {
      // Stub para getTemplate para evitar dependência do filesystem
      sandbox.stub(artifactVisualizer, 'getTemplate').resolves(handlebars.compile(`
        <!DOCTYPE html>
        <html>
          <head><title>{{title}}</title></head>
          <body>
            <div class="component-header">
              <span>{{title}}</span>
              <span>{{type}}</span>
            </div>
            <div class="component-showcase">
              {{{content}}}
            </div>
            <div class="component-properties">
              {{prettyJson properties}}
            </div>
          </body>
        </html>
      `));
      
      // Componente de teste
      const component = {
        id: 'comp-1',
        type: 'navbar',
        name: 'Top Navigation',
        content: '<nav class="navbar navbar-dark bg-dark">...</nav>',
        properties: {
          variant: 'dark',
          fixed: 'top',
          items: ['Home', 'About', 'Contact']
        }
      };
      
      // Gerar visualização
      const html = await artifactVisualizer.generateComponentVisualization(component);
      
      // Verificar se o HTML contém os elementos esperados
      expect(html).to.include('Top Navigation');
      expect(html).to.include('navbar');
      expect(html).to.include('<nav class="navbar navbar-dark bg-dark">...</nav>');
      expect(html).to.include('"variant": "dark"');
      expect(html).to.include('"items": [');
    });
    
    it('should handle missing properties gracefully', async () => {
      // Stub para getTemplate para evitar dependência do filesystem
      sandbox.stub(artifactVisualizer, 'getTemplate').resolves(handlebars.compile(`
        <div>{{title|default:'Unnamed Component'}} - {{type|default:'unknown'}}</div>
        <div>{{{content|default:'No content'}}}</div>
      `));
      
      // Componente com propriedades mínimas
      const component = {
        id: 'comp-2',
        type: 'carousel'
      };
      
      // Gerar visualização
      const html = await artifactVisualizer.generateComponentVisualization(component);
      
      // Verificar se o HTML contém os elementos padrão
      expect(html).to.include('carousel');
      expect(html).to.include('No content');
    });
  });
  
  describe('Component Extraction', () => {
    it('should extract components from HTML', () => {
      // HTML com componentes
      const html = `
        <div class="container">
          <nav data-component-id="comp-1" data-component-type="navbar">...</nav>
          <div id="main">
            <div data-component-id="comp-2" data-component-type="carousel">...</div>
            <div data-component-id="comp-3" data-component-type="form">...</div>
          </div>
        </div>
      `;
      
      // Extrair componentes
      const components = artifactVisualizer.extractComponents(html);
      
      // Verificar se os componentes foram extraídos corretamente
      expect(components).to.have.lengthOf(3);
      expect(components[0]).to.deep.equal({ id: 'comp-1', type: 'navbar' });
      expect(components[1]).to.deep.equal({ id: 'comp-2', type: 'carousel' });
      expect(components[2]).to.deep.equal({ id: 'comp-3', type: 'form' });
    });
    
    it('should return empty array if no components found', () => {
      // HTML sem componentes
      const html = '<div class="container"><p>Hello World</p></div>';
      
      // Extrair componentes
      const components = artifactVisualizer.extractComponents(html);
      
      // Verificar que o array está vazio
      expect(components).to.be.an('array').that.is.empty;
    });
  });
  
  describe('Artifact Preparation', () => {
    it('should prepare artifact object for Claude MCP', () => {
      // HTML de teste
      const html = '<html><body><h1>Test</h1></body></html>';
      
      // Preparar artifact
      const artifact = artifactVisualizer.prepareArtifact(html, 'Test Title');
      
      // Verificar estrutura do artifact
      expect(artifact).to.deep.equal({
        type: 'text/html',
        title: 'Test Title',
        content: html
      });
    });
    
    it('should use default title if not provided', () => {
      // HTML de teste
      const html = '<html><body><h1>Test</h1></body></html>';
      
      // Preparar artifact sem título
      const artifact = artifactVisualizer.prepareArtifact(html);
      
      // Verificar título padrão
      expect(artifact.title).to.equal('Website Preview');
    });
  });
  
  describe('Integration with BootstrapBuilder', () => {
    beforeEach(() => {
      // Stubs para métodos do bootstrap-builder
      sandbox.stub(bootstrapBuilder, 'generatePreview').resolves('<div class="container"><h1>Test Site</h1></div>');
      sandbox.stub(bootstrapBuilder, 'getComponents').resolves([
        { id: 'comp-1', type: 'navbar', name: 'Top Navigation' }
      ]);
      
      // Configurar site ativo no builder
      bootstrapBuilder.activeSite = {
        id: 'site-1',
        title: 'Test Site',
        description: 'A test site'
      };
    });
    
    it('should be used by BootstrapBuilder to generate artifacts', async () => {
      // Stub para métodos do visualizador
      const generateWebsiteStub = sandbox.stub(artifactVisualizer, 'generateWebsiteVisualization')
        .resolves('<html><body><h1>Test Site Preview</h1></body></html>');
      
      const prepareArtifactStub = sandbox.stub(artifactVisualizer, 'prepareArtifact')
        .returns({ type: 'text/html', title: 'Test Site', content: 'test content' });
      
      // Gerar artifact através do bootstrap-builder
      const artifact = await bootstrapBuilder.generateArtifact();
      
      // Verificar se os métodos do visualizador foram chamados corretamente
      expect(generateWebsiteStub.calledOnce).to.be.true;
      expect(prepareArtifactStub.calledOnce).to.be.true;
      
      // Verificar estrutura do artifact
      expect(artifact).to.have.property('type', 'text/html');
      expect(artifact).to.have.property('title', 'Test Site');
    });
    
    it('should be used by BootstrapBuilder to generate component artifacts', async () => {
      // Stub para componentService.getComponent
      const getComponentStub = sandbox.stub().resolves({
        id: 'comp-1',
        type: 'navbar',
        name: 'Top Navigation',
        content: '<nav class="navbar">...</nav>'
      });
      
      // Substituir temporariamente o componentService.getComponent no bootstrap-builder
      const originalComponentService = require('../../../modules/design/services/component-service');
      require('../../../modules/design/services/component-service').getComponent = getComponentStub;
      
      // Stub para métodos do visualizador
      const generateComponentStub = sandbox.stub(artifactVisualizer, 'generateComponentVisualization')
        .resolves('<html><body><div class="component">...</div></body></html>');
      
      const prepareArtifactStub = sandbox.stub(artifactVisualizer, 'prepareArtifact')
        .returns({ type: 'text/html', title: 'Component: Top Navigation', content: 'test content' });
      
      try {
        // Gerar artifact de componente através do bootstrap-builder
        const artifact = await bootstrapBuilder.generateComponentArtifact('comp-1');
        
        // Verificar se os métodos do visualizador foram chamados corretamente
        expect(generateComponentStub.calledOnce).to.be.true;
        expect(prepareArtifactStub.calledOnce).to.be.true;
        
        // Verificar estrutura do artifact
        expect(artifact).to.have.property('type', 'text/html');
        expect(artifact).to.have.property('title', 'Component: Top Navigation');
      } finally {
        // Restaurar o componentService original
        require('../../../modules/design/services/component-service') = originalComponentService;
      }
    });
  });
});