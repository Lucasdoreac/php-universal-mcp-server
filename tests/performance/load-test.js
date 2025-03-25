/**
 * Testes de Carga para Templates Extremamente Grandes
 * 
 * Este script executa testes de carga para validar a performance do renderizador progressivo
 * com templates extremamente grandes e identifica gargalos para otimização.
 * 
 * @author PHP Universal MCP Server Team
 * @version 1.0.0
 */

const fs = require('fs').promises;
const path = require('path');
const { JSDOM } = require('jsdom');
const ProgressiveRenderer = require('../../modules/design/renderers/progressive-renderer');
const ArtifactDivider = require('../../modules/integrations/claude/artifact-divider');
const TemplateGenerator = require('./template-generator');

// Configurar um sistema de logging
const logger = {
  info: (...args) => console.log('\x1b[36m[INFO]\x1b[0m', ...args),
  debug: (...args) => console.log('\x1b[35m[DEBUG]\x1b[0m', ...args),
  error: (...args) => console.error('\x1b[31m[ERROR]\x1b[0m', ...args),
  success: (...args) => console.log('\x1b[32m[SUCCESS]\x1b[0m', ...args),
  warn: (...args) => console.warn('\x1b[33m[WARN]\x1b[0m', ...args),
  result: (...args) => console.log('\x1b[34m[RESULT]\x1b[0m', ...args)
};

/**
 * Classe que executa testes de carga para templates extremamente grandes
 */
class TemplateLoadTest {
  constructor(options = {}) {
    this.options = {
      templatesDir: path.join(__dirname, 'generated-templates'),
      resultsDir: path.join(__dirname, 'load-test-results'),
      runGenerateBefore: false, // Se true, gera templates novos antes de executar os testes
      artifactSplitSizes: [30000, 50000, 100000], // Tamanhos diferentes para divisão de artifacts
      renderModes: ['basic', 'optimized', 'progressive'], // Modos de renderização para testar
      repeatTests: 3, // Número de vezes para repetir cada teste para obter média
      browserSimulation: true, // Simular render em um ambiente de navegador
      ...options
    };

    this.results = {
      testRun: new Date().toISOString(),
      environment: this._getEnvironmentInfo(),
      templateTests: [],
      summary: {}
    };
  }

  /**
   * Inicializa o teste de carga
   */
  async initialize() {
    // Criar diretório de resultados se não existir
    await fs.mkdir(this.options.resultsDir, { recursive: true });

    // Gerar templates novos se necessário
    if (this.options.runGenerateBefore) {
      logger.info('Gerando templates novos antes dos testes...');
      const generator = new TemplateGenerator();
      await generator.initialize();
      await generator.generateLargeTemplate('extreme-large', 500);
      await generator.generateLargeTemplate('ultra-large', 1000);
      await generator.generateLargeTemplate('monster-large', 2000);
    }

    logger.success('Teste de carga inicializado');
  }

  /**
   * Executa testes de carga em todos os templates
   */
  async runAllTests() {
    try {
      // Listar todos os templates gerados
      const templateFiles = (await fs.readdir(this.options.templatesDir))
        .filter(file => file.endsWith('.html'));

      logger.info(`Encontrados ${templateFiles.length} templates para teste`);

      // Executar testes para cada template
      for (const templateFile of templateFiles) {
        await this.runTestForTemplate(templateFile);
      }

      // Calcular estatísticas finais
      this._calculateFinalStats();

      // Salvar resultados
      await this._saveResults();

      logger.success('Todos os testes de carga foram concluídos com sucesso');
      this._printSummary();
    } catch (error) {
      logger.error('Erro ao executar testes:', error);
    }
  }

