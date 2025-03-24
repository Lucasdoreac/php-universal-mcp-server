/**
 * Testes unitários para o PerformanceOptimizer
 * 
 * @jest
 */

const PerformanceOptimizer = require('../../../modules/design/renderers/performance-optimizer');

// Mock dos módulos necessários
jest.mock('node-cache');
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
        <h1>Cabeçalho</h1>
        <nav>
          <ul>
            <li>Item 1</li>
            <li>Item 2</li>
          </ul>
        </nav>
      </header>
      <main>
        <div class="carousel">
          <div class="slide">Slide 1</div>
          <div class="slide">Slide 2</div>
          <div class="slide">Slide 3</div>
        </div>
        <section>
          <h2>Conteúdo Principal</h2>
          <p>Este é um template de teste complexo.</p>
          <table>
            <tr>
              <td>Item 1</td>
              <td>Item 2</td>
            </tr>
            <tr>
              <td>Item 3</td>
              <td>Item 4</td>
            </tr>
          </table>
        </section>
      </main>
      <footer>
        <p>Rodapé do site</p>
      </footer>
    </body>
  </html>
`;

describe('PerformanceOptimizer', () => {
  let optimizer;
  
  beforeEach(() => {
    optimizer = new PerformanceOptimizer({
      cacheEnabled: true,
      compressionEnabled: true,
      lazyLoadingEnabled: true,
      progressiveRenderingEnabled: true
    });
    
    // Limpar mocks entre testes
    jest.clearAllMocks();
  });
  
  describe('Inicialização', () => {
    test('deve inicializar com as opções padrão', () => {
      const defaultOptimizer = new PerformanceOptimizer();
      
      expect(defaultOptimizer.options.cacheEnabled).toBe(true);
      expect(defaultOptimizer.options.compressionEnabled).toBe(true);
      expect(defaultOptimizer.options.lazyLoadingEnabled).toBe(true);
      expect(defaultOptimizer.options.progressiveRenderingEnabled).toBe(true);
      expect(defaultOptimizer.options.cacheTTL).toBe(3600);
    });
    
    test('deve inicializar com opções personalizadas', () => {
      const customOptimizer = new PerformanceOptimizer({
        cacheEnabled: false,
        compressionEnabled: false,
        cacheTTL: 7200
      });
      
      expect(customOptimizer.options.cacheEnabled).toBe(false);
      expect(customOptimizer.options.compressionEnabled).toBe(false);
      expect(customOptimizer.options.lazyLoadingEnabled).toBe(true);
      expect(customOptimizer.options.cacheTTL).toBe(7200);
    });
  });
  
  describe('Otimização de Templates', () => {
    test('deve processar um template simples sem alterações quando otimizações estão desativadas', async () => {
      const noOptimizationsOptimizer = new PerformanceOptimizer({
        cacheEnabled: false,
        compressionEnabled: false,
        lazyLoadingEnabled: false,
        progressiveRenderingEnabled: false
      });
      
      const result = await noOptimizationsOptimizer.optimizeTemplate(simpleTemplate);
      expect(result).toBe(simpleTemplate);
    });
    
    test('deve aplicar lazy loading em componentes pesados', async () => {
      const result = await optimizer.optimizeTemplate(
        '<div class="carousel">Carrossel</div>'
      );
      
      expect(result).toContain('lazy-load-container');
      expect(result).toContain('heavy-component carousel-wrapper');
    });
    
    test('deve aplicar renderização progressiva em header, main e footer', async () => {
      const result = await optimizer.optimizeTemplate(
        '<header>Cabeçalho</header><main>Conteúdo</main><footer>Rodapé</footer>'
      );
      
      expect(result).toContain('data-priority="high"');
      expect(result).toContain('data-priority="normal"');
      expect(result).toContain('data-priority="low"');
    });
    
    test('deve adicionar scripts de inicialização quando otimizações estão ativadas', async () => {
      const result = await optimizer.optimizeTemplate(simpleTemplate);
      
      expect(result).toContain('<script>');
      expect(result).toContain('Inicializador de Lazy Loading');
      expect(result).toContain('Inicializador de Renderização Progressiva');
    });
  });
  
  describe('Gerenciamento de Cache', () => {
    test('deve armazenar resultados em cache', async () => {
      // Mock do template cache
      optimizer.templateCache.get.mockReturnValue(null);
      optimizer.templateCache.set = jest.fn();
      
      await optimizer.optimizeTemplate(simpleTemplate);
      
      expect(optimizer.templateCache.set).toHaveBeenCalled();
    });
    
    test('deve recuperar resultados do cache quando disponível', async () => {
      // Configurar mock para retornar um resultado em cache
      optimizer.templateCache.get.mockReturnValue('Resultado em cache');
      optimizer._decompressIfNeeded = jest.fn().mockReturnValue('Resultado descomprimido');
      
      const result = await optimizer.optimizeTemplate(simpleTemplate);
      
      expect(optimizer._decompressIfNeeded).toHaveBeenCalled();
      expect(result).toBe('Resultado descomprimido');
      expect(optimizer.metrics.cacheHits).toBe(1);
    });
    
    test('deve registrar cache miss quando o template não está em cache', async () => {
      optimizer.templateCache.get.mockReturnValue(null);
      
      await optimizer.optimizeTemplate(simpleTemplate);
      
      expect(optimizer.metrics.cacheMisses).toBe(1);
    });
    
    test('deve limpar corretamente o cache', () => {
      optimizer.templateCache.keys.mockReturnValue(['key1', 'key2', 'key3']);
      optimizer.templateCache.flushAll = jest.fn();
      
      const count = optimizer.clearCache();
      
      expect(optimizer.templateCache.flushAll).toHaveBeenCalled();
      expect(count).toBe(3);
    });
  });
  
  describe('Compressão', () => {
    test('deve comprimir templates quando a compressão está ativada', () => {
      const template = 'Template para compressão com conteúdo suficiente para ser comprimido';
      
      // Mock das funções de compressão
      const mockCompressed = Buffer.from('compressed');
      const zlib = require('zlib');
      zlib.deflateSync = jest.fn().mockReturnValue(mockCompressed);
      
      const result = optimizer._compressTemplate(template);
      
      expect(zlib.deflateSync).toHaveBeenCalled();
      expect(result).toBe(mockCompressed);
    });
    
    test('deve descomprimir templates quando necessário', () => {
      const compressedTemplate = Buffer.from('compressed');
      const expectedResult = 'decompressed template';
      
      // Mock das funções de descompressão
      const zlib = require('zlib');
      zlib.inflateSync = jest.fn().mockReturnValue(Buffer.from(expectedResult));
      
      const result = optimizer._decompressIfNeeded(compressedTemplate, { 
        compressionEnabled: true 
      });
      
      expect(zlib.inflateSync).toHaveBeenCalled();
      expect(result).toBe(expectedResult);
    });
  });
  
  describe('Métricas de Performance', () => {
    test('deve rastrear métricas de renderização', async () => {
      // Simular múltiplas renderizações
      await optimizer.optimizeTemplate(simpleTemplate);
      await optimizer.optimizeTemplate(complexTemplate);
      await optimizer.optimizeTemplate(simpleTemplate);
      
      const metrics = optimizer.getMetrics();
      
      expect(metrics.totalTemplatesProcessed).toBe(3);
      expect(parseFloat(metrics.averageRenderTimeMs)).toBeGreaterThan(0);
      expect(metrics.cacheMisses).toBe(3); // Todos serão misses nos testes
    });
    
    test('deve calcular corretamente a taxa de acertos de cache', async () => {
      // Configurar mocks para simular hits e misses
      optimizer.metrics.cacheHits = 7;
      optimizer.metrics.cacheMisses = 3;
      
      const metrics = optimizer.getMetrics();
      
      expect(metrics.cacheHitRatio).toBe('70.00%');
    });
  });
  
  describe('Tratamento de Erros', () => {
    test('deve retornar o template original em caso de erro', async () => {
      // Forçar um erro durante o processamento
      optimizer._preprocessTemplate = jest.fn().mockImplementation(() => {
        throw new Error('Erro forçado');
      });
      
      const result = await optimizer.optimizeTemplate(simpleTemplate);
      
      expect(result).toBe(simpleTemplate);
    });
    
    test('deve tratar erros de compressão', () => {
      const template = 'Template para compressão';
      
      // Mock para forçar erro
      const zlib = require('zlib');
      zlib.deflateSync = jest.fn().mockImplementation(() => {
        throw new Error('Erro de compressão');
      });
      
      const result = optimizer._compressTemplate(template);
      
      expect(result).toBe(template); // Deve retornar o original em caso de erro
    });
    
    test('deve tratar erros de descompressão', () => {
      const compressedTemplate = Buffer.from('compressed');
      
      // Mock para forçar erro
      const zlib = require('zlib');
      zlib.inflateSync = jest.fn().mockImplementation(() => {
        throw new Error('Erro de descompressão');
      });
      
      const result = optimizer._decompressIfNeeded(compressedTemplate, { 
        compressionEnabled: true 
      });
      
      expect(typeof result).toBe('string');
    });
  });
  
  describe('Funcionalidades Auxiliares', () => {
    test('deve gerar IDs consistentes para o mesmo template e dados', () => {
      const template = 'Template de teste';
      const data = { key: 'value' };
      
      const id1 = optimizer._generateTemplateId(template, data);
      const id2 = optimizer._generateTemplateId(template, data);
      
      expect(id1).toBe(id2);
    });
    
    test('deve gerar IDs diferentes para templates ou dados diferentes', () => {
      const template1 = 'Template de teste 1';
      const template2 = 'Template de teste 2';
      const data = { key: 'value' };
      
      const id1 = optimizer._generateTemplateId(template1, data);
      const id2 = optimizer._generateTemplateId(template2, data);
      
      expect(id1).not.toBe(id2);
    });
    
    test('deve minificar HTML corretamente', () => {
      const html = `
        <div>
          <!-- Comentário a ser removido -->
          <p>  Texto com    espaços   </p>
          <img src="imagem.jpg" />
        </div>
      `;
      
      const minified = optimizer._minifyHTML(html);
      
      expect(minified).not.toContain('<!--');
      expect(minified).not.toContain('\n');
      expect(minified).not.toMatch(/\s{2,}/);
      expect(minified).toContain('<div><p>');
    });
  });
});