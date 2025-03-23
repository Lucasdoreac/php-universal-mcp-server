/**
 * Testes unitários para componentes Bootstrap
 */

const path = require('path');
const { JSDOM } = require('jsdom');
const { expect } = require('chai');
const BootstrapAdapter = require('../services/BootstrapAdapter');
const BootstrapTemplateRenderer = require('../services/BootstrapTemplateRenderer');
const ComponentManager = require('../services/ComponentManager');

describe('Componentes Bootstrap', function() {
  let bootstrapAdapter;
  let templateRenderer;
  let componentManager;
  
  // Configuração inicial para os testes
  before(function() {
    bootstrapAdapter = new BootstrapAdapter();
    templateRenderer = new BootstrapTemplateRenderer();
    componentManager = new ComponentManager({
      componentsDir: path.join(__dirname, '../components')
    });
  });
  
  describe('BootstrapAdapter', function() {
    it('deve gerar variáveis SASS personalizadas', async function() {
      const themeOptions = {
        primary: '#ff5722',
        secondary: '#2196f3',
        bodyBg: '#f9f9f9',
        fontSize: '1rem'
      };
      
      const result = await bootstrapAdapter.generateCustomTheme(themeOptions);
      
      expect(result).to.be.an('object');
      expect(result.scss).to.be.a('string');
      expect(result.scss).to.include('$primary: #ff5722');
      expect(result.scss).to.include('$secondary: #2196f3');
      expect(result.variables).to.be.an('object');
      expect(result.variables.primary).to.equal('#ff5722');
    });
    
    it('deve validar opções de tema', function() {
      const invalidOptions = {
        primary: 'not-a-color',
        fontSize: 'too-large-font'
      };
      
      expect(() => bootstrapAdapter.validateThemeOptions(invalidOptions)).to.throw();
    });
  });
  
  describe('Componente bs-navbar', function() {
    it('deve renderizar corretamente', async function() {
      const options = {
        theme: 'light',
        fixed: true,
        logo: '/path/to/logo.png'
      };
      
      const html = await componentManager.renderComponent('bootstrap/navbar/bs-navbar', {
        options: options
      });
      
      const dom = new JSDOM(html);
      const navbar = dom.window.document.querySelector('.navbar');
      
      expect(navbar).to.not.be.null;
      expect(navbar.classList.contains('navbar-light')).to.be.true;
      expect(navbar.classList.contains('fixed-top')).to.be.true;
      
      const logo = navbar.querySelector('img');
      expect(logo).to.not.be.null;
      expect(logo.getAttribute('src')).to.equal('/path/to/logo.png');
    });
    
    it('deve permitir transparência', async function() {
      const options = {
        theme: 'dark',
        transparency: true
      };
      
      const html = await componentManager.renderComponent('bootstrap/navbar/bs-navbar', {
        options: options
      });
      
      const dom = new JSDOM(html);
      const navbar = dom.window.document.querySelector('.navbar');
      
      expect(navbar).to.not.be.null;
      expect(navbar.classList.contains('navbar-dark')).to.be.true;
      expect(navbar.classList.contains('bg-transparent')).to.be.true;
    });
  });
  
  describe('Componente bs-modal', function() {
    it('deve renderizar com título e tamanho corretos', async function() {
      const options = {
        id: 'test-modal',
        title: 'Modal de Teste',
        size: 'lg',
        centered: true
      };
      
      const html = await componentManager.renderComponent('bootstrap/modal/bs-modal', {
        options: options,
        content: '<p>Conteúdo do modal</p>'
      });
      
      const dom = new JSDOM(html);
      const modal = dom.window.document.querySelector('.modal');
      
      expect(modal).to.not.be.null;
      expect(modal.getAttribute('id')).to.equal('test-modal');
      
      const title = modal.querySelector('.modal-title');
      expect(title).to.not.be.null;
      expect(title.textContent.trim()).to.equal('Modal de Teste');
      
      const dialog = modal.querySelector('.modal-dialog');
      expect(dialog.classList.contains('modal-lg')).to.be.true;
      expect(dialog.classList.contains('modal-dialog-centered')).to.be.true;
      
      const content = modal.querySelector('.modal-body');
      expect(content.innerHTML).to.include('<p>Conteúdo do modal</p>');
    });
    
    it('deve renderizar botões personalizados', async function() {
      const options = {
        id: 'test-modal',
        buttons: [
          { text: 'Cancelar', type: 'secondary', dismiss: true },
          { text: 'Salvar', type: 'primary', id: 'save-btn' }
        ]
      };
      
      const html = await componentManager.renderComponent('bootstrap/modal/bs-modal', {
        options: options
      });
      
      const dom = new JSDOM(html);
      const footer = dom.window.document.querySelector('.modal-footer');
      const buttons = footer.querySelectorAll('button');
      
      expect(buttons.length).to.equal(2);
      
      const cancelBtn = buttons[0];
      expect(cancelBtn.textContent.trim()).to.equal('Cancelar');
      expect(cancelBtn.classList.contains('btn-secondary')).to.be.true;
      expect(cancelBtn.hasAttribute('data-bs-dismiss')).to.be.true;
      
      const saveBtn = buttons[1];
      expect(saveBtn.textContent.trim()).to.equal('Salvar');
      expect(saveBtn.classList.contains('btn-primary')).to.be.true;
      expect(saveBtn.getAttribute('id')).to.equal('save-btn');
    });
  });
  
  describe('Componente bs-carousel', function() {
    it('deve renderizar slides corretamente', async function() {
      const slides = [
        { image: '/path/to/image1.jpg', title: 'Slide 1', caption: 'Descrição 1' },
        { image: '/path/to/image2.jpg', title: 'Slide 2', caption: 'Descrição 2' }
      ];
      
      const options = {
        id: 'test-carousel',
        indicators: true,
        controls: true
      };
      
      const html = await componentManager.renderComponent('bootstrap/carousel/bs-carousel', {
        options: options,
        slides: slides
      });
      
      const dom = new JSDOM(html);
      const carousel = dom.window.document.querySelector('.carousel');
      
      expect(carousel).to.not.be.null;
      expect(carousel.getAttribute('id')).to.equal('test-carousel');
      
      const indicators = carousel.querySelectorAll('.carousel-indicators button');
      expect(indicators.length).to.equal(2);
      
      const slideItems = carousel.querySelectorAll('.carousel-item');
      expect(slideItems.length).to.equal(2);
      
      const images = carousel.querySelectorAll('.carousel-item img');
      expect(images.length).to.equal(2);
      expect(images[0].getAttribute('src')).to.equal('/path/to/image1.jpg');
      
      const captions = carousel.querySelectorAll('.carousel-caption');
      expect(captions.length).to.equal(2);
      expect(captions[0].querySelector('h5').textContent).to.equal('Slide 1');
      
      const controls = carousel.querySelectorAll('.carousel-control-prev, .carousel-control-next');
      expect(controls.length).to.equal(2);
    });
  });
  
  describe('Componente bs-accordion', function() {
    it('deve renderizar itens corretamente', async function() {
      const items = [
        { title: 'Item 1', content: 'Conteúdo 1', active: true },
        { title: 'Item 2', content: 'Conteúdo 2' }
      ];
      
      const options = {
        id: 'test-accordion',
        alwaysOpen: false
      };
      
      const html = await componentManager.renderComponent('bootstrap/accordion/bs-accordion', {
        options: options,
        items: items
      });
      
      const dom = new JSDOM(html);
      const accordion = dom.window.document.querySelector('.accordion');
      
      expect(accordion).to.not.be.null;
      expect(accordion.getAttribute('id')).to.equal('test-accordion');
      
      const accordionItems = accordion.querySelectorAll('.accordion-item');
      expect(accordionItems.length).to.equal(2);
      
      const headers = accordion.querySelectorAll('.accordion-header');
      expect(headers.length).to.equal(2);
      expect(headers[0].textContent.trim()).to.include('Item 1');
      
      const bodies = accordion.querySelectorAll('.accordion-body');
      expect(bodies.length).to.equal(2);
      expect(bodies[0].textContent.trim()).to.equal('Conteúdo 1');
      
      // Verificar se o primeiro item está expandido (active)
      const firstCollapse = accordion.querySelector('.accordion-collapse');
      expect(firstCollapse.classList.contains('show')).to.be.true;
    });
  });
  
  describe('Componente bs-gallery', function() {
    it('deve renderizar imagens e miniaturas', async function() {
      const images = [
        '/path/to/image1.jpg',
        '/path/to/image2.jpg',
        '/path/to/image3.jpg'
      ];
      
      const options = {
        id: 'test-gallery',
        showThumbnails: true,
        lightbox: true
      };
      
      const html = await componentManager.renderComponent('bootstrap/gallery/bs-gallery', {
        options: options,
        images: images
      });
      
      const dom = new JSDOM(html);
      const gallery = dom.window.document.querySelector('.bs-gallery');
      
      expect(gallery).to.not.be.null;
      
      const mainImage = gallery.querySelector('.main-image img');
      expect(mainImage).to.not.be.null;
      expect(mainImage.getAttribute('src')).to.equal('/path/to/image1.jpg');
      
      const thumbnails = gallery.querySelectorAll('.thumbnails img');
      expect(thumbnails.length).to.equal(3);
      
      const lightboxLinks = gallery.querySelectorAll('a[data-lightbox]');
      expect(lightboxLinks.length).to.be.at.least(1);
    });
  });
  
  describe('Template bs-ecommerce', function() {
    it('deve renderizar layout de loja corretamente', async function() {
      // Simulação básica de dados para um e-commerce
      const data = {
        siteInfo: {
          title: 'Minha Loja',
          logo: '/path/to/logo.png'
        },
        featuredProducts: [
          { id: '1', title: 'Produto 1', price: 99.90, image: '/path/to/product1.jpg' },
          { id: '2', title: 'Produto 2', price: 149.90, image: '/path/to/product2.jpg' }
        ],
        categories: [
          { id: '1', name: 'Categoria 1' },
          { id: '2', name: 'Categoria 2' }
        ]
      };
      
      const options = {
        layout: 'standard',
        colorScheme: 'primary',
        showFeaturedProducts: true
      };
      
      const html = await templateRenderer.render('bs-ecommerce', options, data);
      
      // Validações básicas
      expect(html).to.be.a('string');
      expect(html).to.include('<!DOCTYPE html>');
      expect(html).to.include(data.siteInfo.title);
      
      const dom = new JSDOM(html);
      const document = dom.window.document;
      
      const navbarBrand = document.querySelector('.navbar-brand');
      expect(navbarBrand).to.not.be.null;
      
      const productCards = document.querySelectorAll('.product-card');
      expect(productCards.length).to.equal(2);
      
      const categoryLinks = document.querySelectorAll('.category-link');
      expect(categoryLinks.length).to.equal(2);
    });
  });
  
  describe('Template bs-landing', function() {
    it('deve renderizar seções corretamente', async function() {
      const data = {
        siteInfo: {
          title: 'Minha Landing Page',
          description: 'Uma landing page de exemplo'
        },
        hero: {
          heading: 'Título Principal',
          subheading: 'Subtítulo da página',
          buttonText: 'Saiba Mais'
        },
        features: [
          { title: 'Recurso 1', description: 'Descrição 1', icon: 'star' },
          { title: 'Recurso 2', description: 'Descrição 2', icon: 'gear' }
        ]
      };
      
      const options = {
        layout: 'standard',
        colorScheme: 'primary',
        sections: {
          hero: true,
          features: true,
          about: false,
          testimonials: false,
          contact: true
        }
      };
      
      const html = await templateRenderer.render('bs-landing', options, data);
      
      expect(html).to.be.a('string');
      
      const dom = new JSDOM(html);
      const document = dom.window.document;
      
      const heroSection = document.querySelector('.hero-section');
      expect(heroSection).to.not.be.null;
      expect(heroSection.querySelector('h1').textContent).to.include('Título Principal');
      
      const featuresSection = document.querySelector('.py-5.py-md-7.bg-light');
      expect(featuresSection).to.not.be.null;
      
      const featureItems = document.querySelectorAll('.card-body');
      expect(featureItems.length).to.be.at.least(2);
      
      // A seção About não deve existir
      const aboutSection = document.querySelector('#about');
      expect(aboutSection).to.be.null;
      
      // A seção Contact deve existir
      const contactSection = document.querySelector('#contact, section:has(form)');
      expect(contactSection).to.not.be.null;
    });
  });
  
  describe('Template bs-portfolio', function() {
    it('deve renderizar seções de projetos', async function() {
      const data = {
        profile: {
          name: 'João Silva',
          title: 'Designer & Desenvolvedor',
          avatar: '/path/to/avatar.jpg'
        },
        hero: {
          heading: 'João Silva',
          subheading: 'Designer & Desenvolvedor'
        },
        projects: [
          { 
            title: 'Projeto 1', 
            description: 'Descrição do projeto 1', 
            category: 'web', 
            thumbnail: '/path/to/thumb1.jpg'
          },
          { 
            title: 'Projeto 2', 
            description: 'Descrição do projeto 2', 
            category: 'design', 
            thumbnail: '/path/to/thumb2.jpg'
          }
        ]
      };
      
      const options = {
        layout: 'grid',
        colorScheme: 'creative',
        sections: {
          hero: true,
          about: false,
          projects: true,
          contact: true
        },
        filterProjects: true
      };
      
      const html = await templateRenderer.render('bs-portfolio', options, data);
      
      expect(html).to.be.a('string');
      
      const dom = new JSDOM(html);
      const document = dom.window.document;
      
      const heroSection = document.querySelector('.hero-section');
      expect(heroSection).to.not.be.null;
      
      const projectsSection = document.querySelector('#projects');
      expect(projectsSection).to.not.be.null;
      
      const projectFilters = document.querySelectorAll('.project-filter-btn');
      expect(projectFilters.length).to.be.at.least(3); // "Todos" + 2 categorias
      
      const projectItems = document.querySelectorAll('.project-item');
      expect(projectItems.length).to.equal(2);
    });
  });
});
