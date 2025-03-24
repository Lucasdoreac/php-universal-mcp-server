/**
 * Testes unitários para o ProgressiveRenderer
 * 
 * @jest
 */

const ProgressiveRenderer = require('../../../modules/design/renderers/progressive-renderer');
const PerformanceOptimizer = require('../../../modules/design/renderers/performance-optimizer');

// Mock dos módulos necessários
jest.mock('../../../modules/design/renderers/performance-optimizer');
jest.mock('jsdom');
jest.mock('../../../utils/logger', () => ({
  info: jest.fn(),
  debug: jest.fn(),
  error: jest.fn()
}));

// Templates de teste
const simpleTemplate = '<div>Conteúdo simples</div>';
const complexTemplate = `
  <html>
    <head>
      <title>Template Complexo</title>
    </head>
    <body>
      <header>
        <h1>Cabeçalho do Site</h1>
        <nav>
          <ul>
            <li>Início</li>
            <li>Produtos</li>
            <li>Sobre</li>
            <li>Contato</li>
          </ul>
        </nav>
      </header>
      <main>
        <section class="hero">
          <h2>Seção Principal</h2>
          <p>Este é um conteúdo de alta prioridade.</p>
          <img src="hero.jpg" alt="Imagem principal">
        </section>
        <div class="carousel">
          <div class="slide">Slide 1</div>
          <div class="slide">Slide 2</div>
          <div class="slide">Slide 3</div>
        </div>
        <section class="content">
          <h2>Conteúdo Secundário</h2>
          <p>Este é um conteúdo de prioridade média.</p>
          <table>
            <tr><th>Coluna 1</th><th>Coluna 2</th></tr>
            <tr><td>Dado 1</td><td>Dado 2</td></tr>
            <tr><td>Dado 3</td><td>Dado 4</td></tr>
          </table>
        </section>
      </main>
      <footer>
        <p>Rodapé do site - Conteúdo de baixa prioridade.</p>
      </footer>
    </body>
  </html>
`;

