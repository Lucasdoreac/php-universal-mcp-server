/**
 * Benchmarks para Comparação de Renderizadores
 * 
 * Este script executa benchmarks comparativos entre diferentes estratégias
 * de renderização para templates extremamente grandes, utilizando métricas
 * padronizadas de tempo, memória e outros indicadores de desempenho.
 * 
 * @author PHP Universal MCP Server Team
 * @version 1.0.0
 */

const fs = require('fs').promises;
const path = require('path');
const { performance } = require('perf_hooks');
const ProgressiveRenderer = require('../../modules/design/renderers/progressive-renderer');
const EnhancedProgressiveRenderer = require('../../modules/design/renderers/enhanced-progressive-renderer');
const EdgeCaseOptimizer = require('../../modules/design/renderers/edge-case-optimizer');
const MemoryOptimizer = require('../../modules/design/renderers/memory-optimizer');

// Carregar configuração
const CONFIG_PATH = path.join(__dirname, 'config.json');
let config;

/**
 * Classe principal para execução de benchmarks
 */
class RendererBenchmark {
  /**
   * Construtor
   * @param {Object} options - Opções de configuração
   */
  constructor(options = {}) {
    this.options = {
      // Diretório de templates
      templateDir: path.join(__dirname, 'generated-templates'),
      // Diretório de resultados
      resultDir: path.join(__dirname, 'test-results'),
      // Número de iterações para cada teste
      iterations: 3,
      // Timeout para cada renderização (ms)
      timeout: 60000,
      // Renderizadores a testar
      renderersToTest: [
        'progressive',
        'enhanced',
        'edge-optimized',
        'streaming'
      ],
      // Template a testar (null para todos)
      templateToTest: null,
      // Modo de logging
      verbose: false,
      // Forçar nova geração de templates
      forceRegenerate: false,
      ...options
    };

    // Inicializar renderizadores
    this.renderers = {
      'progressive': new ProgressiveRenderer(),
      'enhanced': new EnhancedProgressiveRenderer(),
      'edge-optimized': null, // Inicializado durante a execução
      'streaming': null // Inicializado durante a execução
    };

    // Inicializar otimizadores
    this.optimizers = {
      'edge': new EdgeCaseOptimizer(),
      'memory': new MemoryOptimizer()
    };

    // Resultados
    this.results = {
      summary: {
        totalTemplates: 0,
        templatesProcessed: 0,
        startTime: 0,
        endTime: 0,
        totalErrors: 0
      },
      details: {}
    };

    this.log('Benchmark inicializado com opções:', this.options);
  }

  /**
   * Função de log adaptativa
   * @param  {...any} args - Argumentos para log
   */
  log(...args) {
    if (this.options.verbose) {
      console.log(`[Benchmark ${new Date().toISOString()}]`, ...args);
    }
  }

  /**
   * Executa os benchmarks
   */
  async run() {
    this.results.summary.startTime = Date.now();
    this.log('Iniciando benchmarks');

    try {
      // Carregar configuração global
      await this._loadConfig();

      // Preparar diretórios
      await this._prepareDirectories();

      // Verificar templates disponíveis
      const templates = await this._getTemplates();
      this.results.summary.totalTemplates = templates.length;
      this.log(`Encontrados ${templates.length} templates para teste`);

      if (templates.length === 0) {
        this.log('Nenhum template disponível para teste. Verifique o diretório de templates.');
        return;
      }

      // Filtrar template específico se solicitado
      const templatesToTest = this.options.templateToTest
        ? templates.filter(t => t.includes(this.options.templateToTest))
        : templates;

      if (templatesToTest.length === 0) {
        this.log(`Template "${this.options.templateToTest}" não encontrado`);
        return;
      }

      // Executar benchmark para cada template
      for (const templateFile of templatesToTest) {
        await this._benchmarkTemplate(templateFile);
      }

      // Finalizar e gerar relatório
      this.results.summary.endTime = Date.now();
      await this._generateReport();

      return this.results;
    } catch (error) {
      console.error('Erro durante execução de benchmarks:', error);
      this.results.summary.totalErrors++;
      this.results.summary.endTime = Date.now();

      // Tentar salvar resultados mesmo com erro
      try {
        await this._generateReport();
      } catch (reportError) {
        console.error('Erro ao gerar relatório:', reportError);
      }

      throw error;
    }
  }

