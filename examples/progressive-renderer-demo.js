/**
 * Demonstração do Renderizador Progressivo
 * 
 * Este script demonstra o uso do ProgressiveRenderer para renderizar
 * um template Bootstrap complexo de forma otimizada e progressiva.
 * 
 * @author PHP Universal MCP Server Team
 * @version 1.0.0
 */

const fs = require('fs').promises;
const path = require('path');
const ProgressiveRenderer = require('../modules/design/renderers/progressive-renderer');
const handlebars = require('handlebars');

// Configurar um sistema de logging simples para a demonstração
const logger = {
  info: (...args) => console.log('\x1b[36m[INFO]\x1b[0m', ...args),
  debug: (...args) => console.log('\x1b[35m[DEBUG]\x1b[0m', ...args),
  error: (...args) => console.error('\x1b[31m[ERROR]\x1b[0m', ...args),
  success: (...args) => console.log('\x1b[32m[SUCCESS]\x1b[0m', ...args),
  warn: (...args) => console.warn('\x1b[33m[WARN]\x1b[0m', ...args)
};

// Dados de exemplo para renderização
const demoData = {
  storeName: 'DigitalStore',
  storeMotto: 'Tecnologia de ponta para sua vida',
  storeDescription: 'A melhor loja de eletrônicos do Brasil, trazendo inovação e tecnologia ao seu alcance desde 2010.',
  heroTitle: 'Tecnologia de ponta para sua vida',
  heroSubtitle: 'Descubra os mais recentes gadgets e dispositivos eletrônicos com os melhores preços do mercado.',
  features: [
    { icon: 'fas fa-truck', title: 'Envio Rápido', description: 'Entrega garantida em até 2 dias úteis para todo o Brasil.' },
    { icon: 'fas fa-shield-alt', title: 'Garantia Estendida', description: 'Todos os produtos com garantia mínima de 12 meses.' },
    { icon: 'fas fa-headset', title: 'Suporte 24/7', description: 'Atendimento especializado disponível a qualquer hora.' }
  ],
  products: [
    {
      id: 1,
      name: 'Smartphone XS Pro',
      description: 'Processador octa-core, 8GB RAM, 128GB',
      price: 2969,
      oldPrice: 3499,
      discount: 15,
      rating: 4.5,
      reviewCount: 128,
      isNew: false,
      image: 'https://via.placeholder.com/300x300'
    },
    {
      id: 2,
      name: 'Smartphone Y2',
      description: 'Processador hexa-core, 6GB RAM, 64GB',
      price: 1699,
      rating: 4.0,
      reviewCount: 87,
      isNew: false,
      image: 'https://via.placeholder.com/300x300'
    },
    {
      id: 3,
      name: 'Smartphone Z Ultra',
      description: 'Processador octa-core, 12GB RAM, 256GB',
      price: 4299,
      rating: 5.0,
      reviewCount: 52,
      isNew: true,
      image: 'https://via.placeholder.com/300x300'
    },
    {
      id: 4,
      name: 'Smartphone A2',
      description: 'Processador quad-core, 4GB RAM, 64GB',
      price: 1299,
      rating: 3.5,
      reviewCount: 167,
      isNew: false,
      image: 'https://via.placeholder.com/300x300'
    }
  ],
  testimonials: [
    {
      text: '"Comprei um laptop para minha filha estudar e fiquei impressionado com a rapidez da entrega e a qualidade do produto. Recomendo!"',
      name: 'Roberto Silva',
      location: 'São Paulo, SP',
      rating: 5,
      image: 'https://via.placeholder.com/50x50'
    },
    {
      text: '"Atendimento excepcional! Tive um problema com meu smartphone e o suporte técnico me ajudou a resolver rapidamente. Muito satisfeita!"',
      name: 'Maria Oliveira',
      location: 'Rio de Janeiro, RJ',
      rating: 4.5,
      image: 'https://via.placeholder.com/50x50'
    },
    {
      text: '"Preços imbatíveis e produtos de qualidade. Já fiz várias compras e sempre fico satisfeito. DigitalStore é minha loja online favorita!"',
      name: 'Carlos Santos',
      location: 'Belo Horizonte, MG',
      rating: 5,
      image: 'https://via.placeholder.com/50x50'
    }
  ],
  brands: [
    { name: 'Brand 1', image: 'https://via.placeholder.com/150x75?text=Brand+1' },
    { name: 'Brand 2', image: 'https://via.placeholder.com/150x75?text=Brand+2' },
    { name: 'Brand 3', image: 'https://via.placeholder.com/150x75?text=Brand+3' },
    { name: 'Brand 4', image: 'https://via.placeholder.com/150x75?text=Brand+4' },
    { name: 'Brand 5', image: 'https://via.placeholder.com/150x75?text=Brand+5' },
    { name: 'Brand 6', image: 'https://via.placeholder.com/150x75?text=Brand+6' },
    { name: 'Brand 7', image: 'https://via.placeholder.com/150x75?text=Brand+7' },
    { name: 'Brand 8', image: 'https://via.placeholder.com/150x75?text=Brand+8' },
    { name: 'Brand 9', image: 'https://via.placeholder.com/150x75?text=Brand+9' },
    { name: 'Brand 10', image: 'https://via.placeholder.com/150x75?text=Brand+10' }
  ],
  contact: {
    address: 'Av. Tecnologia, 1000 - São Paulo, SP',
    phone: '(11) 4002-8922',
    email: 'contato@digitalstore.com.br',
    hours: 'Seg-Sex: 8h às 20h | Sáb: 9h às 15h'
  },
  currentYear: new Date().getFullYear()
};

