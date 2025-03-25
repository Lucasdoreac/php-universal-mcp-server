/**
 * Testes de integração para o Sistema Avançado de Renderização
 * 
 * Este arquivo contém testes que validam a integração entre os diferentes
 * componentes do sistema avançado de renderização: SmartRenderer,
 * EdgeCaseOptimizer, StreamingRenderer e outros componentes relacionados.
 * 
 * @author PHP Universal MCP Server Team
 * @version 1.0.0
 */

const { expect } = require('chai');
const path = require('path');
const fs = require('fs');

// Componentes do sistema de renderização
const SmartRenderer = require('../../../modules/design/renderers/smart-renderer');
const EdgeCaseOptimizer = require('../../../modules/design/renderers/edge-case-optimizer');
const StreamingRenderer = require('../../../modules/design/renderers/streaming-renderer');
const ProgressiveRenderer = require('../../../modules/design/renderers/progressive-renderer');
const EnhancedProgressiveRenderer = require('../../../modules/design/renderers/enhanced-progressive-renderer');

// Utilitários
const TestTemplateGenerator = require('../../utils/test-template-generator');
const { performance } = require('perf_hooks');

describe('Sistema Avançado de Renderização - Testes de Integração', () => {
  // Configurações de teste
  const testConfig = {
    templatesDir: path.join(__dirname, '../../fixtures/templates'),
    outputDir: path.join(__dirname, '../../output'),
    timeout: 30000 // 30 segundos para testes com templates grandes
  };

  // Garantir que o diretório de saída exista
  before(() => {
    if (!fs.existsSync(testConfig.outputDir)) {
      fs.mkdirSync(testConfig.outputDir, { recursive: true });
    }
  });

  // Instâncias de componentes para testes
  let smartRenderer;
  let testGenerator;

  beforeEach(() => {
    // Configurar instâncias com opções de teste
    smartRenderer = new SmartRenderer({
      debug: false,
      autoSelectRenderer: true,
      optimizeEdgeCases: true
    });

    testGenerator = new TestTemplateGenerator();
  });

  describe('SmartRenderer - Seleção automática de renderizador', () => {
    it('deve escolher ProgressiveRenderer para templates pequenos', async () => {
      // Gerar template de teste pequeno (10KB)
      const template = testGenerator.generateSimpleTemplate(10);

      // Espiar decisão interna do SmartRenderer
      const originalMethod = smartRenderer._selectBestRenderer;
      let selectedRenderer;

      smartRenderer._selectBestRenderer = function(...args) {
        const result = originalMethod.apply(this, args);
        selectedRenderer = result.renderer;
        return result;
      };

      // Renderizar template
      await smartRenderer.render(template);

      // Verificar seleção
      expect(selectedRenderer).to.equal('progressive');

      // Restaurar método original
      smartRenderer._selectBestRenderer = originalMethod;
    });

    it('deve escolher EnhancedProgressiveRenderer para templates médios', async () => {
      // Gerar template de teste médio (400KB)
      const template = testGenerator.generateComplexTemplate(400);

      // Espiar decisão interna do SmartRenderer
      const originalMethod = smartRenderer._selectBestRenderer;
      let selectedRenderer;

      smartRenderer._selectBestRenderer = function(...args) {
        const result = originalMethod.apply(this, args);
        selectedRenderer = result.renderer;
        return result;
      };

      // Renderizar template
      await smartRenderer.render(template);

      // Verificar seleção
      expect(selectedRenderer).to.equal('enhanced');

      // Restaurar método original
      smartRenderer._selectBestRenderer = originalMethod;
    });

    it('deve escolher StreamingRenderer para templates grandes', async () => {
      // Gerar template de teste grande (1.2MB)
      const template = testGenerator.generateExtremeTemplate(1200);

      // Espiar decisão interna do SmartRenderer
      const originalMethod = smartRenderer._selectBestRenderer;
      let selectedRenderer;

      smartRenderer._selectBestRenderer = function(...args) {
        const result = originalMethod.apply(this, args);
        selectedRenderer = result.renderer;
        return result;
      };

      // Renderizar template com callback de streaming
      const chunks = [];
      await smartRenderer.render(template, {}, {
        streamingCallback: (chunk) => chunks.push(chunk)
      });

      // Verificar seleção
      expect(selectedRenderer).to.equal('streaming');

      // Restaurar método original
      smartRenderer._selectBestRenderer = originalMethod;
    });
  });

  describe('Integração com EdgeCaseOptimizer', () => {
    it('deve otimizar templates com edge cases detectados', async () => {
      // Gerar template com edge cases conhecidos
      const template = testGenerator.generateTemplateWithEdgeCases();

      // Configuração para forçar otimização
      const edgeCaseOptimizer = new EdgeCaseOptimizer({ debug: false });

      // Aplicar otimização e analisar resultado
      const optimizationResult = await edgeCaseOptimizer.optimize(template);

      // Verificar se a otimização foi efetiva
      expect(optimizationResult).to.have.property('html');
      expect(optimizationResult).to.have.property('metrics');
      expect(optimizationResult.metrics.reductionPercent).to.be.greaterThan(0);
      expect(optimizationResult.metrics.optimizationsApplied).to.be.greaterThan(0);

      // Verificar integração com SmartRenderer
      // Espiar seleção de otimizador
      const originalMethod = smartRenderer._selectBestRenderer;
      let optimizeDecision;

      smartRenderer._selectBestRenderer = function(...args) {
        const result = originalMethod.apply(this, args);
        optimizeDecision = result.optimize;
        return result;
      };

      // Renderizar com SmartRenderer
      await smartRenderer.render(template);

      // Verificar se decidiu otimizar
      expect(optimizeDecision).to.be.true;

      // Restaurar método original
      smartRenderer._selectBestRenderer = originalMethod;
    });
  });

  describe('Integração com StreamingRenderer', () => {
    it('deve renderizar templates grandes em chunks via streaming', async () => {
      // Gerar template extremamente grande (2MB)
      const template = testGenerator.generateExtremeTemplate(2000);

      // Configurar renderizador de streaming
      const streamingRenderer = new StreamingRenderer({
        chunkSize: 50,
        chunkInterval: 10,
        visualFeedback: true
      });

      // Coletar chunks
      const chunks = [];
      const progressEvents = [];

      // Escutar eventos de progresso
      streamingRenderer.on('progress', (progress) => {
        progressEvents.push(progress);
      });

      // Renderizar usando streaming
      await streamingRenderer.renderStreaming(template, {}, (chunk, meta) => {
        chunks.push({ chunk, meta });
      });

      // Verificações
      expect(chunks.length).to.be.greaterThan(1);
      expect(progressEvents.length).to.be.greaterThan(0);
      
      // Verificar estrutura do primeiro chunk (deve conter HTML básico)
      expect(chunks[0].chunk).to.include('<!DOCTYPE html>');
      expect(chunks[0].chunk).to.include('<html');
      
      // Verificar que o último chunk indica finalização
      const lastChunk = chunks[chunks.length - 1];
      expect(lastChunk.meta.isLastChunk).to.be.true;
      expect(lastChunk.chunk).to.include('Streaming concluído');
    });
  });

  describe('Análise de desempenho dos renderizadores', () => {
    it('deve comparar métricas de desempenho entre diferentes renderizadores', async () => {
      // Gerar template médio (200KB) para comparação justa
      const template = testGenerator.generateComplexTemplate(200);

      // Configurar renderizadores para teste
      const progressive = new ProgressiveRenderer();
      const enhanced = new EnhancedProgressiveRenderer();

      // Medir desempenho do Progressive Renderer
      const progressiveStart = performance.now();
      await progressive.render(template);
      const progressiveTime = performance.now() - progressiveStart;

      // Medir desempenho do Enhanced Progressive Renderer
      const enhancedStart = performance.now();
      await enhanced.render(template);
      const enhancedTime = performance.now() - enhancedStart;

      // Comparar resultados (não fazer asserções estritas sobre tempos, 
      // apenas garantir que funcionou e coletar métricas)
      console.log(`Progressive: ${progressiveTime.toFixed(2)}ms, Enhanced: ${enhancedTime.toFixed(2)}ms`);
      
      // Registrar métricas para análise futura
      const metricsFile = path.join(testConfig.outputDir, 'renderer-performance.json');
      const metrics = {
        templateSize: template.length,
        progressive: progressiveTime,
        enhanced: enhancedTime,
        timestamp: new Date().toISOString()
      };
      
      fs.writeFileSync(metricsFile, JSON.stringify(metrics, null, 2));
    });
  });

  describe('SmartRenderer - Otimização de detecção de viewport', () => {
    it('deve priorizar elementos visíveis na viewport inicial', async () => {
      // Gerar template com várias seções
      const template = testGenerator.generateTemplateWithSections(10);

      // Configurar SmartRenderer com priorização de viewport
      const viewportRenderer = new SmartRenderer({
        autoSelectRenderer: true,
        prioritization: true,
        weights: {
          size: 0.3,
          elements: 0.2,
          edgeCases: 0.2,
          depth: 0.1,
          viewport: 0.2 // Adicionar peso para prioritização de viewport
        }
      });

      // Renderizar com viewport simulada
      const result = await viewportRenderer.render(template, {}, {
        viewport: {
          width: 1200,
          height: 800,
          dpr: 1
        }
      });

      // Verificar se o resultado contém marcação de prioridade de viewport
      expect(result).to.include('data-viewport-priority');

      // Validar o conteúdo renderizado
      expect(result).to.include('<!DOCTYPE html>');
      expect(result).to.include('</html>');
    });
  });

  describe('Casos de uso reais', () => {
    it('deve renderizar template de e-commerce complexo corretamente', async () => {
      // Carregar template de e-commerce real dos fixtures
      const templatePath = path.join(testConfig.templatesDir, 'ecommerce-product-page.html');
      let template;
      
      try {
        template = fs.readFileSync(templatePath, 'utf8');
      } catch (error) {
        // Se o arquivo não existir, gerar um template de e-commerce simulado
        template = testGenerator.generateEcommerceTemplate();
      }

      // Dados para renderização
      const data = {
        product: {
          name: 'Smartphone XYZ Premium',
          price: 999.99,
          description: 'Um smartphone avançado com recursos premium.',
          rating: 4.5,
          images: [
            '/images/product1.jpg',
            '/images/product2.jpg',
            '/images/product3.jpg'
          ],
          features: [
            'Tela de 6.5"',
            'Câmera de 108MP',
            'Bateria de 5000mAh',
            'Processador octa-core'
          ]
        },
        relatedProducts: [
          { id: 1, name: 'Capa Protetora', price: 29.99 },
          { id: 2, name: 'Carregador Rápido', price: 49.99 },
          { id: 3, name: 'Fone de Ouvido Bluetooth', price: 79.99 }
        ]
      };

      // Renderizar com SmartRenderer
      const result = await smartRenderer.render(template, data);

      // Verificar estrutura básica do resultado
      expect(result).to.include('<!DOCTYPE html>');
      expect(result).to.include('</html>');
      
      // Verificar se os dados foram integrados
      if (template.includes('{{product.name}}')) {
        expect(result).to.include('Smartphone XYZ Premium');
        expect(result).to.include('999.99');
      }

      // Salvar resultado para inspeção visual
      const outputPath = path.join(testConfig.outputDir, 'ecommerce-rendered.html');
      fs.writeFileSync(outputPath, result);
    });

    it('deve lidar com templates Bootstrap complexos eficientemente', async () => {
      // Gerar template Bootstrap complexo
      const template = testGenerator.generateBootstrapTemplate();

      // Medir desempenho e memória
      const startMemory = process.memoryUsage().heapUsed;
      const startTime = performance.now();
      
      // Renderizar com SmartRenderer
      const result = await smartRenderer.render(template);
      
      const endTime = performance.now();
      const endMemory = process.memoryUsage().heapUsed;
      
      // Verificar performance e memória
      const renderTime = endTime - startTime;
      const memoryUsed = (endMemory - startMemory) / 1024 / 1024; // MB
      
      console.log(`Renderização Bootstrap: ${renderTime.toFixed(2)}ms, Memória: ${memoryUsed.toFixed(2)}MB`);
      
      // Verificar estrutura básica do resultado
      expect(result).to.include('<!DOCTYPE html>');
      expect(result).to.include('bootstrap');
      expect(result).to.include('</html>');
      
      // Salvar resultado para inspeção visual
      const outputPath = path.join(testConfig.outputDir, 'bootstrap-rendered.html');
      fs.writeFileSync(outputPath, result);
      
      // Registrar métricas
      const metricsFile = path.join(testConfig.outputDir, 'bootstrap-performance.json');
      const metrics = {
        templateSize: template.length,
        renderTime,
        memoryUsed,
        timestamp: new Date().toISOString()
      };
      
      fs.writeFileSync(metricsFile, JSON.stringify(metrics, null, 2));
    });
  });
});