describe('ProgressiveRenderer', () => {
  let renderer;
  
  beforeEach(() => {
    // Resetar mocks
    jest.clearAllMocks();
    
    // Configurar mock do PerformanceOptimizer
    PerformanceOptimizer.mockImplementation(() => ({
      optimizeTemplate: jest.fn().mockResolvedValue('Rendered by optimizer')
    }));
    
    // Inicializar o renderizador
    renderer = new ProgressiveRenderer({
      priorityLevels: 5,
      initialRenderTimeout: 300,
      componentAnalysisEnabled: true,
      skeletonLoading: true,
      feedbackEnabled: true
    });
  });
  
  describe('Inicialização', () => {
    test('deve inicializar com as opções padrão', () => {
      const defaultRenderer = new ProgressiveRenderer();
      
      expect(defaultRenderer.options.priorityLevels).toBe(5);
      expect(defaultRenderer.options.initialRenderTimeout).toBe(300);
      expect(defaultRenderer.options.componentAnalysisEnabled).toBe(true);
      expect(defaultRenderer.options.skeletonLoading).toBe(true);
      expect(defaultRenderer.options.feedbackEnabled).toBe(true);
    });
    
    test('deve inicializar com opções personalizadas', () => {
      const customRenderer = new ProgressiveRenderer({
        priorityLevels: 3,
        initialRenderTimeout: 500,
        skeletonLoading: false
      });
      
      expect(customRenderer.options.priorityLevels).toBe(3);
      expect(customRenderer.options.initialRenderTimeout).toBe(500);
      expect(customRenderer.options.skeletonLoading).toBe(false);
      expect(customRenderer.options.componentAnalysisEnabled).toBe(true);
      expect(customRenderer.options.feedbackEnabled).toBe(true);
    });
    
    test('deve inicializar o PerformanceOptimizer', () => {
      expect(PerformanceOptimizer).toHaveBeenCalled();
    });
  });
  
  describe('Análise de Template', () => {
    test('deve analisar corretamente os componentes do template', async () => {
      // Realizar análise do template
      const result = await renderer._analyzeTemplate(complexTemplate, renderer.options);
      
      // Verificar se o template foi processado
      expect(result.processedTemplate).toContain('{{#renderPriority');
      
      // Verificar se cabeçalho está marcado com prioridade máxima
      expect(result.processedTemplate).toContain('{{#renderPriority 1}}<header');
      
      // Verificar se a seção principal está marcada com prioridade alta
      expect(result.processedTemplate).toContain('{{#renderPriority 2}}<main');
      
      // Verificar se imagens estão marcadas
      expect(result.processedTemplate).toContain('{{#renderPriority 3}}<img');
      
      // Verificar se componentes pesados têm prioridade baixa
      expect(result.processedTemplate).toContain('{{#renderPriority 5}}<table');
      
      // Verificar se o rodapé tem a prioridade mais baixa
      expect(result.processedTemplate).toContain('{{#renderPriority 5}}<footer');
    });
  });
  
  describe('Renderização de Skeletons', () => {
    test('deve gerar skeleton HTML apropriado para texto', () => {
      const textContent = '<p>Este é um texto de exemplo.</p>';
      const result = renderer._generateSkeletonHTML(textContent);
      
      expect(result).toContain('skeleton-placeholder');
      expect(result).toContain('skeleton-text');
    });
    
    test('deve gerar skeleton HTML apropriado para imagens', () => {
      const imageContent = '<img src="example.jpg" alt="Exemplo">';
      const result = renderer._generateSkeletonHTML(imageContent);
      
      expect(result).toContain('skeleton-placeholder');
      expect(result).toContain('skeleton-image');
    });
    
    test('deve gerar skeleton HTML apropriado para tabelas', () => {
      const tableContent = '<table><tr><td>Dados</td></tr></table>';
      const result = renderer._generateSkeletonHTML(tableContent);
      
      expect(result).toContain('skeleton-placeholder');
      expect(result).toContain('skeleton-table');
      expect(result).toContain('skeleton-table-row');
    });
    
    test('deve gerar skeleton HTML apropriado para cards', () => {
      const cardContent = '<div class="card"><div class="card-body">Conteúdo</div></div>';
      const result = renderer._generateSkeletonHTML(cardContent);
      
      expect(result).toContain('skeleton-placeholder');
      expect(result).toContain('skeleton-card');
      expect(result).toContain('skeleton-card-body');
    });
  });
  
  describe('Análise de Componentes', () => {
    test('deve detectar corretamente componentes de imagem', () => {
      const result = renderer._analyzeComponentType('<div><img src="test.jpg" alt="Test"></div>');
      expect(result).toBe('image');
    });
    
    test('deve detectar corretamente componentes de tabela', () => {
      const result = renderer._analyzeComponentType('<table><tr><td>Data</td></tr></table>');
      expect(result).toBe('table');
    });
    
    test('deve detectar corretamente componentes de card', () => {
      const result = renderer._analyzeComponentType('<div class="card"><div class="card-body">Content</div></div>');
      expect(result).toBe('card');
    });
    
    test('deve usar tipo de texto como fallback', () => {
      const result = renderer._analyzeComponentType('<div>Simple content</div>');
      expect(result).toBe('text');
    });
  });
  
  describe('Renderização Progressiva', () => {
    test('deve renderizar template simples com sucesso', async () => {
      // Mock para a compilação do Handlebars
      const mockCompiledTemplate = jest.fn().mockReturnValue('<div>Rendered content</div>');
      jest.spyOn(require('handlebars'), 'compile').mockReturnValue(mockCompiledTemplate);
      
      const result = await renderer.render(simpleTemplate);
      
      expect(result).toContain('Rendered content');
      expect(result).toContain('Progressive Renderer Initializer');
      expect(result).toContain('renderByPriority');
    });
    
    test('deve incluir scripts de renderização progressiva', async () => {
      // Mock para a compilação do Handlebars
      const mockCompiledTemplate = jest.fn().mockReturnValue('<body>Rendered content</body>');
      jest.spyOn(require('handlebars'), 'compile').mockReturnValue(mockCompiledTemplate);
      
      const result = await renderer.render(simpleTemplate);
      
      expect(result).toContain('<script>');
      expect(result).toContain('Progressive Renderer Initializer');
      expect(result).toContain('renderByPriority');
      expect(result).toContain('</script>');
      expect(result).toContain('<style>');
      expect(result).toContain('.skeleton-placeholder');
      expect(result).toContain('@keyframes shimmer');
      expect(result).toContain('</style>');
    });
    
    test('deve incluir feedback visual quando habilitado', async () => {
      // Mock para a compilação do Handlebars
      const mockCompiledTemplate = jest.fn().mockReturnValue('<body>Rendered content</body>');
      jest.spyOn(require('handlebars'), 'compile').mockReturnValue(mockCompiledTemplate);
      
      const result = await renderer.render(simpleTemplate, {}, { feedbackEnabled: true });
      
      expect(result).toContain('progressContainer');
      expect(result).toContain('progress-bar');
      expect(result).toContain('updateProgress');
    });
    
    test('deve omitir feedback visual quando desabilitado', async () => {
      // Mock para a compilação do Handlebars
      const mockCompiledTemplate = jest.fn().mockReturnValue('<body>Rendered content</body>');
      jest.spyOn(require('handlebars'), 'compile').mockReturnValue(mockCompiledTemplate);
      
      const result = await renderer.render(simpleTemplate, {}, { feedbackEnabled: false });
      
      expect(result).not.toContain('progressContainer');
      expect(result).not.toContain('updateProgress');
    });
  });
  
  describe('Tratamento de Erros', () => {
    test('deve usar fallback para o PerformanceOptimizer em caso de erro', async () => {
      // Forçar um erro durante a renderização
      jest.spyOn(renderer, '_analyzeTemplate').mockImplementation(() => {
        throw new Error('Erro de teste');
      });
      
      await renderer.render(simpleTemplate);
      
      // Verificar se o fallback foi chamado
      expect(renderer.performanceOptimizer.optimizeTemplate).toHaveBeenCalledWith(
        simpleTemplate,
        {},
        {}
      );
    });
  });
  
  describe('Preparação de Scripts', () => {
    test('deve gerar scripts para cada nível de prioridade', () => {
      const html = '<body>Test content</body>';
      const componentMap = new Map();
      
      const result = renderer._prepareProgressiveScripts(html, componentMap, { 
        priorityLevels: 3,
        feedbackEnabled: true
      });
      
      // Verificar se foram gerados timeouts para cada nível de prioridade
      expect(result).toContain('renderByPriority(1)'); // Prioridade 1 (imediata)
      expect(result).toContain('renderByPriority(2)'); // Prioridade 2
      expect(result).toContain('renderByPriority(3)'); // Prioridade 3
      
      // Verificar se existem diferentes tempos de atraso
      expect(result).toContain('setTimeout(() => renderByPriority(2)');
      expect(result).toContain('setTimeout(() => renderByPriority(3)');
    });
  });
});