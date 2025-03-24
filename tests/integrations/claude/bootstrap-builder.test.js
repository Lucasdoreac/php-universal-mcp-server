/**
 * Testes para o módulo Bootstrap Builder de integração com Claude
 * 
 * Testes de integração para validar o funcionamento do criador de websites
 * utilizando Bootstrap em conjunto com o Claude via MCP.
 */

const path = require('path');
const { expect } = require('chai');
const sinon = require('sinon');
const { MCPResponse } = require('@modelcontextprotocol/sdk');

// Módulo a ser testado
const bootstrapBuilder = require('../../../integrations/claude/bootstrap-builder');

// Mocks para serviços dependentes
const designService = require('../../../modules/design/services/design-service');
const templateService = require('../../../modules/design/services/template-service');
const componentService = require('../../../modules/design/services/component-service');

// Gerenciadores de componentes
const navbarManager = require('../../../modules/design/components/bootstrap/navbar');
const carouselManager = require('../../../modules/design/components/bootstrap/carousel');

describe('Bootstrap Builder MCP Integration', () => {
  let sandbox;
  
  before(() => {
    // Configurar ambiente de teste
    sandbox = sinon.createSandbox();
  });
  
  afterEach(() => {
    // Restaurar stubs e spies após cada teste
    sandbox.restore();
  });
  
  describe('Builder initialization', () => {
    it('should initialize and load templates', async () => {
      // Criar stubs para métodos externos
      const templateStub = sandbox.stub(templateService, 'getTemplate').resolves({
        id: 'template-id',
        name: 'Test Template',
        content: '<html></html>'
      });
      
      // Reiniciar o builder para que ele carregue os templates mockados
      await bootstrapBuilder.builder.initializeTemplates();
      
      // Verificar se os templates foram carregados
      expect(templateStub.callCount).to.be.at.least(1);
    });
  });
  
  describe('Site creation', () => {
    it('should create a site with the selected template', async () => {
      // Stub para templateService.getTemplate
      sandbox.stub(templateService, 'getTemplate').resolves({
        id: 'bs-landing',
        name: 'Landing Page',
        content: '<html><body><div id="content"></div></body></html>'
      });
      
      // Stub para designService.createSite
      const createSiteStub = sandbox.stub(designService, 'createSite').resolves({
        id: 'site-1',
        title: 'Test Site',
        template: 'bs-landing',
        content: '<html><body><div id="content"></div></body></html>'
      });
      
      // Reinicializar o builder para que ele use os stubs mockados
      await bootstrapBuilder.builder.initializeTemplates();
      
      // Criar um site de teste
      const site = await bootstrapBuilder.builder.createSite('landing', {
        title: 'Test Site',
        description: 'A test site',
        primaryColor: '#ff0000'
      });
      
      // Verificar se o método createSite foi chamado com os parâmetros corretos
      expect(createSiteStub.calledOnce).to.be.true;
      expect(site).to.have.property('id', 'site-1');
      expect(site).to.have.property('title', 'Test Site');
    });
  });
  
  describe('Component operations', () => {
    // Configurar stubs comuns para os testes de componentes
    beforeEach(async () => {
      // Stub para templateService.getTemplate
      sandbox.stub(templateService, 'getTemplate').resolves({
        id: 'bs-landing',
        name: 'Landing Page',
        content: '<html><body><div id="content"></div></body></html>'
      });
      
      // Stub para designService.createSite
      sandbox.stub(designService, 'createSite').resolves({
        id: 'site-1',
        title: 'Test Site',
        template: 'bs-landing',
        content: '<html><body><div id="content"></div></body></html>'
      });
      
      // Reinicializar o builder e criar um site para os testes
      await bootstrapBuilder.builder.initializeTemplates();
      await bootstrapBuilder.builder.createSite('landing', { title: 'Test Site' });
    });
    
    it('should add a navbar component to the site', async () => {
      // Stub para navbarManager.create
      const createNavbarStub = sandbox.stub(navbarManager, 'create').resolves({
        id: 'component-1',
        type: 'bs-navbar',
        content: '<nav class="navbar navbar-dark bg-dark">...</nav>'
      });
      
      // Adicionar um componente navbar
      const navbar = await bootstrapBuilder.builder.addComponent('navbar', '#content', {
        variant: 'dark',
        brand: 'Test Brand'
      });
      
      // Verificar se o método create foi chamado com os parâmetros corretos
      expect(createNavbarStub.calledOnce).to.be.true;
      expect(createNavbarStub.firstCall.args[0]).to.equal('site-1');
      expect(createNavbarStub.firstCall.args[1]).to.equal('#content');
      expect(createNavbarStub.firstCall.args[2]).to.have.property('variant', 'dark');
      expect(navbar).to.have.property('id', 'component-1');
    });
    
    it('should update an existing component', async () => {
      // Stub para componentService.getComponent
      sandbox.stub(componentService, 'getComponent').resolves({
        id: 'component-1',
        type: 'bs-navbar',
        content: '<nav class="navbar navbar-dark bg-dark">...</nav>'
      });
      
      // Stub para navbarManager.update
      const updateNavbarStub = sandbox.stub(navbarManager, 'update').resolves({
        id: 'component-1',
        type: 'bs-navbar',
        content: '<nav class="navbar navbar-light bg-light">...</nav>'
      });
      
      // Atualizar um componente existente
      const updatedNavbar = await bootstrapBuilder.builder.updateComponent('component-1', {
        variant: 'light'
      });
      
      // Verificar se o método update foi chamado com os parâmetros corretos
      expect(updateNavbarStub.calledOnce).to.be.true;
      expect(updateNavbarStub.firstCall.args[0]).to.equal('site-1');
      expect(updateNavbarStub.firstCall.args[1]).to.equal('component-1');
      expect(updateNavbarStub.firstCall.args[2]).to.have.property('variant', 'light');
    });
  });
  
  describe('Preview and publish operations', () => {
    beforeEach(async () => {
      // Stub para templateService.getTemplate
      sandbox.stub(templateService, 'getTemplate').resolves({
        id: 'bs-landing',
        name: 'Landing Page',
        content: '<html><body><div id="content"></div></body></html>'
      });
      
      // Stub para designService.createSite
      sandbox.stub(designService, 'createSite').resolves({
        id: 'site-1',
        title: 'Test Site',
        template: 'bs-landing',
        content: '<html><body><div id="content"></div></body></html>'
      });
      
      // Reinicializar o builder e criar um site para os testes
      await bootstrapBuilder.builder.initializeTemplates();
      await bootstrapBuilder.builder.createSite('landing', { title: 'Test Site' });
    });
    
    it('should generate a preview of the site', async () => {
      // Stub para designService.generatePreview
      const generatePreviewStub = sandbox.stub(designService, 'generatePreview').resolves({
        html: '<html><body><div id="content"><nav>...</nav></div></body></html>'
      });
      
      // Gerar uma prévia do site
      const preview = await bootstrapBuilder.builder.generatePreview();
      
      // Verificar se o método generatePreview foi chamado com os parâmetros corretos
      expect(generatePreviewStub.calledOnce).to.be.true;
      expect(generatePreviewStub.firstCall.args[0]).to.equal('site-1');
      expect(preview).to.equal('<html><body><div id="content"><nav>...</nav></div></body></html>');
    });
    
    it('should publish the site', async () => {
      // Stub para designService.publishSite
      const publishSiteStub = sandbox.stub(designService, 'publishSite').resolves({
        url: 'https://example.com/test-site',
        publishedAt: new Date().toISOString()
      });
      
      // Publicar o site
      const published = await bootstrapBuilder.builder.publishSite({
        domain: 'example.com'
      });
      
      // Verificar se o método publishSite foi chamado com os parâmetros corretos
      expect(publishSiteStub.calledOnce).to.be.true;
      expect(publishSiteStub.firstCall.args[0]).to.equal('site-1');
      expect(publishSiteStub.firstCall.args[1]).to.have.property('domain', 'example.com');
      expect(published).to.have.property('url', 'https://example.com/test-site');
    });
  });
  
  describe('MCP command processing', () => {
    beforeEach(async () => {
      // Configurar stubs para todos os métodos que serão usados nos testes
      sandbox.stub(templateService, 'getTemplate').resolves({
        id: 'bs-landing',
        name: 'Landing Page',
        content: '<html><body><div id="content"></div></body></html>'
      });
      
      sandbox.stub(designService, 'createSite').resolves({
        id: 'site-1',
        title: 'Novo Site landing',
        template: 'bs-landing',
        content: '<html><body><div id="content"></div></body></html>'
      });
      
      sandbox.stub(designService, 'generatePreview').resolves({
        html: '<html><body><div id="content"></div></body></html>'
      });
      
      // Reinicializar o builder
      await bootstrapBuilder.builder.initializeTemplates();
    });
    
    it('should process a create site command', async () => {
      // Processar comando
      const response = await bootstrapBuilder.processCommand({
        text: 'criar site landing chamado "Meu Site de Teste"'
      });
      
      // Verificar se a resposta é do tipo MCPResponse
      expect(response).to.be.instanceOf(MCPResponse);
      expect(response.message).to.include('criado com sucesso');
      expect(response.artifacts).to.have.lengthOf(1);
      expect(response.artifacts[0].type).to.equal('text/html');
    });
    
    it('should process a preview command', async () => {
      // Primeiro criar um site para poder gerar uma prévia
      await bootstrapBuilder.processCommand({
        text: 'criar site landing'
      });
      
      // Processar comando de prévia
      const response = await bootstrapBuilder.processCommand({
        text: 'mostrar prévia do site'
      });
      
      // Verificar se a resposta é do tipo MCPResponse
      expect(response).to.be.instanceOf(MCPResponse);
      expect(response.message).to.include('Prévia do site');
      expect(response.artifacts).to.have.lengthOf(1);
      expect(response.artifacts[0].type).to.equal('text/html');
    });
  });
});