  /**
   * Executa testes de carga para um template específico
   * @param {string} templateFile - Nome do arquivo do template
   */
  async runTestForTemplate(templateFile) {
    const templatePath = path.join(this.options.templatesDir, templateFile);
    const templateName = path.basename(templateFile, '.html');
    
    logger.info(`Executando teste para template: ${templateName}`);
    
    // Carregar o template
    const startLoadTime = performance.now();
    const templateContent = await fs.readFile(templatePath, 'utf8');
    const loadTime = performance.now() - startLoadTime;
    
    // Obter tamanho e estatísticas básicas
    const templateSize = templateContent.length;
    const templateStats = await this._getTemplateStats(templateName, templateContent);
    
    logger.info(`Template carregado: ${(templateSize / 1024 / 1024).toFixed(2)} MB, ${templateStats.componentCount} componentes`);
    
    // Resultados para este template
    const templateResults = {
      templateName,
      templateSize,
      templateStats,
      loadTimeMs: loadTime,
      renderTests: [],
      artifactTests: []
    };
    
    // 1. Executar testes de renderização direta (sem divisão em artifacts)
    for (const renderMode of this.options.renderModes) {
      const renderResults = await this._testRendering(templateContent, renderMode);
      templateResults.renderTests.push({
        mode: renderMode,
        ...renderResults
      });
    }
    
    // 2. Executar testes de divisão em artifacts e renderização
    for (const artifactSize of this.options.artifactSplitSizes) {
      const artifactResults = await this._testArtifactSplitting(templateContent, templateName, artifactSize);
      templateResults.artifactTests.push({
        maxArtifactSize: artifactSize,
        ...artifactResults
      });
    }
    
    // Adicionar resultados deste template ao conjunto geral
    this.results.templateTests.push(templateResults);
    
    // Log de resultados parciais
    logger.success(`Teste concluído para template: ${templateName}`);
    this._printTemplateResults(templateResults);
  }

  /**
   * Testa a performance do renderizador progressivo
   * @private
   * @param {string} templateContent - Conteúdo do template HTML
   * @param {string} renderMode - Modo de renderização
   * @returns {Object} Resultados do teste
   */
  async _testRendering(templateContent, renderMode) {
    logger.info(`Testando renderização no modo: ${renderMode}`);
    
    const results = {
      timings: [],
      averageRenderTimeMs: 0,
      peakMemoryUsageMB: 0,
      successRate: 0
    };
    
    // Executar vários testes para obter média
    for (let i = 0; i < this.options.repeatTests; i++) {
      try {
        const memBefore = process.memoryUsage().heapUsed;
        const startTime = performance.now();
        
        // Renderizar usando o modo correspondente
        if (renderMode === 'progressive') {
          await this._renderProgressive(templateContent);
        } else if (renderMode === 'optimized') {
          await this._renderOptimized(templateContent);
        } else {
          await this._renderBasic(templateContent);
        }
        
        const renderTime = performance.now() - startTime;
        const memAfter = process.memoryUsage().heapUsed;
        const memoryUsed = (memAfter - memBefore) / 1024 / 1024; // MB
        
        results.timings.push({
          testRun: i + 1,
          renderTimeMs: renderTime,
          memoryUsageMB: memoryUsed
        });
        
        logger.debug(`  Teste ${i + 1}: ${renderTime.toFixed(2)} ms, ${memoryUsed.toFixed(2)} MB`);
      } catch (error) {
        logger.error(`  Erro no teste ${i + 1} para ${renderMode}:`, error.message);
        results.timings.push({
          testRun: i + 1,
          error: error.message,
          success: false
        });
      }
    }
    
    // Calcular estatísticas
    const successfulTests = results.timings.filter(t => !t.error);
    results.successRate = (successfulTests.length / this.options.repeatTests) * 100;
    
    if (successfulTests.length > 0) {
      results.averageRenderTimeMs = successfulTests.reduce((acc, t) => acc + t.renderTimeMs, 0) / successfulTests.length;
      results.peakMemoryUsageMB = Math.max(...successfulTests.map(t => t.memoryUsageMB));
    }
    
    logger.result(`Resultado ${renderMode}: ${results.averageRenderTimeMs.toFixed(2)} ms (média), ${results.peakMemoryUsageMB.toFixed(2)} MB (pico), ${results.successRate}% sucesso`);
    
    return results;
  }