/**
 * Demonstração do renderizador progressivo
 */
async function runDemo() {
  try {
    logger.info('Iniciando demonstração do ProgressiveRenderer...');
    
    // 1. Carregar o template HTML
    logger.info('Carregando template de exemplo...');
    const templatePath = path.join(__dirname, 'templates/bootstrap-ecommerce.template.html');
    const templateContent = await fs.readFile(templatePath, 'utf8');
    logger.success(`Template carregado: ${templatePath} (${templateContent.length} caracteres)`);
    
    // 2. Criar instância do renderizador progressivo
    const renderer = new ProgressiveRenderer({
      priorityLevels: 5,
      initialRenderTimeout: 300,
      componentAnalysisEnabled: true,
      skeletonLoading: true,
      feedbackEnabled: true
    });
    logger.success('ProgressiveRenderer inicializado');
    
    // 3. Registrar alguns helpers do Handlebars para o template
    handlebars.registerHelper('formatCurrency', function(value) {
      return `R$ ${value.toFixed(2).replace('.', ',')}`;
    });
    
    handlebars.registerHelper('renderStars', function(rating) {
      let stars = '';
      for (let i = 1; i <= 5; i++) {
        if (i <= Math.floor(rating)) {
          stars += '<i class="fas fa-star"></i>';
        } else if (i <= Math.ceil(rating) && i > Math.floor(rating)) {
          stars += '<i class="fas fa-star-half-alt"></i>';
        } else {
          stars += '<i class="far fa-star"></i>';
        }
      }
      return new handlebars.SafeString(stars);
    });
    
    logger.success('Helpers Handlebars registrados');
    
    // 4. Renderizar o template com o ProgressiveRenderer
    logger.info('Renderizando template progressivamente...');
    console.time('Renderização progressiva');
    const startTime = Date.now();
    
    const renderedHTML = await renderer.render(templateContent, demoData);
    
    const endTime = Date.now();
    console.timeEnd('Renderização progressiva');
    logger.success(`Template renderizado em ${endTime - startTime}ms`);
    
    // 5. Salvar o resultado em um arquivo HTML para visualização
    const outputPath = path.join(__dirname, 'output/progressive-rendered.html');
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, renderedHTML);
    logger.success(`Resultado salvo em: ${outputPath}`);
    
    // 6. Comparar com uma renderização normal (para benchmark)
    logger.info('Renderizando template normalmente para comparação...');
    console.time('Renderização normal');
    const startTimeNormal = Date.now();
    
    const normalTemplate = handlebars.compile(templateContent);
    const normalRenderedHTML = normalTemplate(demoData);
    
    const endTimeNormal = Date.now();
    console.timeEnd('Renderização normal');
    logger.success(`Template renderizado normalmente em ${endTimeNormal - startTimeNormal}ms`);
    
    // Salvar resultado normal para comparação
    const normalOutputPath = path.join(__dirname, 'output/normal-rendered.html');
    await fs.writeFile(normalOutputPath, normalRenderedHTML);
    logger.success(`Resultado normal salvo em: ${normalOutputPath}`);
    
    // 7. Mostrar estatísticas
    logger.info('\n--- ESTATÍSTICAS DE PERFORMANCE ---');
    logger.info(`Tamanho do template: ${templateContent.length} caracteres`);
    logger.info(`Tempo de renderização progressiva: ${endTime - startTime}ms`);
    logger.info(`Tempo de renderização normal: ${endTimeNormal - startTimeNormal}ms`);
    logger.info(`Ganho de performance inicial: ${((endTimeNormal - startTimeNormal) - (endTime - startTime)) / (endTimeNormal - startTimeNormal) * 100}%`);
    logger.info('-----------------------------------\n');
    
    logger.info('Demonstração concluída com sucesso!');
    logger.info(`Para visualizar o resultado, abra os arquivos HTML em:\n- ${outputPath}\n- ${normalOutputPath}`);
  } catch (error) {
    logger.error('Erro na demonstração:', error);
  }
}

// Executar a demonstração
runDemo();
