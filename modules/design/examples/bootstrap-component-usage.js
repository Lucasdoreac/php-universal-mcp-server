/**
 * Exemplo de uso dos componentes Bootstrap
 * 
 * Este arquivo demonstra como utilizar os componentes Bootstrap
 * em uma aplicação Node.js usando o PHP Universal MCP Server.
 */

const { DesignSystem, ComponentManager } = require('../index');

// Inicializar o Design System com suporte a Bootstrap
const designSystem = new DesignSystem({
  enableBootstrap: true,
  bootstrapVersion: '5.3.0'
});

// Obter o gerenciador de componentes
const componentManager = new ComponentManager({
  componentsDir: require('path').join(__dirname, '../components')
});

/**
 * Exemplo 1: Renderizar um navbar Bootstrap
 */
async function renderNavbarExample() {
  try {
    const navbarOptions = {
      theme: 'light',
      fixed: true,
      logo: '/assets/logo.png',
      items: [
        { text: 'Home', url: '/', active: true },
        { text: 'Products', url: '/products' },
        { text: 'About', url: '/about' },
        { text: 'Contact', url: '/contact' }
      ],
      buttons: [
        { text: 'Sign In', url: '/login', type: 'outline-primary' }
      ]
    };
    
    const html = await componentManager.renderComponent('bootstrap/navbar/bs-navbar', {
      options: navbarOptions
    });
    
    console.log('Navbar HTML:');
    console.log(html);
    
    // Salvar o HTML em um arquivo para visualização
    require('fs').writeFileSync('navbar-example.html', `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Navbar Example</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
      </head>
      <body>
        ${html}
        
        <div class="container mt-5 pt-5">
          <h1>Navbar Example</h1>
          <p>This is an example of a Bootstrap navbar component.</p>
        </div>
        
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
      </body>
      </html>
    `);
    
    console.log('Navbar example saved to navbar-example.html');
  } catch (error) {
    console.error('Error rendering navbar:', error);
  }
}

/**
 * Exemplo 2: Renderizar um carousel Bootstrap
 */
async function renderCarouselExample() {
  try {
    const carouselOptions = {
      id: 'example-carousel',
      indicators: true,
      controls: true,
      fade: true,
      interval: 5000,
      aspectRatio: '21:9'
    };
    
    const slides = [
      {
        image: 'https://via.placeholder.com/1400x600/007bff/ffffff',
        title: 'First Slide',
        caption: 'This is the first slide description'
      },
      {
        image: 'https://via.placeholder.com/1400x600/28a745/ffffff',
        title: 'Second Slide',
        caption: 'This is the second slide description'
      },
      {
        image: 'https://via.placeholder.com/1400x600/dc3545/ffffff',
        title: 'Third Slide',
        caption: 'This is the third slide description'
      }
    ];
    
    const html = await componentManager.renderComponent('bootstrap/carousel/bs-carousel', {
      options: carouselOptions,
      slides: slides
    });
    
    console.log('Carousel HTML:');
    console.log(html);
    
    // Salvar o HTML em um arquivo para visualização
    require('fs').writeFileSync('carousel-example.html', `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Carousel Example</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
      </head>
      <body>
        <div class="container mt-4">
          <h1>Carousel Example</h1>
          <p>This is an example of a Bootstrap carousel component.</p>
          
          ${html}
        </div>
        
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
      </body>
      </html>
    `);
    
    console.log('Carousel example saved to carousel-example.html');
  } catch (error) {
    console.error('Error rendering carousel:', error);
  }
}

/**
 * Exemplo 3: Renderizar um formulário modal Bootstrap
 */
async function renderModalExample() {
  try {
    const modalOptions = {
      id: 'contact-modal',
      title: 'Contact Us',
      size: 'lg',
      centered: true,
      buttons: [
        { text: 'Cancel', type: 'secondary', dismiss: true },
        { text: 'Send Message', type: 'primary', id: 'send-btn' }
      ]
    };
    
    const content = `
      <form>
        <div class="mb-3">
          <label for="name" class="form-label">Your Name</label>
          <input type="text" class="form-control" id="name" placeholder="John Doe">
        </div>
        <div class="mb-3">
          <label for="email" class="form-label">Email Address</label>
          <input type="email" class="form-control" id="email" placeholder="john@example.com">
        </div>
        <div class="mb-3">
          <label for="message" class="form-label">Message</label>
          <textarea class="form-control" id="message" rows="5" placeholder="Your message here..."></textarea>
        </div>
      </form>
    `;
    
    const html = await componentManager.renderComponent('bootstrap/modal/bs-modal', {
      options: modalOptions,
      content: content
    });
    
    console.log('Modal HTML:');
    console.log(html);
    
    // Salvar o HTML em um arquivo para visualização
    require('fs').writeFileSync('modal-example.html', `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Modal Example</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
      </head>
      <body>
        <div class="container mt-4">
          <h1>Modal Example</h1>
          <p>Click the button below to open the modal.</p>
          
          <button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#contact-modal">
            Open Contact Form
          </button>
          
          ${html}
        </div>
        
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
      </body>
      </html>
    `);
    
    console.log('Modal example saved to modal-example.html');
  } catch (error) {
    console.error('Error rendering modal:', error);
  }
}

/**
 * Exemplo 4: Renderizar um accordion Bootstrap
 */
async function renderAccordionExample() {
  try {
    const accordionOptions = {
      id: 'faq-accordion',
      alwaysOpen: false,
      flush: false
    };
    
    const items = [
      {
        title: 'What is PHP Universal MCP Server?',
        content: 'PHP Universal MCP Server is a tool that allows you to manage multiple websites and e-commerce stores through a single chat interface in Claude Desktop using the Model Context Protocol (MCP).',
        active: true
      },
      {
        title: 'How does the Bootstrap integration work?',
        content: 'The Bootstrap integration provides ready-to-use components and templates that follow Bootstrap 5 design guidelines. These can be easily customized and rendered in your applications.'
      },
      {
        title: 'Can I create custom components?',
        content: 'Yes, you can create and register your own custom components following the same structure as the built-in components. They will be available through the ComponentManager.'
      },
      {
        title: 'Is this compatible with PHP frameworks?',
        content: 'Yes, PHP Universal MCP Server is designed to work with various PHP frameworks including Laravel, Symfony, and WordPress/WooCommerce.'
      }
    ];
    
    const html = await componentManager.renderComponent('bootstrap/accordion/bs-accordion', {
      options: accordionOptions,
      items: items
    });
    
    console.log('Accordion HTML:');
    console.log(html);
    
    // Salvar o HTML em um arquivo para visualização
    require('fs').writeFileSync('accordion-example.html', `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Accordion Example</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
      </head>
      <body>
        <div class="container mt-4">
          <h1>FAQ Accordion Example</h1>
          <p>Below is an example of a Bootstrap accordion component with FAQ items.</p>
          
          ${html}
        </div>
        
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
      </body>
      </html>
    `);
    
    console.log('Accordion example saved to accordion-example.html');
  } catch (error) {
    console.error('Error rendering accordion:', error);
  }
}

/**
 * Função principal para executar os exemplos
 */
async function main() {
  console.log('===== Bootstrap Component Examples =====');
  
  console.log('\n1. Navbar Example:');
  await renderNavbarExample();
  
  console.log('\n2. Carousel Example:');
  await renderCarouselExample();
  
  console.log('\n3. Modal Example:');
  await renderModalExample();
  
  console.log('\n4. Accordion Example:');
  await renderAccordionExample();
  
  console.log('\nAll examples completed!');
}

// Executar os exemplos
main().catch(error => {
  console.error('Error in examples:', error);
});