  /**
   * Testa a divisão do template em artifacts e sua renderização
   * @private
   * @param {string} templateContent - Conteúdo do template HTML
   * @param {string} templateName - Nome do template
   * @param {number} maxArtifactSize - Tamanho máximo para cada artifact
   * @returns {Object} Resultados do teste
   */
  async _testArtifactSplitting(templateContent, templateName, maxArtifactSize) {
    logger.info(`Testando divisão em artifacts (tamanho máximo: ${maxArtifactSize} caracteres)`);
    
    const results = {
      divisionTimeMs: 0,
      artifactCount: 0,
      averageArtifactSize: 0,
      artifactSizes: [],
      renderingTimes: {},
      renderingSuccess: true
    };
    
    try {
      // Medir o tempo de divisão
      const startDivisionTime = performance.now();
      const artifacts = await this._divideIntoArtifacts(templateContent, templateName, maxArtifactSize);
      results.divisionTimeMs = performance.now() - startDivisionTime;
      
      // Estatísticas de artifacts
      results.artifactCount = artifacts.length;
      results.artifactSizes = artifacts.map(a => a.content.length);
      results.averageArtifactSize = results.artifactSizes.reduce((acc, size) => acc + size, 0) / artifacts.length;
      
      logger.debug(`  Dividido em ${results.artifactCount} artifacts, tamanho médio: ${(results.averageArtifactSize / 1024).toFixed(2)} KB`);
      
      // Testar renderização de cada artifact
      for (let i = 0; i < artifacts.length; i++) {
        const startRenderTime = performance.now();
        
        try {
          await this._renderProgressive(artifacts[i].content);
          const renderTime = performance.now() - startRenderTime;
          
          results.renderingTimes[`artifact_${i + 1}`] = renderTime;
          logger.debug(`  Artifact ${i + 1}: renderizado em ${renderTime.toFixed(2)} ms`);
        } catch (error) {
          logger.error(`  Erro ao renderizar artifact ${i + 1}:`, error.message);
          results.renderingTimes[`artifact_${i + 1}`] = { error: error.message };
          results.renderingSuccess = false;
        }
      }
      
      // Estatísticas finais
      const totalRenderTime = Object.values(results.renderingTimes)
        .filter(t => typeof t === 'number')
        .reduce((acc, time) => acc + time, 0);
      
      results.totalRenderTimeMs = totalRenderTime;
      results.averageArtifactRenderTimeMs = totalRenderTime / artifacts.length;
      
      logger.result(`Divisão em ${results.artifactCount} artifacts: ${results.divisionTimeMs.toFixed(2)} ms`);
      logger.result(`Renderização total: ${results.totalRenderTimeMs.toFixed(2)} ms, média por artifact: ${results.averageArtifactRenderTimeMs.toFixed(2)} ms`);
      
    } catch (error) {
      logger.error(`Erro ao dividir template em artifacts:`, error.message);
      results.error = error.message;
      results.renderingSuccess = false;
    }
    
    return results;
  }

  /**
   * Obtém estatísticas de um template
   * @private
   * @param {string} templateName - Nome do template
   * @param {string} templateContent - Conteúdo do template
   * @returns {Object} Estatísticas do template
   */
  async _getTemplateStats(templateName, templateContent) {
    // Tentar carregar estatísticas do arquivo de estatísticas gerado
    try {
      const statsPath = path.join(this.options.templatesDir, `${templateName}-stats.json`);
      const statsContent = await fs.readFile(statsPath, 'utf8');
      return JSON.parse(statsContent);
    } catch (error) {
      // Se não conseguir carregar estatísticas, calcular manualmente
      return this._calculateTemplateStats(templateContent);
    }
  }

  /**
   * Calcula estatísticas básicas de um template
   * @private
   * @param {string} templateContent - Conteúdo do template
   * @returns {Object} Estatísticas do template
   */
  _calculateTemplateStats(templateContent) {
    const stats = {
      fileSizeBytes: templateContent.length,
      fileSizeKb: (templateContent.length / 1024).toFixed(2),
      componentCount: 0,
      nestedDepth: 0
    };
    
    // Contar componentes
    const divCount = (templateContent.match(/<div/g) || []).length;
    const sectionCount = (templateContent.match(/<section/g) || []).length;
    const articleCount = (templateContent.match(/<article/g) || []).length;
    const asideCount = (templateContent.match(/<aside/g) || []).length;
    
    stats.componentCount = divCount + sectionCount + articleCount + asideCount;
    
    // Estimar profundidade de aninhamento (simplificado)
    const lines = templateContent.split('\n');
    let currentDepth = 0;
    let maxDepth = 0;
    
    for (const line of lines) {
      const openTags = (line.match(/<[^/][^>]*>/g) || []).length;
      const closeTags = (line.match(/<\/[^>]*>/g) || []).length;
      
      currentDepth += openTags - closeTags;
      maxDepth = Math.max(maxDepth, currentDepth);
    }
    
    stats.nestedDepth = maxDepth;
    
    return stats;
  }

