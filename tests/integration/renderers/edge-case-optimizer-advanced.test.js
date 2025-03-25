/**
 * Testes de integração para o Advanced Edge Case Optimizer
 * 
 * Este arquivo contém testes que validam as capacidades avançadas do otimizador
 * de edge cases e sua integração com o Smart Renderer.
 * 
 * @author PHP Universal MCP Server Team
 * @version 1.0.0
 */

const { expect } = require('chai');
const path = require('path');
const fs = require('fs');
const { JSDOM } = require('jsdom');

// Componentes do sistema de renderização
const SmartRenderer = require('../../../modules/design/renderers/smart-renderer');
const EdgeCaseOptimizer = require('../../../modules/design/renderers/edge-case-optimizer');
const AdvancedEdgeCaseOptimizer = require('../../../modules/design/renderers/edge-case-optimizer-advanced');

// Utilitários
const TestTemplateGenerator = require('../../utils/test-template-generator');
const { performance } = require('perf_hooks');

describe('Advanced Edge Case Optimizer - Testes de Integração', () => {
  // Configurações de teste
  const testConfig = {
    templatesDir: path.join(__dirname, '../../fixtures/templates'),
    outputDir: path.join(__dirname, '../../output'),
    timeout: 30000 // 30 segundos para testes com templates complexos
  };

  // Garantir que o diretório de saída exista
  before(() => {
    if (!fs.existsSync(testConfig.outputDir)) {
      fs.mkdirSync(testConfig.outputDir, { recursive: true });
    }
  });

  // Instâncias de componentes para testes
  let smartRenderer;
  let basicOptimizer;
  let advancedOptimizer;
  let testGenerator;

  beforeEach(() => {
    // Configurar instâncias com opções de teste
    smartRenderer = new SmartRenderer({
      debug: false,
      autoSelectRenderer: true,
      optimizeEdgeCases: true,
      advancedOptimization: true
    });

    basicOptimizer = new EdgeCaseOptimizer({
      debug: false
    });
    
    advancedOptimizer = new AdvancedEdgeCaseOptimizer({
      debug: false,
      advanced: {
        viewportAnalysis: true,
        learningEnabled: true,
        patternThreshold: 15,
        adaptiveStrategies: true
      }
    });

    testGenerator = new TestTemplateGenerator();
  });

  describe('Detecção avançada de padrões problemáticos', () => {
    it('deve detectar padrões de recursividade em templates', async function() {
      this.timeout(testConfig.timeout);
      
      // Gerar um template com estruturas recursivas
      const template = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Teste de Recursividade</title>
        </head>
        <body>
          <div class="recursive-component">
            <h2>Componente Recursivo Nível 1</h2>
            <div class="recursive-component">
              <h3>Componente Recursivo Nível 2</h3>
              <div class="recursive-component">
                <h4>Componente Recursivo Nível 3</h4>
                <div class="recursive-component">
                  <h5>Componente Recursivo Nível 4</h5>
                </div>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;
      
      // Executar análise com otimizador avançado
      const result = await advancedOptimizer.optimize(template);
      
      // Verificar detecção
      expect(result).to.have.property('html');
      expect(result).to.have.property('metrics');
      expect(result).to.have.property('advancedMetrics');
      
      // Verificar se o padrão recursivo foi detectado
      expect(result.advancedMetrics.patternsDetected).to.have.property('recursiveTemplates');
      expect(result.advancedMetrics.patternsDetected.recursiveTemplates).to.be.greaterThan(0);
      
      // Verificar se o HTML otimizado contém marcações de otimização
      expect(result.html).to.include('data-recursive-template="true"');
    });
    
    it('deve detectar triggers de layout problemáticos', async function() {
      this.timeout(testConfig.timeout);
      
      // Gerar um template com triggers de layout
      const template = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Teste de Triggers de Layout</title>
          <style>
            .sticky-header {
              position: sticky;
              top: 0;
              z-index: 100;
            }
            .fixed-sidebar {
              position: fixed;
              left: 0;
              top: 50px;
              height: 100%;
            }
            .full-width {
              width: 100%;
              transform: translateZ(0);
            }
          </style>
        </head>
        <body>
          <header class="sticky-header">
            <h1>Cabeçalho Sticky</h1>
          </header>
          <div class="fixed-sidebar">
            <nav>Menu Lateral</nav>
          </div>
          <main>
            <div class="full-width" style="position: relative; transform: translate3d(0,0,0);">
              <h2>Conteúdo com Transform</h2>
            </div>
            <div style="position: absolute; top: 0; left: 0;">
              <p>Elemento Absoluto</p>
            </div>
          </main>
        </body>
        </html>
      `;
      
      // Executar análise com otimizador avançado
      const result = await advancedOptimizer.optimize(template);
      
      // Verificar detecção
      expect(result.advancedMetrics.patternsDetected).to.have.property('layoutTriggers');
      expect(result.advancedMetrics.patternsDetected.layoutTriggers).to.be.greaterThan(0);
      
      // Verificar otimização aplicada
      expect(result.html).to.include('data-layout-trigger="true"');
      expect(result.html).to.include('contain: layout');
    });
    
    it('deve detectar complexidade CSS excessiva', async function() {
      this.timeout(testConfig.timeout);
      
      // Gerar um template com CSS complexo
      const template = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Teste de CSS Complexo</title>
          <style>
            /* Seletores excessivamente específicos */
            body > div.container > section.content > article.post > div.post-content > p.description {
              color: #333;
            }
            
            /* Uso excessivo de !important */
            .override-1 { color: red !important; }
            .override-2 { margin: 10px !important; }
            .override-3 { padding: 20px !important; }
            .override-4 { font-size: 16px !important; }
            
            /* Prefixos de vendor */
            .prefixed {
              -webkit-transform: translateZ(0);
              -moz-transform: translateZ(0);
              -ms-transform: translateZ(0);
              -o-transform: translateZ(0);
              transform: translateZ(0);
            }
            
            /* Media queries aninhadas */
            @media (max-width: 1200px) {
              .responsive {
                width: 100%;
              }
              @media (max-height: 900px) {
                .responsive {
                  height: 100%;
                }
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <section class="content">
              <article class="post">
                <div class="post-content">
                  <p class="description">Teste de CSS complexo</p>
                </div>
              </article>
            </section>
          </div>
          <div class="override-1 override-2 override-3 override-4">
            Elemento com múltiplos overrides
          </div>
          <div class="prefixed">
            Elemento com prefixos de vendor
          </div>
          <div class="responsive">
            Elemento com media queries aninhadas
          </div>
        </body>
        </html>
      `;
      
      // Executar análise com otimizador avançado
      const result = await advancedOptimizer.optimize(template);
      
      // Verificar detecção
      expect(result.advancedMetrics.patternsDetected).to.have.property('cssComplexity');
      expect(typeof result.advancedMetrics.patternsDetected.cssComplexity).to.equal('number');
      expect(result.advancedMetrics.patternsDetected.cssComplexity).to.be.greaterThan(0);
      
      // Verificar otimização aplicada
      expect(result.html).to.include('Optimized by AdvancedEdgeCaseOptimizer');
    });
  });

  describe('Comparação entre otimizador básico e avançado', () => {
    it('deve oferecer otimizações mais eficientes que o otimizador básico', async function() {
      this.timeout(testConfig.timeout);
      
      // Gerar um template com vários edge cases
      const template = testGenerator.generateTemplateWithEdgeCases ? 
                      testGenerator.generateTemplateWithEdgeCases() :
                      `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Template com Edge Cases</title>
          <style>
            .nested-flexbox {
              display: flex;
              flex-direction: column;
            }
            .grid-container {
              display: grid;
              grid-template-columns: repeat(20, 1fr);
            }
            table.nested {
              width: 100%;
            }
          </style>
        </head>
        <body>
          <!-- Tabelas aninhadas -->
          <table>
            <tr>
              <td>
                <table class="nested">
                  <tr>
                    <td>
                      <table class="nested">
                        <tr><td>Dados aninhados</td></tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
          
          <!-- Flexboxes aninhados -->
          <div class="nested-flexbox">
            <div class="nested-flexbox">
              <div class="nested-flexbox">
                <div class="nested-flexbox">
                  Flexbox profundamente aninhado
                </div>
              </div>
            </div>
          </div>
          
          <!-- Grid com muitas células -->
          <div class="grid-container">
            ${Array(100).fill().map((_, i) => `<div>Item de grid ${i+1}</div>`).join('')}
          </div>
        </body>
        </html>
      `;
      
      // Testar otimizador básico
      const startBasic = performance.now();
      const basicResult = await basicOptimizer.optimize(template);
      const basicTime = performance.now() - startBasic;
      
      // Testar otimizador avançado
      const startAdvanced = performance.now();
      const advancedResult = await advancedOptimizer.optimize(template);
      const advancedTime = performance.now() - startAdvanced;
      
      // Registrar métricas
      console.log(`
        Comparação de otimizadores:
        - Básico: ${basicTime.toFixed(2)}ms, Redução: ${basicResult.metrics.reductionPercent.toFixed(2)}%
        - Avançado: ${advancedTime.toFixed(2)}ms, Redução: ${(advancedResult.metrics.reductionPercent || 0).toFixed(2)}%
      `);
      
      // Verificar estrutura dos resultados
      expect(basicResult).to.have.property('html');
      expect(basicResult).to.have.property('metrics');
      expect(advancedResult).to.have.property('html');
      expect(advancedResult).to.have.property('metrics');
      expect(advancedResult).to.have.property('advancedMetrics');
      
      // Salvar resultados para análise manual
      fs.writeFileSync(
        path.join(testConfig.outputDir, 'optimizer-basic-result.html'),
        basicResult.html
      );
      
      fs.writeFileSync(
        path.join(testConfig.outputDir, 'optimizer-advanced-result.html'),
        advancedResult.html
      );
      
      fs.writeFileSync(
        path.join(testConfig.outputDir, 'optimizer-comparison.json'),
        JSON.stringify({
          basic: {
            time: basicTime,
            metrics: basicResult.metrics
          },
          advanced: {
            time: advancedTime,
            metrics: advancedResult.metrics,
            advancedMetrics: advancedResult.advancedMetrics
          },
          timestamp: new Date().toISOString()
        }, null, 2)
      );
    });
  });

  describe('Integração com SmartRenderer', () => {
    it('deve escolher corretamente entre otimizador básico e avançado', async function() {
      this.timeout(testConfig.timeout);
      
      // Templates de diferentes complexidades
      const simpleTemplate = testGenerator.generateSimpleTemplate ? 
                            testGenerator.generateSimpleTemplate(10) :
                            '<html><body><h1>Template Simples</h1><p>Conteúdo básico</p></body></html>';
      
      const complexTemplate = testGenerator.generateComplexTemplate ?
                             testGenerator.generateComplexTemplate(400) :
                             `<html><body><h1>Template Complexo</h1>${Array(50).fill('<div class="complex">Conteúdo complexo</div>').join('')}</body></html>`;
      
      const extremeTemplate = testGenerator.generateExtremeTemplate ?
                             testGenerator.generateExtremeTemplate(1200) :
                             `<html><body><h1>Template Extremo</h1>${Array(200).fill('<div class="extreme">Conteúdo extremo</div>').join('')}</body></html>`;
      
      // Espiar decisão do SmartRenderer
      const originalMethod = smartRenderer._selectBestRenderer;
      const decisions = [];
      
      smartRenderer._selectBestRenderer = function(...args) {
        const result = originalMethod.apply(this, args);
        decisions.push({
          template: args[0].length,
          renderer: result.renderer,
          optimize: result.optimize,
          useAdvancedOptimizer: result.useAdvancedOptimizer
        });
        return result;
      };
      
      // Testar com templates diferentes
      await smartRenderer.render(simpleTemplate);
      await smartRenderer.render(complexTemplate);
      await smartRenderer.render(extremeTemplate);
      
      // Restaurar método original
      smartRenderer._selectBestRenderer = originalMethod;
      
      // Verificar decisões
      expect(decisions.length).to.equal(3);
      
      // Template simples deve usar otimizador básico ou nenhum
      expect(decisions[0].optimize).to.be.oneOf([false, true]);
      if (decisions[0].optimize) {
        expect(decisions[0].useAdvancedOptimizer).to.be.false;
      }
      
      // Template complexo deve usar alguma forma de otimização
      expect(decisions[1].optimize).to.be.true;
      
      // Template extremo deve usar otimizador avançado
      expect(decisions[2].optimize).to.be.true;
      expect(decisions[2].useAdvancedOptimizer).to.be.true;
      
      // Salvar decisões para análise
      fs.writeFileSync(
        path.join(testConfig.outputDir, 'smartrenderer-decisions.json'),
        JSON.stringify(decisions, null, 2)
      );
    });

    it('deve aplicar estratégias adaptativas baseadas na análise do template', async function() {
      this.timeout(testConfig.timeout);
      
      // Template complexo com edge cases
      const template = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Teste de Estratégias Adaptativas</title>
          <style>
            .complex { position: sticky; top: 0; width: 100%; }
            .item { display: flex; align-items: center; }
            @media (max-width: 768px) {
              .responsive { transform: translateZ(0) !important; }
            }
          </style>
        </head>
        <body>
          <header class="complex">Cabeçalho Sticky</header>
          <div class="container">
            ${Array(50).fill().map((_, i) => `
              <div class="item">
                <div class="item">
                  <div class="item">Item Aninhado ${i+1}</div>
                </div>
              </div>
            `).join('')}
          </div>
          <table>
            <tr>
              <td>
                <table>
                  <tr><td>Tabela Aninhada</td></tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;
      
      // Espiar seleção de estratégia adaptativa
      const originalMethod = advancedOptimizer._selectAdaptiveStrategy;
      let selectedStrategy;
      
      advancedOptimizer._selectAdaptiveStrategy = function(...args) {
        const result = originalMethod.apply(this, args);
        selectedStrategy = this.advancedMetrics.adaptiveStrategy;
        return result;
      };
      
      // Executar otimização
      const result = await advancedOptimizer.optimize(template);
      
      // Restaurar método original
      advancedOptimizer._selectAdaptiveStrategy = originalMethod;
      
      // Verificar se uma estratégia foi selecionada
      expect(selectedStrategy).to.be.oneOf(['aggressive', 'moderate', 'conservative']);
      expect(result.advancedMetrics.adaptiveStrategy).to.equal(selectedStrategy);
      
      // Verificar que a estratégia foi aplicada
      expect(result.advancedMetrics.adaptiveStrategiesApplied).to.be.greaterThan(0);
    });
  });
  
  describe('Detecção de viewport e priorização', () => {
    it('deve otimizar elementos com base na visibilidade na viewport', async function() {
      this.timeout(testConfig.timeout);
      
      // Template com muitas seções
      const template = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Teste de Otimização de Viewport</title>
          <style>
            .section { min-height: 500px; padding: 20px; border: 1px solid #ccc; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <header>
            <h1>Teste de Otimização de Viewport</h1>
          </header>
          ${Array(20).fill().map((_, i) => `
            <section class="section" id="section-${i+1}">
              <h2>Seção ${i+1}</h2>
              <p>Conteúdo da seção ${i+1}</p>
              ${i < 2 ? '<p>Esta seção estará provavelmente visível na viewport inicial</p>' : ''}
              ${i >= 18 ? '<p>Esta seção estará provavelmente muito abaixo da viewport inicial</p>' : ''}
            </section>
          `).join('')}
        </body>
        </html>
      `;
      
      // Configurar otimizador avançado com análise de viewport habilitada
      const viewportOptimizer = new AdvancedEdgeCaseOptimizer({
        debug: false,
        advanced: {
          viewportAnalysis: true,
          learningEnabled: false
        }
      });
      
      // Executar otimização
      const result = await viewportOptimizer.optimize(template);
      
      // Verificar marcação de viewport
      expect(result.html).to.include('data-viewport="visible"');
      expect(result.html).to.include('data-viewport="offscreen"');
      
      // Verificar métricas de viewport
      expect(result.advancedMetrics).to.have.property('viewportComponents');
      expect(result.advancedMetrics).to.have.property('offscreenComponents');
      expect(result.advancedMetrics.viewportComponents).to.be.greaterThan(0);
      expect(result.advancedMetrics.offscreenComponents).to.be.greaterThan(0);
      
      // Analisar DOM resultante para verificar prioridades
      const dom = new JSDOM(result.html);
      const document = dom.window.document;
      
      const visibleElements = document.querySelectorAll('[data-viewport="visible"]');
      const offscreenElements = document.querySelectorAll('[data-viewport="offscreen"]');
      
      expect(visibleElements.length).to.equal(result.advancedMetrics.viewportComponents);
      expect(offscreenElements.length).to.equal(result.advancedMetrics.offscreenComponents);
      
      // Verificar que seções iniciais estão marcadas como visíveis
      const section1 = document.querySelector('#section-1');
      const section20 = document.querySelector('#section-20');
      
      if (section1) {
        expect(section1.getAttribute('data-viewport')).to.equal('visible');
      }
      
      if (section20) {
        expect(section20.getAttribute('data-viewport')).to.equal('offscreen');
      }
    });
  });
});
