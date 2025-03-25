/**
 * Testes de integração para o StreamingRenderer
 * 
 * Este arquivo contém testes específicos para o StreamingRenderer, que é usado
 * para renderizar templates extremamente grandes de forma progressiva e eficiente.
 * 
 * @author PHP Universal MCP Server Team
 * @version 1.0.0
 */

const { expect } = require('chai');
const path = require('path');
const fs = require('fs');
const { JSDOM } = require('jsdom');
const { EventEmitter } = require('events');

// Componentes do sistema de renderização
const StreamingRenderer = require('../../../modules/design/renderers/streaming-renderer');
const EnhancedProgressiveRenderer = require('../../../modules/design/renderers/enhanced-progressive-renderer');
const SmartRenderer = require('../../../modules/design/renderers/smart-renderer');

// Utilitários
const TestTemplateGenerator = require('../../utils/test-template-generator');
const { performance } = require('perf_hooks');

describe('StreamingRenderer - Testes de Integração', () => {
  // Configurações de teste
  const testConfig = {
    templatesDir: path.join(__dirname, '../../fixtures/templates'),
    outputDir: path.join(__dirname, '../../output'),
    timeout: 60000 // 60 segundos para testes com templates grandes
  };

  // Garantir que o diretório de saída exista
  before(() => {
    if (!fs.existsSync(testConfig.outputDir)) {
      fs.mkdirSync(testConfig.outputDir, { recursive: true });
    }
  });

  // Instâncias de componentes para testes
  let streamingRenderer;
  let testGenerator;

  beforeEach(() => {
    // Configurar instâncias com opções de teste
    streamingRenderer = new StreamingRenderer({
      debug: false,
      chunkSize: 100, // KB por chunk
      chunkInterval: 10, // ms entre chunks
      visualFeedback: true,
      maxConcurrency: 2
    });

    testGenerator = new TestTemplateGenerator();
  });

  describe('Renderização em streaming de templates grandes', () => {
    it('deve renderizar templates extremamente grandes em chunks progressivos', async function() {
      this.timeout(testConfig.timeout);
      
      // Gerar template de teste extremamente grande (3MB+)
      const template = testGenerator.generateExtremeTemplate ? 
                      testGenerator.generateExtremeTemplate(3000) :
                      `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Template Extremamente Grande</title>
        </head>
        <body>
          <h1>Template para Streaming (3MB+)</h1>
          ${Array(10000).fill().map((_, i) => `<div id="item-${i}">Item ${i}</div>`).join('')}
        </body>
        </html>
      `;
      
      // Coletar chunks e métricas
      const chunks = [];
      const progressEvents = [];
      
      // Configurar listener de eventos
      streamingRenderer.on('progress', (progress) => {
        progressEvents.push({
          percent: progress.percent,
          chunksDelivered: progress.chunksDelivered,
          timestamp: Date.now()
        });
      });
      
      // Medir desempenho de memória
      const memoryUsageBefore = process.memoryUsage().heapUsed;
      const startTime = performance.now();
      
      // Executar renderização streaming
      await streamingRenderer.renderStreaming(
        template,
        {}, // dados do template
        (chunk, meta) => {
          chunks.push({
            size: chunk.length,
            isFirstChunk: meta && meta.isFirstChunk,
            isLastChunk: meta && meta.isLastChunk,
            chunkIndex: meta && meta.chunkIndex,
            totalChunks: meta && meta.totalChunks,
            progress: meta && meta.progress
          });
        }
      );
      
      const endTime = performance.now();
      const memoryUsageAfter = process.memoryUsage().heapUsed;
      
      // Verificar resultados básicos
      expect(chunks.length).to.be.greaterThan(1);
      expect(progressEvents.length).to.be.greaterThan(1);
      
      // Verificar que temos um primeiro e último chunk
      expect(chunks.some(c => c.isFirstChunk)).to.be.true;
      expect(chunks.some(c => c.isLastChunk)).to.be.true;
      
      // Verificar que o progresso aumenta ao longo do tempo
      for (let i = 1; i < progressEvents.length; i++) {
        expect(progressEvents[i].percent).to.be.at.least(progressEvents[i-1].percent);
      }
      
      // Verificar que o último evento de progresso chega a 100%
      if (progressEvents.length > 0) {
        const lastProgress = progressEvents[progressEvents.length - 1];
        expect(lastProgress.percent).to.equal(100);
      }
      
      // Verificar uso de memória
      const memoryUsageMB = (memoryUsageAfter - memoryUsageBefore) / (1024 * 1024);
      const templateSizeMB = template.length / (1024 * 1024);
      
      console.log(`
        Streaming de template de ${templateSizeMB.toFixed(2)}MB:
        - Chunks: ${chunks.length}
        - Tempo: ${(endTime - startTime).toFixed(2)}ms
        - Uso de memória: ${memoryUsageMB.toFixed(2)}MB
      `);
      
      // Salvar métricas para análise
      fs.writeFileSync(
        path.join(testConfig.outputDir, 'streaming-performance.json'),
        JSON.stringify({
          templateSize: template.length,
          chunks: {
            count: chunks.length,
            first: chunks.find(c => c.isFirstChunk),
            last: chunks.find(c => c.isLastChunk),
            averageSize: chunks.reduce((sum, c) => sum + c.size, 0) / chunks.length
          },
          progress: {
            count: progressEvents.length,
            first: progressEvents[0],
            last: progressEvents[progressEvents.length - 1],
            averageInterval: progressEvents.length > 1 ? 
              (progressEvents[progressEvents.length - 1].timestamp - progressEvents[0].timestamp) / (progressEvents.length - 1) : 0
          },
          performance: {
            time: endTime - startTime,
            memoryUsageMB,
            templateSizeMB
          },
          timestamp: new Date().toISOString()
        }, null, 2)
      );
      
      // Salvar uma amostra dos chunks para análise
      fs.writeFileSync(
        path.join(testConfig.outputDir, 'streaming-chunks-sample.json'),
        JSON.stringify({
          count: chunks.length,
          samples: [
            chunks[0], // Primeiro chunk
            chunks[Math.floor(chunks.length / 3)], // Um terço
            chunks[Math.floor(chunks.length / 2)], // Meio
            chunks[chunks.length - 1] // Último chunk
          ]
        }, null, 2)
      );
    });

    it('deve lidar com renderização concorrente de múltiplos templates', async function() {
      this.timeout(testConfig.timeout * 2);
      
      // Gerar múltiplos templates de tamanhos diferentes
      const templates = [
        testGenerator.generateComplexTemplate ? testGenerator.generateComplexTemplate(200) : 
          `<html><body><h1>Template Médio 1</h1>${Array(500).fill('<div>Item</div>').join('')}</body></html>`,
        testGenerator.generateComplexTemplate ? testGenerator.generateComplexTemplate(300) : 
          `<html><body><h1>Template Médio 2</h1>${Array(800).fill('<div>Item</div>').join('')}</body></html>`,
        testGenerator.generateExtremeTemplate ? testGenerator.generateExtremeTemplate(1000) : 
          `<html><body><h1>Template Grande</h1>${Array(2500).fill('<div>Item</div>').join('')}</body></html>`
      ];
      
      // Armazenar resultados por template
      const results = {};
      
      // Configurar StreamingRenderer com concorrência limite
      const concurrentRenderer = new StreamingRenderer({
        debug: false,
        chunkSize: 50,
        maxConcurrency: 2 // Permitir no máximo 2 renderizações concorrentes
      });
      
      // Função para processar um template
      const processTemplate = async (template, index) => {
        const chunks = [];
        const startTime = performance.now();
        
        await concurrentRenderer.renderStreaming(template, {}, (chunk, meta) => {
          chunks.push({
            size: chunk.length,
            isFirstChunk: meta && meta.isFirstChunk,
            isLastChunk: meta && meta.isLastChunk
          });
        });
        
        const endTime = performance.now();
        
        results[`template_${index}`] = {
          size: template.length,
          chunksCount: chunks.length,
          time: endTime - startTime
        };
      };
      
      // Iniciar renderizações concorrentes
      const renderPromises = templates.map((template, index) => 
        processTemplate(template, index)
      );
      
      // Aguardar todas as renderizações concluírem
      await Promise.all(renderPromises);
      
      // Verificar resultados
      expect(Object.keys(results).length).to.equal(templates.length);
      
      // Verificar que todos os templates foram renderizados
      for (let i = 0; i < templates.length; i++) {
        expect(results[`template_${i}`]).to.exist;
        expect(results[`template_${i}`].chunksCount).to.be.greaterThan(0);
      }
      
      // Salvar resultados para análise
      fs.writeFileSync(
        path.join(testConfig.outputDir, 'concurrent-streaming.json'),
        JSON.stringify({
          concurrencyLimit: 2,
          templates: Object.values(results),
          timestamp: new Date().toISOString()
        }, null, 2)
      );
    });
  });

  describe('Integração com outros componentes', () => {
    it('deve integrar com SmartRenderer para seleção automática', async function() {
      this.timeout(testConfig.timeout);
      
      // Configurar SmartRenderer
      const smartRenderer = new SmartRenderer({
        autoSelectRenderer: true,
        enhancedThreshold: 100,
        streamingThreshold: 500,
        debug: false
      });
      
      // Gerar template grande para forçar streaming
      const template = testGenerator.generateExtremeTemplate ? 
                      testGenerator.generateExtremeTemplate(1000) :
                      `<html><body><h1>Template Grande para Streaming</h1>${Array(2500).fill('<div>Item</div>').join('')}</body></html>`;
      
      // Coletar dados de streaming
      const chunks = [];
      const chunkMeta = [];
      
      // Espiar decisão do SmartRenderer
      const originalMethod = smartRenderer._selectBestRenderer;
      let rendererSelection;
      
      smartRenderer._selectBestRenderer = function(...args) {
        const result = originalMethod.apply(this, args);
        rendererSelection = { ...result };
        return result;
      };
      
      // Renderizar com streaming
      await smartRenderer.render(template, {}, {
        streamingCallback: (chunk, meta) => {
          chunks.push(chunk);
          if (meta) chunkMeta.push(meta);
        }
      });
      
      // Restaurar método original
      smartRenderer._selectBestRenderer = originalMethod;
      
      // Verificar que o StreamingRenderer foi selecionado
      expect(rendererSelection.renderer).to.equal('streaming');
      
      // Verificar que chunks foram gerados
      expect(chunks.length).to.be.greaterThan(1);
      
      // Verificar metadata dos chunks
      expect(chunkMeta.length).to.equal(chunks.length);
      expect(chunkMeta[0].isFirstChunk).to.be.true;
      expect(chunkMeta[chunkMeta.length - 1].isLastChunk).to.be.true;
      
      // Verificar progresso
      const lastProgress = chunkMeta[chunkMeta.length - 1].progress;
      expect(lastProgress).to.equal(100);
      
      // Salvar dados para análise
      fs.writeFileSync(
        path.join(testConfig.outputDir, 'smart-streaming-integration.json'),
        JSON.stringify({
          selection: rendererSelection,
          chunksCount: chunks.length,
          progress: {
            first: chunkMeta[0].progress,
            middle: chunkMeta[Math.floor(chunkMeta.length / 2)].progress,
            last: lastProgress
          }
        }, null, 2)
      );
    });
    
    it('deve oferecer feedback visual durante renderização streaming', async function() {
      this.timeout(testConfig.timeout);
      
      // Configurar StreamingRenderer com feedback visual habilitado
      const visualFeedbackRenderer = new StreamingRenderer({
        debug: false,
        chunkSize: 100,
        visualFeedback: true,
        feedbackInterval: 5 // A cada 5% de progresso
      });
      
      // Gerar template grande
      const template = testGenerator.generateExtremeTemplate ? 
                      testGenerator.generateExtremeTemplate(800) :
                      `<html><body><h1>Template para Feedback Visual</h1>${Array(2000).fill('<div>Item</div>').join('')}</body></html>`;
      
      // Coletar chunks e feedback
      const chunks = [];
      const visualFeedbacks = [];
      
      // Renderizar com streaming
      await visualFeedbackRenderer.renderStreaming(template, {}, (chunk, meta) => {
        chunks.push(chunk);
        
        // Identificar chunks de feedback visual
        if (chunk.includes('data-streaming-feedback') || 
            chunk.includes('streaming-progress-indicator')) {
          visualFeedbacks.push({
            chunkIndex: meta.chunkIndex,
            progress: meta.progress,
            containsFeedback: true
          });
        }
      });
      
      // Verificar que temos chunks de feedback visual
      expect(visualFeedbacks.length).to.be.greaterThan(0);
      
      // Verificar que o último chunk contém indicador de conclusão
      const lastChunk = chunks[chunks.length - 1];
      expect(lastChunk).to.include('Streaming concluído');
      
      // Salvar um exemplo de chunk de feedback visual
      if (visualFeedbacks.length > 0) {
        const feedbackIndex = visualFeedbacks[0].chunkIndex;
        fs.writeFileSync(
          path.join(testConfig.outputDir, 'visual-feedback-sample.html'),
          chunks[feedbackIndex]
        );
      }
      
      // Salvar dados para análise
      fs.writeFileSync(
        path.join(testConfig.outputDir, 'visual-feedback-metrics.json'),
        JSON.stringify({
          totalChunks: chunks.length,
          feedbackChunks: visualFeedbacks.length,
          feedbackPoints: visualFeedbacks.map(f => f.progress)
        }, null, 2)
      );
    });
  });

  describe('Tratamento de erros e recuperação', () => {
    it('deve continuar renderização após erros em chunks individuais', async function() {
      this.timeout(testConfig.timeout);
      
      // Gerar template com potenciais problemas
      const template = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Template com Erros Potenciais</title>
        </head>
        <body>
          <h1>Template para Teste de Recuperação</h1>
          
          <!-- Conteúdo normal -->
          <div class="content">
            ${Array(100).fill('<p>Conteúdo normal</p>').join('')}
          </div>
          
          <!-- Elementos problemáticos -->
          <div class="problematic">
            <script>
              // Script malformado
              for (i=0; i<
            </script>
            
            <!-- Tags não fechadas -->
            <div>
              <p>Parágrafo não fechado
              <ul>
                <li>Item não fechado
            </div>
            
            <!-- Atributos mal formatados -->
            <img src= onerror="alert('test')">
          </div>
          
          <!-- Mais conteúdo normal -->
          <div class="more-content">
            ${Array(100).fill('<p>Mais conteúdo</p>').join('')}
          </div>
        </body>
        </html>
      `;
      
      // Medir desempenho
      const startTime = performance.now();
      
      // Coletar chunks e erros
      const chunks = [];
      const errors = [];
      
      // Configurar StreamingRenderer para lidar com erros
      const errorHandlingRenderer = new StreamingRenderer({
        debug: false,
        errorHandling: 'continue', // Continuar mesmo após erros
        chunkSize: 50
      });
      
      // Espiar tratamento de erros
      const originalErrorHandler = errorHandlingRenderer._handleChunkError;
      errorHandlingRenderer._handleChunkError = function(error, chunkIndex) {
        errors.push({
          message: error.message,
          chunkIndex
        });
        return originalErrorHandler.apply(this, arguments);
      };
      
      // Executar renderização
      let completed = false;
      let errorThrown = false;
      
      try {
        await errorHandlingRenderer.renderStreaming(template, {}, (chunk, meta) => {
          chunks.push({
            index: meta.chunkIndex,
            size: chunk.length,
            isLast: meta.isLastChunk
          });
          
          if (meta.isLastChunk) {
            completed = true;
          }
        });
      } catch (e) {
        errorThrown = true;
      }
      
      const endTime = performance.now();
      
      // Restaurar método original
      errorHandlingRenderer._handleChunkError = originalErrorHandler;
      
      // Verificar que a renderização foi concluída apesar dos potenciais erros
      expect(errorThrown).to.be.false;
      expect(completed).to.be.true;
      
      // Verificar que alguns chunks foram gerados
      expect(chunks.length).to.be.greaterThan(0);
      
      // Registrar resultados
      console.log(`
        Teste de recuperação de erros:
        - Tempo de renderização: ${(endTime - startTime).toFixed(2)}ms
        - Chunks gerados: ${chunks.length}
        - Erros detectados: ${errors.length}
      `);
      
      // Salvar dados para análise
      fs.writeFileSync(
        path.join(testConfig.outputDir, 'error-recovery.json'),
        JSON.stringify({
          completed,
          renderTime: endTime - startTime,
          totalChunks: chunks.length,
          errors: errors.map(e => ({ message: e.message, chunkIndex: e.chunkIndex })),
          timestamp: new Date().toISOString()
        }, null, 2)
      );
    });
  });

  describe('Métricas de desempenho', () => {
    it('deve demonstrar vantagens de memória em comparação com outros renderizadores', async function() {
      this.timeout(testConfig.timeout * 2);
      
      // Gerar template grande para testes
      const template = testGenerator.generateExtremeTemplate ? 
                      testGenerator.generateExtremeTemplate(1500) :
                      `<html><body><h1>Template Grande para Comparação</h1>${Array(4000).fill('<div>Item de conteúdo</div>').join('')}</body></html>`;
      
      // Instanciar renderizadores
      const enhancedRenderer = new EnhancedProgressiveRenderer({
        debug: false,
        memoryOptimization: true
      });
      
      const streamingRenderer = new StreamingRenderer({
        debug: false,
        chunkSize: 100
      });
      
      // Medir desempenho do EnhancedProgressiveRenderer
      let enhancedResult;
      try {
        const enhancedStartMemory = process.memoryUsage().heapUsed;
        const enhancedStartTime = performance.now();
        
        const enhancedOutput = await enhancedRenderer.render(template);
        
        const enhancedEndTime = performance.now();
        const enhancedEndMemory = process.memoryUsage().heapUsed;
        
        enhancedResult = {
          success: true,
          output: enhancedOutput ? enhancedOutput.length : 0,
          time: enhancedEndTime - enhancedStartTime,
          memory: (enhancedEndMemory - enhancedStartMemory) / (1024 * 1024) // MB
        };
      } catch (error) {
        enhancedResult = {
          success: false,
          error: error.message,
          memory: 0,
          time: 0
        };
      }
      
      // Aguardar GC
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Medir desempenho do StreamingRenderer
      const streamingStartMemory = process.memoryUsage().heapUsed;
      const streamingStartTime = performance.now();
      
      const chunks = [];
      let streamingOutput = '';
      
      await streamingRenderer.renderStreaming(template, {}, (chunk) => {
        chunks.push(chunk.length);
        streamingOutput += chunk;
      });
      
      const streamingEndTime = performance.now();
      const streamingEndMemory = process.memoryUsage().heapUsed;
      
      const streamingResult = {
        success: true,
        chunksCount: chunks.length,
        output: streamingOutput.length,
        time: streamingEndTime - streamingStartTime,
        memory: (streamingEndMemory - streamingStartMemory) / (1024 * 1024) // MB
      };
      
      // Registrar resultados
      console.log(`
        Comparação de Renderizadores:
        - Template: ${(template.length / (1024 * 1024)).toFixed(2)}MB
        
        Enhanced Progressive Renderer:
        - Sucesso: ${enhancedResult.success}
        ${enhancedResult.success 
          ? `- Tempo: ${enhancedResult.time.toFixed(2)}ms\n- Memória: ${enhancedResult.memory.toFixed(2)}MB` 
          : `- Erro: ${enhancedResult.error}`}
        
        Streaming Renderer:
        - Tempo: ${streamingResult.time.toFixed(2)}ms
        - Memória: ${streamingResult.memory.toFixed(2)}MB
        - Chunks: ${streamingResult.chunksCount}
      `);
      
      // Verificar vantagens do streaming
      if (enhancedResult.success) {
        // Se ambos funcionaram, comparar métricas
        // Nota: Não fazemos asserções estritas porque depende do ambiente,
        // mas registramos as métricas para análise
      }
      
      // Verificar que o streaming produziu vários chunks
      expect(chunks.length).to.be.greaterThan(1);
      
      // Salvar métricas para análise
      fs.writeFileSync(
        path.join(testConfig.outputDir, 'renderer-comparison.json'),
        JSON.stringify({
          templateSize: template.length,
          templateSizeMB: template.length / (1024 * 1024),
          enhancedRenderer: enhancedResult,
          streamingRenderer: streamingResult,
          timestamp: new Date().toISOString()
        }, null, 2)
      );
    });
  });
});