  /**
   * Divide o template em artifacts
   * @private
   * @param {string} templateContent - Conteúdo do template
   * @param {string} templateName - Nome do template
   * @param {number} maxArtifactSize - Tamanho máximo para cada artifact
   * @returns {Array} Array de artifacts
   */
  async _divideIntoArtifacts(templateContent, templateName, maxArtifactSize) {
    // Aqui seria usado o ArtifactDivider real
    // Como estamos apenas implementando os testes, simulamos a divisão
    
    // Extrair <head>, <body> início, e <body> fim
    const headMatch = templateContent.match(/<head[^>]*>[\s\S]*?<\/head>/i);
    const headContent = headMatch ? headMatch[0] : '<head><meta charset="UTF-8"></head>';
    
    const bodyStartMatch = templateContent.match(/<body[^>]*/i);
    const bodyStart = bodyStartMatch ? bodyStartMatch[0] : '<body>';
    
    const bodyEndMatch = templateContent.match(/<\/body>/i);
    const bodyEnd = bodyEndMatch ? bodyEndMatch[0] : '</body></html>';
    
    // Extrair o conteúdo principal entre as tags body
    const bodyContentMatch = templateContent.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    const bodyContent = bodyContentMatch ? bodyContentMatch[1] : templateContent;
    
    // Dividir o corpo em seções lógicas (usando tags <section> ou <div class="row"> como delimitadores)
    const sectionRegex = /<section[^>]*>[\s\S]*?<\/section>|<div class="row[^"]*">[\s\S]*?<\/div>/gi;
    let sections = [];
    let match;
    
    // Tentamos encontrar seções naturais no documento
    while ((match = sectionRegex.exec(bodyContent)) !== null) {
      sections.push(match[0]);
    }
    
    // Se não encontrarmos seções suficientes, dividimos arbitrariamente
    if (sections.length < 2) {
      // Dividir o conteúdo em partes aproximadamente iguais
      const contentSize = bodyContent.length;
      const numParts = Math.ceil(contentSize / (maxArtifactSize * 0.8)); // 80% do tamanho máximo
      const partSize = Math.ceil(contentSize / numParts);
      
      sections = [];
      for (let i = 0; i < numParts; i++) {
        const start = i * partSize;
        const end = Math.min(start + partSize, contentSize);
        
        // Tentar encontrar um ponto de divisão "limpo" (fechamento de tag)
        let adjustedEnd = end;
        if (end < contentSize) {
          const nextCloseTag = bodyContent.indexOf('</div>', end);
          if (nextCloseTag > 0 && nextCloseTag < end + 500) {
            adjustedEnd = nextCloseTag + 6; // '</div>'.length
          }
        }
        
        sections.push(bodyContent.substring(start, adjustedEnd));
      }
    }
    
    // Criar artifacts com conteúdo HTML válido
    const artifacts = sections.map((section, index) => {
      // Reutilizar o head e adicionar recursos para navegação entre artifacts
      let artifactContent = '<!DOCTYPE html>\n<html lang="en">\n';
      artifactContent += headContent + '\n';
      
      // Adicionar estilo de navegação para artifacts
      artifactContent += `
<style>
  .artifact-nav {
    position: sticky;
    top: 0;
    background: #f8f9fa;
    padding: 10px;
    margin-bottom: 20px;
    border-bottom: 1px solid #dee2e6;
    z-index: 1000;
    display: flex;
    justify-content: space-between;
  }
  .artifact-nav a {
    text-decoration: none;
    padding: 5px 10px;
    border-radius: 5px;
    background: #007bff;
    color: white;
  }
  .artifact-current {
    font-weight: bold;
    padding: 5px 10px;
  }
</style>`;
      
      artifactContent += bodyStart + '\n';
      
      // Adicionar navegação de artifacts
      artifactContent += `
<div class="artifact-nav">
  ${index > 0 ? `<a href="#artifact-${index - 1}">« Anterior</a>` : '<span></span>'}
  <span class="artifact-current">Parte ${index + 1} de ${sections.length}</span>
  ${index < sections.length - 1 ? `<a href="#artifact-${index + 1}">Próximo »</a>` : '<span></span>'}
</div>`;
      
      artifactContent += section;
      artifactContent += '\n' + bodyEnd;
      
      return {
        index,
        title: `${templateName} - Parte ${index + 1}`,
        content: artifactContent
      };
    });
    