  /**
   * Carrega configuração
   * @private
   */
  async _loadConfig() {
    try {
      const configData = await fs.readFile(CONFIG_PATH, 'utf8');
      config = JSON.parse(configData);
      this.log('Configuração carregada com sucesso');
    } catch (error) {
      console.error('Erro ao carregar configuração:', error);
      // Configuração padrão
      config = {
        testConfig: {
          renderModes: [
            {
              name: "basic",
              description: "Renderização básica sem otimizações",
              className: "ProgressiveRenderer"
            },
            {
              name: "progressive",
              description: "Renderização progressiva com priorização de componentes",
              className: "EnhancedProgressiveRenderer"
            }
          ]
        }
      };
    }
  }

  /**
   * Prepara diretórios para os testes
   * @private
   */
  async _prepareDirectories() {
    try {
      // Assegurar que o diretório de resultados existe
      await fs.mkdir(this.options.resultDir, { recursive: true });
      
      // Criar diretório específico para este benchmark
      const timestamp = new Date().toISOString().replace(/:/g, '-');
      this.benchmarkDir = path.join(this.options.resultDir, `benchmark-${timestamp}`);
      await fs.mkdir(this.benchmarkDir, { recursive: true });
      
      this.log(`Diretório de resultados: ${this.benchmarkDir}`);
    } catch (error) {
      console.error('Erro ao preparar diretórios:', error);
      throw error;
    }
  }

  /**
   * Obtém lista de templates disponíveis
   * @returns {Promise<Array<string>>} Lista de arquivos de template
   * @private
   */
  async _getTemplates() {
    try {
      const files = await fs.readdir(this.options.templateDir);
      return files.filter(file => file.endsWith('.html'));
    } catch (error) {
      console.error('Erro ao listar templates:', error);
      return [];
    }
  }

  /**
   * Executa benchmark para um template específico
   * @param {string} templateFile - Arquivo de template
   * @private
   */
  async _benchmarkTemplate(templateFile) {
    this.log(`Iniciando benchmark para "${templateFile}"`);
    
    try {
      // Carregar template
      const templatePath = path.join(this.options.templateDir, templateFile);
      const template = await fs.readFile(templatePath, 'utf8');
      
      const templateName = path.basename(templateFile, '.html');
      this.results.details[templateName] = {
        fileName: templateFile,
        size: template.length,
        renderResults: {},
        errors: []
      };
      
      // Analisar estrutura do template
      await this._analyzeTemplate(templateName, template);
      
      // Executar benchmark para cada renderizador
      for (const rendererName of this.options.renderersToTest) {
        try {
          await this._benchmarkWithRenderer(templateName, template, rendererName);
        } catch (error) {
          console.error(`Erro ao renderizar "${templateName}" com renderizador "${rendererName}":`, error);
          this.results.details[templateName].errors.push({
            renderer: rendererName,
            message: error.message
          });
          this.results.summary.totalErrors++;
        }
      }
      
      // Comparar resultados
      this._compareRendererResults(templateName);
      
      this.results.summary.templatesProcessed++;
      this.log(`Benchmark concluído para "${templateFile}"`);
    } catch (error) {
      console.error(`Erro no benchmark para "${templateFile}":`, error);
      this.results.summary.totalErrors++;
    }
  }

