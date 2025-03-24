/**
 * Demonstração da Integração do Renderizador Progressivo com Artifacts
 * 
 * Este script demonstra como usar o ArtifactProgressiveRenderer
 * para renderizar um template Bootstrap complexo em artifacts
 * otimizados para visualização no Claude Desktop.
 * 
 * @author PHP Universal MCP Server Team
 * @version 1.0.0
 */

const fs = require('fs').promises;
const path = require('path');
const ArtifactProgressiveRenderer = require('../integrations/claude/artifact-progressive-renderer');
const handlebars = require('handlebars');

// Configurar um sistema de logging simples para a demonstração
const logger = {
  info: (...args) => console.log('\x1b[36m[INFO]\x1b[0m', ...args),
  debug: (...args) => console.log('\x1b[35m[DEBUG]\x1b[0m', ...args),
  error: (...args) => console.error('\x1b[31m[ERROR]\x1b[0m', ...args),
  success: (...args) => console.log('\x1b[32m[SUCCESS]\x1b[0m', ...args),
  warn: (...args) => console.warn('\x1b[33m[WARN]\x1b[0m', ...args)
};

// Dados de exemplo para renderização (mesmos do exemplo anterior)
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
 * Demonstração do ArtifactProgressiveRenderer
 */
async function runDemo() {
  try {
    logger.info('Iniciando demonstração do ArtifactProgressiveRenderer...');
    
    // 1. Carregar o template HTML
    logger.info('Carregando template de exemplo...');
    const templatePath = path.join(__dirname, 'templates/bootstrap-ecommerce.template.html');
    const templateContent = await fs.readFile(templatePath, 'utf8');
    logger.success(`Template carregado: ${templatePath} (${templateContent.length} caracteres)`);
    
    // 2. Criar instância do renderizador de artifacts progressivo
    const renderer = new ArtifactProgressiveRenderer({
      priorityLevels: 5,
      skeletonLoading: true,
      feedbackEnabled: true,
      // Configurar um limite de tamanho baixo para forçar a divisão em partes
      artifactMaxSize: 100000,
      splitThreshold: 20
    });
    logger.success('ArtifactProgressiveRenderer inicializado');
    
    // 3. Registrar helpers do Handlebars para o template
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
    
    // 4. Simular uma configuração de Claude MCP
    const claudeContext = {
      sessionId: 'demo-session-1234',
      userId: 'demo-user-5678',
      maxArtifactSize: 500000
    };
    
    // 5. Renderizar para artifacts
    logger.info('Renderizando template para artifacts...');
    console.time('Renderização para artifacts');
    const startTime = Date.now();
    
    const artifacts = await renderer.renderToArtifacts(templateContent, demoData, {
      // Configurações específicas para este template
      useLogicalDivision: true,
      artifactMaxSize: claudeContext.maxArtifactSize
    });
    
    const endTime = Date.now();
    console.timeEnd('Renderização para artifacts');
    logger.success(`Template renderizado em ${endTime - startTime}ms, gerando ${artifacts.length} artifacts`);
    
    // 6. Salvar os artifacts em arquivos HTML para visualização
    logger.info('Salvando artifacts para visualização...');
    const outputDir = path.join(__dirname, 'output/artifacts');
    await fs.mkdir(outputDir, { recursive: true });
    
    for (let i = 0; i < artifacts.length; i++) {
      const artifact = artifacts[i];
      const artifactPath = path.join(outputDir, `artifact-${i + 1}.html`);
      await fs.writeFile(artifactPath, artifact.content);
      logger.success(`Artifact ${i + 1} salvo em: ${artifactPath}`);
    }
    
    // 7. Salvar metadados dos artifacts
    const metadataPath = path.join(outputDir, 'artifacts-metadata.json');
    const metadata = artifacts.map((artifact, index) => ({
      title: artifact.title,
      type: artifact.type,
      size: artifact.content.length,
      index: index + 1
    }));
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    logger.success(`Metadados dos artifacts salvos em: ${metadataPath}`);
    
    // 8. Gerar um sumário HTML com links para os artifacts
    const summaryPath = path.join(outputDir, 'index.html');
    
    const summaryHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Demonstração de Artifacts Progressivos</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body>
  <div class="container my-5">
    <h1 class="mb-4">Demonstração de Artifacts Progressivos</h1>
    
    <div class="card mb-4">
      <div class="card-header">
        Sumário da Renderização
      </div>
      <div class="card-body">
        <p><strong>Template:</strong> bootstrap-ecommerce.template.html</p>
        <p><strong>Tamanho do Template:</strong> ${templateContent.length.toLocaleString()} caracteres</p>
        <p><strong>Tempo de Renderização:</strong> ${endTime - startTime}ms</p>
        <p><strong>Artifacts Gerados:</strong> ${artifacts.length}</p>
      </div>
    </div>
    
    <h2 class="mb-3">Artifacts Gerados</h2>
    <div class="list-group mb-4">
      ${artifacts.map((artifact, index) => `
        <a href="artifact-${index + 1}.html" class="list-group-item list-group-item-action" target="_blank">
          <div class="d-flex w-100 justify-content-between">
            <h5 class="mb-1">${artifact.title}</h5>
            <small>${(artifact.content.length / 1024).toFixed(1)} KB</small>
          </div>
          <p class="mb-1">Tipo: ${artifact.type}</p>
        </a>
      `).join('')}
    </div>
    
    <div class="alert alert-info">
      <h4 class="alert-heading">Como testar no Claude Desktop</h4>
      <p>Para testar esta funcionalidade no Claude Desktop, você precisaria:</p>
      <ol>
        <li>Configurar o MCP Server para se comunicar com o Claude Desktop</li>
        <li>Implementar um handler MCP que utiliza o ArtifactProgressiveRenderer</li>
        <li>Enviar os artifacts gerados para o Claude usando o protocolo MCP</li>
      </ol>
      <p>Esta demonstração simula apenas a geração dos artifacts, sem envio real para o Claude.</p>
    </div>
  </div>
  
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
    `;
    
    await fs.writeFile(summaryPath, summaryHtml);
    logger.success(`Sumário HTML gerado em: ${summaryPath}`);
    
    // 9. Exibir estatísticas
    logger.info('\n--- ESTATÍSTICAS DE ARTIFACTS ---');
    logger.info(`Tamanho total do template: ${templateContent.length.toLocaleString()} caracteres`);
    logger.info(`Número de artifacts gerados: ${artifacts.length}`);
    
    const totalArtifactsSize = artifacts.reduce((total, artifact) => total + artifact.content.length, 0);
    logger.info(`Tamanho total dos artifacts: ${totalArtifactsSize.toLocaleString()} caracteres`);
    
    const overhead = ((totalArtifactsSize / templateContent.length) * 100) - 100;
    logger.info(`Overhead da divisão: ${overhead.toFixed(1)}%`);
    
    const sizeDistribution = artifacts.map((a, i) => `Artifact ${i + 1}: ${(a.content.length / 1024).toFixed(1)} KB`);
    logger.info(`Distribuição de tamanhos:\n${sizeDistribution.join('\n')}`);
    logger.info('-------------------------------\n');
    
    logger.info('Demonstração concluída com sucesso!');
    logger.info(`Para visualizar o resultado, abra o arquivo HTML em:\n- ${summaryPath}`);
  } catch (error) {
    logger.error('Erro na demonstração:', error);
  }
}

// Executar a demonstração
runDemo();