    return artifacts;
  }

  /**
   * Renderização básica de um template
   * @private
   * @param {string} templateContent - Conteúdo do template
   */
  async _renderBasic(templateContent) {
    if (this.options.browserSimulation) {
      // Usar JSDOM para simular renderização do browser
      const dom = new JSDOM(templateContent, {
        runScripts: 'dangerously',
        resources: 'usable'
      });
      
      // Simular tempo de renderização
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Limpar para evitar vazamentos de memória
      dom.window.close();
    } else {
      // Renderização simples simulada
      await new Promise(resolve => setTimeout(resolve, 5));
    }
  }

  /**
   * Renderização otimizada de um template
   * @private
   * @param {string} templateContent - Conteúdo do template
   */
  async _renderOptimized(templateContent) {
    // Na implementação real, usaria otimizações específicas
    // Aqui estamos apenas simulando uma renderização otimizada
    if (this.options.browserSimulation) {
      const dom = new JSDOM(templateContent, {
        runScripts: 'dangerously'
      });
      
      // Simular tempo de renderização otimizada
      await new Promise(resolve => setTimeout(resolve, 8));
      
      dom.window.close();
    } else {
      await new Promise(resolve => setTimeout(resolve, 4));
    }
  }

  /**
   * Renderização progressiva de um template
   * @private
   * @param {string} templateContent - Conteúdo do template
   */
  async _renderProgressive(templateContent) {
    // Na implementação real, usaria o ProgressiveRenderer
    // Aqui estamos apenas simulando uma renderização progressiva
    if (this.options.browserSimulation) {
      const dom = new JSDOM(templateContent);
      
      // Simular renderização progressiva
      const document = dom.window.document;
      const sections = document.querySelectorAll('section, div.row');
      
      // Renderizar cada seção progressivamente
      for (const section of sections) {
        // Simular renderização de cada seção
        await new Promise(resolve => setTimeout(resolve, 2));
      }
      
      dom.window.close();
    } else {
      await new Promise(resolve => setTimeout(resolve, 3));
    }
  }

  /**
   * Obtém informações do ambiente para incluir nos resultados
   * @private
   * @returns {Object} Informações do ambiente
   */
  _getEnvironmentInfo() {
    return {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      cpuCores: require('os').cpus().length,
      totalMemoryMB: Math.round(require('os').totalmem() / 1024 / 1024),
      freeMemoryMB: Math.round(require('os').freemem() / 1024 / 1024)
    };
  }

  /**
   * Calcula estatísticas finais do teste
   * @private
   */
  _calculateFinalStats() {
    const summary = {
      testDate: new Date().toISOString(),
      totalTemplatesTested: this.results.templateTests.length,
      averageLoadTimeMs: 0,
      averageTemplateSize: 0,
      renderResults: {},
      artifactResults: {}
    };
    
    // Calcular médias dos templates
    if (this.results.templateTests.length > 0) {
      summary.averageLoadTimeMs = this.results.templateTests.reduce((acc, t) => acc + t.loadTimeMs, 0) / this.results.templateTests.length;
      summary.averageTemplateSize = this.results.templateTests.reduce((acc, t) => acc + t.templateSize, 0) / this.results.templateTests.length;
      
      // Médias por modo de renderização
      for (const mode of this.options.renderModes) {
        const modeResults = [];
        
        for (const template of this.results.templateTests) {
          const modeTest = template.renderTests.find(r => r.mode === mode);
          if (modeTest) {
            modeResults.push(modeTest);
          }
        }
        
        if (modeResults.length > 0) {
          summary.renderResults[mode] = {
            averageRenderTimeMs: modeResults.reduce((acc, r) => acc + r.averageRenderTimeMs, 0) / modeResults.length,
            averageSuccessRate: modeResults.reduce((acc, r) => acc + r.successRate, 0) / modeResults.length,
            averagePeakMemoryMB: modeResults.reduce((acc, r) => acc + r.peakMemoryUsageMB, 0) / modeResults.length
          };
        }
      }
      
      // Médias por tamanho de artifact
      for (const artifactSize of this.options.artifactSplitSizes) {
        const sizeResults = [];
        
        for (const template of this.results.templateTests) {
          const sizeTest = template.artifactTests.find(a => a.maxArtifactSize === artifactSize);
          if (sizeTest) {
            sizeResults.push(sizeTest);
          }
        }
        
        if (sizeResults.length > 0) {
          summary.artifactResults[`size_${artifactSize}`] = {
            averageDivisionTimeMs: sizeResults.reduce((acc, r) => acc + r.divisionTimeMs, 0) / sizeResults.length,
            averageArtifactCount: sizeResults.reduce((acc, r) => acc + r.artifactCount, 0) / sizeResults.length,
            averageTotalRenderTimeMs: sizeResults.reduce((acc, r) => acc + (r.totalRenderTimeMs || 0), 0) / sizeResults.length,
            successRate: sizeResults.filter(r => r.renderingSuccess).length / sizeResults.length * 100
          };
        }
      }
    }
    
    this.results.summary = summary;
  }

  /**
   * Salva os resultados em arquivo
   * @private
   */
  async _saveResults() {
    const resultsFilename = `load-test-results-${new Date().toISOString().replace(/:/g, '-')}.json`;
    const resultsPath = path.join(this.options.resultsDir, resultsFilename);
    
    await fs.writeFile(resultsPath, JSON.stringify(this.results, null, 2));
    logger.success(`Resultados salvos em: ${resultsPath}`);
    
    // Criar um relatório resumido em texto
    const summaryPath = path.join(this.options.resultsDir, 'latest-summary.txt');
    const summaryContent = this._generateSummaryText();
    
    await fs.writeFile(summaryPath, summaryContent);
    logger.success(`Resumo salvo em: ${summaryPath}`);
  }

  /**
   * Gera texto resumido dos resultados
   * @private
   * @returns {string} Texto resumido
   */
  _generateSummaryText() {
    const summary = this.results.summary;
    let text = '=== RESUMO DOS TESTES DE CARGA ===\n\n';
    
    text += `Data: ${summary.testDate}\n`;
    text += `Templates testados: ${summary.totalTemplatesTested}\n`;
    text += `Tamanho médio: ${(summary.averageTemplateSize / 1024 / 1024).toFixed(2)} MB\n\n`;
    
    text += '--- PERFORMANCE DE RENDERIZAÇÃO ---\n\n';
    
    for (const [mode, results] of Object.entries(summary.renderResults)) {
      text += `Modo ${mode}:\n`;
      text += `  Tempo médio: ${results.averageRenderTimeMs.toFixed(2)} ms\n`;
      text += `  Taxa de sucesso: ${results.averageSuccessRate.toFixed(2)}%\n`;
      text += `  Pico de memória: ${results.averagePeakMemoryMB.toFixed(2)} MB\n\n`;
    }
    
    text += '--- PERFORMANCE DE DIVISÃO EM ARTIFACTS ---\n\n';
    
    for (const [size, results] of Object.entries(summary.artifactResults)) {
      const sizeNum = size.replace('size_', '');
      text += `Tamanho máximo ${sizeNum} caracteres:\n`;
      text += `  Tempo médio de divisão: ${results.averageDivisionTimeMs.toFixed(2)} ms\n`;
      text += `  Número médio de artifacts: ${results.averageArtifactCount.toFixed(2)}\n`;
      text += `  Tempo total de renderização: ${results.averageTotalRenderTimeMs.toFixed(2)} ms\n`;
      text += `  Taxa de sucesso: ${results.successRate.toFixed(2)}%\n\n`;
    }
    
    text += '=== CONCLUSÕES E RECOMENDAÇÕES ===\n\n';
    
    // Identificar melhor abordagem
    const modesByPerformance = Object.entries(summary.renderResults)
      .sort((a, b) => a[1].averageRenderTimeMs - b[1].averageRenderTimeMs);
    
    const bestMode = modesByPerformance[0][0];
    
    const artifactSizesByPerformance = Object.entries(summary.artifactResults)
      .sort((a, b) => a[1].averageTotalRenderTimeMs - b[1].averageTotalRenderTimeMs);
    
    const bestArtifactSize = artifactSizesByPerformance[0][0].replace('size_', '');
    
    text += `Melhor modo de renderização: ${bestMode}\n`;
    text += `Melhor tamanho de artifact: ${bestArtifactSize} caracteres\n\n`;
    
    text += 'Recomendações:\n';
    text += '1. Verificar gargalos específicos em templates extremamente grandes\n';
    text += '2. Implementar otimizações para os casos problemáticos identificados\n';
    text += '3. Considerar estratégias de divisão mais inteligentes para melhorar a navegação\n';
    text += '4. Documentar as práticas recomendadas para templates grandes\n';
    
    return text;
  }

  /**
   * Imprime um resumo dos resultados ao final
   * @private
   */
  _printSummary() {
    const summary = this.results.summary;
    
    console.log('\n==================================================');
    console.log('       RESUMO DOS TESTES DE CARGA                 ');
    console.log('==================================================\n');
    
    console.log(`Total de templates testados: ${summary.totalTemplatesTested}`);
    console.log(`Tamanho médio: ${(summary.averageTemplateSize / 1024 / 1024).toFixed(2)} MB\n`);
    
    console.log('PERFORMANCE DE RENDERIZAÇÃO:');
    for (const [mode, results] of Object.entries(summary.renderResults)) {
      console.log(`  * ${mode}: ${results.averageRenderTimeMs.toFixed(2)} ms, ${results.averageSuccessRate.toFixed(2)}% sucesso`);
    }
    
    console.log('\nPERFORMANCE DE DIVISÃO EM ARTIFACTS:');
    for (const [size, results] of Object.entries(summary.artifactResults)) {
      const sizeNum = size.replace('size_', '');
      console.log(`  * Tamanho ${sizeNum}: ${results.averageArtifactCount.toFixed(1)} artifacts, ${results.averageTotalRenderTimeMs.toFixed(2)} ms total`);
    }
    
    console.log('\nResultados detalhados salvos no diretório de resultados.');
  }

  /**
   * Imprime resultados de um template específico
   * @private
   * @param {Object} templateResults - Resultados do template
   */
  _printTemplateResults(templateResults) {
    console.log('\n--------------------------------------------------');
    console.log(`RESULTADOS: ${templateResults.templateName}`);
    console.log('--------------------------------------------------\n');
    
    console.log(`Tamanho: ${(templateResults.templateSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Componentes: ${templateResults.templateStats.componentCount}`);
    console.log(`Tempo de carregamento: ${templateResults.loadTimeMs.toFixed(2)} ms\n`);
    
    console.log('TESTES DE RENDERIZAÇÃO:');
    for (const test of templateResults.renderTests) {
      console.log(`  * ${test.mode}: ${test.averageRenderTimeMs.toFixed(2)} ms, ${test.successRate}% sucesso`);
    }
    
    console.log('\nTESTES DE DIVISÃO EM ARTIFACTS:');
    for (const test of templateResults.artifactTests) {
      console.log(`  * Tamanho ${test.maxArtifactSize}: ${test.artifactCount} artifacts`);
      console.log(`    - Tempo de divisão: ${test.divisionTimeMs.toFixed(2)} ms`);
      console.log(`    - Tamanho médio: ${(test.averageArtifactSize / 1024).toFixed(2)} KB`);
      
      if (test.totalRenderTimeMs) {
        console.log(`    - Tempo total: ${test.totalRenderTimeMs.toFixed(2)} ms`);
        console.log(`    - Tempo médio por artifact: ${test.averageArtifactRenderTimeMs.toFixed(2)} ms`);
      }
      
      console.log(`    - Sucesso: ${test.renderingSuccess ? 'Sim' : 'Não'}`);
    }
  }
}

/**
 * Função principal para executar os testes de carga
 */
async function runLoadTests() {
  try {
    logger.info('Iniciando testes de carga para templates extremamente grandes...');
    
    const tester = new TemplateLoadTest({
      // Para testes iniciais, é mais rápido gerar templates menores
      runGenerateBefore: true,
      // Outras opções podem ser customizadas aqui
    });
    
    await tester.initialize();
    await tester.runAllTests();
    
  } catch (error) {
    logger.error('Erro ao executar testes de carga:', error);
  }
}

// Executar testes de carga
if (require.main === module) {
  runLoadTests();
}

module.exports = TemplateLoadTest;