  /**
   * Analisa a estrutura de um template
   * @param {string} templateName - Nome do template
   * @param {string} template - Conteúdo do template
   * @private
   */
  async _analyzeTemplate(templateName, template) {
    this.log(`Analisando estrutura do template "${templateName}"`);
    
    try {
      // Analisar com o otimizador de edge cases
      const analysisResult = await this.optimizers.edge._analyzeTemplate(template);
      
      // Armazenar análise nos resultados
      this.results.details[templateName].analysis = {
        edgeCases: analysisResult.edgeCases,
        domSize: analysisResult.domSize
      };
      
      this.log(`Análise concluída: ${analysisResult.edgeCases.length} casos extremos encontrados`);
    } catch (error) {
      console.error(`Erro ao analisar template "${templateName}":`, error);
      this.results.details[templateName].analysis = {
        error: error.message
      };
    }
  }

  /**
   * Executa benchmark com um renderizador específico
   * @param {string} templateName - Nome do template
   * @param {string} template - Conteúdo do template
   * @param {string} rendererName - Nome do renderizador
   * @private
   */
  async _benchmarkWithRenderer(templateName, template, rendererName) {
    this.log(`Renderizando "${templateName}" com renderizador "${rendererName}"`);
    
    // Preparar renderizador para teste
    let renderer;
    let optimizedTemplate = template;
    let needsSpecialHandling = false;
    
    switch (rendererName) {
      case 'progressive':
        renderer = this.renderers.progressive;
        break;
      case 'enhanced':
        renderer = this.renderers.enhanced;
        break;
      case 'edge-optimized':
        // Primeiro otimizar o template com o edge case optimizer, depois renderizar
        renderer = this.renderers.enhanced;
        needsSpecialHandling = true;
        break;
      case 'streaming':
        // Usar o modo streaming do enhanced renderer
        renderer = this.renderers.enhanced;
        needsSpecialHandling = true;
        break;
      default:
        throw new Error(`Renderizador "${rendererName}" não implementado`);
    }
    
    // Inicializar resultados para este renderizador
    this.results.details[templateName].renderResults[rendererName] = {
      times: [],
      memories: [],
      errors: []
    };
    
    // Aplicar otimização especial se necessário
    if (needsSpecialHandling && rendererName === 'edge-optimized') {
      try {
        const optimizeResult = await this.optimizers.edge.optimize(template);
        optimizedTemplate = optimizeResult.html;
        
        this.results.details[templateName].renderResults[rendererName].optimization = {
          originalSize: template.length,
          optimizedSize: optimizedTemplate.length,
          reductionPercent: optimizeResult.metrics.reductionPercent,
          optimizationsApplied: optimizeResult.metrics.optimizationsApplied
        };
        
        this.log(`Otimização de edge cases: ${optimizeResult.metrics.optimizationsApplied} otimizações aplicadas`);
      } catch (error) {
        console.error(`Erro ao otimizar template para "${rendererName}":`, error);
        this.results.details[templateName].renderResults[rendererName].errors.push({
          phase: 'optimization',
          message: error.message
        });
      }
    }
    
    // Executar renderização com múltiplas iterações
    for (let i = 0; i < this.options.iterations; i++) {
      this.log(`Iteração ${i + 1}/${this.options.iterations}`);
      
      // Garantir limpeza de memória entre testes se possível
      if (typeof global.gc === 'function') {
        global.gc();
      }
      
      // Registrar uso de memória antes
      const memoryBefore = process.memoryUsage();
      
      // Registrar tempo
      const startTime = performance.now();
      let result = null;
      
      try {
        // Renderizar com tratamento especial para streaming
        if (needsSpecialHandling && rendererName === 'streaming') {
          // Os dados de chunks em um array
          const chunks = [];
          
          // Função de callback para receber chunks
          const chunkCallback = (chunk, info) => {
            chunks.push({ chunk, info });
          };
          
          // Renderizar em modo streaming
          await renderer.renderStreaming(optimizedTemplate, {}, chunkCallback);
          
          // Combinar chunks para a saída final
          result = chunks.map(c => c.chunk).join('');
          
          // Registrar métricas de streaming
          this.results.details[templateName].renderResults[rendererName].streaming = {
            chunks: chunks.length,
            chunkSizes: chunks.map(c => c.chunk.length)
          };
        } else {
          // Renderização normal
          result = await renderer.render(optimizedTemplate);
        }
        
        // Registrar tempo final
        const endTime = performance.now();
        const renderTime = endTime - startTime;
        
        // Registrar uso de memória depois
        const memoryAfter = process.memoryUsage();
        const memoryDelta = {
          rss: memoryAfter.rss - memoryBefore.rss,
          heapTotal: memoryAfter.heapTotal - memoryBefore.heapTotal,
          heapUsed: memoryAfter.heapUsed - memoryBefore.heapUsed,
          external: memoryAfter.external - memoryBefore.external
        };
        
        // Verificar resultado
        const successful = typeof result === 'string' && result.length > 0;
        const resultLength = typeof result === 'string' ? result.length : 0;
        
        // Registrar resultados desta iteração
        this.results.details[templateName].renderResults[rendererName].times.push(renderTime);
        this.results.details[templateName].renderResults[rendererName].memories.push(memoryDelta);
        
        this.log(`Renderização concluída em ${renderTime.toFixed(2)}ms, resultado: ${resultLength} bytes`);
        
        if (!successful) {
          this.results.details[templateName].renderResults[rendererName].errors.push({
            iteration: i,
            message: 'Resultado vazio ou inválido'
          });
        }
        
        // Salvar amostra do resultado (apenas primeira iteração)
        if (i === 0 && successful) {
          const resultSample = result.substring(0, 1000) + '... [truncado]';
          this.results.details[templateName].renderResults[rendererName].resultSample = resultSample;
        }
      } catch (error) {
        console.error(`Erro na iteração ${i + 1} para "${rendererName}":`, error);
        this.results.details[templateName].renderResults[rendererName].errors.push({
          iteration: i,
          message: error.message
        });
      }
      
      // Pausa entre iterações
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Calcular estatísticas
    this._calculateRenderStats(templateName, rendererName);
  }

  /**
   * Calcula estatísticas de renderização
   * @param {string} templateName - Nome do template
   * @param {string} rendererName - Nome do renderizador
   * @private
   */
  _calculateRenderStats(templateName, rendererName) {
    const results = this.results.details[templateName].renderResults[rendererName];
    
    // Se não houver tempos registrados, não calcular estatísticas
    if (!results.times || results.times.length === 0) {
      return;
    }
    
    // Calcular estatísticas de tempo
    const times = results.times;
    results.avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
    results.minTime = Math.min(...times);
    results.maxTime = Math.max(...times);
    results.stdDevTime = Math.sqrt(
      times.reduce((sum, time) => sum + Math.pow(time - results.avgTime, 2), 0) / times.length
    );
    
    // Calcular estatísticas de memória
    const heapUsedValues = results.memories.map(m => m.heapUsed);
    results.avgMemory = heapUsedValues.reduce((sum, mem) => sum + mem, 0) / heapUsedValues.length / (1024 * 1024);
    results.peakMemory = Math.max(...heapUsedValues) / (1024 * 1024);
    
    this.log(`Estatísticas para "${rendererName}": Tempo médio: ${results.avgTime.toFixed(2)}ms, Memória média: ${results.avgMemory.toFixed(2)}MB`);
  }

  /**
   * Compara resultados entre diferentes renderizadores
   * @param {string} templateName - Nome do template
   * @private
   */
  _compareRendererResults(templateName) {
    const results = this.results.details[templateName].renderResults;
    const renderers = Object.keys(results);
    
    // Precisa de pelo menos 2 renderizadores para comparar
    if (renderers.length < 2) {
      return;
    }
    
    // Usar o renderizador 'progressive' como base para comparação se disponível
    const baseRenderer = results['progressive'] ? 'progressive' : renderers[0];
    const baseTime = results[baseRenderer].avgTime;
    const baseMemory = results[baseRenderer].avgMemory;
    
    // Comparar cada renderizador com o base
    this.results.details[templateName].comparisons = [];
    
    for (const renderer of renderers) {
      if (renderer === baseRenderer) continue;
      
      // Verificar se há resultados válidos
      if (!results[renderer].avgTime || !results[renderer].avgMemory) {
        continue;
      }
      
      // Calcular diferenças
      const timeDiff = results[renderer].avgTime - baseTime;
      const timePercent = (timeDiff / baseTime) * 100;
      const memoryDiff = results[renderer].avgMemory - baseMemory;
      const memoryPercent = (memoryDiff / baseMemory) * 100;
      
      // Registrar comparação
      this.results.details[templateName].comparisons.push({
        base: baseRenderer,
        renderer,
        timeDiff,
        timePercent,
        memoryDiff,
        memoryPercent
      });
      
      this.log(`Comparação ${renderer} vs ${baseRenderer}: ` +
        `Tempo: ${timePercent > 0 ? '+' : ''}${timePercent.toFixed(2)}%, ` +
        `Memória: ${memoryPercent > 0 ? '+' : ''}${memoryPercent.toFixed(2)}%`);
    }
  }

  /**
   * Gera relatório de resultados
   * @private
   */
  async _generateReport() {
    this.log('Gerando relatório de resultados');
    
    // Calcular estatísticas globais
    this._calculateGlobalStats();
    
    // Gerar arquivo JSON com resultados completos
    const resultPath = path.join(this.benchmarkDir, 'benchmark-results.json');
    await fs.writeFile(resultPath, JSON.stringify(this.results, null, 2));
    
    // Gerar relatório em Markdown
    const markdownPath = path.join(this.benchmarkDir, 'benchmark-report.md');
    const markdown = this._generateMarkdownReport();
    await fs.writeFile(markdownPath, markdown);
    
    this.log(`Relatório salvo em ${this.benchmarkDir}`);
    console.log(`\nBenchmark concluído. Resultados salvos em ${this.benchmarkDir}`);
  }

  /**
   * Calcula estatísticas globais
   * @private
   */
  _calculateGlobalStats() {
    const totalTime = this.results.summary.endTime - this.results.summary.startTime;
    this.results.summary.totalDuration = totalTime;
    
    // Estatísticas por renderizador
    this.results.summary.renderers = {};
    
    // Para cada renderizador, calcular médias globais
    for (const rendererName of this.options.renderersToTest) {
      const rendererResults = {
        templates: 0,
        avgTime: 0,
        avgMemory: 0,
        minTime: Infinity,
        maxTime: 0,
        errors: 0
      };
      
      // Coletar resultados de todos os templates para este renderizador
      let totalTime = 0;
      let totalMemory = 0;
      let validResults = 0;
      
      for (const templateName in this.results.details) {
        const templateResults = this.results.details[templateName].renderResults;
        
        if (templateResults[rendererName] && templateResults[rendererName].avgTime) {
          rendererResults.templates++;
          totalTime += templateResults[rendererName].avgTime;
          totalMemory += templateResults[rendererName].avgMemory;
          validResults++;
          
          // Atualizar mínimo e máximo
          rendererResults.minTime = Math.min(rendererResults.minTime, templateResults[rendererName].avgTime);
          rendererResults.maxTime = Math.max(rendererResults.maxTime, templateResults[rendererName].avgTime);
          
          // Contar erros
          if (templateResults[rendererName].errors && templateResults[rendererName].errors.length > 0) {
            rendererResults.errors += templateResults[rendererName].errors.length;
          }
        }
      }
      
      // Calcular médias
      if (validResults > 0) {
        rendererResults.avgTime = totalTime / validResults;
        rendererResults.avgMemory = totalMemory / validResults;
      }
      
      // Corrigir minTime se nenhum resultado foi processado
      if (rendererResults.minTime === Infinity) {
        rendererResults.minTime = 0;
      }
      
      this.results.summary.renderers[rendererName] = rendererResults;
    }
    
    // Comparar renderizadores globalmente
    this._compareGlobalResults();
  }

  /**
   * Compara resultados globais entre renderizadores
   * @private
   */
  _compareGlobalResults() {
    const renderers = Object.keys(this.results.summary.renderers);
    
    // Precisa de pelo menos 2 renderizadores para comparar
    if (renderers.length < 2) {
      return;
    }
    
    // Usar o renderizador 'progressive' como base para comparação se disponível
    const baseRenderer = renderers.includes('progressive') ? 'progressive' : renderers[0];
    const baseResults = this.results.summary.renderers[baseRenderer];
    
    // Comparar cada renderizador com o base
    this.results.summary.comparisons = [];
    
    for (const renderer of renderers) {
      if (renderer === baseRenderer) continue;
      
      const rendererResults = this.results.summary.renderers[renderer];
      
      // Verificar se há resultados válidos
      if (!rendererResults.avgTime || rendererResults.templates === 0) {
        continue;
      }
      
      // Calcular diferenças
      const timeDiff = rendererResults.avgTime - baseResults.avgTime;
      const timePercent = (timeDiff / baseResults.avgTime) * 100;
      const memoryDiff = rendererResults.avgMemory - baseResults.avgMemory;
      const memoryPercent = (memoryDiff / baseResults.avgMemory) * 100;
      
      // Registrar comparação
      this.results.summary.comparisons.push({
        base: baseRenderer,
        renderer,
        timeDiff,
        timePercent,
        memoryDiff,
        memoryPercent
      });
    }
  }

  /**
   * Gera relatório em formato Markdown
   * @returns {string} Conteúdo do relatório em Markdown
   * @private
   */
  _generateMarkdownReport() {
    const summary = this.results.summary;
    const date = new Date().toISOString().split('T')[0];
    
    let markdown = `# Relatório de Benchmark do Renderizador Progressivo\n\n`;
    markdown += `Data: ${date}\n\n`;
    
    // Resumo geral
    markdown += `## Resumo\n\n`;
    markdown += `- Templates processados: ${summary.templatesProcessed} de ${summary.totalTemplates}\n`;
    markdown += `- Tempo total de execução: ${(summary.totalDuration / 1000).toFixed(2)} segundos\n`;
    markdown += `- Erros encontrados: ${summary.totalErrors}\n\n`;
    
    // Comparação de renderizadores
    markdown += `## Comparação de Renderizadores\n\n`;
    markdown += `| Renderizador | Templates | Tempo Médio (ms) | Memória Média (MB) | Erros |\n`;
    markdown += `|-------------|-----------|------------------|-------------------|-------|\n`;
    
    for (const rendererName in summary.renderers) {
      const renderer = summary.renderers[rendererName];
      markdown += `| ${rendererName} | ${renderer.templates} | ${renderer.avgTime.toFixed(2)} | ${renderer.avgMemory.toFixed(2)} | ${renderer.errors} |\n`;
    }
    
    markdown += `\n`;
    
    // Tabela de comparações
    if (summary.comparisons && summary.comparisons.length > 0) {
      markdown += `### Comparações\n\n`;
      markdown += `| Comparação | Diferença de Tempo | Diferença de Memória |\n`;
      markdown += `|------------|-------------------|---------------------|\n`;
      
      for (const comparison of summary.comparisons) {
        const timeSign = comparison.timePercent >= 0 ? '+' : '';
        const memorySign = comparison.memoryPercent >= 0 ? '+' : '';
        
        markdown += `| ${comparison.renderer} vs ${comparison.base} | ${timeSign}${comparison.timePercent.toFixed(2)}% | ${memorySign}${comparison.memoryPercent.toFixed(2)}% |\n`;
      }
      
      markdown += `\n`;
    }
    
    // Detalhes por template
    markdown += `## Detalhes por Template\n\n`;
    
    for (const templateName in this.results.details) {
      const template = this.results.details[templateName];
      markdown += `### ${templateName}\n\n`;
      markdown += `- Tamanho: ${(template.size / 1024).toFixed(2)} KB\n`;
      
      // Casos extremos
      if (template.analysis && template.analysis.edgeCases) {
        markdown += `- Casos extremos detectados: ${template.analysis.edgeCases.length}\n`;
        
        if (template.analysis.edgeCases.length > 0) {
          markdown += `- Tipos de casos extremos:\n`;
          
          for (const edgeCase of template.analysis.edgeCases) {
            markdown += `  - ${edgeCase.type}: ${edgeCase.count} ocorrências\n`;
          }
        }
      }
      
      markdown += `\n`;
      
      // Resultados por renderizador
      markdown += `#### Resultados de Renderização\n\n`;
      markdown += `| Renderizador | Tempo Médio (ms) | Memória (MB) | Tempo Min/Max (ms) |\n`;
      markdown += `|-------------|------------------|--------------|-------------------|\n`;
      
      for (const rendererName in template.renderResults) {
        const result = template.renderResults[rendererName];
        
        if (result.avgTime) {
          markdown += `| ${rendererName} | ${result.avgTime.toFixed(2)} | ${result.avgMemory.toFixed(2)} | ${result.minTime.toFixed(2)} / ${result.maxTime.toFixed(2)} |\n`;
        } else {
          markdown += `| ${rendererName} | Falha | Falha | Falha |\n`;
        }
      }
      
      markdown += `\n`;
      
      // Otimizações aplicadas (se houver)
      if (template.renderResults['edge-optimized'] && template.renderResults['edge-optimized'].optimization) {
        const opt = template.renderResults['edge-optimized'].optimization;
        markdown += `#### Otimizações\n\n`;
        markdown += `- Tamanho original: ${(opt.originalSize / 1024).toFixed(2)} KB\n`;
        markdown += `- Tamanho otimizado: ${(opt.optimizedSize / 1024).toFixed(2)} KB\n`;
        markdown += `- Redução: ${opt.reductionPercent.toFixed(2)}%\n`;
        markdown += `- Otimizações aplicadas: ${opt.optimizationsApplied}\n\n`;
      }
      
      // Erros (se houver)
      if (template.errors && template.errors.length > 0) {
        markdown += `#### Erros\n\n`;
        
        for (const error of template.errors) {
          markdown += `- ${error.renderer}: ${error.message}\n`;
        }
        
        markdown += `\n`;
      }
      
      markdown += `---\n\n`;
    }
    
    return markdown;
  }
}

/**
 * Função principal
 */
async function main() {
  // Processar argumentos de linha de comando
  const args = process.argv.slice(2);
  const options = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--template':
      case '-t':
        options.templateToTest = args[++i];
        break;
      case '--iterations':
      case '-i':
        options.iterations = parseInt(args[++i], 10);
        break;
      case '--renderers':
      case '-r':
        options.renderersToTest = args[++i].split(',');
        break;
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
      case '--force-regenerate':
      case '-f':
        options.forceRegenerate = true;
        break;
      case '--help':
      case '-h':
        printHelp();
        return;
      default:
        if (arg.startsWith('-')) {
          console.error(`Opção desconhecida: ${arg}`);
          printHelp();
          process.exit(1);
        }
    }
  }
  
  // Executar benchmark
  try {
    const benchmark = new RendererBenchmark(options);
    await benchmark.run();
  } catch (error) {
    console.error('Erro fatal durante benchmark:', error);
    process.exit(1);
  }
}

/**
 * Imprime ajuda
 */
function printHelp() {
  console.log(`
Benchmark para Renderizadores Progressivos

Uso: node renderer-benchmark.js [opções]

Opções:
  -t, --template NOME      Testar apenas um template específico
  -i, --iterations NUM     Número de iterações para cada teste (padrão: 3)
  -r, --renderers LIST     Lista separada por vírgula de renderizadores a testar
  -v, --verbose            Modo detalhado
  -f, --force-regenerate   Forçar nova geração de templates
  -h, --help               Mostrar esta ajuda

Renderizadores disponíveis:
  - progressive            Renderizador progressivo padrão
  - enhanced               Renderizador progressivo otimizado
  - edge-optimized         Renderizador com otimização de casos extremos
  - streaming              Renderizador em modo streaming
`);
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = RendererBenchmark;
